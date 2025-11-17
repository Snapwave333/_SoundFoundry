# SoundFoundry Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying SoundFoundry to production using Vercel for the frontend and Railway/Fly.io for the backend.

## Architecture
- **Frontend**: Next.js application deployed to Vercel
- **Backend**: FastAPI application deployed to Railway or Fly.io
- **Database**: PostgreSQL (managed service)
- **Cache**: Redis (managed service)
- **File Storage**: S3 or MinIO
- **Task Queue**: Celery with Redis

## Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.11+
- Git
- Docker (for local development)
- Accounts for deployment platforms

## Quick Start

### 1. Set Up Environment Variables
```bash
# Copy example files and fill in your values
cp web/.env.local.example web/.env.local
cp server/.env.example server/.env

# Or use the setup script
chmod +x scripts/setup-deployment.sh
./scripts/setup-deployment.sh
```

### 2. Deploy Frontend (Vercel)
```bash
# Option 1: Use Vercel CLI
npm i -g vercel
vercel --prod

# Option 2: Connect GitHub repo to Vercel dashboard
# Option 3: Use the deployment script
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh frontend
```

### 3. Deploy Backend (Railway)
```bash
# Option 1: Use Railway CLI
npm i -g @railway/cli
railway login
railway up

# Option 2: Use the deployment script
./scripts/deploy-production.sh backend-railway
```

### 4. Deploy Backend (Fly.io Alternative)
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
./scripts/deploy-production.sh backend-fly
```

## Detailed Deployment Steps

### Frontend Deployment (Vercel)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `web` directory as root

2. **Configure Environment Variables**
   ```bash
   DATABASE_URL=your_postgres_connection_string
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=generated_secret
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   # ... other variables from .env.local.example
   ```

3. **Build Settings**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Domain Configuration**
   - Add custom domain in Vercel settings
   - Configure DNS records
   - Enable SSL

### Backend Deployment (Railway)

1. **Create Project**
   - Go to [Railway Dashboard](https://railway.app)
   - Create new project
   - Connect GitHub repository
   - Select the `server` directory

2. **Add Services**
   - PostgreSQL database
   - Redis instance
   - Deploy from GitHub

3. **Configure Environment**
   - Copy variables from `server/.env.example`
   - Update database connection strings
   - Configure Redis URL
   - Set up file storage credentials

4. **Deploy**
   - Railway will auto-deploy on git push
   - Monitor logs in Railway dashboard

### Backend Deployment (Fly.io)

1. **Initialize Fly App**
   ```bash
   cd server
   fly launch --name soundfoundry-backend
   ```

2. **Configure Resources**
   - Set up PostgreSQL cluster
   - Configure Redis (Upstash)
   - Set environment variables

3. **Deploy**
   ```bash
   fly deploy
   ```

## Database Setup

### PostgreSQL
1. Create database instance (managed service recommended)
2. Run migrations:
   ```bash
   cd server
   alembic upgrade head
   ```
3. Set up connection pooling
4. Configure backups

### Redis
1. Create Redis instance
2. Configure connection string
3. Set up monitoring

## File Storage Configuration

### AWS S3
1. Create S3 bucket
2. Set up IAM user with appropriate permissions
3. Configure CORS for web access
4. Set environment variables

### MinIO (Self-hosted)
1. Deploy MinIO using Docker Compose
2. Create buckets and policies
3. Configure access keys
4. Set endpoint URL

## Monitoring & Observability

### Sentry Integration
1. Create Sentry project
2. Add DSN to environment variables
3. Configure error tracking
4. Set up performance monitoring

### Health Checks
- Frontend: `https://yourdomain.com/health`
- Backend: `https://api.yourdomain.com/health`

## Security Checklist

- [ ] HTTPS enforced on all endpoints
- [ ] Database access secured
- [ ] API authentication configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Content Security Policy headers
- [ ] Secrets properly managed
- [ ] File upload validation
- [ ] Input sanitization

## Performance Optimization

### Frontend
- Enable image optimization
- Configure CDN
- Optimize bundle size
- Set up caching headers

### Backend
- Database indexing
- Query optimization
- Redis caching
- Connection pooling
- Async processing with Celery

## Troubleshooting

### Common Issues
1. **Database Connection Errors**
   - Check connection string format
   - Verify network access
   - Check credentials

2. **CORS Issues**
   - Verify CORS_ORIGINS configuration
   - Check preflight requests

3. **File Upload Failures**
   - Verify storage credentials
   - Check file size limits
   - Review bucket permissions

4. **Authentication Problems**
   - Check JWT secret consistency
   - Verify NextAuth configuration
   - Review token expiration

### Logs and Debugging
- Vercel: Check deployment logs in dashboard
- Railway: View service logs
- Fly.io: Use `fly logs`
- Application: Check Sentry for errors

## Maintenance

### Regular Tasks
- Monitor error rates
- Review performance metrics
- Update dependencies
- Backup database
- Review security logs

### Scaling
- Frontend: Vercel auto-scales
- Backend: Adjust Railway/Fly.io resources
- Database: Scale PostgreSQL instance
- Cache: Monitor Redis memory usage

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Review deployment documentation
4. Test individual components
5. Check external service status

## Cost Optimization

- Use managed services for databases
- Implement caching strategies
- Optimize file storage usage
- Monitor resource utilization
- Set up billing alerts