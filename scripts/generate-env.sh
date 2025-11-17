#!/bin/bash

# SoundFoundry Environment Variable Generator
# This script generates secure environment variables for production deployment

echo "🔐 SoundFoundry Environment Variable Generator"
echo "=============================================="

# Generate secure secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
DATABASE_PASSWORD=$(openssl rand -base64 16)

# Create environment files
echo "Creating environment configuration files..."

# Web environment
cat > web/.env.local << EOF
# Database
DATABASE_URL="postgresql://soundfoundry:${DATABASE_PASSWORD}@localhost:5432/soundfoundry"

# NextAuth
NEXTAUTH_URL="https://soundfoundry.app"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# API Configuration
NEXT_PUBLIC_API_URL="https://api.soundfoundry.app"
NEXT_PUBLIC_SITE_URL="https://soundfoundry.app"
NEXT_PUBLIC_DASHBOARD_BASE="/app"

# Stripe (Update with your actual keys)
STRIPE_PUBLISHABLE_KEY="pk_live_your_publishable_key"
STRIPE_SECRET_KEY="sk_live_your_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# File Storage (Update with your actual credentials)
UPLOADTHING_SECRET="your_uploadthing_secret"
UPLOADTHING_APP_ID="your_uploadthing_app_id"

# Redis
REDIS_URL="redis://localhost:6379"

# Model Providers (Update with your actual keys)
FAL_KEY="your_fal_key"
REPLICATE_API_TOKEN="your_replicate_token"

# Security
JWT_SECRET="${JWT_SECRET}"

# Environment
NODE_ENV="production"
EOF

# Server environment
cat > server/.env << EOF
# Database
DATABASE_URL="postgresql://soundfoundry:${DATABASE_PASSWORD}@localhost:5432/soundfoundry"

# API Configuration
API_BASE_URL="https://api.soundfoundry.app"
CORS_ORIGINS="https://soundfoundry.app,https://www.soundfoundry.app"

# Authentication
JWT_SECRET="${JWT_SECRET}"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_MINUTES="10080"

# Redis
REDIS_URL="redis://localhost:6379"
CELERY_BROKER_URL="redis://localhost:6379/0"
CELERY_RESULT_BACKEND="redis://localhost:6379/0"

# File Storage (Update with your actual S3/MinIO credentials)
S3_BUCKET="soundfoundry-production"
S3_ACCESS_KEY_ID="your_s3_access_key"
S3_SECRET_ACCESS_KEY="your_s3_secret_key"
S3_REGION="us-east-1"
S3_ENDPOINT_URL="https://s3.amazonaws.com"
MINIO_ENDPOINT="localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_SECURE="false"

# Model Providers (Update with your actual keys)
FAL_KEY="your_fal_key"
REPLICATE_API_TOKEN="your_replicate_token"

# Stripe (Update with your actual keys)
STRIPE_SECRET_KEY="sk_live_your_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
STRIPE_PRICE_BASIC="price_basic_plan_id"
STRIPE_PRICE_PRO="price_pro_plan_id"

# Content Policy
CONTENT_POLICY_ENABLED="true"
CONTENT_POLICY_PROVIDER="openai"
OPENAI_API_KEY="your_openai_api_key"

# Observability (Update with your actual Sentry DSN)
SENTRY_DSN="your_sentry_dsn"
SENTRY_ENVIRONMENT="production"

# Security
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_REQUESTS_PER_MINUTE="60"

# Environment
ENVIRONMENT="production"
DEBUG="false"
LOG_LEVEL="INFO"
EOF

echo "✅ Environment files created successfully!"
echo ""
echo "🔑 Generated Secrets:"
echo "   - NextAuth Secret: ${NEXTAUTH_SECRET:0:20}..."
echo "   - JWT Secret: ${JWT_SECRET:0:20}..."
echo "   - Database Password: ${DATABASE_PASSWORD:0:20}..."
echo ""
echo "⚠️  Important:"
echo "   - Update the placeholder values with your actual API keys"
echo "   - Set up your PostgreSQL database with the generated password"
echo "   - Configure your Stripe account and get the API keys"
echo "   - Set up your file storage (S3 or MinIO)"
echo "   - Configure your model provider accounts (FAL, Replicate)"
echo "   - Set up Sentry for error tracking (optional)"
echo ""
echo "📁 Files created:"
echo "   - web/.env.local (Frontend configuration)"
echo "   - server/.env (Backend configuration)"
echo ""
echo "🔒 Keep these files secure and never commit them to version control!"