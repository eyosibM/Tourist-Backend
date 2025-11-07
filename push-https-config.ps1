#!/usr/bin/env pwsh
# Push HTTPS configuration to repository

Write-Host "🔐 Pushing HTTPS Configuration" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Check git status
Write-Host "📊 Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain

if (-not $gitStatus) {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
    Write-Host ""
    Write-Host "The HTTPS configuration is already up to date." -ForegroundColor White
    exit 0
}

Write-Host "📝 Changes detected:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Add files
Write-Host "📦 Staging files..." -ForegroundColor Cyan
git add docker/nginx/nginx.conf
git add enable-https.sh
git add Dockerfile
git add fix-docker-build.sh

Write-Host "✅ Files staged" -ForegroundColor Green
Write-Host ""

# Commit
Write-Host "💾 Committing changes..." -ForegroundColor Cyan
$commitMessage = @"
feat: Enable HTTPS with SSL configuration

Changes:
- Updated nginx.conf with HTTPS support on port 443
- Added HTTP to HTTPS redirect
- Configured SSL certificates (fullchain.pem, privkey.pem)
- Added modern TLS 1.2/1.3 settings
- Enhanced security headers for HTTPS
- Added enable-https.sh script for easy deployment
- Fixed Dockerfile with canvas build dependencies

SSL Configuration:
- Listen on port 443 with HTTP/2
- SSL certificates from Let's Encrypt
- Automatic HTTP to HTTPS redirect
- Secure cipher suites
- HSTS headers for security
"@

git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Changes committed" -ForegroundColor Green
Write-Host ""

# Push
Write-Host "🌐 Pushing to remote..." -ForegroundColor Cyan
$currentBranch = git rev-parse --abbrev-ref HEAD
git push origin $currentBranch

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Changes pushed successfully" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 HTTPS configuration pushed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps on your EC2 instance:" -ForegroundColor Yellow
Write-Host "   1. SSH to your EC2:" -ForegroundColor White
Write-Host "      ssh -i 'your-key.pem' ubuntu@your-ec2-ip" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. Run the HTTPS enable script:" -ForegroundColor White
Write-Host "      cd ~/Tourist-Backend" -ForegroundColor Cyan
Write-Host "      chmod +x enable-https.sh" -ForegroundColor Cyan
Write-Host "      ./enable-https.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Or manually:" -ForegroundColor White
Write-Host "      git pull origin main" -ForegroundColor Cyan
Write-Host "      docker-compose restart nginx" -ForegroundColor Cyan
Write-Host "      curl https://api.tourlicity.com/health" -ForegroundColor Cyan
Write-Host ""
