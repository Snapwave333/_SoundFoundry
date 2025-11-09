# Final Verification Checklist ✅

## Pre-Flight Checks

### ✅ Infrastructure
- [x] PostgreSQL: Running and healthy
- [x] Redis: Running and healthy
- [x] MinIO: Running, bucket created
- [x] API Server: Running on port 8000
- [ ] **Worker: NEEDS RESTART** (to load new code)

### ✅ Code Status
- [x] fal-client 0.9.0 installed
- [x] Auto-fallback implemented
- [x] Enhanced logging active
- [x] Provider health endpoint working
- [x] Job logs endpoint working

### ✅ Provider Health
```json
{
  "fal": "ok",
  "replicate": "ok"
}
```

## Step-by-Step Verification

### Step 1: Restart Worker ✅

**Action Required:** Restart worker in new terminal

**Option A - Use Script:**
```powershell
cd server
.\restart_worker.ps1
```

**Option B - Manual:**
```powershell
cd server
.\venv\Scripts\Activate.ps1
$env:REDIS_URL="redis://localhost:6379/0"
celery -A app.celery_app worker --loglevel=debug --pool=solo --concurrency=1 --prefetch-multiplier=1
```

**Expected Logs:**
- `fal-client loaded: version=unknown`
- `Default MUSIC_PROVIDER: fal`
- `Connected to redis://localhost:6379/0`
- `ready`

**Verify:** No `/submit` endpoint references (indicates old code)

### Step 2: Test Auto-Fallback ✅

**Run Test Script:**
```powershell
cd server
.\test_autofallback.ps1
```

**OR Manual Test:**
```powershell
# Create job
$body = @{ prompt="Warm ambient pad"; duration_s=20; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
$result = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body

# Watch worker logs for:
# - "Using provider: fal"
# - If 403: "Provider fal failed" → "Falling back to replicate"
# - "Fallback successful, using replicate"
# - Status: QUEUED → RENDERING → COMPLETE

# Check status
Start-Sleep -Seconds 30
Invoke-RestMethod "http://localhost:8000/api/jobs/$($result.job_id)"
Invoke-RestMethod "http://localhost:8000/api/jobs/$($result.job_id)/logs"
```

**Expected Behavior:**
1. Job tries FAL first
2. If FAL returns 403, automatically falls back to Replicate
3. Job completes successfully with Replicate
4. `file_url` populated in track
5. File accessible in MinIO

### Step 3: Rotate API Keys ⚠️

**See:** `API_KEY_ROTATION_GUIDE.md`

**Quick Steps:**
1. Generate new FAL key (ADMIN scope) → Update `server/.env`
2. Generate new Replicate token → Update `server/.env`
3. Restart API + Worker
4. Test provider health
5. Create test job

### Step 4: Verify End-to-End ✅

**Check Job Completion:**
```powershell
# Replace JOB_ID and TRACK_ID
Invoke-RestMethod "http://localhost:8000/api/jobs/JOB_ID"
Invoke-RestMethod "http://localhost:8000/api/tracks/TRACK_ID"
```

**Expected Results:**
- Job status: `complete`
- Track status: `complete`
- `file_url` populated
- File accessible via URL

**Verify MinIO:**
1. Open http://localhost:9001
2. Login: `minioadmin/minioadmin`
3. Check bucket `soundfoundry`
4. Verify object exists for track

**Test File Playback:**
- Open `file_url` in browser
- Should play audio file
- Verify content type is audio

## Current Test Job

**Job Created:** Track 16, Job 16
- Status: QUEUED (waiting for worker restart)
- Will process after worker restart
- Will test auto-fallback behavior

## Troubleshooting

### Worker Not Processing Jobs

**Check:**
```powershell
celery -A app.celery_app inspect ping
```

**Should return:** `pong` from worker

**If not:**
- Verify worker is running
- Check Redis connection
- Restart worker

### Jobs Stuck at QUEUED

**Causes:**
- Worker not running
- Worker not connected to Redis
- Worker using old code

**Fix:**
- Restart worker
- Verify Redis connection
- Check worker logs

### FAL Still Returns 403

**Options:**
1. Rotate FAL key (may fix permission issue)
2. Set `MUSIC_PROVIDER=replicate` in `.env`
3. System will use Replicate exclusively

### File URL Not Populated

**Check:**
- Job status is `complete`
- Track status is `complete`
- Worker logs show successful completion
- MinIO bucket has object

**If missing:**
- Check worker logs for errors
- Verify storage service configuration
- Check MinIO bucket permissions

## Success Criteria

✅ **Worker restarted** with new code
✅ **Auto-fallback works** (FAL → Replicate if needed)
✅ **Job completes** successfully
✅ **File URL populated** and accessible
✅ **MinIO object exists** and playable
✅ **API keys rotated** (security)
✅ **End-to-end verified** (create → render → download)

## Next Steps

1. ✅ Restart worker
2. ✅ Test auto-fallback
3. ⚠️ Rotate API keys
4. ✅ Verify end-to-end
5. 🚀 Deploy to production

**Status: Ready for final verification! 🎯**

