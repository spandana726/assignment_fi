"""Application settings managed via Pydantic Settings.

Loads configuration from environment variables with sensible defaults
for local development and Docker deployment.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration for the Uptime Monitor backend."""

    app_name: str = "Uptime Monitor"
    app_version: str = "1.0.0"
    debug: bool = False

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/uptime.db"

    # Monitoring
    check_interval_seconds: int = 60
    request_timeout_seconds: int = 10

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
