#!/bin/bash

# =============================================================================
# TOURLICITY EC2 DEPLOYMENT SCRIPT
# =============================================================================
# This script deploys your Tourlicity API to EC2 with Docker
# =============================================================================

set -e  # Exit on any error

echo "🚀 Starting Tourlicity Deployment to EC2..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EC2_IP="51.20.34.93"
KEY_PATH="/c/Users/hp/Downloads/tourlicity-key.pem"
REPO_URL="https://github.com/eyosibM/Tourist-Backend.git"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "   EC2 IP: $EC2_IP"
echo "   Repository: $REPO_URL"
echo ""

# Step 1: Update System
echo -e "${YELLOW}📦 Step 1: Updating system packages...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
sudo apt update && sudo apt upgrade -y
echo "✅ System updated successfully"
EOF

# Step 2: Install Docker
echo -e "${YELLOW}🐳 Step 2: Installing Docker...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
# Install Docker
sudo apt install -y docker.io docker-compose git curl
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

# Install Docker Compose v2
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "✅ Docker installed successfully"
EOF

# Step 3: Clone Repository
echo -e "${YELLOW}📥 Step 3: Cloning repository...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << EOF
# Remove existing directory if it exists
rm -rf Tourist-Backend

# Clone the repository
git clone $REPO_URL
cd Tourist-Backend

echo "✅ Repository cloned successfully"
EOF

# Step 4: Setup Environment
echo -e "${YELLOW}⚙️  Step 4: Setting up environment...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

# Create production environment file
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

# MongoDB Configuration (Atlas as backup)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Redis Configuration (Cloud as backup)
REDIS_URL=redis://username:password@host:port

# =============================================================================
# AUTHENTICATION & SECURITY
# =============================================================================

JWT_SECRET=93204f06ebb21cd06b85879bb32c260ace1840d6ddb8960677c0e12f305c134981b0ba54c72698c4da7c175bdd794ab12e6ea24508e6ba58b759ecd2e224ab88
JWT_REFRESH_SECRET=a1e3c0acab60d25e00563dab20bc2144dc6109f54faf884f6ac09d238969656fe2abb7a7a9fd2874c90efe49023da2a131f321be9a3357fc6aa3984f01bd8ea6
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Security Settings
BCRYPT_ROUNDS=10
CORS_ORIGIN=https://tourist-frontend-c8ji.vercel.app,http://localhost:3000,http://localhost:3001,http://localhost:5173

# =============================================================================
# AWS CONFIGURATION
# =============================================================================

AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=eu-north-1
S3_BUCKET_NAME=tourlicity-storage

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# =============================================================================
# PUSH NOTIFICATIONS
# =============================================================================

VAPID_EMAIL=admin@tourlicity.com
VAPID_PUBLIC_KEY=BFfQY0TpoX99lz7OGes-A-FCAAbg50YTBRDHX4L4cmEhdFIfRy7J77nnYaGwNaOvR4oP5-TZOL2f-Cnr_Im-Y10
VAPID_PRIVATE_KEY=6Legpp4DTpG3Fsur7cMSWrq53yia7V0yYnOika1e0gc

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

echo "✅ Environment configured successfully"
EOF

# Step 5: Deploy with Docker Compose
echo -e "${YELLOW}🐳 Step 5: Deploying with Docker Compose...${NC}"
ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

# Start the application using free tier compose
docker-compose -f docker-compose.freetier.yml up -d

echo "✅ Application deployed successfully"
EOF

# Step 6: Verify Deployment
echo -e "${YELLOW}🔍 Step 6: Verifying deployment...${NC}"
sleep 10  # Wait for services to start

ssh -i "$KEY_PATH" ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

echo "📊 Container Status:"
docker-compose -f docker-compose.freetier.yml ps

echo ""
echo "🔍 Health Check:"
curl -s http://localhost:5000/health || echo "API not ready yet, please wait..."

echo ""
echo "📋 Recent Logs:"
docker-compose -f docker-compose.freetier.yml logs --tail=10
EOF

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "=============================================="
echo -e "${BLUE}📍 Your API is now running at:${NC}"
echo "   🌐 http://51.20.34.93:5000"
echo "   📚 API Docs: http://51.20.34.93:5000/api-docs"
echo "   ❤️  Health Check: http://51.20.34.93:5000/health"
echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
echo "   1. Test your API: curl http://51.20.34.93:5000/health"
echo "   2. Update your Vercel frontend to use: http://51.20.34.93:5000"
echo "   3. Monitor logs: ssh -i key.pem ubuntu@51.20.34.93 'cd Tourist-Backend && docker-compose -f docker-compose.freetier.yml logs -f'"
echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"