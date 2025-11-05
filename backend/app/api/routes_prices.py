"""Price history API routes."""
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.models import PriceHistoryResponse, PriceHistorySummary
from app.db.models import PriceHistory
from app.db.init_db import get_all_frames
from app.services.market_client import get_market_client

router = APIRouter(prefix="/prices", tags=["price_history"])


async def _calculate_stats_from_orders(
    orders: list[dict[str, Any]], current_price: float
) -> tuple[float, float, float]:
    """Calculate min, max, average from current market orders."""
    if not orders:
        return current_price, current_price, current_price
    
    prices = [float(order.get("platinum", 0)) for order in orders if order.get("platinum", 0) > 0]
    if not prices:
        return current_price, current_price, current_price
    
    return min(prices), max(prices), sum(prices) / len(prices)


@router.get("/history/{item_id}", response_model=list[PriceHistorySummary])
async def get_price_history(
    item_id: str,
    platform: str = Query("pc", description="Platform (pc, ps4, xbox, switch)"),
    hours: int = Query(48, description="Hours of history to retrieve", ge=1, le=168),
    db: AsyncSession = Depends(get_db),
) -> list[PriceHistorySummary]:
    """
    Get price history for all parts of an item for the last N hours.
    Falls back to current market orders if insufficient historical data.
    
    Args:
        item_id: Item ID (e.g., "vauban_prime")
        platform: Platform filter
        hours: Hours of history to retrieve (default 48)
        db: Database session
        
    Returns:
        List of price history summaries for each part
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Get all price history for this item
    result = await db.execute(
        select(PriceHistory)
        .where(
            PriceHistory.item_id == item_id,
            PriceHistory.platform == platform,
            PriceHistory.timestamp >= cutoff_time,
        )
        .order_by(PriceHistory.timestamp.desc())
    )
    all_prices = result.scalars().all()
    
    # Group by part name
    parts_dict: dict[str, list[PriceHistory]] = {}
    for price in all_prices:
        if price.part_name not in parts_dict:
            parts_dict[price.part_name] = []
        parts_dict[price.part_name].append(price)
    
    # If we have sufficient historical data, use it
    if all_prices and len(all_prices) >= 10:  # At least 10 data points
        summaries = []
        for part_name, prices in parts_dict.items():
            if not prices:
                continue
            
            # Sort by timestamp (newest first)
            prices.sort(key=lambda p: p.timestamp, reverse=True)
            
            current_price = float(prices[0].price)
            price_values = [float(p.price) for p in prices]
            
            lowest_48h = min(price_values)
            highest_48h = max(price_values)
            average_48h = sum(price_values) / len(price_values)
            
            # Determine price trend (compare first 25% to last 25%)
            if len(prices) >= 4:
                recent_avg = sum(price_values[: len(prices) // 4]) / (len(prices) // 4)
                old_avg = sum(price_values[-len(prices) // 4 :]) / (len(prices) // 4)
                
                if recent_avg > old_avg * 1.05:
                    price_trend = "up"
                elif recent_avg < old_avg * 0.95:
                    price_trend = "down"
                else:
                    price_trend = "stable"
            else:
                price_trend = "stable"
            
            # Convert to response models
            history_response = [
                PriceHistoryResponse(
                    item_id=p.item_id,
                    part_name=p.part_name,
                    price=float(p.price),
                    seller=p.seller,
                    platform=p.platform,
                    timestamp=p.timestamp,
                )
                for p in prices
            ]
            
            summaries.append(
                PriceHistorySummary(
                    part_name=part_name,
                    current_price=current_price,
                    lowest_48h=lowest_48h,
                    highest_48h=highest_48h,
                    average_48h=round(average_48h, 2),
                    price_trend=price_trend,
                    history=history_response,
                )
            )
        
        return summaries
    
    # Fallback: Calculate from current market orders
    # This allows the feature to work immediately without waiting for historical data
    client = await get_market_client()
    # Temporarily set platform for this request
    original_platform = client.platform
    client.platform = platform
    summaries = []
    
    # Get frame details to know which parts to fetch
    frames = await get_all_frames()
    frame = next((f for f in frames if (hasattr(f, "id") and f.id == item_id) or (isinstance(f, dict) and f.get("id") == item_id)), None)
    
    if not frame:
        return summaries
    
    parts = frame.parts if hasattr(frame, "parts") else frame.get("parts", [])
    
    # Fetch current orders for each part and calculate stats
    for part_name in parts + ["Full Set"]:
        part_item_name = f"{item_id}_{part_name.lower().replace(' ', '_')}" if part_name != "Full Set" else f"{item_id}_set"
        
        try:
            data = await client.get_item_orders(part_item_name)
            orders = data.get("payload", {}).get("orders", [])
            filtered_orders = client.filter_orders(orders, order_type="sell")
            
            if not filtered_orders:
                continue
            
            # Find current lowest price (matching what we show in opportunities)
            prices = [float(o.get("platinum", 0)) for o in filtered_orders if o.get("platinum", 0) > 0]
            if not prices:
                continue
            
            current_price = min(prices)  # Lowest current price
            lowest_48h, highest_48h, average_48h = _calculate_stats_from_orders(filtered_orders, current_price)
            
            # Get seller for current price
            current_order = min(filtered_orders, key=lambda o: float(o.get("platinum", float("inf"))))
            seller = current_order.get("user", {}).get("ingame_name", "User")
            
            summaries.append(
                PriceHistorySummary(
                    part_name=part_name,
                    current_price=current_price,
                    lowest_48h=lowest_48h,
                    highest_48h=highest_48h,
                    average_48h=round(average_48h, 2),
                    price_trend="stable",  # Can't determine trend from current orders only
                    history=[
                        PriceHistoryResponse(
                            item_id=item_id,
                            part_name=part_name,
                            price=current_price,
                            seller=seller,
                            platform=platform,
                            timestamp=datetime.utcnow(),
                        )
                    ],
                )
            )
        except Exception as e:
            # Skip parts that fail to fetch
            continue
    
    # Restore original platform
    client.platform = original_platform
    return summaries


@router.get("/lowest/{item_id}", response_model=dict[str, float])
async def get_lowest_prices(
    item_id: str,
    platform: str = Query("pc", description="Platform (pc, ps4, xbox, switch)"),
    hours: int = Query(48, description="Hours to look back", ge=1, le=168),
    db: AsyncSession = Depends(get_db),
) -> dict[str, float]:
    """
    Get the lowest price for each part of an item in the last N hours.
    
    Args:
        item_id: Item ID
        platform: Platform filter
        hours: Hours to look back
        db: Database session
        
    Returns:
        Dictionary mapping part names to their lowest prices
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Query for minimum price per part
    result = await db.execute(
        select(PriceHistory.part_name, func.min(PriceHistory.price).label("min_price"))
        .where(
            PriceHistory.item_id == item_id,
            PriceHistory.platform == platform,
            PriceHistory.timestamp >= cutoff_time,
        )
        .group_by(PriceHistory.part_name)
    )
    
    lowest_prices = {row.part_name: float(row.min_price) for row in result}
    return lowest_prices

