# Tourlicity Backend Deployment Guide

## 🚀 Quick Start

### For Local Development
```bash
# Clone repository
git clone <repository-url>
cd Tourist-Backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### For EC2 Deployment
```bash
# SSH to EC2 instance
ssh -i tourlicity-key.pem ubuntu@51.20.34.93

# Navigate to project
cd Tourist-Backend

# Quick update and restart
./quick-deploy.ps1 update

# Or use full deployment script
./deploy.ps1 update
```

## 📁 Repository Structure

```
Tourist-Backend/
├── src/                    # Source code
│   ├── controllers/        # Route controllers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── tests/                 # Test files
├── scripts/               # Utility scripts
├── docker/                # Docker configurations
├── deployment/            # Deployment files (organized)
│   ├── scripts/           # Deployment scripts
│   ├── docker/            # Docker configs
│   ├── docs/              # Documentation
│   └── tests/             # Integration tests
├── deploy.ps1             # Main deployment script
├── quick-deploy.ps1       # Quick deployment commands
├── git-update.ps1         # Git management script
└── cleanup-repo.ps1       # Repository cleanup script
```

## 🛠️ Deployment Scripts

### Main Deployment Script (`deploy.ps1`)
Full-featured deployment script with multiple actions:

```powershell
# Update code and restart services
./deploy.ps1 update

# Restart services only
./deploy.ps1 restart

# Full rebuild of containers
./deploy.ps1 rebuild -Force

# Check service status
./deploy.ps1 status

# View logs
./deploy.ps1 logs

# Test API health
./deploy.ps1 health

# Clean up Docker resources
./deploy.ps1 cleanup
```

### Quick Deployment (`quick-deploy.ps1`)
Simple one-liner commands for common tasks:

```powershell
# Quick update
./quick-deploy.ps1 update

# Quick status check
./quick-deploy.ps1 status

# Quick logs
./quick-deploy.ps1 logs

# Quick health check
./quick-deploy.ps1 health

# System check
./quick-deploy.ps1 check
```

### Git Management (`git-update.ps1`)
Manage Git operations:

```powershell
# Add, commit, and push changes
./git-update.ps1 push -Message "Add new features"

# Commit only
./git-update.ps1 commit -Message "Fix bug"

# Pull latest changes
./git-update.ps1 pull

# Show status
./git-update.ps1 status

# Show recent commits
./git-update.ps1 log
```

## 🔧 Environment Configuration

### Required Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/tourlicity
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=eu-north-1
S3_BUCKET_NAME=your-bucket-name

# CORS
CORS_ORIGIN=https://www.tourist.duckdns.org,https://tourist.duckdns.org
FRONTEND_URL=https://www.tourist.duckdns.org
```

## 🐳 Docker Deployment

### Production Deployment
```bash
# Using HTTPS configuration
docker-compose -f docker-compose.https.yml up -d --build

# Check container status
docker ps

# View logs
docker logs tourlicity-api --tail=50
```

### Development Deployment
```bash
# Using development configuration
docker-compose up -d --build

# Check status
docker-compose ps
```

## 🧪 Testing

### Health Checks
```bash
# API health
curl https://api.tourlicity.com/api/health

# Detailed health
curl https://api.tourlicity.com/api/health/detailed
```

### API Testing
```bash
# Test authentication
curl -X POST https://api.tourlicity.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Test activities
curl https://api.tourlicity.com/api/activities
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Containers Not Starting
```bash
# Check logs
docker logs tourlicity-api --tail=50

# Restart containers
./quick-deploy.ps1 restart

# Full rebuild if needed
./deploy.ps1 rebuild -Force
```

#### 2. API Not Responding
```bash
# Check container status
docker ps

# Check nginx logs
docker logs tourlicity-nginx --tail=20

# Test direct API connection
curl http://localhost:5000/api/health
```

#### 3. Database Connection Issues
```bash
# Check MongoDB container
docker logs tourlicity-mongodb --tail=20

# Check environment variables
docker exec tourlicity-api env | grep MONGODB
```

#### 4. Email Not Working
```bash
# Check email configuration
docker exec tourlicity-api env | grep -E "(SMTP|EMAIL)"

# Test email service
curl -X POST https://api.tourlicity.com/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Log Locations
- API logs: `docker logs tourlicity-api`
- Nginx logs: `docker logs tourlicity-nginx`
- MongoDB logs: `docker logs tourlicity-mongodb`
- Redis logs: `docker logs tourlicity-redis`

## 📊 Monitoring

### System Resources
```bash
# Container resource usage
docker stats

# System resources
./quick-deploy.ps1 status

# Disk usage
df -h

# Memory usage
free -h
```

### API Metrics
```bash
# Health check
./quick-deploy.ps1 health

# Detailed health
curl https://api.tourlicity.com/api/health/detailed
```

## 🔐 Security

### SSL/HTTPS
- Automatic Let's Encrypt SSL certificates
- Auto-renewal every 90 days
- HTTPS redirect for all HTTP requests

### Environment Security
- Sensitive data in environment variables
- No secrets in code repository
- Secure Docker container configuration

### API Security
- JWT token authentication
- Rate limiting
- CORS protection
- Input validation

## 🚀 Deployment Workflow

### 1. Development
```bash
# Make changes locally
# Test changes
npm test

# Commit changes
./git-update.ps1 push -Message "Add new feature"
```

### 2. Deployment
```bash
# SSH to EC2
ssh -i tourlicity-key.pem ubuntu@51.20.34.93

# Deploy updates
./quick-deploy.ps1 update

# Verify deployment
./quick-deploy.ps1 health
```

### 3. Verification
```bash
# Check status
./deploy.ps1 status

# View logs
./deploy.ps1 logs

# Test API
curl https://api.tourlicity.com/api/health
```

## 📞 Support

### Quick Commands Reference
```bash
# Emergency restart
./quick-deploy.ps1 restart

# Check what's wrong
./quick-deploy.ps1 check

# View recent logs
./quick-deploy.ps1 logs

# Full system status
./deploy.ps1 status
```

### Getting Help
```bash
# Deployment script help
./deploy.ps1 -Help

# Quick deploy help
./quick-deploy.ps1 help

# Git management help
./git-update.ps1 -Help
```

---

**Last Updated**: November 2024
**Version**: 2.0
**Status**: Production Ready