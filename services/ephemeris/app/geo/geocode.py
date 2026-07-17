from __future__ import annotations

from functools import lru_cache
from typing import Optional

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.models.schemas import GeocodeResponse


class GeocodeError(Exception):
    pass


class GeocodeCandidate(BaseModel):
    lat: float
    lon: float
    display_name: str = Field(..., alias="displayName")
    country_code: Optional[str] = Field(default=None, alias="countryCode")
    importance: Optional[float] = None

    model_config = {"populate_by_name": True}


class GeocodeSearchResponse(BaseModel):
    primary: GeocodeResponse
    candidates: list[GeocodeCandidate]

    model_config = {"populate_by_name": True}


def _build_query(city: Optional[str], country: Optional[str], query: Optional[str]) -> str:
    if query and query.strip():
        return query.strip()
    parts = [p.strip() for p in (city, country) if p and p.strip()]
    if not parts:
        raise GeocodeError("Provide city/country or a free-text query.")
    return ", ".join(parts)


def _hit_to_candidate(hit: dict, fallback_q: str) -> GeocodeCandidate:
    address = hit.get("address") or {}
    return GeocodeCandidate(
        lat=float(hit["lat"]),
        lon=float(hit["lon"]),
        displayName=hit.get("display_name") or fallback_q,
        countryCode=(address.get("country_code") or "").upper() or None,
        importance=float(hit["importance"]) if hit.get("importance") is not None else None,
    )


@lru_cache(maxsize=256)
def _cached_geocode_search(
    q: str, limit: int = 5
) -> tuple[GeocodeResponse, tuple[GeocodeCandidate, ...]]:
    url = f"{settings.nominatim_base_url.rstrip('/')}/search"
    headers = {
        "User-Agent": settings.nominatim_user_agent,
        "Accept": "application/json",
    }
    params = {
        "q": q,
        "format": "json",
        "limit": max(1, min(limit, 8)),
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

    candidates = tuple(_hit_to_candidate(hit, q) for hit in data)
    primary_hit = data[0]
    address = primary_hit.get("address") or {}
    primary = GeocodeResponse(
        lat=float(primary_hit["lat"]),
        lon=float(primary_hit["lon"]),
        displayName=primary_hit.get("display_name") or q,
        countryCode=(address.get("country_code") or "").upper() or None,
    )
    return primary, candidates


@lru_cache(maxsize=256)
def _cached_geocode(q: str) -> GeocodeResponse:
    primary, _ = _cached_geocode_search(q, 1)
    return primary


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


def geocode_search(
    city: Optional[str] = None,
    country: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = 5,
) -> GeocodeSearchResponse:
    q = _build_query(city, country, query)
    try:
        primary, candidates = _cached_geocode_search(q, limit)
        return GeocodeSearchResponse(primary=primary, candidates=list(candidates))
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


def geocode_search_or_http(
    city: Optional[str] = None,
    country: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = 5,
) -> GeocodeSearchResponse:
    try:
        return geocode_search(city=city, country=country, query=query, limit=limit)
    except GeocodeError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
