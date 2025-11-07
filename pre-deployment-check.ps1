#!/usr/bin/env pwsh
# Pre-Deployment Check Script
# Run this before deploying to verify everything is ready

Write-Host "🔍 Tourlicity v2.0.0 - Pre-Deployment Check" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$checks = @{
    passed = 0
    failed = 0
    warnings = 0
}

# Check 1: Git Status
Write-Host "📦 Check 1: Git Repository Status" -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "   ✅ Git repository found" -ForegroundColor Green
    $checks.passed++
    
    # Check for uncommitted changes
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "   ⚠️  Uncommitted changes detected:" -ForegroundColor Yellow
        Write-Host "   $($gitStatus.Count) files modified" -ForegroundColor Gray
        $checks.warnings++
    } else {
        Write-Host "   ✅ No uncommitted changes" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Not a git repository" -ForegroundColor Red
    $checks.failed++
}
Write-Host ""

# Check 2: Required Files
Write-Host "📄 Check 2: Required Files" -ForegroundColor Yellow
$requiredFiles = @(
    "package.json",
    "src/server.js",
    "src/config/swagger.js",
    "src/routes/defaultActivities.js",
    "API_DOCUMENTATION.md",
    "deploy-v2-update.ps1",
    "deploy-ec2-v2.sh",
    "deploy-to-ec2-v2.ps1"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
        $checks.passed++
    } else {
        Write-Host "   ❌ $file (missing)" -ForegroundColor Red
        $checks.failed++
    }
}
Write-Host ""

# Check 3: Package.json Version
Write-Host "📦 Check 3: Package Version" -ForegroundColor Yellow
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $version = $packageJson.version
    
    if ($version -eq "2.0.0") {
        Write-Host "   ✅ Version: $version" -ForegroundColor Green
        $checks.passed++
    } else {
        Write-Host "   ⚠️  Version: $version (expected 2.0.0)" -ForegroundColor Yellow
        $checks.warnings++
    }
} else {
    Write-Host "   ❌ package.json not found" -ForegroundColor Red
    $checks.failed++
}
Write-Host ""

# Check 4: Environment File
Write-Host "🔐 Check 4: Environment Configuration" -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
    $checks.passed++
    
    # Check for critical variables
    $envContent = Get-Content ".env" -Raw
    $criticalVars = @("MONGODB_URI", "JWT_SECRET", "AWS_ACCESS_KEY_ID")
    
    foreach ($var in $criticalVars) {
        if ($envContent -match $var) {
            Write-Host "   ✅ $var configured" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $var not found" -ForegroundColor Yellow
            $checks.warnings++
        }
    }
} else {
    Write-Host "   ⚠️  .env file not found (will use EC2 .env)" -ForegroundColor Yellow
    $checks.warnings++
}
Write-Host ""

# Check 5: Node Modules
Write-Host "📚 Check 5: Dependencies" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules exists" -ForegroundColor Green
    $checks.passed++
} else {
    Write-Host "   ⚠️  node_modules not found (run npm install)" -ForegroundColor Yellow
    $checks.warnings++
}
Write-Host ""

# Check 6: Docker (if available)
Write-Host "🐳 Check 6: Docker Availability" -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "   ✅ Docker is installed" -ForegroundColor Green
    $checks.passed++
    
    # Check if Docker is running
    try {
        docker info > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Docker is running" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Docker is not running" -ForegroundColor Yellow
            $checks.warnings++
        }
    } catch {
        Write-Host "   ⚠️  Docker status unknown" -ForegroundColor Yellow
        $checks.warnings++
    }
} else {
    Write-Host "   ⚠️  Docker not found (optional for local dev)" -ForegroundColor Yellow
    $checks.warnings++
}
Write-Host ""

# Check 7: Git Remote
Write-Host "🌐 Check 7: Git Remote Configuration" -ForegroundColor Yellow
try {
    $remotes = git remote -v
    if ($remotes) {
        Write-Host "   ✅ Git remote configured" -ForegroundColor Green
        $checks.passed++
        
        # Show remote URL
        $remoteUrl = git remote get-url origin
        Write-Host "   Remote: $remoteUrl" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ No git remote configured" -ForegroundColor Red
        $checks.failed++
    }
} catch {
    Write-Host "   ❌ Error checking git remote" -ForegroundColor Red
    $checks.failed++
}
Write-Host ""

# Check 8: Deployment Scripts Executable
Write-Host "🔧 Check 8: Deployment Scripts" -ForegroundColor Yellow
$deployScripts = @("deploy-v2-update.ps1", "deploy-to-ec2-v2.ps1", "deploy-ec2-v2.sh")
foreach ($script in $deployScripts) {
    if (Test-Path $script) {
        Write-Host "   ✅ $script exists" -ForegroundColor Green
        $checks.passed++
    } else {
        Write-Host "   ❌ $script missing" -ForegroundColor Red
        $checks.failed++
    }
}
Write-Host ""

# Check 9: Documentation Updated
Write-Host "📖 Check 9: Documentation" -ForegroundColor Yellow
$docFiles = @("API_DOCUMENTATION.md", "DEPLOYMENT_GUIDE_V2.md", "QUICK_DEPLOY_COMMANDS.md")
foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        Write-Host "   ✅ $doc exists" -ForegroundColor Green
        $checks.passed++
    } else {
        Write-Host "   ⚠️  $doc missing" -ForegroundColor Yellow
        $checks.warnings++
    }
}
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 Pre-Deployment Check Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "   ✅ Passed:   $($checks.passed)" -ForegroundColor Green
Write-Host "   ⚠️  Warnings: $($checks.warnings)" -ForegroundColor Yellow
Write-Host "   ❌ Failed:   $($checks.failed)" -ForegroundColor Red
Write-Host ""

# Recommendation
if ($checks.failed -eq 0 -and $checks.warnings -eq 0) {
    Write-Host "🎉 All checks passed! Ready to deploy." -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Run: .\deploy-v2-update.ps1" -ForegroundColor Cyan
    Write-Host "   2. Or run: .\deploy-to-ec2-v2.ps1 -KeyPath 'key.pem' -EC2Host 'ip'" -ForegroundColor Cyan
    $exitCode = 0
} elseif ($checks.failed -eq 0) {
    Write-Host "⚠️  Some warnings detected, but deployment can proceed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Recommended Actions:" -ForegroundColor Yellow
    Write-Host "   - Review warnings above" -ForegroundColor White
    Write-Host "   - Fix any issues if needed" -ForegroundColor White
    Write-Host "   - Proceed with deployment if acceptable" -ForegroundColor White
    $exitCode = 0
} else {
    Write-Host "❌ Critical issues detected. Please fix before deploying." -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Required Actions:" -ForegroundColor Yellow
    Write-Host "   - Fix all failed checks above" -ForegroundColor White
    Write-Host "   - Run this script again" -ForegroundColor White
    Write-Host "   - Deploy only after all checks pass" -ForegroundColor White
    $exitCode = 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

exit $exitCode
