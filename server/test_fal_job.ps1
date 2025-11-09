# FAL Job Test Script
# Run this after both services are running

Write-Host "=== Testing FAL Provider ===" -ForegroundColor Cyan

# Check provider health
Write-Host "`n1. Checking provider health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod http://localhost:8000/api/health/providers
    Write-Host "   FAL: $($health.fal)" -ForegroundColor $(if ($health.fal -eq "ok") { "Green" } else { "Red" })
    Write-Host "   Replicate: $($health.replicate)" -ForegroundColor $(if ($health.replicate -eq "ok") { "Green" } else { "Red" })
    if ($health.fal_error) {
        Write-Host "   FAL Error: $($health.fal_error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed to check health: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create test job
Write-Host "`n2. Creating test job..." -ForegroundColor Yellow
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
    
    # Wait for processing
    Write-Host "`n3. Waiting for job to process (45 seconds)..." -ForegroundColor Yellow
    Write-Host "   Watch worker terminal for:" -ForegroundColor Cyan
    Write-Host "   - 'Using provider: fal'" -ForegroundColor Gray
    Write-Host "   - NO 403 errors" -ForegroundColor Gray
    Write-Host "   - Status: QUEUED → RENDERING → COMPLETE" -ForegroundColor Gray
    
    Start-Sleep -Seconds 45
    
    # Check job status
    Write-Host "`n4. Checking job status..." -ForegroundColor Yellow
    $jobStatus = Invoke-RestMethod "http://localhost:8000/api/jobs/$jobId"
    Write-Host "   Status: $($jobStatus.status)" -ForegroundColor $(if ($jobStatus.status -eq "complete") { "Green" } elseif ($jobStatus.status -eq "failed") { "Red" } else { "Yellow" })
    Write-Host "   Progress: $([math]::Round($jobStatus.progress * 100, 1))%" -ForegroundColor Gray
    if ($jobStatus.error) {
        Write-Host "   Error: $($jobStatus.error.Substring(0, [Math]::Min(100, $jobStatus.error.Length)))" -ForegroundColor Red
    }
    
    # Check track
    Write-Host "`n5. Checking track..." -ForegroundColor Yellow
    $track = Invoke-RestMethod "http://localhost:8000/api/tracks/$trackId"
    Write-Host "   Provider: $($track.provider)" -ForegroundColor $(if ($track.provider -eq "fal") { "Green" } else { "Yellow" })
    Write-Host "   Status: $($track.status)" -ForegroundColor $(if ($track.status -eq "complete") { "Green" } elseif ($track.status -eq "failed") { "Red" } else { "Yellow" })
    
    if ($track.file_url) {
        Write-Host "   ✅ File URL: $($track.file_url)" -ForegroundColor Green
        
        # Test file accessibility
        Write-Host "`n6. Testing file accessibility..." -ForegroundColor Yellow
        try {
            $fileCheck = Invoke-WebRequest -Uri $track.file_url -Method Head -UseBasicParsing -TimeoutSec 10
            Write-Host "   ✅ File exists and is accessible!" -ForegroundColor Green
            Write-Host "   Content-Type: $($fileCheck.Headers['Content-Type'])" -ForegroundColor Gray
        } catch {
            Write-Host "   ⚠️  File check failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  No file_url yet (job may still be processing)" -ForegroundColor Yellow
    }
    
    Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
    Write-Host "Results:" -ForegroundColor Yellow
    Write-Host "  Job Status: $($jobStatus.status)" -ForegroundColor Gray
    Write-Host "  Track Provider: $($track.provider)" -ForegroundColor Gray
    Write-Host "  Track Status: $($track.status)" -ForegroundColor Gray
    Write-Host "  File URL: $(if ($track.file_url) { 'Present' } else { 'Missing' })" -ForegroundColor Gray
    
} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

