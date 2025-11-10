"""Trade session API routes."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_active_user, get_db
from app.api.models import (
    TradePartCreate,
    TradePartResponse,
    TradeSessionCreate,
    TradeSessionListResponse,
    TradeSessionResponse,
    TradeSessionUpdate,
)
from app.db.models import TradePart, TradeSession, User

router = APIRouter(prefix="/trades", tags=["trade_sessions"])


def calculate_session_profit(session: TradeSession) -> float | None:
    """
    Calculate profit for a trade session.
    
    Args:
        session: Trade session object
        
    Returns:
        Profit amount or None if set price not set
    """
    if session.set_sell_price is None:
        return None
    return float(session.set_sell_price) - float(session.total_cost)


@router.post("", response_model=TradeSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_trade_session(
    session_data: TradeSessionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> TradeSessionResponse:
    """
    Create a new trade session.
    
    Args:
        session_data: Trade session creation data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created trade session
    """
    new_session = TradeSession(
        user_id=current_user.id,
        item_id=session_data.item_id,
        item_name=session_data.item_name,
        item_type=session_data.item_type,
        total_cost=0,
        status="in_progress",
    )
    
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    
    # Load parts relationship
    await db.execute(
        select(TradeSession)
        .where(TradeSession.id == new_session.id)
        .options(selectinload(TradeSession.parts))
    )
    
    return TradeSessionResponse(
        id=new_session.id,
        user_id=new_session.user_id,
        item_id=new_session.item_id,
        item_name=new_session.item_name,
        item_type=new_session.item_type,
        set_sell_price=new_session.set_sell_price,
        total_cost=float(new_session.total_cost),
        profit=new_session.profit,
        status=new_session.status,
        created_at=new_session.created_at,
        completed_at=new_session.completed_at,
        parts=[],
    )


@router.post("/{session_id}/parts", response_model=TradePartResponse)
async def add_part_to_session(
    session_id: int,
    part_data: TradePartCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> TradePartResponse:
    """
    Add a part purchase to a trade session.
    
    Args:
        session_id: Trade session ID
        part_data: Part purchase data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created trade part
        
    Raises:
        HTTPException: If session not found or doesn't belong to user
    """
    # Get session and verify ownership
    result = await db.execute(
        select(TradeSession).where(
            TradeSession.id == session_id, TradeSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade session not found",
        )
    
    # Create new part
    purchase_date = part_data.purchase_date or datetime.utcnow()
    new_part = TradePart(
        session_id=session_id,
        part_name=part_data.part_name,
        purchase_price=part_data.purchase_price,
        purchase_date=purchase_date,
        notes=part_data.notes,
    )
    
    db.add(new_part)
    
    # Update session total cost
    session.total_cost = float(session.total_cost) + part_data.purchase_price
    
    await db.commit()
    await db.refresh(new_part)
    
    return TradePartResponse(
        id=new_part.id,
        part_name=new_part.part_name,
        purchase_price=float(new_part.purchase_price),
        purchase_date=new_part.purchase_date,
        notes=new_part.notes,
    )


@router.patch("/{session_id}/parts/{part_id}", response_model=TradePartResponse)
async def update_trade_part(
    session_id: int,
    part_id: int,
    part_data: TradePartCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> TradePartResponse:
    """
    Update a trade part's price.
    
    Args:
        session_id: Trade session ID
        part_id: Trade part ID
        part_data: Updated part data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated trade part
        
    Raises:
        HTTPException: If session or part not found or doesn't belong to user
    """
    # Get session and verify ownership
    result = await db.execute(
        select(TradeSession).where(
            TradeSession.id == session_id, TradeSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade session not found",
        )
    
    # Get part and verify it belongs to this session
    result = await db.execute(
        select(TradePart).where(
            TradePart.id == part_id, TradePart.session_id == session_id
        )
    )
    part = result.scalar_one_or_none()
    
    if part is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade part not found",
        )
    
    # Calculate price difference for total cost adjustment
    old_price = float(part.purchase_price)
    new_price = part_data.purchase_price
    price_diff = new_price - old_price
    
    # Update part
    part.purchase_price = new_price
    if part_data.purchase_date:
        part.purchase_date = part_data.purchase_date
    if part_data.notes is not None:
        part.notes = part_data.notes
    
    # Update session total cost
    session.total_cost = float(session.total_cost) + price_diff
    
    # Recalculate profit if sell price is set
    if session.set_sell_price is not None:
        session.profit = calculate_session_profit(session)
    
    await db.commit()
    await db.refresh(part)
    
    return TradePartResponse(
        id=part.id,
        part_name=part.part_name,
        purchase_price=float(part.purchase_price),
        purchase_date=part.purchase_date,
        notes=part.notes,
    )


@router.patch("/{session_id}", response_model=TradeSessionResponse)
async def update_trade_session(
    session_id: int,
    update_data: TradeSessionUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> TradeSessionResponse:
    """
    Update a trade session (e.g., set sell price, mark as completed).
    
    Args:
        session_id: Trade session ID
        update_data: Update data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated trade session
        
    Raises:
        HTTPException: If session not found or doesn't belong to user
    """
    # Get session with parts
    result = await db.execute(
        select(TradeSession)
        .where(TradeSession.id == session_id, TradeSession.user_id == current_user.id)
        .options(selectinload(TradeSession.parts))
    )
    session = result.scalar_one_or_none()
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade session not found",
        )
    
    # Update fields
    if update_data.set_sell_price is not None:
        session.set_sell_price = update_data.set_sell_price
        session.profit = calculate_session_profit(session)
    
    if update_data.status is not None:
        session.status = update_data.status
        if update_data.status == "completed":
            session.completed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(session)
    
    # Convert parts to response model
    parts_response = [
        TradePartResponse(
            id=part.id,
            part_name=part.part_name,
            purchase_price=float(part.purchase_price),
            purchase_date=part.purchase_date,
            notes=part.notes,
        )
        for part in session.parts
    ]
    
    return TradeSessionResponse(
        id=session.id,
        user_id=session.user_id,
        item_id=session.item_id,
        item_name=session.item_name,
        item_type=session.item_type,
        set_sell_price=float(session.set_sell_price) if session.set_sell_price else None,
        total_cost=float(session.total_cost),
        profit=float(session.profit) if session.profit else None,
        status=session.status,
        created_at=session.created_at,
        completed_at=session.completed_at,
        parts=parts_response,
    )


@router.get("/{session_id}", response_model=TradeSessionResponse)
async def get_trade_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> TradeSessionResponse:
    """
    Get a single trade session by ID.
    
    Args:
        session_id: Trade session ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Trade session details
        
    Raises:
        HTTPException: If session not found or doesn't belong to user
    """
    result = await db.execute(
        select(TradeSession)
        .where(TradeSession.id == session_id, TradeSession.user_id == current_user.id)
        .options(selectinload(TradeSession.parts))
    )
    session = result.scalar_one_or_none()
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade session not found",
        )
    
    parts_response = [
        TradePartResponse(
            id=part.id,
            part_name=part.part_name,
            purchase_price=float(part.purchase_price),
            purchase_date=part.purchase_date,
            notes=part.notes,
        )
        for part in session.parts
    ]
    
    return TradeSessionResponse(
        id=session.id,
        user_id=session.user_id,
        item_id=session.item_id,
        item_name=session.item_name,
        item_type=session.item_type,
        set_sell_price=float(session.set_sell_price) if session.set_sell_price else None,
        total_cost=float(session.total_cost),
        profit=float(session.profit) if session.profit else None,
        status=session.status,
        created_at=session.created_at,
        completed_at=session.completed_at,
        parts=parts_response,
    )


@router.get("", response_model=TradeSessionListResponse)
async def list_trade_sessions(
    status_filter: str | None = Query(None, description="Filter by status (in_progress, completed)"),
    days: int | None = Query(None, description="Filter sessions from last N days"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> TradeSessionListResponse:
    """
    List all trade sessions for the current user with optional filters.
    
    Args:
        status_filter: Optional status filter
        days: Optional filter for last N days
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of trade sessions with summary statistics
    """
    # Build query
    query = select(TradeSession).where(TradeSession.user_id == current_user.id)
    
    if status_filter:
        query = query.where(TradeSession.status == status_filter)
    
    if days:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = query.where(TradeSession.created_at >= cutoff_date)
    
    query = query.options(selectinload(TradeSession.parts)).order_by(TradeSession.created_at.desc())
    
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    # Convert to response models
    sessions_response = []
    for session in sessions:
        parts_response = [
            TradePartResponse(
                id=part.id,
                part_name=part.part_name,
                purchase_price=float(part.purchase_price),
                purchase_date=part.purchase_date,
                notes=part.notes,
            )
            for part in session.parts
        ]
        
        sessions_response.append(
            TradeSessionResponse(
                id=session.id,
                user_id=session.user_id,
                item_id=session.item_id,
                item_name=session.item_name,
                item_type=session.item_type,
                set_sell_price=float(session.set_sell_price) if session.set_sell_price else None,
                total_cost=float(session.total_cost),
                profit=float(session.profit) if session.profit else None,
                status=session.status,
                created_at=session.created_at,
                completed_at=session.completed_at,
                parts=parts_response,
            )
        )
    
    # Calculate summary statistics
    total_sessions = len(sessions)
    completed_sessions = sum(1 for s in sessions if s.status == "completed")
    in_progress_sessions = sum(1 for s in sessions if s.status == "in_progress")
    total_profit = sum(float(s.profit) for s in sessions if s.profit is not None)
    
    return TradeSessionListResponse(
        sessions=sessions_response,
        total_sessions=total_sessions,
        total_profit=total_profit,
        completed_sessions=completed_sessions,
        in_progress_sessions=in_progress_sessions,
    )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trade_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Delete a trade session.
    
    Args:
        session_id: Trade session ID
        current_user: Current authenticated user
        db: Database session
        
    Raises:
        HTTPException: If session not found or doesn't belong to user
    """
    result = await db.execute(
        select(TradeSession).where(
            TradeSession.id == session_id, TradeSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade session not found",
        )
    
    await db.delete(session)
    await db.commit()

