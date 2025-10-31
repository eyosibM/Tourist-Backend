#!/bin/bash

# =============================================================================
# TOURLICITY SERVER DIAGNOSTIC SCRIPT
# =============================================================================

set -e

echo "🔍 Diagnosing Tourlicity Server Status..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EC2_IP="51.20.34.93"
KEY_PATH="C:/Users/hp/Downloads/tourlicity-key.pem"

echo -e "${BLUE}📋 Server Configuration:${NC}"
echo "   EC2 IP: $EC2_IP"
echo "   Domain: tourlicity.duckdns.org"
echo ""

# Step 1: Check if server is reachable
echo -e "${YELLOW}🔍 Step 1: Checking server connectivity...${NC}"
if ssh -i "$KEY_PATH" -o ConnectTimeout=10 ubuntu@$EC2_IP "echo 'Server is reachable'"; then
    echo -e "${GREEN}✅ Server is reachable${NC}"
else
    echo -e "${RED}❌ Cannot connect to server${NC}"
    exit 1
fi

# Step 2: Check Docker status
echo -e "${YELLOW}🐳 Step 2: Checking Docker containers...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

echo "📊 Container Status:"
docker-compose -f docker-compose.freetier.yml ps

echo ""
echo "🔍 Running Containers:"
docker ps

echo ""
echo "📋 Docker Compose Services:"
docker-compose -f docker-compose.freetier.yml config --services
EOF

# Step 3: Check port availability
echo -e "${YELLOW}🔌 Step 3: Checking port availability...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
echo "🔍 Checking if ports are listening:"
netstat -tlnp | grep -E ':(80|443|5000|27017|6379) '

echo ""
echo "🔍 Checking nginx process:"
ps aux | grep nginx | grep -v grep || echo "No nginx process found"

echo ""
echo "🔍 Checking if port 80 is accessible:"
curl -I http://localhost:80 2>/dev/null || echo "Port 80 not accessible"

echo ""
echo "🔍 Checking if API is accessible:"
curl -I http://localhost:5000/health 2>/dev/null || echo "API not accessible"
EOF

# Step 4: Check logs for errors
echo -e "${YELLOW}📋 Step 4: Checking recent logs...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

echo "📋 Recent Docker Compose Logs:"
docker-compose -f docker-compose.freetier.yml logs --tail=30

echo ""
echo "📋 Nginx Logs (if available):"
docker logs tourlicity-nginx --tail=20 2>/dev/null || echo "No nginx logs available"

echo ""
echo "📋 API Logs:"
docker logs tourlicity-api --tail=20 2>/dev/null || echo "No API logs available"
EOF

# Step 5: Test external connectivity
echo -e "${YELLOW}🌐 Step 5: Testing external connectivity...${NC}"
echo "🔍 Testing domain resolution:"
nslookup tourlicity.duckdns.org || echo "Domain resolution failed"

echo ""
echo "🔍 Testing HTTP connection to domain:"
curl -I http://tourlicity.duckdns.org --connect-timeout 10 2>/dev/null || echo "HTTP connection failed"

echo ""
echo "🔍 Testing direct IP connection:"
curl -I http://$EC2_IP --connect-timeout 10 2>/dev/null || echo "Direct IP connection failed"

echo ""
echo -e "${BLUE}🎯 Diagnosis Complete!${NC}"
echo "=========================================="
echo -e "${YELLOW}If issues were found, run the update deployment script to fix them.${NC}"