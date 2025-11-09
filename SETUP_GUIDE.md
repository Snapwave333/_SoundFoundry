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
```
FAL_API_KEY=your_fal_api_key_here
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/soundfoundry
REDIS_URL=redis://localhost:6379/0
```

**`web/.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Next Steps

Once everything is running:
1. Test track generation end-to-end
2. Verify audio streaming works
3. Test reference audio upload
4. Check MinIO console at `http://localhost:9001` (minioadmin/minioadmin)
5. Monitor Celery Flower at `http://localhost:5555` (if enabled)

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/api/health`
- Metrics: `http://localhost:8000/metrics`

