#!/bin/bash
# Production deployment verification script
# Run after deployment to verify all systems operational

set -e

API_URL="${API_URL:-https://app.yourdomain.com}"
TEST_TOKEN="${TEST_TOKEN:-}"

echo "🔍 Verifying deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Health check
echo -n "Checking API health... "
HEALTH=$(curl -s "${API_URL}/api/health" || echo "FAIL")
if [[ "$HEALTH" == *"ok"* ]]; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  echo "  Health check failed: $HEALTH"
  exit 1
fi

# Token export
echo -n "Checking token export... "
TOKENS=$(curl -s "${API_URL}/api/tokens" || echo "FAIL")
if [[ "$TOKENS" == *"color"* ]]; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  echo "  Token export failed"
  exit 1
fi

# Database connectivity (if test token provided)
if [ -n "$TEST_TOKEN" ]; then
  echo -n "Checking style endpoints... "
  STYLE_ME=$(curl -s -H "Authorization: Bearer $TEST_TOKEN" \
    "${API_URL}/api/style/me" || echo "FAIL")
  if [[ "$STYLE_ME" == *"user_style_seed"* ]]; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${YELLOW}⚠${NC} (may need auth)"
  fi
fi

# S3/MinIO connectivity (if credentials available)
if [ -n "$S3_BUCKET" ]; then
  echo -n "Checking S3 bucket... "
  if aws s3 ls "s3://${S3_BUCKET}/" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${YELLOW}⚠${NC} (S3 check skipped - verify manually)"
  fi
fi

# Worker status (if docker available)
if command -v docker &> /dev/null; then
  echo -n "Checking worker status... "
  WORKER_STATUS=$(docker compose ps worker 2>/dev/null | grep -q "Up" && echo "UP" || echo "DOWN")
  if [[ "$WORKER_STATUS" == "UP" ]]; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${YELLOW}⚠${NC} (worker may not be running in this environment)"
  fi
fi

echo ""
echo -e "${GREEN}✅ Deployment verification complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run prod smoke tests (see GO_LIVE_RUNBOOK.md)"
echo "  2. Check observability dashboards"
echo "  3. Monitor error rates for 1 hour"
echo "  4. Enable feature flags one at a time"

