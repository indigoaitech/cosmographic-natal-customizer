from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.ephemeris.calculator import init_swiss_ephemeris

app = FastAPI(
    title="Cosmographic Ephemeris API",
    description=(
        "Swiss Ephemeris natal-chart microservice for the Cosmographic "
        "personalized t-shirt customizer (www.cosmographic.store)."
    ),
    version="0.1.0",
    contact={
        "name": "Cosmographic Store",
        "email": "cosmographicstore@gmail.com",
        "url": "https://www.cosmographic.store",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def on_startup() -> None:
    init_swiss_ephemeris()
