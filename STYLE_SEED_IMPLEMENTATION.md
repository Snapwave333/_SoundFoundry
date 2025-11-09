# Style-Seed System Implementation

## Status: Core Implementation Complete ✅

### Completed Components

#### 1. Database Migration ✅
- **File**: `server/alembic/versions/003_style_seed_system.py`
- Added `user_style_seed` (BIGINT) and `style_unlocks` (JSONB) to `users` table
- Created `series` table with palette/geometry JSONB columns
- Added `series_id`, `visual_version`, and `cover_url` to `tracks` table
- All foreign keys and indexes properly configured

#### 2. Models ✅
- **User Model**: Extended with `user_style_seed` and `style_unlocks` columns
- **Series Model**: New model at `server/app/models/series.py`
- **Track Model**: Extended with `series_id`, `visual_version`, `cover_url`

#### 3. Style Seed Utilities ✅
- **File**: `server/app/utils/style_seed.py`
- `derive_style_seed()`: Deterministic hash from email + created_at
- `get_or_create_style_seed()`: Get or derive user seed
- `compute_style_unlocks()`: Calculate unlocks from milestones
- `update_user_unlocks()`: Set-union updates to user unlocks

**Milestones Implemented**:
- `FIRST_THREE_TRACKS` → `silk_lines`
- `VOCAL_TRACK_CREATED` → `soft_glow`
- `NIGHT_OWL` (22:00-05:00) → `midnight_bloom`

#### 4. API Endpoints ✅
- **File**: `server/app/api/style.py`
- `GET /api/style/me` - Get user style seed and unlocks
- `GET /api/style/unlocks` - Get unlocks list
- `POST /api/style/unlocks/recompute` - Recompute unlocks
- `POST /api/style/series` - Create series
- `GET /api/style/series` - List user's series
- `GET /api/style/series/{id}` - Get series details
- `PATCH /api/style/series/{id}` - Update series
- `GET /api/style/health` - Health check

- **File**: `server/app/api/tracks.py` (updated)
- `POST /api/tracks` - Now accepts `series_id`, auto-creates default series
- `POST /api/tracks/{id}/increment-visual-version` - Increment version
- `POST /api/tracks/{id}/cover` - Save cover SVG to S3

#### 5. Cover Generator Extension ✅
- **File**: `web/lib/cover/generateSvg.ts`
- Extended `CoverOptions` with:
  - `userStyleSeed?: number`
  - `series?: SeriesStyle`
  - `unlocks?: StyleUnlock[]`
  - `visualVersion?: number`

**Features Implemented**:
- **Base RNG**: `xor(hash(seed), userStyleSeed, hash(series.slug))`
- **Mutation Rules**: 1-3% deltas on hue, hue2, saturation, rotation, stroke width
- **Unlock Effects**:
  - `silk_lines`: Variable-width strokes
  - `soft_glow`: Outer glow filter on shapes
  - `midnight_bloom`: Darker luma bias + star speckles (opacity ≤ 0.12)
- **Series Support**: Uses palette/geometry from series if provided
- **Deterministic**: Same inputs → same output (hash-based cache key)

#### 6. Storage Service ✅
- **File**: `server/app/services/storage.py`
- Added `upload_file_content()` method for direct bytes upload
- Supports public/private files with presigned URLs

### Pending Components

#### 7. Client Integration ⏳
**Needed**:
- Fetch `/api/style/me` on app load
- Fetch `/api/style/series?user_id=me` for default series
- Pass `userStyleSeed`, `series`, `unlocks`, `visualVersion` to `generateCoverSVGCached()`
- Call `/api/tracks/{id}/increment-visual-version` on regenerate
- Call `/api/tracks/{id}/cover` on "Save as default cover"

**Files to Update**:
- `web/components/GenerationPanel.tsx` - Pass style params to cover generator
- `web/components/CoverArt.tsx` - Use style params, handle regenerate
- `web/lib/api.ts` - Add style API client methods

#### 8. Telemetry ⏳
**Needed**:
- Emit events: `cover.rendered`, `cover.saved`, `series.created`, `unlocks.updated`
- Include: `user_id`, `series_id`, `track_id`, `visual_version`
- Add to observability middleware or separate service

#### 9. Tests ⏳
**Needed**:
- Unit: `style_seed()` deterministic
- Unit: `generateCoverSVG()` stable under same inputs
- Unit: Mutation alters only small set of knobs within bounds
- API: Series CRUD happy path
- API: Unlock recompute idempotent
- E2E: Create 3 tracks → unlock `silk_lines` → verify client includes it

#### 10. Documentation ⏳
**Needed**:
- `STYLE_SEED.md`: Concept, inputs, determinism guarantees, mutation rules, unlock list
- `SERIES.md`: How series palettes/geometry are derived, example JSON
- Update README feature list

### Feature Flags

All features are enabled by default in `server/app/api/style.py`:
- `STYLE_SEED_ENABLED = True`
- `STYLE_UNLOCKS_ENABLED = True`
- `STYLE_SERIES_ENABLED = True`

### Data Backfill Script Needed

After deployment, run:
1. Assign seeds to existing users: `UPDATE users SET user_style_seed = derive_style_seed(email, created_at) WHERE user_style_seed IS NULL;`
2. Create Default Series per user
3. Set `visual_version=1` for existing tracks

### Next Steps

1. **Client Integration** (Priority 1)
   - Update `GenerationPanel.tsx` to fetch and pass style params
   - Update `CoverArt.tsx` to use style system
   - Add API client methods

2. **Telemetry** (Priority 2)
   - Add event emission to cover generation endpoints
   - Integrate with observability middleware

3. **Tests** (Priority 3)
   - Write unit tests for style utilities
   - Write API tests for series/unlocks
   - Write E2E test for unlock flow

4. **Documentation** (Priority 4)
   - Write `STYLE_SEED.md`
   - Write `SERIES.md`
   - Update README

### Acceptance Criteria Status

- ✅ New users get `user_style_seed` automatically; `/api/me` returns it
- ⏳ Creating a track with no series auto-uses Default Series (server done, client pending)
- ⏳ Cover renders deterministically (generator done, client integration pending)
- ⏳ Cover re-renders with small change on regenerate (generator done, client integration pending)
- ⏳ Unlocks appear after milestones (server done, client display pending)
- ⏳ Share page shows same cover for same inputs (generator done, client integration pending)
- ⏳ All tests pass (pending)
- ✅ No breaking API changes for non-cover flows

