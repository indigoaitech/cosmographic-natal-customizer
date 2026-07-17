from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class HouseSystem(str, Enum):
    PLACIDUS = "P"
    KOCH = "K"
    REGIOMONTANUS = "R"
    WHOLE_SIGN = "W"
    CAMPANUS = "C"
    EQUAL = "E"
    ALCABITIUS = "B"


class LocationInput(BaseModel):
    city: str = Field(..., min_length=1, max_length=120)
    country: str = Field(..., min_length=1, max_length=120)
    query: Optional[str] = Field(
        default=None,
        description="Optional free-text override, e.g. 'Athens, Greece'",
    )


class NatalChartRequest(BaseModel):
    date_of_birth: str = Field(..., alias="dateOfBirth", pattern=r"^\d{4}-\d{2}-\d{2}$")
    time_of_birth: str = Field(
        ...,
        alias="timeOfBirth",
        pattern=r"^\d{2}:\d{2}(:\d{2})?$",
    )
    location: LocationInput
    house_system: HouseSystem = Field(default=HouseSystem.PLACIDUS, alias="houseSystem")

    model_config = {"populate_by_name": True}


class GeocodeRequest(BaseModel):
    city: Optional[str] = None
    country: Optional[str] = None
    query: Optional[str] = None

    @field_validator("query")
    @classmethod
    def require_some_input(cls, v: Optional[str], info):
        return v


class GeocodeResponse(BaseModel):
    lat: float
    lon: float
    display_name: str = Field(..., alias="displayName")
    country_code: Optional[str] = Field(default=None, alias="countryCode")

    model_config = {"populate_by_name": True}


class TimezoneRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    local_datetime: str = Field(
        ...,
        alias="localDatetime",
        description="ISO-like local civil datetime: YYYY-MM-DDTHH:MM[:SS]",
    )

    model_config = {"populate_by_name": True}


class TimezoneResponse(BaseModel):
    timezone: str
    utc: str
    utc_offset_hours: float = Field(..., alias="utcOffsetHours")
    is_dst: bool = Field(..., alias="isDst")

    model_config = {"populate_by_name": True}


class ChartMeta(BaseModel):
    utc: str
    lat: float
    lon: float
    timezone: str
    utc_offset_hours: float = Field(..., alias="utcOffsetHours")
    julian_day: float = Field(..., alias="julianDay")
    house_system: HouseSystem = Field(..., alias="houseSystem")
    place_label: str = Field(..., alias="placeLabel")

    model_config = {"populate_by_name": True}


class PlanetPosition(BaseModel):
    id: str
    name: str
    lon: float
    lat: float
    speed: float
    sign: str
    sign_degree: float = Field(..., alias="signDegree")
    house: Optional[int] = None
    retrograde: bool

    model_config = {"populate_by_name": True}


class HouseCusp(BaseModel):
    house: int
    cusp: float
    sign: str


class ChartAngles(BaseModel):
    asc: float
    mc: float
    dsc: float
    ic: float


AspectType = Literal["conjunction", "opposition", "trine", "square", "sextile"]


class Aspect(BaseModel):
    a: str
    b: str
    type: AspectType
    angle: float
    orb: float
    applying: bool


InterpretationKind = Literal["planet_sign", "planet_house", "house_sign"]


class InterpretationRow(BaseModel):
    kind: InterpretationKind
    key: str
    label: str
    summary: str


class ChartPayload(BaseModel):
    meta: ChartMeta
    planets: list[PlanetPosition]
    houses: list[HouseCusp]
    angles: ChartAngles
    aspects: list[Aspect]
    interpretations: list[InterpretationRow] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    service: str
    swiss_ephemeris: str = Field(..., alias="swissEphemeris")

    model_config = {"populate_by_name": True}


class ErrorResponse(BaseModel):
    detail: str
    code: str
