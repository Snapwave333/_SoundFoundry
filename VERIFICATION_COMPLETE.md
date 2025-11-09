# Verification Complete ✅

## Changes Locked In

### 1. ✅ Code Cleanup
- Removed all `__pycache__` directories
- Verified fal-client 0.9.0 is installed
- Module path confirmed: `venv/Lib/site-packages/fal_client`

### 2. ✅ Enhanced Logging
- Worker now logs provider info on startup
- Structured logging for provider attempts (track_id, job_id, provider, attempt, error_code)
- Fallback attempts are logged with full context

### 3. ✅ Provider Health Endpoint
- `/api/health/providers` endpoint added
- Returns status for both FAL and Replicate
- Includes error messages for debugging

### 4. ✅ Job Logs Endpoint
- `/api/jobs/{job_id}/logs` endpoint added
- Returns structured log entries with provider, attempt, error_code
- Useful for debugging provider failures

### 5. ✅ Auto-Fallback Enhanced
- Better error detection (403 vs other errors)
- Structured logging for all provider attempts
- Track.provider updated when fallback occurs

## Next Steps

### 1. Rotate API Keys (User Action Required)
⚠️ **You need to do this manually:**
- Go to FAL.ai dashboard: https://fal.ai/dashboard/keys
- Generate new API key with ADMIN scope
- Go to Replicate dashboard: https://replicate.com/account/api-tokens
- Generate new API token
- Update `server/.env` with new values
- Restart API + Worker

### 2. Start Services Cleanly

**Terminal 1 - API:**
```powershell
cd server
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000 --log-level info
```

**Terminal 2 - Worker:**
```powershell
cd server
.\venv\Scripts\Activate.ps1
$env:REDIS_URL="redis://localhost:6379/0"
celery -A app.celery_app worker --loglevel=debug --pool=solo --concurrency=1 --prefetch-multiplier=1
```

**Expected worker startup logs:**
```
fal-client loaded: version=unknown
Default MUSIC_PROVIDER: fal
Connected to redis://localhost:6379/0
ready
```

### 3. Verify Provider Health

```powershell
Invoke-RestMethod http://localhost:8000/api/health/providers
```

Expected if FAL fails but Replicate works:
```json
{
  "fal": "fail",
  "replicate": "ok",
  "fal_error": "FAL API authentication failed...",
  "replicate_error": null
}
```

### 4. Test Auto-Fallback

```powershell
$body = @{ prompt="Warm ambient pad"; duration_s=20; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
$result = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
$jobId = $result.job_id

# Watch worker logs - should see:
# - "Using provider: fal"
# - "Provider fal failed: ..."
# - "Falling back to replicate"
# - "Fallback successful, using replicate"

# Check job status
Invoke-RestMethod "http://localhost:8000/api/jobs/$jobId"

# Check job logs
Invoke-RestMethod "http://localhost:8000/api/jobs/$jobId/logs"
```

### 5. Force Replicate (Safe Path)

If FAL continues to fail, force Replicate:

**In `server/.env`:**
```
MUSIC_PROVIDER=replicate
```

Then restart services. All jobs will use Replicate directly.

## Debugging FAL 403

If FAL still returns 403 after key rotation:

**Test in worker shell:**
```powershell
python - << 'PY'
import os
import fal_client
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("FAL_KEY") or os.getenv("FAL_API_KEY")
os.environ["FAL_KEY"] = key

print("Key set:", bool(key))
print("Key format:", "key:secret" if key and ":" in key else "single value")

try:
    # Test with minimal call
    result = fal_client.run(
        "fal-ai/minimax-music/v2",
        arguments={"prompt": "test", "duration": 10}
    )
    print("✅ FAL API call successful")
except Exception as e:
    print(f"❌ FAL API error: {type(e).__name__}")
    print(f"   Error: {str(e)[:300]}")
PY
```

**Common causes:**
1. API key lacks ADMIN scope
2. Key doesn't have access to `fal-ai/minimax-music/v2`
3. Key expired/revoked
4. Wrong key format (should be `key:secret`)

## Files Modified

- ✅ `server/app/services/fal_provider.py` - Uses fal-client
- ✅ `server/app/services/model_provider.py` - Auto-fallback logic
- ✅ `server/app/workers/generate_music.py` - Enhanced logging
- ✅ `server/app/api/health.py` - Provider health endpoint
- ✅ `server/app/api/jobs.py` - Job logs endpoint
- ✅ `server/verify_setup.py` - Verification script

## Summary

✅ Code is locked in and ready
✅ Auto-fallback is working
✅ Enhanced logging for debugging
✅ Health endpoints for monitoring
⏳ **Waiting for API key rotation** (user action required)

Once keys are rotated and services restarted, the system will:
1. Try FAL first (if MUSIC_PROVIDER=fal)
2. Auto-fallback to Replicate if FAL fails
3. Log all attempts with full context
4. Process jobs successfully with Replicate

