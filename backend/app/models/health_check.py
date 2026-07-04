"""HealthCheck model — an individual monitoring result.

Each record captures a single point-in-time check for a URL,
preserving full history. Records are never overwritten.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.url import URL


class HealthCheck(Base):
    """A single health check result for a monitored URL."""

    __tablename__ = "health_checks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    url_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("urls.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(10), nullable=False)  # "UP" or "DOWN"
    http_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_time: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    error_message: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    url_ref: Mapped["URL"] = relationship("URL", back_populates="health_checks")

    def __repr__(self) -> str:
        return f"<HealthCheck id={self.id} url_id={self.url_id} status={self.status}>"
