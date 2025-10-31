"""Application configuration."""
import json
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # API
    wm_base_url: str = "https://api.warframe.market/v1"
    platform: str = "pc"
    strategy: str = "balanced"
    refresh_interval_seconds: int = 45
    platform_fee_pct: float = 0.0

    # Database
    use_db: bool = True
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/wth"

    # CORS
    backend_cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        """Parse CORS origins from JSON string or list."""
        if isinstance(v, str):
            return json.loads(v)
        return v

    class Config:
        """Pydantic config."""

        env_file = ".env"
        case_sensitive = False


settings = Settings()

