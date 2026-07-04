"""Pydantic v2 schemas for health check and dashboard responses."""

from datetime import datetime, timezone
from typing import Annotated

from pydantic import BaseModel, PlainSerializer


def _serialize_utc(dt: datetime) -> str:
    """Ensure datetimes are serialized as UTC with Z suffix."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


UTCDatetime = Annotated[datetime, PlainSerializer(_serialize_utc, return_type=str)]


class HealthCheckResponse(BaseModel):
    """Schema for a single health check record."""

    id: int
    url_id: int
    status: str
    http_status: int | None = None
    response_time: float | None = None
    timestamp: UTCDatetime
    error_message: str | None = None

    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    """Aggregated dashboard metrics."""

    total_urls: int = 0
    healthy_urls: int = 0
    failed_urls: int = 0
    avg_response_time: float | None = None
    total_health_checks: int = 0
    last_scan_time: UTCDatetime | None = None


class HealthCheckWithURL(BaseModel):
    """Health check record with the associated URL string."""

    id: int
    url_id: int
    url: str
    status: str
    http_status: int | None = None
    response_time: float | None = None
    timestamp: UTCDatetime
    error_message: str | None = None

    model_config = {"from_attributes": True}
