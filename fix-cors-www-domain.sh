#!/bin/bash

# =============================================================================
# QUICK CORS FIX FOR WWW.TOURIST.DUCKDNS.ORG
# =============================================================================
# This script updates CORS settings to allow www.tourist.duckdns.org
# =============================================================================

set -e  # Exit on any error

echo "🔧 Fixing CORS for www.tourist.duckdns.org..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EC2_IP="51.20.34.93"
KEY_PATH="C:/Users/hp/Downloads/tourlicity-key.pem"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   EC2 IP: $EC2_IP"
echo "   Adding: https://www.tourist.duckdns.org to CORS"
echo ""

# Step 1: Update CORS configuration on EC2
echo -e "${YELLOW}⚙️  Step 1: Updating CORS configuration...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update CORS_ORIGIN to include www.tourist.duckdns.org
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://www.tourist.duckdns.org,https://tourist.duckdns.org,https://tourist-frontend-c8ji.vercel.app,http://localhost:3000,http://localhost:5173|' .env

# Also update FRONTEND_URL
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://www.tourist.duckdns.org|' .env

echo "✅ CORS configuration updated"
echo "📋 Current CORS setting:"
grep "CORS_ORIGIN" .env
EOF

# Step 2: Restart the API container
echo -e "${YELLOW}🔄 Step 2: Restarting API container...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

# Restart only the API container to pick up new environment
docker-compose -f docker-compose.freetier.yml restart api

echo "✅ API container restarted"
EOF

# Step 3: Wait for service to be ready
echo -e "${YELLOW}⏳ Step 3: Waiting for service to be ready...${NC}"
sleep 10

# Step 4: Test the fix
echo -e "${YELLOW}🧪 Step 4: Testing CORS fix...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
echo "🔍 Testing API health..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.tourlicity.com/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API is healthy (HTTP $HTTP_CODE)"
else
    echo "❌ API health check failed (HTTP $HTTP_CODE)"
fi

echo ""
echo "🌐 Testing CORS headers for www.tourist.duckdns.org..."
CORS_HEADER=$(curl -s -H "Origin: https://www.tourist.duckdns.org" -I https://api.tourlicity.com/health | grep -i "access-control-allow-origin" | head -1)
if [ -n "$CORS_HEADER" ]; then
    echo "✅ CORS headers present: $CORS_HEADER"
else
    echo "❌ CORS headers missing"
fi

echo ""
echo "📋 Container status:"
docker-compose -f docker-compose.freetier.yml ps api
EOF

echo ""
echo -e "${GREEN}🎉 CORS FIX COMPLETE!${NC}"
echo "=============================================="
echo -e "${BLUE}📍 Your API should now accept requests from:${NC}"
echo "   🌐 https://www.tourist.duckdns.org"
echo "   🌐 https://tourist.duckdns.org"
echo "   🌐 https://tourist-frontend-c8ji.vercel.app"
echo ""
echo -e "${BLUE}🧪 Test your file upload now:${NC}"
echo "   Try uploading a file from your frontend"
echo ""
echo -e "${GREEN}✅ CORS fix deployed successfully!${NC}"