# Production Deployment Guide

## Overview

This guide covers deploying SoundFoundry to production environments.

## Prerequisites

- Docker and Docker Compose (for containerized deployment)
- Terraform (for infrastructure as code)
- AWS/GCP/Azure account (for cloud deployment)
- Domain name and SSL certificate

## Environment Configuration

### Required Environment Variables

```bash
# Production
ENVIRONMENT=production
DEBUG=false

# API Keys
FAL_API_KEY=your_fal_api_key
REPLICATE_API_TOKEN=your_replicate_token

# Database (use managed PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/soundfoundry

# Redis (use managed Redis)
REDIS_URL=redis://host:6379/0

# Storage (use S3 or compatible)
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET=soundfoundry-prod

# Pricing (optional - defaults provided)
MODEL_COST_PER_MIN_USD=0.15
INFRA_COST_PER_MIN_USD=0.05
OVERHEAD_PER_MIN_USD=0.02
MARGIN_CAP=0.12

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Observability
SENTRY_DSN=your_sentry_dsn
OPENTELEMETRY_ENABLED=true

# Frontend (Next.js)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=SoundFoundry
NEXTAUTH_SECRET=strong_random_secret
NEXTAUTH_URL=https://yourdomain.com
```

## Deployment Options

### Option 1: Docker Compose (Single Server)

1. Set up a server (Ubuntu 22.04 recommended)
2. Install Docker and Docker Compose
3. Clone repository
4. Configure environment variables
5. Run migrations:
```bash
docker compose exec api alembic upgrade head
```
6. Start services:
```bash
docker compose up -d
```

### Option 2: AWS ECS/Fargate

See `infra/terraform/aws/` for Terraform configurations.

### Option 3: Fly.io

1. Install Fly CLI
2. Configure `fly.toml`
3. Deploy:
```bash
fly deploy
```

## Database Migrations

Always run migrations before deploying:

```bash
cd server
alembic upgrade head
```

## Monitoring

- **Sentry**: Error tracking and performance monitoring (FastAPI integration)
- **Prometheus**: Metrics collection (available at `/metrics`)
- **OpenTelemetry**: Distributed tracing (optional, enabled via env var)
- **Grafana**: Visualization (optional, for Prometheus metrics)
- **Health Endpoints**: 
  - `/api/health` - API health check
  - `/api/health/providers` - Provider availability check

## Scaling

- **API**: Scale horizontally behind load balancer
- **Celery Workers**: Scale based on queue length
- **Database**: Use read replicas for read-heavy workloads
- **Redis**: Use Redis Cluster for high availability

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set secure CORS origins (production domains only)
- [ ] Enable rate limiting (RateLimitMiddleware)
- [ ] Use managed database with encryption at rest
- [ ] Rotate API keys regularly (FAL, Replicate)
- [ ] Rotate Stripe webhook secrets
- [ ] Enable WAF/DDoS protection
- [ ] Set up backup strategy
- [ ] Enable audit logging (CreditLedger tracks all transactions)
- [ ] Configure TrustedHostMiddleware for production
- [ ] Use environment-specific secrets (never commit to git)
- [ ] Enable S3 bucket versioning
- [ ] Configure S3 bucket policies (least privilege)
- [ ] Set up database connection pooling
- [ ] Enable Redis AUTH (if using managed Redis)

## Backup Strategy

1. Database: Daily automated backups
2. File storage: S3 versioning enabled
3. Redis: Periodic snapshots

## Rollback Procedure

1. Revert code changes (git revert or rollback to previous tag)
2. Run database migrations (if needed): `alembic downgrade -1`
3. Restart services
4. Verify health endpoints: `/api/health` and `/api/health/providers`
5. Run smoke tests: `scripts/prod-smoke-test.sh`

## Stripe Webhook Setup

1. Create webhook endpoint in Stripe Dashboard
2. Point to: `https://api.yourdomain.com/api/stripe/webhook`
3. Subscribe to events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `charge.refunded`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`
5. Test webhook locally using Stripe CLI: `stripe listen --forward-to localhost:8000/api/stripe/webhook`

## Celery Worker Deployment

### Single Worker
```bash
celery -A app.celery_app worker --loglevel=info
```

### Multiple Workers (Horizontal Scaling)
```bash
# Worker 1
celery -A app.celery_app worker --loglevel=info --concurrency=4 --hostname=worker1@%h

# Worker 2
celery -A app.celery_app worker --loglevel=info --concurrency=4 --hostname=worker2@%h
```

### With Flower (Monitoring)
```bash
celery -A app.celery_app flower --port=5555
```

## Database Migrations

### Before Deployment
```bash
cd server
alembic upgrade head
```

### Rollback Migration
```bash
alembic downgrade -1
```

### Create New Migration
```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Health Checks

### API Health
```bash
curl https://api.yourdomain.com/api/health
# Expected: {"status":"ok","version":"1.0.0"}
```

### Provider Health
```bash
curl https://api.yourdomain.com/api/health/providers
# Expected: {"fal":"ok","replicate":"ok"}
```

### Metrics Endpoint
```bash
curl https://api.yourdomain.com/metrics
# Prometheus metrics format
```

