# Deployment Scripts Summary - Tourlicity v2.0.0

## 📦 Created Deployment Scripts

### 1. **deploy-v2-update.ps1** (Windows PowerShell)
**Purpose**: Commit and push changes to Git repository

**Usage**:
```powershell
.\deploy-v2-update.ps1
```

**Features**:
- ✅ Checks git status
- ✅ Stages all changes
- ✅ Creates detailed v2.0.0 commit message
- ✅ Pushes to remote repository
- ✅ Provides next steps

---

### 2. **deploy-ec2-v2.sh** (Linux Bash - Run on EC2)
**Purpose**: Deploy latest changes on EC2 instance

**Usage**:
```bash
./deploy-ec2-v2.sh
```

**Features**:
- ✅ Creates automatic backup
- ✅ Pulls latest changes from git
- ✅ Updates dependencies if needed
- ✅ Rebuilds Docker containers
- ✅ Runs health checks
- ✅ Verifies deployment
- ✅ Cleans up old images
- ✅ Optional API testing

**Stages**:
1. 📦 Backup current state
2. 🔄 Pull latest changes
3. 📚 Check dependencies
4. 🛑 Stop containers
5. 🔨 Rebuild and start
6. ⏳ Wait for services
7. 🔍 Verify deployment
8. 🧹 Cleanup

---

### 3. **deploy-to-ec2-v2.ps1** (Windows PowerShell - Complete Automation)
**Purpose**: End-to-end deployment from Windows to EC2

**Usage**:
```powershell
# Full deployment
.\deploy-to-ec2-v2.ps1 -KeyPath "key.pem" -EC2Host "1.2.3.4"

# Interactive mode (prompts for inputs)
.\deploy-to-ec2-v2.ps1

# Skip git push
.\deploy-to-ec2-v2.ps1 -KeyPath "key.pem" -EC2Host "1.2.3.4" -SkipGitPush

# Skip tests
.\deploy-to-ec2-v2.ps1 -KeyPath "key.pem" -EC2Host "1.2.3.4" -SkipTests
```

**Features**:
- ✅ Pushes changes to git
- ✅ Tests SSH connection
- ✅ Uploads deployment script
- ✅ Runs deployment on EC2
- ✅ Verifies deployment
- ✅ Runs API tests
- ✅ Provides detailed summary

**Steps**:
1. 📦 Push to Git
2. 🔌 Test SSH connection
3. 📤 Upload deployment script
4. 🚀 Run deployment on EC2
5. 🔍 Verify deployment
6. 🧪 Run tests

---

### 4. **DEPLOYMENT_GUIDE_V2.md** (Documentation)
**Purpose**: Comprehensive deployment guide

**Contents**:
- Quick deployment options
- Script usage instructions
- Prerequisites checklist
- Verification commands
- Troubleshooting guide
- Security notes
- Best practices
- Performance monitoring

---

### 5. **QUICK_DEPLOY_COMMANDS.md** (Quick Reference)
**Purpose**: Quick command reference card

**Contents**:
- One-line deployments
- Step-by-step commands
- Quick health checks
- Common operations
- Quick fixes
- Monitoring commands
- Emergency commands

---

### 6. **setup-deployment-scripts.ps1** (Setup Helper)
**Purpose**: Verify deployment scripts are ready

**Usage**:
```powershell
.\setup-deployment-scripts.ps1
```

**Features**:
- ✅ Checks all scripts exist
- ✅ Provides usage instructions
- ✅ Shows available commands

---

## 🚀 Quick Start Guide

### First Time Setup

1. **Verify scripts exist**:
   ```powershell
   .\setup-deployment-scripts.ps1
   ```

2. **Make EC2 script executable** (on EC2):
   ```bash
   chmod +x deploy-ec2-v2.sh
   ```

### Regular Deployment Workflow

#### Option A: Automated (Recommended)
```powershell
# From Windows - Complete deployment
.\deploy-to-ec2-v2.ps1 -KeyPath "your-key.pem" -EC2Host "your-ec2-ip"
```

#### Option B: Manual Steps
```powershell
# Step 1: Push to Git (Windows)
.\deploy-v2-update.ps1

# Step 2: SSH to EC2
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# Step 3: Deploy on EC2
./deploy-ec2-v2.sh
```

