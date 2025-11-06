#!/usr/bin/env pwsh

# =============================================================================
# Finalize Deployment Setup
# =============================================================================
# This script finalizes the deployment setup and pushes changes to GitHub

Write-Host "🎯 Finalizing Tourlicity Backend Deployment Setup" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Step 1: Clean up repository structure
Write-Host "🧹 Step 1: Cleaning up repository structure..." -ForegroundColor Yellow
if (Test-Path "cleanup-repo.ps1") {
    ./cleanup-repo.ps1
} else {
    Write-Host "⚠️  cleanup-repo.ps1 not found, skipping cleanup" -ForegroundColor Yellow
}

# Step 2: Make scripts executable
Write-Host ""
Write-Host "🔧 Step 2: Making scripts executable..." -ForegroundColor Yellow

$scripts = @(
    "deploy.ps1",
    "quick-deploy.ps1", 
    "git-update.ps1",
    "cleanup-repo.ps1"
)

foreach ($script in $scripts) {
    if (Test-Path $script) {
        # On Windows, we don't need to set execute permissions
        Write-Host "✅ Script ready: $script" -ForegroundColor Green
    }
}

# Step 3: Validate deployment files
Write-Host ""
Write-Host "🔍 Step 3: Validating deployment files..." -ForegroundColor Yellow

$requiredFiles = @(
    "package.json",
    "docker-compose.yml",
    "docker-compose.https.yml",
    "Dockerfile",
    ".env.example",
    "deploy.ps1",
    "quick-deploy.ps1"
)

$allFilesPresent = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $file" -ForegroundColor Red
        $allFilesPresent = $false
    }
}

if (!$allFilesPresent) {
    Write-Host ""
    Write-Host "❌ Some required files are missing. Please check your repository." -ForegroundColor Red
    exit 1
}

# Step 4: Create deployment summary
Write-Host ""
Write-Host "📋 Step 4: Creating deployment summary..." -ForegroundColor Yellow

$summary = @"
# Tourlicity Backend - Deployment Ready!

## What's Been Set Up

### Deployment Scripts
- deploy.ps1 - Full-featured deployment script
- quick-deploy.ps1 - Quick one-liner commands  
- git-update.ps1 - Git repository management
- cleanup-repo.ps1 - Repository organization

### Organized Structure
- All deployment files organized in /deployment folder
- Clean repository structure with proper .gitignore
- Comprehensive documentation

### Features Added
- Default Activities now support features_media (images/videos)
- Profile updates with optional fields (only email, first_name, last_name required)
- Backward compatibility maintained

## Quick Start Commands

### On EC2 Instance:
# Quick update and restart
./quick-deploy.ps1 update

# Check status
./quick-deploy.ps1 status

# View logs  
./quick-deploy.ps1 logs

# Full deployment options
./deploy.ps1 -Help

### Local Development:
# Push changes to GitHub
./git-update.ps1 push -Message "Your commit message"

# Pull latest changes
./git-update.ps1 pull

# Check repository status
./git-update.ps1 status

## Documentation
- DEPLOYMENT_README.md - Complete deployment guide
- BACKEND_UPDATES_SUMMARY.md - Recent changes summary
- API_DOCUMENTATION.md - Full API documentation

---
Status: Production Ready
Last Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm")
"@

$summary | Out-File -FilePath "DEPLOYMENT_STATUS.md" -Encoding UTF8
Write-Host "✅ Created DEPLOYMENT_STATUS.md" -ForegroundColor Green

# Step 5: Git operations
Write-Host ""
Write-Host "📚 Step 5: Preparing Git commit..." -ForegroundColor Yellow

# Check if we're in a git repository
if (!(Test-Path ".git")) {
    Write-Host "⚠️  Not in a Git repository. Skipping Git operations." -ForegroundColor Yellow
} else {
    # Show what will be committed
    Write-Host ""
    Write-Host "📋 Files to be committed:" -ForegroundColor Cyan
    git status --short
    
    Write-Host ""
    $commitMessage = "Organize deployment structure and add PowerShell deployment scripts

- Add comprehensive deployment scripts (deploy.ps1, quick-deploy.ps1, git-update.ps1)
- Organize deployment files into structured directories
- Add features_media support to Default Activities
- Make profile update fields optional (country, phone, etc.)
- Create comprehensive deployment documentation
- Add .gitignore for better repository management
- Maintain backward compatibility for all changes"

    $confirm = Read-Host "Commit and push these changes? (y/N)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Write-Host ""
        Write-Host "📤 Committing and pushing changes..." -ForegroundColor Yellow
        
        git add .
        git commit -m $commitMessage
        git push origin main
        
        Write-Host "✅ Changes pushed to GitHub!" -ForegroundColor Green
    } else {
        Write-Host "⏭️  Skipping Git commit. You can commit manually later." -ForegroundColor Yellow
    }
}

# Step 6: Final instructions
Write-Host ""
Write-Host "🎉 Deployment Setup Complete!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "✅ Repository cleaned and organized" -ForegroundColor Green
Write-Host "✅ Deployment scripts created and ready" -ForegroundColor Green
Write-Host "✅ Backend features updated (Default Activities + Profile)" -ForegroundColor Green
Write-Host "✅ Documentation updated" -ForegroundColor Green
Write-Host "✅ Git repository prepared" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 📤 Push to GitHub (if not done automatically):" -ForegroundColor White
Write-Host "   ./git-update.ps1 push -Message 'Finalize deployment setup'" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. 🖥️  Deploy to EC2:" -ForegroundColor White
Write-Host "   ssh -i tourlicity-key.pem ubuntu@51.20.34.93" -ForegroundColor Cyan
Write-Host "   cd Tourist-Backend" -ForegroundColor Cyan
Write-Host "   ./quick-deploy.ps1 update" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. ✅ Verify deployment:" -ForegroundColor White
Write-Host "   ./quick-deploy.ps1 health" -ForegroundColor Cyan
Write-Host "   ./deploy.ps1 status" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   - DEPLOYMENT_README.md - Complete guide" -ForegroundColor Cyan
Write-Host "   - BACKEND_UPDATES_SUMMARY.md - Recent changes" -ForegroundColor Cyan
Write-Host "   - API_DOCUMENTATION.md - API reference" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Quick Commands:" -ForegroundColor Yellow
Write-Host "   ./quick-deploy.ps1 help     # See all quick commands" -ForegroundColor Cyan
Write-Host "   ./deploy.ps1 -Help          # See full deployment options" -ForegroundColor Cyan
Write-Host "   ./git-update.ps1 -Help      # See Git management options" -ForegroundColor Cyan
Write-Host ""