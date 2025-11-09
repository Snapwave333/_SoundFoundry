# Worker Restart Instructions 🔄

## Critical: Restart Worker to Load New Code

The worker is currently using **old code** (error shows `/submit` endpoint). You need to restart it to load the new fal-client code.

### Steps

1. **Stop Current Worker**
   - In the worker terminal, press `Ctrl+C`
   - Wait for it to fully stop

2. **Clean Bytecode (Optional but Recommended)**
   ```powershell
   cd server
   Get-ChildItem -Recurse -Include __pycache__ | Remove-Item -Recurse -Force
   ```

3. **Start Worker with New Code**
   ```powershell
   cd server
   .\venv\Scripts\Activate.ps1
   $env:REDIS_URL="redis://localhost:6379/0"
   celery -A app.celery_app worker --loglevel=debug --pool=solo --concurrency=1 --prefetch-multiplier=1
   ```

### Expected Startup Logs

You should see:
```
fal-client loaded: version=unknown
Default MUSIC_PROVIDER: fal
[INFO] Connected to redis://localhost:6379/0
[INFO] celery@hostname ready
```

**Verify:** No references to `/submit` endpoint (that would indicate old code)

### After Restart: Test Auto-Fallback

1. **Create a new job:**
   ```powershell
   $body = @{ prompt="Warm ambient pad"; duration_s=20; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
   $result = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
   ```

2. **Watch worker logs** - You should see:
   - `Job {id}: Using provider: fal, track_id={id}, attempt=1`
   - If FAL fails: `Job {id}: Provider fal failed: ..., error_code=403`
   - `Job {id}: Falling back to replicate, track_id={id}, attempt=2`
   - `Job {id}: Fallback successful, using replicate`
   - Normal render logs → COMPLETE

3. **Check job status:**
   ```powershell
   Invoke-RestMethod "http://localhost:8000/api/jobs/$($result.job_id)"
   ```

4. **Check job logs:**
   ```powershell
   Invoke-RestMethod "http://localhost:8000/api/jobs/$($result.job_id)/logs"
   ```

### Current Status

- ✅ API Server: Running
- ✅ Provider Health: Both OK
- ✅ Job Creation: Working (created track 13, job 15)
- ⏳ **Worker: NEEDS RESTART** (still using old code)
- ⏳ Keys: Need rotation

### Why Restart is Needed

The error message shows:
```
Client error '403 Forbidden' for url 'https://fal.run/fal-ai/minimax-music/v2/submit'
```

The `/submit` endpoint indicates the worker is using the **old HTTP code**, not the new `fal-client` library. After restart, it will use `fal_client.run()` instead.

### After Restart Success

Once the worker is restarted and processing jobs:
- Auto-fallback will work automatically
- Jobs will complete successfully with Replicate
- `file_url` will be populated
- You can verify in MinIO console

**Status: Ready to restart worker! 🚀**

