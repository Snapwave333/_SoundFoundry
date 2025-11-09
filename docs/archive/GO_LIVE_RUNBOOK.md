# Go-Live Runbook

**Last Updated:** Production deployment checklist for style-seed system + cover art

---

## Preflight (Prod)

### Environment Variables

Verify all prod values are set (never use dev/test values):

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/soundfoundry_prod

# Redis
REDIS_URL=redis://host:6379/0

# Object Storage
S3_ENDPOINT=https://s3.amazonaws.com  # or MinIO endpoint
S3_ACCESS_KEY=<prod-key>
S3_SECRET_KEY=<prod-secret>
S3_BUCKET=soundfoundry-prod
S3_REGION=us-east-1

# Music Providers
MUSIC_PROVIDER=fal
FAL_KEY=<prod-fal-key>
REPLICATE_API_TOKEN=<prod-replicate-token>

# Style System
STYLE_SERIES_ENABLED=true
STYLE_UNLOCKS_ENABLED=true
STYLE_SEED_ENABLED=true

# Auth & CORS
NEXTAUTH_URL=https://app.yourdomain.com
CORS_ORIGINS=https://app.yourdomain.com,https://www.yourdomain.com

# Observability
SENTRY_DSN=<prod-sentry-dsn>
ENVIRONMENT=production
```

### Infrastructure Checklist

- [ ] DNS configured (A/AAAA/CNAME records)
- [ ] TLS certificates valid (Let's Encrypt or managed cert)
- [ ] CDN configured (Cloudflare, CloudFront, etc.)
- [ ] S3/MinIO bucket exists: `soundfoundry-prod`
- [ ] Bucket lifecycle rules set (cold storage after 30d)
- [ ] Bucket versioning enabled
- [ ] Database backups configured (nightly snapshots)
- [ ] Redis persistence enabled (if applicable)

---

## Deploy

### 1. Build + Push Images

```bash
# Build and push Docker images
docker buildx bake --push

# Verify images pushed successfully
docker images | grep soundfoundry
```

### 2. Run Database Migrations

**⚠️ CRITICAL: Run migrations BEFORE starting app**

```bash
# Connect to prod database
export DATABASE_URL="postgresql://user:pass@host:5432/soundfoundry_prod"

# Run migrations (one-shot, idempotent)
cd server
alembic upgrade head

# Verify migration status
alembic current

# Run style seed backfill
python scripts/backfill_style_seed.py

# Verify backfill success
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users WHERE user_style_seed IS NOT NULL;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM series WHERE slug LIKE 'default-%';"
```

### 3. Start Services

```bash
# Start infrastructure first (DB, Redis, S3)
docker compose -f compose.prod.yml up -d postgres redis minio

# Wait for services to be healthy
docker compose -f compose.prod.yml ps

# Start application services
docker compose -f compose.prod.yml up -d api worker web

# Verify all services running
docker compose -f compose.prod.yml ps
```

### 4. Warm Caches

```bash
# Health check
curl https://app.yourdomain.com/api/health

# Token export
curl https://app.yourdomain.com/api/tokens

# Style endpoints (with test account auth)
curl -H "Authorization: Bearer $TEST_TOKEN" \
  https://app.yourdomain.com/api/style/me

curl -H "Authorization: Bearer $TEST_TOKEN" \
  https://app.yourdomain.com/api/style/series?user_id=me
```

---

## Prod Smoke Tests

**Run these tests immediately after deployment:**

### 1. API Health

```bash
curl https://app.yourdomain.com/api/health
# Expected: {"status":"ok"}
```

### 2. Create Track Flow

```bash
# Create 30s track, no vocals
curl -X POST https://app.yourdomain.com/api/tracks \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "ambient electronic track",
    "duration_s": 30,
    "has_vocals": false
  }'

# Expected: {"track_id": 123, "job_id": 456, "credits_required": 5}

# Monitor job status
curl https://app.yourdomain.com/api/jobs/456
# Expected transitions: QUEUED → RENDERING → COMPLETE
```

### 3. Storage Verification

```bash
# Verify S3/MinIO has files
aws s3 ls s3://soundfoundry-prod/tracks/ --recursive | tail -5
aws s3 ls s3://soundfoundry-prod/covers/ --recursive | tail -5

# Or MinIO
mc ls minio/soundfoundry-prod/tracks/
mc ls minio/soundfoundry-prod/covers/
```

### 4. Share Page

```bash
# Visit share page
open https://app.yourdomain.com/share/123

# Verify:
# - Page loads
# - OG tags present (check source)
# - Cover visible
# - Audio player works
```

### 5. Cover Regeneration

```bash
# Regenerate cover (increment visual_version)
curl -X POST https://app.yourdomain.com/api/tracks/123/increment-visual-version \
  -H "Authorization: Bearer $TEST_TOKEN"

