"""Price history API routes."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.models import PriceHistoryResponse, PriceHistorySummary
from app.db.models import PriceHistory

router = APIRouter(prefix="/prices", tags=["price_history"])


@router.get("/history/{item_id}", response_model=list[PriceHistorySummary])
async def get_price_history(
    item_id: str,
    platform: str = Query("pc", description="Platform (pc, ps4, xbox, switch)"),
    hours: int = Query(48, description="Hours of history to retrieve", ge=1, le=168),
    db: AsyncSession = Depends(get_db),
) -> list[PriceHistorySummary]:
    """
    Get price history for all parts of an item for the last N hours.
    
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
    
    # Calculate summary for each part
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

