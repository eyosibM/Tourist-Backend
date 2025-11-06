#!/usr/bin/env pwsh

# =============================================================================
# Quick Deployment Commands for EC2
# =============================================================================
# Simple one-liner commands for common deployment tasks

param(
    [string]$Command = "help"
)

$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

function Show-Commands {
    Write-Host ""
    Write-Host "⚡ Quick Deployment Commands" -ForegroundColor $Green
    Write-Host "============================" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Usage: ./quick-deploy.ps1 [command]" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "📥 update        Pull latest code and restart" -ForegroundColor White
    Write-Host "🔄 restart       Restart services only" -ForegroundColor White
    Write-Host "🔨 rebuild       Full rebuild of containers" -ForegroundColor White
    Write-Host "📊 status        Show service status" -ForegroundColor White
    Write-Host "📋 logs          Show recent logs" -ForegroundColor White
    Write-Host "🧪 health        Test API health" -ForegroundColor White
    Write-Host "🧹 cleanup       Clean Docker resources" -ForegroundColor White
    Write-Host "🔍 check         Quick system check" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Cyan
    Write-Host "  ./quick-deploy.ps1 update" -ForegroundColor White
    Write-Host "  ./quick-deploy.ps1 status" -ForegroundColor White
    Write-Host "  ./quick-deploy.ps1 logs" -ForegroundColor White
    Write-Host ""
}

switch ($Command.ToLower()) {
    "update" {
        Write-Host "📥 Quick Update: Pulling code and restarting..." -ForegroundColor $Yellow
        git pull origin main
        docker-compose -f docker-compose.https.yml down
        docker-compose -f docker-compose.https.yml up -d --build
        Start-Sleep -Seconds 10
        curl -s https://api.tourlicity.com/api/health | ConvertFrom-Json | Format-Table
    }
    
    "restart" {
        Write-Host "🔄 Quick Restart: Restarting services..." -ForegroundColor $Yellow
        docker-compose -f docker-compose.https.yml restart
        Start-Sleep -Seconds 5
        docker ps --format "table {{.Names}}\t{{.Status}}"
    }
    
    "rebuild" {
        Write-Host "🔨 Quick Rebuild: Full container rebuild..." -ForegroundColor $Yellow
        docker-compose -f docker-compose.https.yml down
        docker-compose -f docker-compose.https.yml up -d --build --force-recreate
        Start-Sleep -Seconds 15
        curl -s https://api.tourlicity.com/api/health | ConvertFrom-Json | Format-Table
    }
    
    "status" {
        Write-Host "📊 Quick Status Check:" -ForegroundColor $Yellow
        Write-Host ""
        Write-Host "🐳 Containers:" -ForegroundColor $Cyan
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        Write-Host ""
        Write-Host "💾 Disk:" -ForegroundColor $Cyan
        df -h | head -2
        Write-Host ""
        Write-Host "🧠 Memory:" -ForegroundColor $Cyan
        free -h | head -2
    }
    
    "logs" {
        Write-Host "📋 Quick Logs:" -ForegroundColor $Yellow
        Write-Host ""
        Write-Host "🔍 API Logs:" -ForegroundColor $Cyan
        docker logs tourlicity-api --tail=15
        Write-Host ""
        Write-Host "🔍 Nginx Logs:" -ForegroundColor $Cyan
        docker logs tourlicity-nginx --tail=5
    }
    
    "health" {
        Write-Host "🧪 Quick Health Check:" -ForegroundColor $Yellow
        try {
            $health = Invoke-RestMethod -Uri "https://api.tourlicity.com/api/health" -TimeoutSec 10
            Write-Host "✅ API Status: $($health.status)" -ForegroundColor $Green
            Write-Host "⏱️  Uptime: $($health.uptime) seconds" -ForegroundColor $Green
            Write-Host "🗄️  Database: $($health.services.database)" -ForegroundColor $Green
            Write-Host "🔄 Redis: $($health.services.redis)" -ForegroundColor $Green
        }
        catch {
            Write-Host "❌ Health check failed: $_" -ForegroundColor $Red
        }
    }
    
    "cleanup" {
        Write-Host "🧹 Quick Cleanup:" -ForegroundColor $Yellow
        docker system prune -f
        docker volume prune -f
        Write-Host "✅ Cleanup completed" -ForegroundColor $Green
    }
    
    "check" {
        Write-Host "🔍 Quick System Check:" -ForegroundColor $Yellow
        Write-Host ""
        
        # Check if in right directory
        if (Test-Path "package.json") {
            Write-Host "✅ In Tourist-Backend directory" -ForegroundColor $Green
        } else {
            Write-Host "❌ Not in Tourist-Backend directory" -ForegroundColor $Red
        }
        
        # Check Docker
        try {
            docker ps | Out-Null
            Write-Host "✅ Docker is running" -ForegroundColor $Green
        }
        catch {
            Write-Host "❌ Docker not accessible" -ForegroundColor $Red
        }
        
        # Check containers
        $containers = docker ps --format "{{.Names}}" | Where-Object { $_ -like "tourlicity-*" }
        if ($containers.Count -ge 3) {
            Write-Host "✅ All containers running ($($containers.Count))" -ForegroundColor $Green
        } else {
            Write-Host "⚠️  Only $($containers.Count) containers running" -ForegroundColor $Yellow
        }
        
        # Quick API test
        try {
            $response = Invoke-WebRequest -Uri "https://api.tourlicity.com/api/health" -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ API responding" -ForegroundColor $Green
            }
        }
        catch {
            Write-Host "❌ API not responding" -ForegroundColor $Red
        }
    }
    
    "help" {
        Show-Commands
    }
    
    default {
        Write-Host "❌ Unknown command: $Command" -ForegroundColor $Red
        Show-Commands
    }
}

Write-Host ""