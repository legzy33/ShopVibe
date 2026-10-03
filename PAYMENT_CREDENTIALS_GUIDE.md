# Payment Credentials Setup Guide

This guide will walk you through obtaining Stripe and PayPal sandbox credentials for testing ShopVibe's payment integration.

## Overview

ShopVibe uses:
- **Stripe** for credit card payments
- **PayPal** for PayPal account and credit card payments

Both services offer **sandbox/test environments** where you can test payment processing without using real money.

---

## Prerequisites

- A computer with internet access
- An email address for account registration
- 15-20 minutes of your time

---

## Part 1: Setting Up Stripe (Test Mode)

### Step 1: Create a Stripe Account

1. Open your browser and go to: **https://dashboard.stripe.com/register**
2. Fill in the registration form:
   - Email address
   - Full name
   - Password
3. Click **"Create account"**
4. Verify your email address (check your inbox for verification email)

### Step 2: Access Your Dashboard

1. After email verification, log in to: **https://dashboard.stripe.com/**
2. You'll be in **Test Mode** by default (look for "Test mode" toggle in the top-right)
3. Stripe automatically provides test API keys - no additional setup needed!

### Step 3: Get Your Secret Key

1. In the Stripe Dashboard, click **"Developers"** in the left sidebar
2. Click **"API keys"**
3. You'll see two types of keys:
   - **Publishable key** (starts with `pk_test_`) - For frontend (not needed yet)
   - **Secret key** (starts with `sk_test_`) - For backend **← YOU NEED THIS**

4. Click **"Reveal test key"** next to the Secret key
5. Copy the entire key (it should look like: `sk_test_51Abc...xyz`)

### Step 4: Add Stripe Key to Your Environment

1. Open your terminal/code editor
2. Navigate to the ShopVibe project: `cd /path/to/ShopVibe`
3. Open the file: `apps/api/.env`
4. Find the line: `STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"`
5. Replace `sk_test_your_stripe_secret_key_here` with your actual key:
   ```
   STRIPE_SECRET_KEY="sk_test_51Abc...xyz"
   ```
6. Save the file

### Step 5: Test Your Stripe Setup

Stripe provides test card numbers for testing:

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Payment succeeds |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0000 0000 9995` | ❌ Insufficient funds |

- Use **any future expiration date** (e.g., 12/25)
- Use **any 3-digit CVC** (e.g., 123)
- Use **any ZIP code** (e.g., 12345)

✅ **Stripe setup complete!**

---

## Part 2: Setting Up PayPal (Sandbox Mode)

### Step 1: Create a PayPal Developer Account

1. Go to: **https://developer.paypal.com/**
2. Click **"Log In to Dashboard"** in the top-right corner
3. Two options:
   - **If you have a PayPal account**: Log in with your existing PayPal credentials
   - **If you don't have a PayPal account**: Click "Sign Up" and create a personal PayPal account first

### Step 2: Access the Developer Dashboard

1. After logging in, you'll be at: **https://developer.paypal.com/dashboard/**
2. Look for **"Apps & Credentials"** in the top navigation
3. Click on it

### Step 3: Create a Sandbox App

1. Make sure you're on the **"Sandbox"** tab (NOT "Live")
2. Under "REST API apps", click **"Create App"**
3. Fill in the form:
   - **App Name**: Enter `ShopVibe Dev` (or any name you like)
   - **App Type**: Select **"Merchant"**
4. Click **"Create App"**

### Step 4: Get Your Sandbox Credentials

After creating the app, you'll see:

1. **Client ID**: A long string of characters (looks like: `AbCdEf123...`)
2. **Secret**: Click **"Show"** to reveal it

⚠️ **IMPORTANT**: Both the Client ID and Secret are sensitive. Keep them private!

### Step 5: Add PayPal Credentials to Your Environment

1. Open the file: `apps/api/.env`
2. Find these lines:
   ```
   PAYPAL_CLIENT_ID="your_paypal_client_id_here"
   PAYPAL_CLIENT_SECRET="your_paypal_client_secret_here"
   PAYPAL_MODE="sandbox"
   ```
3. Replace the placeholders with your actual credentials:
   ```
   PAYPAL_CLIENT_ID="AbCdEf123..."
   PAYPAL_CLIENT_SECRET="XyZ789..."
   PAYPAL_MODE="sandbox"
   ```
4. Save the file

### Step 6: Create Test PayPal Accounts

PayPal automatically creates test buyer and seller accounts for you!

1. In the Developer Dashboard, go to: **"Testing Tools" → "Sandbox Accounts"**
2. You'll see accounts like:
   - **Personal** (Buyer account) - Use this to test purchases
   - **Business** (Seller account) - Your app receives payments here

3. To see login credentials:
   - Click **"..."** next to an account
   - Click **"View/Edit Account"**
   - Note the email and password

✅ **PayPal setup complete!**

---

## Part 3: Verify Your Setup

### Step 1: Check Your Environment File

Your `apps/api/.env` file should now look like this:

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# Authentication
JWT_SECRET="shopvibe-dev-secret-key-2025"

# Server
PORT=3002
FRONTEND_URL="http://localhost:3001"

# Stripe (✅ Filled in)
STRIPE_SECRET_KEY="sk_test_51Abc...xyz"

# PayPal (✅ Filled in)
PAYPAL_CLIENT_ID="AbCdEf123..."
PAYPAL_CLIENT_SECRET="XyZ789..."
PAYPAL_MODE="sandbox"
```

