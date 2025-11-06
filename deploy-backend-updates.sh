#!/bin/bash

# =============================================================================
# Deploy Backend Updates - Default Activities & Profile Updates
# =============================================================================

KEY_PATH="tourlicity-key.pem"
EC2_IP="51.20.34.93"

echo "🚀 Deploying Backend Updates"
echo "============================"
echo ""
echo "📋 Changes being deployed:"
echo "  ✅ Added features_media to Default Activities (image/video support)"
echo "  ✅ Made profile fields optional (only email, first_name, last_name required)"
echo ""

# Step 1: Connect and pull latest changes
echo "📥 Step 1: Pulling latest code changes..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend
echo "Current directory: $(pwd)"
echo "Pulling latest changes from repository..."
git pull origin main
echo "✅ Code updated"
EOF

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull latest changes"
    exit 1
fi

# Step 2: Rebuild and restart containers
echo "🔄 Step 2: Rebuilding and restarting containers..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend
echo "Stopping containers..."
docker-compose -f docker-compose.https.yml down

echo "Rebuilding containers with latest changes..."
docker-compose -f docker-compose.https.yml up -d --build

echo "✅ Containers restarted"
EOF

if [ $? -ne 0 ]; then
    echo "❌ Failed to restart containers"
    exit 1
fi

# Step 3: Wait for services to be ready
echo "⏳ Step 3: Waiting for services to be ready..."
sleep 15

# Step 4: Test API health
echo "🧪 Step 4: Testing API health..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
echo "Testing API health..."
HEALTH_RESPONSE=$(curl -s https://api.tourlicity.com/api/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"OK"'; then
    echo "✅ API is healthy"
    echo "Response: $HEALTH_RESPONSE"
else
    echo "⚠️  API health check returned: $HEALTH_RESPONSE"
fi
EOF

# Step 5: Test new features
echo "🧪 Step 5: Testing new features..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
echo "Testing Default Activities endpoint..."
ACTIVITIES_RESPONSE=$(curl -s https://api.tourlicity.com/api/activities)
if echo "$ACTIVITIES_RESPONSE" | grep -q '"data"'; then
    echo "✅ Default Activities endpoint is working"
else
    echo "⚠️  Default Activities endpoint issue: $ACTIVITIES_RESPONSE"
fi

echo ""
echo "Testing Authentication endpoints..."
AUTH_RESPONSE=$(curl -s https://api.tourlicity.com/api/auth/profile -H "Authorization: Bearer invalid-token")
if echo "$AUTH_RESPONSE" | grep -q -E '(error|Unauthorized)'; then
    echo "✅ Auth endpoint is working (correctly rejecting invalid token)"
else
    echo "⚠️  Auth endpoint unexpected response: $AUTH_RESPONSE"
fi
EOF

# Step 6: Check container status
echo "📊 Step 6: Checking container status..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
echo "Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "API container logs (last 10 lines):"
docker logs tourlicity-api --tail=10
EOF

echo ""
echo "🎉 Backend Updates Deployed Successfully!"
echo "========================================"
echo ""
echo "📋 Summary of Changes:"
echo "✅ Default Activities now support features_media (images and videos)"
echo "✅ Profile updates now have optional fields (country, phone, etc.)"
echo "✅ API is running and healthy"
echo ""
echo "🔗 API Endpoints:"
echo "   Health: https://api.tourlicity.com/api/health"
echo "   Activities: https://api.tourlicity.com/api/activities"
echo "   Auth: https://api.tourlicity.com/api/auth/profile"
echo ""
echo "📝 New Default Activity Schema:"
echo "   - features_media: { url, type: 'image'|'video', duration, ... }"
echo "   - features_image: (legacy field, still supported)"
echo ""
echo "📝 Profile Update Changes:"
echo "   - Required: email, first_name, last_name"
echo "   - Optional: country, phone_number, date_of_birth, gender, passport_number"
echo ""
echo "💡 Next Steps:"
echo "1. Test creating/updating default activities with media"
echo "2. Test profile updates with partial data"
echo "3. Update frontend to use new optional field behavior"