# Verify visual_version incremented
curl https://app.yourdomain.com/api/tracks/123 | jq .visual_version
# Expected: 2 (was 1)

# Verify cover mutates (compare before/after)
```

### 6. Cover Save

```bash
# Save cover (POST SVG)
curl -X POST https://app.yourdomain.com/api/tracks/123/cover \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "svg": "<?xml version=\"1.0\"?><svg>...</svg>",
    "dark": false
  }'

# Expected: {"track_id": 123, "cover_url": "https://..."}

# Verify S3 object exists
aws s3 ls s3://soundfoundry-prod/covers/123.svg
```

---

## Observability

### Alerts (Configure in Monitoring Tool)

**Critical Alerts:**

1. **5xx Rate > 1% for 5 min**
   ```
   rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
   ```

2. **Queue Latency p95 > 60s for 5 min**
   ```
   histogram_quantile(0.95, rate(job_duration_seconds_bucket[5m])) > 60
   ```

3. **Provider 401/403 > 3/min**
   ```
   rate(http_requests_total{endpoint=~"/api/tracks",status=~"401|403"}[1m]) > 3
   ```

4. **S3 Errors > 0**
   ```
   rate(s3_errors_total[5m]) > 0
   ```

### SLOs (Service Level Objectives)

**Track Generation:**
- p95 job duration ≤ 120s for ≤60s tracks
- p99 job duration ≤ 180s for ≤60s tracks

**Web Performance:**
- LCP p95 ≤ 2.5s on `/create`
- LCP p95 ≤ 2.5s on `/share`

**Reliability:**
- Uptime ≥ 99.9%
- Error rate < 0.1%

### Dashboards

**Key Metrics to Track:**

1. **Track Creation**
   - `track.created` events per hour
   - Average duration per track
   - Vocals vs instrumental ratio

2. **Cover Art**
   - `cover.saved` events per hour
   - Average SVG size
   - Visual version distribution

3. **Worker Health**
   - Worker running status
   - Queue depth
   - Retry count
   - Failed jobs

4. **Provider Performance**
   - FAL success rate
   - Replicate success rate
   - Fallback frequency
   - Average generation time per provider

5. **User Engagement**
   - D1/D7 return rate (users who generated ≥1 cover)
   - Avg tracks/user before first cover save
   - % tracks with saved cover
   - Macro panel engagement rate

---

## Feature Flags

**Flip order (enable one at a time):**

### 1. Style Seed System

```bash
export STYLE_SEED_ENABLED=true
# Verify: New users get style_seed on creation
```

### 2. Style Unlocks

```bash
export STYLE_UNLOCKS_ENABLED=true
# Verify: Unlocks computed on track creation
```

### 3. Style Series

```bash
export STYLE_SERIES_ENABLED=true
# Verify: Default series created for users
```

### 4. Music Provider

```bash
export MUSIC_PROVIDER=fal
# If 403 errors spike, auto-fallback to replicate
# Keep fallback enabled in code
```

**Monitor each flag for 24h before enabling next.**

---

## Rollback Procedures

### App Rollback

```bash
# Redeploy previous image tag
docker tag soundfoundry:previous-tag soundfoundry:latest
docker compose -f compose.prod.yml up -d

# Keep DB schema (migrations are forward-only)
# Old code will ignore new columns gracefully
```

### Config Rollback

```bash
# Revert music provider
export MUSIC_PROVIDER=replicate
docker compose -f compose.prod.yml restart api worker
```

### Kill Stuck Jobs

```bash
# Purge Celery queue
docker compose -f compose.prod.yml exec worker \
  celery -A app.workers.celery_app control purge

# Or via API (if exposed)
curl -X POST https://app.yourdomain.com/api/admin/queue/purge
```

### Disable Cover Save

```bash
# If S3 errors spike, disable cover save
export FEATURE_COVER_SAVE=false
docker compose -f compose.prod.yml restart api

# Users can still generate covers locally, just can't save
```

---

## Security & Policy

### Rate Limits

**Active Limits:**

- `/api/tracks/:id/cover`: 30 saves/min per user
- `/api/tracks` (create): Tune per plan (free: 5/min, pro: 20/min)
- `/api/style/series`: 10 creates/hour per user

**Verify:**

```bash
# Test rate limit
for i in {1..35}; do
  curl -X POST https://app.yourdomain.com/api/tracks/123/cover \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -d '{"svg":"<svg/>"}'
