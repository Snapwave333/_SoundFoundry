# SoundFoundry - AI Music Generator

A production-ready AI Music Generator web application with feature-parity to MiniMax's "Audio › Music" experience. Generate full tracks from text prompts with optional vocals, reference audio guidance, and multi-genre presets.

## Features

- **Text-to-Music Generation**: Create full tracks from text prompts
- **Optional Vocals**: Add lyrics for vocal generation
- **Reference Audio**: Upload reference tracks to guide style
- **Multi-Genre Presets**: Cinematic, Electronic, Pop, Ambient, Hip-Hop, Rock, World
- **Adjustable Parameters**: Duration (15-240s), style strength, tempo, key
- **Job Queue**: Real-time progress tracking for generation jobs
- **User Accounts**: Free tier with limits, paid tiers for extended features
- **Credit System**: Stripe integration for credit purchases
- **Public Gallery**: Share tracks publicly with shareable links
- **Audio Analysis**: Automatic BPM/key/energy detection for reference tracks

## Architecture

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for UI components
- **React Query** for data fetching
- **Zustand** for state management
- **NextAuth.js** for authentication

### Backend
- **FastAPI** (Python) for REST API
- **PostgreSQL** with SQLAlchemy ORM
- **Celery** + **Redis** for async job processing
- **MinIO/S3** for file storage
- **Alembic** for database migrations

### Model Providers
- **FAL.ai MiniMax Music v2** (primary)
- **Replicate MiniMax Music** (fallback)

## Branding

SoundFoundry uses the **Neo-Forge Glow** brand theme. Brand assets are located in:
- `/public/brand/soundfoundry/` - Logos, icons, and hero assets
- `/public/og/` - OpenGraph social preview images
- `/lib/theme/tokens.ts` - Brand color tokens and design tokens
- `/styles/globals.css` - Global theme styles

The brand colors are:
- **Forge Black** `#0D0D0F` - Background
- **Graphite Gray** `#24262A` - Surfaces
- **Steel White** `#F3F5F7` - Text
- **Forge Amber** `#FFB24D` - Primary accent
- **Resonance Blue** `#3A77FF` - Secondary accent

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL 16+ (or use Docker)
- Redis (or use Docker)

### Environment Variables

**Frontend (`.env` in `/web`):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
```

**Backend (`.env` in `/server`):**
```bash
# Model Providers
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

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Observability (optional)
SENTRY_DSN=your_sentry_dsn
ENVIRONMENT=development
```

### Local Development

1. **Start infrastructure services**:
```bash
cd infra
docker compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on ports 9000 (API) and 9001 (Console)

2. **Set up backend**:
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --port 8000

# In another terminal, start Celery worker
celery -A app.celery_app worker --loglevel=info
```

3. **Set up frontend**:
```bash
cd web
npm install
npm run dev
```

The app will be available at `http://localhost:3000`

### Docker Development

Run everything with Docker Compose:

```bash
cd infra
docker compose up
```

This starts all services including the API, Celery worker, and frontend (if configured).

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

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
├── infra/                  # Infrastructure
│   └── docker-compose.yml
└── docs/                   # Documentation
```

## Usage

### Creating a Track

1. Enter a prompt describing the music you want
2. Select a genre preset (optional)
3. Adjust duration (15-240s) and style strength
4. Optionally add lyrics if enabling vocals
5. Optionally upload a reference track
6. Click "Generate Music"

### Free Tier Limits

- Maximum duration: 60 seconds
- Daily limit: 5 tracks
- Upgrade to Pro for longer tracks and unlimited generation

## Testing

```bash
# Backend tests
cd server
pytest

# Frontend tests
cd web
npm test

# E2E tests
npm run test:e2e
```

## Production Deployment

See `docs/DEPLOYMENT.md` for production deployment guides including:
- AWS deployment with Terraform
- Fly.io deployment
- Environment configuration
- Database migrations
- Monitoring setup

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## Support

For issues and questions, please open an issue on GitHub.

