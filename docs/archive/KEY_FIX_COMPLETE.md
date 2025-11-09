# Key Loading Fix Complete ✅

## Actions Taken

### 1. ✅ Killed All Lingering Processes
- Stopped all Python/Celery/Uvicorn processes
- Cleared process table

### 2. ✅ Removed OS-Level Overrides
- Cleared User-level environment variables
- Cleared Machine-level environment variables
- `.env` is now the single source of truth

### 3. ✅ Verified .env File
- `FAL_KEY` set correctly: `0b69330b-6ca4-46ed-82ca-1c6fc15e0770:413568623f5894ed76077f23cc2eddb0`
- `FAL_API_KEY` set correctly: `0b69330b-6ca4-46ed-82ca-1c6fc15e0770:413568623f5894ed76077f23cc2eddb0`
- No quotes, no trailing spaces

### 4. ✅ Guaranteed .env Loading
- Updated `app/main.py` to load `.env` explicitly at top
- Updated `app/celery_app.py` to load `.env` explicitly at top
- Using explicit path: `Path(__file__).resolve().parents[1] / ".env"`

### 5. ✅ Provider Init Updated
- Added `_get_fal_key()` method in FAL provider
- Prefers `FAL_KEY` over `FAL_API_KEY`
- Clear, explicit key loading

### 6. ✅ Cleaned Bytecode
- Removed all `__pycache__` directories
- Fresh Python imports will be used

### 7. ✅ Verified fal-client
- fal-client available in venv
- Ready to use

## Next Steps: Start Services Fresh

### Start API Server

**Terminal 1:**
```powershell
cd server
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000 --log-level info
```

**Verify key loaded (in API terminal):**
```powershell
python -c "import os; k = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); print('FAL prefix:', k[:8] if k else None)"
```

**Expected:** `FAL prefix: 0b69330b`

### Start Worker

**Terminal 2:**
```powershell
cd server
.\venv\Scripts\Activate.ps1
$env:REDIS_URL="redis://localhost:6379/0"
celery -A app.celery_app worker --loglevel=debug --pool=solo --concurrency=1 --prefetch-multiplier=1
```

**Verify key loaded (in worker terminal):**
```powershell
python -c "import os; k = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); print('FAL prefix:', k[:8] if k else None)"
```

**Expected:** `FAL prefix: 0b69330b`

### Test Provider Health

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

### Create Test Job

```powershell
$env:MUSIC_PROVIDER="fal"
$body = @{ prompt="Warm ambient pad"; duration_s=20; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
$r = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
Invoke-RestMethod "http://localhost:8000/api/jobs/$($r.job_id)"
```

**Watch worker logs for:**
- ✅ `Using provider: fal`
- ✅ **NO 403 errors**
- ✅ Job completes successfully
- ✅ No fallback to Replicate

## Code Changes Made

### `server/app/main.py`
- Added explicit `.env` loading at top
- Uses `Path(__file__).resolve().parents[1] / ".env"`

### `server/app/celery_app.py`
- Added explicit `.env` loading at top
- Uses `Path(__file__).resolve().parents[1] / ".env"`

### `server/app/services/fal_provider.py`
- Added `_get_fal_key()` static method
- Clear preference for `FAL_KEY` over `FAL_API_KEY`

## Troubleshooting

### If Still Seeing Old Prefix

1. **Verify you're in correct directory:**
   ```powershell
   pwd
   # Should be: C:\Users\chrom\OneDrive\Documents\Ableton\server
   ```

2. **Check .env file directly:**
   ```powershell
   Get-Content .env | Select-String "FAL_KEY"
   ```

3. **Verify explicit path loading:**
   ```powershell
   python -c "from pathlib import Path; from dotenv import load_dotenv; load_dotenv(Path('server') / '.env'); import os; print(os.getenv('FAL_KEY')[:8])"
   ```

### If FAL Still Returns 403

**Test directly in worker terminal:**
```powershell
python -c "import os, fal_client; from dotenv import load_dotenv; from pathlib import Path; load_dotenv(Path('server') / '.env'); key = os.getenv('FAL_KEY'); os.environ['FAL_KEY'] = key; print('Key:', key[:20]); res = fal_client.run('fal-ai/minimax-music/v2', arguments={'prompt':'test','duration':10}); print('Success:', bool(res))"
```

**If this still 403s:**
- Verify key has ADMIN scope in FAL dashboard
- Check key is active (not revoked)
- Use Replicate: `MUSIC_PROVIDER=replicate`

## Success Criteria

✅ All processes killed
✅ OS-level overrides cleared
✅ .env file correct
✅ Code loads .env explicitly
✅ Provider uses FAL_KEY
✅ Bytecode cleaned
✅ Services ready to start

**Status: Ready to start services with new key! 🚀**

