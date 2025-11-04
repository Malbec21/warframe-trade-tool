#!/bin/bash

# Warframe Trade Helper - Startup Script
# This script checks for prerequisites and starts the application

set -e

echo "╔═══════════════════════════════════════════════════════╗"
echo "║     Warframe Trade Helper - Startup Script            ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not available"
    echo "Please install Docker Compose or upgrade Docker to the latest version"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Check if .env file exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created. You can edit it to customize settings."
    else
        echo "⚠️  Warning: .env.example not found. Using default settings."
    fi
else
    echo "✅ .env file found"
fi

echo ""

# Ask user if they want to use database
read -p "Do you want to use PostgreSQL database for price history? (Y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "🚀 Starting without database (memory-only mode)..."
    PROFILE="no-db"
    # Update .env to disable database
    if [ -f .env ]; then
        sed -i.bak 's/USE_DB=true/USE_DB=false/' .env 2>/dev/null || \
        sed -i '' 's/USE_DB=true/USE_DB=false/' .env 2>/dev/null || true
    fi
else
    echo "🚀 Starting with database..."
    PROFILE="with-db"
    # Update .env to enable database
    if [ -f .env ]; then
        sed -i.bak 's/USE_DB=false/USE_DB=true/' .env 2>/dev/null || \
        sed -i '' 's/USE_DB=false/USE_DB=true/' .env 2>/dev/null || true
    fi
fi

echo ""
echo "📦 Building and starting Docker containers..."
echo "This may take a few minutes on first run..."
echo ""

# Start the services
docker compose --profile $PROFILE up -d --build

# Wait a moment for services to initialize
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check if services are running
if docker compose --profile $PROFILE ps | grep -q "Up"; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║            Application Started Successfully!          ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""
    echo "📍 Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
    echo ""
    echo "💡 Useful commands:"
    echo "   View logs:      docker compose logs -f"
    echo "   Stop app:       docker compose down"
    echo "   Restart:        docker compose restart"
    echo "   Clean up:       docker compose down -v"
    echo ""
    echo "📖 For more information, see README.md"
    echo ""
else
    echo ""
    echo "❌ Error: Services failed to start properly"
    echo "Check logs with: docker compose logs"
    exit 1
fi

