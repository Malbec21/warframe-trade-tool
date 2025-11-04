"""API routes."""
import json
import logging
from datetime import datetime

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import desc, select

from app.api.models import (
    ConfigResponse,
    FrameDetailResponse,
    FrameInfo,
    HealthResponse,
    OpportunityResponse,
)
from app.config import settings
from app.db.init_db import get_all_frames
from app.db.models import PriceSnapshot, SetSnapshot
from app.db.session import async_session_maker
from app.services.scheduler import scheduler
from app.services.ws_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/healthz", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(status="ok", time=datetime.utcnow())


@router.get("/config", response_model=ConfigResponse)
async def get_config() -> ConfigResponse:
    """Get current configuration."""
    return ConfigResponse(
        platform=settings.platform,
        min_profit=0.0,
        min_margin=0.0,
        refresh_interval=settings.refresh_interval_seconds,
    )


@router.get("/frames", response_model=list[FrameInfo])
async def get_frames() -> list[FrameInfo]:
    """Get list of all tracked frames."""
    frames = await get_all_frames()
    return [
        FrameInfo(
            id=frame.id if hasattr(frame, "id") else frame["id"],
            name=frame.name if hasattr(frame, "name") else frame["name"],
            parts=frame.parts if hasattr(frame, "parts") else frame["parts"],
            is_prime=frame.is_prime if hasattr(frame, "is_prime") else frame.get("is_prime", True),
            enabled=frame.enabled if hasattr(frame, "enabled") else frame.get("enabled", True),
            item_type=frame.item_type if hasattr(frame, "item_type") else frame.get("item_type", "warframe"),
        )
        for frame in frames
    ]


@router.get("/opportunities", response_model=list[OpportunityResponse])
async def get_opportunities(
    min_profit: float = Query(default=0.0, ge=0.0),
    min_margin: float = Query(default=0.0, ge=0.0),
    platform: str | None = Query(default=None),
) -> list[OpportunityResponse]:
    """
    Get arbitrage opportunities.

    Args:
        min_profit: Minimum profit threshold in platinum
        min_margin: Minimum profit margin threshold (0-1)
        platform: Optional platform override

    Returns:
        List of opportunities
    """
    opportunities = scheduler.get_current_opportunities(min_profit, min_margin)

    # Filter by platform if provided
    if platform:
        opportunities = [opp for opp in opportunities if opp["platform"] == platform]

    return [OpportunityResponse(**opp) for opp in opportunities]


@router.get("/frames/{frame_id}", response_model=FrameDetailResponse)
async def get_frame_details(frame_id: str) -> FrameDetailResponse:
    """
    Get detailed information about a specific frame.

    Args:
        frame_id: Frame identifier

    Returns:
        Frame details with historical snapshots
    """
    # Get frame info
    frames = await get_all_frames()
    frame = next(
        (
            f
            for f in frames
            if (f.id if hasattr(f, "id") else f["id"]) == frame_id
        ),
        None,
    )

    if not frame:
        return FrameDetailResponse(
            frame=FrameInfo(id=frame_id, name="Unknown", parts=[], is_prime=True, enabled=False),
            current_opportunity=None,
            snapshots=[],
        )

    # Get current opportunity
    opportunities = scheduler.get_current_opportunities()
    current_opp = next((opp for opp in opportunities if opp["frame_id"] == frame_id), None)

    # Get historical snapshots if DB is enabled
    snapshots = []
    if settings.use_db:
        try:
            async with async_session_maker() as session:
                # Get last 20 snapshots for sparkline
                result = await session.execute(
                    select(SetSnapshot)
                    .where(SetSnapshot.frame_id == frame_id)
                    .order_by(desc(SetSnapshot.ts))
                    .limit(20)
                )
                set_snapshots = result.scalars().all()

                snapshots = [
                    {
                        "timestamp": snap.ts.isoformat(),
                        "set_price": float(snap.set_price),
                    }
                    for snap in reversed(set_snapshots)
                ]
        except Exception as e:
            logger.error(f"Error fetching snapshots for {frame_id}: {e}")

    return FrameDetailResponse(
        frame=FrameInfo(
            id=frame.id if hasattr(frame, "id") else frame["id"],
            name=frame.name if hasattr(frame, "name") else frame["name"],
            parts=frame.parts if hasattr(frame, "parts") else frame["parts"],
            is_prime=frame.is_prime if hasattr(frame, "is_prime") else frame.get("is_prime", True),
            enabled=frame.enabled if hasattr(frame, "enabled") else frame.get("enabled", True),
        ),
        current_opportunity=OpportunityResponse(**current_opp) if current_opp else None,
        snapshots=snapshots,
    )


@router.websocket("/ws/market")
async def websocket_market(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for real-time market updates.

    Clients can send:
    - {"type": "set_config", "min_profit": 10, "min_margin": 0.2, "platform": "pc"}

    Server sends:
    - {"type": "market_update", "opportunities": [...], "timestamp": "..."}
    - {"type": "opportunity_alert", "opportunity": {...}, "reason": "...", "timestamp": "..."}
    """
    await manager.connect(websocket)

    try:
        # Send initial data
        opportunities = scheduler.get_current_opportunities()
        await manager.send_personal_message(
            {
                "type": "market_update",
                "opportunities": opportunities,
                "timestamp": datetime.utcnow().isoformat(),
            },
            websocket,
        )

        # Listen for client messages
        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                msg_type = message.get("type")

                if msg_type == "set_config":
                    # Update client-specific config
                    config = {
                        k: v
                        for k, v in message.items()
                        if k in ["min_profit", "min_margin", "platform"]
                    }
                    manager.update_client_config(websocket, config)

                    # Send updated opportunities based on new config
                    client_config = manager.get_client_config(websocket)
                    filtered_opps = scheduler.get_current_opportunities(
                        min_profit=client_config.get("min_profit", 0.0),
                        min_margin=client_config.get("min_margin", 0.0),
                    )
                    await manager.send_personal_message(
                        {
                            "type": "market_update",
                            "opportunities": filtered_opps,
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                        websocket,
                    )

            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received: {data}")
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

