# Tourlicity Backend v2.0.0 - Deployment System

## 🎯 Overview

Complete deployment automation system for Tourlicity Backend API v2.0.0, featuring:
- ✅ Automated Git workflows
- ✅ One-command EC2 deployment
- ✅ Health monitoring and verification
- ✅ Backup and rollback capabilities
- ✅ Comprehensive documentation

---

## 🚀 Quick Start

### 1. Pre-Deployment Check
```powershell
# Run this first to verify everything is ready
.\pre-deployment-check.ps1
```

### 2. Deploy to Production
```powershell
# Option A: Complete automated deployment
.\deploy-to-ec2-v2.ps1 -KeyPath "your-key.pem" -EC2Host "your-ec2-ip"

# Option B: Step-by-step deployment
.\deploy-v2-update.ps1                    # Push to Git
ssh -i "key.pem" ubuntu@ec2-ip            # SSH to EC2
./deploy-ec2-v2.sh                        # Deploy on EC2
```

---

## 📦 Available Scripts

### Windows PowerShell Scripts

#### 1. `pre-deployment-check.ps1`
**Pre-deployment verification script**

```powershell
.\pre-deployment-check.ps1
```

**Checks**:
- ✅ Git repository status
- ✅ Required files present
- ✅ Package version (2.0.0)
- ✅ Environment configuration
- ✅ Dependencies installed
- ✅ Docker availability
- ✅ Git remote configured
- ✅ Deployment scripts ready
- ✅ Documentation updated

---

#### 2. `deploy-v2-update.ps1`
**Git commit and push automation**

```powershell
.\deploy-v2-update.ps1
```

**Actions**:
1. Shows current git status
2. Stages all changes
3. Creates detailed commit message
4. Pushes to remote repository
5. Provides next steps

**Commit Message Includes**:
- Feature description
- Major updates list
- Technical changes
- Performance improvements

---

#### 3. `deploy-to-ec2-v2.ps1`
**Complete end-to-end deployment**

```powershell
# Full deployment
.\deploy-to-ec2-v2.ps1 -KeyPath "key.pem" -EC2Host "1.2.3.4"

# Interactive mode
.\deploy-to-ec2-v2.ps1

# Skip git push
.\deploy-to-ec2-v2.ps1 -KeyPath "key.pem" -EC2Host "1.2.3.4" -SkipGitPush

# Skip tests
.\deploy-to-ec2-v2.ps1 -KeyPath "key.pem" -EC2Host "1.2.3.4" -SkipTests
```

**Parameters**:
- `-KeyPath`: Path to SSH key (.pem file)
- `-EC2Host`: EC2 IP address or domain
- `-SkipGitPush`: Skip git push step
- `-SkipTests`: Skip API tests

**Steps**:
1. 📦 Push changes to Git
2. 🔌 Test SSH connection
3. 📤 Upload deployment script
4. 🚀 Run deployment on EC2
5. 🔍 Verify deployment
6. 🧪 Run API tests

---

#### 4. `setup-deployment-scripts.ps1`
**Verify deployment scripts**

```powershell
.\setup-deployment-scripts.ps1
```

**Actions**:
- Checks all scripts exist
- Shows available commands
- Provides usage instructions

---

### Linux Bash Scripts

#### 5. `deploy-ec2-v2.sh`
**EC2 deployment automation**

```bash
./deploy-ec2-v2.sh
```

**Stages**:
1. 📦 **Backup**: Creates timestamped backup
2. 🔄 **Git Pull**: Pulls latest changes
3. 📚 **Dependencies**: Updates if needed
4. 🛑 **Stop**: Stops current containers
5. 🔨 **Build**: Rebuilds containers
6. ⏳ **Wait**: Waits for services
7. 🔍 **Verify**: Runs health checks
8. 🧹 **Cleanup**: Removes old images

**Features**:
- Automatic backup creation
- Dependency management
- Health verification
- Error handling
- Optional API testing

---

## 📖 Documentation Files