---

## 📋 Deployment Checklist

### Before Running Scripts

- [ ] All changes tested locally
- [ ] `.env` file configured on EC2
- [ ] EC2 instance running
- [ ] SSH key accessible
- [ ] Git credentials configured
- [ ] Docker running on EC2

### After Deployment

- [ ] API health check passing
- [ ] Documentation accessible
- [ ] Database connected
- [ ] Redis cache connected
- [ ] No errors in logs
- [ ] New features working

---

## 🔍 Verification Commands

### Check Deployment Success
```bash
# API health
curl https://api.tourlicity.com/health

# Detailed health
curl https://api.tourlicity.com/health/detailed | jq

# Documentation
curl https://api.tourlicity.com/api-docs/swagger.json | jq '.info.version'

# Container status
docker-compose ps

# View logs
docker-compose logs -f --tail=50
```

### Test New Features
```bash
# Run test script
node scripts/test-new-features.js

# Test default activities (requires auth)
curl -H "Authorization: Bearer TOKEN" \
  https://api.tourlicity.com/api/activities
```

---

## 🐛 Troubleshooting

### Script Execution Issues

**PowerShell execution policy**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Bash script not executable**:
```bash
chmod +x deploy-ec2-v2.sh
```

### SSH Connection Issues

**Test connection**:
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip "echo 'Connected'"
```

**Fix key permissions** (Windows):
```powershell
icacls "your-key.pem" /inheritance:r
icacls "your-key.pem" /grant:r "$($env:USERNAME):(R)"
```

**Fix key permissions** (Linux):
```bash
chmod 400 your-key.pem
```

### Deployment Failures

**Check logs**:
```bash
docker-compose logs --tail=100
```

**Restart services**:
```bash
docker-compose restart
```

**Full rebuild**:
```bash
docker-compose down
docker-compose up -d --build
```

---

## 📊 Script Features Comparison

| Feature | deploy-v2-update.ps1 | deploy-ec2-v2.sh | deploy-to-ec2-v2.ps1 |
|---------|---------------------|------------------|---------------------|
| Git Push | ✅ | ❌ | ✅ |
| SSH Connection | ❌ | ❌ | ✅ |
| EC2 Deployment | ❌ | ✅ | ✅ |
| Health Checks | ❌ | ✅ | ✅ |
| Backup Creation | ❌ | ✅ | ❌ |
| Dependency Updates | ❌ | ✅ | ❌ |
| API Testing | ❌ | ✅ (optional) | ✅ (optional) |
| Cleanup | ❌ | ✅ | ❌ |
| Platform | Windows | Linux | Windows |

---

## 🎯 Best Practices

1. **Always test locally** before deploying
2. **Use automated scripts** for consistency
3. **Monitor logs** during deployment
4. **Verify health checks** after deployment
5. **Keep backups** of important configurations
6. **Document any manual changes**
7. **Test rollback procedures** periodically

---

## 📞 Support & Resources

### Documentation
- **Deployment Guide**: DEPLOYMENT_GUIDE_V2.md
- **Quick Commands**: QUICK_DEPLOY_COMMANDS.md
- **API Documentation**: https://api.tourlicity.com/api-docs

### Health Monitoring
- **Basic Health**: https://api.tourlicity.com/health
- **Detailed Health**: https://api.tourlicity.com/health/detailed

### Emergency Contacts
- Check logs: `docker-compose logs -f`
- Restart services: `docker-compose restart`
- Full reset: `docker-compose down && docker-compose up -d --build`

---

## 🎉 Summary

You now have a complete deployment automation system with:

✅ **3 PowerShell scripts** for Windows operations  
✅ **1 Bash script** for EC2 deployment  
✅ **2 comprehensive guides** for reference  
✅ **Automated testing** and verification  
✅ **Health monitoring** integration  
✅ **Backup and rollback** capabilities  
✅ **Error handling** and troubleshooting  

**Ready to deploy v2.0.0!** 🚀

---

**Last Updated**: November 6, 2025  
**Version**: 2.0.0  
**Status**: Production Ready ✅
