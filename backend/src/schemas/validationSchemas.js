const { z } = require('zod');

const couponValidateSchema = z.object({
  code: z.string().min(1, 'Coupon code cannot be empty').max(50),
  subtotal: z.number().min(0, 'Subtotal must be non-negative')
});

const checkoutPreviewSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().int().positive('Product ID must be a positive integer'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1')
    })
  ).min(1, 'At least one item is required in the cart'),
  couponCode: z.string().optional().nullable()
});

const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(150),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().regex(/^[0-9+\s-]{8,20}$/, 'Invalid phone number format'),
  address: z.string().min(5, 'Delivery address must be at least 5 characters'),
  city: z.string().min(2, 'City name is required'),
  state: z.string().min(2, 'State name is required'),
  postalCode: z.string().regex(/^[0-9A-Za-z\s-]{3,10}$/, 'Invalid postal / PIN code'),
  paymentMethod: z.enum(['COD', 'SIMULATED_ONLINE']).default('COD'),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().min(1)
    })
  ).min(1, 'Order must contain at least one product'),
  couponCode: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable()
});

const orderLookupSchema = z.object({
  orderNumber: z.string().min(3, 'Order number is required'),
  contact: z.string().min(3, 'Email or Phone is required for order verification')
});

module.exports = {
  couponValidateSchema,
  checkoutPreviewSchema,
  createOrderSchema,
  orderLookupSchema
};
