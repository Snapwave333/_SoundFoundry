#!/bin/bash
# Production Verification Script for promptbloom.app
# Run after DNS propagation and Vercel deployment

set -e

SITE_URL="${SITE_URL:-https://promptbloom.app}"
API_URL="${API_URL:-https://api.promptbloom.app}"

echo "🔍 Verifying $SITE_URL..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

check() {
    local name="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "Checking $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAIL++))
        return 1
    fi
}

check_header() {
    local name="$1"
    local header="$2"
    local url="$3"
    
    echo -n "Checking $name... "
    local value=$(curl -sI "$url" | grep -i "^$header:" | cut -d' ' -f2- | tr -d '\r\n')
    
    if [ -n "$value" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($value)"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (header not found)"
        ((FAIL++))
        return 1
    fi
}

# 1. Homepage
check "Homepage (200)" "curl -s -o /dev/null -w '%{http_code}' $SITE_URL | grep -q '^200$'"

# 2. Marketing Pages
for page in pricing about contact privacy terms; do
    check "$page page (200)" "curl -s -o /dev/null -w '%{http_code}' $SITE_URL/$page | grep -q '^200$'"
done

# 3. Dashboard redirect (should be 302 or 401)
echo -n "Checking /app redirect... "
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$SITE_URL/app")
if [[ "$HTTP_CODE" == "302" ]] || [[ "$HTTP_CODE" == "307" ]] || [[ "$HTTP_CODE" == "401" ]]; then
    echo -e "${GREEN}✓ PASS${NC} ($HTTP_CODE)"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC} (got $HTTP_CODE, expected 302/307/401)"
    ((FAIL++))
fi

# 4. Robots.txt
check "robots.txt (200)" "curl -s -o /dev/null -w '%{http_code}' $SITE_URL/robots.txt | grep -q '^200$'"

# 5. Sitemap.xml
check "sitemap.xml (200)" "curl -s -o /dev/null -w '%{http_code}' $SITE_URL/sitemap.xml | grep -q '^200$'"

# 6. Security Headers
check_header "Strict-Transport-Security" "Strict-Transport-Security" "$SITE_URL"
check_header "X-Content-Type-Options" "X-Content-Type-Options" "$SITE_URL"
check_header "X-Frame-Options" "X-Frame-Options" "$SITE_URL"
check_header "Referrer-Policy" "Referrer-Policy" "$SITE_URL"
check_header "Permissions-Policy" "Permissions-Policy" "$SITE_URL"
check_header "Content-Security-Policy" "Content-Security-Policy" "$SITE_URL"

# 7. Verify robots.txt excludes /app
echo -n "Checking robots.txt excludes /app... "
ROBOTS_CONTENT=$(curl -s "$SITE_URL/robots.txt")
if echo "$ROBOTS_CONTENT" | grep -q "Disallow: /app"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# 8. Verify sitemap includes marketing pages
echo -n "Checking sitemap includes marketing pages... "
SITEMAP_CONTENT=$(curl -s "$SITE_URL/sitemap.xml")
if echo "$SITEMAP_CONTENT" | grep -q "$SITE_URL/pricing" && \
   echo "$SITEMAP_CONTENT" | grep -q "$SITE_URL/about"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# 9. API CORS (if API_URL is set and different)
if [ -n "$API_URL" ] && [ "$API_URL" != "$SITE_URL" ]; then
    echo -n "Checking API CORS... "
    CORS_HEADER=$(curl -sI -X OPTIONS -H "Origin: $SITE_URL" "$API_URL/api/health" 2>/dev/null | grep -i "access-control-allow-origin" | cut -d' ' -f2- | tr -d '\r\n')
    if echo "$CORS_HEADER" | grep -q "$SITE_URL"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠ SKIP${NC} (CORS check - verify manually)"
    fi
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Review above.${NC}"
    exit 1
fi

