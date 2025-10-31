# Warframe Trade Helper - Backend

FastAPI backend for analyzing Warframe arbitrage opportunities.

## Features

- **Market Data Fetching**: Async client for warframe.market API with exponential backoff and retry logic
- **Pricing Strategies**: Conservative, Balanced, and Aggressive pricing strategies
- **Real-time Updates**: WebSocket support for live market data streaming
- **Database Support**: Optional PostgreSQL persistence for price history
- **Background Scheduler**: Automatic market data refresh

## Architecture

### Services

- `market_client.py`: HTTP client for warframe.market API with retry/backoff
- `pricing.py`: Arbitrage calculation and pricing strategy logic
- `scheduler.py`: Background task for periodic market data fetching
- `ws_manager.py`: WebSocket connection management and broadcasting

### API Endpoints

#### REST API

- `GET /api/v1/healthz`: Health check
- `GET /api/v1/config`: Current configuration
- `GET /api/v1/frames`: List all tracked Warframes
- `GET /api/v1/opportunities`: Get arbitrage opportunities (supports filters)
- `GET /api/v1/frames/{id}`: Frame details with price history

#### WebSocket

- `WS /api/v1/ws/market`: Real-time market updates

Clients receive:
- `market_update`: Batch updates with all opportunities
- `opportunity_alert`: Alerts for significant opportunities

Clients can send:
- `set_config`: Update strategy/thresholds

### Database Schema

**frames**
- id (PK)
- name
- parts (JSONB)
- is_prime
- enabled

**price_snapshots**
- id (PK)
- frame_id
- part_name
- strategy
- metric_type
- price
- platform
- ts (timestamp)

**set_snapshots**
- id (PK)
- frame_id
- strategy
- set_price
- platform
- ts (timestamp)

## Pricing Strategies

### Conservative
- **Buy parts**: Median of sell orders
- **Sell set**: Highest buy order
- **Use case**: Risk-averse, guaranteed prices

### Balanced (Default)
- **Buy parts**: 35th percentile of sell orders
- **Sell set**: Median of sell orders
- **Use case**: Balanced risk/reward

### Aggressive
- **Buy parts**: 20th percentile of sell orders
- **Sell set**: 65th percentile of sell orders
- **Use case**: Maximum profit, higher risk

## Configuration

Environment variables (see `.env.example`):

```bash
# Warframe Market API
WM_BASE_URL=https://api.warframe.market/v1
PLATFORM=pc
STRATEGY=balanced
REFRESH_INTERVAL_SECONDS=45

# Database
USE_DB=true
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/wth

# Platform fee
PLATFORM_FEE_PCT=0

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

## Development

### Setup

```bash
cd backend
pip install -e ".[dev]"
```

### Run

```bash
uvicorn app.main:app --reload
```

### Linting & Formatting

```bash
# Format code
black app/

# Lint
ruff check app/

# Type check
mypy app/
```

### Testing

```bash
pytest
pytest --cov=app tests/
```

## API Assumptions

The code assumes the warframe.market API returns orders with:

```json
{
  "payload": {
    "orders": [
      {
        "order_type": "sell" | "buy",
        "platform": "pc" | "ps4" | "xbox" | "switch",
        "visible": true | false,
        "platinum": 100,
        "user": {
          "status": "ingame" | "online" | "offline"
        }
      }
    ]
  }
}
```

If the API schema differs:
1. Update `market_client.py` parsing logic
2. Adjust `filter_orders()` method
3. Update pricing calculations in `pricing.py`

## Error Handling

- Network failures: Exponential backoff with jitter (max 60s)
- Rate limiting: Respects 429 responses and Retry-After headers
- Database failures: Falls back to memory-only mode
- Missing data: Logs warnings and skips incomplete frames

