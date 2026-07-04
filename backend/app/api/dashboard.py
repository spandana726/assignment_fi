"""Dashboard and health check API routes.

Provides aggregated metrics, statistics, and historical health check data.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.models.health_check import HealthCheck
from app.models.url import URL
from app.schemas.health_check import DashboardStats, HealthCheckResponse, HealthCheckWithURL

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(db: AsyncSession = Depends(get_db)) -> DashboardStats:
    """Return aggregated dashboard metrics."""
    # Total URLs
    total_result = await db.execute(select(func.count(URL.id)))
    total_urls = total_result.scalar() or 0

    # Total health checks
    checks_result = await db.execute(select(func.count(HealthCheck.id)))
    total_checks = checks_result.scalar() or 0

    # Last scan time
    last_scan_result = await db.execute(
        select(HealthCheck.timestamp).order_by(HealthCheck.timestamp.desc()).limit(1)
    )
    last_scan = last_scan_result.scalar_one_or_none()

    # Per-URL latest status for healthy/failed counts
    healthy = 0
    failed = 0
    response_times: list[float] = []

    urls_result = await db.execute(select(URL))
    urls = urls_result.scalars().all()

    for url_record in urls:
        latest_result = await db.execute(
            select(HealthCheck)
            .where(HealthCheck.url_id == url_record.id)
            .order_by(HealthCheck.timestamp.desc())
            .limit(1)
        )
        latest = latest_result.scalar_one_or_none()
        if latest:
            if latest.status == "UP":
                healthy += 1
            else:
                failed += 1
            if latest.response_time is not None:
                response_times.append(latest.response_time)

    avg_rt = round(sum(response_times) / len(response_times), 2) if response_times else None

    return DashboardStats(
        total_urls=total_urls,
        healthy_urls=healthy,
        failed_urls=failed,
        avg_response_time=avg_rt,
        total_health_checks=total_checks,
        last_scan_time=last_scan,
    )


@router.get("/stats", response_model=DashboardStats)
async def get_stats(db: AsyncSession = Depends(get_db)) -> DashboardStats:
    """Alias for /dashboard — returns the same aggregated metrics."""
    return await get_dashboard(db)


@router.get("/history/{url_id}", response_model=list[HealthCheckResponse])
async def get_history(
    url_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[HealthCheckResponse]:
    """Return the monitoring history for a specific URL."""
    # Verify URL exists
    url_result = await db.execute(select(URL).where(URL.id == url_id))
    if not url_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="URL not found.")

    result = await db.execute(
        select(HealthCheck)
        .where(HealthCheck.url_id == url_id)
        .order_by(HealthCheck.timestamp.desc())
        .limit(limit)
    )
    checks = result.scalars().all()
    return [HealthCheckResponse.model_validate(c) for c in checks]


@router.get("/healthchecks", response_model=list[HealthCheckWithURL])
async def get_all_health_checks(
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> list[HealthCheckWithURL]:
    """Return all recent health checks across all URLs."""
    result = await db.execute(
        select(HealthCheck, URL.url)
        .join(URL, HealthCheck.url_id == URL.id)
        .order_by(HealthCheck.timestamp.desc())
        .limit(limit)
    )
    rows = result.all()

    return [
        HealthCheckWithURL(
            id=check.id,
            url_id=check.url_id,
            url=url_str,
            status=check.status,
            http_status=check.http_status,
            response_time=check.response_time,
            timestamp=check.timestamp,
            error_message=check.error_message,
        )
        for check, url_str in rows
    ]
