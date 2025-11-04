"""Pricing and arbitrage calculation logic."""
import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


def calculate_lowest_price(orders: list[dict[str, Any]]) -> tuple[float, str]:
    """
    Calculate the lowest price from orders.

    Args:
        orders: List of orders from API

    Returns:
        Tuple of (price, source_metric)
    """
    if not orders:
        return 0.0, "no_orders"

    prices = [float(order.get("platinum", 0)) for order in orders]
    prices = [p for p in prices if p > 0]  # Filter out zero prices

    if not prices:
        return 0.0, "no_valid_prices"

    lowest_price = min(prices)
    return lowest_price, "lowest_sell"


def calculate_arbitrage(
    part_prices: dict[str, tuple[float, str]],
    set_price: float,
    set_source: str,
    platform_fee_pct: float = 0.0,
) -> dict[str, Any]:
    """
    Calculate arbitrage profit.

    Args:
        part_prices: Dictionary of part_name -> (price, source)
        set_price: Price of the full set
        set_source: Source metric for set price
        platform_fee_pct: Platform fee percentage

    Returns:
        Dictionary with profit calculations
    """
    total_parts_cost = sum(price for price, _ in part_prices.values())

    if total_parts_cost == 0:
        return {
            "parts_cost": 0.0,
            "set_price": set_price,
            "profit_plat": 0.0,
            "profit_margin": 0.0,
            "fee": 0.0,
        }

    fee = set_price * platform_fee_pct
    profit_plat = set_price - total_parts_cost - fee
    profit_margin = profit_plat / total_parts_cost if total_parts_cost > 0 else 0.0

    return {
        "parts_cost": total_parts_cost,
        "set_price": set_price,
        "profit_plat": profit_plat,
        "profit_margin": profit_margin,
        "fee": fee,
    }


async def calculate_frame_opportunity(
    frame_id: str,
    frame_name: str,
    parts: list[str],
    market_orders: dict[str, list[dict[str, Any]]],
    platform: str = "pc",
    item_type: str = "warframe",
) -> dict[str, Any] | None:
    """
    Calculate arbitrage opportunity for a frame.

    Args:
        frame_id: Frame ID
        frame_name: Frame display name
        parts: List of part names
        market_orders: Dictionary mapping item_url_name to orders
        platform: Platform name
        item_type: Item type (warframe or weapon)

    Returns:
        Opportunity dictionary or None if incomplete data
    """
    part_prices: dict[str, tuple[float, str]] = {}

    # Calculate prices for each part
    for part in parts:
        part_item_name = f"{frame_id}_{part.lower().replace(' ', '_')}"
        orders = market_orders.get(part_item_name, [])

        if not orders:
            logger.warning(f"No orders found for {part_item_name}")
            continue

        price, source = calculate_lowest_price(orders)
        if price > 0:
            part_prices[part] = (price, source)

    # Calculate set price
    set_item_name = f"{frame_id}_set"
    set_orders = market_orders.get(set_item_name, [])

    if not set_orders:
        logger.warning(f"No orders found for {set_item_name}")
        return None

    set_price, set_source = calculate_lowest_price(set_orders)

    if set_price == 0:
        return None

    # Get seller username from the cheapest sell order
    seller_username = "User"
    if set_orders:
        # Find the cheapest sell order (since we're buying the set)
        sell_orders = [o for o in set_orders if o.get("order_type") == "sell"]
        if sell_orders:
            # Sort by price and get the cheapest
            sorted_orders = sorted(sell_orders, key=lambda x: x.get("platinum", float('inf')))
            if sorted_orders:
                seller_username = sorted_orders[0].get("user", {}).get("ingame_name", "User")

    # Calculate arbitrage
    arb = calculate_arbitrage(part_prices, set_price, set_source, settings.platform_fee_pct)

    # Build response with part sellers
    parts_with_sellers = []
    for name, (price, source) in part_prices.items():
        part_item_name = f"{frame_id}_{name.lower().replace(' ', '_')}"
        part_orders = market_orders.get(part_item_name, [])
        part_seller = "User"
        if part_orders:
            sell_orders = [o for o in part_orders if o.get("order_type") == "sell"]
            if sell_orders:
                sorted_orders = sorted(sell_orders, key=lambda x: x.get("platinum", float('inf')))
                if sorted_orders:
                    part_seller = sorted_orders[0].get("user", {}).get("ingame_name", "User")
        
        parts_with_sellers.append({
            "name": name,
            "price": price,
            "source": source,
            "seller": part_seller
        })

    return {
        "frame_id": frame_id,
        "frame_name": frame_name,
        "platform": platform,
        "item_type": item_type,
        "parts": parts_with_sellers,
        "full_set_price": set_price,
        "profit_plat": round(arb["profit_plat"], 2),
        "profit_margin": round(arb["profit_margin"], 4),
        "seller": seller_username,
    }

