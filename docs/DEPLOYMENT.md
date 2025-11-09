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

# Database (use managed PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/soundfoundry

# Redis (use managed Redis)
REDIS_URL=redis://host:6379/0

# Storage (use S3 or compatible)
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET=soundfoundry-prod

# Auth
NEXTAUTH_SECRET=strong_random_secret
NEXTAUTH_URL=https://yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Observability
SENTRY_DSN=your_sentry_dsn
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

- **Sentry**: Error tracking and performance monitoring
- **Prometheus**: Metrics collection (available at `/metrics`)
- **Grafana**: Visualization (optional)

## Scaling

- **API**: Scale horizontally behind load balancer
- **Celery Workers**: Scale based on queue length
- **Database**: Use read replicas for read-heavy workloads
- **Redis**: Use Redis Cluster for high availability

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set secure CORS origins
- [ ] Enable rate limiting
- [ ] Use managed database with encryption
- [ ] Rotate secrets regularly
- [ ] Enable WAF/DDoS protection
- [ ] Set up backup strategy
- [ ] Enable audit logging

## Backup Strategy

1. Database: Daily automated backups
2. File storage: S3 versioning enabled
3. Redis: Periodic snapshots

## Rollback Procedure

1. Revert code changes
2. Run database migrations (if needed)
3. Restart services
4. Verify health endpoints

