"""WebSocket connection manager."""
import asyncio
import json
import logging
from datetime import datetime
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections and broadcasting."""

    def __init__(self) -> None:
        """Initialize connection manager."""
        self.active_connections: list[WebSocket] = []
        self.client_configs: dict[WebSocket, dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        self.client_configs[websocket] = {
            "strategy": "balanced",
            "min_profit": 0.0,
            "min_margin": 0.0,
            "platform": "pc",
        }
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.client_configs:
            del self.client_configs[websocket]
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    def update_client_config(self, websocket: WebSocket, config: dict[str, Any]) -> None:
        """Update configuration for a specific client."""
        if websocket in self.client_configs:
            self.client_configs[websocket].update(config)
            logger.info(f"Updated config for client: {config}")

    def get_client_config(self, websocket: WebSocket) -> dict[str, Any]:
        """Get configuration for a specific client."""
        return self.client_configs.get(
            websocket,
            {
                "strategy": "balanced",
                "min_profit": 0.0,
                "min_margin": 0.0,
                "platform": "pc",
            },
        )

    async def send_personal_message(self, message: dict[str, Any], websocket: WebSocket) -> None:
        """Send a message to a specific client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message to client: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: dict[str, Any]) -> None:
        """Broadcast a message to all connected clients."""
        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.append(connection)

        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(connection)

    async def broadcast_market_update(self, opportunities: list[dict[str, Any]]) -> None:
        """Broadcast market update to all clients."""
        message = {
            "type": "market_update",
            "opportunities": opportunities,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self.broadcast(message)

    async def broadcast_opportunity_alert(
        self, opportunity: dict[str, Any], reason: str
    ) -> None:
        """Broadcast opportunity alert to all clients."""
        message = {
            "type": "opportunity_alert",
            "opportunity": opportunity,
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self.broadcast(message)


# Global connection manager
manager = ConnectionManager()

