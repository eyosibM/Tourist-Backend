#!/usr/bin/env pwsh

# =============================================================================
# Git Repository Management Script
# =============================================================================
# Handles git operations for the Tourlicity backend

param(
    [string]$Message = "",
    [string]$Action = "push",
    [switch]$Force,
    [switch]$Help
)

$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

function Show-Help {
    Write-Host ""
    Write-Host "📚 Git Repository Management" -ForegroundColor $Green
    Write-Host "============================" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor $Cyan
    Write-Host "  ./git-update.ps1 [Action] [Options]" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor $Yellow
    Write-Host "  push        Add, commit, and push changes (default)" -ForegroundColor White
    Write-Host "  commit      Add and commit changes only" -ForegroundColor White
    Write-Host "  status      Show git status" -ForegroundColor White
    Write-Host "  pull        Pull latest changes" -ForegroundColor White
    Write-Host "  log         Show recent commits" -ForegroundColor White
    Write-Host "  clean       Clean up repository" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $Yellow
    Write-Host "  -Message    Commit message (required for push/commit)" -ForegroundColor White
    Write-Host "  -Force      Force push (use with caution)" -ForegroundColor White
    Write-Host "  -Help       Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Cyan
    Write-Host '  ./git-update.ps1 push -Message "Add new features"' -ForegroundColor White
    Write-Host '  ./git-update.ps1 commit -Message "Fix bug"' -ForegroundColor White
    Write-Host "  ./git-update.ps1 status" -ForegroundColor White
    Write-Host "  ./git-update.ps1 pull" -ForegroundColor White
    Write-Host ""
}

function Test-GitRepo {
    if (!(Test-Path ".git")) {
        Write-Host "❌ Error: Not in a Git repository" -ForegroundColor $Red
        exit 1
    }
}

function Show-Status {
    Write-Host "📊 Git Repository Status" -ForegroundColor $Green
    Write-Host "========================" -ForegroundColor $Green
    Write-Host ""
    
    # Current branch
    $branch = git branch --show-current
    Write-Host "🌿 Current branch: $branch" -ForegroundColor $Cyan
    
    # Status
    Write-Host ""
    Write-Host "📋 Status:" -ForegroundColor $Yellow
    git status --short
    
    # Recent commits
    Write-Host ""
    Write-Host "📝 Recent commits:" -ForegroundColor $Yellow
    git log --oneline -5
}

function Add-And-Commit {
    param([string]$CommitMessage)
    
    if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
        Write-Host "❌ Error: Commit message is required" -ForegroundColor $Red
        Write-Host "💡 Use: ./git-update.ps1 commit -Message 'Your message'" -ForegroundColor $Yellow
        exit 1
    }
    
    Write-Host "📝 Adding and committing changes..." -ForegroundColor $Yellow
    
    try {
        # Add all changes
        git add .
        
        # Show what will be committed
        Write-Host ""
        Write-Host "📋 Files to be committed:" -ForegroundColor $Cyan
        git diff --cached --name-status
        
        # Commit
        git commit -m $CommitMessage
        
        Write-Host "✅ Changes committed successfully" -ForegroundColor $Green
    }
    catch {
        Write-Host "❌ Error committing changes: $_" -ForegroundColor $Red
        exit 1
    }
}

function Push-Changes {
    Write-Host "📤 Pushing changes to remote repository..." -ForegroundColor $Yellow
    
    try {
        if ($Force) {
            git push --force-with-lease origin main
            Write-Host "✅ Changes force-pushed successfully" -ForegroundColor $Green
        } else {
            git push origin main
            Write-Host "✅ Changes pushed successfully" -ForegroundColor $Green
        }
    }
    catch {
        Write-Host "❌ Error pushing changes: $_" -ForegroundColor $Red
        Write-Host "💡 Try: git pull origin main first" -ForegroundColor $Yellow
        exit 1
    }
}

function Pull-Changes {
    Write-Host "📥 Pulling latest changes..." -ForegroundColor $Yellow
    
    try {
        # Stash local changes if any
        $status = git status --porcelain
        if ($status) {
            Write-Host "💾 Stashing local changes..." -ForegroundColor $Yellow
            git stash push -m "Auto-stash before pull $(Get-Date)"
        }
        
        # Pull changes
        git pull origin main
        
        # Pop stash if we stashed
        if ($status) {
            Write-Host "📤 Restoring stashed changes..." -ForegroundColor $Yellow
            git stash pop
        }
        
        Write-Host "✅ Changes pulled successfully" -ForegroundColor $Green
    }
    catch {
        Write-Host "❌ Error pulling changes: $_" -ForegroundColor $Red
        exit 1
    }
}

function Show-Log {
    Write-Host "📝 Recent Commit History" -ForegroundColor $Green
    Write-Host "========================" -ForegroundColor $Green
    Write-Host ""
    
    git log --oneline --graph --decorate -10
}

function Clean-Repository {
    Write-Host "🧹 Cleaning repository..." -ForegroundColor $Yellow
    
    if (!$Force) {
        $confirm = Read-Host "This will remove untracked files. Continue? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Host "❌ Cleanup cancelled" -ForegroundColor $Yellow
            return
        }
    }
    
    try {
        # Remove untracked files
        git clean -fd
        
        # Remove ignored files
        git clean -fX
        
        Write-Host "✅ Repository cleaned" -ForegroundColor $Green
    }
    catch {
        Write-Host "❌ Error cleaning repository: $_" -ForegroundColor $Red
    }
}

# Main script logic
if ($Help) {
    Show-Help
    exit 0
}

Write-Host ""
Write-Host "📚 Git Repository Management" -ForegroundColor $Green
Write-Host "============================" -ForegroundColor $Green
Write-Host "Action: $Action" -ForegroundColor $Cyan
Write-Host "Time: $(Get-Date)" -ForegroundColor $Cyan
Write-Host ""

Test-GitRepo

switch ($Action.ToLower()) {
    "push" {
        Add-And-Commit -CommitMessage $Message
        Push-Changes
    }
    
    "commit" {
        Add-And-Commit -CommitMessage $Message
    }
    
    "status" {
        Show-Status
    }
    
    "pull" {
        Pull-Changes
    }
    
    "log" {
        Show-Log
    }
    
    "clean" {
        Clean-Repository
    }
    
    default {
        Write-Host "❌ Unknown action: $Action" -ForegroundColor $Red
        Write-Host "💡 Use -Help to see available actions" -ForegroundColor $Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Git operation completed!" -ForegroundColor $Green
Write-Host ""