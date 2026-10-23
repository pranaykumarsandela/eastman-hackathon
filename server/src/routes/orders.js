
import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";

import { prisma } from "../db.js";
import {
  priceOrder,
  toPaise,
  rupees
} from "../pricing.js";

const router = Router();

const itemsSchema = z.array(
  z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(100)
  })
).min(1);

const cartSchema = z.object({
  items: itemsSchema,
  couponCode: z.string().trim().max(40).optional().default("")
});

const orderSchema = cartSchema.extend({
  customerName: z.string().trim().min(2),
  customerEmail: z.string().email(),
  idempotencyKey: z.string().uuid()
});

async function calculate(tx, input) {
  const ids = input.items.map(
    (item) => item.productId
  );

  if (new Set(ids).size !== ids.length) {
    throw Object.assign(
      new Error("Duplicate cart items"),
      { status: 400 }
    );
  }

  const products = await tx.product.findMany({
    where: {
      id: { in: ids }
    }
  });

  if (products.length !== ids.length) {
    throw Object.assign(
      new Error("Some products are unavailable"),
      { status: 400 }
    );
  }

  const lines = input.items.map((item) => {
    const product = products.find(
      (p) => p.id === item.productId
    );

    if (item.quantity > product.stock) {
      throw Object.assign(
        new Error(`Insufficient stock for ${product.name}`),
        { status: 409 }
      );
    }

    return {
      ...product,
      quantity: item.quantity
    };
  });

  const coupon = input.couponCode
    ? await tx.coupon.findUnique({
        where: {
          code: input.couponCode.toUpperCase()
        }
      })
    : null;

  if (input.couponCode && !coupon) {
    throw Object.assign(
      new Error("Invalid coupon code"),
      { status: 400 }
    );
  }

  const summary = priceOrder(lines, coupon);

  return {
    lines,
    coupon,
    summary
  };
}

// POST /api/checkout/preview
router.post("/preview", async (req, res, next) => {
  try {
    const input = cartSchema.parse(req.body);

    const { summary } = await calculate(
      prisma,
      input
    );

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// POST /api/orders
router.post("/", async (req, res, next) => {
  try {
    const input = orderSchema.parse(req.body);

    const existing = await prisma.order.findUnique({
      where: {
        id: input.idempotencyKey
      },
      include: {
        items: true
      }
    });

    if (existing) {
      return res.json(existing);
    }

    const order = await prisma.$transaction(
      async (tx) => {
        const { lines, coupon, summary } =
          await calculate(tx, input);

        for (const line of lines) {
          const updated = await tx.product.updateMany({
            where: {
              id: line.id,
              stock: {
                gte: line.quantity
              }
            },
            data: {
              stock: {
                decrement: line.quantity
              }
            }
          });

          if (updated.count !== 1) {
            throw Object.assign(
              new Error(
                `Insufficient stock for ${line.name}`
              ),
              { status: 409 }
            );
          }
        }

        return tx.order.create({
          data: {
            id: input.idempotencyKey,
            orderNumber:
              "SC-" +
              randomUUID().slice(0, 8).toUpperCase(),
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            subtotal: summary.subtotal,
            discount: summary.discount,
            total: summary.total,
            couponId: coupon?.id,
            items: {
              create: lines.map((line) => ({
                productId: line.id,
                name: line.name,
                unitPrice: line.price,
                quantity: line.quantity,
                lineTotal: rupees(
                  toPaise(line.price) *
                  line.quantity
                )
              }))
            }
          },
          include: {
            items: true
          }
        });
      },
      {
        isolationLevel: "Serializable"
      }
    );

    res.status(201).json(order);
  } catch (error) {
    if (
      error.code === "P2002" ||
      error.code === "P2034"
    ) {
      const existing = await prisma.order.findUnique({
        where: {
          id: req.body?.idempotencyKey
        },
        include: {
          items: true
        }
      }).catch(() => null);

      if (existing) {
        return res.json(existing);
      }

      error.status = 409;
    }

    next(error);
  }
});

// GET /api/orders/:orderNumber
router.get("/:orderNumber", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: {
        orderNumber: req.params.orderNumber
      },
      include: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found"
      });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

export default router;
