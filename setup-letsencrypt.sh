#!/bin/bash

# Setup Let's Encrypt SSL Certificate for Production
echo "🔐 Setting up Let's Encrypt SSL certificate..."

cd ~/Tourist-Backend

# Install certbot
echo "📦 Installing certbot..."
sudo apt update
sudo apt install -y certbot

# Stop nginx temporarily to allow certbot to bind to port 80
echo "🛑 Stopping nginx temporarily..."
docker-compose -f docker-compose.freetier.yml stop nginx

# Generate Let's Encrypt certificate
echo "🔐 Generating Let's Encrypt certificate..."
sudo certbot certonly --standalone \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d tourlicity.duckdns.org

# Copy certificates to our SSL directory
echo "📋 Copying certificates..."
sudo cp /etc/letsencrypt/live/tourlicity.duckdns.org/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/tourlicity.duckdns.org/privkey.pem docker/nginx/ssl/
sudo chown $USER:$USER docker/nginx/ssl/*.pem

# Update nginx config to use Let's Encrypt certificates
echo "⚙️ Updating nginx configuration..."
sed -i 's|ssl_certificate /etc/nginx/ssl/selfsigned.crt;|ssl_certificate /etc/nginx/ssl/fullchain.pem;|' docker/nginx/nginx.prod.conf
sed -i 's|ssl_certificate_key /etc/nginx/ssl/selfsigned.key;|ssl_certificate_key /etc/nginx/ssl/privkey.pem;|' docker/nginx/nginx.prod.conf

# Restart nginx with the new certificates
echo "🚀 Starting nginx with Let's Encrypt certificates..."
docker-compose -f docker-compose.freetier.yml up -d nginx

# Wait for nginx to start
sleep 10

# Test the new certificate
echo "🧪 Testing HTTPS with trusted certificate..."
curl -v https://tourlicity.duckdns.org/health

echo "✅ Let's Encrypt setup complete!"
echo "📝 Your site should now show a trusted certificate in browsers."
echo "🔄 Certificate will auto-renew. Set up a cron job for renewal if needed."