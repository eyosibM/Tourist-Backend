#!/bin/bash

# =============================================================================
# Fix CORS Issue - Update Server Configuration
# =============================================================================

KEY_PATH="tourlicity-key.pem"
EC2_IP="51.20.34.93"

echo "🔧 Fixing CORS Configuration Issue"
echo "================================="
echo ""

# Step 1: Update CORS_ORIGIN in .env file
echo "⚙️  Step 1: Updating CORS configuration..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend
# Update CORS_ORIGIN to include www.tourist.duckdns.org
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://www.tourist.duckdns.org,https://tourist.duckdns.org,https://tourlicity.com,http://localhost:3000,http://localhost:5173|' .env
# Update FRONTEND_URL to match
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://www.tourist.duckdns.org|' .env
echo "✅ Updated .env file"
EOF

if [ $? -ne 0 ]; then
    echo "❌ Failed to update environment configuration"
    exit 1
fi

# Step 2: Restart the API service
echo "🔄 Step 2: Restarting API service..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend
docker-compose down
docker-compose up -d --build
echo "✅ API service restarted"
EOF

if [ $? -ne 0 ]; then
    echo "❌ Failed to restart API service"
    exit 1
fi

# Step 3: Wait for service to be ready
echo "⏳ Step 3: Waiting for service to be ready..."
sleep 10

# Step 4: Test the API
echo "🧪 Step 4: Testing API health..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
curl -s -o /dev/null -w "%{http_code}" https://api.tourlicity.com/health
echo ""
echo "✅ Health check completed"
EOF

echo ""
echo "🎉 CORS Configuration Fixed!"
echo "================================"
echo "✅ Updated CORS_ORIGIN to include: https://www.tourist.duckdns.org"
echo "✅ Updated FRONTEND_URL to: https://www.tourist.duckdns.org"
echo "✅ Restarted API service"
echo ""
echo "🔗 Your frontend should now be able to connect to:"
echo "   API: https://api.tourlicity.com"
echo "   Frontend: https://www.tourist.duckdns.org"
echo ""
echo "💡 If you still see CORS errors, try:"
echo "   1. Clear browser cache and cookies"
echo "   2. Hard refresh (Ctrl+F5)"
echo "   3. Check browser developer tools for any cached service workers"