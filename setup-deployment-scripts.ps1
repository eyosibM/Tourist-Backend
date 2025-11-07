#!/usr/bin/env pwsh
# Setup script to make all deployment scripts executable

Write-Host "🔧 Setting up deployment scripts..." -ForegroundColor Cyan
Write-Host ""

# List of scripts to make executable
$scripts = @(
    "deploy-v2-update.ps1",
    "deploy-to-ec2-v2.ps1",
    "deploy-ec2-v2.sh"
)

$success = 0
$failed = 0

foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "✅ Found: $script" -ForegroundColor Green
        $success++
    } else {
        Write-Host "❌ Missing: $script" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   Found: $success scripts" -ForegroundColor Green
Write-Host "   Missing: $failed scripts" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($success -gt 0) {
    Write-Host "✨ Deployment scripts are ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Available Commands:" -ForegroundColor Yellow
    Write-Host "   1. Push to Git:" -ForegroundColor White
    Write-Host "      .\deploy-v2-update.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   2. Complete Deployment:" -ForegroundColor White
    Write-Host "      .\deploy-to-ec2-v2.ps1 -KeyPath 'key.pem' -EC2Host 'your-ip'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   3. On EC2 (after SSH):" -ForegroundColor White
    Write-Host "      ./deploy-ec2-v2.sh" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "⚠️  Some scripts are missing. Please ensure all deployment scripts are present." -ForegroundColor Yellow
}

Write-Host "📖 For detailed instructions, see:" -ForegroundColor Yellow
Write-Host "   - DEPLOYMENT_GUIDE_V2.md" -ForegroundColor Cyan
Write-Host "   - QUICK_DEPLOY_COMMANDS.md" -ForegroundColor Cyan
Write-Host ""
