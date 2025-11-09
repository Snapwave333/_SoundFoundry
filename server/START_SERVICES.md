# Start Services - Exact Instructions

## ⚠️ STEP 1: Close ALL PowerShell Windows

**Close every PowerShell window completely before proceeding!**

## STEP 2: Open Fresh Terminal 1 (API Server)

**Open NEW PowerShell window, then run:**

```powershell
cd C:\Users\chrom\OneDrive\Documents\Ableton\server
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000 --log-level info
```

**Wait for:** `Application startup complete.`

## STEP 3: Open Fresh Terminal 2 (Worker)

**Open NEW PowerShell window, then run:**

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

## STEP 4: Verify Key in Each Terminal

**In Terminal 1 (API), run:**
```powershell
python -c "import os; from dotenv import load_dotenv; load_dotenv('.env', override=True); k=os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); print('FAL prefix:', k[:8] if k else None)"
```

**In Terminal 2 (Worker), run:**
```powershell
python -c "import os; from dotenv import load_dotenv; load_dotenv('.env', override=True); k=os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); print('FAL prefix:', k[:8] if k else None)"
```

**Expected:** `FAL prefix: 0b69330b` in BOTH terminals

## STEP 5: Health Check

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

## STEP 6: Create Test Job

**In any terminal:**
```powershell
$env:MUSIC_PROVIDER="fal"
$body = @{ prompt="Warm ambient pad"; duration_s=20; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
$r = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
Invoke-RestMethod ("http://localhost:8000/api/jobs/{0}" -f $r.job_id)
```

**Watch Terminal 2 (Worker) for:**
- ✅ `Using provider: fal`
- ✅ **NO 403 errors**
- ✅ Status: `QUEUED → RENDERING → COMPLETE`

## STEP 7: Verify Completion

**Wait 30-60 seconds, then:**
```powershell
Invoke-RestMethod ("http://localhost:8000/api/tracks/{0}" -f $r.track_id)
```

**Expected:**
- `provider: "fal"`
- `status: "complete"`
- `file_url` populated
- File accessible in MinIO

## Troubleshooting

### If Still Seeing Old Prefix

**Clear environment variables:**
```powershell
[Environment]::SetEnvironmentVariable('FAL_KEY',$null,'Process')
[Environment]::SetEnvironmentVariable('FAL_API_KEY',$null,'Process')
[Environment]::SetEnvironmentVariable('FAL_KEY',$null,'User')
[Environment]::SetEnvironmentVariable('FAL_API_KEY',$null,'User')
```

**Then close terminals and repeat steps 2-3.**

### If FAL Returns 403

**Set fallback in `.env`:**
```
MUSIC_PROVIDER=replicate
```

**Then restart both services.**

