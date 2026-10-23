const test = require('node:test');
const assert = require('node:assert');
const { calculateOrderTotals } = require('../src/services/orderService');

test('Pricing: Calculates subtotal correctly across multiple items', () => {
  const verifiedItems = [
    { productId: 1, name: 'Headphones', unitPrice: 2000, quantity: 2, lineTotal: 4000 },
    { productId: 2, name: 'Mouse', unitPrice: 1500, quantity: 1, lineTotal: 1500 }
  ];

  const totals = calculateOrderTotals(verifiedItems, null);
  assert.strictEqual(totals.subtotal, 5500);
  assert.strictEqual(totals.discountAmount, 0);
  assert.strictEqual(totals.shippingFee, 0); // >= 999 threshold -> free shipping
  assert.strictEqual(totals.taxAmount, 275); // 5% of 5500 = 275
  assert.strictEqual(totals.totalAmount, 5775); // 5500 + 0 + 275
});

test('Pricing: Applies standard shipping fee when under threshold', () => {
  const verifiedItems = [
    { productId: 1, name: 'Cable', unitPrice: 400, quantity: 1, lineTotal: 400 }
  ];

  const totals = calculateOrderTotals(verifiedItems, null);
  assert.strictEqual(totals.subtotal, 400);
  assert.strictEqual(totals.shippingFee, 79); // standard fee for < 999
  assert.strictEqual(totals.taxAmount, 20); // 5% of 400
  assert.strictEqual(totals.totalAmount, 499); // 400 + 79 + 20
});

test('Pricing: Applies coupon discount before calculating tax and shipping', () => {
  const verifiedItems = [
    { productId: 1, name: 'Backpack', unitPrice: 1200, quantity: 1, lineTotal: 1200 }
  ];
  const coupon = {
    id: 10,
    code: 'SAVE10',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    minimum_order_value: 500,
    maximum_discount: 250,
    expiry_date: new Date(Date.now() + 86400000).toISOString(),
    is_active: true,
    usage_limit: null,
    usage_count: 0
  };

  const totals = calculateOrderTotals(verifiedItems, coupon);
  assert.strictEqual(totals.subtotal, 1200);
  assert.strictEqual(totals.discountAmount, 120); // 10% of 1200
  // Taxable amount = 1200 - 120 = 1080. Since 1080 >= 999, shipping is free!
  assert.strictEqual(totals.shippingFee, 0);
  assert.strictEqual(totals.taxAmount, 54); // 5% of 1080
  assert.strictEqual(totals.totalAmount, 1134); // 1080 + 0 + 54
});
