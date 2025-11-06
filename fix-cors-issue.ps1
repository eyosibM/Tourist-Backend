#!/usr/bin/env pwsh

# =============================================================================
# Fix CORS Issue - Update Server Configuration
# =============================================================================

param(
    [string]$KeyPath = "tourlicity-key.pem",
    [string]$EC2IP = "51.20.34.93"
)

Write-Host "🔧 Fixing CORS Configuration Issue" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Step 1: Update CORS_ORIGIN in .env file
Write-Host "⚙️  Step 1: Updating CORS configuration..." -ForegroundColor Yellow
ssh -i $KeyPath ubuntu@$EC2IP @"
cd Tourist-Backend
# Update CORS_ORIGIN to include www.tourist.duckdns.org
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://www.tourist.duckdns.org,https://tourist.duckdns.org,https://tourlicity.com,http://localhost:3000,http://localhost:5173|' .env
# Update FRONTEND_URL to match
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://www.tourist.duckdns.org|' .env
echo "✅ Updated .env file"
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to update environment configuration" -ForegroundColor Red
    exit 1
}

# Step 2: Restart the API service
Write-Host "🔄 Step 2: Restarting API service..." -ForegroundColor Yellow
ssh -i $KeyPath ubuntu@$EC2IP @"
cd Tourist-Backend
docker-compose down
docker-compose up -d --build
echo "✅ API service restarted"
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to restart API service" -ForegroundColor Red
    exit 1
}

# Step 3: Wait for service to be ready
Write-Host "⏳ Step 3: Waiting for service to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 4: Test the API
Write-Host "🧪 Step 4: Testing API health..." -ForegroundColor Yellow
ssh -i $KeyPath ubuntu@$EC2IP @"
curl -s -o /dev/null -w "%{http_code}" https://api.tourlicity.com/health
echo ""
echo "✅ Health check completed"
"@

Write-Host ""
Write-Host "🎉 CORS Configuration Fixed!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ Updated CORS_ORIGIN to include: https://www.tourist.duckdns.org" -ForegroundColor Green
Write-Host "✅ Updated FRONTEND_URL to: https://www.tourist.duckdns.org" -ForegroundColor Green
Write-Host "✅ Restarted API service" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Your frontend should now be able to connect to:" -ForegroundColor Cyan
Write-Host "   API: https://api.tourlicity.com" -ForegroundColor Cyan
Write-Host "   Frontend: https://www.tourist.duckdns.org" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 If you still see CORS errors, try:" -ForegroundColor Yellow
Write-Host "   1. Clear browser cache and cookies" -ForegroundColor Yellow
Write-Host "   2. Hard refresh (Ctrl+F5)" -ForegroundColor Yellow
Write-Host "   3. Check browser developer tools for any cached service workers" -ForegroundColor Yellow