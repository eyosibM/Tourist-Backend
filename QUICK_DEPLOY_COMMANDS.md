# Quick Deployment Commands - Tourlicity v2.0.0

## 🚀 One-Line Deployments

### From Windows (PowerShell)
```powershell
# Complete automated deployment
.\deploy-to-ec2-v2.ps1 -KeyPath "your-key.pem" -EC2Host "your-ec2-ip"

# Just push to git
.\deploy-v2-update.ps1
```

### From EC2 (SSH)
```bash
# Complete deployment
./deploy-ec2-v2.sh

# Quick manual deployment
git pull && docker-compose down && docker-compose up -d --build && sleep 10 && curl http://localhost:5000/health
```

---

## 📋 Step-by-Step Commands

### 1. Local Git Update (Windows)
```powershell
git add .
git commit -m "feat: v2.0.0 updates"
git push origin main
```

### 2. SSH to EC2
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

### 3. Deploy on EC2
```bash
cd ~/Tourist-Backend
git pull origin main
docker-compose down
docker-compose up -d --build
sleep 10
curl http://localhost:5000/health
```

---

## 🔍 Quick Checks

### Health Check
```bash
curl https://api.tourlicity.com/health
curl https://api.tourlicity.com/health/detailed | jq
```

### Container Status
```bash
docker-compose ps
docker-compose logs -f --tail=50
```

### Test New Features
```bash
node scripts/test-new-features.js
curl https://api.tourlicity.com/api-docs/swagger.json | jq '.info.version'
```

---

## 🛠️ Common Operations

### Restart Services
```bash
docker-compose restart api
docker-compose restart
```

### View Logs
```bash
docker-compose logs -f
docker-compose logs api --tail=100
```

### Clean Up
```bash
docker image prune -f
docker system prune -f
```

---

## 🐛 Quick Fixes

### API Not Responding
```bash
docker-compose restart api
docker-compose logs api --tail=50
```

### Database Issues
```bash
docker-compose restart mongodb
docker-compose logs mongodb --tail=50
```

### Cache Issues
```bash
docker-compose restart redis
docker exec -it tourlicity-redis redis-cli ping
```

### Full Reset
```bash
docker-compose down
docker-compose up -d --build
```

---

## 📊 Monitoring

### System Resources
```bash
free -h                    # Memory
df -h                      # Disk
docker stats              # Container stats
```

### API Performance
```bash
curl -w "@curl-format.txt" -o /dev/null -s https://api.tourlicity.com/health
```

### Cache Stats
```bash
curl -s http://localhost:5000/health | jq '.cache'
```

---

## 🔐 SSH Commands

### Connect
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

### Copy Files
```bash
scp -i "your-key.pem" file.txt ubuntu@your-ec2-ip:~/Tourist-Backend/
```

### Run Remote Command
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip "cd ~/Tourist-Backend && docker-compose ps"
```

---

## 📞 Emergency Commands

### Stop Everything
```bash
docker-compose down
```

### Rollback
```bash
git log --oneline -5
git checkout <previous-commit>
docker-compose up -d --build
```

### View All Logs
```bash
docker-compose logs --tail=200 > deployment-logs.txt
cat deployment-logs.txt
```

---

**Quick Reference Card - Keep this handy!** 📌
