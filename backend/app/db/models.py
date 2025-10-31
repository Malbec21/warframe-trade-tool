"""SQLAlchemy database models."""
from datetime import datetime

from sqlalchemy import Boolean, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

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

