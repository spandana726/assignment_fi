"""APScheduler background scheduler for periodic health checks.

Runs the monitoring engine every 60 seconds using an AsyncIOScheduler.
The scheduler is started/stopped with the FastAPI application lifespan.
"""

import asyncio

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config.settings import settings
from app.services.monitor import run_health_checks
from app.utils.logger import logger

scheduler = AsyncIOScheduler()


def start_scheduler() -> None:
    """Start the background scheduler with the health check job."""
    scheduler.add_job(
        run_health_checks,
        trigger=IntervalTrigger(seconds=settings.check_interval_seconds),
        id="health_check_job",
        name="Periodic URL Health Checks",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()
    logger.info(
        "Scheduler started — checking URLs every %ds",
        settings.check_interval_seconds,
    )


def stop_scheduler() -> None:
    """Gracefully shut down the background scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")


async def run_initial_check() -> None:
    """Run an immediate health check on startup after a brief delay."""
    await asyncio.sleep(2)
    logger.info("Running initial health check on startup")
    await run_health_checks()
