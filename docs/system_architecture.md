# System Architecture

## Overview

SoundFoundry is a full-stack AI music generation platform built with a microservices architecture. The system processes user requests asynchronously through a job queue, generates music using external AI providers, and stores results in object storage.

## High-Level Component Map

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────────┐
│   FastAPI       │
│   (Port 8000)   │
│  - Tracks API   │
│  - Jobs API     │
│  - Credits API  │
│  - Style API    │
│  - Analyze API  │
│  - Stripe Webhook│
│  - Health       │
└──────┬──────────┘
       │
       ├──► PostgreSQL (Port 5432)
       │    - Users, Tracks, Jobs, Credits
       │    - Series, Files, CreditLedger
       │
       ├──► Redis (Port 6379)
       │    - Job Queue (Celery)
       │    - Cache
       │
       ├──► Stripe API
       │    - Payment processing
       │    - Webhook events
       │
       └──► Celery Worker
            │
            ├──► FAL.ai (MiniMax Music v2)
            ├──► Replicate (Fallback)
            │
            └──► MinIO/S3 (Port 9000)
                 - Audio files (MP3/WAV)
                 - Stems (ZIP)
                 - Cover art (images)
                 - Reference tracks
```

## API → Worker → Storage Flow

### 1. Track Creation Request

**Frontend** (`web/app/(app)/create/page.tsx`):
- User submits prompt, duration, genre, key, lyrics (optional), reference file (optional)
- Calls `useCreateTrack()` hook → `POST /api/tracks`

**Backend** (`server/app/api/tracks.py`):
- Validates request (content policy, prompt length, duration limits)
- Checks credit quota (includes free mode checks)
- Creates `Track` record in PostgreSQL (status: "QUEUED")
- Creates `Job` record linked to track
- Handles series assignment (default or specified)
- Enqueues Celery task: `generate_music.delay(job_id)`
- Returns `{ track_id, job_id, credits_required }`

### 2. Job Processing

**Celery Worker** (`server/app/workers/generate_music.py`):
- Polls Redis queue for new jobs
- Updates job status: "QUEUED" → "RENDERING"
- Selects model provider (FAL.ai primary, Replicate fallback)
- Calls external API with prompt + parameters + reference (if provided)
- Streams audio response to MinIO/S3 storage
- Updates track record with `file_url`, `preview_url`, `stems_zip_url`
- Updates job status: "RENDERING" → "MASTERING" → "COMPLETE"
- Generates cover art (visual version 1)
- Deducts credits from user account via CreditService
- Records transaction in CreditLedger

**Storage** (`server/app/services/storage.py`):
- Uploads generated audio to MinIO/S3 bucket
- Uploads stems ZIP files (when available)
- Uploads cover art images
- Returns public/private URLs for streaming/download
- Handles reference file uploads for analysis
- Supports streaming via signed URLs

### 3. Frontend Polling

**React Query** (`web/lib/api/hooks.ts`):
- `useJob(jobId)` polls `GET /api/jobs/:id` every 2 seconds
- Updates UI with progress percentage, ETA, status
- When status = "COMPLETE", fetches track details via `useTrack(trackId)`
- Displays audio player with preview URL and cover art
- Supports visual version regeneration

## Frontend Data-Fetch Strategy

### React Query Hooks

- **`useCreateTrack()`**: Mutation for track creation
- **`useJob(jobId)`**: Query with auto-refetch interval (2s) until complete
- **`useTrack(trackId)`**: Query for track metadata and URLs
- **`useTracks()`**: Query for user's library (list view)
- **`useCredits()`**: Query with 30s refetch interval
- **`useAnalyzeReference()`**: Mutation for reference audio analysis
- **`usePublishTrack()`**: Mutation for public/private toggle
- **`useSeries()`**: Query for user's style series
- **`useStyleUnlocks()`**: Query for available style unlocks
- **`useCostPreview()`**: Query for credit cost preview

### API Client

**`web/lib/api/client.ts`**:
- Centralized fetch wrapper with timeout (30s)
- Error handling with user-friendly messages
- Base URL from `NEXT_PUBLIC_API_URL` env var
- Supports JSON and blob responses (for audio streaming)

### MSW Mocking (Development)

**`web/mocks/handlers.ts`**:
- Mock API responses when `NEXT_PUBLIC_USE_MSW=true`
- Simulates job progression, track completion
- Enables frontend development without backend

## Performance Constraints & Fix Strategies

### 1. Job Queue Bottleneck

**Constraint**: Single Celery worker processes jobs sequentially.

**Fix Strategy**:
- Scale workers horizontally: `celery -A app.celery_app worker --concurrency=4`
- Use Redis Cluster for high-throughput queues
- Implement job prioritization (paid users first)

### 2. External API Rate Limits

**Constraint**: FAL.ai and Replicate have rate limits per API key.

**Fix Strategy**:
- Rotate API keys across multiple workers
- Implement exponential backoff retry logic
- Queue jobs during rate limit windows
- Use fallback providers automatically

### 3. Large File Storage

**Constraint**: Generated audio files (MP3/WAV) can be 5-50MB each.

**Fix Strategy**:
- Use Git LFS for version control (`.gitattributes` configured)
- Stream files directly from S3/MinIO (no proxy through API)
- Implement CDN caching for public tracks
- Compress audio before storage (MP3 vs WAV)

### 4. Frontend Bundle Size

**Constraint**: Next.js bundle includes all components.

**Fix Strategy**:
- Code splitting by route (`app/(marketing)/`, `app/(app)/`)
- Lazy load audio player component
- Tree-shake unused Tailwind utilities
- Use dynamic imports for heavy libraries

### 5. Database Query Performance

**Constraint**: Library page fetches all user tracks.

**Fix Strategy**:
- Implement pagination (`?page=1&limit=20`)
- Add database indexes on `user_id`, `created_at`
- Cache frequently accessed tracks in Redis
- Use database connection pooling

### 6. Real-Time Updates

**Constraint**: Frontend polls job status every 2 seconds.

**Fix Strategy**:
- Implement WebSocket/SSE for push updates
- Reduce polling frequency after initial 10 seconds
- Use React Query's `refetchInterval` with conditional logic
- Consider Server-Sent Events (SSE) for job progress

## Technology Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19** (Server/Client Components)
- **TypeScript** (Type safety)
- **Tailwind CSS v4** (Styling)
- **React Query v5** (Data fetching)
- **Zustand** (Client state)
- **Radix UI** (Component primitives)
- **NextAuth** (Authentication)
- **Playwright** (E2E testing)

### Backend
- **FastAPI 0.115** (Python REST API)
- **Celery 5.4** (Async task queue)
- **PostgreSQL** (Primary database)
- **Redis 5.2** (Queue broker + cache)
- **SQLAlchemy 2.0** (ORM)
- **Alembic 1.14** (Migrations)
- **Stripe 5.5** (Payment processing)
- **Librosa** (Audio analysis)
- **FAL Client** (AI model provider)
- **Replicate** (Fallback AI provider)

### Infrastructure
- **MinIO/S3** (Object storage)
- **Docker Compose** (Local development)
- **Prometheus** (Metrics)
- **Sentry** (Error tracking)
- **OpenTelemetry** (Distributed tracing)

## Data Models

### Track
- `id`, `user_id`, `title`, `prompt`, `lyrics`, `has_vocals`
- `duration_s`, `bpm`, `key`, `style_strength`, `seed`
- `status` (QUEUED/RENDERING/MASTERING/COMPLETE/FAILED)
- `provider` (fal/replicate)
- `file_url`, `preview_url`, `stems_zip_url`, `cover_url`
- `reference_file_id`, `series_id`
- `visual_version`, `public`, `error_message`
- `credits_required`, `created_at`, `updated_at`

### Job
- `id`, `track_id`, `status` (QUEUED/RENDERING/COMPLETE/FAILED)
- `progress` (0-100), `eta` (seconds), `error` (message)
- `created_at`, `updated_at`

### User
- `id`, `email`, `hashed_password`
- `plan` (FREE/PRO/ENTERPRISE)
- `credits`, `ppp_band` (HIGH/UMID/LMID/LOW)
- `solidarity_opt_in`, `trial_expires_at`
- `user_style_seed`, `style_unlocks` (JSON array)
- `is_active`, `is_verified`
- `created_at`, `updated_at`

### Series
- `id`, `user_id`, `title`, `slug` (unique)
- `palette` (JSON: primary_hue, secondary_hue, luminance_base, saturation)
- `geometry` (JSON: stroke_width_base, rotation_base, gradient_angle, shape_count)
- `created_at`

### File
- `id`, `user_id`, `kind` (REFERENCE/COVER/OTHER)
- `original_filename`, `file_url`, `file_size`
- `metadata` (JSON: BPM, key, energy, loudness for audio)
- `created_at`

### CreditLedger
- `id`, `user_id`, `amount` (positive for credit, negative for deduction)
- `reason` (PURCHASE/DEDUCTION/REFUND/TRIAL/ADJUSTMENT)
- `pricing_snapshot` (JSON: stores pricing details for audit)
- `created_at`

## Style System

The Style System provides visual consistency across a user's tracks through **Series** and **Style Seeds**.

### Style Seed
- Each user has a unique `user_style_seed` (BigInteger)
- Generated deterministically from user ID or randomly on first use
- Used to generate consistent visual palettes and geometry

### Series
- Groups tracks with shared visual style
- Each series has:
  - **Palette**: Base hues, luminance, saturation (derived from style seed)
  - **Geometry**: Stroke width, rotation, gradient angles (derived from style seed)
- Default series created automatically for each user
- Users can create additional series with custom palettes/geometry

### Style Unlocks
- Users unlock new visual styles based on track count
- Unlocks stored as JSON array in `User.style_unlocks`
- Computed dynamically based on total tracks created
- Can be recomputed via API endpoint

### Visual Versioning
- Each track has a `visual_version` (starts at 1)
- Users can regenerate cover art with different visual styles
- Incrementing `visual_version` creates new cover art while preserving audio

## Credit & Pricing System

### Credit Calculation
- **1 Credit = 30 seconds** of generated audio
- Credits required = `ceil(duration_s / 30)`
- Example: 60s track = 2 credits, 90s track = 3 credits

### Pricing Model
Pricing is **cost-anchored** with transparent margins:

```
Base Cost = Model Cost + Infrastructure Cost + Overhead
Price Per Credit = (Base Cost Per Minute / 2) × (1 + Margin Cap) × PPP Multiplier × Solidarity Multiplier
```

**Cost Components** (configurable via env vars):
- `MODEL_COST_PER_MIN_USD`: Cost of AI model inference (default: 0.15)
- `INFRA_COST_PER_MIN_USD`: Infrastructure costs (default: 0.05)
- `OVERHEAD_PER_MIN_USD`: Overhead costs (default: 0.02)
- `MARGIN_CAP`: Maximum margin percentage (default: 0.12 = 12%)

**PPP Adjustment**:
- HIGH: 1.00x (no adjustment)
- UMID: 0.90x (10% discount)
- LMID: 0.80x (20% discount)
- LOW: 0.70x (30% discount)

**Solidarity Discount**:
- 0.85x multiplier (15% discount) when opted in

### Credit Packs
Available packs: 300, 700, 2000 credits
- Prices calculated dynamically based on user's PPP band and solidarity status
- Pricing snapshot stored in CreditLedger for audit trail

### Free Mode
- Generous trial credits (400 credits on signup)
- Daily track limits (configurable)
- Duration limits (60s max for free tier)
- Managed via `FreeModeService`

### Credit Transactions
All credit changes recorded in `CreditLedger`:
- **PURCHASE**: Credit pack purchase via Stripe
- **DEDUCTION**: Track generation cost
- **REFUND**: Quality issue refunds
- **TRIAL**: Initial trial credits
- **ADJUSTMENT**: Manual adjustments

## Services

### CreditService
- Manages credit balance and quota checks
- Handles credit deductions and refunds
- Records transactions in CreditLedger
- Integrates with FreeModeService for quota checks

### PricingService
- Calculates cost-anchored pricing
- Applies PPP and solidarity adjustments
- Generates pricing snapshots for audit
- Provides pricing breakdowns for UI display

### FreeModeService
- Manages free tier limits
- Checks daily quotas
- Enforces duration limits
- Provides free mode status information

### ContentPolicyService
- Validates prompts and lyrics
- Filters inappropriate content
- Returns user-friendly error messages

### StorageService
- Handles S3/MinIO uploads
- Generates signed URLs for streaming
- Manages file metadata
- Supports audio, images, and ZIP files

### AudioAnalyzerService
- Analyzes reference audio files
- Extracts BPM, key, energy, loudness
- Uses Librosa for audio processing

### ModelProviderService
- Manages FAL.ai and Replicate providers
- Handles fallback logic
- Manages API key rotation
- Provides health checks

