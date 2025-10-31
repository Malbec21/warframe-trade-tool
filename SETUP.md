# Setup Guide

Complete setup guide for the Warframe Trade Helper application.

## System Requirements

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Operating System**: Linux, macOS, or Windows with WSL2
- **RAM**: Minimum 2GB available
- **Disk Space**: 2GB for images and containers

## Quick Start (Recommended)

The fastest way to get started:

```bash
./start.sh
```

This interactive script will:
1. Verify Docker is installed
2. Create `.env` configuration
3. Ask about database preference
4. Build and start all services
5. Display access URLs

## Manual Setup

If you prefer manual setup:

### 1. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` to customize settings.

### 2. Choose Mode

**With Database (recommended for production):**
```bash
docker compose --profile with-db up -d --build
```

**Without Database (lighter, no history):**
```bash
docker compose --profile no-db up -d --build
```

### 3. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development Setup

For local development without Docker:

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Create .env file
cp ../.env.example .env

# Run development server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env.local
echo "VITE_WS_URL=ws://localhost:8000" >> .env.local

# Run development server
npm run dev
```

Frontend will be available at http://localhost:5173

### Database Setup (Optional)

If running locally with database:

```bash
# Start PostgreSQL
docker run -d \
  --name wth-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=wth \
  -p 5432:5432 \
  postgres:16-alpine

# Update backend .env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/wth
USE_DB=true
```

## Configuration Options

### Environment Variables

Edit `.env` file:

```bash
# Warframe Market API
WM_BASE_URL=https://api.warframe.market/v1

# Platform (pc, ps4, xbox, switch)
PLATFORM=pc

# Strategy (conservative, balanced, aggressive)
STRATEGY=balanced

# Refresh interval in seconds
REFRESH_INTERVAL_SECONDS=45

# Database
USE_DB=true
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/wth

# Platform fee percentage (default 0 for Warframe)
PLATFORM_FEE_PCT=0

# CORS origins for backend
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

### Port Configuration

If ports 3000 or 8000 are already in use, edit `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3001:80"  # Change left number

  backend:
    ports:
      - "8001:8000"  # Change left number
```

## Verification

### Check Services

```bash
# View running containers
docker compose ps

# View logs
docker compose logs

# View specific service logs
docker compose logs backend
docker compose logs frontend
```

### Test Backend

```bash
# Health check
curl http://localhost:8000/api/v1/healthz

# Get frames
curl http://localhost:8000/api/v1/frames

# Get opportunities
curl http://localhost:8000/api/v1/opportunities
```

### Test Frontend

Open http://localhost:3000 in your browser. You should see:
- Header with "Warframe Trade Helper"
- Controls for platform, strategy, and thresholds
- Data table with Warframe opportunities
- Live connection indicator

## Troubleshooting

### Docker Issues

**Docker daemon not running:**
```bash
# Check Docker status
docker ps

# Start Docker Desktop (macOS/Windows)
# Or start Docker service (Linux)
sudo systemctl start docker
```

**Permission denied:**
```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
# Log out and back in
```

**Port already in use:**
```bash
# Find process using port
lsof -i :3000
lsof -i :8000

# Kill process or change port in docker-compose.yml
```

### Application Issues

**Backend not connecting to database:**
```bash
# Wait for database to be ready
docker compose logs db

# Check database health
docker compose exec db pg_isready -U postgres

# Restart backend
docker compose restart backend
```

**Frontend can't reach backend:**
```bash
# Check backend is running
curl http://localhost:8000/api/v1/healthz

# Check CORS settings in .env
# Verify BACKEND_CORS_ORIGINS includes frontend URL
```

**WebSocket connection fails:**
```bash
# Check backend WebSocket endpoint
# Open browser dev tools and check console for errors
# Verify WS_URL in frontend .env
```

**No market data appearing:**
```bash
# Check backend logs for API errors
docker compose logs backend | grep -i error

# Warframe Market API might be rate limiting
# Wait a few minutes and check logs
```

### Development Issues

**Backend tests failing:**
```bash
cd backend
pytest -v  # Verbose output
pytest --lf  # Run only last failed
```

**Frontend tests failing:**
```bash
cd frontend
npm test -- --reporter=verbose
```

**Type errors:**
```bash
# Backend
cd backend
mypy app/

# Frontend
cd frontend
npm run build  # TypeScript check
```

## Updating

### Pull Latest Changes

```bash
git pull origin main
```

### Rebuild Containers

```bash
# Stop services
docker compose down

# Rebuild and start
./start.sh
```

### Update Dependencies

**Backend:**
```bash
cd backend
pip install -e ".[dev]" --upgrade
```

**Frontend:**
```bash
cd frontend
npm update
```

## Uninstall

### Remove Containers and Volumes

```bash
docker compose down -v
```

### Remove Images

```bash
docker rmi warframe-trade-helper-backend
docker rmi warframe-trade-helper-frontend
```

### Remove Source Code

```bash
cd ..
rm -rf warframe-trade-helper
```

## Next Steps

After successful setup:

1. **Explore the UI**: Try different strategies and platforms
2. **Add to Watchlist**: Star your favorite Warframes
3. **Check Details**: Click "Details" to see price breakdowns
4. **Monitor Real-time**: Watch for live updates
5. **Adjust Thresholds**: Filter by minimum profit/margin

For more information:
- [README.md](README.md) - Main documentation
- [backend/README.md](backend/README.md) - Backend details
- [frontend/README.md](frontend/README.md) - Frontend details

