"""URL monitoring service — the core health check engine.

Performs async HTTP pings against registered URLs, measures response
time, classifies UP/DOWN status, and persists every result as an
immutable historical record.
"""

import time
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.db.database import async_session_factory
from app.models.health_check import HealthCheck
from app.models.url import URL
from app.utils.logger import logger

# Reusable async HTTP client — avoids creating new connections per check
_http_client: httpx.AsyncClient | None = None


async def get_http_client() -> httpx.AsyncClient:
    """Return a shared httpx AsyncClient, creating one if needed."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(settings.request_timeout_seconds),
            follow_redirects=True,
            verify=False,  # Accept self-signed certs for monitoring
        )
    return _http_client


async def close_http_client() -> None:
    """Close the shared HTTP client on application shutdown."""
    global _http_client
    if _http_client and not _http_client.is_closed:
        await _http_client.aclose()
        _http_client = None


async def check_single_url(client: httpx.AsyncClient, url: str) -> dict:
    """Ping a single URL and return the health check result.

    Handles all common failure modes gracefully:
    - Timeouts
    - DNS resolution failures
    - SSL/TLS errors
    - Connection refused
    - HTTP 4xx/5xx errors
    - Generic network errors
    """
    start = time.monotonic()
    try:
        response = await client.get(url)
        elapsed = round((time.monotonic() - start) * 1000, 2)  # ms

        status = "UP" if response.status_code < 400 else "DOWN"
        error_msg = None if status == "UP" else f"HTTP {response.status_code}"

        return {
            "status": status,
            "http_status": response.status_code,
            "response_time": elapsed,
            "error_message": error_msg,
        }

    except httpx.TimeoutException:
        elapsed = round((time.monotonic() - start) * 1000, 2)
        return {
            "status": "DOWN",
            "http_status": None,
            "response_time": elapsed,
            "error_message": "Connection timed out",
        }

    except httpx.ConnectError as exc:
        elapsed = round((time.monotonic() - start) * 1000, 2)
        error_detail = str(exc)
        if "Name or service not known" in error_detail or "getaddrinfo" in error_detail:
            msg = "DNS resolution failed"
        elif "Connection refused" in error_detail:
            msg = "Connection refused"
        else:
            msg = f"Connection error: {error_detail[:200]}"
        return {
            "status": "DOWN",
            "http_status": None,
            "response_time": elapsed,
            "error_message": msg,
        }

    except httpx.HTTPStatusError as exc:
        elapsed = round((time.monotonic() - start) * 1000, 2)
        return {
            "status": "DOWN",
            "http_status": exc.response.status_code,
            "response_time": elapsed,
            "error_message": f"HTTP error: {exc.response.status_code}",
        }

    except Exception as exc:
        elapsed = round((time.monotonic() - start) * 1000, 2)
        return {
            "status": "DOWN",
            "http_status": None,
            "response_time": elapsed,
            "error_message": f"Unexpected error: {str(exc)[:200]}",
        }


async def run_health_checks() -> None:
    """Execute health checks for all registered URLs.

    Each URL is checked independently — a failure on one URL
    never prevents monitoring of the remaining URLs.
    """
    logger.info("Scheduler: Starting health check cycle")

    async with async_session_factory() as session:
        result = await session.execute(select(URL))
        urls = result.scalars().all()

        if not urls:
            logger.info("Scheduler: No URLs registered, skipping cycle")
            return

        client = await get_http_client()
        checked = 0

        for url_record in urls:
            try:
                check_result = await check_single_url(client, url_record.url)

                health_check = HealthCheck(
                    url_id=url_record.id,
                    status=check_result["status"],
                    http_status=check_result["http_status"],
                    response_time=check_result["response_time"],
                    timestamp=datetime.now(timezone.utc),
                    error_message=check_result["error_message"],
                )
                session.add(health_check)
                checked += 1

                log_level = "info" if check_result["status"] == "UP" else "warning"
                getattr(logger, log_level)(
                    "Health check: %s → %s (HTTP %s, %.1fms)",
                    url_record.url,
                    check_result["status"],
                    check_result["http_status"] or "N/A",
                    check_result["response_time"] or 0,
                )

            except Exception as exc:
                logger.error(
                    "Failed to check %s: %s", url_record.url, str(exc)[:200]
                )

        await session.commit()
        logger.info("Scheduler: Health check cycle complete — %d/%d URLs checked", checked, len(urls))
