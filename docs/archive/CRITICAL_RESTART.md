# ⚠️ CRITICAL: Services Must Be Restarted

## Current Status

- ✅ **New FAL key set in `.env`:** `0b69330b-6ca4-46ed-82ca-1c6fc15e0770:413568623f5894ed76077f23cc2eddb0`
- ❌ **Running services still using OLD key:** `462dc8ce...` (prefix mismatch)
- ❌ **Job 20 failed with 403** (using old key)

## Why Restart is Required

The `.env` file has been updated, but:
- The API server loaded environment variables at startup
- The worker loaded environment variables at startup
- They won't see the new key until restarted

## Immediate Actions Required

### 1. Stop Current Services

**Terminal 1 (API Server):**
- Press `Ctrl+C` to stop
- Wait for it to fully stop

**Terminal 2 (Worker):**
- Press `Ctrl+C` to stop
- Wait for it to fully stop

### 2. Restart API Server

**Terminal 1:**
```powershell
cd server
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000 --log-level info
```

**Verify:** Server starts without errors

### 3. Restart Worker

**Terminal 2:**
```powershell
cd server
.\venv\Scripts\Activate.ps1
$env:REDIS_URL="redis://localhost:6379/0"
celery -A app.celery_app worker --loglevel=debug --pool=solo --concurrency=1 --prefetch-multiplier=1
```

**Expected logs:**
```
fal-client loaded: version=unknown
Default MUSIC_PROVIDER: fal
[INFO] Connected to redis://localhost:6379/0
[INFO] celery@hostname ready
```

### 4. Verify New Key is Loaded

**In worker terminal (Terminal 2), run:**
```powershell
python -c "import os; from dotenv import load_dotenv; load_dotenv(); k = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); print('FAL_KEY present:', bool(k)); print('prefix:', k[:8] if k else None)"
```

**Expected output:**
```
FAL_KEY present: True
prefix: 0b69330b
```

**If you still see `462dc8ce`, the restart didn't work - try again.**

### 5. Test Provider Health

```powershell
Invoke-RestMethod http://localhost:8000/api/health/providers
```

**Expected:**
```json
{
  "fal": "ok",
  "replicate": "ok",
  "fal_error": null,
  "replicate_error": null
}
```

### 6. Create Fresh Test Job

```powershell
$env:MUSIC_PROVIDER="fal"
$body = @{ prompt="Test with new key"; duration_s=20; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
$r = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
$r
```

### 7. Watch Worker Logs

**In Terminal 2 (worker), you should see:**
- ✅ `Using provider: fal`
- ✅ **NO 403 errors**
- ✅ Job completes successfully
- ✅ No fallback to Replicate

### 8. Verify Completion

```powershell
# Wait 30-60 seconds, then:
Invoke-RestMethod "http://localhost:8000/api/jobs/$($r.job_id)"
Invoke-RestMethod "http://localhost:8000/api/tracks/$($r.track_id)"
```

**Expected:**
- Job status: `complete`
- Track status: `complete`
- Track provider: `fal`
- `file_url` populated

## Troubleshooting

### If Key Still Shows Old Prefix

1. **Verify .env file:**
   ```powershell
   Get-Content server\.env | Select-String "FAL_KEY"
   ```
   Should show: `FAL_KEY=0b69330b-6ca4-46ed-82ca-1c6fc15e0770:...`

2. **Fully stop services** (don't just reload)

3. **Check for multiple .env files:**
   ```powershell
   Get-ChildItem -Recurse -Filter ".env" | Select-Object FullName
   ```

4. **Manually set in worker terminal:**
   ```powershell
   $env:FAL_KEY="0b69330b-6ca4-46ed-82ca-1c6fc15e0770:413568623f5894ed76077f23cc2eddb0"
   ```

### If FAL Still Returns 403 After Restart

**Test directly in worker terminal:**
```powershell
python -c "import os, fal_client; from dotenv import load_dotenv; load_dotenv(); key = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); os.environ['FAL_KEY'] = key; print('Key:', key[:20]); res = fal_client.run('fal-ai/minimax-music/v2', arguments={'prompt':'test','duration':10}); print('Success:', bool(res))"
```

**If this still 403s:**
- Verify key has ADMIN scope in FAL dashboard
- Check key is active
- Use Replicate: `MUSIC_PROVIDER=replicate`

## Current Test Jobs

- **Job 19:** QUEUED (will process after restart)
- **Job 20:** FAILED (used old key, ignore)
- **Job 21:** QUEUED (will process after restart)

## Success Criteria

✅ Services restarted
✅ Key prefix: `0b69330b` (not `462dc8ce`)
✅ Provider health: `fal.ok=true`
✅ Job completes with FAL (no 403)
✅ No fallback to Replicate
✅ `file_url` populated

**Status: ⚠️ RESTART REQUIRED NOW! 🔄**

