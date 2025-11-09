# Worker Restart Script
# Run this in a separate PowerShell terminal

Write-Host "=== Restarting Celery Worker ===" -ForegroundColor Cyan

# Navigate to server directory
cd $PSScriptRoot

# Activate virtual environment
Write-Host "`nActivating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Set Redis URL
$env:REDIS_URL = "redis://localhost:6379/0"

# Clean bytecode (optional but recommended)
Write-Host "`nCleaning bytecode..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Include __pycache__ | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Start worker
Write-Host "`nStarting Celery worker..." -ForegroundColor Green
Write-Host "Expected logs:" -ForegroundColor Cyan
Write-Host "  - fal-client loaded: version=unknown" -ForegroundColor Gray
Write-Host "  - Default MUSIC_PROVIDER: fal" -ForegroundColor Gray
Write-Host "  - Connected to redis://localhost:6379/0" -ForegroundColor Gray
Write-Host "  - ready" -ForegroundColor Gray
Write-Host "`n" -ForegroundColor Gray

celery -A app.celery_app worker --loglevel=debug --pool=solo --concurrency=1 --prefetch-multiplier=1

