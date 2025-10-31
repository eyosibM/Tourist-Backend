#!/bin/bash

# =============================================================================
# QUICK EC2 UPDATE SCRIPT
# =============================================================================
# Simple script to update your EC2 deployment with latest code
# =============================================================================

echo "🔄 Quick Update: Pulling latest code to EC2..."

# Configuration
EC2_IP="51.20.34.93"
KEY_PATH="/c/Users/hp/Downloads/tourlicity-key.pem"

# Update deployment
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

echo "🛑 Stopping containers..."
docker-compose -f docker-compose.freetier.yml down

echo "📥 Pulling latest code..."
git pull origin main || git pull origin master

echo "🐳 Restarting containers..."
docker-compose -f docker-compose.freetier.yml up -d --build

echo "✅ Update complete!"

echo "📊 Container status:"
docker-compose -f docker-compose.freetier.yml ps

echo "🔍 Testing API..."
sleep 10
curl -s http://localhost:5000/health || echo "API starting up..."
EOF

echo "🎉 Quick update completed!"
echo "🌐 API: http://51.20.34.93:5000"