
#!/bin/bash
API_URL="http://localhost:3000"
EMAIL="admin@dice-world.com"
PASSWORD="AdminPassword123!"

# 1. Login
TOKEN=$(curl -s -X POST "$API_URL/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed"
  exit 1
fi

# 2. Get Users List
echo "Fetching users list..."
RESPONSE=$(curl -s -X GET "$API_URL/admin/users?limit=1" \
  -H "Authorization: Bearer $TOKEN")

# 3. Check for balance field
echo "Full Response Body:"
echo "$RESPONSE"

if [[ "$RESPONSE" == *"balance"* ]]; then
  echo "SUCCESS: 'balance' field found in users list."
else
  echo "FAILURE: 'balance' field MISSING in users list."
fi