### 1. `DEPLOYMENT_GUIDE_V2.md`
Comprehensive deployment guide with:
- Quick deployment options
- Script usage instructions
- Prerequisites checklist
- Verification commands
- Troubleshooting guide
- Security notes
- Best practices

### 2. `QUICK_DEPLOY_COMMANDS.md`
Quick reference card with:
- One-line deployments
- Common operations
- Quick fixes
- Monitoring commands
- Emergency procedures

### 3. `DEPLOYMENT_SCRIPTS_SUMMARY.md`
Complete overview of:
- All scripts and their features
- Usage examples
- Feature comparison
- Best practices
- Support resources

### 4. `DEPLOYMENT_README_V2.md` (This File)
Main deployment system documentation

---

## 🔄 Deployment Workflows

### Workflow 1: Quick Update (Recommended)
```powershell
# 1. Check everything is ready
.\pre-deployment-check.ps1

# 2. Deploy everything
.\deploy-to-ec2-v2.ps1 -KeyPath "key.pem" -EC2Host "ip"

# 3. Verify
curl https://api.tourlicity.com/health
```

### Workflow 2: Manual Control
```powershell
# 1. Pre-check
.\pre-deployment-check.ps1

# 2. Push to Git
.\deploy-v2-update.ps1

# 3. SSH to EC2
ssh -i "key.pem" ubuntu@ec2-ip

# 4. Deploy on EC2
cd ~/Tourist-Backend
./deploy-ec2-v2.sh

# 5. Verify
curl https://api.tourlicity.com/health
```

### Workflow 3: Emergency Update
```bash
# On EC2 - Quick manual deployment
cd ~/Tourist-Backend
git pull && docker-compose down && docker-compose up -d --build
sleep 10 && curl http://localhost:5000/health
```

---

## ✅ Pre-Deployment Checklist

### Local Environment
- [ ] All changes tested locally
- [ ] Pre-deployment check passed
- [ ] Git repository clean or changes committed
- [ ] Environment variables configured
- [ ] SSH key accessible
- [ ] EC2 credentials ready

### EC2 Environment
- [ ] EC2 instance running
- [ ] Docker installed and running
- [ ] Git configured
- [ ] `.env` file present
- [ ] Sufficient disk space
- [ ] Ports 80, 443, 5000 available

### Post-Deployment
- [ ] API health check passing
- [ ] Documentation accessible
- [ ] Database connected
- [ ] Redis cache connected
- [ ] No errors in logs
- [ ] New features working
- [ ] Performance metrics normal

---

## 🔍 Verification Steps

### 1. Health Checks
```bash
# Basic health
curl https://api.tourlicity.com/health

# Detailed health with metrics
curl https://api.tourlicity.com/health/detailed | jq

# Check specific services
curl https://api.tourlicity.com/health | jq '.services'
```

### 2. API Documentation
```bash
# Check version
curl https://api.tourlicity.com/api-docs/swagger.json | jq '.info.version'

# Open in browser
https://api.tourlicity.com/api-docs
```

### 3. New Features
```bash
# Test default activities (requires auth)
curl -H "Authorization: Bearer TOKEN" \
  https://api.tourlicity.com/api/activities

# Run test script
node scripts/test-new-features.js
```

### 4. Container Status
```bash
# Check containers
docker-compose ps

# View logs
docker-compose logs -f --tail=50

# Check resources
docker stats
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. PowerShell Execution Policy
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2. SSH Connection Failed
```bash
# Test connection
ssh -i "key.pem" ubuntu@ec2-ip "echo 'Connected'"

# Fix key permissions (Windows)
icacls "key.pem" /inheritance:r
icacls "key.pem" /grant:r "$($env:USERNAME):(R)"

# Fix key permissions (Linux)
chmod 400 key.pem
```

#### 3. Docker Build Failed
```bash
# Check logs
docker-compose logs --tail=100

# Clean and rebuild
docker-compose down
docker system prune -f
docker-compose up -d --build
```

#### 4. API Not Responding
```bash
# Restart API
docker-compose restart api

# Check logs
docker-compose logs api --tail=50