### Step 2: Run the Verification Script

1. Open your terminal
2. Navigate to the project root: `cd /path/to/ShopVibe`
3. Run the test script:
   ```bash
   chmod +x test-credentials.sh
   ./test-credentials.sh
   ```

This script will verify that your credentials are configured correctly.

### Step 3: Restart Your Servers

If the servers are already running, restart them to load the new environment variables:

1. Stop the servers: Press `Ctrl+C` in the terminal running `npm run dev`
2. Start them again: `npm run dev`
3. Check the API server output - you should **NOT** see these warnings:
   - ❌ "STRIPE_SECRET_KEY not found"
   - ❌ "PayPal credentials not found"

If the warnings are gone, your credentials are loaded! ✅

### Step 4: Test Payment Integration

Now let's test the full payment flow:

#### Test Stripe Payment:

1. Open the app: **http://localhost:3001**
2. Log in or create an account
3. Add some products to your cart
4. Click "Checkout"
5. Select **"Credit Card (Stripe)"** as payment method
6. Click **"Place Order"**
7. You should see:
   - ✅ "Payment Initiated" screen
   - ✅ Payment ID displayed
   - ✅ Client Secret shown (truncated for security)
8. Click **"Confirm Payment"**
9. Order should update to **CONFIRMED** status

#### Test PayPal Payment:

1. Add items to cart again
2. Go to checkout
3. Select **"PayPal"** as payment method
4. Click **"Place Order"**
5. You should see:
   - ✅ "Payment Initiated" screen
   - ✅ PayPal Order ID displayed
   - ✅ Approval URL shown
6. Click **"Confirm Payment"**
7. Order should update to **CONFIRMED** status

### Step 5: Run the Full Test Suite

```bash
./test-payment-integration.sh
```

You should now see:
- ✅ All core API tests passing (9/9)
- ✅ All payment infrastructure tests passing (6/6)
- ✅ Payment intent creation succeeding
- ✅ No 500 errors on payment endpoints

---

## Troubleshooting

### Issue: "Stripe is not configured" Error

**Cause**: Stripe secret key is missing or invalid

**Solutions**:
1. Verify the key starts with `sk_test_`
2. Make sure there are no extra spaces or quotes
3. Check that you copied the entire key
4. Restart the API server after adding the key
5. Try generating a new key in Stripe Dashboard

### Issue: "PayPal is not configured" Error

