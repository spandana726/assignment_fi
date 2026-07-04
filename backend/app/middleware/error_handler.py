"""Global error handling middleware.

Catches unhandled exceptions and returns clean JSON error responses.
Stack traces are never exposed to the client.
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from app.utils.logger import logger


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle any uncaught exception with a safe error response."""
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url.path, str(exc)[:300])
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )
