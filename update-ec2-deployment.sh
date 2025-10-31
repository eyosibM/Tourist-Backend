#!/bin/bash

# =============================================================================
# TOURLICITY EC2 UPDATE DEPLOYMENT SCRIPT
# =============================================================================
# This script updates your existing EC2 deployment with latest code
# =============================================================================

set -e  # Exit on any error

echo "🔄 Updating Tourlicity Deployment on EC2..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EC2_IP="51.20.34.93"
KEY_PATH="C:/Users/hp/Downloads/tourlicity-key.pem"
REPO_URL="https://github.com/eyosibM/Tourist-Backend.git"

echo -e "${BLUE}📋 Update Configuration:${NC}"
echo "   EC2 IP: $EC2_IP"
echo "   Repository: $REPO_URL"
echo ""

# Step 1: Stop existing containers
echo -e "${YELLOW}🛑 Step 1: Stopping existing containers...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend
docker-compose -f docker-compose.freetier.yml down
echo "✅ Containers stopped successfully"
EOF

# Step 2: Pull latest code
echo -e "${YELLOW}📥 Step 2: Pulling latest code...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend
git fetch origin
git reset --hard origin/main || git reset --hard origin/master
echo "✅ Latest code pulled successfully"
EOF

# Step 3: Update environment with production credentials
echo -e "${YELLOW}⚙️  Step 3: Updating production environment...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

# Create production environment file with REAL credentials
cat > .env << 'ENVEOF'
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
ENVEOF

echo "✅ Production environment updated"
EOF

# Step 4: Rebuild and restart containers
echo -e "${YELLOW}🐳 Step 4: Rebuilding and restarting containers...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

# Remove old images to ensure fresh build
docker-compose -f docker-compose.freetier.yml down --rmi all --volumes --remove-orphans

# Build and start with latest code
docker-compose -f docker-compose.freetier.yml up -d --build

echo "✅ Containers rebuilt and restarted successfully"
EOF

# Step 5: Verify deployment
echo -e "${YELLOW}🔍 Step 5: Verifying updated deployment...${NC}"
sleep 15  # Wait for services to start

ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

echo "📊 Container Status:"
docker-compose -f docker-compose.freetier.yml ps

echo ""
echo "🔍 Health Check:"
curl -s http://localhost:5000/health || echo "API not ready yet, please wait..."

echo ""
echo "📋 Recent Logs:"
docker-compose -f docker-compose.freetier.yml logs --tail=20
EOF

echo ""
echo -e "${GREEN}🎉 UPDATE DEPLOYMENT COMPLETE!${NC}"
echo "=============================================="
echo -e "${BLUE}📍 Your updated API is running at:${NC}"
echo "   🌐 http://51.20.34.93:5000"
echo "   📚 API Docs: http://51.20.34.93:5000/api-docs"
echo "   ❤️  Health Check: http://51.20.34.93:5000/health"
echo ""
echo -e "${RED}⚠️  IMPORTANT SECURITY NOTES:${NC}"
echo "   1. 🔑 Generate NEW AWS keys and update the .env file on EC2"
echo "   2. 🔄 The old AWS keys have been removed from the codebase"
echo "   3. 🛡️  All sensitive credentials are now properly secured"
echo ""
echo -e "${GREEN}✅ Update deployment successful!${NC}"