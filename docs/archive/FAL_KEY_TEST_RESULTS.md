# FAL Key Test Results

## New Key Details

**Key:** `0b69330b-6ca4-46ed-82ca-1c6fc15e0770:413568623f5894ed76077f23cc2eddb0`
**Privileges:** ADMIN
**Status:** Updated in `.env`

## Pre-Restart Verification

### ✅ Key Format Check
- Key present: ✅ True
- Format: `key:secret` ✅
- Prefix: `0b69330b` ✅ (matches new key)

### ✅ Provider Health (Before Restart)
```json
{
  "fal": "ok",
  "replicate": "ok",
  "fal_error": null,
  "replicate_error": null
}
```

### ⏳ Job Status (Before Restart)
- **Job 19:** QUEUED (created before restart)
- **Job 20:** QUEUED (created after restart, waiting for worker)

## Required Actions

### 1. Restart API Server
**Terminal 1:**
```powershell
cd server
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000 --log-level info
```

### 2. Restart Worker
**Terminal 2:**
```powershell
cd server
.\venv\Scripts\Activate.ps1
$env:REDIS_URL="redis://localhost:6379/0"
celery -A app.celery_app worker --loglevel=debug --pool=solo --concurrency=1 --prefetch-multiplier=1
```

### 3. Verify Key Loaded (in Worker Terminal)
```powershell
python -c "import os; k = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); print('FAL_KEY present:', bool(k)); print('prefix:', k[:8] if k else None)"
```

**Expected:**
```
FAL_KEY present: True
prefix: 0b69330b
```

### 4. Test Provider Health
```powershell
Invoke-RestMethod http://localhost:8000/api/health/providers
```

**Expected:** `fal.ok=true`

### 5. Check Job Status
```powershell
Invoke-RestMethod http://localhost:8000/api/jobs/20
```

**Expected:** Status progresses beyond QUEUED

### 6. Create Fresh Test Job
```powershell
$env:MUSIC_PROVIDER="fal"
$body = @{ prompt="Warm ambient pad"; duration_s=20; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
$r = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
```

**Watch worker logs for:**
- ✅ `Using provider: fal`
- ✅ NO 403 errors
- ✅ Job completes successfully
- ✅ No fallback to Replicate

### 7. Verify Completion
```powershell
Invoke-RestMethod "http://localhost:8000/api/tracks/$($r.track_id)"
```

**Expected:**
- Status: `complete`
- Provider: `fal`
- `file_url` populated
- File accessible

## If FAL Still Returns 403

### Direct Test (in Worker Terminal)
```powershell
python -c "import os, fal_client; from dotenv import load_dotenv; load_dotenv(); key = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); os.environ['FAL_KEY'] = key; print('Key set:', bool(key)); res = fal_client.run('fal-ai/minimax-music/v2', arguments={'prompt':'test','duration':10}); print('Success:', bool(res))"
```

**If this still 403s:**
- Verify key has ADMIN scope in FAL dashboard
- Check key is active (not revoked)
- May need to use Replicate: `MUSIC_PROVIDER=replicate`

## Security: Rotate Key Again

⚠️ **The key was exposed in chat. After successful test:**

1. Generate NEW key in FAL dashboard
2. Update `server/.env`
3. Restart services
4. Delete old key from dashboard

## Success Criteria

✅ Services restarted
✅ New key loaded (prefix: `0b69330b`)
✅ Provider health: `fal.ok=true`
✅ Job completes with FAL provider
✅ No 403 errors
✅ `file_url` populated
✅ File plays correctly

**Status: Ready to restart and test! 🚀**

