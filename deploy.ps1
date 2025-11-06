#!/usr/bin/env pwsh

# =============================================================================
# Tourlicity Backend Deployment Script
# =============================================================================
# Main deployment script for EC2 instance
# Run this script when SSH'd into your EC2 instance

param(
    [string]$Action = "update",
    [switch]$Force,
    [switch]$SkipTests,
    [switch]$Help
)

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

function Show-Help {
    Write-Host ""
    Write-Host "🚀 Tourlicity Backend Deployment Script" -ForegroundColor $Green
    Write-Host "=======================================" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor $Cyan
    Write-Host "  ./deploy.ps1 [Action] [Options]" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor $Yellow
    Write-Host "  update      Update code and restart services (default)" -ForegroundColor White
    Write-Host "  restart     Restart services without updating code" -ForegroundColor White
    Write-Host "  rebuild     Full rebuild of containers" -ForegroundColor White
    Write-Host "  status      Check service status" -ForegroundColor White
    Write-Host "  logs        Show recent logs" -ForegroundColor White
    Write-Host "  health      Check API health" -ForegroundColor White
    Write-Host "  cleanup     Clean up unused Docker resources" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $Yellow
    Write-Host "  -Force      Force action without confirmation" -ForegroundColor White
    Write-Host "  -SkipTests  Skip health tests after deployment" -ForegroundColor White
    Write-Host "  -Help       Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Cyan
    Write-Host "  ./deploy.ps1                    # Update and restart" -ForegroundColor White
    Write-Host "  ./deploy.ps1 rebuild -Force     # Force rebuild containers" -ForegroundColor White
    Write-Host "  ./deploy.ps1 status             # Check service status" -ForegroundColor White
    Write-Host "  ./deploy.ps1 logs               # View recent logs" -ForegroundColor White
    Write-Host ""
}

function Test-Prerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor $Yellow
    
    # Check if we're in the right directory
    if (!(Test-Path "package.json")) {
        Write-Host "❌ Error: Not in Tourist-Backend directory" -ForegroundColor $Red
        Write-Host "   Please run this script from the Tourist-Backend directory" -ForegroundColor $Red
        exit 1
    }
    
    # Check if Docker is running
    try {
        docker ps | Out-Null
        Write-Host "✅ Docker is running" -ForegroundColor $Green
    }
    catch {
        Write-Host "❌ Error: Docker is not running or not accessible" -ForegroundColor $Red
        exit 1
    }
    
    # Check if docker-compose file exists
    if (!(Test-Path "docker-compose.https.yml")) {
        Write-Host "❌ Error: docker-compose.https.yml not found" -ForegroundColor $Red
        exit 1
    }
    
    Write-Host "✅ Prerequisites check passed" -ForegroundColor $Green
}

function Update-Code {
    Write-Host "📥 Updating code from repository..." -ForegroundColor $Yellow
    
    try {
        # Stash any local changes
        git stash push -m "Auto-stash before deployment $(Get-Date)"
        
        # Pull latest changes
        git pull origin main
        
        Write-Host "✅ Code updated successfully" -ForegroundColor $Green
    }
    catch {
        Write-Host "❌ Error updating code: $_" -ForegroundColor $Red
        exit 1
    }
}

function Restart-Services {
    param([bool]$Rebuild = $false)
    
    if ($Rebuild) {
        Write-Host "🔄 Rebuilding and restarting services..." -ForegroundColor $Yellow
    } else {
        Write-Host "🔄 Restarting services..." -ForegroundColor $Yellow
    }
    
    try {
        # Stop services
        docker-compose -f docker-compose.https.yml down
        
        if ($Rebuild) {
            # Rebuild and start
            docker-compose -f docker-compose.https.yml up -d --build
        } else {
            # Just restart
            docker-compose -f docker-compose.https.yml up -d
        }
        
        Write-Host "✅ Services restarted successfully" -ForegroundColor $Green
    }
    catch {
        Write-Host "❌ Error restarting services: $_" -ForegroundColor $Red
        exit 1
    }
}

function Test-Health {
    Write-Host "🧪 Testing API health..." -ForegroundColor $Yellow
    
    # Wait for services to be ready
    Write-Host "⏳ Waiting for services to start..." -ForegroundColor $Yellow
    Start-Sleep -Seconds 15
    
    try {
        # Test API health
        $response = Invoke-RestMethod -Uri "https://api.tourlicity.com/api/health" -Method Get -TimeoutSec 30
        
        if ($response.status -eq "OK") {
            Write-Host "✅ API health check passed" -ForegroundColor $Green
            Write-Host "   Status: $($response.status)" -ForegroundColor $Green
            Write-Host "   Uptime: $($response.uptime) seconds" -ForegroundColor $Green
        } else {
            Write-Host "⚠️  API health check returned: $($response.status)" -ForegroundColor $Yellow
        }
    }
    catch {
        Write-Host "❌ API health check failed: $_" -ForegroundColor $Red
        Write-Host "💡 Check logs with: ./deploy.ps1 logs" -ForegroundColor $Yellow
    }
}

