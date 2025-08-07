#!/bin/bash

# API Gateway Test Script
# Phase 2B: JWT認証統合テスト

echo "🧪 API Gateway JWT Authentication Test"
echo "======================================="

# 基本設定
API_BASE="http://localhost:8080/api"
AUTH_URL="$API_BASE/auth"
PETS_URL="$API_BASE/pets"
DEV_URL="http://localhost:8080/dev"

echo ""
echo "📋 Test Plan:"
echo "1. Health Check"
echo "2. Public Pet Listing (認証不要)"
echo "3. Authentication Test with DEV_TOKEN"
echo "4. Role-based Access Control Test"
echo "5. Protected Pet Operations Test"
echo ""

# Test 1: Health Check
echo "🏥 Test 1: Health Check"
echo "GET /health"
curl -s -X GET "http://localhost:8080/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Test 2: Public Pet Listing
echo "🐾 Test 2: Public Pet Listing (no auth required)"
echo "GET $PETS_URL"
curl -s -X GET "$PETS_URL" | jq '.' || echo "⚠️ Pet service may not be running"
echo ""

# Test 3: Authentication Test with DEV_TOKEN
echo "🔐 Test 3: Development Token Authentication"
echo "GET $DEV_URL/auth/test with DEV_TOKEN"
curl -s -X GET "$DEV_URL/auth/test" \
  -H "Authorization: Bearer DEV_TOKEN" | jq '.' || echo "❌ DEV_TOKEN auth failed"
echo ""

# Test 4: Role-based Access Control Test
echo "👥 Test 4: Shelter Role Access Control"
echo "GET $DEV_URL/auth/shelter-test with DEV_TOKEN (should succeed - DEV_TOKEN has shelter role)"
curl -s -X GET "$DEV_URL/auth/shelter-test" \
  -H "Authorization: Bearer DEV_TOKEN" | jq '.' || echo "❌ Shelter role test failed"
echo ""

# Test 5: Unauthorized Access
echo "🚫 Test 5: Unauthorized Access (no token)"
echo "GET $DEV_URL/auth/test (should fail with 401)"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$DEV_URL/auth/test")
if [ "$HTTP_STATUS" -eq 401 ]; then
  echo "✅ Correctly returned 401 Unauthorized"
else
  echo "❌ Expected 401 but got $HTTP_STATUS"
fi
echo ""

# Test 6: Invalid Token
echo "🔓 Test 6: Invalid Token Access"
echo "GET $DEV_URL/auth/test with invalid token (should fail with 401)"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$DEV_URL/auth/test" \
  -H "Authorization: Bearer INVALID_TOKEN")
if [ "$HTTP_STATUS" -eq 401 ]; then
  echo "✅ Correctly returned 401 Unauthorized for invalid token"
else
  echo "❌ Expected 401 but got $HTTP_STATUS"
fi
echo ""

# Test 7: Token Info (Optional Auth)
echo "ℹ️ Test 7: Optional Auth - Token Info"
echo "GET $DEV_URL/token/info with DEV_TOKEN"
curl -s -X GET "$DEV_URL/token/info" \
  -H "Authorization: Bearer DEV_TOKEN" | jq '.' || echo "❌ Token info failed"
echo ""

echo "GET $DEV_URL/token/info without token"
curl -s -X GET "$DEV_URL/token/info" | jq '.' || echo "❌ Optional auth without token failed"
echo ""

# Test 8: CORS Preflight
echo "🌐 Test 8: CORS Preflight Request"
echo "OPTIONS $PETS_URL"
curl -s -X OPTIONS "$PETS_URL" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -v 2>&1 | grep -E "(Access-Control|HTTP/)" || echo "⚠️ CORS headers check"
echo ""

echo "🎉 Test Complete!"
echo ""
echo "💡 Next Steps:"
echo "1. Run 'go mod tidy' in services/api-gateway/"
echo "2. Start API Gateway: 'go run main.go' (in api-gateway directory)"
echo "3. Ensure Auth Service and Pet Service are running"
echo "4. Run this test script to verify JWT authentication"
echo ""
echo "🔧 Development Endpoints:"
echo "  Health: http://localhost:8080/health"
echo "  Auth Test: $DEV_URL/auth/test"
echo "  Token Info: $DEV_URL/token/info"
echo "  Shelter Test: $DEV_URL/auth/shelter-test"
