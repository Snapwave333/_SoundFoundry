# SoundFoundry — Craft Your Sound

**AI Music Generator** — Generate full tracks from text prompts. Add lyrics, guide with a reference, and export when ready.

## Overview

SoundFoundry is a production-ready AI music generation platform that transforms text descriptions into professional-quality music tracks. Built with modern web technologies and designed for scalability, it offers a fair free tier trial and transparent pricing for extended use.

### Features

- **Text-to-Music Generation**: Create full tracks from natural language prompts
- **Optional Vocals**: Add lyrics for AI-generated vocal tracks
- **Reference Audio**: Upload reference tracks to guide style and mood
- **Multi-Genre Presets**: Cinematic, Electronic, Pop, Ambient, Hip-Hop, Rock, World
- **Adjustable Parameters**: Duration (15-240s), style strength, tempo, key
- **Real-Time Progress**: Track generation jobs with live updates
- **Public Gallery**: Share tracks publicly with shareable links
- **Credit System**: Fair pricing model with generous free tier

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
FAL_API_KEY=your_fal_api_key
REPLICATE_API_TOKEN=your_replicate_token
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/soundfoundry
REDIS_URL=redis://localhost:6379/0
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=soundfoundry
```

See `docs/DEPLOYMENT.md` for detailed production deployment guides.

## Credit & Pricing Model

SoundFoundry operates on a **fair market pricing model** with a **generous free tier trial**:

- **Free Tier**: 5 tracks/day, max 60 seconds per track
- **Pro Tier**: Unlimited tracks, up to 240 seconds, priority queue
- **Enterprise**: Custom limits, dedicated support, API access

Credits are deducted per track based on duration and complexity. Pricing is transparent and competitive with market rates, while offering more than fair free tier access for users to evaluate the platform.

See `server/app/services/pricing_service.py` for detailed pricing logic.

## Architecture

SoundFoundry uses a microservices architecture:

- **Frontend**: Next.js 15 with React Query for data fetching
- **Backend**: FastAPI REST API with Celery for async job processing
- **Queue**: Redis-backed Celery workers
- **Storage**: MinIO/S3 for audio files
- **Database**: PostgreSQL with SQLAlchemy ORM

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
├── web/                    # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   └── lib/               # Utilities, API clients
├── server/                 # FastAPI backend
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── models/       # SQLAlchemy models
│   │   ├── services/     # Business logic
│   │   └── workers/      # Celery tasks
│   └── alembic/           # DB migrations
├── assets/                 # Brand assets
│   └── branding/         # Logos, icons, guidelines
├── docs/                   # Documentation
│   └── system_architecture.md
├── scripts/                # Automation scripts
├── config/                 # Environment templates
└── infra/                  # Docker Compose configs
```

## License

MIT License — see LICENSE file for details.

## Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## Support

For issues and questions, please open an issue on GitHub: https://github.com/Snapwave333/_SoundFoundry
