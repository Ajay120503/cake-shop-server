# 🎂 Cake Shop Backend API

Production-ready Node.js + Express + MongoDB backend for a Cake Shop E-Commerce platform.

## Features

- 🔐 JWT Authentication with Refresh Token rotation
- 🛡️ Helmet, CORS, Rate Limiting, Mongo Sanitize
- ☁️ Cloudinary image uploads (single + multiple)
- 💳 Razorpay payment integration (with COD fallback + mock mode)
- 📧 Nodemailer email notifications
- 📊 Admin analytics dashboard
- 🎟️ Coupon system
- ⭐ Product reviews & ratings
- 🛒 Cart, Wishlist, Addresses
- 📦 Order management with tracking
- 🏪 Store settings (CMS for home page)
- 📇 Newsletter subscribers

## Quick Start

```bash
# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your credentials

# Seed database (optional - creates admin, customer, categories, products, coupons)
SEED_DB=true npm run seed

# Run dev
npm run dev

# Or production
npm start
```

## Default Credentials (after seeding)

- **Admin:** admin@cakeshop.com / admin123
- **Customer:** customer@cakeshop.com / customer123

## API Endpoints

Base URL: `/api/v1`

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | Register customer |
| `POST /auth/login` | Login |
| `POST /auth/google` | Google OAuth login |
| `POST /auth/forgot-password` | Request password reset |
| `PUT  /auth/reset-password/:token` | Reset password |
| `GET  /auth/me` | Get current user |
| `GET  /products` | List products (filters: category, minPrice, maxPrice, rating, tags) |
| `GET  /products/featured` | Featured products |
| `GET  /products/best-sellers` | Best sellers |
| `GET  /products/new-arrivals` | New arrivals |
| `GET  /products/:id` | Single product |
| `GET  /categories` | All categories |
| `POST /orders` | Create order |
| `GET  /orders/my-orders` | My orders |
| `GET  /cart` | My cart |
| `GET  /wishlist` | My wishlist |
| `GET  /settings/public` | Public store settings |
| `GET  /analytics/dashboard` | Admin dashboard stats |
| ... | (70+ endpoints total) |

## Testing

```bash
npm test
```

## Tech Stack

- Node.js, Express
- MongoDB, Mongoose
- JWT, bcryptjs
- Cloudinary, Multer
- Razorpay, Nodemailer
- Helmet, express-rate-limit, express-mongo-sanitize

## Deployment

See `docs/DEPLOYMENT.md` for VPS + PM2 + Nginx setup.
