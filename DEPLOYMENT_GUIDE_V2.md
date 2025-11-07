# Tourlicity Backend v2.0.0 - Deployment Guide

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

**From Windows (PowerShell):**
```powershell
# Complete deployment (Git push + EC2 deployment)
.\deploy-to-ec2-v2.ps1 -KeyPath "path\to\your-key.pem" -EC2Host "your-ec2-ip"

# Or run interactively (will prompt for key and host)
.\deploy-to-ec2-v2.ps1
```

**From EC2 (after SSH):**
```bash
# Run the deployment script
./deploy-ec2-v2.sh
```

### Option 2: Manual Deployment

#### Step 1: Push to Git (Windows)
```powershell
# Run the git update script
.\deploy-v2-update.ps1
```

Or manually:
```powershell
git add .
git commit -m "feat: API v2.0.0 updates"
git push origin main
```

#### Step 2: Deploy on EC2
```bash
# SSH into your EC2 instance
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# Navigate to project directory
cd ~/Tourist-Backend

# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker-compose down
docker-compose up -d --build

# Wait for services to start
sleep 10

# Verify deployment
curl http://localhost:5000/health
```

---

## 📋 Deployment Scripts Overview

### 1. `deploy-v2-update.ps1` (Windows)
**Purpose**: Commit and push changes to Git repository

**Usage**:
```powershell
.\deploy-v2-update.ps1
```

**What it does**:
- Checks git status
- Stages all changes
- Creates detailed commit message
- Pushes to remote repository
- Provides next steps

### 2. `deploy-ec2-v2.sh` (Linux/EC2)
**Purpose**: Deploy latest changes on EC2 instance

**Usage**:
```bash
./deploy-ec2-v2.sh
```

**What it does**:
- Creates backup of current state
- Pulls latest changes from git
- Updates dependencies if needed
- Rebuilds Docker containers
- Verifies deployment
- Runs health checks
- Cleans up old images

### 3. `deploy-to-ec2-v2.ps1` (Windows)
**Purpose**: Complete end-to-end deployment from Windows

**Usage**:
```powershell
# Full deployment
.\deploy-to-ec2-v2.ps1 -KeyPath "key.pem" -EC2Host "1.2.3.4"

# Skip git push
.\deploy-to-ec2-v2.ps1 -KeyPath "key.pem" -EC2Host "1.2.3.4" -SkipGitPush

# Skip tests
.\deploy-to-ec2-v2.ps1 -KeyPath "key.pem" -EC2Host "1.2.3.4" -SkipTests
```

**What it does**:
- Pushes changes to git
- Tests SSH connection
- Uploads deployment script to EC2
- Runs deployment on EC2
- Verifies deployment
- Runs API tests

---

## 🔧 Prerequisites

### Windows Machine
- PowerShell 5.1 or later
- Git installed and configured
- SSH client (built into Windows 10+)
- EC2 SSH key (.pem file)

### EC2 Instance
- Ubuntu 22.04 LTS
- Docker and Docker Compose installed
- Git configured with repository access
- Project cloned at `~/Tourist-Backend`

---

## 📊 Deployment Checklist

### Before Deployment
- [ ] All changes committed locally
- [ ] Tests passing locally
- [ ] Environment variables configured
- [ ] EC2 instance running
- [ ] SSH key accessible
- [ ] Git credentials configured

### During Deployment
- [ ] Git push successful
- [ ] SSH connection established
- [ ] Latest changes pulled
- [ ] Containers rebuilt successfully
- [ ] Services started
- [ ] Health checks passing

### After Deployment
- [ ] API responding at https://api.tourlicity.com
- [ ] Documentation accessible at /api-docs
- [ ] Database connected
- [ ] Redis cache connected
- [ ] No errors in logs
- [ ] New features working

---

## 🔍 Verification Commands

### Check API Health
```bash
# Basic health check
curl https://api.tourlicity.com/health

# Detailed health check
curl https://api.tourlicity.com/health/detailed | jq

# Check specific service
curl https://api.tourlicity.com/health | jq '.services'
```

### Check Documentation
```bash
# Open in browser
https://api.tourlicity.com/api-docs

# Get OpenAPI spec
curl https://api.tourlicity.com/api-docs/swagger.json | jq '.info'
```

