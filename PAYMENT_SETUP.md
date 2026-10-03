# Payment Integration Setup Guide

This guide will help you set up Stripe and PayPal payment processing for ShopVibe.

## Overview

ShopVibe supports two payment methods:
- **Stripe** - Credit card processing
- **PayPal** - PayPal account and credit card processing

The payment flow is:
1. User creates an order (status: PENDING)
2. Frontend requests payment intent from backend
3. Backend creates payment intent with Stripe/PayPal
4. User completes payment (in production, using Stripe Elements or PayPal Buttons)
5. Frontend verifies payment with backend
6. Backend confirms payment and updates order status to CONFIRMED

## Setting Up Stripe (Test Mode)

### 1. Create a Stripe Account
1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up for a free account
3. Complete the registration process

### 2. Get Your Test API Keys
1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`) - Used on frontend (future enhancement)
   - **Secret key** (starts with `sk_test_`) - Used on backend **KEEP THIS SECRET!**

### 3. Add Stripe Key to Environment
1. Navigate to `apps/api/` directory
2. Create a `.env` file (or edit existing one)
3. Add your Stripe secret key:
```bash
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
```

### 4. Testing Stripe Payments
Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Use any future expiry date and any 3-digit CVC

## Setting Up PayPal (Sandbox Mode)

### 1. Create a PayPal Developer Account
1. Go to [https://developer.paypal.com/](https://developer.paypal.com/)
2. Click "Log in to Dashboard"
3. Sign up or log in with your PayPal account

### 2. Create a Sandbox App
1. Go to [https://developer.paypal.com/dashboard/applications/sandbox](https://developer.paypal.com/dashboard/applications/sandbox)
2. Click "Create App"
3. Enter an app name (e.g., "ShopVibe Dev")
4. Click "Create App"

### 3. Get Your Sandbox Credentials
After creating the app, you'll see:
- **Client ID** - Used to identify your app
- **Secret** - Used to authenticate your app **KEEP THIS SECRET!**

### 4. Add PayPal Credentials to Environment
1. Navigate to `apps/api/` directory
2. Add to your `.env` file:
```bash
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_secret_here
PAYPAL_MODE=sandbox
```

### 5. Create Test PayPal Accounts
1. Go to [https://developer.paypal.com/dashboard/accounts](https://developer.paypal.com/dashboard/accounts)
2. You'll see pre-created test accounts (Personal and Business)
3. Use the Personal account credentials to test payments

## Environment Variables

Your `apps/api/.env` file should look like this:

```bash
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret (for authentication)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"

# PayPal Configuration
PAYPAL_CLIENT_ID="your_paypal_client_id_here"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret_here"
PAYPAL_MODE="sandbox"

# Server Configuration
PORT=3002
FRONTEND_URL="http://localhost:3001"
```

## Testing the Payment Flow

### 1. Start the Application
```bash
# From the project root
npm run dev
```

This starts both the API server (port 3002) and web app (port 3001).

### 2. Test Stripe Payment

1. Add items to cart
2. Go to checkout
3. Select "Credit Card (Stripe)" as payment method
4. Click "Place Order"
5. You'll see a "Payment Initiated" screen with:
   - Payment ID
   - Client Secret (truncated)
6. Click "Confirm Payment" to simulate successful payment
7. Order status will update to CONFIRMED

### 3. Test PayPal Payment

1. Add items to cart
2. Go to checkout
3. Select "PayPal" as payment method
4. Click "Place Order"
5. You'll see a "Payment Initiated" screen with:
   - Payment ID
   - PayPal Approval URL (in production, user would be redirected here)
6. Click "Confirm Payment" to simulate successful payment
7. Order status will update to CONFIRMED

## Current Implementation Status

### ✅ Implemented
- Backend payment service with Stripe & PayPal adapters
- Payment intent creation API
- Payment verification API
- Order status updates based on payment
- Frontend payment flow UI

### 🚧 Demo Mode
The current implementation uses **simulated payment completion**. The flow is:
1. User places order → Order created (PENDING)
2. Payment intent created with Stripe/PayPal
3. **User clicks "Confirm Payment"** → Simulates successful payment
4. Backend verifies and updates order to CONFIRMED

### 🔮 Production Enhancements Needed

To make this production-ready, you would need to add:

#### For Stripe:
- Install `@stripe/stripe-js` on frontend
- Implement Stripe Elements for card input
- User enters real card details
- Stripe handles payment securely
- Webhook handler for payment confirmation

#### For PayPal:
- Install `@paypal/react-paypal-js` on frontend
- Implement PayPal Buttons
- User clicks PayPal button → redirected to PayPal
- User completes payment on PayPal
- User redirected back to app
- Webhook handler for payment confirmation

#### For Both:
- Implement webhook endpoints to handle async payment events
- Add 3D Secure support for Stripe
- Add proper error handling and retry logic
- Implement payment failure handling
- Add refund functionality in admin panel

## Troubleshooting

### "Stripe is not configured" Error
- Check that `STRIPE_SECRET_KEY` is set in `apps/api/.env`
- Restart the API server after adding the key
- Verify the key starts with `sk_test_`

### "PayPal is not configured" Error
- Check that both `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set
- Restart the API server after adding the credentials
- Verify `PAYPAL_MODE` is set to `sandbox`

### Payment Intent Creation Fails
- Check API server logs for detailed error messages
- Verify your API keys are correct
- Ensure your Stripe/PayPal account is active

### Order Stays in PENDING Status
- Check that payment verification was successful
- Look for errors in browser console
- Check API logs for verification errors

## Security Notes

⚠️ **IMPORTANT SECURITY REMINDERS:**

1. **Never commit `.env` files** - They're in `.gitignore` for a reason
2. **Never expose secret keys** in frontend code
3. **Use test/sandbox keys** for development
4. **Rotate keys** if they're accidentally exposed
5. **Use environment-specific keys** (test for dev, live for production)
6. **Enable webhook signature verification** in production
7. **Implement rate limiting** on payment endpoints
8. **Log payment attempts** for audit purposes

## Getting Help

- **Stripe Documentation**: https://stripe.com/docs
- **PayPal Documentation**: https://developer.paypal.com/docs/
- **Stripe Test Cards**: https://stripe.com/docs/testing
- **PayPal Sandbox**: https://developer.paypal.com/docs/api-basics/sandbox/

## Next Steps

Once you have basic payment processing working:

1. **Add Webhook Support**
   - Handle async payment confirmations
   - Update order status automatically
   - Send confirmation emails

2. **Enhance Frontend**
   - Add Stripe Elements for card input
   - Add PayPal Buttons for seamless checkout
   - Improve error messages

3. **Add Admin Features**
   - View payment transactions
   - Process refunds
   - Handle disputes

4. **Prepare for Production**
   - Switch to live API keys
   - Test with real (small) transactions
   - Set up monitoring and alerts
   - Implement proper logging


















