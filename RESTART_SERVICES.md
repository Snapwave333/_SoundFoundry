# Restart Services Instructions 🔄

## ⚠️ CRITICAL: Restart Both Services

The new FAL key is in `.env`, but **both services must be restarted** to load it.

## Step 1: Restart API Server

**In Terminal 1 (API Server):**

```powershell
# Stop current server (Ctrl+C), then:
cd server
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000 --log-level info
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

## Step 2: Restart Worker

**In Terminal 2 (Worker):**

```powershell
# Stop current worker (Ctrl+C), then:
cd server
.\venv\Scripts\Activate.ps1
$env:REDIS_URL="redis://localhost:6379/0"
celery -A app.celery_app worker --loglevel=debug --pool=solo --concurrency=1 --prefetch-multiplier=1
```

**Expected output:**
```
fal-client loaded: version=unknown
Default MUSIC_PROVIDER: fal
[INFO] Connected to redis://localhost:6379/0
[INFO] celery@hostname ready
```

## Step 3: Verify New Key is Loaded

**In the worker terminal (Terminal 2), run:**

```powershell
python -c "import os; k = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); print('FAL_KEY present:', bool(k)); print('prefix:', k[:8] if k else None)"
```

**Expected:**
```
FAL_KEY present: True
prefix: 0b69330b
```

## Step 4: Verify Provider Health

**In any terminal:**

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

## Step 5: Check Job 19 Status

```powershell
Invoke-RestMethod http://localhost:8000/api/jobs/19
```

**Expected:** Status should progress beyond QUEUED (if worker is running)

## Step 6: Create Fresh Test Job

```powershell
$env:MUSIC_PROVIDER="fal"
$body = @{ prompt="Warm ambient pad"; duration_s=20; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
$r = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
$r
```

**Watch worker logs (Terminal 2) for:**
- `Using provider: fal`
- **NO 403 errors**
- Job completes successfully
- No fallback to Replicate

## Step 7: Verify Job Completion

```powershell
# Wait 30-60 seconds, then:
Invoke-RestMethod "http://localhost:8000/api/jobs/$($r.job_id)"
Invoke-RestMethod "http://localhost:8000/api/tracks/$($r.track_id)"
```

**Expected:**
- Job status: `complete`
- Track status: `complete`
- Track provider: `fal` (not `replicate`)
- `file_url` populated
- File accessible in MinIO

## Troubleshooting

### If FAL Still Returns 403

**Test FAL client directly in worker terminal:**

```powershell
python -c "import os, fal_client; from dotenv import load_dotenv; load_dotenv(); key = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); os.environ['FAL_KEY'] = key; print('Key set:', bool(key)); res = fal_client.run('fal-ai/minimax-music/v2', arguments={'prompt':'test','duration':10}); print('Success:', bool(res))"
```

**If this still 403s:**
- Verify key has ADMIN scope in FAL dashboard
- Check key is active (not revoked)
- Ensure key format is correct (`key:secret`)
- May need to use Replicate: `MUSIC_PROVIDER=replicate`

### If Services Don't Pick Up New Key

1. **Verify .env file:**
   ```powershell
   Get-Content server\.env | Select-String "FAL_KEY"
   ```
   Should show: `FAL_KEY=0b69330b-6ca4-46ed-82ca-1c6fc15e0770:...`

2. **Fully restart services** (don't just reload)

3. **Check environment in worker:**
   ```powershell
   python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('FAL_KEY')[:20])"
   ```

## Security Note

⚠️ **The FAL key was exposed in chat. After testing:**
1. Generate a NEW key in FAL dashboard
2. Update `server/.env` with new key
3. Restart services again
4. Delete old key from dashboard

## Current Test Jobs

- **Job 19:** Created before restart (may need fresh job)
- **Job 20:** Created after restart (will test new key)

**Status: Ready to restart services! 🚀**

