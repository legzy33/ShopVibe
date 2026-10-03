# ShopVibe API

Backend API for the ShopVibe e-commerce platform built with Express.js, Prisma, and SQLite.

## Features

- **Authentication & Authorization**: JWT-based auth with bcrypt password hashing
- **Product Management**: CRUD operations for products with search and filtering
- **Shopping Cart**: Persistent cart management with user sessions
- **Order Processing**: Complete order lifecycle management
- **Review System**: Product reviews and ratings
- **Database**: SQLite with Prisma ORM
- **Security**: Rate limiting, CORS, helmet, input validation
- **API Documentation**: RESTful API with proper error handling

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize database**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3002`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (auth required)

### Cart
- `GET /api/cart` - Get user's cart (auth required)
- `POST /api/cart/items` - Add item to cart (auth required)
- `PUT /api/cart/items/:id` - Update cart item (auth required)
- `DELETE /api/cart/items/:id` - Remove cart item (auth required)
- `DELETE /api/cart` - Clear cart (auth required)

### Orders
- `GET /api/orders` - Get user's orders (auth required)
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status (auth required)
- `POST /api/orders/:id/cancel` - Cancel order (auth required)

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Create review (auth required)
- `PUT /api/reviews/:id` - Update review (auth required)
- `DELETE /api/reviews/:id` - Delete review (auth required)

### Users
- `GET /api/users/profile` - Get user profile (auth required)
- `PUT /api/users/profile` - Update user profile (auth required)
- `PUT /api/users/password` - Change password (auth required)

## Database Schema

The API uses SQLite with Prisma ORM. Key models include:

- **User**: User accounts with authentication
- **Product**: Product catalog with categories and inventory
- **CartItem**: Shopping cart items linked to users
- **Order**: Order records with status tracking
- **OrderItem**: Individual items within orders
- **Review**: Product reviews and ratings

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

## Testing

Test the API using the included sample data:

**Test User Credentials:**
- Email: `john@example.com`
- Password: `password123`

**Sample Products:** 10 products across different categories
**Sample Reviews:** Product reviews from test users
**Sample Orders:** Complete order with delivered status 