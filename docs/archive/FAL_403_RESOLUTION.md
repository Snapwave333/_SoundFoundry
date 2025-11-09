# FAL API 403 Resolution Guide

## Current Status

✅ **Code Fixed**: FAL provider rewritten to use `fal-client` library  
✅ **Auto-Fallback**: System automatically falls back to Replicate if FAL fails  
⚠️ **FAL API**: Still returning 403 Forbidden (likely API key issue)

## What Was Fixed

1. **Upgraded fal-client**: 0.4.0 → 0.9.0
2. **Rewrote FAL Provider**: Now uses `fal_client.run()` instead of raw HTTP
3. **Added Auto-Fallback**: Automatically uses Replicate if FAL fails
4. **Better Error Handling**: Logs provider failures and fallback attempts

## FAL 403 Error Analysis

The 403 error persists even with fal-client, suggesting:

### Most Likely Causes:
1. **API Key Scope**: Key may lack ADMIN scope
   - Check at: https://fal.ai/dashboard/keys
   - Ensure key has ADMIN scope

2. **API Key Format**: Current format `key:secret` may be incorrect
   - Your key: `462dc8ce-caa1-42a5-a0c9-d44a516ac707:7097ac8939033620f3b4e0985e44c486`
   - Verify this is the correct format for fal-client

3. **Model Access**: Key may not have access to `fal-ai/minimax-music/v2`
   - Check model availability in FAL dashboard
   - Verify billing/quota status

## Current Workaround

**Auto-Fallback is Active**: When FAL returns 403, the system automatically:
1. Logs the FAL error
2. Switches to Replicate provider
3. Processes the job with Replicate
4. Updates track.provider to "replicate"

## Testing Auto-Fallback

```powershell
# Create track (will try FAL first, then fallback to Replicate)
$body = @{ prompt="Test track"; duration_s=30; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
$result = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
$jobId = $result.job_id

# Wait a few seconds, then check job status
Start-Sleep -Seconds 5
Invoke-RestMethod -Uri "http://localhost:8000/api/jobs/$jobId"

# Check which provider was actually used
Invoke-RestMethod -Uri "http://localhost:8000/api/tracks/$($result.track_id)"
```

## To Fix FAL API (Optional)

1. **Verify API Key**:
   - Go to https://fal.ai/dashboard/keys
   - Check if key has ADMIN scope
   - Generate new key if needed

2. **Test Key Directly**:
   ```powershell
   # Test with curl (if available)
   curl -X POST "https://fal.run/fal-ai/minimax-music/v2" `
     -H "Authorization: Key 462dc8ce-caa1-42a5-a0c9-d44a516ac707:7097ac8939033620f3b4e0985e44c486" `
     -H "Content-Type: application/json" `
     -d '{\"prompt\":\"test\",\"duration\":5}'
   ```

3. **Update .env**:
   ```env
   FAL_KEY=your_new_key_if_needed
   MUSIC_PROVIDER=fal  # or replicate to force Replicate
   ```

## Recommendation

**For now**: Leave auto-fallback enabled. The system will:
- Try FAL first (as preferred)
- Automatically use Replicate if FAL fails
- Log all provider attempts for debugging

**To force Replicate**: Set `MUSIC_PROVIDER=replicate` in `server/.env`

The application is fully functional with Replicate as the working provider.

