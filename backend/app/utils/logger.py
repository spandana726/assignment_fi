"""Structured logging configuration.

Provides a clean, consistent logging format across the application
with timestamp, level, and module context.
"""

import logging
import sys


def setup_logging() -> logging.Logger:
    """Configure and return the application logger."""
    logger = logging.getLogger("uptime_monitor")
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


logger = setup_logging()
