# SoundFoundry — Craft Your Sound

**AI Music Generator** — Generate full tracks from text prompts. Add lyrics, guide with a reference, and export when ready.

## Overview

SoundFoundry is a production-ready AI music generation platform that transforms text descriptions into professional-quality music tracks. Built with modern web technologies and designed for scalability, it offers a fair free tier trial and transparent pricing for extended use.

### Features

- **Text-to-Music Generation**: Create full tracks from natural language prompts
- **Optional Vocals**: Add lyrics for AI-generated vocal tracks
- **Reference Audio**: Upload reference tracks to guide style and mood (with automatic BPM/key analysis)
- **Multi-Genre Presets**: Cinematic, Electronic, Pop, Ambient, Hip-Hop, Rock, World
- **Adjustable Parameters**: Duration (15-240s), style strength, tempo, key, seed
- **Style System**: Visual series with unique palettes and geometry per user
- **Real-Time Progress**: Track generation jobs with live updates (QUEUED → RENDERING → MASTERING → COMPLETE)
- **Public Gallery**: Share tracks publicly with shareable links
- **Credit System**: Fair pricing model with PPP-adjusted pricing and solidarity discounts
- **Free Mode**: Generous free tier with daily limits
- **Cover Art Generation**: Automatic visual cover generation for tracks
- **Stem Export**: Download individual stems (when available)
- **Visual Versioning**: Regenerate cover art with different visual styles

## Quick Install (Development)

### Prerequisites

- **Node.js 20+** (for frontend)
- **Python 3.11+** (for backend)
- **Docker Desktop** (for PostgreSQL, Redis, MinIO)

### Step 1: Start Infrastructure

```powershell
cd infra
docker compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on ports 9000 (API) and 9001 (Console)

### Step 2: Backend Setup

```powershell
cd server
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Step 3: Celery Worker

```powershell
cd server
.\venv\Scripts\Activate.ps1
celery -A app.celery_app worker --loglevel=info
```

### Step 4: Frontend Setup

```powershell
cd web
npm install
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Production Build & Deployment

### Build Frontend

```powershell
cd web
npm run build
npm run start
```

### Docker Deployment

```powershell
cd web
docker build -t soundfoundry-web .
docker run -p 3000:3000 soundfoundry-web
```

### Environment Variables

**Frontend** (`web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=SoundFoundry
NEXT_PUBLIC_USE_MSW=false
```

**Backend** (`server/.env`):
```env
# API Keys
FAL_API_KEY=your_fal_api_key
REPLICATE_API_TOKEN=your_replicate_token

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/soundfoundry

# Redis
REDIS_URL=redis://localhost:6379/0

# Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=soundfoundry

# Pricing (optional - defaults provided)
MODEL_COST_PER_MIN_USD=0.15
INFRA_COST_PER_MIN_USD=0.05
OVERHEAD_PER_MIN_USD=0.02
MARGIN_CAP=0.12

