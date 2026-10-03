#!/bin/bash

# ShopVibe Environment Setup Script
# This script helps you create your .env file from the template

echo "=================================================="
echo "   ShopVibe Environment File Setup"
echo "=================================================="
echo ""

ENV_FILE="apps/api/.env"
ENV_TEMPLATE="ENV_TEMPLATE.txt"

# Check if template file exists
if [ ! -f "$ENV_TEMPLATE" ]; then
    echo "❌ Error: $ENV_TEMPLATE not found"
    echo "This file should exist in the project root."
    exit 1
fi

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  Warning: $ENV_FILE already exists"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Your existing .env file was not modified."
        exit 0
    fi
    echo ""
fi

# Copy template
echo "📝 Creating $ENV_FILE from template..."
cp "$ENV_TEMPLATE" "$ENV_FILE"
echo "✅ File created!"
echo ""

echo "=================================================="
echo "   Next Steps"
echo "=================================================="
echo ""
echo "Your .env file has been created with placeholder values."
echo ""
echo "To complete setup, you need to add your payment credentials:"
echo ""
echo "1. Get Stripe credentials:"
echo "   → Visit: https://dashboard.stripe.com/test/apikeys"
echo "   → Copy your Secret Key (starts with sk_test_)"
echo ""
echo "2. Get PayPal credentials:"
echo "   → Visit: https://developer.paypal.com/dashboard/applications/sandbox"
echo "   → Create an app and copy Client ID and Secret"
echo ""
echo "3. Edit your .env file:"
echo "   → Open: $ENV_FILE"
echo "   → Replace the placeholder values with your actual credentials"
echo ""
echo "4. Verify setup:"
echo "   → Run: ./test-credentials.sh"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - QUICK_SETUP.md (fast setup in 10 minutes)"
echo "   - PAYMENT_CREDENTIALS_GUIDE.md (detailed guide)"
echo ""
echo "=================================================="
echo ""

# Ask if user wants to open the file
read -p "Open .env file in editor now? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Try different editors
    if command -v code &> /dev/null; then
        code "$ENV_FILE"
    elif command -v nano &> /dev/null; then
        nano "$ENV_FILE"
    elif command -v vim &> /dev/null; then
        vim "$ENV_FILE"
    else
        echo "Please manually edit: $ENV_FILE"
    fi
fi

echo ""
echo "✅ Setup complete! Don't forget to add your credentials."
echo ""

