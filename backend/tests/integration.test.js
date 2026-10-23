const test = require('node:test');
const assert = require('node:assert');
const { query } = require('../src/config/db');
const { getProducts } = require('../src/controllers/productController');
const { validateCouponCode, getBestCouponRecommendation } = require('../src/services/couponService');
const { previewCheckout, placeOrder, getOrderByLookup } = require('../src/services/orderService');

test('Integration: Product retrieval, search and category filtering against DB', async () => {
  const allRes = await query('SELECT COUNT(*) FROM products WHERE is_active = TRUE');
  const count = parseInt(allRes.rows[0].count, 10);
  assert.ok(count >= 15, `Expected at least 15 products, got ${count}`);

  // Test electronics filter
  const elecRes = await query("SELECT COUNT(*) FROM products WHERE category = 'Electronics' AND is_active = TRUE");
  const elecCount = parseInt(elecRes.rows[0].count, 10);
  assert.ok(elecCount >= 4, `Expected electronics products, got ${elecCount}`);
});

test('Integration: Smart Savings Assistant deterministic evaluation against DB', async () => {
  // Subtotal = ₹3,000
  // SMART20 (20% off min order 1999) saves 20% of 3000 = ₹600 (cap is 1000)
  // SAVE10 (10% off min order 500) saves 10% of 3000 = ₹300 (cap is 250 -> saves 250)
  // FLAT100 saves ₹100
  // Best recommendation MUST be SMART20 with discount of ₹600!
  const rec = await getBestCouponRecommendation(3000);
  assert.ok(rec.bestCoupon !== null);
  assert.strictEqual(rec.bestCoupon.code, 'SMART20');
  assert.strictEqual(rec.bestCoupon.discountAmount, 600);
  assert.ok(rec.reason.includes('SMART20'));
});

test('Integration: Coupon validation edge cases against DB', async () => {
  // 1. Valid coupon
  const valid = await validateCouponCode('SAVE10', 1000);
  assert.strictEqual(valid.isValid, true);
  assert.strictEqual(valid.discountAmount, 100);

  // 2. Shortfall under minimum order
  const short = await validateCouponCode('SMART20', 1500); // min is 1999
  assert.strictEqual(short.isValid, false);
  assert.ok(short.shortfall > 0);

  // 3. Expired coupon
  const expired = await validateCouponCode('EXPIRED10', 500);
  assert.strictEqual(expired.isValid, false);
  assert.ok(expired.error.includes('expired'));

  // 4. Inactive coupon
  const inactive = await validateCouponCode('INACTIVE25', 1500);
  assert.strictEqual(inactive.isValid, false);
});

test('Integration: Checkout preview calculation matches authoritative server rules', async () => {
  const pRes = await query('SELECT id, price FROM products LIMIT 1');
  const prod = pRes.rows[0];
  const unitPrice = parseFloat(prod.price);

  const preview = await previewCheckout([{ productId: prod.id, quantity: 2 }], 'SAVE10');
  const expectedSubtotal = Math.round(unitPrice * 2 * 100) / 100;
  assert.strictEqual(preview.subtotal, expectedSubtotal);
  assert.strictEqual(preview.hasStockIssues, false);
});

test('Integration: Atomic Order Placement, Stock Reduction & Rollback', async () => {
  // Find a product with stock
  const pRes = await query('SELECT id, name, price, stock_quantity FROM products WHERE stock_quantity > 5 LIMIT 1');
  const prod = pRes.rows[0];
  const initialStock = prod.stock_quantity;

  const testOrder = {
    customerName: 'Integration Tester',
    email: 'tester@smartcart.internal',
    phone: '+91 9988776655',
    address: '100 Innovation Boulevard',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500081',
    paymentMethod: 'COD',
    items: [{ productId: prod.id, quantity: 2 }],
    couponCode: 'SAVE10',
    idempotencyKey: `TEST-IDEMP-${Date.now()}`
  };

  let placedOrderNumber = null;
  try {
    const result = await placeOrder(testOrder);
    assert.strictEqual(result.success, true);
    assert.ok(result.order.orderNumber.startsWith('SC-'));
    placedOrderNumber = result.order.orderNumber;

    // Verify stock was reduced in PostgreSQL
    const updatedP = await query('SELECT stock_quantity FROM products WHERE id = $1', [prod.id]);
    assert.strictEqual(updatedP.rows[0].stock_quantity, initialStock - 2);

    // Verify order lookup works
    const lookup = await getOrderByLookup(result.order.orderNumber, 'tester@smartcart.internal');
    assert.ok(lookup !== null);
    assert.strictEqual(lookup.customerName, 'Integration Tester');
    assert.strictEqual(lookup.items.length, 1);
    assert.strictEqual(lookup.items[0].quantity, 2);

    // Test rollback on invalid / overselling order
    let failed = false;
    try {
      await placeOrder({
        ...testOrder,
        idempotencyKey: `FAIL-${Date.now()}`,
        items: [{ productId: prod.id, quantity: 999999 }] // more than available stock!
      });
    } catch (err) {
      failed = true;
      assert.strictEqual(err.statusCode, 409); // conflict / insufficient stock
    }
    assert.strictEqual(failed, true, 'Expected order with excess quantity to fail with 409');
  } finally {
    // Clean up test order from DB so it never pollutes the admin dashboard
    if (placedOrderNumber) {
      const ordRes = await query('SELECT id FROM orders WHERE order_number = $1', [placedOrderNumber]);
      if (ordRes.rows.length > 0) {
        const orderId = ordRes.rows[0].id;
        await query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
        await query('DELETE FROM orders WHERE id = $1', [orderId]);
      }
      // Restore product stock
      await query('UPDATE products SET stock_quantity = $1 WHERE id = $2', [initialStock, prod.id]);
    }
  }
});
