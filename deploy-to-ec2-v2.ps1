#!/usr/bin/env pwsh
# Tourlicity Backend v2.0.0 - Complete Deployment Script (Windows to EC2)
# This script handles both git push and EC2 deployment

param(
    [string]$KeyPath = "",
    [string]$EC2Host = "",
    [switch]$SkipGitPush,
    [switch]$SkipTests
)

Write-Host "🚀 Tourlicity Backend v2.0.0 - Complete Deployment" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_NAME = "Tourist-Backend"
$REMOTE_USER = "ubuntu"
$REMOTE_PATH = "/home/ubuntu/$PROJECT_NAME"

# Check if SSH key path is provided
if ([string]::IsNullOrEmpty($KeyPath)) {
    Write-Host "⚠️  SSH key path not provided" -ForegroundColor Yellow
    $KeyPath = Read-Host "Enter path to your EC2 SSH key (.pem file)"
}

# Check if EC2 host is provided
if ([string]::IsNullOrEmpty($EC2Host)) {
    Write-Host "⚠️  EC2 host not provided" -ForegroundColor Yellow
    $EC2Host = Read-Host "Enter your EC2 host (IP or domain)"
}

# Validate SSH key exists
if (-not (Test-Path $KeyPath)) {
    Write-Host "❌ SSH key not found: $KeyPath" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "   SSH Key: $KeyPath" -ForegroundColor Gray
Write-Host "   EC2 Host: $EC2Host" -ForegroundColor Gray
Write-Host "   Remote Path: $REMOTE_PATH" -ForegroundColor Gray
Write-Host ""

# Step 1: Git Push (unless skipped)
if (-not $SkipGitPush) {
    Write-Host "📦 Step 1: Pushing changes to Git..." -ForegroundColor Cyan
    Write-Host ""
    
    # Run the git update script
    if (Test-Path "deploy-v2-update.ps1") {
        & .\deploy-v2-update.ps1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Git push failed" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "⚠️  deploy-v2-update.ps1 not found, skipping git push" -ForegroundColor Yellow
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping git push (--SkipGitPush flag set)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 2: Test SSH Connection
Write-Host "🔌 Step 2: Testing SSH connection..." -ForegroundColor Cyan
$sshTest = ssh -i $KeyPath -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$REMOTE_USER@$EC2Host" "echo 'Connection successful'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SSH connection failed" -ForegroundColor Red
    Write-Host "   Please check:" -ForegroundColor Yellow
    Write-Host "   - EC2 instance is running" -ForegroundColor Yellow
    Write-Host "   - Security group allows SSH (port 22)" -ForegroundColor Yellow
    Write-Host "   - SSH key has correct permissions" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ SSH connection successful" -ForegroundColor Green
Write-Host ""

# Step 3: Upload deployment script to EC2
Write-Host "📤 Step 3: Uploading deployment script to EC2..." -ForegroundColor Cyan

if (Test-Path "deploy-ec2-v2.sh") {
    scp -i $KeyPath deploy-ec2-v2.sh "$REMOTE_USER@$EC2Host`:$REMOTE_PATH/"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to upload deployment script" -ForegroundColor Red
        exit 1
    }
    
    # Make script executable
    ssh -i $KeyPath "$REMOTE_USER@$EC2Host" "chmod +x $REMOTE_PATH/deploy-ec2-v2.sh"
    
    Write-Host "✅ Deployment script uploaded" -ForegroundColor Green
} else {
    Write-Host "⚠️  deploy-ec2-v2.sh not found, will use manual commands" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Run deployment on EC2
Write-Host "🚀 Step 4: Running deployment on EC2..." -ForegroundColor Cyan
Write-Host "   This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

$deploymentCommand = @"
cd $REMOTE_PATH && \
if [ -f deploy-ec2-v2.sh ]; then \
    ./deploy-ec2-v2.sh; \
else \
    echo 'Running manual deployment...'; \
    git pull origin main && \
    docker-compose down && \
    docker-compose up -d --build && \
    sleep 10 && \
    curl -f http://localhost:5000/health; \
fi
"@

ssh -i $KeyPath "$REMOTE_USER@$EC2Host" $deploymentCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Checking logs..." -ForegroundColor Yellow
    ssh -i $KeyPath "$REMOTE_USER@$EC2Host" "cd $REMOTE_PATH && docker-compose logs --tail=50"
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment completed on EC2" -ForegroundColor Green
Write-Host ""

# Step 5: Verify deployment
Write-Host "🔍 Step 5: Verifying deployment..." -ForegroundColor Cyan

# Test public API endpoint
Write-Host "   Testing public API endpoint..." -ForegroundColor Gray
$apiTest = curl -s -f "https://api.tourlicity.com/health" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Public API is accessible" -ForegroundColor Green
    
    # Parse and display health info
    try {
        $healthData = $apiTest | ConvertFrom-Json
        Write-Host "   Status: $($healthData.status)" -ForegroundColor Gray
        Write-Host "   Database: $($healthData.services.database)" -ForegroundColor Gray
        Write-Host "   Redis: $($healthData.services.redis)" -ForegroundColor Gray
        if ($healthData.cache) {
            Write-Host "   Cache Hit Rate: $($healthData.cache.hitRate)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   API is responding but couldn't parse health data" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Public API not accessible yet (may need a few more seconds)" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Run tests (unless skipped)
if (-not $SkipTests) {
    Write-Host "🧪 Step 6: Running API tests..." -ForegroundColor Cyan
    
    $testCommand = "cd $REMOTE_PATH && node scripts/test-new-features.js"
    ssh -i $KeyPath "$REMOTE_USER@$EC2Host" $testCommand
    
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping tests (--SkipTests flag set)" -ForegroundColor Yellow
    Write-Host ""
}

# Display summary
Write-Host "🎉 Deployment Summary" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "   Version: v2.0.0" -ForegroundColor White
Write-Host "   API URL: https://api.tourlicity.com" -ForegroundColor White
Write-Host "   Documentation: https://api.tourlicity.com/api-docs" -ForegroundColor White
Write-Host "   Health Check: https://api.tourlicity.com/health" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test the API: curl https://api.tourlicity.com/health" -ForegroundColor White
Write-Host "   2. Check documentation: https://api.tourlicity.com/api-docs" -ForegroundColor White
Write-Host "   3. Test new features: curl https://api.tourlicity.com/api/activities" -ForegroundColor White
Write-Host "   4. Monitor logs: ssh -i `"$KeyPath`" $REMOTE_USER@$EC2Host 'cd $REMOTE_PATH && docker-compose logs -f'" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Useful SSH Commands:" -ForegroundColor Yellow
Write-Host "   Connect to EC2:" -ForegroundColor Gray
Write-Host "   ssh -i `"$KeyPath`" $REMOTE_USER@$EC2Host" -ForegroundColor Cyan
Write-Host ""
Write-Host "   View logs:" -ForegroundColor Gray
Write-Host "   ssh -i `"$KeyPath`" $REMOTE_USER@$EC2Host 'cd $REMOTE_PATH && docker-compose logs -f'" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Restart API:" -ForegroundColor Gray
Write-Host "   ssh -i `"$KeyPath`" $REMOTE_USER@$EC2Host 'cd $REMOTE_PATH && docker-compose restart api'" -ForegroundColor Cyan
Write-Host ""

Write-Host "✨ Deployment complete! Your API is now running v2.0.0" -ForegroundColor Green
Write-Host ""
