# =============================================================================
# DEPLOY API DOMAIN SCRIPT (PowerShell)
# =============================================================================
# This script deploys your API to use api.tourlicity.com with HTTPS
# =============================================================================

param(
    [string]$EC2Host = "51.20.34.93",
    [string]$KeyPath = "~/.ssh/tourlicity-key.pem",
    [string]$User = "ubuntu"
)

Write-Host "🚀 Deploying Tourlicity API to api.tourlicity.com..." -ForegroundColor Green
Write-Host "=================================================="

# Function to execute SSH commands
function Invoke-SSHCommand {
    param([string]$Command)
    
    Write-Host "🔧 Executing: $Command" -ForegroundColor Yellow
    ssh -i $KeyPath $User@$EC2Host $Command
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Command failed with exit code $LASTEXITCODE" -ForegroundColor Red
        return $false
    }
    return $true
}

# Step 1: Upload necessary files
Write-Host "📤 Step 1: Uploading files to EC2..." -ForegroundColor Yellow

$filesToUpload = @(
    "setup-https-api-domain.sh",
    ".env.api-domain"
)

foreach ($file in $filesToUpload) {
    Write-Host "   Uploading $file..."
    scp -i $KeyPath $file "$User@$EC2Host:~/$file"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to upload $file" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Backup current setup
Write-Host "💾 Step 2: Creating backup of current setup..." -ForegroundColor Yellow
Invoke-SSHCommand "cd ~/tourlicity && cp .env .env.backup.$(date +%Y%m%d_%H%M%S)"

# Step 3: Update environment configuration
Write-Host "⚙️ Step 3: Updating environment configuration..." -ForegroundColor Yellow
Invoke-SSHCommand "cd ~/tourlicity && cp ~/.env.api-domain .env"

# Step 4: Stop current services
Write-Host "🛑 Step 4: Stopping current services..." -ForegroundColor Yellow
Invoke-SSHCommand "cd ~/tourlicity && docker-compose -f docker-compose.freetier.yml down"

# Step 5: Run HTTPS setup
Write-Host "🔒 Step 5: Setting up HTTPS for api.tourlicity.com..." -ForegroundColor Yellow
Invoke-SSHCommand "chmod +x ~/setup-https-api-domain.sh"
$httpsResult = Invoke-SSHCommand "cd ~/tourlicity && ~/setup-https-api-domain.sh"

if (-not $httpsResult) {
    Write-Host "❌ HTTPS setup failed. Check the logs on EC2." -ForegroundColor Red
    exit 1
}

# Step 6: Wait for services to start
Write-Host "⏳ Step 6: Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 45

# Step 7: Verify deployment
Write-Host "🔍 Step 7: Verifying deployment..." -ForegroundColor Yellow

$maxRetries = 5
$retryCount = 0
$deploymentSuccess = $false

while ($retryCount -lt $maxRetries -and -not $deploymentSuccess) {
    try {
        Write-Host "   Testing HTTPS endpoint (attempt $($retryCount + 1)/$maxRetries)..."
        $response = Invoke-WebRequest -Uri "https://api.tourlicity.com/health" -UseBasicParsing -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ API is responding! Status: $($response.StatusCode)" -ForegroundColor Green
            $deploymentSuccess = $true
        }
    } catch {
        Write-Host "   ⏳ API not ready yet, retrying in 15 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
        $retryCount++
    }
}

if (-not $deploymentSuccess) {
    Write-Host "⚠️ API may still be starting up. Manual verification needed." -ForegroundColor Yellow
}

# Step 8: Test key endpoints
if ($deploymentSuccess) {
    Write-Host "🧪 Step 8: Testing key endpoints..." -ForegroundColor Yellow
    
    $endpoints = @(
        "https://api.tourlicity.com/health",
        "https://api.tourlicity.com/api-docs"
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 10
            Write-Host "   ✅ $endpoint - Status: $($response.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️ $endpoint - Not accessible" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "======================="
Write-Host ""
Write-Host "📍 Your API is now available at:" -ForegroundColor Blue
Write-Host "   🔒 https://api.tourlicity.com"
Write-Host "   📚 https://api.tourlicity.com/api-docs"
Write-Host "   ❤️  https://api.tourlicity.com/health"
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Blue
Write-Host "   1. Update your frontend to use https://api.tourlicity.com"
Write-Host "   2. Test all API endpoints thoroughly"
Write-Host "   3. Update any documentation with the new URL"
Write-Host "   4. Monitor the deployment for any issues"
Write-Host ""

if ($deploymentSuccess) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Deployment may need manual verification. Check EC2 logs if needed." -ForegroundColor Yellow
    Write-Host "   SSH command: ssh -i $KeyPath $User@$EC2Host" -ForegroundColor Cyan
    Write-Host "   Check logs: docker-compose -f docker-compose.api-https.yml logs" -ForegroundColor Cyan
}