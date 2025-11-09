# Final Restart Instructions 🔄

## ⚠️ CRITICAL: Close and Reopen PowerShell Terminals

The Process-level environment variable (`FAL_KEY=462dc8ce...`) persists in the current PowerShell session. You **must** close and reopen terminals to clear it.

## Steps to Complete

### 1. Close All PowerShell Terminals
- Close Terminal 1 (API Server)
- Close Terminal 2 (Worker)
- Close any other PowerShell windows

### 2. Open Fresh Terminal 1 (API Server)

```powershell
cd C:\Users\chrom\OneDrive\Documents\Ableton\server
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000 --log-level info
```

**Verify key loaded (in this terminal):**
```powershell
python -c "import os; from dotenv import load_dotenv; from pathlib import Path; load_dotenv(Path('server') / '.env'); k = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); print('FAL prefix:', k[:8] if k else None)"
```

**Expected:** `FAL prefix: 0b69330b`

### 3. Open Fresh Terminal 2 (Worker)

```powershell
cd C:\Users\chrom\OneDrive\Documents\Ableton\server
.\venv\Scripts\Activate.ps1
$env:REDIS_URL="redis://localhost:6379/0"
celery -A app.celery_app worker --loglevel=debug --pool=solo --concurrency=1 --prefetch-multiplier=1
```

**Verify key loaded (in this terminal):**
```powershell
python -c "import os; from dotenv import load_dotenv; from pathlib import Path; load_dotenv(Path('server') / '.env'); k = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); print('FAL prefix:', k[:8] if k else None)"
```

**Expected:** `FAL prefix: 0b69330b`

**Expected worker startup logs:**
```
fal-client loaded: version=unknown
Default MUSIC_PROVIDER: fal
[INFO] Connected to redis://localhost:6379/0
[INFO] celery@hostname ready
```

### 4. Test Provider Health

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

### 5. Create Test Job

```powershell
$env:MUSIC_PROVIDER="fal"
$body = @{ prompt="Warm ambient pad"; duration_s=20; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
$r = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
$r
```

**Watch worker logs (Terminal 2) for:**
- ✅ `Using provider: fal`
- ✅ **NO 403 errors**
- ✅ Job completes successfully
- ✅ No fallback to Replicate

### 6. Verify Completion

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
- File accessible in MinIO

## What Was Fixed

### ✅ Code Changes
1. **`app/main.py`**: Added explicit `.env` loading at top
2. **`app/celery_app.py`**: Added explicit `.env` loading at top
3. **`app/services/fal_provider.py`**: Added `_get_fal_key()` method

### ✅ Environment Cleanup
1. Killed all Python processes
2. Cleared Process-level env vars (requires new terminal)
3. Verified `.env` file has correct key
4. Cleaned bytecode caches

### ✅ Key Loading
- Both services now load `.env` explicitly with path
- Provider prefers `FAL_KEY` over `FAL_API_KEY`
- Clear, explicit key resolution

## Troubleshooting

### If Still Seeing Old Prefix After Reopening Terminals

1. **Verify .env file:**
   ```powershell
   Get-Content server\.env | Select-String "FAL_KEY"
   ```
   Should show: `FAL_KEY=0b69330b-6ca4-46ed-82ca-1c6fc15e0770:...`

2. **Test explicit loading:**
   ```powershell
   python -c "from pathlib import Path; from dotenv import load_dotenv; import os; load_dotenv(Path('server') / '.env', override=True); print(os.getenv('FAL_KEY')[:8])"
   ```
   Should show: `0b69330b`

3. **Check for multiple .env files:**
   ```powershell
   Get-ChildItem -Recurse -Filter ".env" | Select-Object FullName
   ```

### If FAL Still Returns 403

**Test directly in worker terminal:**
```powershell
python -c "import os, fal_client; from dotenv import load_dotenv; from pathlib import Path; load_dotenv(Path('server') / '.env', override=True); key = os.getenv('FAL_KEY'); os.environ['FAL_KEY'] = key; print('Key:', key[:20]); res = fal_client.run('fal-ai/minimax-music/v2', arguments={'prompt':'test','duration':10}); print('Success:', bool(res))"
```

**If this still 403s:**
- Verify key has ADMIN scope in FAL dashboard
- Check key is active (not revoked)
- Use Replicate: `MUSIC_PROVIDER=replicate`

## Success Criteria

✅ Fresh terminals opened
✅ Key prefix: `0b69330b` (not `462dc8ce`)
✅ Provider health: `fal.ok=true`
✅ Job completes with FAL (no 403)
✅ No fallback to Replicate
✅ `file_url` populated

**Status: Ready to restart in fresh terminals! 🚀**

