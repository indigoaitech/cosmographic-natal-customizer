from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import swisseph as swe
from fastapi import HTTPException

from app.config import settings
from app.ephemeris.aspects import compute_aspects
from app.ephemeris.constants import CALC_FLAGS, PLANET_CATALOG, SIGNS
from app.geo.geocode import geocode_or_http
from app.geo.timezone import combine_birth_local, resolve_timezone
from app.interpretations.enrich import enrich_chart
from app.models.schemas import (
    ChartAngles,
    ChartMeta,
    ChartPayload,
    HouseCusp,
    NatalChartRequest,
    PlanetPosition,
)

_swe_initialized = False


def init_swiss_ephemeris() -> str:
    """Configure ephemeris path once; return version string."""
    global _swe_initialized
    ephe = settings.ephe_path
    if not ephe:
        # Default to local ./ephe next to the service root
        here = Path(__file__).resolve().parents[2] / "ephe"
        if here.is_dir():
            ephe = str(here)
    if ephe:
        swe.set_ephe_path(ephe)
    elif not _swe_initialized:
        swe.set_ephe_path("")
    _swe_initialized = True
    version = swe.version if hasattr(swe, "version") else "unknown"
    return str(version)


def longitude_to_sign(lon: float) -> tuple[str, float]:
    lon = lon % 360.0
    idx = int(lon // 30.0) % 12
    return SIGNS[idx], lon % 30.0


def house_for_longitude(lon: float, cusps: list[float]) -> Optional[int]:
    """
    Assign planet to house given 12 cusp longitudes (1..12).
    cusps list is 1-indexed style values in order house 1..12.
    """
    if len(cusps) < 12:
        return None
    lon = lon % 360.0
    for i in range(12):
        start = cusps[i] % 360.0
        end = cusps[(i + 1) % 12] % 360.0
        if start <= end:
            if start <= lon < end:
                return i + 1
        else:
            # Wrap across 0°
            if lon >= start or lon < end:
                return i + 1
    return 12


def _julian_day_ut(utc_iso: str) -> float:
    # Expect ...Z or +00:00
    cleaned = utc_iso.replace("Z", "+00:00")
    dt = datetime.fromisoformat(cleaned)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
    hour = (
        dt.hour
        + dt.minute / 60.0
        + dt.second / 3600.0
        + dt.microsecond / 3_600_000_000.0
    )
    return float(swe.julday(dt.year, dt.month, dt.day, hour, swe.GREG_CAL))


def _calc_planet(jd_ut: float, body_id: int) -> tuple[float, float, float]:
    result, retflag = swe.calc_ut(jd_ut, body_id, CALC_FLAGS)
    if retflag < 0:
        raise HTTPException(
            status_code=500,
            detail=f"Swiss Ephemeris calculation failed for body {body_id}",
        )
    lon, lat, _dist, speed_lon, _speed_lat, _speed_dist = result
    return float(lon), float(lat), float(speed_lon)


def compute_natal_chart(req: NatalChartRequest) -> ChartPayload:
    init_swiss_ephemeris()

    place = geocode_or_http(
        city=req.location.city,
        country=req.location.country,
        query=req.location.query,
    )
    local_dt = combine_birth_local(req.date_of_birth, req.time_of_birth)
    tz = resolve_timezone(place.lat, place.lon, local_dt)
    jd_ut = _julian_day_ut(tz.utc)

    hsys = req.house_system.value.encode("ascii")
    # pyswisseph returns 12 cusps (houses 1–12 at indices 0–11) and ascmc[0]=ASC, [1]=MC
    cusps, ascmc = swe.houses(jd_ut, place.lat, place.lon, hsys)
    cusp_list = [float(c) for c in cusps[:12]]
    asc = float(ascmc[0])
    mc = float(ascmc[1])

    houses: list[HouseCusp] = []
    for i, cusp in enumerate(cusp_list, start=1):
        sign, _ = longitude_to_sign(cusp)
        houses.append(HouseCusp(house=i, cusp=round(cusp, 6), sign=sign))

    planets: list[PlanetPosition] = []
    for pid, (body, name) in PLANET_CATALOG.items():
        try:
            lon, lat, speed = _calc_planet(jd_ut, body)
        except HTTPException:
            # Chiron / optional bodies may lack files in minimal installs — skip soft bodies
            if pid in {"chiron"}:
                continue
            raise
        sign, sign_deg = longitude_to_sign(lon)
        planets.append(
            PlanetPosition(
                id=pid,
                name=name,
                lon=round(lon % 360.0, 6),
                lat=round(lat, 6),
                speed=round(speed, 6),
                sign=sign,
                signDegree=round(sign_deg, 6),
                house=house_for_longitude(lon, cusp_list),
                retrograde=speed < 0,
            )
        )

    aspects = compute_aspects(planets)

    meta = ChartMeta(
        utc=tz.utc,
        lat=place.lat,
        lon=place.lon,
        timezone=tz.timezone,
        utcOffsetHours=tz.utc_offset_hours,
        julianDay=round(jd_ut, 8),
        houseSystem=req.house_system,
        placeLabel=place.display_name,
    )

    angles = ChartAngles(
        asc=round(asc % 360.0, 6),
        mc=round(mc % 360.0, 6),
        dsc=round((asc + 180.0) % 360.0, 6),
        ic=round((mc + 180.0) % 360.0, 6),
    )

    return enrich_chart(
        ChartPayload(
            meta=meta,
            planets=planets,
            houses=houses,
            angles=angles,
            aspects=aspects,
        )
    )


def swe_version() -> str:
    return init_swiss_ephemeris()
