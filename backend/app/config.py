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
    
    @field_validator("database_url", mode="before")
    @classmethod
    def parse_database_url(cls, v: str) -> str:
        """Convert Railway's postgresql:// URL to asyncpg format if needed."""
        if isinstance(v, str):
            # If it's already asyncpg format, return as-is
            if "postgresql+asyncpg://" in v:
                return v
            # If it's standard postgresql://, convert to asyncpg
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # CORS
    backend_cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app",  # Allow all Vercel preview deployments
        "https://warframe-trade-helper-frontend-*.vercel.app",  # Specific pattern
    ]

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        """Parse CORS origins from JSON string or list."""
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
                return [parsed]
            except json.JSONDecodeError:
                # If it's not valid JSON, treat as single origin
                return [v]
        return v

    class Config:
        """Pydantic config."""

        env_file = ".env"
        case_sensitive = False


settings = Settings()

