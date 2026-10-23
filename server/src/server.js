import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import { prisma } from './db.js';
import { optionalAuth } from './auth.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import couponRoutes from './routes/coupons.js';

import orderRoutes, { checkoutRouter } from './routes/orders.js';


import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app=express();

app.disable("x-powered-by");
app.use(helmet());


const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later."
  }
});

app.use("/api", apiLimiter);


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many attempts. Please try again later."
  }
});

// Register this before app.use("/api/auth", authRoutes)
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use(cors({origin:process.env.CLIENT_URL||'http://localhost:5173',credentials:true}));
app.use(express.json({limit:'100kb'}));
app.use(cookieParser());

const allowedOrigin = new URL(
  process.env.CLIENT_URL || "http://localhost:5173"
).origin;

app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.get("Origin");

  if (!origin || origin !== allowedOrigin) {
    return res.status(403).json({
      error: "Request origin not allowed"
    });
  }

  next();
});

app.use(optionalAuth);
app.get('/api/health',async(req,res,next)=>{try{await prisma.$queryRaw`SELECT 1`;res.json({ok:true,database:'connected'});}catch(e){next(e);}});
app.use('/api/auth',authRoutes);
app.use('/api/products',productRoutes);
app.get('/api/categories',async(req,res,next)=>{try{res.json(await prisma.category.findMany({orderBy:{name:'asc'}}));}catch(e){next(e);}});
app.use('/api/coupons',couponRoutes);

app.use('/api/checkout', checkoutRouter);
app.use('/api/orders', orderRoutes);

app.use((err,req,res,next)=>{if(err instanceof z.ZodError)return res.status(400).json({error:err.issues.map(i=>i.message).join(', ')});console.error(err);res.status(err.status||500).json({error:err.status?err.message:'Server error. Please try again.'});});
const port=Number(process.env.PORT||5000);
app.listen(port,()=>console.log(`SmartCart API: http://localhost:${port}`));
