#!/bin/bash
# Quick fix for Docker build issue on EC2

echo "🔧 Fixing Docker build issue..."
echo ""

# Pull the latest Dockerfile fix
echo "📥 Pulling latest changes..."
git pull origin main

# Clean up Docker to ensure fresh build
echo "🧹 Cleaning Docker cache..."
docker system prune -f

# Rebuild with no cache
echo "🔨 Rebuilding containers (this may take a few minutes)..."
docker-compose build --no-cache

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 15

# Check health
echo "🏥 Checking API health..."
curl -f http://localhost:5000/health

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📊 Container Status:"
    docker-compose ps
else
    echo ""
    echo "❌ Health check failed. Checking logs..."
    docker-compose logs --tail=50
fi

echo ""
echo "🎉 Done! Your API should now be running."
echo ""
