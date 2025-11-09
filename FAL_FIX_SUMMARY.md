# FAL API 403 Fix Summary

## Changes Made

### 1. ✅ Upgraded fal-client
- Upgraded from 0.4.0 to 0.9.0
- Now using `fal_client.run()` method

### 2. ✅ Updated FAL Provider
- Rewrote to use `fal_client.run()` instead of raw HTTP
- Sets `FAL_KEY` environment variable (fal-client reads from env)
- Supports both `FAL_KEY` and `FAL_API_KEY` env vars
- Better error handling for 401/403 errors

### 3. ✅ Added Auto-Fallback
- `get_provider()` now automatically falls back to Replicate if FAL fails
- Logs provider failures and fallback attempts
- Worker also handles fallback gracefully

### 4. ✅ Provider Health Endpoint
- Added `/api/health/providers` to check both providers
- Returns status: `ok` or `fail` for each provider
- Includes error messages for debugging

## Current Status

### FAL API Still Returning 403
- **Error**: `Client error '403 Forbidden' for url 'https://fal.run/fal-ai/minimax-music/v2'`
- **Possible Causes**:
  1. API key format incorrect (should be `key:secret` format)
  2. API key lacks ADMIN scope
  3. API key expired/revoked
  4. Model endpoint requires different authentication

### Auto-Fallback Working
- If FAL fails, system automatically tries Replicate
- Fallback is logged and track.provider is updated
- User sees seamless experience

## Next Steps

### Option 1: Fix FAL API Key
1. Verify API key has ADMIN scope at https://fal.ai/dashboard/keys
2. Check key format: `key:secret` (your key: `462dc8ce-caa1-42a5-a0c9-d44a516ac707:7097ac8939033620f3b4e0985e44c486`)
3. Test key directly:
   ```powershell
   curl -X POST "https://fal.run/fal-ai/minimax-music/v2" \
     -H "Authorization: Key YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"prompt":"test","duration":5}'
   ```

### Option 2: Use Replicate (Current Workaround)
- Set `MUSIC_PROVIDER=replicate` in `server/.env`
- Or leave auto-fallback enabled (default behavior)

## Testing

```powershell
# Test provider health
Invoke-RestMethod http://localhost:8000/api/health/providers

# Create track (will auto-fallback if FAL fails)
$body = @{ prompt="Test"; duration_s=30; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
```

## Code Changes

- ✅ `server/app/services/fal_provider.py` - Rewritten to use fal-client
- ✅ `server/app/services/model_provider.py` - Added auto-fallback logic
- ✅ `server/app/workers/generate_music.py` - Handles provider fallback
- ✅ `server/app/api/health.py` - Added provider health endpoint

The system is now resilient to provider failures and will automatically use Replicate if FAL is unavailable.

