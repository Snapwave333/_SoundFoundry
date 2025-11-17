#!/bin/bash

# SoundFoundry Deployment Setup Script
# This script helps generate secure environment variables for production deployment

echo "🚀 SoundFoundry Deployment Setup"
echo "================================"

# Generate NextAuth secret
if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "Generating NextAuth secret..."
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "✅ NextAuth secret generated"
fi

# Generate JWT secret
if [ -z "$JWT_SECRET" ]; then
    echo "Generating JWT secret..."
    JWT_SECRET=$(openssl rand -base64 32)
    echo "✅ JWT secret generated"
fi

# Create web environment file
echo "Creating web environment configuration..."
cat > web/.env.local << EOF
# Database
DATABASE_URL="$DATABASE_URL"

# NextAuth
NEXTAUTH_URL="$NEXTAUTH_URL"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# API Configuration
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL"
NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL"
NEXT_PUBLIC_DASHBOARD_BASE="/app"

# Stripe
STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY"
STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"

# File Storage
UPLOADTHING_SECRET="$UPLOADTHING_SECRET"
UPLOADTHING_APP_ID="$UPLOADTHING_APP_ID"

# Redis
REDIS_URL="$REDIS_URL"

# Model Providers
FAL_KEY="$FAL_KEY"
REPLICATE_API_TOKEN="$REPLICATE_API_TOKEN"

# Security
JWT_SECRET="$JWT_SECRET"

# Environment
NODE_ENV="production"
EOF

# Create server environment file
echo "Creating server environment configuration..."
cat > server/.env << EOF
# Database
DATABASE_URL="$DATABASE_URL"

# API Configuration
API_BASE_URL="$API_BASE_URL"
CORS_ORIGINS="$CORS_ORIGINS"

# Authentication
JWT_SECRET="$JWT_SECRET"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_MINUTES="10080"

# Redis
REDIS_URL="$REDIS_URL"
CELERY_BROKER_URL="$CELERY_BROKER_URL"
CELERY_RESULT_BACKEND="$CELERY_RESULT_BACKEND"

# File Storage
S3_BUCKET="$S3_BUCKET"
S3_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID"
S3_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY"
S3_REGION="$S3_REGION"
S3_ENDPOINT_URL="$S3_ENDPOINT_URL"
MINIO_ENDPOINT="$MINIO_ENDPOINT"
MINIO_ACCESS_KEY="$MINIO_ACCESS_KEY"
MINIO_SECRET_KEY="$MINIO_SECRET_KEY"
MINIO_SECURE="$MINIO_SECURE"

# Model Providers
FAL_KEY="$FAL_KEY"
REPLICATE_API_TOKEN="$REPLICATE_API_TOKEN"

# Stripe
STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
STRIPE_PRICE_BASIC="$STRIPE_PRICE_BASIC"
STRIPE_PRICE_PRO="$STRIPE_PRICE_PRO"

# Content Policy
CONTENT_POLICY_ENABLED="true"
CONTENT_POLICY_PROVIDER="openai"
OPENAI_API_KEY="$OPENAI_API_KEY"

# Observability
SENTRY_DSN="$SENTRY_DSN"
SENTRY_ENVIRONMENT="production"

# Security
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_REQUESTS_PER_MINUTE="60"

# Environment
ENVIRONMENT="production"
DEBUG="false"
LOG_LEVEL="INFO"
EOF

echo ""
echo "✅ Environment files created successfully!"
echo ""
echo "Next steps:"
echo "1. Set up your database (PostgreSQL)"
echo "2. Configure Stripe account and get API keys"
echo "3. Set up Redis instance"
echo "4. Configure file storage (S3 or MinIO)"
echo "5. Set up model provider accounts (FAL, Replicate)"
echo "6. Deploy to Vercel (frontend) and Railway/Fly.io (backend)"
echo ""
echo "🔐 Keep your .env files secure and never commit them to version control!"