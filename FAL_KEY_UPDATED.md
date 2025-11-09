# FAL API Key Updated ✅

## New Key Set

**FAL Key:** `0b69330b-6ca4-46ed-82ca-1c6fc15e0770:413568623f5894ed76077f23cc2eddb0`
**Privileges:** ADMIN
**Status:** Updated in `server/.env`

## Next Steps

### 1. Restart Services

The new key is in `.env`, but services need to be restarted to load it.

**API Server:**
```powershell
# Stop current server (Ctrl+C), then:
cd server
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000 --log-level info
```

**Worker:**
```powershell
# Stop current worker (Ctrl+C), then:
cd server
.\venv\Scripts\Activate.ps1
$env:REDIS_URL="redis://localhost:6379/0"
celery -A app.celery_app worker --loglevel=debug --pool=solo --concurrency=1 --prefetch-multiplier=1
```

### 2. Verify Key is Loaded

**Check Provider Health:**
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

### 3. Test FAL Provider

**Create Test Job:**
```powershell
$body = @{ prompt="Test with new FAL key"; duration_s=20; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
$result = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
```

**Watch Worker Logs:**
- Should see: `Using provider: fal`
- Should NOT see 403 error
- Job should complete with FAL provider
- No fallback to Replicate needed

### 4. Verify Success

**Check Job Status:**
```powershell
Invoke-RestMethod "http://localhost:8000/api/jobs/$($result.job_id)"
```

**Expected:**
- Status: `complete`
- No error messages
- Provider: `fal` (not `replicate`)

**Check Track:**
```powershell
Invoke-RestMethod "http://localhost:8000/api/tracks/$($result.track_id)"
```

**Expected:**
- Status: `complete`
- `file_url` populated
- Provider: `fal`

## Troubleshooting

### If FAL Still Returns 403

1. **Verify Key Format:**
   ```powershell
   python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('FAL_KEY'))"
   ```
   Should show: `0b69330b-6ca4-46ed-82ca-1c6fc15e0770:413568623f5894ed76077f23cc2eddb0`

2. **Check Key Has ADMIN Scope:**
   - Go to https://fal.ai/dashboard/keys
   - Verify key has ADMIN privileges
   - Check key is active (not revoked)

3. **Verify Model Access:**
   - Ensure key has access to `fal-ai/minimax-music/v2`
   - Check billing/quota status

4. **Test Directly:**
   ```powershell
   python -c "import os, fal_client; from dotenv import load_dotenv; load_dotenv(); os.environ['FAL_KEY'] = os.getenv('FAL_KEY'); result = fal_client.run('fal-ai/minimax-music/v2', arguments={'prompt':'test','duration':10}); print('Success:', bool(result))"
   ```

### If Services Don't Pick Up New Key

1. **Verify .env File:**
   - Check `server/.env` has `FAL_KEY=...`
   - Ensure no extra spaces or quotes

2. **Restart Services:**
   - Fully stop and restart API
   - Fully stop and restart worker
   - Don't just reload

3. **Check Environment:**
   ```powershell
   python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('FAL_KEY:', os.getenv('FAL_KEY')[:30] + '...')"
   ```

## Current Status

✅ **Key Updated:** New FAL key with admin privileges set in `.env`
⏳ **Services:** Need restart to load new key
⏳ **Testing:** Pending after service restart

## Test Job Created

**Track ID:** 15
**Job ID:** 18
**Status:** QUEUED (will process after worker restart)

After restarting services, this job will test the new FAL key.

## Success Indicators

✅ FAL provider initializes without errors
✅ Jobs complete with FAL provider (no fallback)
✅ No 403 errors in worker logs
✅ `file_url` populated successfully
✅ File plays correctly

**Status: Ready to test with new FAL key! 🔑**

