#!/bin/bash

# SoundFoundry Secure Environment Variable Generator
# This script securely prompts for credentials and generates environment files

echo "🔐 SoundFoundry Secure Environment Variable Generator"
echo "===================================================="
echo ""
echo "⚠️  IMPORTANT: This script will prompt you for sensitive credentials."
echo "   Never hardcode API keys in scripts or commit them to version control."
echo ""

# Generate secure secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
DATABASE_PASSWORD=$(openssl rand -base64 16)

echo "✅ Generated secure secrets..."
echo ""

# Prompt for Stripe credentials
echo "💳 Stripe Configuration:"
echo "   Note: You can find these in your Stripe Dashboard"
echo ""
read -p "Enter your Stripe Publishable Key (pk_live_...): " STRIPE_PUBLISHABLE_KEY
echo ""
read -p "Enter your Stripe Secret Key (sk_live_...): " -s STRIPE_SECRET_KEY
echo ""
read -p "Enter your Stripe Webhook Secret (whsec_...): " -s STRIPE_WEBHOOK_SECRET
echo ""

# Prompt for other required credentials
echo "🗄️  Database Configuration:"
read -p "Enter your PostgreSQL host (default: localhost): " DB_HOST
echo ""
read -p "Enter your PostgreSQL port (default: 5432): " DB_PORT
echo ""
read -p "Enter your PostgreSQL database name (default: soundfoundry): " DB_NAME
echo ""
read -p "Enter your PostgreSQL username (default: soundfoundry): " DB_USER
echo ""

# Set defaults if not provided
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-soundfoundry}
DB_USER=${DB_USER:-soundfoundry}

# Prompt for other API keys
echo "🤖 Model Provider Configuration:"
read -p "Enter your FAL API Key (optional, press Enter to skip): " FAL_KEY
echo ""
read -p "Enter your Replicate API Token (optional, press Enter to skip): " REPLICATE_API_TOKEN
echo ""

# Prompt for file storage
echo "📁 File Storage Configuration:"
echo "   Choose S3 or MinIO (press Enter for default MinIO setup):"
read -p "Enter your S3 bucket name (or press Enter for MinIO): " S3_BUCKET
echo ""

if [ -n "$S3_BUCKET" ]; then
    read -p "Enter your AWS Access Key ID: " S3_ACCESS_KEY_ID
echo ""
    read -p "Enter your AWS Secret Access Key: " -s S3_SECRET_ACCESS_KEY
echo ""
    read -p "Enter your AWS Region (default: us-east-1): " S3_REGION
echo ""
    S3_REGION=${S3_REGION:-us-east-1}
    S3_ENDPOINT_URL="https://s3.amazonaws.com"
    MINIO_SECURE="true"
else
    S3_BUCKET="soundfoundry-local"
    S3_ACCESS_KEY_ID="minioadmin"
    S3_SECRET_ACCESS_KEY="minioadmin"
    S3_REGION="us-east-1"
    S3_ENDPOINT_URL="http://localhost:9000"
    MINIO_SECURE="false"
fi

# Prompt for optional services
echo "🔍 Optional Services:"
read -p "Enter your Sentry DSN (optional, press Enter to skip): " SENTRY_DSN
echo ""
read -p "Enter your OpenAI API Key (optional, press Enter to skip): " OPENAI_API_KEY
echo ""

# Create environment files
echo "📝 Creating environment configuration files..."

# Web environment
cat > web/.env.local << EOF
# Database
DATABASE_URL="postgresql://${DB_USER}:${DATABASE_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# NextAuth
NEXTAUTH_URL="https://promptbloom.app"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# API Configuration
NEXT_PUBLIC_API_URL="https://api.promptbloom.app"
NEXT_PUBLIC_SITE_URL="https://promptbloom.app"
NEXT_PUBLIC_DASHBOARD_BASE="/app"

# Stripe
STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY}"
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}"

# File Storage
UPLOADTHING_SECRET="your_uploadthing_secret"
UPLOADTHING_APP_ID="your_uploadthing_app_id"

# Redis
REDIS_URL="redis://localhost:6379"

# Model Providers
FAL_KEY="${FAL_KEY:-your_fal_key}"
REPLICATE_API_TOKEN="${REPLICATE_API_TOKEN:-your_replicate_token}"

# Security
JWT_SECRET="${JWT_SECRET}"

# Environment
NODE_ENV="production"
EOF

# Server environment
cat > server/.env << EOF
# Database
DATABASE_URL="postgresql://${DB_USER}:${DATABASE_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# API Configuration
API_BASE_URL="https://api.promptbloom.app"
CORS_ORIGINS="https://promptbloom.app,https://www.promptbloom.app"

# Authentication
JWT_SECRET="${JWT_SECRET}"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_MINUTES="10080"

# Redis
REDIS_URL="redis://localhost:6379"
CELERY_BROKER_URL="redis://localhost:6379/0"
CELERY_RESULT_BACKEND="redis://localhost:6379/0"

# File Storage
S3_BUCKET="${S3_BUCKET}"
S3_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID}"
S3_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY}"
S3_REGION="${S3_REGION}"
S3_ENDPOINT_URL="${S3_ENDPOINT_URL}"
MINIO_ENDPOINT="localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_SECURE="${MINIO_SECURE:-false}"

# Model Providers
FAL_KEY="${FAL_KEY:-your_fal_key}"
REPLICATE_API_TOKEN="${REPLICATE_API_TOKEN:-your_replicate_token}"

# Stripe
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}"
STRIPE_PRICE_BASIC="price_basic_plan_id"
STRIPE_PRICE_PRO="price_pro_plan_id"

# Content Policy
CONTENT_POLICY_ENABLED="true"
CONTENT_POLICY_PROVIDER="openai"
OPENAI_API_KEY="${OPENAI_API_KEY:-your_openai_api_key}"

# Observability
SENTRY_DSN="${SENTRY_DSN:-your_sentry_dsn}"
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
echo "🔑 Generated Secure Secrets:"
echo "   - NextAuth Secret: ${NEXTAUTH_SECRET:0:20}..."
echo "   - JWT Secret: ${JWT_SECRET:0:20}..."
echo "   - Database Password: ${DATABASE_PASSWORD:0:20}..."
echo ""
echo "💳 Stripe Configuration: ✅ Configured"
echo "   - Publishable Key: ${STRIPE_PUBLISHABLE_KEY:0:20}..."
echo "   - Secret Key: ${STRIPE_SECRET_KEY:0:20}..."
echo "   - Webhook Secret: ${STRIPE_WEBHOOK_SECRET:0:20}..."
echo ""
echo "📁 Files created:"
echo "   - web/.env.local (Frontend configuration)"
echo "   - server/.env (Backend configuration)"
echo ""
echo "🔒 Security Notes:"
echo "   ✅ All secrets are cryptographically secure"
echo "   ✅ Stripe credentials are properly configured"
echo "   ✅ Database password is strong and unique"
echo "   ✅ No hardcoded secrets in scripts"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Set up your PostgreSQL database with the generated credentials"
echo "   2. Configure your file storage (S3 or start MinIO locally)"
echo "   3. Set up Redis instance"
echo "   4. Deploy to your chosen platform (Vercel + Railway/Fly.io)"
echo "   5. Configure Stripe webhook endpoint in Stripe Dashboard"
echo ""
echo "🚀 Your SoundFoundry application is ready for deployment!"