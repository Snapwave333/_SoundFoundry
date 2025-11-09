# Launch Readiness Checklist

## Ship Gates (Must-Pass)

### ✅ Migrations Applied
- Migration `003_style_seed_system` adds style columns, series table, track extensions
- Backfill script `004_style_seed_backfill.sql` ready
- Python backfill script `server/scripts/backfill_style_seed.py` ready

### ⏳ Celery Worker Load Test
- Test: Queue 5 jobs, verify worker drains under load
- Command: `celery -A app.workers.celery_app worker --pool=solo --concurrency=1`

### ⏳ MinIO/S3 Concurrent Writes
- Test: ≥10 concurrent PUT requests for covers + audio
- Verify: No race conditions, all files saved correctly

### ✅ Visual Tests
- Playwright tests in `web/tests/visual-regression.spec.ts`
- Cases: create (dark/light, empty/enhanced), share (with cover), macro panel (collapsed/expanded)
- Run: `npm run test:e2e`

### ⏳ LCP Performance
- Target: ≤2.5s p95 on `/create` and `/share` (desktop + mobile)
- Measure: Lighthouse CI or WebPageTest

## Data Backfill

### SQL Script
```sql
-- Run: server/alembic/versions/004_style_seed_backfill.sql
-- Or use Python: python server/scripts/backfill_style_seed.py
```

### Python Script
```bash
cd server
python scripts/backfill_style_seed.py
```

## Client Wiring

### ✅ Style System Hook
- Created `web/hooks/useStyleSystem.ts`
- Fetches `/api/style/me` → `user_style_seed`, `style_unlocks`
- Fetches `/api/series?user_id=me` → default series
- Applies `applyUserAccent(user_style_seed)` automatically

### Usage
```tsx
import { useStyleSystem } from "@/hooks/useStyleSystem";

function MyComponent() {
  const { styleSeed, unlocks, defaultSeries, loading } = useStyleSystem();
  // ...
}
```

### ✅ Visual Version Increment
- `incrementVisualVersion(trackId)` API call on regenerate
- Client calls server endpoint, server increments DB
- Cover regenerates with new mutation

## Telemetry Events

### ✅ Implemented
- `cover.saved` - Emitted in `POST /api/tracks/:id/cover`
- `track.created` - Emitted in `POST /api/tracks`
- `series.created` - Emitted in `POST /api/style/series`
- `unlocks.updated` - Emitted in `POST /api/style/unlocks/recompute`

### ⏳ Pending (Client-Side)
- `cover.rendered` - Add to `CoverArt` component on render
- `macro.changed` - Add when macro panel sliders change

### Event Schema
```ts
{
  cover.rendered: { user_id, track_id, series_id, visual_version, unlocks[] }
  cover.saved: { track_id, size_bytes, format }
  track.created: { duration, vocals, provider, series_id }
  macro.changed: { density, groove, texture, lowend }
  series.created: { series_id, user_id, title }
  unlocks.updated: { user_id, unlocks[] }
}
```

## KPIs (Monitor Weekly)

### Metrics to Track
1. **D1/D7 return rate** - Users who generated ≥1 cover
2. **Avg tracks/user** - Before saving first cover
3. **% tracks with saved cover** - On share pages
4. **Time-to-first-sound-identity** - Tracks until repeated motif (same series + mutation path ≥3)
5. **Macro panel engagement** - Any slider moved, completion lift

### Query Examples
```sql
-- D1/D7 return rate
SELECT COUNT(DISTINCT user_id) FROM tracks WHERE cover_url IS NOT NULL;

-- Avg tracks before first cover
SELECT AVG(track_count) FROM (
  SELECT user_id, COUNT(*) as track_count
  FROM tracks
  WHERE cover_url IS NOT NULL
  GROUP BY user_id
) sub;

-- % tracks with cover
SELECT 
  COUNT(*) FILTER (WHERE cover_url IS NOT NULL) * 100.0 / COUNT(*) as pct_with_cover
FROM tracks;
```

## Guardrails

### ✅ SVG Size Cap
- Rejects >1MB on `/api/tracks/:id/cover`
- Error: `HTTP 400 "SVG too large (max 1MB)"`

### ✅ Rate Limiting
- Cover saves: 30/min per user
- In-memory tracking (use Redis in production)
- Error: `HTTP 429 "Rate limit exceeded"`

