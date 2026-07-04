"""Pydantic v2 schemas for URL request/response validation."""

from pydantic import BaseModel, Field, HttpUrl, field_validator

from app.schemas.health_check import UTCDatetime


class URLCreate(BaseModel):
    """Schema for creating a new monitored URL."""

    url: str = Field(..., min_length=1, max_length=2048, examples=["https://example.com"])

    @field_validator("url")
    @classmethod
    def validate_url_format(cls, v: str) -> str:
        """Ensure the URL is a valid HTTP/HTTPS URL."""
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        # Validate via Pydantic's HttpUrl
        HttpUrl(v)
        return v


class URLUpdate(BaseModel):
    """Schema for updating a monitored URL."""

    url: str = Field(..., min_length=1, max_length=2048, examples=["https://example.com"])

    @field_validator("url")
    @classmethod
    def validate_url_format(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        HttpUrl(v)
        return v


class URLResponse(BaseModel):
    """Schema for returning a URL with its latest status."""

    id: int
    url: str
    created_at: UTCDatetime
    updated_at: UTCDatetime
    current_status: str | None = None
    http_status: int | None = None
    response_time: float | None = None
    last_checked: UTCDatetime | None = None
    health_percentage: float | None = None

    model_config = {"from_attributes": True}
