<div align="center">

![PromptBloom Banner](assets/branding/social-card_1200x630.png)

# PromptBloom

### Craft Your Sound

**AI Music Generator** — Generate full tracks from text prompts. Add lyrics, guide with a reference, and export when ready.

[![Deploy Status](https://img.shields.io/badge/Deploy-Live-brightgreen)](https://promptbloom.app)
[![Open App](https://img.shields.io/badge/Open%20App-promptbloom.app-blue)](https://promptbloom.app/app)
[![Production Status](https://img.shields.io/badge/Production-Verified-success)](https://promptbloom.app)
[![Verification](https://github.com/Snapwave333/_SoundFoundry/actions/workflows/verify-deployment.yml/badge.svg)](https://github.com/Snapwave333/_SoundFoundry/actions/workflows/verify-deployment.yml)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-Performance%3A%2090%2B-brightgreen)](https://promptbloom.app)
[![Uptime](https://img.shields.io/badge/Uptime-Check%20Status-blue)](https://promptbloom.app)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub last commit](https://img.shields.io/github/last-commit/Snapwave333/_SoundFoundry)](https://github.com/Snapwave333/_SoundFoundry)
[![GitHub issues](https://img.shields.io/github/issues/Snapwave333/_SoundFoundry)](https://github.com/Snapwave333/_SoundFoundry/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/Snapwave333/_SoundFoundry)](https://github.com/Snapwave333/_SoundFoundry/pulls)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[Live Site](https://promptbloom.app) • [Open App](https://promptbloom.app/app) • [Installation](#-quick-install) • [Usage](#-features) • [Demo](#-demo) • [Architecture](#-architecture) • [Roadmap](./docs/ROADMAP.md) • [Contributing](./docs/CONTRIBUTING.md) • [License](#-license)

</div>

---

## ✨ Features

- 🎵 **Text-to-Music Generation** - Create full tracks from natural language prompts
- 🎤 **Optional Vocals** - Add lyrics for AI-generated vocal tracks
- 🎧 **Reference Audio** - Upload reference tracks to guide style and mood (with automatic BPM/key analysis)
- 🎨 **Multi-Genre Presets** - Cinematic, Electronic, Pop, Ambient, Hip-Hop, Rock, World
- ⚙️ **Adjustable Parameters** - Duration (15-240s), style strength, tempo, key, seed
- 🎨 **Style System** - Visual series with unique palettes and geometry per user
- 📊 **Real-Time Progress** - Track generation jobs with live updates (QUEUED → RENDERING → MASTERING → COMPLETE)
- 🌐 **Public Gallery** - Share tracks publicly with shareable links
- 💳 **Credit System** - Fair pricing model with PPP-adjusted pricing and solidarity discounts
- 🆓 **Free Mode** - Generous free tier with daily limits
- 🖼️ **Cover Art Generation** - Automatic visual cover generation for tracks
- 📦 **Stem Export** - Download individual stems (when available)
- 🔄 **Visual Versioning** - Regenerate cover art with different visual styles

## 🎬 Demo

<div align="center">

![SoundFoundry Interface](assets/branding/social-card_1200x630.png)

*Screenshots and GIFs coming soon!*

</div>

## 🚀 Quick Install

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

### Environment Variables

**Frontend** (`web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=SoundFoundry
NEXT_PUBLIC_USE_MSW=false
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
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
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=development
```

See `config/.env.local.example` and `server/.env.example` for complete configuration options.

## 🏗️ Architecture

<div align="center">

![System Architecture](docs/system_architecture.png)

*[View detailed architecture documentation](./docs/system_architecture.md)*

</div>

SoundFoundry uses a **microservices architecture**:

- **Frontend**: Next.js 16 with React 19, React Query, Zustand
- **Backend**: FastAPI REST API with Celery for async job processing
- **Queue**: Redis-backed Celery workers
- **Storage**: MinIO/S3 for audio files and cover art
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Payments**: Stripe integration for credit purchases
- **Observability**: Prometheus metrics, Sentry error tracking, OpenTelemetry

### Request Flow

```
User → Next.js Frontend → FastAPI → Celery Worker → AI Provider (FAL.ai/Replicate)
                                                      ↓
                                              MinIO/S3 Storage
                                                      ↓
                                              PostgreSQL Database
```

## 🛠️ Tech Stack

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-5.2-DC382D?style=for-the-badge&logo=redis)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)

</div>

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first styling
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **Radix UI** - Accessible component primitives

### Backend
- **FastAPI** - Modern Python web framework
- **Celery** - Distributed task queue
- **PostgreSQL** - Primary database
- **Redis** - Queue broker and cache
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **Stripe** - Payment processing

### Infrastructure
- **Docker Compose** - Local development
- **MinIO/S3** - Object storage
- **Prometheus** - Metrics collection
- **Sentry** - Error tracking
- **OpenTelemetry** - Distributed tracing

## 💳 Credit & Pricing Model

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

## 📚 Documentation

- [System Architecture](./docs/system_architecture.md) - Detailed architecture documentation
- [Brand Guidelines](./docs/branding.md) - Logo usage, colors, typography
- [Contributing Guide](./docs/CONTRIBUTING.md) - How to contribute
- [Roadmap](./docs/ROADMAP.md) - Planned features and milestones
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment instructions

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./docs/CONTRIBUTING.md) first.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

We follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits & Acknowledgments

### Fair-Use Credit System

SoundFoundry implements a **fair market pricing baseline** with:

- **More-than-fair free trial window** - 400 credits on signup
- **Transparent metering** - Clear credit usage tracking
- **PPP-adjusted pricing** - Automatic price adjustment for global accessibility
- **Solidarity discounts** - Optional 15% discount for users who opt in
- **Disable free mode** - Free mode can be disabled at production scale

### Third-Party Resources

- **FAL.ai** - Primary AI music generation provider
- **Replicate** - Fallback AI music generation provider
- **Stripe** - Payment processing
- **Next.js** - React framework
- **FastAPI** - Python web framework
- **Celery** - Distributed task queue

## 🚀 Deployment & Status

### Live Production

- **Site**: [promptbloom.app](https://promptbloom.app)
- **Dashboard**: [promptbloom.app/app](https://promptbloom.app/app)
- **Status**: ✅ Deployed on Vercel

### Quick Verification

After deployment, run the verification script:

```bash
# Bash/Linux/macOS
./scripts/verify-production.sh

# PowerShell (Windows)
.\scripts\verify-production.ps1

# Node.js (any platform)
node scripts/verify-production.js
```

### Deployment Checklist

- [x] DNS configured (CNAME: `@` → `cname.vercel-dns.com`)
- [x] Vercel project created and connected
- [x] Environment variables set in Vercel
- [x] Security headers verified
- [x] SSL certificate provisioned
- [x] Sitemap and robots.txt accessible
- [x] Authentication flow tested
- [x] API CORS configured

See [docs/DNS_SETUP.md](./docs/DNS_SETUP.md) for detailed DNS configuration.

### Verification Matrix

| Check | Script | Threshold | Status |
|-------|--------|-----------|--------|
| Security Headers | `test:headers` | All headers present | ✅ |
| DNS & SSL | `test:dns` | Valid DNS, SSL ≥21 days | ✅ |
| Authentication | `test:login:smoke` | Redirect works, login flow | ✅ |
| Accessibility | `test:access` | 0 serious/critical issues | ✅ |
| Broken Links | `test:links` | No broken links | ✅ |
| Lighthouse | `test:lhci` | ≥90 on all categories | ✅ |
| OWASP ZAP | `zap_baseline` | No high/critical issues | ✅ |

See [docs/GO_LIVE_CHECKLIST.md](./docs/GO_LIVE_CHECKLIST.md) for detailed verification steps.

## 📊 Project Status

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/Snapwave333/_SoundFoundry?style=social)
![GitHub forks](https://img.shields.io/github/forks/Snapwave333/_SoundFoundry?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/Snapwave333/_SoundFoundry?style=social)

</div>

**Current Version**: v0.1.0 (Alpha)

See [ROADMAP](./docs/ROADMAP.md) for planned features and milestones.

---

<div align="center">

![SoundFoundry Wordmark](assets/branding/wordmark.svg)

**Craft Your Sound** 🎵

[GitHub](https://github.com/Snapwave333/_SoundFoundry) • [Issues](https://github.com/Snapwave333/_SoundFoundry/issues) • [Discussions](https://github.com/Snapwave333/_SoundFoundry/discussions)

</div>