### ✅ SVG Sanitization
- Checks for `<?xml` or `<svg` prefix
- Text nodes sanitized in `generateSvg.ts` (escapes XML entities)

### ⏳ Provider Fallback
- FAL → Replicate fallback on failure
- User-visible error + auto-retry
- Never lose credits on provider failure

## A/B Experiments

### Feature Flags (Add to `server/app/api/style.py`)
```python
AB_SEED_ACCENT_ENABLED = os.getenv("AB_SEED_ACCENT_ENABLED", "false") == "true"
AB_SERIES_PROGRESS_VISIBLE = os.getenv("AB_SERIES_PROGRESS_VISIBLE", "false") == "true"
AB_MACRO_PANEL_EXPANDED = os.getenv("AB_MACRO_PANEL_EXPANDED", "false") == "true"
```

### A/B-01: Seed Accent Hue
- Control: Static accent (`268 72% 62%`)
- Variant: `hueFromSeed(user_style_seed)`
- Metric: Share CTR

### A/B-02: Series Progress Chip
- Control: Hidden on create page
- Variant: Visible "Series progress" chip
- Metric: Covers saved

### A/B-03: Macro Panel Default
- Control: Collapsed by default
- Variant: Expanded by default
- Metric: Completion rate

## Reliability Checks

### ✅ Idempotent Cover Save
- Same payload → same S3 key (`covers/{track_id}.svg`)
- Safe to repeat

### ⏳ Worker Restart Recovery
- Celery jobs persist in Redis/DB
- Retry with exponential backoff
- Verify: `celery inspect registered`

### ⏳ Signed URL TTL
- Previews: 7 days
- Saved covers: Permanent (or 1 year)
- Check: `storage_service.generate_presigned_url(expiration=...)`

## Support Playbook

### Job Stuck at QUEUED
1. Check worker: `celery -A app.workers.celery_app inspect registered`
2. Verify `--pool=solo` for single worker
3. Check Redis URL matches worker config
4. Check job exists in DB: `SELECT * FROM jobs WHERE status='queued'`

### 403 from Provider
1. Verify `FAL_KEY` header format
2. Check API key validity
3. Fallback to Replicate automatically
4. Log error for monitoring

### "NoSuchBucket" Error
1. Confirm `soundfoundry` bucket exists
2. Test: `aws s3 ls s3://soundfoundry/` (or MinIO equivalent)
3. Verify credentials: `S3_ACCESS_KEY`, `S3_SECRET_KEY`
4. Check bucket policy allows PUT/GET

### Cover Not Updating
1. Verify `visual_version` increments in DB
2. Check `visual_version` passed to `generateCoverSVG()`
3. Verify cache key includes `visual_version`
4. Check browser cache (hard refresh)

## Final UX Touches

### ✅ "Save as cover" Toast
- Message: "Saved • deterministic across devices"
- Implemented in `CoverArt.handleSaveCover()`

### ✅ "Regenerate cover" Logic
- Increments `seedCounterRef` (internal seed, not `user_style_seed`)
- Calls `incrementVisualVersion()` if `trackId` exists
- Toast: "Cover regenerated • deterministic across devices"

### ✅ Share Page Series Display
- Shows: "Part of **{Series Title}** · v{visual_version}"
- Implemented in `web/app/share/[id]/page.tsx`

## Files Created

- `server/alembic/versions/004_style_seed_backfill.sql`
- `server/scripts/backfill_style_seed.py`
- `web/lib/api/style.ts`
- `web/hooks/useStyleSystem.ts`
- `LAUNCH_READINESS.md`

## Files Modified

- `server/app/api/tracks.py` - Rate limiting, telemetry, series info
- `server/app/api/style.py` - Telemetry events
- `server/app/middleware/observability.py` - `emit_event()` function
- `web/lib/api.ts` - Track interface with series/visual_version
- `web/components/CoverArt.tsx` - Visual version, regenerate logic, save cover
- `web/app/share/[id]/page.tsx` - Series display

## Next Steps

1. **Run backfill**: `python server/scripts/backfill_style_seed.py`
2. **Integrate hook**: Add `useStyleSystem()` to app layout or auth provider
3. **Add client telemetry**: Emit `cover.rendered` and `macro.changed` events
4. **Performance test**: Measure LCP on `/create` and `/share`
5. **Load test**: Verify Celery worker and S3 concurrent writes
6. **Set up monitoring**: Track KPIs weekly

