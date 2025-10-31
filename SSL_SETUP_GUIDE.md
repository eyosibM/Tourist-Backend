# 🔒 SSL/HTTPS Setup for EC2

## Current Issue
Your browser is trying to use HTTPS but the server only supports HTTP, causing `ERR_SSL_PROTOCOL_ERROR`.

## Quick Solutions

### Option 1: Use HTTP (Immediate)
- **API URL**: `http://51.20.34.93:5000`
- **Health Check**: `http://51.20.34.93:5000/health`
- **API Docs**: `http://51.20.34.93:5000/api-docs/`

### Option 2: Setup SSL Certificate (Production)

#### A. Using Let's Encrypt (Free SSL)

1. **Install Certbot on EC2:**
```bash
ssh -i "C:\Users\hp\Downloads\tourlicity-key.pem" ubuntu@51.20.34.93
sudo apt update
sudo apt install certbot nginx -y
```

2. **Get Domain Name:**
You'll need a domain name (e.g., `api.yourdomain.com`) pointing to `51.20.34.93`

3. **Generate SSL Certificate:**
```bash
sudo certbot --nginx -d api.yourdomain.com
```

#### B. Using Nginx Reverse Proxy

Create nginx configuration:
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 3: Use Cloudflare (Easiest)

1. **Add domain to Cloudflare**
2. **Point A record to**: `51.20.34.93`
3. **Enable SSL/TLS**: Full (strict)
4. **Access via**: `https://api.yourdomain.com`

## For Development (Mixed Content Issue)

If your frontend is on HTTPS (Vercel) and backend on HTTP:

### Browser Settings (Chrome):
1. Click the shield icon in address bar
2. Click "Load unsafe scripts"
3. Or add `--disable-web-security` flag for testing

### Frontend Configuration:
```javascript
// In your API config
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://51.20.34.93:5000'  // HTTP for development
  : 'https://api.yourdomain.com'; // HTTPS for production
```

## Immediate Action Required

**For now, update your frontend to use HTTP:**

```env
NEXT_PUBLIC_API_URL=http://51.20.34.93:5000
```

**Test it works:**
```bash
curl http://51.20.34.93:5000/health
```

## Production Recommendation

For production use, I recommend:
1. Get a domain name
2. Set up SSL with Let's Encrypt
3. Use Nginx as reverse proxy
4. Update frontend to use HTTPS URL

Would you like me to help set up SSL, or should we proceed with HTTP for now?