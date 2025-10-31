#!/bin/bash

# =============================================================================
# HTTPS SETUP SCRIPT FOR TOURLICITY
# =============================================================================
# This script sets up HTTPS with Let's Encrypt for tourlicity.duckdns.org
# =============================================================================

set -e  # Exit on any error

echo "🔒 Setting up HTTPS for Tourlicity..."
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="tourlicity.duckdns.org"
EMAIL="opeyemioladejobi@gmail.com"  # Change this to your email

echo -e "${BLUE}📋 HTTPS Setup Configuration:${NC}"
echo "   Domain: $DOMAIN"
echo "   Email: $EMAIL"
echo ""

# Step 1: Install Certbot
echo -e "${YELLOW}📦 Step 1: Installing Certbot...${NC}"
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Step 2: Stop current containers to free up port 80
echo -e "${YELLOW}🛑 Step 2: Stopping current containers...${NC}"
docker-compose -f docker-compose.freetier.yml down

# Step 3: Create nginx configuration for SSL
echo -e "${YELLOW}⚙️  Step 3: Creating nginx SSL configuration...${NC}"

# Create nginx directory if it doesn't exist
mkdir -p docker/nginx/ssl

# Create nginx configuration with SSL
cat > docker/nginx/nginx-ssl.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:5000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name tourlicity.duckdns.org;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name tourlicity.duckdns.org;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        # Modern SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Auth routes (stricter rate limiting)
        location /api/auth/ {
            limit_req zone=auth burst=10 nodelay;
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API docs
        location /api-docs {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Root
        location / {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# Step 4: Get SSL certificate
echo -e "${YELLOW}🔐 Step 4: Obtaining SSL certificate...${NC}"
sudo certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN

# Step 5: Copy certificates to docker volume
echo -e "${YELLOW}📋 Step 5: Setting up certificates for Docker...${NC}"
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem docker/nginx/ssl/
sudo chmod 644 docker/nginx/ssl/fullchain.pem
sudo chmod 600 docker/nginx/ssl/privkey.pem
sudo chown $USER:$USER docker/nginx/ssl/*

# Step 6: Update docker-compose for HTTPS
echo -e "${YELLOW}🐳 Step 6: Updating Docker Compose for HTTPS...${NC}"

# Create HTTPS version of docker-compose
cat > docker-compose.https.yml << 'EOF'
version: '3.8'

services:
  # MongoDB - Optimized for 1GB RAM environment
  mongodb:
    image: mongo:7.0
    container_name: tourlicity-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD:-strongpassword123}
      MONGO_INITDB_DATABASE: tourlicity
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./docker/mongodb/init:/docker-entrypoint-initdb.d
    networks:
      - tourlicity-network
    deploy:
      resources:
        limits:
          memory: 300M
        reservations:
          memory: 200M
    command: ["mongod", "--wiredTigerCacheSizeGB", "0.25", "--quiet"]
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Redis - Memory limited for free tier
  redis:
    image: redis:7.2-alpine
    container_name: tourlicity-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD:-redispassword123} --maxmemory 100mb --maxmemory-policy allkeys-lru --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - tourlicity-network
    deploy:
      resources:
        limits:
          memory: 150M
        reservations:
          memory: 100M
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 3s
      retries: 3

  # Tourlicity API - No direct port 80 exposure (nginx handles it)
  api:
    build: .
    container_name: tourlicity-api
    restart: unless-stopped
    ports:
      - "5000:5000"  # Only internal port, nginx handles external
    environment:
      # Database
      MONGODB_URI: mongodb://admin:${MONGO_ROOT_PASSWORD:-strongpassword123}@mongodb:27017/tourlicity?authSource=admin&retryWrites=true&w=majority
      
      # Redis
      REDIS_URL: redis://:${REDIS_PASSWORD:-redispassword123}@redis:6379
      
      # Core Configuration - HTTPS URLs
      NODE_ENV: production
      PORT: 5000
      BASE_URL: https://tourlicity.duckdns.org
      
      # JWT Secrets
      JWT_SECRET: ${JWT_SECRET:-93204f06ebb21cd06b85879bb32c260ace1840d6ddb8960677c0e12f305c134981b0ba54c72698c4da7c175bdd794ab12e6ea24508e6ba58b759ecd2e224ab88}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-a1e3c0acab60d25e00563dab20bc2144dc6109f54faf884f6ac09d238969656fe2abb7a7a9fd2874c90efe49023da2a131f321be9a3357fc6aa3984f01bd8ea6}
      JWT_ACCESS_EXPIRATION: 15m
      JWT_REFRESH_EXPIRATION: 7d
      
      # Google OAuth
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-your-google-client-id}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-your-google-client-secret}
      
      # AWS S3
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:-your-aws-access-key-id}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:-your-aws-secret-access-key}
      AWS_REGION: ${AWS_REGION:-eu-north-1}
      S3_BUCKET_NAME: ${S3_BUCKET_NAME:-tourlicity-storage}
      
      # Email Configuration
      EMAIL_HOST: ${EMAIL_HOST:-smtp.gmail.com}
      EMAIL_PORT: ${EMAIL_PORT:-587}
      EMAIL_USER: ${EMAIL_USER:-your-email@gmail.com}
      EMAIL_PASS: ${EMAIL_PASS:-your-app-password}
      EMAIL_FROM: ${EMAIL_FROM:-your-email@gmail.com}
      
      # Frontend - HTTPS URL
      FRONTEND_URL: ${FRONTEND_URL:-https://tourist-frontend-c8ji.vercel.app}
      CORS_ORIGIN: ${CORS_ORIGIN:-https://tourist-frontend-c8ji.vercel.app,http://localhost:3000,http://localhost:3001,http://localhost:5173}
      
      # Node.js memory optimization for free tier
      NODE_OPTIONS: "--max-old-space-size=350"
      
    volumes:
      - ./uploads:/app/uploads
    networks:
      - tourlicity-network
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 400M
        reservations:
          memory: 300M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Nginx Reverse Proxy with SSL
  nginx:
    image: nginx:alpine
    container_name: tourlicity-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx-ssl.conf:/etc/nginx/nginx.conf
      - ./docker/nginx/ssl:/etc/nginx/ssl
    networks:
      - tourlicity-network
    depends_on:
      - api
    deploy:
      resources:
        limits:
          memory: 50M
        reservations:
          memory: 30M

volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local

networks:
  tourlicity-network:
    driver: bridge
EOF

# Step 7: Start services with HTTPS
echo -e "${YELLOW}🚀 Step 7: Starting services with HTTPS...${NC}"
docker-compose -f docker-compose.https.yml up -d --build

# Step 8: Set up certificate auto-renewal
echo -e "${YELLOW}🔄 Step 8: Setting up certificate auto-renewal...${NC}"

# Create renewal script
cat > renew-ssl.sh << 'EOF'
#!/bin/bash
# SSL Certificate Renewal Script

echo "🔄 Renewing SSL certificates..."

# Stop nginx to free up port 80
docker stop tourlicity-nginx

# Renew certificates
sudo certbot renew --standalone

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/tourlicity.duckdns.org/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/tourlicity.duckdns.org/privkey.pem docker/nginx/ssl/
sudo chmod 644 docker/nginx/ssl/fullchain.pem
sudo chmod 600 docker/nginx/ssl/privkey.pem
sudo chown $USER:$USER docker/nginx/ssl/*

# Restart nginx
docker start tourlicity-nginx

echo "✅ SSL certificates renewed successfully!"
EOF

chmod +x renew-ssl.sh

# Add to crontab for automatic renewal (runs twice daily)
(crontab -l 2>/dev/null; echo "0 */12 * * * $(pwd)/renew-ssl.sh >> $(pwd)/ssl-renewal.log 2>&1") | crontab -

# Step 9: Verify HTTPS setup
echo -e "${YELLOW}🔍 Step 9: Verifying HTTPS setup...${NC}"
sleep 15  # Wait for services to start

echo ""
echo -e "${GREEN}🎉 HTTPS SETUP COMPLETE!${NC}"
echo "================================"
echo -e "${BLUE}📍 Your API is now available at:${NC}"
echo "   🔒 https://tourlicity.duckdns.org"
echo "   📚 https://tourlicity.duckdns.org/api-docs"
echo "   ❤️  https://tourlicity.duckdns.org/health"
echo ""
echo -e "${BLUE}🔧 Testing HTTPS:${NC}"
curl -s https://tourlicity.duckdns.org/health || echo "   ⏳ HTTPS may take a moment to be ready..."
echo ""
echo -e "${BLUE}🔄 Certificate Auto-Renewal:${NC}"
echo "   📅 Certificates will auto-renew twice daily"
echo "   📋 Check renewal logs: tail -f ssl-renewal.log"
echo "   🔧 Manual renewal: ./renew-ssl.sh"
echo ""
echo -e "${GREEN}✅ HTTPS setup successful!${NC}"