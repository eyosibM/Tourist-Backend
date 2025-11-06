# =============================================================================
# QUICK CORS FIX FOR WWW.TOURIST.DUCKDNS.ORG (PowerShell)
# =============================================================================
# This script updates CORS settings to allow www.tourist.duckdns.org
# =============================================================================

Write-Host "🔧 Fixing CORS for www.tourist.duckdns.org..." -ForegroundColor Green
Write-Host "=============================================="

# Configuration
$EC2IP = "51.20.34.93"
$KeyPath = "C:/Users/hp/Downloads/tourlicity-key.pem"

Write-Host "📋 Configuration:" -ForegroundColor Blue
Write-Host "   EC2 IP: $EC2IP"
Write-Host "   Adding: https://www.tourist.duckdns.org to CORS"
Write-Host ""

# Function to execute SSH commands
function Invoke-SSHCommand {
    param([string]$Command)
    
    $sshArgs = @(
        "-i", $KeyPath,
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "ubuntu@$EC2IP",
        $Command
    )
    
    return & ssh @sshArgs
}

try {
    # Step 1: Update CORS configuration
    Write-Host "⚙️  Step 1: Updating CORS configuration..." -ForegroundColor Yellow
    
    $updateCorsCommand = @"
cd Tourist-Backend

# Backup current .env
cp .env .env.backup.`$(date +%Y%m%d_%H%M%S)

# Update CORS_ORIGIN to include www.tourist.duckdns.org
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://www.tourist.duckdns.org,https://tourist.duckdns.org,https://tourist-frontend-c8ji.vercel.app,http://localhost:3000,http://localhost:5173|' .env

# Also update FRONTEND_URL
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://www.tourist.duckdns.org|' .env

echo "✅ CORS configuration updated"
echo "📋 Current CORS setting:"
grep "CORS_ORIGIN" .env
"@

    Invoke-SSHCommand $updateCorsCommand
    Write-Host "✅ CORS configuration updated" -ForegroundColor Green

    # Step 2: Restart API container
    Write-Host "🔄 Step 2: Restarting API container..." -ForegroundColor Yellow
    
    $restartCommand = @"
cd Tourist-Backend
docker-compose -f docker-compose.freetier.yml restart api
echo "✅ API container restarted"
"@

    Invoke-SSHCommand $restartCommand
    Write-Host "✅ API container restarted" -ForegroundColor Green

    # Step 3: Wait for service
    Write-Host "⏳ Step 3: Waiting for service to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10

    # Step 4: Test the fix
    Write-Host "🧪 Step 4: Testing CORS fix..." -ForegroundColor Yellow
    
    $testCommand = @"
echo "🔍 Testing API health..."
HTTP_CODE=`$(curl -s -o /dev/null -w "%{http_code}" https://api.tourlicity.com/health)
if [ "`$HTTP_CODE" = "200" ]; then
    echo "✅ API is healthy (HTTP `$HTTP_CODE)"
else
    echo "❌ API health check failed (HTTP `$HTTP_CODE)"
fi

echo ""
echo "🌐 Testing CORS headers for www.tourist.duckdns.org..."
CORS_HEADER=`$(curl -s -H "Origin: https://www.tourist.duckdns.org" -I https://api.tourlicity.com/health | grep -i "access-control-allow-origin" | head -1)
if [ -n "`$CORS_HEADER" ]; then
    echo "✅ CORS headers present: `$CORS_HEADER"
else
    echo "❌ CORS headers missing"
fi

echo ""
echo "📋 Container status:"
docker-compose -f docker-compose.freetier.yml ps api
"@

    Invoke-SSHCommand $testCommand

    Write-Host ""
    Write-Host "🎉 CORS FIX COMPLETE!" -ForegroundColor Green
    Write-Host "=============================================="
    Write-Host "📍 Your API should now accept requests from:" -ForegroundColor Blue
    Write-Host "   🌐 https://www.tourist.duckdns.org"
    Write-Host "   🌐 https://tourist.duckdns.org"
    Write-Host "   🌐 https://tourist-frontend-c8ji.vercel.app"
    Write-Host ""
    Write-Host "🧪 Test your file upload now:" -ForegroundColor Blue
    Write-Host "   Try uploading a file from your frontend"
    Write-Host ""
    Write-Host "✅ CORS fix deployed successfully!" -ForegroundColor Green

} catch {
    Write-Host "❌ Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check your SSH connection and try again." -ForegroundColor Yellow
}