# Stripe (for production)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS (for production)
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=development
```

See `docs/DEPLOYMENT.md` for detailed production deployment guides.

## Credit & Pricing Model

SoundFoundry operates on a **fair, cost-anchored pricing model** with **PPP-adjusted pricing** and **solidarity discounts**:

### Free Mode
- **Generous Trial**: 400 credits on signup
- **Daily Limits**: Configurable daily track limits
- **Duration Limits**: Max 60 seconds per track (free tier)

### Credit System
- **1 Credit = 30 seconds** of generated audio
- **Credit Packs**: 300, 700, or 2000 credits available for purchase
- **PPP-Adjusted Pricing**: Automatic price adjustment based on purchasing power parity (HIGH, UMID, LMID, LOW bands)
- **Solidarity Discount**: 15% discount for users who opt into solidarity pricing
- **Transparent Pricing**: All costs (model, infrastructure, overhead) are factored into pricing with capped margins

### Pricing Formula
```
Price = (Base Cost Per Minute / 2) × (1 + Margin Cap) × PPP Multiplier × Solidarity Multiplier
```

See `server/app/services/pricing_service.py` for detailed pricing logic.

## Architecture

SoundFoundry uses a microservices architecture:

- **Frontend**: Next.js 16 with React 19, React Query, Zustand
- **Backend**: FastAPI REST API with Celery for async job processing
- **Queue**: Redis-backed Celery workers
- **Storage**: MinIO/S3 for audio files and cover art
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Payments**: Stripe integration for credit purchases
- **Observability**: Prometheus metrics, Sentry error tracking, OpenTelemetry

### API Endpoints

**Tracks** (`/api/tracks`):
- `GET /cost-preview` - Preview credit cost for duration
- `POST /` - Create new track generation job
- `GET /{track_id}` - Get track details
- `POST /{track_id}/increment-visual-version` - Regenerate cover art
- `POST /{track_id}/cover` - Upload custom cover art
- `POST /{track_id}/refund-quality` - Request refund for quality issues
- `GET /{track_id}/stream` - Stream audio file
- `POST /{track_id}/publish` - Toggle public/private status

**Jobs** (`/api/jobs`):
- `GET /{job_id}` - Get job status and progress
- `GET /{job_id}/logs` - Get job execution logs

**Credits** (`/api/credits`):
- `GET /` - Get user credit balance and pricing breakdown
- `POST /purchase` - Purchase credit pack
- `POST /update-ppp` - Update PPP band
- `POST /toggle-solidarity` - Toggle solidarity pricing

**Style System** (`/api/style`):
- `GET /me` - Get user style seed and unlocks
- `GET /unlocks` - Get available style unlocks
- `POST /unlocks/recompute` - Recompute unlocks based on tracks
- `GET /series` - List user's series
- `POST /series` - Create new series
- `GET /series/{series_id}` - Get series details
- `PATCH /series/{series_id}` - Update series
- `GET /health` - Style system health check

**Analysis** (`/api/analyze`):
- `POST /reference` - Analyze reference audio (BPM, key, energy, loudness)

**Stripe** (`/api/stripe`):
- `POST /webhook` - Stripe webhook handler for payment events

**Health** (`/api`):
- `GET /health` - API health check
- `GET /health/providers` - Provider availability check

See `docs/system_architecture.md` for detailed architecture documentation.

## Branding Assets

Brand assets are located in `/assets/branding`:

- `logo.svg` - Primary logomark
- `logo_wordmark.svg` - Wordmark variant
- `icon_512.png` - App icon (512x512)
- `icon_256.png` - App icon (256x256)
- `logo_dark.svg` - Dark mode variant

For full brand guidelines and usage, see `/assets/branding/brand_guide.md`.

## Project Structure

```
/
├── web/                    # Next.js 16 frontend
│   ├── app/               # App Router pages
│   │   ├── (app)/        # Authenticated routes (create, library, settings)
│   │   ├── (marketing)/  # Public routes (landing)
│   │   └── api/          # Next.js API routes (auth, tokens)
│   ├── components/        # React components (UI, AudioPlayer, etc.)
│   ├── lib/               # Utilities, API clients, hooks
│   ├── hooks/             # Custom React hooks
│   └── styles/            # Global CSS and Tailwind config
├── server/                 # FastAPI backend
│   ├── app/
│   │   ├── api/          # API route handlers
│   │   ├── models/       # SQLAlchemy models (Track, User, Job, Series, etc.)
│   │   ├── services/     # Business logic (pricing, credits, storage, etc.)
│   │   ├── workers/      # Celery tasks (generate_music)
│   │   ├── middleware/   # Rate limiting, observability
│   │   └── utils/        # Utilities (style_seed, etc.)
│   ├── alembic/           # Database migrations
│   └── requirements.txt   # Python dependencies
├── assets/                 # Brand assets
│   └── branding/         # Logos, icons, brand guidelines
├── docs/                   # Documentation
│   ├── system_architecture.md
│   └── DEPLOYMENT.md
├── scripts/                # Automation scripts
│   ├── prod-smoke-test.sh
│   └── verify-deployment.sh
├── infra/                  # Docker Compose configs
│   └── docker-compose.yml  # Local development infrastructure
└── tests/                  # Test suites
    ├── unit/              # Unit tests
    └── e2e/               # End-to-end tests (Playwright)
```

## License

MIT License — see LICENSE file for details.

## Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## Support

For issues and questions, please open an issue on GitHub: https://github.com/Snapwave333/_SoundFoundry
