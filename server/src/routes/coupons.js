
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db.js";
import { priceOrder } from "../pricing.js";

const router = Router();

const couponSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1).max(100)
    })
  ).min(1),
  couponCode: z.string().trim().min(1).max(40)
});

// POST /api/coupons/validate
router.post("/validate", async (req, res, next) => {
  try {
    const input = couponSchema.parse(req.body);

    const ids = input.items.map(
      (item) => item.productId
    );

    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({
        error: "Duplicate products in cart"
      });
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: ids }
      }
    });

    if (products.length !== ids.length) {
      return res.status(400).json({
        error: "Some products are unavailable"
      });
    }

    const lines = input.items.map((item) => {
      const product = products.find(
        (p) => p.id === item.productId
      );

      return {
        ...product,
        quantity: item.quantity
      };
    });

    for (const line of lines) {
      if (line.quantity > line.stock) {
        return res.status(409).json({
          error: `Insufficient stock for ${line.name}`
        });
      }
    }

    const coupon = await prisma.coupon.findUnique({
      where: {
        code: input.couponCode.toUpperCase()
      }
    });

    if (!coupon) {
      return res.status(400).json({
        error: "Invalid coupon code"
      });
    }

    const summary = priceOrder(lines, coupon);

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

export default router;
