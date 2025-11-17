#!/bin/bash

# SoundFoundry Production Deployment Script
# This script handles the complete deployment process

set -e

echo "🚀 SoundFoundry Production Deployment"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking deployment requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    print_status "All requirements satisfied"
}

# Deploy frontend to Vercel
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    cd web
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm install
    
    # Run tests
    print_status "Running tests..."
    npm run type-check
    npm run lint
    
    # Build the application
    print_status "Building frontend..."
    npm run build
    
    # Deploy to Vercel
    print_status "Deploying to Vercel..."
    if command -v vercel &> /dev/null; then
        vercel --prod
    else
        print_warning "Vercel CLI not found. Please install it or deploy manually."
        print_status "Build completed. Deploy the 'web/.next' directory to Vercel."
    fi
    
    cd ..
}

# Deploy backend to Railway
deploy_backend_railway() {
    print_status "Deploying backend to Railway..."
    
    cd server
    
    if command -v railway &> /dev/null; then
        railway up
    else
        print_warning "Railway CLI not found. Please install it or deploy manually."
        print_status "Build the Docker image and deploy to Railway."
    fi
    
    cd ..
}

# Deploy backend to Fly.io
deploy_backend_fly() {
    print_status "Deploying backend to Fly.io..."
    
    cd server
    
    if command -v fly &> /dev/null; then
        fly deploy
    else
        print_warning "Fly CLI not found. Please install it or deploy manually."
        print_status "Build the Docker image and deploy to Fly.io."
    fi
    
    cd ..
}

# Run smoke tests
run_smoke_tests() {
    print_status "Running smoke tests..."
    
    # Test API health
    if curl -f -s -o /dev/null "$API_BASE_URL/health"; then
        print_status "API health check passed"
    else
        print_error "API health check failed"
        exit 1
    fi
    
    # Test frontend
    if curl -f -s -o /dev/null "$NEXT_PUBLIC_SITE_URL"; then
        print_status "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
}

# Main deployment function
main() {
    check_requirements
    
    # Check environment variables
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL is not set"
        exit 1
    fi
    
    if [ -z "$NEXTAUTH_SECRET" ]; then
        print_error "NEXTAUTH_SECRET is not set"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        print_error "JWT_SECRET is not set"
        exit 1
    fi
    
    # Deploy based on user choice
    case "$1" in
        "frontend")
            deploy_frontend
            ;;
        "backend-railway")
            deploy_backend_railway
            ;;
        "backend-fly")
            deploy_backend_fly
            ;;
        "full")
            deploy_frontend
            deploy_backend_railway
            run_smoke_tests
            ;;
        *)
            echo "Usage: $0 {frontend|backend-railway|backend-fly|full}"
            echo ""
            echo "Options:"
            echo "  frontend       - Deploy only the frontend to Vercel"
            echo "  backend-railway - Deploy only the backend to Railway"
            echo "  backend-fly     - Deploy only the backend to Fly.io"
            echo "  full           - Deploy both frontend and backend"
            exit 1
            ;;
    esac
    
    print_status "Deployment completed successfully!"
}

# Run the main function with all arguments
main "$@"