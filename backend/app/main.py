"""Main FastAPI application."""
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.db.init_db import init_db
from app.services.market_client import cleanup_market_client
from app.services.scheduler import scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler."""
    # Startup
    logger.info("Starting Warframe Trade Helper API...")

    # Initialize database
    if settings.use_db:
        try:
            await init_db()
            logger.info("Database initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            logger.warning("Continuing without database...")
    else:
        logger.info("Running in memory-only mode (USE_DB=false)")

    # Start background scheduler
    await scheduler.start()

    # Run initial data fetch in background (non-blocking)
    logger.info("Starting initial market data fetch in background...")
    asyncio.create_task(scheduler.fetch_and_process())

    logger.info("Application startup complete")

    yield

    # Shutdown
    logger.info("Shutting down...")
    await scheduler.stop()
    await cleanup_market_client()
    logger.info("Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Warframe Trade Helper API",
    description="API for analyzing Warframe arbitrage opportunities",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1")


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {
        "message": "Warframe Trade Helper API",
        "docs": "/docs",
        "health": "/api/v1/healthz",
    }

