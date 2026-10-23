
import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// GET /api/products
router.get("/", async (req, res, next) => {
  try {
    const { search = "", category = "" } = req.query;

    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: String(search),
          mode: "insensitive"
        },
        ...(category
          ? { category: { name: String(category) } }
          : {})
      },
      include: {
        category: true
      },
      orderBy: {
        name: "asc"
      }
    });

    const result = products.map((product) => ({
      ...product,
      price: Number(product.price)
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/categories
router.get("/categories", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc"
      }
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        category: true
      }
    });

    if (!product) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    res.json({
      ...product,
      price: Number(product.price)
    });
  } catch (error) {
    next(error);
  }
});

export default router;
