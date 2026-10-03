#!/bin/bash

# ShopVibe Payment Credentials Setup Script
# This script helps you set up Stripe and PayPal test credentials

set -e

echo "🔐 ShopVibe Payment Credentials Setup"
echo "====================================="
echo ""

# Check if .env already exists
if [ -f "apps/api/.env" ]; then
    echo "✅ .env file already exists at apps/api/.env"
    echo ""
else
    echo "📝 Creating .env file from template..."
    cp ENV_TEMPLATE.txt apps/api/.env
    echo "✅ Created apps/api/.env"
    echo ""
fi

echo "📋 STEP 1: Set up Stripe Test Credentials"
echo "==========================================="
echo ""
echo "1. Go to: https://dashboard.stripe.com/register"
echo "   (Sign up for a free Stripe account if you don't have one)"
echo ""
echo "2. After signing up, go to: https://dashboard.stripe.com/test/apikeys"
echo ""
echo "3. Copy your 'Secret key' (starts with sk_test_...)"
echo "   ⚠️  WARNING: Keep this secret! Never share or commit it."
echo ""
echo "4. Paste your Stripe Secret Key here:"
read -p "STRIPE_SECRET_KEY: " stripe_key

if [ ! -z "$stripe_key" ]; then
    # Update the .env file with Stripe key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|STRIPE_SECRET_KEY=\"sk_test_your_stripe_secret_key_here\"|STRIPE_SECRET_KEY=\"$stripe_key\"|g" apps/api/.env
    else
        # Linux
        sed -i "s|STRIPE_SECRET_KEY=\"sk_test_your_stripe_secret_key_here\"|STRIPE_SECRET_KEY=\"$stripe_key\"|g" apps/api/.env
    fi
    echo "✅ Stripe Secret Key saved!"
else
    echo "⏭️  Skipping Stripe setup (you can add it manually to apps/api/.env later)"
fi

echo ""
echo "📋 STEP 2: Set up PayPal Sandbox Credentials"
echo "============================================="
echo ""
echo "1. Go to: https://developer.paypal.com/dashboard"
echo "   (Sign in with your PayPal account)"
echo ""
echo "2. Click 'Apps & Credentials' in the menu"
echo ""
echo "3. Make sure 'Sandbox' is selected at the top"
echo ""
echo "4. Click 'Create App' button"
echo "   - App Name: ShopVibe Dev"
echo "   - Click 'Create App'"
echo ""
echo "5. You'll see your credentials:"
echo "   - Client ID (starts with A...)"
echo "   - Secret (click 'Show' to reveal it)"
echo ""
echo "6. Paste your PayPal Client ID here:"
read -p "PAYPAL_CLIENT_ID: " paypal_client_id

if [ ! -z "$paypal_client_id" ]; then
    echo ""
    echo "7. Paste your PayPal Client Secret here:"
    read -p "PAYPAL_CLIENT_SECRET: " paypal_secret
    
    if [ ! -z "$paypal_secret" ]; then
        # Update the .env file with PayPal credentials
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|PAYPAL_CLIENT_ID=\"your_paypal_client_id_here\"|PAYPAL_CLIENT_ID=\"$paypal_client_id\"|g" apps/api/.env
            sed -i '' "s|PAYPAL_CLIENT_SECRET=\"your_paypal_client_secret_here\"|PAYPAL_CLIENT_SECRET=\"$paypal_secret\"|g" apps/api/.env
        else
            # Linux
            sed -i "s|PAYPAL_CLIENT_ID=\"your_paypal_client_id_here\"|PAYPAL_CLIENT_ID=\"$paypal_client_id\"|g" apps/api/.env
            sed -i "s|PAYPAL_CLIENT_SECRET=\"your_paypal_client_secret_here\"|PAYPAL_CLIENT_SECRET=\"$paypal_secret\"|g" apps/api/.env
        fi
        echo "✅ PayPal credentials saved!"
    else
        echo "⏭️  Skipping PayPal setup"
    fi
else
    echo "⏭️  Skipping PayPal setup (you can add it manually to apps/api/.env later)"
fi

echo ""
echo "✨ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Restart your API server if it's running:"
echo "   - Press Ctrl+C to stop it"
echo "   - Run 'npm run dev' to restart"
echo ""
echo "2. Test your payment integration:"
echo "   ./test-payment-integration.sh"
echo ""
echo "3. Your credentials are stored in: apps/api/.env"
echo "   ⚠️  Never commit this file to version control!"
echo ""













