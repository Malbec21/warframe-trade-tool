"""Warframe Market API client with retry logic."""
import asyncio
import logging
import random
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class MarketClient:
    """Async HTTP client for Warframe Market API."""

    def __init__(self) -> None:
        """Initialize market client."""
        self.base_url = settings.wm_base_url
        self.platform = settings.platform
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "User-Agent": "WarframeTradeHelper/1.0",
                "Accept": "application/json",
            },
            timeout=30.0,
            follow_redirects=True,
        )
        self.max_retries = 5
        self.base_backoff = 1.0
        self.max_backoff = 60.0

    async def close(self) -> None:
        """Close the HTTP client."""
        await self.client.aclose()

    def _calculate_backoff(self, attempt: int) -> float:
        """Calculate exponential backoff with jitter."""
        backoff = min(self.base_backoff * (2**attempt), self.max_backoff)
        jitter = random.uniform(0, backoff * 0.1)
        return backoff + jitter

    async def _request_with_retry(
        self, method: str, endpoint: str, **kwargs: Any
    ) -> dict[str, Any]:
        """Make HTTP request with exponential backoff retry."""
        last_exception = None

        for attempt in range(self.max_retries):
            try:
                response = await self.client.request(method, endpoint, **kwargs)

                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", "5"))
                    backoff = max(retry_after, self._calculate_backoff(attempt))
                    logger.warning(f"Rate limited, retrying after {backoff:.2f}s")
                    await asyncio.sleep(backoff)
                    continue

                # Handle server errors
                if response.status_code >= 500:
                    backoff = self._calculate_backoff(attempt)
                    logger.warning(
                        f"Server error {response.status_code}, retrying after {backoff:.2f}s"
                    )
                    await asyncio.sleep(backoff)
                    continue

                # Success
                response.raise_for_status()
                return response.json()

            except httpx.HTTPError as e:
                last_exception = e
                backoff = self._calculate_backoff(attempt)
                logger.warning(f"Request failed: {e}, retrying after {backoff:.2f}s")
                await asyncio.sleep(backoff)

        # All retries exhausted
        logger.error(f"All retries exhausted for {endpoint}")
        raise last_exception or Exception("Request failed after all retries")

    async def get_item_orders(self, item_url_name: str) -> dict[str, Any]:
        """
        Get orders for an item.

        Args:
            item_url_name: URL-safe item name (e.g., "mesa_prime_set")

        Returns:
            Order data from API
        """
        endpoint = f"/items/{item_url_name}/orders"
        try:
            data = await self._request_with_retry("GET", endpoint)
            return data
        except Exception as e:
            logger.error(f"Failed to fetch orders for {item_url_name}: {e}")
            return {"payload": {"orders": []}}

    async def get_items_list(self) -> list[dict[str, Any]]:
        """Get list of all items."""
        try:
            data = await self._request_with_retry("GET", "/items")
            return data.get("payload", {}).get("items", [])
        except Exception as e:
            logger.error(f"Failed to fetch items list: {e}")
            return []

    def filter_orders(
        self, orders: list[dict[str, Any]], order_type: str = "sell"
    ) -> list[dict[str, Any]]:
        """
        Filter orders by platform, visibility, and status.

        Args:
            orders: List of order dictionaries
            order_type: "sell" or "buy"

        Returns:
            Filtered list of orders
        """
        console_platforms = ["ps4", "xbox", "switch", "playstation"]
        
        return [
            order
            for order in orders
            if (
                order.get("order_type") == order_type
                and order.get("visible", False)
                and order.get("user", {}).get("status") == "ingame"
                and (
                    # PC: show PC platform orders
                    (self.platform == "pc" and order.get("user", {}).get("platform") == "pc")
                    # Console: show cross-play enabled orders from any platform
                    or (self.platform in console_platforms and order.get("user", {}).get("crossplay", False))
                )
            )
        ]


# Global market client instance
market_client: MarketClient | None = None


async def get_market_client() -> MarketClient:
    """Get or create the global market client."""
    global market_client
    if market_client is None:
        market_client = MarketClient()
    return market_client


async def cleanup_market_client() -> None:
    """Cleanup the market client."""
    global market_client
    if market_client is not None:
        await market_client.close()
        market_client = None

