# Warframe Trade Helper

A production-ready, containerized web application that analyzes arbitrage opportunities on warframe.market by comparing the total price of individual parts versus the price of a full set for each Warframe.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-Python-green) ![Docker](https://img.shields.io/badge/Docker-Ready-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- 🔍 **Real-time Market Analysis**: Monitor warframe.market for arbitrage opportunities
- 📊 **Multiple Pricing Strategies**: Conservative, Balanced, and Aggressive strategies
- 💰 **Profit Calculations**: Instant profit and margin calculations for 15+ Prime Warframes
- 🔄 **Live Updates**: WebSocket-powered real-time data streaming
- 📈 **Price History**: Track price trends with sparkline visualizations
- 🎨 **Modern UI**: Clean, responsive interface with gradient accents
- 🐳 **Fully Containerized**: One-command deployment with Docker
- 🗄️ **Optional Database**: Run with or without PostgreSQL persistence
- ⚡ **Fast & Reliable**: Async operations with automatic retry and backoff

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (with Docker Compose)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd warframe-trade-helper
   ```

2. **Run the startup script**
   ```bash
   ./start.sh
   ```

   The script will:
   - Check for Docker installation
   - Create `.env` file from template
   - Ask if you want to use database
   - Build and start all services

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

That's it! The application is now running.

## Project Structure

```
warframe-trade-helper/
├── frontend/              # React + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and API client
│   │   └── test/         # Test setup and specs
│   ├── Dockerfile
│   └── package.json
├── backend/              # FastAPI + Python
│   ├── app/
│   │   ├── api/         # API routes and models
│   │   ├── services/    # Business logic
│   │   └── db/          # Database models
│   ├── tests/           # Backend tests
│   ├── Dockerfile
│   └── pyproject.toml
├── docker-compose.yml    # Docker orchestration
├── start.sh             # Startup script
├── Makefile             # Convenience commands
└── README.md
```

## Usage

### Pricing Strategies

Choose from three pricing strategies to match your risk tolerance:

- **Conservative**: Safest approach
  - Buy parts at median sell price
  - Sell set at highest buy order
  
- **Balanced** (Default): Middle ground
  - Buy parts at 35th percentile of sell orders
  - Sell set at median sell price
  
- **Aggressive**: Maximum profit potential
  - Buy parts at 20th percentile of sell orders
  - Sell set at 65th percentile of sell orders

### Filtering Opportunities

Set thresholds to filter opportunities:
- **Min Profit**: Minimum platinum profit
- **Min Margin**: Minimum profit margin percentage

### Watchlist

Click the star icon next to any Warframe to add it to your watchlist. Watchlist items are persisted in browser localStorage.

### Frame Details

Click "Details" on any frame to see:
- Part-by-part price breakdown
- Price history sparkline
- Direct link to warframe.market

## Configuration

Edit `.env` file to customize settings:

```bash
# API Configuration
WM_BASE_URL=https://api.warframe.market/v1
PLATFORM=pc
STRATEGY=balanced
REFRESH_INTERVAL_SECONDS=45

# Database
USE_DB=true
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/wth

# Platform fee (default 0 - Warframe trades only cost credits)
PLATFORM_FEE_PCT=0
```

## Development

### Backend Development

```bash
cd backend

# Install dependencies
pip install -e ".[dev]"

# Run locally
uvicorn app.main:app --reload

# Run tests
pytest

# Lint and format
ruff check app/
black app/
mypy app/
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Lint and format
npm run lint
npm run format
```

## Docker Commands

Using the Makefile:

```bash
make up          # Start with database
make up-no-db    # Start without database
make down        # Stop all services
make logs        # View logs
make restart     # Restart services
make clean       # Remove all containers and volumes
```

Using Docker Compose directly:

```bash
# With database
docker compose --profile with-db up -d

# Without database
docker compose --profile no-db up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

## API Documentation

Once running, visit http://localhost:8000/docs for interactive API documentation (Swagger UI).

### Main Endpoints

- `GET /api/v1/healthz` - Health check
- `GET /api/v1/config` - Current configuration
- `GET /api/v1/frames` - List all tracked Warframes
- `GET /api/v1/opportunities` - Get arbitrage opportunities
- `GET /api/v1/frames/{id}` - Frame details with history
- `WS /api/v1/ws/market` - WebSocket for real-time updates

## Testing

### Backend Tests

```bash
cd backend
pytest
pytest --cov=app tests/
```

### Frontend Tests

```bash
cd frontend
npm test
npm run test:coverage
```

## Troubleshooting

### Services won't start

```bash
# Check Docker is running
docker --version

# View detailed logs
docker compose logs

# Rebuild from scratch
docker compose down -v
./start.sh
```

### Database connection issues

If running with database and experiencing connection issues:

```bash
# Wait for database to be ready
docker compose logs db

# Restart backend
docker compose restart backend
```

### Port already in use

If ports 3000 or 8000 are already in use, edit `docker-compose.yml` to change:

```yaml
ports:
  - "3001:80"  # Change frontend port
  - "8001:8000"  # Change backend port
```

## Architecture

### Backend

- **FastAPI**: Modern async Python web framework
- **SQLAlchemy**: Optional database ORM with async support
- **httpx**: Async HTTP client for warframe.market API
- **WebSockets**: Real-time data streaming
- **Background Tasks**: Periodic market data fetching

### Frontend

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast build tool and dev server
- **Native WebSockets**: Real-time updates

### Infrastructure

- **Docker**: Containerization
- **PostgreSQL**: Optional price history storage
- **Nginx**: Production frontend serving

## API Assumptions

The application uses the public warframe.market API. If the API schema changes:

1. Update `backend/app/services/market_client.py` parsing logic
2. Adjust order filtering in `filter_orders()` method
3. Update pricing calculations if needed

See `backend/README.md` for detailed API assumptions.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [warframe.market](https://warframe.market) for providing the public API
- The Warframe community for making trading easier

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions

---

**Note**: This tool is for educational and informational purposes. Always verify prices on warframe.market before making trades. Market prices can change rapidly.

