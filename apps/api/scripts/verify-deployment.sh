#!/bin/bash

BASE_URL="${1:-https://api-production-6de9.up.railway.app}"
ORIGIN="${2:-https://dice-worldweb.netlify.app}"

echo "Testing Deployment at $BASE_URL..."

# 1. Health Check
echo "1. Checking /api/health..."
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" "$BASE_URL/api/health")
if [ "$HTTP_STATUS" == "200" ]; then
  echo "✅ Health check passed (200 OK)"
else
  echo "❌ Health check failed (Status: $HTTP_STATUS)"
fi

# 2. CORS Check
echo "2. Checking CORS for $ORIGIN..."
CORS_HEADER=$(curl -I -s -X OPTIONS "$BASE_URL/api/auth/public/signup" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  | grep -i "access-control-allow-origin")

if [[ "$CORS_HEADER" == *"$ORIGIN"* ]]; then
  echo "✅ CORS header present: $CORS_HEADER"
else
  echo "❌ CORS header missing or incorrect. Got: $CORS_HEADER"
fi
