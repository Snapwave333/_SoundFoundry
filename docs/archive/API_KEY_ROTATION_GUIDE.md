# API Key Rotation Guide 🔐

## ⚠️ Strongly Recommended Before Production

Rotating API keys ensures security and may resolve FAL 403 issues if the current key has permission problems.

## Step 1: Generate New FAL API Key

1. **Go to FAL Dashboard:**
   - Visit: https://fal.ai/dashboard/keys
   - Login with your FAL account

2. **Create New Key:**
   - Click "Create New Key" or "Generate API Key"
   - **Important:** Select **ADMIN scope** (required for model access)
   - Copy the new key (format: `key:secret`)

3. **Update `server/.env`:**
   ```env
   FAL_KEY=your_new_key_here
   # Keep old for reference (comment it out)
   # FAL_API_KEY=old_key_here
   ```

4. **Verify Format:**
   - Should be in format: `key:secret` (with colon separator)
   - Example: `462dc8ce-caa1-42a5-a0c9-d44a516ac707:7097ac8939033620f3b4e0985e44c486`

## Step 2: Generate New Replicate API Token

1. **Go to Replicate Dashboard:**
   - Visit: https://replicate.com/account/api-tokens
   - Login with your Replicate account

2. **Create New Token:**
   - Click "Create Token" or "Generate Token"
   - Give it a descriptive name (e.g., "SoundFoundry Production")
   - Copy the token (starts with `r8_`)

3. **Update `server/.env`:**
   ```env
   REPLICATE_API_TOKEN=your_new_token_here
   ```

4. **Verify Format:**
   - Should start with `r8_`
   - Example: `r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 3: Restart Services

After updating `.env`, restart both services:

**API Server:**
```powershell
# Stop current server (Ctrl+C), then:
cd server
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000 --log-level info
```

**Worker:**
```powershell
# Stop current worker (Ctrl+C), then:
cd server
.\venv\Scripts\Activate.ps1
$env:REDIS_URL="redis://localhost:6379/0"
celery -A app.celery_app worker --loglevel=debug --pool=solo --concurrency=1 --prefetch-multiplier=1
```

## Step 4: Verify New Keys

### Test FAL Provider
```powershell
python -c "import os; from dotenv import load_dotenv; import fal_client; load_dotenv(); key = os.getenv('FAL_KEY') or os.getenv('FAL_API_KEY'); os.environ['FAL_KEY'] = key; print('FAL Key set:', bool(key)); print('Key format:', 'key:secret' if key and ':' in key else 'single value')"
```

### Test Replicate Provider
```powershell
python -c "import os; from dotenv import load_dotenv; load_dotenv(); token = os.getenv('REPLICATE_API_TOKEN'); print('Replicate token set:', bool(token)); print('Token format:', 'r8_...' if token and token.startswith('r8_') else 'invalid')"
```

### Test Provider Health
```powershell
Invoke-RestMethod http://localhost:8000/api/health/providers
```

Expected:
```json
{
  "fal": "ok",
  "replicate": "ok",
  "fal_error": null,
  "replicate_error": null
}
```

## Step 5: Test with New Keys

Create a test job:
```powershell
$body = @{ prompt="Test with new keys"; duration_s=20; has_vocals=$false; style_strength=0.5 } | ConvertTo-Json
$result = Invoke-RestMethod -Uri http://localhost:8000/api/tracks -Method POST -ContentType "application/json" -Body $body
```

Watch worker logs:
- If FAL works: Job completes with FAL provider
- If FAL still 403: Auto-fallback to Replicate (should work)

## Troubleshooting

### FAL Still Returns 403 After Key Rotation

1. **Verify Key Scope:**
   - Ensure key has **ADMIN scope** in FAL dashboard
   - Check key permissions/access

2. **Verify Key Format:**
   - Must be `key:secret` format
   - No extra spaces or characters

3. **Check Model Access:**
   - Verify key has access to `fal-ai/minimax-music/v2`
   - Check billing/quota status

4. **Use Replicate as Primary:**
   ```env
   MUSIC_PROVIDER=replicate
   ```
   Then restart services

### Replicate Token Issues

1. **Verify Token Format:**
   - Must start with `r8_`
   - No extra spaces

2. **Check Token Permissions:**
   - Ensure token is active
   - Check account billing status

## Security Best Practices

1. **Never Commit Keys:**
   - Keep `.env` in `.gitignore`
   - Use `.env.example` for documentation

2. **Rotate Regularly:**
   - Rotate keys every 90 days
   - Rotate immediately if compromised

3. **Use Environment-Specific Keys:**
   - Different keys for dev/staging/prod
   - Never share keys between environments

4. **Monitor Usage:**
   - Check FAL dashboard for usage
   - Check Replicate dashboard for usage
   - Set up alerts for unusual activity

## Current Keys Status

⚠️ **Action Required:** Rotate keys before production deployment

- FAL Key: Needs rotation (may have permission issues)
- Replicate Token: Needs rotation (security best practice)

## After Rotation

Once keys are rotated:
1. ✅ Update `server/.env`
2. ✅ Restart API server
3. ✅ Restart worker
4. ✅ Test provider health
5. ✅ Create test job
6. ✅ Verify auto-fallback works

**Status: Ready for key rotation! 🔐**

