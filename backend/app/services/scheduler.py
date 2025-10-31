"""Background task scheduler for market data fetching."""
import asyncio
import logging
from datetime import datetime
from typing import Any

from app.config import settings
from app.db.init_db import get_all_frames
from app.db.models import PriceSnapshot, SetSnapshot
from app.db.session import async_session_maker
from app.services.market_client import get_market_client
from app.services.pricing import calculate_frame_opportunity
from app.services.ws_manager import manager

logger = logging.getLogger(__name__)


class MarketDataScheduler:
    """Background scheduler for fetching and processing market data."""

    def __init__(self) -> None:
        """Initialize scheduler."""
        self.running = False
        self.current_opportunities: list[dict[str, Any]] = []
        self.last_update: datetime | None = None
        self._task: asyncio.Task[None] | None = None

    async def fetch_and_process(self) -> None:
        """Fetch market data and calculate opportunities."""
        try:
            logger.info("Fetching market data...")
            client = await get_market_client()

            # Get all enabled frames
            frames = await get_all_frames()

            if not frames:
                logger.warning("No frames configured")
                return

            # Fetch orders for all frame parts and sets
            market_orders: dict[str, list[dict[str, Any]]] = {}

            for frame in frames:
                frame_id = frame.id if hasattr(frame, "id") else frame["id"]
                parts = frame.parts if hasattr(frame, "parts") else frame["parts"]

                # Fetch part orders
                for part in parts:
                    part_item_name = f"{frame_id}_{part.lower().replace(' ', '_')}"
                    try:
                        data = await client.get_item_orders(part_item_name)
                        orders = data.get("payload", {}).get("orders", [])
                        filtered = client.filter_orders(orders, order_type="sell")
                        logger.debug(f"{part_item_name}: {len(orders)} total, {len(filtered)} filtered")  # Debug
                        market_orders[part_item_name] = filtered
                        # Increased delay to avoid rate limiting with many items
                        await asyncio.sleep(0.5)
                    except Exception as e:
                        logger.error(f"Error fetching orders for {part_item_name}: {e}")

                # Fetch set orders
                set_item_name = f"{frame_id}_set"
                try:
                    data = await client.get_item_orders(set_item_name)
                    orders = data.get("payload", {}).get("orders", [])
                    # For sets, we're SELLING, so only look at sell orders (market prices)
                    sell_orders = client.filter_orders(orders, order_type="sell")
                    market_orders[set_item_name] = sell_orders
                    # Increased delay to avoid rate limiting
                    await asyncio.sleep(0.5)
                except Exception as e:
                    logger.error(f"Error fetching orders for {set_item_name}: {e}")

            # Calculate opportunities for each frame
            logger.info(f"Market orders collected: {list(market_orders.keys())[:10]}")  # Debug
            logger.info(f"Total market orders: {len(market_orders)}")  # Debug
            opportunities = []

            for frame in frames:
                frame_id = frame.id if hasattr(frame, "id") else frame["id"]
                frame_name = frame.name if hasattr(frame, "name") else frame["name"]
                parts = frame.parts if hasattr(frame, "parts") else frame["parts"]
                item_type = frame.item_type if hasattr(frame, "item_type") else frame.get("item_type", "warframe")

                try:
                    opportunity = await calculate_frame_opportunity(
                        frame_id=frame_id,
                        frame_name=frame_name,
                        parts=parts,
                        market_orders=market_orders,
                        strategy=settings.strategy,
                        platform=settings.platform,
                        item_type=item_type,
                    )

                    if opportunity:
                        opportunity["last_updated"] = datetime.utcnow().isoformat()
                        opportunities.append(opportunity)

                except Exception as e:
                    logger.error(f"Error calculating opportunity for {frame_id}: {e}")

            # Store snapshots in database if enabled
            if settings.use_db:
                try:
                    await self._store_snapshots(opportunities)
                except Exception as e:
                    logger.error(f"Error storing snapshots: {e}")

            # Update current opportunities
            self.current_opportunities = opportunities
            self.last_update = datetime.utcnow()

            # Broadcast to WebSocket clients
            await manager.broadcast_market_update(opportunities)

            # Check for threshold alerts
            await self._check_alerts(opportunities)

            logger.info(f"Processed {len(opportunities)} opportunities")

        except Exception as e:
            logger.error(f"Error in fetch_and_process: {e}", exc_info=True)

    async def _store_snapshots(self, opportunities: list[dict[str, Any]]) -> None:
        """Store price snapshots to database."""
        async with async_session_maker() as session:
            for opp in opportunities:
                # Store part snapshots
                for part in opp["parts"]:
                    snapshot = PriceSnapshot(
                        frame_id=opp["frame_id"],
                        part_name=part["name"],
                        strategy=opp["strategy"],
                        metric_type=part["source"],
                        price=part["price"],
                        platform=opp["platform"],
                        ts=datetime.utcnow(),
                    )
                    session.add(snapshot)

                # Store set snapshot
                set_snapshot = SetSnapshot(
                    frame_id=opp["frame_id"],
                    strategy=opp["strategy"],
                    set_price=opp["full_set_price"],
                    platform=opp["platform"],
                    ts=datetime.utcnow(),
                )
                session.add(set_snapshot)

            await session.commit()

    async def _check_alerts(self, opportunities: list[dict[str, Any]]) -> None:
        """Check opportunities against thresholds and send alerts."""
        # This is a simplified version - in production, you'd track previous
        # states and only alert on threshold crossings
        for opp in opportunities:
            if opp["profit_plat"] >= 50:  # Example threshold
                await manager.broadcast_opportunity_alert(
                    opp, "crossed_profit_threshold"
                )

    async def _run_loop(self) -> None:
        """Main scheduler loop."""
        logger.info(
            f"Market data scheduler started (interval: {settings.refresh_interval_seconds}s)"
        )

        while self.running:
            try:
                await self.fetch_and_process()
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}", exc_info=True)

            # Wait for next interval
            await asyncio.sleep(settings.refresh_interval_seconds)

    async def start(self) -> None:
        """Start the scheduler."""
        if not self.running:
            self.running = True
            self._task = asyncio.create_task(self._run_loop())
            logger.info("Scheduler started")

    async def stop(self) -> None:
        """Stop the scheduler."""
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Scheduler stopped")

    def get_current_opportunities(
        self, min_profit: float = 0.0, min_margin: float = 0.0
    ) -> list[dict[str, Any]]:
        """Get current opportunities filtered by thresholds."""
        return [
            opp
            for opp in self.current_opportunities
            if opp["profit_plat"] >= min_profit and opp["profit_margin"] >= min_margin
        ]


# Global scheduler instance
scheduler = MarketDataScheduler()

