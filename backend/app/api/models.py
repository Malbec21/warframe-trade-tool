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


# ============================================================================
# Authentication Models
# ============================================================================


class UserCreate(BaseModel):
    """User registration request."""

    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=72)  # Bcrypt limitation


class UserLogin(BaseModel):
    """User login request."""

    username: str
    password: str


class UserResponse(BaseModel):
    """User information response."""

    id: int
    username: str
    email: str
    created_at: datetime
    is_active: bool


class TokenResponse(BaseModel):
    """Authentication token response."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============================================================================
# Trade Session Models
# ============================================================================


class TradePartCreate(BaseModel):
    """Request to add a part to a trade session."""

    part_name: str
    purchase_price: float
    purchase_date: datetime | None = None
    notes: str | None = None


class TradePartResponse(BaseModel):
    """Trade part information."""

    id: int
    part_name: str
    purchase_price: float
    purchase_date: datetime
    notes: str | None


class TradeSessionCreate(BaseModel):
    """Request to create a new trade session."""

    item_id: str
    item_name: str
    item_type: str = "warframe"


class TradeSessionUpdate(BaseModel):
    """Request to update a trade session."""

    set_sell_price: float | None = None
    status: str | None = None  # "in_progress" or "completed"


class TradeSessionResponse(BaseModel):
    """Trade session information."""

    id: int
    user_id: int
    item_id: str
    item_name: str
    item_type: str
    set_sell_price: float | None
    total_cost: float
    profit: float | None
    status: str
    created_at: datetime
    completed_at: datetime | None
    parts: list[TradePartResponse]


class TradeSessionListResponse(BaseModel):
    """List of trade sessions with summary."""

    sessions: list[TradeSessionResponse]
    total_sessions: int
    total_profit: float
    completed_sessions: int
    in_progress_sessions: int


# ============================================================================
# Price History Models
# ============================================================================


class PriceHistoryResponse(BaseModel):
    """Historical price data for an item."""

    item_id: str
    part_name: str
    price: float
    seller: str
    platform: str
    timestamp: datetime


class PriceHistorySummary(BaseModel):
    """Price history summary for a part (48 hours)."""

    part_name: str
    current_price: float
    lowest_48h: float
    highest_48h: float
    average_48h: float
    price_trend: str  # "up", "down", "stable"
    history: list[PriceHistoryResponse]

