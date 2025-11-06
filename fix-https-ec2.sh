#!/bin/bash

# Fix HTTPS on EC2 - Deploy the corrected nginx configuration
echo "🔧 Fixing HTTPS configuration on EC2..."

# Navigate to the project directory
cd ~/Tourist-Backend

echo "📋 Current container status:"
docker-compose -f docker-compose.freetier.yml ps

echo "🛑 Stopping nginx container..."
docker-compose -f docker-compose.freetier.yml stop nginx

echo "🗑️ Removing nginx container to force recreation..."
docker-compose -f docker-compose.freetier.yml rm -f nginx

echo "📁 Creating SSL directory if it doesn't exist..."
mkdir -p docker/nginx/ssl

echo "🔐 Creating self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout docker/nginx/ssl/selfsigned.key \
    -out docker/nginx/ssl/selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=tourlicity.duckdns.org"

echo "🚀 Starting nginx with the corrected configuration..."
docker-compose -f docker-compose.freetier.yml up -d nginx

echo "⏳ Waiting for nginx to start..."
sleep 10

echo "🔍 Checking if nginx is listening on both ports..."
docker exec tourlicity-nginx netstat -tlnp | grep -E ':(80|443)'

echo "🧪 Testing HTTP (should redirect to HTTPS)..."
curl -I http://tourlicity.duckdns.org/health

echo "🧪 Testing HTTPS (should work now)..."
curl -k -I https://tourlicity.duckdns.org/health

echo "✅ HTTPS setup complete!"
echo "📝 Note: Using self-signed certificate. For production, consider using Let's Encrypt."