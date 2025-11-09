#!/bin/bash
# Production smoke test script
# Run after deployment to verify critical paths

set -e

API_URL="${API_URL:-https://app.yourdomain.com}"
TEST_TOKEN="${TEST_TOKEN:-}"

if [ -z "$TEST_TOKEN" ]; then
  echo "⚠️  TEST_TOKEN not set. Some tests will be skipped."
fi

echo "🧪 Running production smoke tests..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

test_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED++))
}

test_fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAILED++))
}

# Test 1: API Health
echo "1. Testing API health..."
HEALTH=$(curl -s "${API_URL}/api/health")
if [[ "$HEALTH" == *"ok"* ]]; then
  test_pass "API health check"
else
  test_fail "API health check: $HEALTH"
fi

# Test 2: Create Track (if token provided)
if [ -n "$TEST_TOKEN" ]; then
  echo "2. Testing track creation..."
  TRACK_RESPONSE=$(curl -s -X POST "${API_URL}/api/tracks" \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "prompt": "ambient electronic track",
      "duration_s": 30,
      "has_vocals": false
    }')
  
  if [[ "$TRACK_RESPONSE" == *"track_id"* ]]; then
    TRACK_ID=$(echo "$TRACK_RESPONSE" | grep -o '"track_id":[0-9]*' | cut -d: -f2)
    JOB_ID=$(echo "$TRACK_RESPONSE" | grep -o '"job_id":[0-9]*' | cut -d: -f2)
    test_pass "Track created (ID: $TRACK_ID, Job: $JOB_ID)"
    
    # Test 3: Job Status
    echo "3. Testing job status..."
    sleep 2
    JOB_STATUS=$(curl -s "${API_URL}/api/jobs/${JOB_ID}")
    if [[ "$JOB_STATUS" == *"status"* ]]; then
      test_pass "Job status endpoint"
    else
      test_fail "Job status endpoint"
    fi
    
    # Test 4: Increment Visual Version
    echo "4. Testing visual version increment..."
    VERSION_RESPONSE=$(curl -s -X POST "${API_URL}/api/tracks/${TRACK_ID}/increment-visual-version" \
      -H "Authorization: Bearer $TEST_TOKEN")
    if [[ "$VERSION_RESPONSE" == *"visual_version"* ]]; then
      test_pass "Visual version increment"
    else
      test_fail "Visual version increment: $VERSION_RESPONSE"
    fi
    
    # Test 5: Save Cover
    echo "5. Testing cover save..."
    COVER_SVG='<?xml version="1.0"?><svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#000"/></svg>'
    COVER_RESPONSE=$(curl -s -X POST "${API_URL}/api/tracks/${TRACK_ID}/cover" \
      -H "Authorization: Bearer $TEST_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"svg\": \"$COVER_SVG\", \"dark\": true}")
    if [[ "$COVER_RESPONSE" == *"cover_url"* ]]; then
      test_pass "Cover save"
    else
      test_fail "Cover save: $COVER_RESPONSE"
    fi
    
    # Test 6: Get Track with Series Info
    echo "6. Testing track retrieval..."
    TRACK_INFO=$(curl -s "${API_URL}/api/tracks/${TRACK_ID}")
    if [[ "$TRACK_INFO" == *"visual_version"* ]]; then
      test_pass "Track retrieval with style info"
    else
      test_fail "Track retrieval"
    fi
  else
    test_fail "Track creation: $TRACK_RESPONSE"
  fi
else
  echo -e "${YELLOW}⚠${NC}  Skipping track creation tests (no TEST_TOKEN)"
fi

# Test 7: Token Export
echo "7. Testing token export..."
TOKENS=$(curl -s "${API_URL}/api/tokens")
if [[ "$TOKENS" == *"color"* ]] && [[ "$TOKENS" == *"spacing"* ]]; then
  test_pass "Token export"
else
  test_fail "Token export"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All smoke tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Review output above.${NC}"
  exit 1
fi

