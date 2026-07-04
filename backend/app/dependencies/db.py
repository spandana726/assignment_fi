"""Database session dependency for FastAPI route injection."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session and ensure it's closed after use."""
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
