#!/bin/bash

# Warframe Trade Helper - VPS Deployment Script
# This script automates deployment on a VPS (DigitalOcean, Linode, Hetzner, etc.)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════╗
║    Warframe Trade Helper - VPS Deployment           ║
╚══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to print colored messages
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_warning "Running as root. Consider creating a dedicated user for production."
fi

# Check if Docker is installed
print_step "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Installing..."
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    print_success "Docker installed successfully"
else
    print_success "Docker is already installed"
fi

# Check if Docker Compose is installed
print_step "Checking Docker Compose installation..."
if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose is not installed. Installing..."
    
    # Install Docker Compose
    apt-get update
    apt-get install -y docker-compose-plugin
    
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose is already installed"
fi

# Create .env file if it doesn't exist
print_step "Checking environment configuration..."
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success ".env file created"
        print_warning "Please edit .env file with your settings before continuing"
        read -p "Press Enter after editing .env file, or Ctrl+C to exit..."
    else
        print_error ".env.example not found. Using defaults."
    fi
else
    print_success ".env file exists"
fi

# Ask which profile to use
echo ""
print_step "Select deployment mode:"
echo "  1) Without database (lighter, recommended for small deployments)"
echo "  2) With PostgreSQL database (for production with data persistence)"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        PROFILE="no-db"
        print_success "Selected: No database mode"
        ;;
    2)
        PROFILE="with-db"
        print_success "Selected: With database mode"
        ;;
    *)
        print_error "Invalid choice. Defaulting to no-db mode."
        PROFILE="no-db"
        ;;
esac

# Stop any existing containers
print_step "Stopping existing containers..."
docker compose --profile $PROFILE down 2>/dev/null || true
print_success "Containers stopped"

# Build images
print_step "Building Docker images (this may take a few minutes)..."
docker compose --profile $PROFILE build

if [ $? -eq 0 ]; then
    print_success "Images built successfully"
else
    print_error "Build failed. Check the error messages above."
    exit 1
fi

# Start containers
print_step "Starting containers..."
docker compose --profile $PROFILE up -d

if [ $? -eq 0 ]; then
    print_success "Containers started successfully"
else
    print_error "Failed to start containers. Check the error messages above."
    exit 1
fi

# Wait for services to be ready
print_step "Waiting for services to start (30 seconds)..."
sleep 30

# Check if services are running
print_step "Checking service health..."

# Check backend
if curl -f http://localhost:8000/api/v1/config &> /dev/null; then
    print_success "Backend is healthy"
else
    print_warning "Backend may not be ready yet. Check logs with: docker compose logs backend-$PROFILE"
fi

# Check frontend
if curl -f http://localhost:3000 &> /dev/null; then
    print_success "Frontend is healthy"
else
    print_warning "Frontend may not be ready yet. Check logs with: docker compose logs frontend"
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

# Print success message
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════╗
║            DEPLOYMENT SUCCESSFUL! 🎉                 ║
╚══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
print_success "Application is now running!"
echo ""
echo "Access your application at:"
echo -e "  ${BLUE}http://${SERVER_IP}:3000${NC}"
echo ""
echo "API endpoint:"
echo -e "  ${BLUE}http://${SERVER_IP}:8000${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:        docker compose --profile $PROFILE logs -f"
echo "  Stop application: docker compose --profile $PROFILE down"
echo "  Restart:          docker compose --profile $PROFILE restart"
echo "  Update app:       git pull && docker compose --profile $PROFILE up -d --build"
echo ""
print_warning "Next steps:"
echo "  1. Setup a domain name and point it to: $SERVER_IP"
echo "  2. Install Nginx as reverse proxy for HTTPS"
echo "  3. Setup SSL certificate with Let's Encrypt"
echo "  4. Configure firewall (UFW)"
echo "  5. Setup monitoring and backups"
echo ""
print_step "For detailed instructions, see: DEPLOYMENT.md"
echo ""

