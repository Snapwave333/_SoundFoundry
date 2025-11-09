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
│  - Auth         │
│  - Tracks API   │
│  - Jobs API     │
│  - Credits API  │
└──────┬──────────┘
       │
       ├──► PostgreSQL (Port 5432)
       │    - Users, Tracks, Jobs, Credits
       │
       ├──► Redis (Port 6379)
       │    - Job Queue (Celery)
       │    - Cache
       │
       └──► Celery Worker
            │
            ├──► FAL.ai (MiniMax Music v2)
            ├──► Replicate (Fallback)
            │
            └──► MinIO/S3 (Port 9000)
                 - Audio files (MP3/WAV)
                 - Reference tracks
```

## API → Worker → Storage Flow

### 1. Track Creation Request

**Frontend** (`web/app/(app)/create/page.tsx`):
- User submits prompt, duration, genre, key, lyrics (optional), reference file (optional)
- Calls `useCreateTrack()` hook → `POST /api/tracks`

**Backend** (`server/app/api/tracks.py`):
- Validates request (prompt length, duration limits, credit balance)
- Creates `Track` record in PostgreSQL (status: "QUEUED")
- Creates `Job` record linked to track
- Enqueues Celery task: `generate_music.delay(job_id)`
- Returns `{ track_id, job_id, credits_required }`

### 2. Job Processing

**Celery Worker** (`server/app/workers/generate_music.py`):
- Polls Redis queue for new jobs
- Updates job status: "QUEUED" → "RENDERING"
- Selects model provider (FAL.ai primary, Replicate fallback)
- Calls external API with prompt + parameters
- Streams audio response to MinIO/S3 storage
- Updates track record with `file_url`, `preview_url`
- Updates job status: "RENDERING" → "COMPLETE"
- Deducts credits from user account

**Storage** (`server/app/services/storage.py`):
- Uploads generated audio to MinIO/S3 bucket
- Returns public/private URLs for streaming/download
- Handles reference file uploads for analysis

### 3. Frontend Polling

**React Query** (`web/lib/api/hooks.ts`):
- `useJob(jobId)` polls `GET /api/jobs/:id` every 2 seconds
- Updates UI with progress percentage, ETA, status
- When status = "COMPLETE", fetches track details via `useTrack(trackId)`
- Displays audio player with preview URL

## Frontend Data-Fetch Strategy

### React Query Hooks

- **`useCreateTrack()`**: Mutation for track creation
- **`useJob(jobId)`**: Query with auto-refetch interval (2s) until complete
- **`useTrack(trackId)`**: Query for track metadata and URLs
- **`useTracks()`**: Query for user's library (list view)
- **`useCredits()`**: Query with 30s refetch interval
- **`useAnalyzeReference()`**: Mutation for reference audio analysis
- **`usePublishTrack()`**: Mutation for public/private toggle

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
- **Next.js 15** (App Router)
- **React 19** (Server/Client Components)
- **TypeScript** (Type safety)
- **Tailwind CSS v4** (Styling)
- **React Query** (Data fetching)
- **Zustand** (Client state)

### Backend
- **FastAPI** (Python REST API)
- **Celery** (Async task queue)
- **PostgreSQL** (Primary database)
- **Redis** (Queue broker + cache)
- **SQLAlchemy** (ORM)
- **Alembic** (Migrations)

### Infrastructure
- **MinIO/S3** (Object storage)
- **Docker Compose** (Local development)
- **GitHub Actions** (CI/CD)

## Data Models

### Track
- `id`, `user_id`, `prompt`, `lyrics`, `status`
- `duration`, `genre`, `key`, `style_strength`
- `file_url`, `preview_url`, `share_url`
- `credits_required`, `public`, `created_at`

### Job
- `id`, `track_id`, `status` (QUEUED/RENDERING/COMPLETE/FAILED)
- `progress` (0-100), `eta` (seconds), `error` (message)

### User
- `id`, `email`, `credits`, `plan` (free/pro/enterprise)

### Credit Ledger
- `id`, `user_id`, `amount`, `reason`, `created_at`
- Tracks all credit transactions (purchase, deduction, refund)

