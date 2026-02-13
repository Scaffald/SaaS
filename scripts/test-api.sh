#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://127.0.0.1:54321/functions/v1/api"

echo -e "${YELLOW}🧪 Testing Scaffald REST API${NC}"
echo "=============================="

# Test health endpoint
echo -e "\n${YELLOW}Testing health endpoint...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ $HTTP_CODE -eq 200 ]; then
  echo -e "${GREEN}✅ Health check passed (HTTP $HTTP_CODE)${NC}"
  curl -s $BASE_URL/health | jq .
elif [ $HTTP_CODE -eq 404 ]; then
  echo -e "${RED}❌ Function not found (HTTP $HTTP_CODE)${NC}"
  echo -e "\n${YELLOW}⚠️  The API Edge Function is not being served${NC}"
  echo ""
  echo "To fix this, run in another terminal:"
  echo -e "  ${GREEN}cd $(pwd)${NC}"
  echo -e "  ${GREEN}supabase functions serve api --no-verify-jwt${NC}"
  echo ""
  echo "Then re-run this test script."
  exit 1
else
  echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
  RESPONSE=$(curl -s $BASE_URL/health)
  echo "Response: $RESPONSE"
  exit 1
fi

# Test a few more endpoints if health passes
echo -e "\n${YELLOW}Testing OpenAPI documentation...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/)
if [ $HTTP_CODE -eq 200 ]; then
  echo -e "${GREEN}✅ OpenAPI docs available${NC}"
else
  echo -e "${RED}❌ OpenAPI docs failed (HTTP $HTTP_CODE)${NC}"
fi

echo -e "\n${GREEN}✅ Basic API tests complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Create a test user in Supabase Studio (http://127.0.0.1:54323)"
echo "  2. Get a JWT token to test authenticated endpoints"
echo "  3. See API_TESTING_GUIDE.md for detailed testing instructions"
