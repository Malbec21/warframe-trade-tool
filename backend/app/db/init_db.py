"""Database initialization."""
import asyncio
import logging

from sqlalchemy import select

from app.config import settings
from app.db.base import Base
from app.db.models import Frame, User, TradeSession, TradePart, PriceHistory, PriceSnapshot, SetSnapshot
from app.db.session import async_session_maker, engine

logger = logging.getLogger(__name__)

# Default Warframes to track - curated list of most popular/liquid items
# Limited to ~20 items to respect warframe.market API rate limits
DEFAULT_FRAMES = [
    # Warframes - Most popular and actively traded
    {
        "id": "mesa_prime",
        "name": "Mesa Prime",
        "parts": ["Blueprint", "Neuroptics", "Chassis", "Systems"],
        "is_prime": True,
        "item_type": "warframe",
    },
    {
        "id": "volt_prime",
        "name": "Volt Prime",
        "parts": ["Blueprint", "Neuroptics", "Chassis", "Systems"],
        "is_prime": True,
        "item_type": "warframe",
    },
    {
        "id": "rhino_prime",
        "name": "Rhino Prime",
        "parts": ["Blueprint", "Neuroptics", "Chassis", "Systems"],
        "is_prime": True,
        "item_type": "warframe",
    },
    {
        "id": "vauban_prime",
        "name": "Vauban Prime",
        "parts": ["Blueprint", "Neuroptics", "Chassis", "Systems"],
        "is_prime": True,
        "item_type": "warframe",
    },
    {
        "id": "nova_prime",
        "name": "Nova Prime",
        "parts": ["Blueprint", "Neuroptics", "Chassis", "Systems"],
        "is_prime": True,
        "item_type": "warframe",
    },
    {
        "id": "nekros_prime",
        "name": "Nekros Prime",
        "parts": ["Blueprint", "Neuroptics", "Chassis", "Systems"],
        "is_prime": True,
        "item_type": "warframe",
    },
    {
        "id": "wukong_prime",
        "name": "Wukong Prime",
        "parts": ["Blueprint", "Neuroptics", "Chassis", "Systems"],
        "is_prime": True,
        "item_type": "warframe",
    },
    {
        "id": "ash_prime",
        "name": "Ash Prime",
        "parts": ["Blueprint", "Neuroptics", "Chassis", "Systems"],
        "is_prime": True,
        "item_type": "warframe",
    },
    {
        "id": "trinity_prime",
        "name": "Trinity Prime",
        "parts": ["Blueprint", "Neuroptics", "Chassis", "Systems"],
        "is_prime": True,
        "item_type": "warframe",
    },
    {
        "id": "loki_prime",
        "name": "Loki Prime",
        "parts": ["Blueprint", "Neuroptics", "Chassis", "Systems"],
        "is_prime": True,
        "item_type": "warframe",
    },
]


async def init_db() -> None:
    """Initialize database tables and seed data."""
    if not settings.use_db:
        logger.info("Database disabled, skipping initialization")
        return

    try:
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created")

        # Seed default frames
        async with async_session_maker() as session:
            # Check if frames already exist
            result = await session.execute(select(Frame))
            existing_frames = result.scalars().all()

            if not existing_frames:
                logger.info("Seeding default frames")
                for frame_data in DEFAULT_FRAMES:
                    frame = Frame(**frame_data)
                    session.add(frame)
                await session.commit()
                logger.info(f"Seeded {len(DEFAULT_FRAMES)} frames")
            else:
                logger.info(f"Database already has {len(existing_frames)} frames")

    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


async def get_all_frames() -> list[Frame]:
    """Get all enabled frames from database or default list."""
    if not settings.use_db:
        # Return in-memory frames with defaults
        return [
            Frame(**{**frame_data, "enabled": True, "item_type": frame_data.get("item_type", "warframe")})
            for frame_data in DEFAULT_FRAMES
        ]

    async with async_session_maker() as session:
        result = await session.execute(select(Frame).where(Frame.enabled == True))  # noqa: E712
        return list(result.scalars().all())


if __name__ == "__main__":
    asyncio.run(init_db())

