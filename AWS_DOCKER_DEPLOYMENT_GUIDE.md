# AWS Docker Deployment Guide

## 🚀 Complete Docker Setup for AWS

This guide will help you deploy your Tourlicity API with MongoDB and Redis using Docker containers on AWS.

## 📋 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │  Tourlicity API │    │    MongoDB      │
│   (Port 80/443) │────│   (Port 5000)   │────│   (Port 27017)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Port 6379)   │
                       └─────────────────┘
```

## 🛠️ Local Development Setup

### 1. **Prerequisites**
```bash
# Install Docker and Docker Compose
# Windows: Docker Desktop
# Linux: sudo apt install docker.io docker-compose
# macOS: Docker Desktop
```

### 2. **Environment Setup**
```bash
# Copy environment template
cp .env.docker .env

# Edit .env with your specific values
# Update passwords, secrets, and API keys
```

### 3. **Start Services**
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
```

### 4. **Test Local Setup**
```bash
# Health check
curl http://localhost:5000/health

# API documentation
curl http://localhost:5000/api-docs

# With Nginx proxy
curl http://localhost/health
```

## ☁️ AWS Deployment Options

### Option 1: AWS ECS (Recommended)

#### **Step 1: Create ECS Cluster**
```bash
# Install AWS CLI
aws configure

# Create ECS cluster
aws ecs create-cluster --cluster-name tourlicity-cluster
```

#### **Step 2: Build and Push Images**
```bash
# Create ECR repositories
aws ecr create-repository --repository-name tourlicity-api
aws ecr create-repository --repository-name tourlicity-nginx

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push API image
docker build -t tourlicity-api .
docker tag tourlicity-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/tourlicity-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/tourlicity-api:latest
```

#### **Step 3: Create Task Definition**
```json
{
  "family": "tourlicity-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "tourlicity-api",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/tourlicity-api:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:tourlicity/mongodb-uri"
        }
      ]
    }
  ]
}
```

### Option 2: AWS EC2 with Docker Compose

#### **Step 1: Launch EC2 Instance**
```bash
# Launch Ubuntu 22.04 LTS instance
# Instance type: t3.medium or larger
# Security groups: Allow ports 22, 80, 443, 5000
```

#### **Step 2: Setup Docker on EC2**
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@56.228.6.103

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
sudo systemctl enable docker
sudo systemctl start docker

# Logout and login again for group changes
```

#### **Step 3: Deploy Application**
```bash
# Clone repository
git clone https://github.com/eyosibM/Tourist-Backend.git
cd Tourist-Backend

# Setup environment
cp .env.docker .env
nano .env  # Update with production values

# Start services
docker-compose up -d

# Setup auto-restart
sudo systemctl enable docker
```

### Option 3: AWS EKS (Kubernetes)

#### **Kubernetes Manifests**
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tourlicity

---
# k8s/mongodb.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
  namespace: tourlicity
spec:
  serviceName: mongodb
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          value: admin
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: password
        volumeMounts:
        - name: mongodb-storage
          mountPath: /data/db
  volumeClaimTemplates:
  - metadata:
      name: mongodb-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
```

## 🔧 Production Configuration

### **Environment Variables for Production**
```bash
# Database
MONGODB_URI=mongodb://admin:STRONG_PASSWORD@mongodb:27017/tourlicity?authSource=admin
REDIS_URL=redis://:STRONG_REDIS_PASSWORD@redis:6379

# Security
JWT_SECRET=<generate-new-256-bit-secret>
JWT_REFRESH_SECRET=<generate-new-256-bit-secret>

# External Services
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
AWS_ACCESS_KEY_ID=your-production-access-key
AWS_SECRET_ACCESS_KEY=your-production-secret-key

# Domain
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

### **SSL/TLS Setup**
```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📊 Monitoring & Logging

### **Docker Compose with Monitoring**
```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus:/etc/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### **Log Management**
```bash
# View logs
docker-compose logs -f api
docker-compose logs -f mongodb
docker-compose logs -f redis

# Log rotation
docker-compose logs --tail=100 api
```

## 🔒 Security Best Practices

### **1. Network Security**
- Use VPC with private subnets
- Security groups with minimal required ports
- WAF for web application firewall

### **2. Container Security**
- Non-root user in containers
- Read-only file systems where possible
- Regular image updates

### **3. Data Security**
- Encrypted EBS volumes
- MongoDB authentication enabled
- Redis password protection
- AWS Secrets Manager for sensitive data

## 💰 Cost Optimization

### **AWS Resources Estimate**
```
EC2 t3.medium (24/7):     ~$30/month
EBS 50GB:                 ~$5/month
Load Balancer:            ~$20/month
Data Transfer:            ~$10/month
Total:                    ~$65/month
```

### **Cost Saving Tips**
- Use Reserved Instances for 1-year commitment (30% savings)
- Auto-scaling for variable loads
- CloudWatch monitoring to optimize resources

## 🚀 Deployment Commands

### **Quick Start**
```bash
# 1. Clone and setup
git clone https://github.com/eyosibM/Tourist-Backend.git
cd Tourist-Backend
cp .env.docker .env

# 2. Start services
docker-compose up -d

# 3. Check health
curl http://localhost:5000/health

# 4. View API docs
open http://localhost:5000/api-docs
```

### **Production Deployment**
```bash
# 1. Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# 2. Start with production profile
docker-compose --profile production up -d

# 3. Setup SSL
sudo certbot --nginx -d your-domain.com

# 4. Monitor
docker-compose logs -f
```

## 📞 Support & Troubleshooting

### **Common Issues**
1. **Port conflicts**: Change ports in docker-compose.yml
2. **Memory issues**: Increase EC2 instance size
3. **Connection timeouts**: Check security groups
4. **SSL issues**: Verify domain DNS settings

### **Health Checks**
```bash
# API Health
curl http://localhost:5000/health

# MongoDB
docker exec -it tourlicity-mongodb mongosh --eval "db.adminCommand('ping')"

# Redis
docker exec -it tourlicity-redis redis-cli ping
```

Your Docker setup is production-ready with enterprise-grade Redis caching and MongoDB persistence! 🚀