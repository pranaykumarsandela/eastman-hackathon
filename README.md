# SmartCart — Eastman Full-Stack Hackathon

React + Vite frontend, Node/Express backend, PostgreSQL database with Prisma ORM. Features: catalog, search/filter, product detail, persistent guest cart, coupons, trusted checkout preview, transaction-backed order placement, stock deduction, and order confirmation.

## Prerequisites
- Node.js 20+
- PostgreSQL running locally

## Setup (PowerShell)
```powershell
# In the smartcart-hackathon folder
Copy-Item server/.env.example server/.env
# Edit server/.env and set your actual PostgreSQL password.
# Create the database with psql (or pgAdmin):
psql -U postgres -c "CREATE DATABASE smartcart;"
npm install
npm install --prefix server
npm install --prefix client
npm run db:migrate
npm run db:seed
npm run test
npm run dev
```

Frontend: http://localhost:5173
Backend health: http://localhost:5000/api/health

## API
- `GET /api/health`
- `GET /api/products?search=&category=`
- `GET /api/categories`
- `GET /api/products/:id`
- `POST /api/coupons/validate` — `{items:[{productId,quantity}],couponCode}`
- `POST /api/checkout/preview` — same payload
- `POST /api/orders` — payload plus `customerName`, `customerEmail`, `idempotencyKey` UUID
- `GET /api/orders/:orderNumber`

## Architecture
Frontend maintains a guest cart in Context/localStorage. Backend re-fetches all prices and stock from PostgreSQL and uses the Strategy Pattern for flat and percentage discounts. Orders and order items are created in a serializable transaction with conditional stock decrement; idempotency UUID avoids duplicate orders on retries.

## Demo
Browse products → add to cart → adjust quantity → apply `SAVE10` → checkout → enter name and email → place demo order → copy order ID → refresh confirmation page. Verify order in Prisma Studio: `cd server; npx prisma studio`.

## Notes
This is **demo checkout**, not real payment processing. The project does not include account authentication. Coupon eligibility is checked on the backend. Coupon codes: SAVE10, FLAT200, WELCOME15. A PostgreSQL instance is required; no database credentials are bundled.
