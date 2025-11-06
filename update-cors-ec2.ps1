# =============================================================================
# UPDATE CORS CONFIGURATION ON EC2
# =============================================================================

Write-Host "🔄 Updating CORS configuration on EC2..." -ForegroundColor Blue

# Configuration
$EC2_IP = "51.20.34.93"
$KEY_PATH = "C:\Users\hp\Downloads\tourlicity-key.pem"

Write-Host "📋 Updating CORS to allow:" -ForegroundColor Blue
Write-Host "   ✅ https://tourist-frontend-gamma.vercel.app (NEW)"
Write-Host "   ✅ https://tourlicity.com (NEW)"
Write-Host "   ✅ https://tourist-frontend-c8ji.vercel.app (OLD)"
Write-Host "   ✅ Local development URLs"
Write-Host ""

# Step 1: Update CORS_ORIGIN in .env file
Write-Host "⚙️  Step 1: Updating CORS configuration..." -ForegroundColor Yellow
ssh -i $KEY_PATH ubuntu@$EC2_IP @"
cd Tourist-Backend
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://tourist-frontend-gamma.vercel.app,https://tourlicity.com,https://tourist-frontend-c8ji.vercel.app,http://localhost:3000,http://localhost:3001,http://localhost:5173|' .env
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://tourist-frontend-gamma.vercel.app|' .env
"@
Write-Host "✅ CORS configuration updated" -ForegroundColor Green

# Step 2: Restart containers to apply changes
Write-Host "🔄 Step 2: Restarting containers..." -ForegroundColor Yellow
ssh -i $KEY_PATH ubuntu@$EC2_IP "cd Tourist-Backend && docker-compose -f docker-compose.freetier.yml restart"
Write-Host "✅ Containers restarted" -ForegroundColor Green

# Step 3: Verify the update
Write-Host "🔍 Step 3: Verifying update..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
ssh -i $KEY_PATH ubuntu@$EC2_IP "cd Tourist-Backend && curl -s http://localhost:5000/health | head -5"

Write-Host ""
Write-Host "🎉 CORS UPDATE COMPLETE!" -ForegroundColor Green
Write-Host "=============================================="
Write-Host "Your API now accepts requests from:" -ForegroundColor Blue
Write-Host "   🌐 https://tourist-frontend-gamma.vercel.app"
Write-Host "   🌐 https://tourlicity.com"
Write-Host "   🌐 https://tourist-frontend-c8ji.vercel.app"
Write-Host ""
Write-Host "✅ CORS update successful!" -ForegroundColor Green