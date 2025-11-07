#!/bin/bash
# Enable HTTPS for Tourlicity API

echo "🔐 Enabling HTTPS for Tourlicity API"
echo "====================================="
echo ""

# Check if SSL certificates exist
if [ ! -f "docker/nginx/ssl/fullchain.pem" ] || [ ! -f "docker/nginx/ssl/privkey.pem" ]; then
    echo "❌ SSL certificates not found!"
    echo "   Expected files:"
    echo "   - docker/nginx/ssl/fullchain.pem"
    echo "   - docker/nginx/ssl/privkey.pem"
    echo ""
    echo "Please ensure SSL certificates are in place before enabling HTTPS."
    exit 1
fi

echo "✅ SSL certificates found"
echo ""

# Pull latest nginx configuration
echo "📥 Pulling latest nginx configuration..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed"
    exit 1
fi

echo "✅ Configuration updated"
echo ""

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
docker exec tourlicity-nginx nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed"
    echo "   Please check the configuration file"
    exit 1
fi

echo "✅ Nginx configuration is valid"
echo ""

# Restart nginx
echo "🔄 Restarting nginx..."
docker-compose restart nginx

if [ $? -ne 0 ]; then
    echo "❌ Failed to restart nginx"
    exit 1
fi

echo "✅ Nginx restarted"
echo ""

# Wait for nginx to start
echo "⏳ Waiting for nginx to start..."
sleep 5

# Test HTTPS
echo "🧪 Testing HTTPS connection..."
if curl -f -k https://localhost/health > /dev/null 2>&1; then
    echo "✅ HTTPS is working locally"
else
    echo "⚠️  HTTPS test failed locally"
    echo "   Checking nginx logs..."
    docker-compose logs nginx --tail=20
fi

echo ""

# Test public HTTPS
echo "🌐 Testing public HTTPS..."
if curl -f https://api.tourlicity.com/health > /dev/null 2>&1; then
    echo "✅ Public HTTPS is working!"
    echo ""
    echo "🎉 HTTPS enabled successfully!"
    echo ""
    echo "📊 Your API is now accessible at:"
    echo "   - https://api.tourlicity.com"
    echo "   - https://api.tourlicity.com/health"
    echo "   - https://api.tourlicity.com/api-docs"
    echo ""
    echo "🔒 HTTP requests will automatically redirect to HTTPS"
else
    echo "⚠️  Public HTTPS not accessible yet"
    echo ""
    echo "This could be due to:"
    echo "1. DNS propagation (may take a few minutes)"
    echo "2. Firewall/Security group blocking port 443"
    echo "3. SSL certificate domain mismatch"
    echo ""
    echo "📋 Troubleshooting steps:"
    echo "1. Check if port 443 is open:"
    echo "   sudo netstat -tlnp | grep 443"
    echo ""
    echo "2. Check nginx is listening on 443:"
    echo "   docker exec tourlicity-nginx netstat -tlnp | grep 443"
    echo ""
    echo "3. Check SSL certificate domain:"
    echo "   openssl x509 -in docker/nginx/ssl/fullchain.pem -text -noout | grep DNS"
    echo ""
    echo "4. Test with curl verbose:"
    echo "   curl -v https://api.tourlicity.com/health"
fi

echo ""
echo "✨ Script completed"
echo ""
