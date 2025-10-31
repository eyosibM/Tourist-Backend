#!/bin/bash

# AWS Free Tier Deployment Script for Tourlicity API
set -e

echo "🆓 AWS Free Tier Deployment"
echo "==========================="
echo "Optimized for t3.micro (1 vCPU, 1GB RAM)"
echo ""

# Check if running on AWS EC2
if curl -s --max-time 2 http://169.254.169.254/latest/meta-data/instance-type 2>/dev/null | grep -q "t3.micro\|t2.micro"; then
    echo "✅ Detected AWS Free Tier instance"
    INSTANCE_TYPE=$(curl -s http://169.254.169.254/latest/meta-data/instance-type)
    echo "   Instance type: $INSTANCE_TYPE"
else
    echo "⚠️  Not detected as AWS Free Tier instance"
    echo "   This script is optimized for t3.micro/t2.micro"
    echo "   Continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check system resources
echo ""
echo "🔍 Checking system resources..."
TOTAL_RAM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
AVAILABLE_RAM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
DISK_SPACE=$(df -h / | awk 'NR==2{print $4}')

echo "   Total RAM: ${TOTAL_RAM}MB"
echo "   Available RAM: ${AVAILABLE_RAM}MB"
echo "   Available Disk: $DISK_SPACE"

if [ "$TOTAL_RAM" -lt 900 ]; then
    echo "❌ Warning: Less than 1GB RAM detected"
    echo "   Free tier requires at least 1GB RAM"
    echo "   Continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.docker .env
    echo "✅ Created .env file from template"
    echo ""
    echo "🔧 IMPORTANT: Please edit .env file with your production values:"
    echo "   - MONGO_ROOT_PASSWORD (change from default)"
    echo "   - REDIS_PASSWORD (change from default)"
    echo "   - BASE_URL (set to your EC2 public IP)"
    echo "   - FRONTEND_URL (set to your frontend domain)"
    echo ""
    echo "   Edit now? (Y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Nn]$ ]]; then
        nano .env
    fi
fi

# Check Docker
echo ""
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "   Install Docker? (Y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Nn]$ ]]; then
        echo "📦 Installing Docker..."
        sudo apt update
        sudo apt install -y docker.io docker-compose
        sudo usermod -aG docker $USER
        sudo systemctl enable docker
        sudo systemctl start docker
        echo "✅ Docker installed. Please logout and login again, then re-run this script."
        exit 0
    else
        exit 1
    fi
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    echo "🔄 Starting Docker..."
    sudo systemctl start docker
fi

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p docker/mongodb/data
mkdir -p docker/redis/data

# Set up memory monitoring
echo ""
echo "📊 Setting up monitoring..."
cat > monitor-resources.sh << 'EOF'
#!/bin/bash
echo "=== System Resources ==="
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h /
echo ""
echo "Docker Container Stats:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""
echo "=== AWS Free Tier Limits ==="
echo "Monthly limits:"
echo "- EC2 hours: 750 hours (31 days = 744 hours) ✅"
echo "- Data transfer: 15 GB/month"
echo "- EBS storage: 30 GB"
EOF
chmod +x monitor-resources.sh

# Pull images (to avoid timeout during build)
echo ""
echo "📥 Pulling Docker images..."
docker pull mongo:7.0
docker pull redis:7.2-alpine
docker pull node:18-alpine

# Build application image
echo ""
echo "🔨 Building application image..."
docker build -t tourlicity-api .

# Stop any existing containers
echo ""
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.freetier.yml down 2>/dev/null || true

# Start services
echo ""
echo "🚀 Starting Free Tier optimized services..."
docker-compose -f docker-compose.freetier.yml up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 45

# Health checks
echo ""
echo "🏥 Running health checks..."

# Check containers
echo "Container status:"
docker-compose -f docker-compose.freetier.yml ps

# Check API
echo ""
echo "Testing API..."
if curl -f http://localhost:5000/health &> /dev/null; then
    echo "✅ API is healthy"
    API_STATUS=$(curl -s http://localhost:5000/health | jq -r '.status' 2>/dev/null || echo "OK")
    echo "   Status: $API_STATUS"
else
    echo "❌ API health check failed"
    echo "   Checking logs..."
    docker-compose -f docker-compose.freetier.yml logs --tail=20 api
fi

# Check MongoDB
echo ""
echo "Testing MongoDB..."
if docker exec tourlicity-mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    echo "✅ MongoDB is healthy"
else
    echo "❌ MongoDB health check failed"
    docker-compose -f docker-compose.freetier.yml logs --tail=10 mongodb
fi

# Check Redis
echo ""
echo "Testing Redis..."
if docker exec tourlicity-redis redis-cli ping &> /dev/null; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
    docker-compose -f docker-compose.freetier.yml logs --tail=10 redis
fi

# Get public IP
echo ""
echo "🌐 Getting public IP..."
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
echo "   Public IP: $PUBLIC_IP"

# Show resource usage
echo ""
echo "📊 Current resource usage:"
./monitor-resources.sh

echo ""
echo "🎉 Free Tier Deployment Complete!"
echo ""
echo "📊 Service URLs:"
echo "   API Health:    http://$PUBLIC_IP:5000/health"
echo "   API Docs:      http://$PUBLIC_IP:5000/api-docs"
echo "   Direct API:    http://$PUBLIC_IP:5000"
echo "   Port 80:       http://$PUBLIC_IP (same as :5000)"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:     docker-compose -f docker-compose.freetier.yml logs -f"
echo "   Stop:          docker-compose -f docker-compose.freetier.yml down"
echo "   Restart:       docker-compose -f docker-compose.freetier.yml restart"
echo "   Status:        docker-compose -f docker-compose.freetier.yml ps"
echo "   Monitor:       ./monitor-resources.sh"
echo ""
echo "💰 Free Tier Monitoring:"
echo "   - Set up CloudWatch billing alerts"
echo "   - Monitor data transfer (15GB/month limit)"
echo "   - Check EC2 hours (750/month limit)"
echo "   - Watch EBS storage (30GB limit)"
echo ""
echo "⚠️  Important Notes:"
echo "   - Update your .env file with production values"
echo "   - Change default passwords for security"
echo "   - Set up regular backups"
echo "   - Monitor AWS billing dashboard"
echo ""
echo "🚀 Your API is now running FREE on AWS for 12 months!"

# Create a simple backup script
cat > backup.sh << 'EOF'
#!/bin/bash
# Simple backup script for Free Tier
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Creating backup: $DATE"
docker exec tourlicity-mongodb mongodump --out /tmp/backup_$DATE
docker cp tourlicity-mongodb:/tmp/backup_$DATE $BACKUP_DIR/mongodb_$DATE
docker exec tourlicity-mongodb rm -rf /tmp/backup_$DATE

# Keep only last 7 backups to save space
ls -t $BACKUP_DIR/mongodb_* | tail -n +8 | xargs rm -rf

echo "Backup completed: $BACKUP_DIR/mongodb_$DATE"
EOF
chmod +x backup.sh

echo ""
echo "📦 Backup script created: ./backup.sh"
echo "   Run daily to backup your data"