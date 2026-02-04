
#!/bin/bash
API_URL="http://localhost:3000"
EMAIL="admin@dice-world.com"
PASSWORD="AdminPassword123!"

# 1. Login
echo "Logging in..."
TOKEN=$(curl -s -X POST "$API_URL/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed"
  exit 1
fi

echo "Token received"

# 2. Get User
echo "Getting user..."
USER_ID=$(curl -s -X GET "$API_URL/admin/users?limit=1" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -n 1 | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "No user found"
  exit 1
fi
echo "User ID: $USER_ID"

# 3. Update Balance
echo "Updating balance to 12345..."
RESPONSE=$(curl -s -X PATCH "$API_URL/admin/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"balance": 12345}')

echo "Response: $RESPONSE"

# 4. Check Balance
BALANCE=$(echo $RESPONSE | grep -o '"balance":12345')

if [ -n "$BALANCE" ]; then
  echo "SUCCESS: Balance updated to 12345"
else
  echo "FAILURE: Balance update failed"
fi
