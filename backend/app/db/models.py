"""SQLAlchemy database models."""
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Frame(Base):
    """Warframe/Weapon model."""

    __tablename__ = "frames"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    parts: Mapped[dict] = mapped_column(JSONB, nullable=False)  # type: ignore
    is_prime: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    item_type: Mapped[str] = mapped_column(String(50), default="warframe", nullable=False)


class PriceSnapshot(Base):
    """Price snapshot for individual parts."""

    __tablename__ = "price_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    frame_id: Mapped[str] = mapped_column(String(100), nullable=False)
    part_name: Mapped[str] = mapped_column(String(100), nullable=False)
    strategy: Mapped[str] = mapped_column(String(50), nullable=False)
    metric_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # e.g., "sell_p35", "buy_max"
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    platform: Mapped[str] = mapped_column(String(20), nullable=False, default="pc")
    ts: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow
    )

    __table_args__ = (
        Index("ix_price_snapshots_frame_ts", "frame_id", "ts"),
        Index("ix_price_snapshots_platform", "platform"),
    )


class SetSnapshot(Base):
    """Price snapshot for full sets."""

    __tablename__ = "set_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    frame_id: Mapped[str] = mapped_column(String(100), nullable=False)
    strategy: Mapped[str] = mapped_column(String(50), nullable=False)
    set_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    platform: Mapped[str] = mapped_column(String(20), nullable=False, default="pc")
    ts: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow
    )

    __table_args__ = (
        Index("ix_set_snapshots_frame_ts", "frame_id", "ts"),
        Index("ix_set_snapshots_platform", "platform"),
    )


class User(Base):
    """User model for authentication."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    trade_sessions: Mapped[list["TradeSession"]] = relationship(
        "TradeSession", back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_users_username", "username"),
        Index("ix_users_email", "email"),
    )


class TradeSession(Base):
    """Trade session model for tracking individual trades."""

    __tablename__ = "trade_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    item_id: Mapped[str] = mapped_column(String(100), nullable=False)
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    item_type: Mapped[str] = mapped_column(String(50), default="warframe", nullable=False)
    set_sell_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    total_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    profit: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), default="in_progress", nullable=False
    )  # in_progress, completed
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="trade_sessions")
    parts: Mapped[list["TradePart"]] = relationship(
        "TradePart", back_populates="session", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_trade_sessions_user_id", "user_id"),
        Index("ix_trade_sessions_created_at", "created_at"),
        Index("ix_trade_sessions_status", "status"),
    )


class TradePart(Base):
    """Individual part purchase within a trade session."""

    __tablename__ = "trade_parts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("trade_sessions.id", ondelete="CASCADE"), nullable=False
    )
    part_name: Mapped[str] = mapped_column(String(255), nullable=False)
    purchase_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    purchase_date: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    session: Mapped["TradeSession"] = relationship("TradeSession", back_populates="parts")

    __table_args__ = (Index("ix_trade_parts_session_id", "session_id"),)


class PriceHistory(Base):
    """Historical price data for items and parts."""

    __tablename__ = "price_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[str] = mapped_column(String(100), nullable=False)
    part_name: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    seller: Mapped[str] = mapped_column(String(255), nullable=False, default="User")
    platform: Mapped[str] = mapped_column(String(20), nullable=False, default="pc")
    timestamp: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow
    )

    __table_args__ = (
        Index("ix_price_history_item_timestamp", "item_id", "timestamp"),
        Index("ix_price_history_platform", "platform"),
        Index("ix_price_history_timestamp", "timestamp"),
    )

