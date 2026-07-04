"""FastAPI application entrypoint.

Configures the application with CORS, error handling, routers,
database lifecycle, and the background scheduler.
"""

import asyncio
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dashboard import router as dashboard_router
from app.api.urls import router as urls_router
from app.config.settings import settings
from app.db.database import init_db, close_db
from app.middleware.error_handler import global_exception_handler
from app.scheduler.scheduler import start_scheduler, stop_scheduler, run_initial_check
from app.services.monitor import close_http_client
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application startup and shutdown lifecycle."""
    logger.info("Starting %s v%s", settings.app_name, settings.app_version)

    # Initialize database tables
    await init_db()
    logger.info("Database initialized")

    # Start background scheduler
    start_scheduler()

    # Run initial health check after a brief delay (non-blocking)
    asyncio.create_task(run_initial_check())

    yield

    # Shutdown
    logger.info("Shutting down %s", settings.app_name)
    stop_scheduler()
    await close_http_client()
    await close_db()
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="A lightweight uptime monitoring application that periodically pings registered URLs and tracks their health status.",
    lifespan=lifespan,
)

# CORS — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
app.add_exception_handler(Exception, global_exception_handler)

# Mount routers
app.include_router(urls_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")


@app.get("/api/health", tags=["System"])
async def health_check() -> dict:
    """Simple liveness probe for the API."""
    return {"status": "ok", "service": settings.app_name, "version": settings.app_version}
