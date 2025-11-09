# Security: Key Rotation Guide 🔐

## ⚠️ CRITICAL: Rotate Keys Immediately

**Both FAL and Replicate keys have been exposed in chat/logs. Rotate them NOW.**

## Step 1: Generate New FAL Key

1. **Go to FAL Dashboard:**
   - Visit: https://fal.ai/dashboard/keys
   - Login with your account

2. **Create New Key:**
   - Click "Create New Key" or "Generate API Key"
   - **Select ADMIN scope** (required for model access)
   - Copy the new key (format: `key:secret`)

3. **Update `server/.env`:**
   ```env
   FAL_KEY=your_new_key_here
   FAL_API_KEY=your_new_key_here
   ```

4. **Delete Old Key:**
   - In FAL dashboard, delete/revoke the old key
   - Old key: `0b69330b-6ca4-46ed-82ca-1c6fc15e0770:...`

## Step 2: Generate New Replicate Token

1. **Go to Replicate Dashboard:**
   - Visit: https://replicate.com/account/api-tokens
   - Login with your account

2. **Create New Token:**
   - Click "Create Token"
   - Give it a name (e.g., "SoundFoundry Production")
   - Copy the token (starts with `r8_`)

3. **Update `server/.env`:**
   ```env
   REPLICATE_API_TOKEN=your_new_token_here
   ```

4. **Delete Old Token:**
   - In Replicate dashboard, delete/revoke the old token
   - Old token: `r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 3: Restart Services

**After updating `.env`:**

**Terminal 1 (API):**
```powershell
# Stop (Ctrl+C), then:
cd C:\Users\chrom\OneDrive\Documents\Ableton\server
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000 --log-level info
```

**Terminal 2 (Worker):**
```powershell
# Stop (Ctrl+C), then:
cd C:\Users\chrom\OneDrive\Documents\Ableton\server
.\venv\Scripts\Activate.ps1
$env:REDIS_URL="redis://localhost:6379/0"
celery -A app.celery_app worker --loglevel=debug --pool=solo --concurrency=1 --prefetch-multiplier=1
```

## Step 4: Verify New Keys

**Test Provider Health:**
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

## Log Masking

✅ **Code updated to mask API keys in logs:**
- Only shows first 8 characters + "..."
- Full keys never appear in logs
- Error messages sanitized

## Security Best Practices

1. **Never commit `.env` files**
   - Keep in `.gitignore`
   - Use `.env.example` for documentation

2. **Rotate keys regularly**
   - Every 90 days minimum
   - Immediately if exposed

3. **Use environment-specific keys**
   - Different keys for dev/staging/prod
   - Never share keys between environments

4. **Monitor key usage**
   - Check FAL dashboard for usage
   - Check Replicate dashboard for usage
   - Set up alerts for unusual activity

5. **Mask keys in logs**
   - Only show prefix (first 8 chars)
   - Never log full keys
   - Sanitize error messages

## Current Status

⚠️ **ACTION REQUIRED:**
- [ ] Generate new FAL key
- [ ] Generate new Replicate token
- [ ] Update `server/.env`
- [ ] Delete old keys from dashboards
- [ ] Restart services
- [ ] Verify provider health

**Status: Keys need rotation! 🔐**