done
# Expected: 30 succeed, 5 return 429
```

### SVG Sanitization

- ✅ Max size: 1MB enforced
- ✅ XML validation: Must start with `<?xml` or `<svg`
- ✅ Text nodes sanitized (escaped entities)
- ✅ No external resources (no `<script>`, `<iframe>`)

### Content Policy

- ✅ Policy page linked before first generation
- ✅ User attestation required for reference uploads
- ✅ Content moderation on prompts (if enabled)

---

## Growth Hooks (Day-1)

### OG Meta Tags

**Share Pages:**

```tsx
// web/app/share/[id]/page.tsx
<meta property="og:image" content={coverPngUrl || defaultOgImage} />
<meta property="og:title" content={track.title} />
<meta property="og:description" content={track.prompt} />
```

**Generate PNG fallback from SVG:**

```bash
# Add endpoint: GET /api/tracks/:id/cover-png
# Converts SVG to PNG, caches in S3, returns signed URL
```

### Social Crops

**Download Options:**

- 1:1 (1024x1024) - Instagram, Twitter
- 9:16 (1080x1920) - Stories, TikTok
- 16:9 (1920x1080) - YouTube thumbnail

**Add to CoverArt component:**

```tsx
<Button onClick={() => downloadPNG(svg, "cover-1x1.png", 1024)}>
  Download 1:1
</Button>
<Button onClick={() => downloadPNG(svg, "cover-9x16.png", {width: 1080, height: 1920})}>
  Download 9:16
</Button>
```

### Series Progress Chip

**On Create Page:**

```tsx
// Show if user has ≥2 tracks in same series
{seriesProgress > 1 && (
  <Badge>Series: {seriesTitle} · {seriesProgress} tracks</Badge>
)}
```

### Webhooks (Optional)

**Email/Discord on Cover Save:**

```bash
# Add webhook endpoint
POST /api/webhooks/cover-saved
{
  "track_id": 123,
  "user_id": 456,
  "cover_url": "https://..."
}

# Configure in env
COVER_WEBHOOK_URL=https://hooks.discord.com/...
```

---

## Backup

### Database

**Nightly Snapshots:**

```bash
# Automated via managed Postgres or cron
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Verify backup
gunzip -c backup-*.sql.gz | head -100
```

### S3 Bucket

**Versioning Enabled:**

```bash
aws s3api put-bucket-versioning \
  --bucket soundfoundry-prod \
  --versioning-configuration Status=Enabled
```

**Lifecycle Rules:**

```bash
# Cold storage after 30d
aws s3api put-bucket-lifecycle-configuration \
  --bucket soundfoundry-prod \
  --lifecycle-configuration file://lifecycle.json
```

### Token Export

**Archive with Each Release:**

```bash
# Export tokens JSON
curl https://app.yourdomain.com/api/tokens > tokens-$(git rev-parse HEAD).json

# Store in release artifacts
```

---

## Owner Checks (Final)

### New Account Test

```bash
# Create brand-new account
# Verify:
# - user_style_seed created automatically
# - Default series created
# - Accent hue applied (check CSS variables)
```

### Theme Toggle

```bash
# Test dark/light toggle
# Verify:
# - Toggle works
# - AA contrast passes (use browser devtools)
# - Meta tags update
```

### Visual Regression

```bash
# Run Playwright tests
npm run test:e2e

# Verify snapshots:
# - create-dark-empty.png
# - create-light-empty.png
# - create-dark-enhanced.png
# - share-with-cover.png
# - macro-panel-collapsed.png
# - macro-panel-expanded.png
```

---

## Post-Deploy Checklist

**After DNS flip, run prod smoke tests again:**

- [ ] API health check passes
- [ ] Create track flow works end-to-end
- [ ] Cover generation works
- [ ] Cover save works
- [ ] Share page loads with OG tags
- [ ] Visual regression tests pass
- [ ] New account gets style seed + default series
- [ ] Theme toggle works
- [ ] Rate limits enforced
- [ ] Observability dashboards populated

**Start collecting KPIs:**

- [ ] D1/D7 return rate (users who generated ≥1 cover)
- [ ] Avg tracks/user before first cover save
- [ ] % tracks with saved cover
- [ ] Macro panel engagement rate
- [ ] Time-to-first-sound-identity (repeated motif detection)

---

## Emergency Contacts

**On-Call Engineer:** [name] - [phone]

**Escalation:** [manager] - [phone]

**Provider Support:**
- FAL: support@fal.ai
- Replicate: support@replicate.com

**Infrastructure:**
- Database: [DBA contact]
- S3/MinIO: [Storage admin]

---

## Quick Reference

**Health Check:**
```bash
curl https://app.yourdomain.com/api/health
```

**Check Queue Depth:**
```bash
docker compose exec worker celery -A app.workers.celery_app inspect active
```

**View Recent Logs:**
```bash
docker compose logs --tail=100 api worker
```

**Database Connection:**
```bash
psql $DATABASE_URL
```

**S3 Access:**
```bash
aws s3 ls s3://soundfoundry-prod/ --recursive | tail -20
```

---

**🚀 Ready to go live!**

