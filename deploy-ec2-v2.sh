#!/bin/bash

# Tourlicity Backend v2.0.0 - EC2 Deployment Script
# Run this script on your EC2 instance after pushing changes to git

set -e  # Exit on any error

echo "🚀 Tourlicity Backend v2.0.0 - EC2 Deployment"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Please do not run this script as root${NC}"
   exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Navigate to project directory
PROJECT_DIR="$HOME/Tourist-Backend"
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}✅ Changed to project directory: $PROJECT_DIR${NC}"
echo ""

# Stage 1: Backup current state
echo -e "${CYAN}📦 Stage 1: Creating backup...${NC}"
BACKUP_DIR="$HOME/backups/tourlicity-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r .env "$BACKUP_DIR/" 2>/dev/null || echo "No .env to backup"
echo -e "${GREEN}✅ Backup created at: $BACKUP_DIR${NC}"
echo ""

# Stage 2: Pull latest changes
echo -e "${CYAN}🔄 Stage 2: Pulling latest changes from git...${NC}"
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "   Current branch: $CURRENT_BRANCH"

# Stash any local changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Local changes detected, stashing...${NC}"
    git stash
fi

git pull origin "$CURRENT_BRANCH"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Latest changes pulled${NC}"
echo ""

# Stage 3: Check for dependency updates
echo -e "${CYAN}📚 Stage 3: Checking dependencies...${NC}"
if [ -f "package.json" ]; then
    # Check if package.json was updated
    if git diff HEAD@{1} HEAD -- package.json | grep -q "version"; then
        echo -e "${YELLOW}   Package.json updated, installing dependencies...${NC}"
        npm install --production
        echo -e "${GREEN}✅ Dependencies updated${NC}"
    else
        echo -e "${GREEN}✅ No dependency updates needed${NC}"
    fi
fi
echo ""

# Stage 4: Stop current containers
echo -e "${CYAN}🛑 Stage 4: Stopping current containers...${NC}"
docker-compose down
echo -e "${GREEN}✅ Containers stopped${NC}"
echo ""

# Stage 5: Rebuild and start containers
echo -e "${CYAN}🔨 Stage 5: Building and starting containers...${NC}"
docker-compose up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Container startup failed${NC}"
    echo -e "${YELLOW}   Attempting to restore from backup...${NC}"
    docker-compose down
    docker-compose up -d
    exit 1
fi

echo -e "${GREEN}✅ Containers started${NC}"
echo ""

# Stage 6: Wait for services to be ready
echo -e "${CYAN}⏳ Stage 6: Waiting for services to be ready...${NC}"
sleep 10

# Check API health
echo "   Checking API health..."
for i in {1..30}; do
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ API health check failed${NC}"
        echo "   Showing recent logs:"
        docker-compose logs --tail=50 api
        exit 1
    fi
    echo "   Waiting... ($i/30)"
    sleep 2
done
echo ""

# Stage 7: Verify deployment
echo -e "${CYAN}🔍 Stage 7: Verifying deployment...${NC}"

# Check container status
echo "   Container Status:"
docker-compose ps

# Check API version
echo ""
echo "   API Version:"
curl -s http://localhost:5000/health | jq -r '.environment, .status' || echo "   Could not fetch version"

# Check cache status
echo ""
echo "   Cache Status:"
CACHE_STATUS=$(curl -s http://localhost:5000/health | jq -r '.cache.connected' 2>/dev/null || echo "unknown")
if [ "$CACHE_STATUS" = "true" ]; then
    echo -e "${GREEN}   ✅ Redis cache connected${NC}"
else
    echo -e "${YELLOW}   ⚠️  Redis cache not connected${NC}"
fi

# Check database status
echo ""
echo "   Database Status:"
DB_STATUS=$(curl -s http://localhost:5000/health | jq -r '.services.database' 2>/dev/null || echo "unknown")
if [ "$DB_STATUS" = "connected" ]; then
    echo -e "${GREEN}   ✅ MongoDB connected${NC}"
else
    echo -e "${RED}   ❌ MongoDB not connected${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment verification complete${NC}"
echo ""

# Stage 8: Cleanup old Docker images
echo -e "${CYAN}🧹 Stage 8: Cleaning up old Docker images...${NC}"
docker image prune -f > /dev/null 2>&1
echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

# Display summary
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${CYAN}📊 Deployment Summary:${NC}"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Version: v2.0.0"
echo "   Branch: $CURRENT_BRANCH"
echo "   Backup: $BACKUP_DIR"
echo "   API URL: https://api.tourlicity.com"
echo "   Docs: https://api.tourlicity.com/api-docs"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}📋 Post-Deployment Checklist:${NC}"
echo "   1. Test API health: curl https://api.tourlicity.com/health"
echo "   2. Check documentation: https://api.tourlicity.com/api-docs"
echo "   3. Verify new features: curl https://api.tourlicity.com/api/activities"
echo "   4. Monitor logs: docker-compose logs -f --tail=50"
echo ""

echo -e "${CYAN}🔧 Useful Commands:${NC}"
echo "   View logs:        docker-compose logs -f"
echo "   Restart API:      docker-compose restart api"
echo "   Check status:     docker-compose ps"
echo "   Stop all:         docker-compose down"
echo "   View health:      curl http://localhost:5000/health/detailed | jq"
echo ""

# Optional: Run tests
read -p "Do you want to run API tests? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}🧪 Running API tests...${NC}"
    node scripts/test-new-features.js
fi

echo ""
echo -e "${GREEN}✨ All done! Your API is now running v2.0.0${NC}"
echo ""
