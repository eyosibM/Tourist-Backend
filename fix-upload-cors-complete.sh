#!/bin/bash

# =============================================================================
# COMPLETE FIX FOR UPLOAD AND CORS ISSUES
# =============================================================================
# This script fixes both CORS and file upload size issues
# =============================================================================

set -e  # Exit on any error

echo "🔧 Fixing Upload and CORS Issues..."
echo "===================================="

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
echo "   Fixing: CORS + File Upload Size"
echo ""

# Step 1: Update nginx configuration with CORS headers and larger file size
echo -e "${YELLOW}⚙️  Step 1: Updating nginx configuration...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

# Backup current nginx config
cp docker/nginx/nginx.prod.conf docker/nginx/nginx.prod.conf.backup.$(date +%Y%m%d_%H%M%S)

# Create updated nginx config with CORS headers and larger file size
cat > docker/nginx/nginx.prod.conf << 'NGINXEOF'
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # File upload size - Increased to 100MB
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;

    # Upstream
    upstream api {
        server api:5000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name api.tourlicity.com tourlicity.duckdns.org 51.20.34.93;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name api.tourlicity.com tourlicity.duckdns.org 51.20.34.93;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Global file upload size
        client_max_body_size 100M;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Origin-Agent-Cluster "?1" always;

        # CORS headers for all routes
        add_header Access-Control-Allow-Origin "https://www.tourist.duckdns.org" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma" always;
        add_header Access-Control-Allow-Credentials "true" always;

        # Handle preflight OPTIONS requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://www.tourist.duckdns.org" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 86400;
            add_header Content-Type "text/plain charset=UTF-8";
            add_header Content-Length 0;
            return 204;
        }

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Auth routes (stricter rate limiting)
        location /api/auth/ {
            limit_req zone=auth burst=10 nodelay;
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Upload routes (even stricter rate limiting, larger file size)
        location /api/uploads/ {
            limit_req zone=upload burst=5 nodelay;
            client_max_body_size 100M;
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Extended timeouts for uploads
            proxy_connect_timeout 300s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
            proxy_request_buffering off;
        }

        # Health check (no rate limiting)
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
NGINXEOF

echo "✅ Nginx configuration updated with CORS headers and 100MB file size limit"
EOF

# Step 2: Update API environment with correct CORS settings
echo -e "${YELLOW}⚙️  Step 2: Updating API CORS configuration...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update CORS_ORIGIN to include www.tourist.duckdns.org
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://www.tourist.duckdns.org,https://tourist.duckdns.org,https://tourist-frontend-c8ji.vercel.app,http://localhost:3000,http://localhost:5173|' .env

# Also update FRONTEND_URL
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://www.tourist.duckdns.org|' .env

echo "✅ API CORS configuration updated"
echo "📋 Current CORS setting:"
grep "CORS_ORIGIN" .env
EOF

# Step 3: Restart containers to apply changes
echo -e "${YELLOW}🔄 Step 3: Restarting containers...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

# Restart nginx first to apply new config
docker-compose -f docker-compose.freetier.yml restart nginx

# Wait a moment
sleep 5

# Restart API to pick up new environment
docker-compose -f docker-compose.freetier.yml restart api

echo "✅ Containers restarted"
EOF

# Step 4: Wait for services to be ready
echo -e "${YELLOW}⏳ Step 4: Waiting for services to be ready...${NC}"
sleep 15

# Step 5: Test the fixes
echo -e "${YELLOW}🧪 Step 5: Testing fixes...${NC}"
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
CORS_TEST=$(curl -s -H "Origin: https://www.tourist.duckdns.org" -I https://api.tourlicity.com/health)
echo "$CORS_TEST" | grep -i "access-control" || echo "❌ No CORS headers found"

echo ""
echo "📋 Container status:"
docker-compose -f docker-compose.freetier.yml ps

echo ""
echo "🔍 Recent nginx logs:"
docker-compose -f docker-compose.freetier.yml logs --tail=10 nginx

echo ""
echo "🔍 Recent API logs:"
docker-compose -f docker-compose.freetier.yml logs --tail=10 api
EOF

echo ""
echo -e "${GREEN}🎉 UPLOAD AND CORS FIX COMPLETE!${NC}"
echo "=============================================="
echo -e "${BLUE}📍 Changes applied:${NC}"
echo "   ✅ CORS headers added to nginx"
echo "   ✅ File upload size increased to 100MB"
echo "   ✅ API CORS origins updated"
echo "   ✅ Extended timeouts for uploads"
echo ""
echo -e "${BLUE}🧪 Your frontend should now be able to:${NC}"
echo "   🌐 Make API requests from https://www.tourist.duckdns.org"
echo "   📁 Upload files up to 100MB"
echo "   ⚡ Handle large file uploads with extended timeouts"
echo ""
echo -e "${GREEN}✅ Fix deployed successfully!${NC}"