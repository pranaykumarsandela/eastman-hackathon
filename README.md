# SmartCart — Smart E-Commerce Cart & Checkout System

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17%2F18-blue.svg?logo=postgresql)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v24-green.svg?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-15%20Passed-emerald.svg)](tests)

SmartCart is an enterprise-grade e-commerce application featuring an atomic cart and checkout system, a **deterministic Smart Savings Assistant coupon recommendation engine**, and strict inventory consistency backed by PostgreSQL ACID transactions with row-level locking (`SELECT ... FOR UPDATE`).

---

## 🏗️ System Architecture

```
d:\hackthon\
├── backend/
│   ├── migrations/
│   │   ├── 001_create_schema.sql         # Normalized DDL schema & triggers
│   │   └── 002_seed_demo_data.sql          # 15 realistic products + 7 coupons
│   ├── scripts/
│   │   ├── migrate.js                    # Executes migration scripts
│   │   ├── seed.js                       # Seeds catalog and coupons
│   │   └── setup_db.js                   # Automated DB creation & setup
│   ├── src/
│   │   ├── config/ (db.js, env.js)       # PostgreSQL pool with cloud SSL negotiation
│   │   ├── controllers/                  # Product, Coupon, Checkout, Order controllers
│   │   ├── middleware/                   # Centralized error handler, Zod validator, rate limiters
│   │   ├── routes/                       # REST routes for /api/*
│   │   ├── schemas/                      # Zod validation schemas
│   │   ├── services/
│   │   │   ├── couponService.js          # Deterministic Smart Savings Assistant
│   │   │   └── orderService.js           # Atomic transactional order processing with row locking
│   │   ├── app.js                        # Express setup, Helmet, CORS, size limits
│   │   └── server.js                     # Server entry with graceful shutdown
│   ├── tests/
│   │   ├── couponEngine.test.js          # Unit tests: Percentage/Fixed caps, edge cases
│   │   ├── pricing.test.js               # Unit tests: Subtotal, shipping threshold, 5% GST
│   │   └── integration.test.js           # End-to-end PostgreSQL transaction & rollback tests
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/                   # Navbar, Footer, ProductCard, ProductModal, CartDrawer,
│   │   │                                 # SmartSavingsBanner, FreeShippingProgressBar, CouponModal
│   │   ├── context/                      # CartContext (localStorage persisted), NotificationContext
│   │   ├── pages/
│   │   │   ├── HomePage.jsx              # Hero banner, category pills, price sorting, search
│   │   │   ├── CartPage.jsx              # Interactive cart, line items, 1-click coupon application
│   │   │   ├── CheckoutPage.jsx          # Shipping details, COD / Instant Demo, live preview
│   │   │   ├── OrderConfirmationPage.jsx # Visual receipt, unique order number, product snapshots
│   │   │   ├── OrderLookupPage.jsx       # Secure order tracking (Order No + Email/Phone)
│   │   │   └── NotFoundPage.jsx          # 404 page
│   │   ├── services/api.js               # Centralized REST API client
│   │   ├── utils/formatters.js           # Indian Rupee (₹ INR) and date formatters
│   │   ├── App.jsx
│   │   └── index.css
│   ├── vercel.json                       # Client-side routing rewrites for Vercel
│   ├── .env.example
│   └── package.json
├── README.md
└── DEPLOYMENT.md
```

---

## 🚀 Key Features

### 1. Deterministic Smart Savings Assistant
- **Algorithmic optimization**: Evaluates all active, non-expired coupons against cart subtotal.
- **Explainability**: Explains exactly why a coupon is recommended (e.g. `"Applying SMART20 saves you the highest amount of ₹1,000.00 on this order!"`).
- **Nudge alerts**: Informs customers if adding a small amount unlocks a higher discount tier.
- **Strict server enforcement**: Authoritative coupon validation is performed exclusively on the Express backend—never trusted from client payloads.

