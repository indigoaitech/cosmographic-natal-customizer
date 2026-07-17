from __future__ import annotations

from datetime import datetime
from functools import lru_cache
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import HTTPException
from timezonefinder import TimezoneFinder

from app.models.schemas import TimezoneResponse

_tf = TimezoneFinder()


@lru_cache(maxsize=512)
def timezone_at(lat: float, lon: float) -> str:
    # timezonefinder expects (lng, lat)
    name = _tf.timezone_at(lng=lon, lat=lat)
    if not name:
        # Oceanic / edge fallback: nearest zone if available
        name = _tf.closest_timezone_at(lng=lon, lat=lat)
    if not name:
        raise HTTPException(
            status_code=422,
            detail=f"Could not resolve timezone for coordinates ({lat}, {lon})",
        )
    return name


def parse_local_datetime(value: str) -> datetime:
    """Parse YYYY-MM-DDTHH:MM[:SS] or space-separated equivalent."""
    cleaned = value.strip().replace(" ", "T")
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M"):
        try:
            return datetime.strptime(cleaned, fmt)
        except ValueError:
            continue
    raise HTTPException(
        status_code=422,
        detail="localDatetime must be YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS",
    )


def resolve_timezone(lat: float, lon: float, local_datetime: str) -> TimezoneResponse:
    tz_name = timezone_at(lat, lon)
    try:
        tz = ZoneInfo(tz_name)
    except ZoneInfoNotFoundError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown IANA timezone: {tz_name}",
        ) from exc

    naive = parse_local_datetime(local_datetime)
    aware = naive.replace(tzinfo=tz)
    utc_dt = aware.astimezone(ZoneInfo("UTC"))
    offset = aware.utcoffset()
    if offset is None:
        raise HTTPException(status_code=500, detail="Failed to compute UTC offset")

    offset_hours = offset.total_seconds() / 3600.0
    # DST heuristic: compare against standard offset mid-winter if needed;
    # zoneinfo fold/dst flag is sufficient for most cases.
    is_dst = bool(aware.dst())

    return TimezoneResponse(
        timezone=tz_name,
        utc=utc_dt.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        utcOffsetHours=round(offset_hours, 4),
        isDst=is_dst,
    )


def combine_birth_local(date_of_birth: str, time_of_birth: str) -> str:
    time_part = time_of_birth if time_of_birth.count(":") == 2 else f"{time_of_birth}:00"
    return f"{date_of_birth}T{time_part}"
