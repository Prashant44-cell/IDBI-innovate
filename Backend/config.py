"""
config.py — Application configuration using Pydantic Settings.

Reads environment variables from a .env file and provides a singleton
``settings`` object consumed across the entire application.
"""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All application settings, sourced from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------
    # Application
    # ------------------------------------------------------------------
    app_env: str = "development"
    log_level: str = "INFO"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    database_url: str = (
        "postgresql+psycopg2://postgres:password@localhost:5432/idbi_innovate"
    )

    # ------------------------------------------------------------------
    # JWT / Security
    # ------------------------------------------------------------------
    secret_key: str = "insecure-dev-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    # ------------------------------------------------------------------
    # Power BI
    # ------------------------------------------------------------------
    powerbi_client_id: str = ""
    powerbi_client_secret: str = ""
    powerbi_tenant_id: str = ""
    powerbi_workspace_id: str = ""
    powerbi_report_id: str = ""
    powerbi_dataset_id: str = ""

    # ------------------------------------------------------------------
    # CORS
    # ------------------------------------------------------------------
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        """Return CORS origins as a parsed list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    # ------------------------------------------------------------------
    # Derived helpers
    # ------------------------------------------------------------------
    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def powerbi_authority(self) -> str:
        return f"https://login.microsoftonline.com/{self.powerbi_tenant_id}"

    @property
    def powerbi_scope(self) -> List[str]:
        return ["https://analysis.windows.net/powerbi/api/.default"]

    @property
    def powerbi_embed_base_url(self) -> str:
        return "https://app.powerbi.com/reportEmbed"

    @property
    def powerbi_api_base(self) -> str:
        return "https://api.powerbi.com/v1.0/myorg"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings (singleton)."""
    return Settings()


# Convenience singleton
settings: Settings = get_settings()