### 2. ACID Transactional Checkout & Inventory Consistency
- **Row-level locking**: Products are queried using `SELECT ... FOR UPDATE` within a PostgreSQL transaction block (`BEGIN` ... `COMMIT`).
- **Zero overselling**: Throws HTTP 409 Conflict if stock is insufficient during concurrent purchase attempts, triggering immediate transaction `ROLLBACK`.
- **Order Snapshots**: Product names and unit prices are snapshotted in `order_items` at purchase time, ensuring historical accuracy even if catalog prices change later.
- **Idempotency**: Prevents accidental duplicate submissions using unique checkout idempotency tokens.

### 3. Usability & User Experience
- **INR (₹) Standard Currency**: All prices formatted accurately using `Intl.NumberFormat('en-IN')`.
- **Free Delivery Progress Indicator**: Visual progress tracker toward the ₹999 free delivery threshold.
- **Secure Order Lookup**: Customers can track orders at `/orders/lookup` by providing their unique Order Number and email or phone verification (protects sensitive user data from sequential ID scraping).

---

## 🗄️ PostgreSQL Database Schema

```sql
-- 1. Products
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    rating NUMERIC(2, 1) NOT NULL DEFAULT 4.5,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Coupons
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    minimum_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    maximum_discount NUMERIC(10, 2) NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    usage_limit INT NULL,
    usage_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(64) NOT NULL UNIQUE,
    customer_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(25) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    shipping_fee NUMERIC(10, 2) DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    coupon_id INT NULL REFERENCES coupons(id),
    payment_method VARCHAR(50) DEFAULT 'COD',
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    order_status VARCHAR(50) DEFAULT 'CONFIRMED',
    idempotency_key VARCHAR(128) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Order Items (Historical Snapshot)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    product_name_snapshot VARCHAR(255) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(10, 2) NOT NULL
);
```

---

## 🏃 Running Locally

### Prerequisites
- Node.js v18+ (verified on v24)
- PostgreSQL (Local or Supabase PostgreSQL instance)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env

# Edit .env with your PostgreSQL DATABASE_URL:
# DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/smartcart_db

# Run schema migrations and seed demo data:
npm run migrate
npm run seed

# Run automated tests:
npm test

# Start the Express server:
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing Verification

The project includes 15 automated unit and integration tests covering:
- **Coupon calculation accuracy**: Percentage calculations, maximum discount caps, flat amount discounts.
- **Validation edge cases**: Below minimum order value, expired coupons, disabled/inactive coupons, subtotal bounds.
- **Pricing & Tax**: Subtotal calculations across items, standard ₹79 shipping fee below ₹999, free shipping above ₹999, 5% documented GST tax.
- **ACID Transaction test**: Tests `SELECT ... FOR UPDATE` locking, stock decrement in PostgreSQL, snapshot creation, and rollback verification when an invalid or oversold order is submitted.

Run tests:
```bash
cd backend
npm test
```
Result:
```text
✔ 10 Unit Tests passed
✔ 5 Integration Tests passed (PostgreSQL verified)
Total: 15 passed, 0 failed
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and database latency check |
| `GET` | `/api/products` | Retrieve products with search, category, sort, and pagination |
| `GET` | `/api/products/:id` | Retrieve single product details |
| `GET` | `/api/categories` | Retrieve categories with live product counts |
| `GET` | `/api/coupons` | List all available active promotional coupons |
| `POST` | `/api/coupons/validate` | Validate coupon code against cart subtotal |
| `GET` | `/api/coupons/recommendation?subtotal=X` | Smart Savings Assistant deterministic recommendation |
| `POST` | `/api/checkout/preview` | Real-time authoritative price, stock, and tax review |
| `POST` | `/api/orders` | Place order inside an atomic transaction with row locking |
| `POST` | `/api/orders/lookup` | Secure order lookup by Order Number + Email/Phone |
