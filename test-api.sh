#!/bin/bash

# ShopVibe API Test Script
# This script tests all major API endpoints

API_URL="http://localhost:3002"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "ShopVibe API Test Suite"
echo "========================================="
echo ""

# Counter for passed/failed tests
PASSED=0
FAILED=0

# Test 1: Health Check
echo "1. Testing Health Check..."
RESPONSE=$(curl -s -w "\n%{http_code}" $API_URL/health)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Health check failed (Status: $HTTP_CODE)${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 2: Get Products
echo "2. Testing Get Products..."
RESPONSE=$(curl -s -w "\n%{http_code}" $API_URL/api/products)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Get products passed${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Get products failed (Status: $HTTP_CODE)${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 3: Get Categories
echo "3. Testing Get Categories..."
RESPONSE=$(curl -s -w "\n%{http_code}" $API_URL/api/products/categories)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Get categories passed${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Get categories failed (Status: $HTTP_CODE)${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Register New User
echo "4. Testing User Registration..."
RANDOM_EMAIL="test$(date +%s)@example.com"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"$RANDOM_EMAIL\",\"password\":\"password123\"}")
HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
BODY=$(echo "$REGISTER_RESPONSE" | head -n1)

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ User registration passed${NC}"
    TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ User registration failed (Status: $HTTP_CODE)${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 5: Login
echo "5. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"password123\"}")
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | head -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ User login passed${NC}"
    TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ User login failed (Status: $HTTP_CODE)${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 6: Get Current User (Authenticated)
if [ -n "$TOKEN" ]; then
    echo "6. Testing Get Current User (Authenticated)..."
    RESPONSE=$(curl -s -w "\n%{http_code}" $API_URL/api/users/me \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Get current user passed${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ Get current user failed (Status: $HTTP_CODE)${NC}"
        FAILED=$((FAILED + 1))
    fi
    echo ""

    # Test 7: Get Cart
    echo "7. Testing Get Cart (Authenticated)..."
    RESPONSE=$(curl -s -w "\n%{http_code}" $API_URL/api/cart \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Get cart passed${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ Get cart failed (Status: $HTTP_CODE)${NC}"
        FAILED=$((FAILED + 1))
    fi
    echo ""

    # Test 8: Get Orders
    echo "8. Testing Get Orders (Authenticated)..."
    RESPONSE=$(curl -s -w "\n%{http_code}" $API_URL/api/orders \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Get orders passed${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ Get orders failed (Status: $HTTP_CODE)${NC}"
        FAILED=$((FAILED + 1))
    fi
    echo ""

    # Test 9: Get Product Reviews
    echo "9. Testing Get Product Reviews..."
    PRODUCT_ID="cmgi4klrv000sghr4nydqxlmf"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/reviews/product/$PRODUCT_ID")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Get product reviews passed${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ Get product reviews failed (Status: $HTTP_CODE)${NC}"
        FAILED=$((FAILED + 1))
    fi
    echo ""
else
    echo -e "${YELLOW}⚠ Skipping authenticated tests (no token)${NC}"
    echo ""
fi

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo "Total Tests: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi



















