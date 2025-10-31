# 🔒 HTTPS Setup Guide for Tourlicity

This guide will help you set up HTTPS for `tourlicity.duckdns.org` using Let's Encrypt SSL certificates.

## 🚀 Quick Setup (Automated)

Run the automated setup script:

```bash
chmod +x setup-https.sh
./setup-https.sh
```

## 📋 Manual Setup Steps

If you prefer to set up HTTPS manually:

### Step 1: Install Certbot

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Stop Current Containers

```bash
docker-compose -f docker-compose.freetier.yml down
```

### Step 3: Get SSL Certificate

```bash
sudo certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email opeyemioladejobi@gmail.com \
    -d tourlicity.duckdns.org
```

### Step 4: Copy Certificates for Docker

```bash
mkdir -p docker/nginx/ssl
sudo cp /etc/letsencrypt/live/tourlicity.duckdns.org/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/tourlicity.duckdns.org/privkey.pem docker/nginx/ssl/
sudo chmod 644 docker/nginx/ssl/fullchain.pem
sudo chmod 600 docker/nginx/ssl/privkey.pem
sudo chown $USER:$USER docker/nginx/ssl/*
```

### Step 5: Start HTTPS Services

```bash
docker-compose -f docker-compose.https.yml up -d --build
```

## 🔍 Verify HTTPS Setup

Test your HTTPS endpoints:

```bash
# Health check
curl https://tourlicity.duckdns.org/health

# API documentation
curl https://tourlicity.duckdns.org/api-docs

# Check SSL certificate
openssl s_client -connect tourlicity.duckdns.org:443 -servername tourlicity.duckdns.org
```

## 🔄 Certificate Renewal

### Automatic Renewal

The setup script creates an automatic renewal system:

- **Frequency**: Twice daily (certificates renew when they have 30 days left)
- **Log file**: `ssl-renewal.log`
- **Cron job**: Automatically added to your crontab

### Manual Renewal

If you need to renew manually:

```bash
./renew-ssl.sh
```

Or step by step:

```bash
# Stop nginx
docker stop tourlicity-nginx

# Renew certificates
sudo certbot renew --standalone

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/tourlicity.duckdns.org/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/tourlicity.duckdns.org/privkey.pem docker/nginx/ssl/
sudo chmod 644 docker/nginx/ssl/fullchain.pem
sudo chmod 600 docker/nginx/ssl/privkey.pem
sudo chown $USER:$USER docker/nginx/ssl/*

# Restart nginx
docker start tourlicity-nginx
```

## 🛠️ Troubleshooting

### Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Test renewal (dry run)
sudo certbot renew --dry-run

# Check nginx logs
docker logs tourlicity-nginx
```

### Port Issues

```bash
# Check what's using port 80/443
sudo ss -tlnp | grep -E ':(80|443)'

# Make sure AWS Security Group allows HTTPS (port 443)
```

### DNS Issues

```bash
# Verify domain resolution
nslookup tourlicity.duckdns.org

# Check if domain points to your EC2 IP
curl -I http://tourlicity.duckdns.org
```

## 📊 What Changes with HTTPS

### Before (HTTP only):
- ❌ `http://tourlicity.duckdns.org` (insecure)
- ❌ No encryption
- ❌ Browser warnings

### After (HTTPS):
- ✅ `https://tourlicity.duckdns.org` (secure)
- ✅ SSL/TLS encryption
- ✅ Automatic HTTP → HTTPS redirect
- ✅ Security headers
- ✅ Browser trust

## 🔧 Configuration Files

The setup creates these key files:

- `docker-compose.https.yml` - HTTPS-enabled Docker Compose
- `docker/nginx/nginx-ssl.conf` - Nginx SSL configuration
- `docker/nginx/ssl/` - SSL certificate directory
- `renew-ssl.sh` - Certificate renewal script

## 🎯 Next Steps

After HTTPS is set up:

1. **Update your frontend** to use `https://tourlicity.duckdns.org`
2. **Update Google OAuth** redirect URIs to use HTTPS
3. **Test all API endpoints** with HTTPS
4. **Monitor certificate expiration** (auto-renewal should handle this)

## 🔐 Security Features

The HTTPS setup includes:

- **TLS 1.2 and 1.3** support
- **Strong cipher suites**
- **HSTS headers** (HTTP Strict Transport Security)
- **Security headers** (X-Frame-Options, X-XSS-Protection, etc.)
- **Rate limiting** on API endpoints
- **Automatic HTTP to HTTPS redirect**