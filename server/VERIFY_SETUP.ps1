# Complete Setup Verification Script
# Run this after starting both services

Write-Host "=== SoundFoundry Setup Verification ===" -ForegroundColor Cyan

# 1. Verify FAL Key
Write-Host "`n1. Verifying FAL Key..." -ForegroundColor Yellow
try {
    $keyCheck = python -c "import os; from dotenv import load_dotenv; load_dotenv('.env', override=True); k=os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); print('FAL prefix:', k[:8] if k else None)"
    Write-Host "   $keyCheck" -ForegroundColor $(if ($keyCheck -match '0b69330b') { "Green" } else { "Red" })
    if ($keyCheck -notmatch '0b69330b') {
        Write-Host "   ⚠️  Wrong prefix! Expected: 0b69330b" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Provider Health
Write-Host "`n2. Checking Provider Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod http://localhost:8000/api/health/providers
    Write-Host "   FAL: $($health.fal)" -ForegroundColor $(if ($health.fal -eq "ok") { "Green" } else { "Red" })
    Write-Host "   Replicate: $($health.replicate)" -ForegroundColor $(if ($health.replicate -eq "ok") { "Green" } else { "Red" })
    if ($health.fal_error) {
        Write-Host "   FAL Error: $($health.fal_error.Substring(0, [Math]::Min(100, $health.fal_error.Length)))" -ForegroundColor Red
    }
    if ($health.replicate_error) {
        Write-Host "   Replicate Error: $($health.replicate_error.Substring(0, [Math]::Min(100, $health.replicate_error.Length)))" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure API server is running!" -ForegroundColor Yellow
}

# 3. Create Test Job
Write-Host "`n3. Creating Test Job..." -ForegroundColor Yellow
$env:MUSIC_PROVIDER = "fal"
$body = @{
    prompt = "Warm ambient pad"
    duration_s = 20
    has_vocals = $false
    style_strength = 0.5
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
    Write-Host "   ✅ Job created:" -ForegroundColor Green
    Write-Host "      Track ID: $($result.track_id)" -ForegroundColor Gray
    Write-Host "      Job ID: $($result.job_id)" -ForegroundColor Gray
    
    $jobId = $result.job_id
    $trackId = $result.track_id
    
    Write-Host "`n4. Waiting for processing (45 seconds)..." -ForegroundColor Yellow
    Write-Host "   Watch worker terminal for progress" -ForegroundColor Cyan
    Start-Sleep -Seconds 45
    
    # Check job status
    Write-Host "`n5. Checking Job Status..." -ForegroundColor Yellow
    $jobStatus = Invoke-RestMethod "http://localhost:8000/api/jobs/$jobId"
    Write-Host "   Status: $($jobStatus.status)" -ForegroundColor $(if ($jobStatus.status -eq "complete") { "Green" } elseif ($jobStatus.status -eq "failed") { "Red" } else { "Yellow" })
    Write-Host "   Progress: $([math]::Round($jobStatus.progress * 100, 1))%" -ForegroundColor Gray
    if ($jobStatus.error) {
        Write-Host "   Error: $($jobStatus.error.Substring(0, [Math]::Min(150, $jobStatus.error.Length)))" -ForegroundColor Red
    }
    
    # Check track
    Write-Host "`n6. Checking Track..." -ForegroundColor Yellow
    $track = Invoke-RestMethod "http://localhost:8000/api/tracks/$trackId"
    Write-Host "   Provider: $($track.provider)" -ForegroundColor $(if ($track.provider -eq "fal") { "Green" } else { "Yellow" })
    Write-Host "   Status: $($track.status)" -ForegroundColor $(if ($track.status -eq "complete") { "Green" } elseif ($track.status -eq "failed") { "Red" } else { "Yellow" })
    Write-Host "   File URL: $(if ($track.file_url) { 'Present' } else { 'Missing' })" -ForegroundColor $(if ($track.file_url) { "Green" } else { "Yellow" })
    
    Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
    Write-Host "Results:" -ForegroundColor Yellow
    Write-Host "  FAL Key Prefix: $keyCheck" -ForegroundColor Gray
    Write-Host "  Provider Health: FAL=$($health.fal), Replicate=$($health.replicate)" -ForegroundColor Gray
    Write-Host "  Job Status: $($jobStatus.status)" -ForegroundColor Gray
    Write-Host "  Track Provider: $($track.provider)" -ForegroundColor Gray
    Write-Host "  Track Status: $($track.status)" -ForegroundColor Gray
    
} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