function Show-Status {
    Write-Host "📊 Service Status" -ForegroundColor $Green
    Write-Host "=================" -ForegroundColor $Green
    Write-Host ""
    
    # Docker container status
    Write-Host "🐳 Docker Containers:" -ForegroundColor $Yellow
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    Write-Host ""
    
    # Disk usage
    Write-Host "💾 Disk Usage:" -ForegroundColor $Yellow
    df -h | grep -E "(Filesystem|/dev/)"
    
    Write-Host ""
    
    # Memory usage
    Write-Host "🧠 Memory Usage:" -ForegroundColor $Yellow
    free -h
}

function Show-Logs {
    Write-Host "📋 Recent Logs" -ForegroundColor $Green
    Write-Host "===============" -ForegroundColor $Green
    Write-Host ""
    
    Write-Host "🔍 API Logs (last 20 lines):" -ForegroundColor $Yellow
    docker logs tourlicity-api --tail=20
    
    Write-Host ""
    Write-Host "🔍 Nginx Logs (last 10 lines):" -ForegroundColor $Yellow
    docker logs tourlicity-nginx --tail=10
}

function Cleanup-Docker {
    Write-Host "🧹 Cleaning up Docker resources..." -ForegroundColor $Yellow
    
    if (!$Force) {
        $confirm = Read-Host "This will remove unused Docker images and containers. Continue? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Host "❌ Cleanup cancelled" -ForegroundColor $Yellow
            return
        }
    }
    
    try {
        # Remove unused containers, networks, images
        docker system prune -f
        
        # Remove unused volumes (be careful with this)
        docker volume prune -f
        
        Write-Host "✅ Docker cleanup completed" -ForegroundColor $Green
    }
    catch {
        Write-Host "❌ Error during cleanup: $_" -ForegroundColor $Red
    }
}

# Main script logic
if ($Help) {
    Show-Help
    exit 0
}

Write-Host ""
Write-Host "🚀 Tourlicity Backend Deployment" -ForegroundColor $Green
Write-Host "=================================" -ForegroundColor $Green
Write-Host "Action: $Action" -ForegroundColor $Cyan
Write-Host "Time: $(Get-Date)" -ForegroundColor $Cyan
Write-Host ""

# Check prerequisites for actions that need them
if ($Action -in @("update", "restart", "rebuild")) {
    Test-Prerequisites
}

switch ($Action.ToLower()) {
    "update" {
        Update-Code
        Restart-Services -Rebuild $false
        if (!$SkipTests) {
            Test-Health
        }
    }
    
    "restart" {
        Restart-Services -Rebuild $false
        if (!$SkipTests) {
            Test-Health
        }
    }
    
    "rebuild" {
        if (!$Force) {
            $confirm = Read-Host "This will rebuild all containers. Continue? (y/N)"
            if ($confirm -ne "y" -and $confirm -ne "Y") {
                Write-Host "❌ Rebuild cancelled" -ForegroundColor $Yellow
                exit 0
            }
        }
        Restart-Services -Rebuild $true
        if (!$SkipTests) {
            Test-Health
        }
    }
    
    "status" {
        Show-Status
    }
    
    "logs" {
        Show-Logs
    }
    
    "health" {
        Test-Health
    }
    
    "cleanup" {
        Cleanup-Docker
    }
    
    default {
        Write-Host "❌ Unknown action: $Action" -ForegroundColor $Red
        Write-Host "💡 Use -Help to see available actions" -ForegroundColor $Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Deployment script completed!" -ForegroundColor $Green
Write-Host ""
Write-Host "💡 Useful commands:" -ForegroundColor $Yellow
Write-Host "   ./deploy.ps1 status    # Check service status" -ForegroundColor $Cyan
Write-Host "   ./deploy.ps1 logs      # View recent logs" -ForegroundColor $Cyan
Write-Host "   ./deploy.ps1 health    # Test API health" -ForegroundColor $Cyan
Write-Host "   ./deploy.ps1 cleanup   # Clean up Docker resources" -ForegroundColor $Cyan
Write-Host ""