#!/usr/bin/env pwsh

# =============================================================================
# Repository Cleanup Script
# =============================================================================
# This script organizes deployment files and cleans up the repository

Write-Host "🧹 Cleaning up Tourlicity Backend Repository" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Create deployment directory structure
Write-Host "📁 Creating organized directory structure..." -ForegroundColor Yellow

$deploymentDirs = @(
    "deployment",
    "deployment/scripts",
    "deployment/docker",
    "deployment/docs",
    "deployment/tests"
)

foreach ($dir in $deploymentDirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created directory: $dir" -ForegroundColor Green
    }
}

# Move deployment scripts to organized structure
Write-Host ""
Write-Host "📦 Organizing deployment files..." -ForegroundColor Yellow

$filesToMove = @{
    # Deployment scripts
    "deploy-backend-updates.sh" = "deployment/scripts/"
    "test-backend-updates.sh" = "deployment/scripts/"
    "deploy-freetier.sh" = "deployment/scripts/"
    "deploy.sh" = "deployment/scripts/"
    "deploy-to-ec2.sh" = "deployment/scripts/"
    "deploy-to-ec2.ps1" = "deployment/scripts/"
    "update-ec2-deployment.sh" = "deployment/scripts/"
    "update-ec2-deployment.ps1" = "deployment/scripts/"
    "quick-update-ec2.sh" = "deployment/scripts/"
    
    # CORS and fix scripts
    "fix-cors-www-domain.sh" = "deployment/scripts/"
    "fix-cors-www-domain.ps1" = "deployment/scripts/"
    "fix-upload-cors-complete.sh" = "deployment/scripts/"
    "fix-upload-cors-complete.ps1" = "deployment/scripts/"
    "update-cors-ec2.ps1" = "deployment/scripts/"
    
    # HTTPS and SSL scripts
    "setup-https.sh" = "deployment/scripts/"
    "setup-https-api-domain.sh" = "deployment/scripts/"
    "setup-letsencrypt.sh" = "deployment/scripts/"
    "fix-https-ec2.sh" = "deployment/scripts/"
    
    # Environment and configuration scripts
    "update-ec2-env.sh" = "deployment/scripts/"
    "update-ec2-env.ps1" = "deployment/scripts/"
    "configure-email-ec2.sh" = "deployment/scripts/"
    
    # Docker configurations
    "docker-compose.freetier.yml" = "deployment/docker/"
    "docker-compose.prod.yml" = "deployment/docker/"
    "Dockerfile.production" = "deployment/docker/"
    
    # Documentation
    "AWS_FREE_TIER_DEPLOYMENT.md" = "deployment/docs/"
    "AWS_DOCKER_DEPLOYMENT_GUIDE.md" = "deployment/docs/"
    "WINDOWS_SSH_GUIDE.md" = "deployment/docs/"
    "DOCKER_DEPLOYMENT_SUMMARY.md" = "deployment/docs/"
    "FRONTEND_CONNECTION_GUIDE.md" = "deployment/docs/"
    "SSL_SETUP_GUIDE.md" = "deployment/docs/"
    "DEPLOYMENT_SUCCESS_SUMMARY.md" = "deployment/docs/"
    "FRONTEND_INTEGRATION_GUIDE.md" = "deployment/docs/"
    "DOMAIN_SETUP_SUCCESS.md" = "deployment/docs/"
    "HTTPS_SUCCESS_SUMMARY.md" = "deployment/docs/"
    "DEPLOYMENT_FIX_SUMMARY.md" = "deployment/docs/"
    "HTTPS_SETUP_GUIDE.md" = "deployment/docs/"
    "VERCEL_DEPLOYMENT_GUIDE.md" = "deployment/docs/"
    "FREE_REDIS_HOSTING_GUIDE.md" = "deployment/docs/"
    "BACKEND_UPDATES_SUMMARY.md" = "deployment/docs/"
    
    # Test scripts
    "scripts/test-complete-integration.js" = "deployment/tests/"
    "scripts/test-deployed-fixes.js" = "deployment/tests/"
    "scripts/test-redis-connection.js" = "deployment/tests/"
}

foreach ($file in $filesToMove.Keys) {
    if (Test-Path $file) {
        $destination = $filesToMove[$file]
        Move-Item -Path $file -Destination $destination -Force
        Write-Host "✅ Moved: $file → $destination" -ForegroundColor Green
    }
}

# Remove obsolete files
Write-Host ""
Write-Host "🗑️  Removing obsolete files..." -ForegroundColor Yellow

$filesToRemove = @(
    "diagnose-server.sh",
    "deploy-api-domain.ps1",
    "setup-https-api-domain.ps1",
    ".env.api-domain",
    "manual-ec2-commands.md",
    "manual-ec2-env-update.ps1"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force
        Write-Host "✅ Removed: $file" -ForegroundColor Green
    }
}

# Create main deployment script
Write-Host ""
Write-Host "📝 Creating main deployment script..." -ForegroundColor Yellow

# This will be created in the next step

Write-Host ""
Write-Host "🎉 Repository cleanup completed!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 New structure:" -ForegroundColor Cyan
Write-Host "   deployment/" -ForegroundColor Cyan
Write-Host "   ├── scripts/     (All deployment scripts)" -ForegroundColor Cyan
Write-Host "   ├── docker/      (Docker configurations)" -ForegroundColor Cyan
Write-Host "   ├── docs/        (Deployment documentation)" -ForegroundColor Cyan
Write-Host "   └── tests/       (Integration tests)" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Run: git add ." -ForegroundColor Yellow
Write-Host "   2. Run: git commit -m 'Organize deployment files and clean up repository'" -ForegroundColor Yellow
Write-Host "   3. Run: git push origin main" -ForegroundColor Yellow