**Cause**: PayPal credentials are missing or invalid

**Solutions**:
1. Verify both Client ID and Secret are filled in
2. Make sure `PAYPAL_MODE="sandbox"`
3. Check for extra spaces or quotes
4. Restart the API server after adding credentials
5. Verify your app is in "Sandbox" mode in PayPal Dashboard

### Issue: Payment Intent Creation Returns 500 Error

**Stripe Issues**:
- Invalid API key format
- API key from wrong environment (live key in test mode)
- Stripe account not activated
- Network connectivity issues

**PayPal Issues**:
- Wrong environment (using live credentials with sandbox mode)
- App not properly configured in PayPal Dashboard
- Credentials copied incorrectly

**General Solution**:
1. Check API server logs for detailed error messages
2. Verify credentials in PayPal/Stripe dashboards
3. Try creating a new app/key
4. Test credentials using curl commands (see below)

### Issue: Order Stays in PENDING Status

**Causes**:
- Payment verification failed
- Network error during verification
- Payment ID mismatch

**Solutions**:
1. Check browser console for JavaScript errors
2. Check API logs for verification errors
3. Verify payment ID is being passed correctly
4. Try the payment flow again

### Testing Credentials with curl

**Test Stripe**:
```bash
curl https://api.stripe.com/v1/charges \
  -u sk_test_YOUR_KEY: \
  -d amount=2000 \
  -d currency=usd \
  -d source=tok_visa
```

**Test PayPal**:
```bash
curl -v -X POST https://api.sandbox.paypal.com/v1/oauth2/token \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "CLIENT_ID:SECRET" \
  -d "grant_type=client_credentials"
```

---

## Security Best Practices

### ✅ DO:
- Use test/sandbox credentials for development
- Keep secret keys in `.env` files (never in code)
- Add `.env` to `.gitignore`
- Rotate keys if accidentally exposed
- Use different keys for dev/staging/production
- Enable webhook signature verification

### ❌ DON'T:
- Commit `.env` files to Git
- Share secret keys via email/chat
- Use production keys in development
- Store keys in frontend code
- Expose keys in screenshots/videos
- Use the same keys across environments

---

## Next Steps

Now that your payment credentials are configured:

### Current Functionality (Demo Mode):
- ✅ Orders created with PENDING status
- ✅ Payment intents created with Stripe/PayPal
- ✅ Payment credentials returned to frontend
- ✅ Simulated payment completion
- ✅ Order status updated to CONFIRMED

### For Production (Future Enhancements):
1. **Add Stripe Elements**: Real credit card input UI
2. **Add PayPal Buttons**: Seamless PayPal checkout
3. **Implement Webhooks**: Async payment confirmations
4. **Add 3D Secure**: Enhanced security for Stripe
5. **Error Handling**: Better user feedback
6. **Refund Functionality**: Admin panel for refunds

---

## Resources

### Documentation:
- **Stripe Docs**: https://stripe.com/docs
- **PayPal Docs**: https://developer.paypal.com/docs/

### Testing Guides:
- **Stripe Test Cards**: https://stripe.com/docs/testing
- **PayPal Sandbox**: https://developer.paypal.com/docs/api-basics/sandbox/

### Dashboards:
- **Stripe Dashboard**: https://dashboard.stripe.com/
- **PayPal Developer**: https://developer.paypal.com/dashboard/

---

## Support

If you encounter issues not covered in this guide:

1. **Check API logs**: Look for detailed error messages
2. **Check browser console**: Look for frontend errors
3. **Review PAYMENT_SETUP.md**: Additional technical details
4. **Check test results**: Run `./test-payment-integration.sh`
5. **Stripe Support**: https://support.stripe.com/
6. **PayPal Support**: https://developer.paypal.com/support/

---

**Setup Date**: October 13, 2025  
**Last Updated**: October 13, 2025  
**Status**: Ready for Testing

🎉 **Congratulations! Your payment integration is now configured and ready to test!**















