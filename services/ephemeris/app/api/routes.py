from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.ephemeris.calculator import compute_natal_chart, swe_version
from app.geo.geocode import (
    GeocodeSearchResponse,
    geocode_or_http,
    geocode_search_or_http,
)
from app.geo.timezone import resolve_timezone
from app.models.schemas import (
    ChartPayload,
    GeocodeRequest,
    GeocodeResponse,
    HealthResponse,
    NatalChartRequest,
    TimezoneRequest,
    TimezoneResponse,
)

router = APIRouter(prefix="/v1")


@router.get("/health", response_model=HealthResponse, response_model_by_alias=True)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="cosmographic-ephemeris",
        swissEphemeris=swe_version(),
    )


@router.post("/geocode", response_model=GeocodeResponse, response_model_by_alias=True)
def geocode_endpoint(body: GeocodeRequest) -> GeocodeResponse:
    if not body.query and not (body.city and body.country):
        raise HTTPException(
            status_code=422,
            detail="Provide query, or both city and country.",
        )
    return geocode_or_http(city=body.city, country=body.country, query=body.query)


@router.post(
    "/geocode/search",
    response_model=GeocodeSearchResponse,
    response_model_by_alias=True,
)
def geocode_search_endpoint(body: GeocodeRequest) -> GeocodeSearchResponse:
    """Return multiple candidates so the UI can disambiguate birthplaces."""
    if not body.query and not (body.city and body.country):
        raise HTTPException(
            status_code=422,
            detail="Provide query, or both city and country.",
        )
    return geocode_search_or_http(
        city=body.city, country=body.country, query=body.query, limit=5
    )


@router.post("/timezone", response_model=TimezoneResponse, response_model_by_alias=True)
def timezone_endpoint(body: TimezoneRequest) -> TimezoneResponse:
    return resolve_timezone(body.lat, body.lon, body.local_datetime)


@router.post(
    "/natal-chart",
    response_model=ChartPayload,
    response_model_by_alias=True,
)
def natal_chart(body: NatalChartRequest) -> ChartPayload:
    return compute_natal_chart(body)
