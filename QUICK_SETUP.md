# Quick Setup Guide - Payment Credentials

Get your ShopVibe payment integration running in under 10 minutes!

## Step 1: Create Environment File (1 minute)

```bash
# Copy the template
cp apps/api/.env.example apps/api/.env
```

Your `apps/api/.env` file is now created with placeholder values.

## Step 2: Get Stripe Credentials (3-5 minutes)

### Quick Steps:
1. Go to: https://dashboard.stripe.com/register
2. Sign up (free)
3. Once logged in, go to: https://dashboard.stripe.com/test/apikeys
4. Copy your **Secret key** (starts with `sk_test_`)
5. Open `apps/api/.env` and replace:
   ```
   STRIPE_SECRET_KEY="sk_test_your_actual_key_here"
   ```

✅ **Done!** Stripe is configured.

## Step 3: Get PayPal Credentials (3-5 minutes)

### Quick Steps:
1. Go to: https://developer.paypal.com/
2. Click "Log In to Dashboard" (use existing PayPal or create new account)
3. Go to: https://developer.paypal.com/dashboard/applications/sandbox
4. Click **"Create App"**
5. App Name: `ShopVibe Dev`, then click Create
6. Copy your **Client ID** and **Secret**
7. Open `apps/api/.env` and replace:
   ```
   PAYPAL_CLIENT_ID="your_actual_client_id"
   PAYPAL_CLIENT_SECRET="your_actual_secret"
   ```

✅ **Done!** PayPal is configured.

## Step 4: Verify Setup (1 minute)

```bash
# Run verification script
./test-credentials.sh
```

You should see:
```
✅ ALL CHECKS PASSED!
```

## Step 5: Start the Application

```bash
# Start both API and web servers
npm run dev
```

Watch the API server console - you should **NOT** see these warnings:
- ❌ "STRIPE_SECRET_KEY not found"
- ❌ "PayPal credentials not found"

If the warnings are gone, you're all set! ✅

## Step 6: Test It Out!

1. Open: http://localhost:3001
2. Register/Login
3. Add products to cart
4. Checkout with Stripe or PayPal
5. Watch the payment flow work! 🎉

---

## Troubleshooting

### Script shows placeholder warnings?

Your credentials are still the default placeholders. Make sure you:
1. Actually copied your keys from Stripe/PayPal dashboards
2. Pasted them into `apps/api/.env` (not `.env.example`)
3. Removed any extra quotes or spaces

### Still seeing configuration warnings?

1. Double-check your `.env` file path: `apps/api/.env`
2. Restart the servers: Stop with Ctrl+C, then run `npm run dev` again
3. Run `./test-credentials.sh` to diagnose issues

### Need more help?

See the detailed guide: **PAYMENT_CREDENTIALS_GUIDE.md**

---

**Total Setup Time**: ~10 minutes  
**Difficulty**: Easy  
**Cost**: Free (test/sandbox accounts)

🎉 **That's it! Your payment integration is ready!**















