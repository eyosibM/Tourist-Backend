#!/bin/bash

# Tourlicity Docker Deployment Script
set -e

echo "🚀 Tourlicity Docker Deployment"
echo "==============================="

# Configuration
ENVIRONMENT=${1:-development}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.yml -f docker-compose.prod.yml"
    echo "📦 Production deployment mode"
else
    echo "🔧 Development deployment mode"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.docker .env
    echo "✅ Please edit .env file with your configuration"
    echo "   Then run this script again"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

echo "🔍 Checking Docker status..."
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p docker/mongodb/data
mkdir -p docker/redis/data
mkdir -p docker/nginx/ssl

# Generate self-signed SSL certificate for development
if [ "$ENVIRONMENT" != "production" ] && [ ! -f docker/nginx/ssl/cert.pem ]; then
    echo "🔐 Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout docker/nginx/ssl/key.pem \
        -out docker/nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

# Pull latest images
echo "📥 Pulling Docker images..."
docker-compose -f $COMPOSE_FILE pull

# Build custom images
echo "🔨 Building application image..."
docker-compose -f $COMPOSE_FILE build

# Start services
echo "🚀 Starting services..."
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose -f $COMPOSE_FILE --profile production up -d
else
    docker-compose -f $COMPOSE_FILE up -d
fi

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health checks
echo "🏥 Running health checks..."

# Check API
if curl -f http://localhost:5000/health &> /dev/null; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
    docker-compose -f $COMPOSE_FILE logs api
fi

# Check MongoDB
if docker exec tourlicity-mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    echo "✅ MongoDB is healthy"
else
    echo "❌ MongoDB health check failed"
    docker-compose -f $COMPOSE_FILE logs mongodb
fi

# Check Redis
if docker exec tourlicity-redis redis-cli ping &> /dev/null; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
    docker-compose -f $COMPOSE_FILE logs redis
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Service URLs:"
echo "   API:          http://localhost:5000"
echo "   Health:       http://localhost:5000/health"
echo "   API Docs:     http://localhost:5000/api-docs"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "   Nginx:        http://localhost (redirects to HTTPS)"
    echo "   Nginx HTTPS:  https://localhost"
fi
echo ""
echo "🔧 Management Commands:"
echo "   View logs:    docker-compose -f $COMPOSE_FILE logs -f"
echo "   Stop:         docker-compose -f $COMPOSE_FILE down"
echo "   Restart:      docker-compose -f $COMPOSE_FILE restart"
echo "   Status:       docker-compose -f $COMPOSE_FILE ps"
echo ""
echo "📈 Monitoring:"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "   Prometheus:   http://localhost:9090"
    echo "   Grafana:      http://localhost:3001 (admin/admin123)"
fi
echo "   Container stats: docker stats"
echo ""

# Show running containers
echo "📋 Running containers:"
docker-compose -f $COMPOSE_FILE ps