# 🚀 ShopVibe Setup Instructions

Complete setup guide to get ShopVibe running with payment integration.

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Payment Credentials](#payment-credentials)
3. [Running the Application](#running-the-application)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git (for cloning)

### 1. Install Dependencies

```bash
# From project root
npm install
```

This installs all dependencies for the monorepo (API + Web + Packages).

### 2. Setup Database

```bash
# Navigate to API directory
cd apps/api

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with sample data
npm run db:seed

# Return to root
cd ../..
```

You now have a SQLite database with sample products, users, and data!

---

## Payment Credentials

ShopVibe uses Stripe and PayPal for payment processing. You need to set up sandbox/test credentials.

### Choose Your Path:

#### 🚀 **Quick Setup (10 minutes)**
Follow: **[QUICK_SETUP.md](./QUICK_SETUP.md)**

#### 📖 **Detailed Setup (with explanations)**
Follow: **[PAYMENT_CREDENTIALS_GUIDE.md](./PAYMENT_CREDENTIALS_GUIDE.md)**

### Summary:
1. Create `apps/api/.env` from `apps/api/.env.example`
2. Get Stripe test key from: https://dashboard.stripe.com/test/apikeys
3. Get PayPal sandbox credentials from: https://developer.paypal.com/dashboard/
4. Add credentials to `apps/api/.env`
5. Run `./test-credentials.sh` to verify

---

## Running the Application

### Start Development Servers

```bash
# From project root
npm run dev
```

This starts:
- **API Server**: http://localhost:3002
- **Web Server**: http://localhost:3001

### Verify Servers Are Running

```bash
# Check API health
curl http://localhost:3002/health

# Should return: {"status":"OK","timestamp":"..."}
```

Open in browser: **http://localhost:3001**

---

## Testing

### 1. Manual Testing

#### Test User Flow:
1. **Register**: Create a new account
2. **Browse**: View products, search, filter
3. **Cart**: Add items to cart
4. **Checkout**: Place order with Stripe or PayPal
5. **Orders**: View order history
6. **Reviews**: Write product reviews

#### Test Stripe Payment:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)

### 2. Automated Testing

#### Test Credentials:
```bash
./test-credentials.sh
```

#### Test API Endpoints:
```bash
./test-api.sh
```

#### Test Payment Integration:
```bash
./test-payment-integration.sh
```

All tests should pass! ✅

---

## Project Structure

```
ShopVibe/
├── apps/
│   ├── api/              # Backend API (Express + Prisma)
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── services/ # Business logic
│   │   │   ├── middleware/
│   │   │   └── config/
│   │   ├── prisma/       # Database schema
│   │   └── .env          # ← Your credentials go here
│   │
│   └── web/              # Frontend (Next.js + React)
│       ├── src/
│       │   ├── app/      # Pages
│       │   ├── components/
│       │   ├── contexts/
│       │   └── services/
│       └── public/
│
├── packages/
│   ├── payments/         # Payment adapters (Stripe, PayPal)
│   └── shared/           # Shared types and utilities
│
├── test-credentials.sh   # Verify payment setup
├── test-api.sh           # Test core API
└── test-payment-integration.sh  # Test payments
```

---

## Configuration

### Environment Variables

All configuration is in `apps/api/.env`:

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# Authentication
JWT_SECRET="your-secret-key"

# Server
PORT=3002
FRONTEND_URL="http://localhost:3001"

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_your_key"

# PayPal (Sandbox Mode)
PAYPAL_CLIENT_ID="your_client_id"
PAYPAL_CLIENT_SECRET="your_secret"
PAYPAL_MODE="sandbox"
```

### Security Notes:
- ⚠️ Never commit `.env` files
- ⚠️ Use test/sandbox credentials in development
- ⚠️ Rotate keys if accidentally exposed

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3002
lsof -ti:3002 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Restart
npm run dev
```

### Database Issues

```bash
# Reset database
cd apps/api
rm prisma/dev.db
npm run db:push
npm run db:seed
cd ../..
```

### Payment Configuration Warnings

```bash
# Check what's wrong
./test-credentials.sh

# Common issues:
# - .env file doesn't exist (create it from .env.example)
# - Credentials are still placeholders (replace with real keys)
# - Server not restarted after adding credentials
```

### Module Not Found Errors

```bash
# Reinstall dependencies
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
npm install

# Rebuild
npm run build
```

### Prisma Client Issues

```bash
cd apps/api
npm run db:generate
cd ../..
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/users/me` - Get current user

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `GET /api/products/categories` - List categories

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart/items` - Add to cart
- `PUT /api/cart/items/:id` - Update quantity
- `DELETE /api/cart/items/:id` - Remove from cart

### Orders
- `GET /api/orders` - Order history
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Order details
- `POST /api/orders/:id/cancel` - Cancel order

### Payments
- `POST /api/payments/create-intent` - Create payment
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/refund` - Refund payment

### Reviews
- `GET /api/reviews/product/:id` - Get reviews
- `POST /api/reviews` - Submit review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

---

## Development Tools

### Prisma Studio (Database GUI)
```bash
cd apps/api
npm run db:studio
```
Opens at: http://localhost:5555

### View API Logs
```bash
# API server logs show in the terminal running `npm run dev`
# Look for errors, warnings, and request logs
```

### View Frontend Logs
```bash
# Browser console (F12 → Console tab)
# Frontend server logs show in terminal
```

---

## Next Steps

Once everything is running:

1. **Explore the App**: http://localhost:3001
2. **Test Payment Flow**: Add to cart → Checkout
3. **View Database**: Run `npm run db:studio`
4. **Read API Docs**: See endpoint list above
5. **Check Test Results**: Run all test scripts

---

## Production Deployment

Before deploying to production:

### ⚠️ Required Changes:
1. Switch to production payment credentials
2. Use PostgreSQL (instead of SQLite)
3. Enable rate limiting
4. Set secure JWT_SECRET
5. Configure CORS for production domain
6. Add SSL/HTTPS
7. Implement webhook handlers
8. Add logging and monitoring
9. Set up CI/CD pipeline

See: **DEPLOYMENT_GUIDE.md** (to be created)

---

## Resources

- **Quick Setup**: [QUICK_SETUP.md](./QUICK_SETUP.md)
- **Payment Guide**: [PAYMENT_CREDENTIALS_GUIDE.md](./PAYMENT_CREDENTIALS_GUIDE.md)
- **Payment Setup**: [PAYMENT_SETUP.md](./PAYMENT_SETUP.md)
- **Test Report**: [FINAL_TEST_REPORT.md](./FINAL_TEST_REPORT.md)
- **Implementation Status**: [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)

### External Links:
- **Stripe Docs**: https://stripe.com/docs
- **PayPal Docs**: https://developer.paypal.com/docs/
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

## Support

Having issues? Check:
1. Error messages in terminal
2. Browser console (F12)
3. API server logs
4. Test script outputs
5. Documentation files listed above

---

**Setup Date**: October 13, 2025  
**Version**: 1.0.0  
**Status**: ✅ Ready for Development

🎉 **Happy Coding!**