# Test local endpoint
curl http://localhost:5000/health
```

#### 5. Database Connection Issues
```bash
# Check MongoDB
docker-compose logs mongodb --tail=50

# Restart MongoDB
docker-compose restart mongodb

# Verify connection string
cat .env | grep MONGODB_URI
```

---

## 🔐 Security Best Practices

### SSH Keys
- Keep .pem files secure (chmod 400)
- Never commit SSH keys to git
- Use different keys for different environments
- Rotate keys regularly

### Environment Variables
- Never commit .env files
- Use strong secrets in production
- Rotate JWT secrets periodically
- Use AWS Secrets Manager for sensitive data

### API Security
- Always use HTTPS in production
- Enable rate limiting
- Monitor for suspicious activity
- Keep dependencies updated
- Regular security audits

---

## 📊 Performance Monitoring

### Key Metrics
- **Response Time**: < 200ms average
- **Cache Hit Rate**: 85%+ target
- **Memory Usage**: < 80% of available
- **Error Rate**: < 1%
- **Uptime**: 99.9% target

### Monitoring Commands
```bash
# System resources
free -h                    # Memory
df -h                      # Disk
docker stats              # Container stats

# API performance
curl -w "@curl-format.txt" -o /dev/null -s https://api.tourlicity.com/health

# Cache statistics
curl -s http://localhost:5000/health | jq '.cache'
```

---

## 🆘 Emergency Procedures

### Rollback Deployment
```bash
# 1. Stop current deployment
docker-compose down

# 2. Checkout previous version
git log --oneline -5
git checkout <previous-commit>

# 3. Rebuild
docker-compose up -d --build

# 4. Verify
curl http://localhost:5000/health
```

### Restore from Backup
```bash
# 1. Find backup
ls -la ~/backups/

# 2. Restore .env
cp ~/backups/tourlicity-YYYYMMDD-HHMMSS/.env ~/Tourist-Backend/

# 3. Restart services
cd ~/Tourist-Backend
docker-compose restart
```

### Emergency Contacts
- System logs: `docker-compose logs -f`
- Restart all: `docker-compose restart`
- Full reset: `docker-compose down && docker-compose up -d --build`

---

## 📞 Support Resources

### Documentation
- **Deployment Guide**: DEPLOYMENT_GUIDE_V2.md
- **Quick Commands**: QUICK_DEPLOY_COMMANDS.md
- **Scripts Summary**: DEPLOYMENT_SCRIPTS_SUMMARY.md
- **API Docs**: https://api.tourlicity.com/api-docs

### Health Monitoring
- **Basic Health**: https://api.tourlicity.com/health
- **Detailed Health**: https://api.tourlicity.com/health/detailed
- **API Documentation**: https://api.tourlicity.com/api-docs

### Useful Links
- **Docker Docs**: https://docs.docker.com
- **AWS EC2 Docs**: https://docs.aws.amazon.com/ec2
- **Git Documentation**: https://git-scm.com/doc

---

## 🎉 Success Indicators

After successful deployment, you should see:

✅ **API Health**: Status "OK" with all services connected  
✅ **Documentation**: Accessible at /api-docs with v2.0.0  
✅ **Cache**: 85%+ hit rate in production  
✅ **Performance**: < 200ms average response time  
✅ **Containers**: All running without errors  
✅ **Logs**: No critical errors or warnings  
✅ **Features**: New default activities endpoints working  

---

## 📝 Version History

### v2.0.0 (November 6, 2025)
- ✅ Enhanced Swagger documentation (153+ endpoints)
- ✅ Default Activities system with media support
- ✅ Performance improvements (50-90% faster)
- ✅ Comprehensive deployment automation
- ✅ Enhanced health monitoring
- ✅ Updated API documentation

### v1.3.0 (October 31, 2025)
- ✅ HTTPS implementation
- ✅ Security enhancements
- ✅ Production deployment

---

**Ready to deploy? Start with `.\pre-deployment-check.ps1`** 🚀

**Last Updated**: November 6, 2025  
**Version**: 2.0.0  
**Status**: Production Ready ✅
