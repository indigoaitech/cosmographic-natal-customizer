from __future__ import annotations

from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8000
    ephe_path: Optional[str] = None
    nominatim_user_agent: str = (
        "CosmographicNatalCustomizer/0.1 (cosmographicstore@gmail.com)"
    )
    nominatim_base_url: str = "https://nominatim.openstreetmap.org"
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
