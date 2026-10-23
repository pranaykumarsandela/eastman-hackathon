const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const validate = require('../middleware/validate');
const { productCreateSchema, productUpdateSchema } = require('../schemas/validationSchemas');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// All admin routes strictly require authentication AND admin role
router.use(authenticateUser, requireAdmin);

// Metrics Overview
router.get('/metrics', adminController.getAdminMetrics);

// Product Management
router.get('/products', adminController.getAdminProducts);
router.post('/products', validate(productCreateSchema), adminController.createProduct);
router.put('/products/:id', validate(productUpdateSchema), adminController.updateProduct);
router.patch('/products/:id/toggle', adminController.toggleProductStatus);
router.patch('/products/:id/stock', adminController.updateProductStock);

// Order Management
router.get('/orders', adminController.getAdminOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

module.exports = router;
