# SmartCart — Deployment Guide

This guide details the deployment architecture for **SmartCart**:
- **Database**: Supabase PostgreSQL (Managed cloud PostgreSQL instance)
- **Backend API**: Render (Node.js Express Web Service)
- **Frontend SPA**: Vercel (React + Vite)
- **Repository**: GitHub

---

## 1. Database Deployment (Supabase PostgreSQL)

Supabase provides the managed PostgreSQL engine.

### Connection Information
- **Session Pooler URL (IPv4)**:
  ```text
  postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
  ```
- **SSL**: Automatic SSL negotiation (`sslmode=require` / `{ rejectUnauthorized: false }`).

### Running Migrations & Seeds on Supabase
From your local terminal with the Supabase `DATABASE_URL` configured in `backend/.env`:
```bash
cd backend
npm run migrate
npm run seed
```
This sets up:
1. `products`, `coupons`, `orders`, and `order_items` tables with constraints and indexes.
2. 15 realistic products across Electronics, Fashion, Home, and Accessories.
3. 7 promo coupons (`SAVE10`, `FLAT100`, `SMART20`, `FESTIVE500`, `WELCOME50`, etc.).

---

## 2. Backend Deployment (Render)

### Step 1: Create Web Service on Render
1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Name**: `smartcart-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`

### Step 2: Configure Environment Variables
Under the **Environment** tab on Render, add:
| Key | Value | Description |
|---|---|---|
| `PORT` | `10000` | Port automatically assigned by Render |
| `NODE_ENV` | `production` | Production mode |
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASSWORD]@...:5432/postgres` | Your Supabase connection string |
| `CLIENT_URL` | `https://your-smartcart-app.vercel.app` | Your deployed Vercel frontend domain |
| `FREE_SHIPPING_THRESHOLD` | `999.00` | Free delivery cart threshold |
| `STANDARD_SHIPPING_FEE` | `79.00` | Standard delivery fee |
| `GST_TAX_PERCENTAGE` | `5.00` | Documented GST percentage |

### Step 3: Health Check
Render will verify your service using:
```text
https://smartcart-backend.onrender.com/api/health
```

---

## 3. Frontend Deployment (Vercel)

### Step 1: Import Project on Vercel
1. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New...** → **Project**.
2. Select your GitHub repository.
3. In project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and choose `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Configure Environment Variables
Under **Environment Variables**, add:
| Key | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://smartcart-backend.onrender.com/api` | Your deployed Render backend API URL |

### Step 3: Client-Side Routing
The repository includes [frontend/vercel.json](file:///d:/hackthon/frontend/vercel.json) which handles Single Page Application (SPA) routing, ensuring direct navigation or page refreshes on `/cart`, `/checkout`, `/orders/lookup`, and `/order-confirmation/:id` resolve cleanly to `index.html`.

---

## 4. End-to-End Verification Checklist

After deploying:
1. Open the Vercel URL in your browser.
2. Confirm products are fetched from Supabase via your Render backend.
3. Test search, category filtering, and adding items to the cart.
4. Apply the recommended coupon via the **Smart Savings Assistant**.
5. Complete the checkout form and place an order.
6. Verify navigation to the Order Confirmation page with your unique order number.
7. Open the **Order Lookup** page (`/orders/lookup`) and verify the order details and snapshot are fetched from Supabase.
8. Check the Supabase Table Editor to verify the newly placed order record in the `orders` table and the decremented stock in the `products` table.
