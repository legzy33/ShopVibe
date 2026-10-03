#!/bin/bash

# ShopVibe Payment Credentials Test Script
# This script verifies that payment credentials are properly configured

echo "=================================================="
echo "   ShopVibe Payment Credentials Verification"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env file exists
echo "📁 Checking for .env file..."
if [ ! -f "apps/api/.env" ]; then
    echo -e "${RED}❌ FAILED${NC}: apps/api/.env file not found"
    echo ""
    echo "Please create the .env file:"
    echo "  1. Copy the template: cp apps/api/.env.example apps/api/.env"
    echo "  2. Edit apps/api/.env and add your credentials"
    echo "  3. See PAYMENT_CREDENTIALS_GUIDE.md for detailed instructions"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ PASSED${NC}: .env file exists"
echo ""

# Load environment variables
echo "🔧 Loading environment variables..."
set -a
source apps/api/.env
set +a
echo -e "${GREEN}✅ PASSED${NC}: Environment variables loaded"
echo ""

# Check required variables
echo "=================================================="
echo "   Checking Required Environment Variables"
echo "=================================================="
echo ""

ERRORS=0

# Check DATABASE_URL
echo -n "Checking DATABASE_URL... "
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ MISSING${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ SET${NC}"
fi

# Check JWT_SECRET
echo -n "Checking JWT_SECRET... "
if [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}❌ MISSING${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ SET${NC}"
fi

# Check PORT
echo -n "Checking PORT... "
if [ -z "$PORT" ]; then
    echo -e "${YELLOW}⚠️  MISSING (will default to 3002)${NC}"
else
    echo -e "${GREEN}✅ SET${NC} (${PORT})"
fi

# Check FRONTEND_URL
echo -n "Checking FRONTEND_URL... "
if [ -z "$FRONTEND_URL" ]; then
    echo -e "${YELLOW}⚠️  MISSING${NC}"
else
    echo -e "${GREEN}✅ SET${NC} (${FRONTEND_URL})"
fi

echo ""
echo "=================================================="
echo "   Checking Payment Provider Credentials"
echo "=================================================="
echo ""

# Check Stripe
echo "💳 STRIPE CONFIGURATION"
echo "------------------------"
echo -n "Checking STRIPE_SECRET_KEY... "
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${RED}❌ MISSING${NC}"
    echo "   → Get your key from: https://dashboard.stripe.com/test/apikeys"
    ERRORS=$((ERRORS + 1))
elif [[ "$STRIPE_SECRET_KEY" == "sk_test_your_stripe_secret_key_here" ]]; then
    echo -e "${YELLOW}⚠️  PLACEHOLDER${NC}"
    echo "   → Replace with your actual Stripe test key"
    echo "   → Get your key from: https://dashboard.stripe.com/test/apikeys"
    ERRORS=$((ERRORS + 1))
elif [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
    echo -e "${GREEN}✅ CONFIGURED${NC}"
    echo "   → Key format: ${STRIPE_SECRET_KEY:0:20}...${STRIPE_SECRET_KEY: -4}"
    echo "   → Environment: TEST MODE ✓"
elif [[ "$STRIPE_SECRET_KEY" == sk_live_* ]]; then
    echo -e "${YELLOW}⚠️  LIVE KEY DETECTED${NC}"
    echo "   → You're using a production key in development!"
    echo "   → Switch to a test key: https://dashboard.stripe.com/test/apikeys"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${RED}❌ INVALID FORMAT${NC}"
    echo "   → Key should start with 'sk_test_' or 'sk_live_'"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check PayPal
echo "🅿️  PAYPAL CONFIGURATION"
echo "------------------------"

# Check Client ID
echo -n "Checking PAYPAL_CLIENT_ID... "
if [ -z "$PAYPAL_CLIENT_ID" ]; then
    echo -e "${RED}❌ MISSING${NC}"
    echo "   → Get from: https://developer.paypal.com/dashboard/applications/sandbox"
    ERRORS=$((ERRORS + 1))
elif [[ "$PAYPAL_CLIENT_ID" == "your_paypal_client_id_here" ]]; then
    echo -e "${YELLOW}⚠️  PLACEHOLDER${NC}"
    echo "   → Replace with your actual PayPal Client ID"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ CONFIGURED${NC}"
    echo "   → Client ID: ${PAYPAL_CLIENT_ID:0:20}...${PAYPAL_CLIENT_ID: -4}"
fi

# Check Client Secret
echo -n "Checking PAYPAL_CLIENT_SECRET... "
if [ -z "$PAYPAL_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ MISSING${NC}"
    echo "   → Get from: https://developer.paypal.com/dashboard/applications/sandbox"
    ERRORS=$((ERRORS + 1))
elif [[ "$PAYPAL_CLIENT_SECRET" == "your_paypal_client_secret_here" ]]; then
    echo -e "${YELLOW}⚠️  PLACEHOLDER${NC}"
    echo "   → Replace with your actual PayPal Client Secret"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ CONFIGURED${NC}"
    echo "   → Secret: ${PAYPAL_CLIENT_SECRET:0:20}...***"
fi

# Check PayPal Mode
echo -n "Checking PAYPAL_MODE... "
if [ -z "$PAYPAL_MODE" ]; then
    echo -e "${YELLOW}⚠️  MISSING (will default to sandbox)${NC}"
elif [[ "$PAYPAL_MODE" == "sandbox" ]]; then
    echo -e "${GREEN}✅ SET${NC} (sandbox mode)"
elif [[ "$PAYPAL_MODE" == "live" ]]; then
    echo -e "${YELLOW}⚠️  LIVE MODE${NC}"
    echo "   → You're in production mode!"
    echo "   → Set PAYPAL_MODE=sandbox for testing"
else
    echo -e "${RED}❌ INVALID${NC}"
    echo "   → Must be 'sandbox' or 'live'"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=================================================="
echo "   Verification Summary"
echo "=================================================="
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "Your payment credentials are properly configured."
    echo ""
    echo "Next steps:"
    echo "  1. Start the servers: npm run dev"
    echo "  2. Open the app: http://localhost:3001"
    echo "  3. Test payment flow:"
    echo "     - Add items to cart"
    echo "     - Go to checkout"
    echo "     - Select payment method (Stripe or PayPal)"
    echo "     - Complete payment"
    echo ""
    echo "  4. Run full test suite: ./test-payment-integration.sh"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERRORS ERROR(S) FOUND${NC}"
    echo ""
    echo "Please fix the errors above and run this script again."
    echo ""
    echo "For detailed setup instructions, see:"
    echo "  📖 PAYMENT_CREDENTIALS_GUIDE.md"
    echo ""
    exit 1
fi















