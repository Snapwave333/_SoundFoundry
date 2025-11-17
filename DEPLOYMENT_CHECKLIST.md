# Deployment Configuration Checklist

## Prerequisites
- [ ] PostgreSQL database provisioned
- [ ] Redis instance configured
- [ ] Stripe account set up with products
- [ ] File storage configured (S3/MinIO)
- [ ] Model provider accounts (FAL, Replicate)
- [ ] Domain name configured
- [ ] SSL certificates ready

## Environment Variables Required

### Web Frontend (Vercel)
```bash
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generated-secret

# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# File Storage
UPLOADTHING_SECRET=...
UPLOADTHING_APP_ID=...

# Redis
REDIS_URL=redis://...

# Model Providers
FAL_KEY=...
REPLICATE_API_TOKEN=...

# Security
JWT_SECRET=generated-secret

# Environment
NODE_ENV=production
```

### Backend API (Railway/Fly.io)
```bash
# Database
DATABASE_URL=postgresql://...

# API Configuration
API_BASE_URL=https://api.yourdomain.com
CORS_ORIGINS=https://yourdomain.com

# Authentication
JWT_SECRET=generated-secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080

# Redis
REDIS_URL=redis://...
CELERY_BROKER_URL=redis://...
CELERY_RESULT_BACKEND=redis://...

# File Storage
S3_BUCKET=your-bucket
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_REGION=us-east-1
S3_ENDPOINT_URL=https://s3.amazonaws.com

# Model Providers
FAL_KEY=...
REPLICATE_API_TOKEN=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...

# Content Policy
CONTENT_POLICY_ENABLED=true
CONTENT_POLICY_PROVIDER=openai
OPENAI_API_KEY=...

# Observability
SENTRY_DSN=...
SENTRY_ENVIRONMENT=production

# Security
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60

# Environment
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
```

## Deployment Steps

### 1. Frontend Deployment (Vercel)
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Set up custom domain
4. Configure build settings
5. Deploy and verify

### 2. Backend Deployment (Railway)
1. Create new Railway project
2. Connect GitHub repository
3. Configure environment variables
4. Set up database and Redis
5. Deploy and verify

### 3. Backend Deployment (Fly.io Alternative)
1. Install Fly CLI
2. Create new Fly app
3. Configure environment variables
4. Deploy with `fly deploy`
5. Set up custom domain

### 4. Database Setup
1. Create PostgreSQL database
2. Run migrations: `alembic upgrade head`
3. Set up connection pooling
4. Configure backup strategy

### 5. Domain Configuration
1. Configure DNS records
2. Set up SSL certificates
3. Configure CDN (optional)
4. Test domain resolution

## Security Checklist
- [ ] All secrets are properly set
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Content Security Policy headers
- [ ] Database access is secured
- [ ] File storage permissions
- [ ] API authentication is working

## Monitoring & Observability
- [ ] Sentry error tracking configured
- [ ] Health check endpoints working
- [ ] Logging is properly configured
- [ ] Performance monitoring enabled
- [ ] Database monitoring set up

## Testing Checklist
- [ ] Smoke tests pass
- [ ] API endpoints respond correctly
- [ ] Authentication flow works
- [ ] Payment processing works
- [ ] File uploads work
- [ ] Audio generation works
- [ ] User registration/login works
- [ ] Admin panel is accessible