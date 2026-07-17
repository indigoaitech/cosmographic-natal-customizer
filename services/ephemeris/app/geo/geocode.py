from __future__ import annotations

from functools import lru_cache
from typing import Optional

import httpx
from fastapi import HTTPException

from app.config import settings
from app.models.schemas import GeocodeResponse


class GeocodeError(Exception):
    pass


def _build_query(city: Optional[str], country: Optional[str], query: Optional[str]) -> str:
    if query and query.strip():
        return query.strip()
    parts = [p.strip() for p in (city, country) if p and p.strip()]
    if not parts:
        raise GeocodeError("Provide city/country or a free-text query.")
    return ", ".join(parts)


@lru_cache(maxsize=256)
def _cached_geocode(q: str) -> GeocodeResponse:
    url = f"{settings.nominatim_base_url.rstrip('/')}/search"
    headers = {
        "User-Agent": settings.nominatim_user_agent,
        "Accept": "application/json",
    }
    params = {
        "q": q,
        "format": "json",
        "limit": 1,
        "addressdetails": 1,
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        raise GeocodeError(f"Geocoding request failed: {exc}") from exc

    if not data:
        raise GeocodeError(f"No results for location: {q}")

    hit = data[0]
    address = hit.get("address") or {}
    return GeocodeResponse(
        lat=float(hit["lat"]),
        lon=float(hit["lon"]),
        displayName=hit.get("display_name") or q,
        countryCode=(address.get("country_code") or "").upper() or None,
    )


def geocode(
    city: Optional[str] = None,
    country: Optional[str] = None,
    query: Optional[str] = None,
) -> GeocodeResponse:
    q = _build_query(city, country, query)
    try:
        return _cached_geocode(q)
    except GeocodeError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise GeocodeError(str(exc)) from exc


def geocode_or_http(
    city: Optional[str] = None,
    country: Optional[str] = None,
    query: Optional[str] = None,
) -> GeocodeResponse:
    try:
        return geocode(city=city, country=country, query=query)
    except GeocodeError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
