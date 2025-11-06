#!/bin/bash

# =============================================================================
# Quick CORS Fix - One Command Solution
# =============================================================================
# This script fixes CORS to allow both www and non-www domains
# Run this on your EC2 server: ssh -i tourlicity-key.pem ubuntu@51.20.34.93
# =============================================================================

echo "🔧 Applying CORS fix for both www and non-www domains..."

# Navigate to project directory
cd Tourist-Backend

# Update CORS configuration
echo "⚙️  Updating CORS configuration..."
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://www.tourist.duckdns.org,https://tourist.duckdns.org,https://tourlicity.com,http://localhost:3000,http://localhost:5173|' .env
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://www.tourist.duckdns.org|' .env

# Verify changes
echo "✅ Configuration updated:"
grep "CORS_ORIGIN" .env
grep "FRONTEND_URL" .env

# Restart services
echo "🔄 Restarting API service..."
docker-compose down
docker-compose up -d --build

# Wait for service to start
echo "⏳ Waiting for service to start..."
sleep 15

# Test health
echo "🧪 Testing API health..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.tourlicity.com/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API is healthy (HTTP $HTTP_CODE)"
else
    echo "⚠️  API returned HTTP $HTTP_CODE"
fi

# Test CORS
echo "🌐 Testing CORS headers..."
CORS_HEADER=$(curl -s -H "Origin: https://www.tourist.duckdns.org" -I https://api.tourlicity.com/health | grep -i "access-control-allow-origin" | head -1)
if [ -n "$CORS_HEADER" ]; then
    echo "✅ CORS headers present: $CORS_HEADER"
else
    echo "⚠️  No CORS headers found"
fi

echo ""
echo "🎉 CORS fix completed!"
echo "✅ Both https://www.tourist.duckdns.org and https://tourist.duckdns.org are now allowed"
echo "✅ API should be accessible from your frontend"
echo ""
echo "💡 Test your frontend now - the CORS errors should be resolved!"