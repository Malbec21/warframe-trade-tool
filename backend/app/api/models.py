"""API Pydantic models."""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    time: datetime


class ConfigResponse(BaseModel):
    """Configuration response."""

    platform: str
    strategy: str
    min_profit: float = 0.0
    min_margin: float = 0.0
    refresh_interval: int


class PartPrice(BaseModel):
    """Part price information."""

    name: str
    price: float
    source: str  # e.g., "sell_p35", "sell_median", "buy_max"
    seller: str = "User"  # Seller's in-game name


class OpportunityResponse(BaseModel):
    """Arbitrage opportunity response."""

    frame_id: str
    frame_name: str
    platform: str
    strategy: str
    parts: list[PartPrice]
    full_set_price: float
    profit_plat: float
    profit_margin: float
    last_updated: datetime
    item_type: str = "warframe"  # "warframe" or "weapon"
    seller: str = "User"  # Seller's in-game name for the set


class FrameInfo(BaseModel):
    """Frame/Weapon information."""

    id: str
    name: str
    parts: list[str]
    is_prime: bool = True
    enabled: bool = True
    item_type: str = "warframe"  # "warframe" or "weapon"


class FrameDetailResponse(BaseModel):
    """Frame detail with history."""

    frame: FrameInfo
    current_opportunity: OpportunityResponse | None
    snapshots: list[dict[str, Any]]  # Historical price snapshots for sparklines


class SetConfigMessage(BaseModel):
    """WebSocket set config message."""

    type: str = "set_config"
    strategy: str | None = None
    min_profit: float | None = None
    min_margin: float | None = None
    platform: str | None = None


class MarketUpdateMessage(BaseModel):
    """WebSocket market update message."""

    type: str = "market_update"
    opportunities: list[OpportunityResponse]
    timestamp: datetime


class OpportunityAlertMessage(BaseModel):
    """WebSocket opportunity alert message."""

    type: str = "opportunity_alert"
    opportunity: OpportunityResponse
    timestamp: datetime
    reason: str  # e.g., "crossed_profit_threshold", "crossed_margin_threshold"

