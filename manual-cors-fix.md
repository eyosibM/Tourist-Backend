# Manual CORS Fix - Step by Step Instructions

## 🎯 Goal
Allow API requests from both `https://www.tourist.duckdns.org` and `https://tourist.duckdns.org`

## 📋 Manual Steps

### Step 1: Connect to Server
```bash
ssh -i tourlicity-key.pem ubuntu@51.20.34.93
```

### Step 2: Navigate to Project Directory
```bash
cd Tourist-Backend
```

### Step 3: Update CORS Configuration
```bash
# Update the .env file to include both domains
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://www.tourist.duckdns.org,https://tourist.duckdns.org,https://tourlicity.com,http://localhost:3000,http://localhost:5173|' .env

# Update the frontend URL to the www version
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://www.tourist.duckdns.org|' .env
```

### Step 4: Verify Configuration
```bash
# Check that the changes were applied correctly
grep "CORS_ORIGIN" .env
grep "FRONTEND_URL" .env
```

**Expected Output:**
```
CORS_ORIGIN=https://www.tourist.duckdns.org,https://tourist.duckdns.org,https://tourlicity.com,http://localhost:3000,http://localhost:5173
FRONTEND_URL=https://www.tourist.duckdns.org
```

### Step 5: Restart API Service
```bash
# Stop current containers
docker-compose down

# Start containers with new configuration
docker-compose up -d --build
```

### Step 6: Wait for Service to Start
```bash
# Wait 15 seconds for containers to fully start
sleep 15
```

### Step 7: Verify API Health
```bash
# Test the API health endpoint
curl -I https://api.tourlicity.com/health

# Should return HTTP/1.1 200 OK
```

### Step 8: Test CORS Headers
```bash
# Test CORS headers from both domains
curl -H "Origin: https://www.tourist.duckdns.org" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://api.tourlicity.com/auth/register

curl -H "Origin: https://tourist.duckdns.org" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://api.tourlicity.com/auth/register
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: https://www.tourist.duckdns.org
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: Content-Type,Authorization
Access-Control-Allow-Credentials: true
```

### Step 9: Check Container Status
```bash
# Verify all containers are running
docker ps

# Check API logs for any errors
docker logs tourlicity-api --tail=20
```

## 🔍 Troubleshooting

### If API doesn't respond:
```bash
# Check container logs
docker logs tourlicity-api --tail=50

# Restart if needed
docker-compose restart api
```

### If CORS still fails:
```bash
# Double-check environment variables
docker exec tourlicity-api env | grep CORS
docker exec tourlicity-api env | grep FRONTEND

# Should show:
# CORS_ORIGIN=https://www.tourist.duckdns.org,https://tourist.duckdns.org,https://tourlicity.com,http://localhost:3000,http://localhost:5173
# FRONTEND_URL=https://www.tourist.duckdns.org
```

### If containers won't start:
```bash
# Check Docker logs
docker-compose logs

# Free up space if needed
docker system prune -f

# Rebuild from scratch
docker-compose down
docker-compose up -d --build --force-recreate
```

## ✅ Success Verification

The fix is successful when:

1. **Health Check Returns 200:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" https://api.tourlicity.com/health
   # Should return: 200
   ```

2. **CORS Headers Present:**
   ```bash
   curl -I -H "Origin: https://www.tourist.duckdns.org" https://api.tourlicity.com/health | grep -i "access-control"
   # Should show CORS headers
   ```

3. **Frontend Can Connect:**
   - Open `https://www.tourist.duckdns.org` in browser
   - Try to register/login
   - Check browser console for CORS errors (should be none)

## 🚨 Emergency Rollback

If something goes wrong, rollback with:

```bash
cd Tourist-Backend

# Restore previous CORS configuration
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://tourlicity.com,https://tourist.duckdns.org,http://localhost:3000,http://localhost:5173|' .env
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://tourist.duckdns.org|' .env

# Restart services
docker-compose down
docker-compose up -d --build
```

## 📝 Notes

- Both `https://www.tourist.duckdns.org` and `https://tourist.duckdns.org` are now allowed
- The primary frontend URL is set to the www version
- Local development domains remain for testing
- All changes take effect after container restart
- No code changes required, only environment configuration

---

**Estimated Time:** 5-10 minutes
**Risk Level:** Low (easily reversible)
**Downtime:** ~30 seconds during container restart