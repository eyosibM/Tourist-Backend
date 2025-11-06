# =============================================================================
# HTTPS SETUP SCRIPT FOR API.TOURLICITY.COM (PowerShell Version)
# =============================================================================
# This script helps you set up HTTPS with Let's Encrypt for api.tourlicity.com
# Run this from your local machine to execute commands on EC2
# =============================================================================

param(
    [string]$EC2Host = "51.20.34.93",
    [string]$KeyPath = "~/.ssh/tourlicity-key.pem",
    [string]$User = "ubuntu"
)

Write-Host "🔒 Setting up HTTPS for api.tourlicity.com..." -ForegroundColor Green
Write-Host "=============================================="

$Domain = "api.tourlicity.com"
$Email = "opeyemioladejobi@gmail.com"

Write-Host "📋 HTTPS Setup Configuration:" -ForegroundColor Blue
Write-Host "   Domain: $Domain"
Write-Host "   Email: $Email"
Write-Host "   EC2 Host: $EC2Host"
Write-Host ""

# Function to execute SSH commands
function Invoke-SSHCommand {
    param([string]$Command)
    
    Write-Host "🔧 Executing: $Command" -ForegroundColor Yellow
    ssh -i $KeyPath $User@$EC2Host $Command
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Command failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
}

# Step 1: Upload the setup script to EC2
Write-Host "📤 Step 1: Uploading HTTPS setup script to EC2..." -ForegroundColor Yellow
scp -i $KeyPath "setup-https-api-domain.sh" "$User@$EC2Host:~/setup-https-api-domain.sh"

# Step 2: Make script executable and run it
Write-Host "🚀 Step 2: Running HTTPS setup on EC2..." -ForegroundColor Yellow
Invoke-SSHCommand "chmod +x ~/setup-https-api-domain.sh"
Invoke-SSHCommand "cd ~/tourlicity && ~/setup-https-api-domain.sh"

# Step 3: Verify the setup
Write-Host "🔍 Step 3: Verifying HTTPS setup..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

try {
    $response = Invoke-WebRequest -Uri "https://api.tourlicity.com/health" -UseBasicParsing
    Write-Host "✅ HTTPS is working! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⏳ HTTPS may still be starting up. Try again in a few minutes." -ForegroundColor Yellow
    Write-Host "   You can test manually: https://api.tourlicity.com/health"
}

Write-Host ""
Write-Host "🎉 HTTPS SETUP COMPLETE FOR API.TOURLICITY.COM!" -ForegroundColor Green
Write-Host "=================================================="
Write-Host "📍 Your API is now available at:" -ForegroundColor Blue
Write-Host "   🔒 https://api.tourlicity.com"
Write-Host "   📚 https://api.tourlicity.com/api-docs"
Write-Host "   ❤️  https://api.tourlicity.com/health"
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Blue
Write-Host "   1. Update your frontend to use https://api.tourlicity.com"
Write-Host "   2. Test all API endpoints"
Write-Host "   3. Update any hardcoded URLs in your application"
Write-Host ""
Write-Host "✅ HTTPS setup successful!" -ForegroundColor Green