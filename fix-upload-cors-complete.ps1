# =============================================================================
# COMPLETE FIX FOR UPLOAD AND CORS ISSUES (PowerShell)
# =============================================================================
# This script fixes both CORS and file upload size issues
# =============================================================================

Write-Host "🔧 Fixing Upload and CORS Issues..." -ForegroundColor Green
Write-Host "===================================="

# Configuration
$EC2IP = "51.20.34.93"
$KeyPath = "C:/Users/hp/Downloads/tourlicity-key.pem"

Write-Host "📋 Configuration:" -ForegroundColor Blue
Write-Host "   EC2 IP: $EC2IP"
Write-Host "   Fixing: CORS + File Upload Size"
Write-Host ""

# Function to execute SSH commands
function Invoke-SSHCommand {
    param([string]$Command)
    
    $sshArgs = @(
        "-i", $KeyPath,
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "ubuntu@$EC2IP",
        $Command
    )
    
    return & ssh @sshArgs
}

try {
    # Step 1: Update nginx configuration
    Write-Host "⚙️  Step 1: Updating nginx configuration..." -ForegroundColor Yellow
    
    $nginxUpdateCommand = @"
cd Tourist-Backend

# Backup current nginx config
cp docker/nginx/nginx.prod.conf docker/nginx/nginx.prod.conf.backup.`$(date +%Y%m%d_%H%M%S)

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
    log_format main '`$remote_addr - `$remote_user [`$time_local] "`$request" '
                    '`$status `$body_bytes_sent "`$http_referer" '
                    '"`$http_user_agent" "`$http_x_forwarded_for"';

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
    limit_req_zone `$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone `$binary_remote_addr zone=auth:10m rate=5r/s;
    limit_req_zone `$binary_remote_addr zone=upload:10m rate=2r/s;

    # Upstream
    upstream api {
        server api:5000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name api.tourlicity.com tourlicity.duckdns.org 51.20.34.93;
        return 301 https://`$host`$request_uri;
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
        if (`$request_method = 'OPTIONS') {
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
            proxy_set_header Upgrade `$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
            proxy_cache_bypass `$http_upgrade;
            
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
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
        }

        # Upload routes (even stricter rate limiting, larger file size)
        location /api/uploads/ {
            limit_req zone=upload burst=5 nodelay;
            client_max_body_size 100M;
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
            
            # Extended timeouts for uploads
            proxy_connect_timeout 300s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
            proxy_request_buffering off;
        }

        # Health check (no rate limiting)
        location /health {
            proxy_pass http://api;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
        }

        # API docs
        location /api-docs {
            proxy_pass http://api;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
        }

        # Root
        location / {
            proxy_pass http://api;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
        }
    }
}
NGINXEOF

echo "✅ Nginx configuration updated with CORS headers and 100MB file size limit"
"@

    Invoke-SSHCommand $nginxUpdateCommand
    Write-Host "✅ Nginx configuration updated" -ForegroundColor Green

    # Step 2: Update API CORS configuration
    Write-Host "⚙️  Step 2: Updating API CORS configuration..." -ForegroundColor Yellow
    
    $corsUpdateCommand = @"
cd Tourist-Backend

# Backup current .env
cp .env .env.backup.`$(date +%Y%m%d_%H%M%S)

# Update CORS_ORIGIN to include www.tourist.duckdns.org
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://www.tourist.duckdns.org,https://tourist.duckdns.org,https://tourist-frontend-c8ji.vercel.app,http://localhost:3000,http://localhost:5173|' .env

# Also update FRONTEND_URL
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://www.tourist.duckdns.org|' .env

echo "✅ API CORS configuration updated"
echo "📋 Current CORS setting:"
grep "CORS_ORIGIN" .env
"@

    Invoke-SSHCommand $corsUpdateCommand
    Write-Host "✅ API CORS configuration updated" -ForegroundColor Green

    # Step 3: Restart containers
    Write-Host "🔄 Step 3: Restarting containers..." -ForegroundColor Yellow
    
    $restartCommand = @"
cd Tourist-Backend

# Restart nginx first to apply new config
docker-compose -f docker-compose.freetier.yml restart nginx

# Wait a moment
sleep 5

# Restart API to pick up new environment
docker-compose -f docker-compose.freetier.yml restart api

echo "✅ Containers restarted"
"@

    Invoke-SSHCommand $restartCommand
    Write-Host "✅ Containers restarted" -ForegroundColor Green

    # Step 4: Wait for services
    Write-Host "⏳ Step 4: Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15

    # Step 5: Test the fixes
    Write-Host "🧪 Step 5: Testing fixes..." -ForegroundColor Yellow
    
    $testCommand = @"
echo "🔍 Testing API health..."
HTTP_CODE=`$(curl -s -o /dev/null -w "%{http_code}" https://api.tourlicity.com/health)
if [ "`$HTTP_CODE" = "200" ]; then
    echo "✅ API is healthy (HTTP `$HTTP_CODE)"
else
    echo "❌ API health check failed (HTTP `$HTTP_CODE)"
fi

echo ""
echo "🌐 Testing CORS headers for www.tourist.duckdns.org..."
CORS_TEST=`$(curl -s -H "Origin: https://www.tourist.duckdns.org" -I https://api.tourlicity.com/health)
echo "`$CORS_TEST" | grep -i "access-control" || echo "❌ No CORS headers found"

echo ""
echo "📋 Container status:"
docker-compose -f docker-compose.freetier.yml ps

echo ""
echo "🔍 Recent nginx logs:"
docker-compose -f docker-compose.freetier.yml logs --tail=10 nginx

echo ""
echo "🔍 Recent API logs:"
docker-compose -f docker-compose.freetier.yml logs --tail=10 api
"@

    Invoke-SSHCommand $testCommand

    Write-Host ""
    Write-Host "🎉 UPLOAD AND CORS FIX COMPLETE!" -ForegroundColor Green
    Write-Host "=============================================="
    Write-Host "📍 Changes applied:" -ForegroundColor Blue
    Write-Host "   ✅ CORS headers added to nginx"
    Write-Host "   ✅ File upload size increased to 100MB"
    Write-Host "   ✅ API CORS origins updated"
    Write-Host "   ✅ Extended timeouts for uploads"
    Write-Host ""
    Write-Host "🧪 Your frontend should now be able to:" -ForegroundColor Blue
    Write-Host "   🌐 Make API requests from https://www.tourist.duckdns.org"
    Write-Host "   📁 Upload files up to 100MB"
    Write-Host "   ⚡ Handle large file uploads with extended timeouts"
    Write-Host ""
    Write-Host "✅ Fix deployed successfully!" -ForegroundColor Green

} catch {
    Write-Host "❌ Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check your SSH connection and try again." -ForegroundColor Yellow
}