const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(150),
  email: z.string().email('Please enter a valid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  phone: z.string().optional().nullable()
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password cannot be empty')
});

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

const productCreateSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(255).optional(),
  title: z.string().min(2, 'Product title must be at least 2 characters').max(255).optional(),
  slug: z.string().optional(),
  description: z.string().min(2, 'Description must be at least 2 characters').optional().or(z.literal('')),
  price: z.number().min(0, 'Price must be non-negative'),
  category: z.string().min(2, 'Category is required'),
  imageUrl: z.string().url('Image URL must be a valid URL').optional().or(z.literal('')),
  stockQuantity: z.number().int().min(0, 'Stock must be a non-negative integer'),
  isActive: z.boolean().default(true)
}).refine(data => data.name || data.title, {
  message: 'Product name or title is required',
  path: ['title']
}).transform(data => ({
  ...data,
  name: (data.name || data.title || '').trim(),
  title: (data.title || data.name || '').trim()
}));

const productUpdateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  title: z.string().min(2).max(255).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  category: z.string().min(2).optional(),
  imageUrl: z.string().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
}).transform(data => ({
  ...data,
  name: data.name ? data.name.trim() : (data.title ? data.title.trim() : undefined),
  title: data.title ? data.title.trim() : (data.name ? data.name.trim() : undefined)
}));

module.exports = {
  registerSchema,
  loginSchema,
  couponValidateSchema,
  checkoutPreviewSchema,
  createOrderSchema,
  orderLookupSchema,
  productCreateSchema,
  productUpdateSchema
};
