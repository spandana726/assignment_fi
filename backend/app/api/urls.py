"""URL CRUD API routes.

Provides endpoints to create, read, update, and delete monitored URLs.
Includes duplicate detection and proper validation error messages.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.models.health_check import HealthCheck
from app.models.url import URL
from app.schemas.url import URLCreate, URLResponse, URLUpdate
from app.utils.logger import logger

router = APIRouter(tags=["URLs"])


@router.post("/urls", response_model=URLResponse, status_code=status.HTTP_201_CREATED)
async def create_url(payload: URLCreate, db: AsyncSession = Depends(get_db)) -> URLResponse:
    """Register a new URL for monitoring."""
    # Check for duplicates
    existing = await db.execute(select(URL).where(URL.url == payload.url))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"URL '{payload.url}' is already being monitored.",
        )

    url_record = URL(url=payload.url)
    db.add(url_record)
    await db.commit()
    await db.refresh(url_record)

    logger.info("URL registered: %s (id=%d)", url_record.url, url_record.id)
    return _to_response(url_record)


@router.get("/urls", response_model=list[URLResponse])
async def list_urls(db: AsyncSession = Depends(get_db)) -> list[URLResponse]:
    """List all monitored URLs with their latest health status."""
    result = await db.execute(select(URL).order_by(URL.created_at.desc()))
    urls = result.scalars().all()

    responses = []
    for url_record in urls:
        # Get the latest health check
        latest_check = await db.execute(
            select(HealthCheck)
            .where(HealthCheck.url_id == url_record.id)
            .order_by(HealthCheck.timestamp.desc())
            .limit(1)
        )
        latest = latest_check.scalar_one_or_none()

        # Calculate health percentage from last 20 checks
        health_checks = await db.execute(
            select(HealthCheck)
            .where(HealthCheck.url_id == url_record.id)
            .order_by(HealthCheck.timestamp.desc())
            .limit(20)
        )
        checks = health_checks.scalars().all()
        health_pct = None
        if checks:
            up_count = sum(1 for c in checks if c.status == "UP")
            health_pct = round((up_count / len(checks)) * 100, 1)

        responses.append(
            URLResponse(
                id=url_record.id,
                url=url_record.url,
                created_at=url_record.created_at,
                updated_at=url_record.updated_at,
                current_status=latest.status if latest else None,
                http_status=latest.http_status if latest else None,
                response_time=latest.response_time if latest else None,
                last_checked=latest.timestamp if latest else None,
                health_percentage=health_pct,
            )
        )

    return responses


@router.put("/urls/{url_id}", response_model=URLResponse)
async def update_url(
    url_id: int, payload: URLUpdate, db: AsyncSession = Depends(get_db)
) -> URLResponse:
    """Update a monitored URL."""
    result = await db.execute(select(URL).where(URL.id == url_id))
    url_record = result.scalar_one_or_none()
    if not url_record:
        raise HTTPException(status_code=404, detail="URL not found.")

    # Check duplicate (only if URL changed)
    if payload.url != url_record.url:
        existing = await db.execute(select(URL).where(URL.url == payload.url))
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"URL '{payload.url}' is already being monitored.",
            )

    url_record.url = payload.url
    await db.commit()
    await db.refresh(url_record)

    logger.info("URL updated: id=%d → %s", url_id, payload.url)
    return _to_response(url_record)


@router.delete("/urls/{url_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_url(url_id: int, db: AsyncSession = Depends(get_db)) -> None:
    """Delete a monitored URL and all its health check history."""
    result = await db.execute(select(URL).where(URL.id == url_id))
    url_record = result.scalar_one_or_none()
    if not url_record:
        raise HTTPException(status_code=404, detail="URL not found.")

    logger.info("URL deleted: %s (id=%d)", url_record.url, url_record.id)
    await db.delete(url_record)
    await db.commit()


def _to_response(url_record: URL) -> URLResponse:
    """Convert a URL model to a response schema (without health data)."""
    return URLResponse(
        id=url_record.id,
        url=url_record.url,
        created_at=url_record.created_at,
        updated_at=url_record.updated_at,
    )
