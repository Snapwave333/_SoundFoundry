# Auto-Fallback Test Script
# Run this AFTER restarting the worker

Write-Host "=== Testing Auto-Fallback ===" -ForegroundColor Cyan

# Create test job
Write-Host "`n1. Creating test job..." -ForegroundColor Yellow
$body = @{
    prompt = "Warm ambient pad"
    duration_s = 20
    has_vocals = $false
    style_strength = 0.5
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Job created successfully!" -ForegroundColor Green
    Write-Host "   Track ID: $($result.track_id)" -ForegroundColor Gray
    Write-Host "   Job ID: $($result.job_id)" -ForegroundColor Gray
    
    $jobId = $result.job_id
    $trackId = $result.track_id
    
    # Wait for processing
    Write-Host "`n2. Waiting for job to process (30 seconds)..." -ForegroundColor Yellow
    Write-Host "   Watch the worker terminal for:" -ForegroundColor Cyan
    Write-Host "   - 'Using provider: fal'" -ForegroundColor Gray
    Write-Host "   - If 403: 'Provider fal failed' → 'Falling back to replicate'" -ForegroundColor Gray
    Write-Host "   - 'Fallback successful, using replicate'" -ForegroundColor Gray
    Write-Host "   - Status: QUEUED → RENDERING → COMPLETE" -ForegroundColor Gray
    
    Start-Sleep -Seconds 30
    
    # Check job status
    Write-Host "`n3. Checking job status..." -ForegroundColor Yellow
    $jobStatus = Invoke-RestMethod -Uri "http://localhost:8000/api/jobs/$jobId"
    Write-Host "   Status: $($jobStatus.status)" -ForegroundColor $(if ($jobStatus.status -eq "complete") { "Green" } else { "Yellow" })
    Write-Host "   Progress: $([math]::Round($jobStatus.progress * 100, 1))%" -ForegroundColor Gray
    if ($jobStatus.error) {
        Write-Host "   Error: $($jobStatus.error)" -ForegroundColor Red
    }
    
    # Check job logs
    Write-Host "`n4. Checking job logs..." -ForegroundColor Yellow
    $logs = Invoke-RestMethod -Uri "http://localhost:8000/api/jobs/$jobId/logs"
    foreach ($log in $logs.logs) {
        Write-Host "   [$($log.timestamp)] Provider: $($log.provider), Attempt: $($log.attempt), Status: $($log.status)" -ForegroundColor Gray
        if ($log.error_code) {
            Write-Host "      Error Code: $($log.error_code)" -ForegroundColor Red
        }
        if ($log.message) {
            Write-Host "      Message: $($log.message.Substring(0, [Math]::Min(80, $log.message.Length)))..." -ForegroundColor Gray
        }
    }
    
    # Check track
    Write-Host "`n5. Checking track..." -ForegroundColor Yellow
    $track = Invoke-RestMethod -Uri "http://localhost:8000/api/tracks/$trackId"
    Write-Host "   Provider: $($track.provider)" -ForegroundColor Gray
    Write-Host "   Status: $($track.status)" -ForegroundColor $(if ($track.status -eq "complete") { "Green" } else { "Yellow" })
    
    if ($track.file_url) {
        Write-Host "   ✅ File URL: $($track.file_url)" -ForegroundColor Green
        Write-Host "`n6. Verifying file..." -ForegroundColor Yellow
        try {
            $fileCheck = Invoke-WebRequest -Uri $track.file_url -Method Head -UseBasicParsing
            Write-Host "   ✅ File exists and is accessible!" -ForegroundColor Green
            Write-Host "   Content-Type: $($fileCheck.Headers['Content-Type'])" -ForegroundColor Gray
        } catch {
            Write-Host "   ⚠️  File check failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  No file_url yet (job may still be processing)" -ForegroundColor Yellow
    }
    
    Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
    Write-Host "Check worker logs to see auto-fallback behavior" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception -ForegroundColor Red
}

