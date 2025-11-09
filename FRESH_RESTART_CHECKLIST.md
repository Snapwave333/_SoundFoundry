# Fresh Restart Checklist ✅

## ⚠️ CRITICAL: Close All Terminals First

**Close ALL PowerShell terminals before proceeding!**

The Process-level environment variable persists in the current session. Fresh terminals are required.

## Step-by-Step Instructions

### Step 1: Close All Terminals
- Close Terminal 1 (API Server) - `Ctrl+C` then close window
- Close Terminal 2 (Worker) - `Ctrl+C` then close window  
- Close any other PowerShell windows

### Step 2: Open Fresh Terminal 1 (API Server)

**Open NEW PowerShell window:**

```powershell
cd C:\Users\chrom\OneDrive\Documents\Ableton\server
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000 --log-level info
```

**Wait for:** `Application startup complete.`

**Verify key loaded (in this terminal):**
```powershell
python -c "import os; from dotenv import load_dotenv; load_dotenv('.env', override=True); k = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); print('FAL prefix:', k[:8] if k else None)"
```

**Expected:** `FAL prefix: 0b69330b`

**OR use script:**
```powershell
.\verify_key.ps1
```

### Step 3: Open Fresh Terminal 2 (Worker)

**Open NEW PowerShell window:**

```powershell
cd C:\Users\chrom\OneDrive\Documents\Ableton\server
.\venv\Scripts\Activate.ps1
$env:REDIS_URL="redis://localhost:6379/0"
celery -A app.celery_app worker --loglevel=debug --pool=solo --concurrency=1 --prefetch-multiplier=1
```

**Wait for:** `ready`

**Expected logs:**
```
fal-client loaded: version=unknown
Default MUSIC_PROVIDER: fal
[INFO] Connected to redis://localhost:6379/0
[INFO] celery@hostname ready
```

**Verify key loaded (in this terminal):**
```powershell
python -c "import os; from dotenv import load_dotenv; load_dotenv('.env', override=True); k = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); print('FAL prefix:', k[:8] if k else None)"
```

**Expected:** `FAL prefix: 0b69330b`

**OR use script:**
```powershell
.\verify_key.ps1
```

### Step 4: Test Provider Health

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

### Step 5: Create Test Job

**In any terminal:**

```powershell
$env:MUSIC_PROVIDER="fal"
$body = @{ prompt="Warm ambient pad"; duration_s=20; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
$r = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
Invoke-RestMethod "http://localhost:8000/api/jobs/$($r.job_id)"
```

**OR use script:**
```powershell
.\test_fal_job.ps1
```

**Watch worker logs (Terminal 2) for:**
- ✅ `Using provider: fal`
- ✅ **NO 403 errors**
- ✅ Status: `QUEUED → RENDERING → COMPLETE`
- ✅ No fallback to Replicate

### Step 6: Verify Completion

**Wait 30-60 seconds, then:**

```powershell
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

### Still Seeing Old Prefix (`462dc8ce`)

**Check:**
1. Did you close ALL terminals?
2. Are you in the correct directory? (`cd server`)
3. Test explicit loading:
   ```powershell
   python -c "from dotenv import load_dotenv; load_dotenv('.env', override=True); import os; print(os.getenv('FAL_KEY')[:8])"
   ```

### FAL Still Returns 403

**Test directly in worker terminal:**
```powershell
python -c "import os, fal_client; from dotenv import load_dotenv; load_dotenv('.env', override=True); key = os.getenv('FAL_KEY'); os.environ['FAL_KEY'] = key; print('Key:', key[:20]); res = fal_client.run('fal-ai/minimax-music/v2', arguments={'prompt':'test','duration':10}); print('Success:', bool(res))"
```

**If still 403:**
- Verify key has ADMIN scope in FAL dashboard
- Use Replicate: Set `MUSIC_PROVIDER=replicate` in `.env`
- Restart services

### Worker Silent on Job

**Check:**
1. Worker shows "ready"?
2. Both use same Redis: `REDIS_URL=redis://localhost:6379/0`
3. Check Redis connection:
   ```powershell
   celery -A app.celery_app inspect ping
   ```

## Security: Rotate Key Again

⚠️ **The FAL key was exposed in chat. After successful test:**

1. Generate NEW key in FAL dashboard (ADMIN scope)
2. Update `server/.env`: `FAL_KEY=new_key_here`
3. Restart both services
4. Delete old key from dashboard

## Success Criteria

✅ Fresh terminals opened
✅ Key prefix: `0b69330b` in both terminals
✅ Provider health: `fal.ok=true`
✅ Job completes with FAL (no 403)
✅ No fallback to Replicate
✅ `file_url` populated and accessible

## Report Back

After testing, report:
1. Provider health JSON
2. FAL prefix from API terminal
3. FAL prefix from Worker terminal
4. Job status and track provider
5. Any errors (first 10 lines)

**Status: Ready for fresh restart! 🚀**