### Test New Features
```bash
# Test default activities (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.tourlicity.com/api/activities

# Run test script
node scripts/test-new-features.js
```

### Check Container Status
```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f --tail=50

# View specific service logs
docker-compose logs -f api
```

---

## 🐛 Troubleshooting

### Deployment Failed

**Check logs:**
```bash
docker-compose logs --tail=100
```

**Restart services:**
```bash
docker-compose restart
```

**Full rebuild:**
```bash
docker-compose down
docker-compose up -d --build
```

### API Not Responding

**Check if containers are running:**
```bash
docker-compose ps
```

**Check API logs:**
```bash
docker-compose logs api --tail=50
```

**Test local endpoint:**
```bash
curl http://localhost:5000/health
```

### Database Connection Issues

**Check MongoDB logs:**
```bash
docker-compose logs mongodb --tail=50
```

**Restart MongoDB:**
```bash
docker-compose restart mongodb
```

**Check connection string:**
```bash
# Verify MONGODB_URI in .env
cat .env | grep MONGODB_URI
```

### Redis Cache Issues

**Check Redis logs:**
```bash
docker-compose logs redis --tail=50
```

**Restart Redis:**
```bash
docker-compose restart redis
```

**Test Redis connection:**
```bash
docker exec -it tourlicity-redis redis-cli ping
```

### Git Pull Issues

**Stash local changes:**
```bash
git stash
git pull origin main
git stash pop
```

**Force pull (careful!):**
```bash
git fetch origin
git reset --hard origin/main
```

### Permission Issues

**Fix script permissions:**
```bash
chmod +x deploy-ec2-v2.sh
chmod +x *.sh
```

**Fix Docker permissions:**
```bash
sudo usermod -aG docker $USER
# Logout and login again
```

---

## 🔐 Security Notes

### SSH Key Security
- Keep your .pem file secure (chmod 400)
- Never commit SSH keys to git
- Use different keys for different environments

### Environment Variables
- Never commit .env files
- Use secure values for production
- Rotate secrets regularly

### API Security
- Use HTTPS in production
- Keep JWT secrets secure
- Enable rate limiting
- Monitor for suspicious activity

---

## 📞 Support

### Common Issues
1. **Port conflicts**: Check if ports 80, 443, 5000 are available
2. **Memory issues**: EC2 t3.micro has 1GB RAM, monitor usage
3. **Disk space**: Clean up old Docker images regularly
4. **Network issues**: Check security groups and firewall rules

### Useful Resources
- **API Documentation**: https://api.tourlicity.com/api-docs
- **Health Status**: https://api.tourlicity.com/health/detailed
- **Docker Docs**: https://docs.docker.com
- **AWS EC2 Docs**: https://docs.aws.amazon.com/ec2

### Emergency Rollback
```bash
# Stop current deployment
docker-compose down

# Restore from backup
cd ~/backups/tourlicity-YYYYMMDD-HHMMSS
cp .env ~/Tourist-Backend/

# Checkout previous version
cd ~/Tourist-Backend
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>

# Rebuild
docker-compose up -d --build
```

---

## 🎯 Best Practices

1. **Always test locally first** before deploying to production
2. **Create backups** before major deployments
3. **Monitor logs** during and after deployment
4. **Verify health checks** after deployment
5. **Keep documentation updated** with any changes
6. **Use version tags** for important releases
7. **Test rollback procedures** periodically
8. **Monitor resource usage** on EC2 instance
9. **Keep dependencies updated** regularly
10. **Document any manual changes** made to production

---

## 📈 Performance Monitoring

### Key Metrics to Monitor
- **Response Time**: Should be < 200ms average
- **Cache Hit Rate**: Target 85%+
- **Memory Usage**: Should stay under 80% of available
- **Error Rate**: Should be < 1%
- **Uptime**: Target 99.9%

### Monitoring Commands
```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check Docker stats
docker stats

# Check API performance
curl -w "@curl-format.txt" -o /dev/null -s https://api.tourlicity.com/health
```

---

**Last Updated**: November 6, 2025  
**Version**: 2.0.0  
**Status**: Production Ready ✅
