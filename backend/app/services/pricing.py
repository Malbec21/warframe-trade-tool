"""Pricing strategy and arbitrage calculation logic."""
import logging
import statistics
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


def calculate_percentile(values: list[float], percentile: float) -> float:
    """
    Calculate percentile of values.

    Args:
        values: List of numeric values
        percentile: Percentile to calculate (0-100)

    Returns:
        Calculated percentile value
    """
    if not values:
        return 0.0

    sorted_values = sorted(values)
    n = len(sorted_values)
    rank = (percentile / 100.0) * (n - 1)
    lower_idx = int(rank)
    upper_idx = min(lower_idx + 1, n - 1)
    fraction = rank - lower_idx

    return sorted_values[lower_idx] + fraction * (
        sorted_values[upper_idx] - sorted_values[lower_idx]
    )


def get_strategy_params(strategy: str) -> dict[str, Any]:
    """
    Get pricing parameters for a strategy.

    Args:
        strategy: Strategy name ("conservative", "balanced", "aggressive")

    Returns:
        Dictionary with buy/sell parameters
    """
    strategies = {
        "conservative": {
            "buy_metric": "median",
            "buy_order_type": "sell",
            "sell_metric": "max",
            "sell_order_type": "buy",
        },
        "balanced": {
            "buy_metric": "p35",
            "buy_order_type": "sell",
            "sell_metric": "median",
            "sell_order_type": "sell",
        },
        "aggressive": {
            "buy_metric": "min",
            "buy_order_type": "sell",
            "sell_metric": "min",
            "sell_order_type": "sell",
        },
    }

    return strategies.get(strategy, strategies["balanced"])


def calculate_metric(orders: list[dict[str, Any]], metric: str) -> float:
    """
    Calculate price metric from orders.

    Args:
        orders: List of filtered orders
        metric: Metric to calculate ("median", "p20", "p35", "p65", "max", "min")

    Returns:
        Calculated price
    """
    if not orders:
        return 0.0

    prices = [float(order.get("platinum", 0)) for order in orders]
    prices = [p for p in prices if p > 0]  # Filter out zero prices

    if not prices:
        return 0.0

    if metric == "median":
        return statistics.median(prices)
    elif metric == "max":
        return max(prices)
    elif metric == "min":
        return min(prices)
    elif metric.startswith("p"):
        # Percentile (e.g., "p35" -> 35th percentile)
        percentile = float(metric[1:])
        return calculate_percentile(prices, percentile)

    return 0.0


def calculate_part_price(
    orders: list[dict[str, Any]], strategy: str, is_buying: bool = True
) -> tuple[float, str]:
    """
    Calculate price for a part based on strategy.

    Args:
        orders: List of orders from API
        strategy: Strategy name
        is_buying: True if buying this item, False if selling

    Returns:
        Tuple of (price, source_metric)
    """
    params = get_strategy_params(strategy)

    if is_buying:
        # We're buying parts - look at sell orders
        order_type = params["buy_order_type"]
        metric = params["buy_metric"]
    else:
        # We're selling the set - look at appropriate orders
        order_type = params["sell_order_type"]
        metric = params["sell_metric"]

    price = calculate_metric(orders, metric)
    source = f"{order_type}_{metric}"

    return price, source


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
    strategy: str = "balanced",
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
        strategy: Pricing strategy
        platform: Platform name

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

        price, source = calculate_part_price(orders, strategy, is_buying=True)
        if price > 0:
            part_prices[part] = (price, source)

    # Calculate set price
    set_item_name = f"{frame_id}_set"
    set_orders = market_orders.get(set_item_name, [])

    if not set_orders:
        logger.warning(f"No orders found for {set_item_name}")
        return None

    set_price, set_source = calculate_part_price(set_orders, strategy, is_buying=False)

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
        "strategy": strategy,
        "item_type": item_type,
        "parts": parts_with_sellers,
        "full_set_price": set_price,
        "profit_plat": round(arb["profit_plat"], 2),
        "profit_margin": round(arb["profit_margin"], 4),
        "seller": seller_username,
    }

