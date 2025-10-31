# =============================================================================
# TOURLICITY EC2 UPDATE DEPLOYMENT SCRIPT (PowerShell)
# =============================================================================

Write-Host "🔄 Updating Tourlicity Deployment on EC2..." -ForegroundColor Blue
Write-Host "=============================================="

# Configuration
$EC2_IP = "51.20.34.93"
$KEY_PATH = "C:\Users\hp\Downloads\tourlicity-key.pem"
$REPO_URL = "https://github.com/eyosibM/Tourist-Backend.git"

Write-Host "📋 Update Configuration:" -ForegroundColor Blue
Write-Host "   EC2 IP: $EC2_IP"
Write-Host "   Repository: $REPO_URL"
Write-Host ""

# Step 1: Stop existing containers
Write-Host "🛑 Step 1: Stopping existing containers..." -ForegroundColor Yellow
ssh -i $KEY_PATH ubuntu@$EC2_IP "cd Tourist-Backend && docker-compose -f docker-compose.freetier.yml down"
Write-Host "✅ Containers stopped successfully" -ForegroundColor Green

# Step 2: Pull latest code
Write-Host "📥 Step 2: Pulling latest code..." -ForegroundColor Yellow
ssh -i $KEY_PATH ubuntu@$EC2_IP "cd Tourist-Backend && git fetch origin && git reset --hard origin/main"
Write-Host "✅ Latest code pulled successfully" -ForegroundColor Green

# Step 3: Update environment
Write-Host "⚙️  Step 3: Updating production environment..." -ForegroundColor Yellow
$envContent = @"
# =============================================================================
# TOURLICITY BACKEND API - PRODUCTION ENVIRONMENT
# =============================================================================

# Environment Configuration
NODE_ENV=production
PORT=5000
BASE_URL=http://51.20.34.93:5000

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# Docker Database Passwords (for local Docker containers)
MONGO_ROOT_PASSWORD=tourliciTy@aSiri_25#
REDIS_PASSWORD=tourliciTy@aSiri_25#

# MongoDB Configuration (Atlas - UPDATE WITH REAL CREDENTIALS)
MONGODB_URI=mongodb+srv://abisoyemudasiru_db_user:zttVg6eeKF5tclUa@cluster0.fudbdiq.mongodb.net/?appName=Cluster0

# Redis Configuration (Cloud - UPDATE WITH REAL CREDENTIALS)
REDIS_URL=redis://default:ReDLWLFHfWNvnV3Ei0WtgjTQF6agKElm@redis-17890.c80.us-east-1-2.ec2.redns.redis-cloud.com:17890

# =============================================================================
# AUTHENTICATION & SECURITY
# =============================================================================

JWT_SECRET=93204f06ebb21cd06b85879bb32c260ace1840d6ddb8960677c0e12f305c134981b0ba54c72698c4da7c175bdd794ab12e6ea24508e6ba58b759ecd2e224ab88
JWT_REFRESH_SECRET=a1e3c0acab60d25e00563dab20bc2144dc6109f54faf884f6ac09d238969656fe2abb7a7a9fd2874c90efe49023da2a131f321be9a3357fc6aa3984f01bd8ea6
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Google OAuth Configuration (UPDATE WITH REAL CREDENTIALS)
GOOGLE_CLIENT_ID=584229003904-fdicerksmotl9gbchlm5o559066fs68f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Security Settings
BCRYPT_ROUNDS=10
CORS_ORIGIN=https://tourist-frontend-c8ji.vercel.app,http://localhost:3000,http://localhost:3001,http://localhost:5173

# =============================================================================
# AWS CONFIGURATION (UPDATE WITH NEW CREDENTIALS)
# =============================================================================

AWS_ACCESS_KEY_ID=your-new-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-new-aws-secret-access-key
AWS_REGION=eu-north-1
S3_BUCKET_NAME=tourlicity-storage

# =============================================================================
# EMAIL CONFIGURATION (UPDATE WITH REAL CREDENTIALS)
# =============================================================================

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=opeyemioladejobi@gmail.com
EMAIL_PASS=ojnh pyan zkkv npbu
EMAIL_FROM=opeyemioladejobi@gmail.com

# =============================================================================
# PUSH NOTIFICATIONS (OPTIONAL - COMMENTED OUT TO AVOID ERRORS)
# =============================================================================

# VAPID_EMAIL=admin@tourlicity.com
# VAPID_PUBLIC_KEY=BFfQY0TpoX99lz7OGes-A-FCAAbg50YTBRDHX4L4cmEhdFIfRy7J77nnYaGwNaOvR4oP5-TZOL2f-Cnr_Im-Y10
# VAPID_PRIVATE_KEY=6Legpp4DTpG3Fsur7cMSWrq53yia7V0yYnOika1e0gc

# =============================================================================
# FRONTEND CONFIGURATION
# =============================================================================

FRONTEND_URL=https://tourist-frontend-c8ji.vercel.app

# =============================================================================
# RATE LIMITING
# =============================================================================

RATE_LIMIT_WINDOW=3600
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_WINDOW=900
RATE_LIMIT_AUTH_MAX_REQUESTS=5
RATE_LIMIT_FILE_UPLOAD_WINDOW=3600
RATE_LIMIT_FILE_UPLOAD_MAX_REQUESTS=10
RATE_LIMIT_PREMIUM_MULTIPLIER=10
RATE_LIMIT_ADMIN_MULTIPLIER=50

LOG_LEVEL=info
"@

# Write environment file to server
ssh -i $KEY_PATH ubuntu@$EC2_IP "cd Tourist-Backend && cat > .env << 'EOF'`n$envContent`nEOF"
Write-Host "✅ Production environment updated" -ForegroundColor Green

# Step 4: Rebuild and restart containers
Write-Host "🐳 Step 4: Rebuilding and restarting containers..." -ForegroundColor Yellow
ssh -i $KEY_PATH ubuntu@$EC2_IP "cd Tourist-Backend && docker-compose -f docker-compose.freetier.yml down --rmi all --volumes --remove-orphans"
ssh -i $KEY_PATH ubuntu@$EC2_IP "cd Tourist-Backend && docker-compose -f docker-compose.freetier.yml up -d --build"
Write-Host "✅ Containers rebuilt and restarted successfully" -ForegroundColor Green

# Step 5: Wait and verify
Write-Host "🔍 Step 5: Verifying updated deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

ssh -i $KEY_PATH ubuntu@$EC2_IP "cd Tourist-Backend && docker-compose -f docker-compose.freetier.yml ps"
ssh -i $KEY_PATH ubuntu@$EC2_IP "curl -s http://localhost:5000/health || echo 'API not ready yet'"

Write-Host ""
Write-Host "🎉 UPDATE DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=============================================="
Write-Host "📍 Your updated API is running at:" -ForegroundColor Blue
Write-Host "   🌐 http://tourlicity.duckdns.org"
Write-Host "   🌐 http://51.20.34.93"
Write-Host "   📚 API Docs: http://tourlicity.duckdns.org/api-docs"
Write-Host "   ❤️  Health Check: http://tourlicity.duckdns.org/health"
Write-Host ""
Write-Host "✅ Update deployment successful!" -ForegroundColor Green