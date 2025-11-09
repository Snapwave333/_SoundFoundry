# SoundFoundry Setup & Testing Guide

## Prerequisites

1. **Start Docker Desktop** - Make sure Docker Desktop is running before proceeding
2. **Python 3.11+** with venv support
3. **Node.js 18+** with npm

## Step-by-Step Setup

### Terminal A: Start Infrastructure Services

```powershell
cd infra
docker compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379  
- MinIO on ports 9000 (API) and 9001 (Console)

**Verify services are running:**
```powershell
docker ps
```

### Terminal B: Backend API Server

```powershell
cd server
.\venv\Scripts\Activate.ps1
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Expected output:** Server running on `http://127.0.0.1:8000`

**Test:** Open `http://localhost:8000/api/health` in browser - should return `{"status":"ok","version":"1.0.0"}`

### Terminal C: Celery Worker

```powershell
cd server
.\venv\Scripts\Activate.ps1
celery -A app.celery_app worker --loglevel=info
```

**Expected output:** Worker ready to accept tasks

**If jobs stall at QUEUED:** Check Redis connection. Verify Redis is running:
```powershell
docker ps | findstr redis
```

**For debugging:** Use `--loglevel=debug` instead of `info`

### Terminal D: Frontend

```powershell
cd web
npm install
npm run dev
```

**Expected output:** Server running on `http://localhost:3000`

## Testing the Application

1. **Open browser:** Navigate to `http://localhost:3000`

2. **Create a test track:**
   - Enter prompt: "Upbeat electronic dance music"
   - Set duration: 30-60 seconds (start small)
   - Click "Generate Music"

3. **Watch the queue:**
   - Job should appear in right panel
   - Status should progress: QUEUED → RENDERING → COMPLETE
   - Progress bar should update

4. **If it stalls:**

   **At QUEUED:**
   - Check Redis connection
   - Verify Celery worker is running
   - Check worker logs for errors

   **At RENDERING:**
   - Check Celery worker logs: `celery -A app.celery_app worker --loglevel=debug`
   - Verify FAL API key is correct in `server/.env`
   - Check provider API status

5. **FAL API Tips:**
   - Duration ≤ 240s
   - Style strength: 0.25-0.7 works reliably
   - Keep prompts simple and clear

6. **Test preview stream:**
   - When status is COMPLETE, audio player should appear
   - Click play to test streaming

7. **Test download:**
   - Click download button
   - Verify file downloads from MinIO bucket

## Troubleshooting

### Docker not running
```powershell
# Start Docker Desktop manually, then:
docker ps
```

### Database connection error
```powershell
# Check PostgreSQL is running:
docker ps | findstr postgres

# Check connection:
docker exec -it infra-postgres-1 psql -U postgres -d soundfoundry
```

### Redis connection error
```powershell
# Check Redis is running:
docker ps | findstr redis

# Test connection:
docker exec -it infra-redis-1 redis-cli ping
# Should return: PONG
```

### Celery worker not picking up jobs
- Verify Redis URL in `server/.env` matches Docker Compose
- Restart Celery worker
- Check worker logs for connection errors

### API errors
- Check `server/.env` has correct FAL_API_KEY
- Verify API key format: `key:secret`
- Check FAL API status/dashboard

## Environment Files

Make sure these files exist with correct values:

**`server/.env`:**
```env
# API Keys
FAL_API_KEY=your_fal_api_key_here
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/soundfoundry

# Redis
REDIS_URL=redis://localhost:6379/0

# Storage (MinIO defaults)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=soundfoundry

# Pricing (optional - defaults provided)
MODEL_COST_PER_MIN_USD=0.15
INFRA_COST_PER_MIN_USD=0.05
OVERHEAD_PER_MIN_USD=0.02
MARGIN_CAP=0.12

# CORS (for development)
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=development
```

**`web/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=SoundFoundry
NEXT_PUBLIC_USE_MSW=false
```

## Next Steps

Once everything is running:
1. **Test track generation end-to-end**
   - Navigate to `http://localhost:3000/create`
   - Enter a prompt: "Upbeat electronic dance music"
   - Set duration: 30-60 seconds
   - Click "Generate Music"
   - Watch job progress in the UI

2. **Verify audio streaming works**
   - When track completes, audio player should appear
   - Click play to test streaming from MinIO

3. **Test reference audio upload**
   - Upload a reference audio file
   - Verify BPM/key analysis appears
   - Use analyzed values in track generation

4. **Test style system**
   - Check `/api/style/me` for style seed
   - Create a new series via `/api/style/series`
   - Generate tracks with series_id

5. **Test credit system**
   - Check credit balance: `GET /api/credits`
   - Preview cost: `GET /api/tracks/cost-preview?duration_s=60`
   - Verify credits deducted after generation

6. **Check MinIO console**
   - Visit `http://localhost:9001`
   - Login: `minioadmin` / `minioadmin`
   - Verify files uploaded to `soundfoundry` bucket

7. **Monitor Celery Flower** (optional)
   - Start: `celery -A app.celery_app flower --port=5555`
   - Visit `http://localhost:5555` for worker monitoring

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/api/health`
- Metrics: `http://localhost:8000/metrics`

