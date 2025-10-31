"""Tests for pricing logic."""
import pytest

from app.services.pricing import (
    calculate_arbitrage,
    calculate_metric,
    calculate_percentile,
    get_strategy_params,
)


def test_calculate_percentile():
    """Test percentile calculation."""
    values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

    assert calculate_percentile(values, 50) == 5.5  # median
    assert calculate_percentile(values, 0) == 1  # min
    assert calculate_percentile(values, 100) == 10  # max
    assert calculate_percentile(values, 25) == 3.25
    assert calculate_percentile(values, 75) == 7.75


def test_calculate_percentile_empty():
    """Test percentile with empty list."""
    assert calculate_percentile([], 50) == 0.0


def test_get_strategy_params():
    """Test strategy parameter retrieval."""
    conservative = get_strategy_params("conservative")
    assert conservative["buy_metric"] == "median"
    assert conservative["sell_order_type"] == "buy"

    balanced = get_strategy_params("balanced")
    assert balanced["buy_metric"] == "p35"
    assert balanced["sell_metric"] == "median"

    aggressive = get_strategy_params("aggressive")
    assert aggressive["buy_metric"] == "p20"
    assert aggressive["sell_metric"] == "p65"


def test_calculate_metric_median():
    """Test median calculation."""
    orders = [{"platinum": 10}, {"platinum": 20}, {"platinum": 30}]
    assert calculate_metric(orders, "median") == 20


def test_calculate_metric_max():
    """Test max calculation."""
    orders = [{"platinum": 10}, {"platinum": 20}, {"platinum": 30}]
    assert calculate_metric(orders, "max") == 30


def test_calculate_metric_percentile():
    """Test percentile metric."""
    orders = [{"platinum": i} for i in range(1, 11)]
    assert calculate_metric(orders, "p50") == 5.5
    assert calculate_metric(orders, "p35") == pytest.approx(3.65, rel=0.01)


def test_calculate_metric_empty():
    """Test metric calculation with empty orders."""
    assert calculate_metric([], "median") == 0.0


def test_calculate_metric_filters_zero():
    """Test that zero prices are filtered out."""
    orders = [{"platinum": 0}, {"platinum": 10}, {"platinum": 20}]
    assert calculate_metric(orders, "median") == 15


def test_calculate_arbitrage():
    """Test arbitrage calculation."""
    part_prices = {
        "Blueprint": (10.0, "sell_p35"),
        "Neuroptics": (15.0, "sell_p35"),
        "Chassis": (12.0, "sell_p35"),
        "Systems": (13.0, "sell_p35"),
    }
    set_price = 70.0
    set_source = "sell_median"

    result = calculate_arbitrage(part_prices, set_price, set_source, platform_fee_pct=0.0)

    assert result["parts_cost"] == 50.0
    assert result["set_price"] == 70.0
    assert result["profit_plat"] == 20.0
    assert result["profit_margin"] == 0.4  # 20/50
    assert result["fee"] == 0.0


def test_calculate_arbitrage_with_fee():
    """Test arbitrage calculation with platform fee."""
    part_prices = {
        "Blueprint": (10.0, "sell_p35"),
    }
    set_price = 20.0
    set_source = "sell_median"

    result = calculate_arbitrage(part_prices, set_price, set_source, platform_fee_pct=0.1)

    assert result["parts_cost"] == 10.0
    assert result["fee"] == 2.0  # 10% of 20
    assert result["profit_plat"] == 8.0  # 20 - 10 - 2


def test_calculate_arbitrage_zero_parts_cost():
    """Test arbitrage with zero parts cost."""
    part_prices = {}
    set_price = 100.0
    set_source = "sell_median"

    result = calculate_arbitrage(part_prices, set_price, set_source, platform_fee_pct=0.0)

    assert result["parts_cost"] == 0.0
    assert result["profit_plat"] == 0.0
    assert result["profit_margin"] == 0.0

