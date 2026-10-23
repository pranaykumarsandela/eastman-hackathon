
import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";

import { prisma } from "./db.js";

import productRoutes from "./routes/products.js";
import couponRoutes from "./routes/coupons.js";
import orderRoutes from "./routes/orders.js";

const app = express();

// Allow React frontend to communicate with backend
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);

// Allow backend to receive JSON data
app.use(express.json({ limit: "100kb" }));

// Health check
app.get("/api/health", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      ok: true,
      database: "connected"
    });
  } catch (error) {
    next(error);
  }
});

// Product routes
app.use("/api/products", productRoutes);

// Category routes
app.get("/api/categories", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// Coupon routes
app.use("/api/coupons", couponRoutes);

// Checkout preview routes
app.use("/api/checkout", orderRoutes);

// Order creation and confirmation routes
app.use("/api/orders", orderRoutes);

// Handle invalid requests and server errors
app.use((err, req, res, next) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: err.issues.map(
        (issue) => issue.message
      ).join(", ")
    });
  }

  console.error(err);

  res.status(err.status || 500).json({
    error: err.status
      ? err.message
      : "Server error. Please try again."
  });
});

// Start Express server
const PORT = Number(process.env.PORT || 5000);

app.listen(PORT, () => {
  console.log(
    `SmartCart API running at http://localhost:${PORT}`
  );
});
