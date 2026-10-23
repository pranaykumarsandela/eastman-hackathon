const test = require('node:test');
const assert = require('node:assert');
const { evaluateCoupon } = require('../src/services/couponService');

test('Coupon Engine: Percentage coupon calculates discount accurately', () => {
  const coupon = {
    id: 1,
    code: 'SAVE10',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    minimum_order_value: 500,
    maximum_discount: 250,
    expiry_date: new Date(Date.now() + 86400000).toISOString(),
    is_active: true,
    usage_limit: 100,
    usage_count: 5
  };

  const result = evaluateCoupon(coupon, 1000);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.discountAmount, 100);
});

test('Coupon Engine: Percentage coupon respects maximum_discount cap', () => {
  const coupon = {
    id: 1,
    code: 'SAVE10',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    minimum_order_value: 500,
    maximum_discount: 250,
    expiry_date: new Date(Date.now() + 86400000).toISOString(),
    is_active: true,
    usage_limit: 100,
    usage_count: 5
  };

  // 10% of 5000 is 500, but cap is 250
  const result = evaluateCoupon(coupon, 5000);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.discountAmount, 250);
});

test('Coupon Engine: Fixed coupon provides exact flat discount', () => {
  const coupon = {
    id: 2,
    code: 'FLAT100',
    discount_type: 'FIXED',
    discount_value: 100,
    minimum_order_value: 999,
    maximum_discount: null,
    expiry_date: new Date(Date.now() + 86400000).toISOString(),
    is_active: true,
    usage_limit: null,
    usage_count: 0
  };

  const result = evaluateCoupon(coupon, 1200);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.discountAmount, 100);
});

test('Coupon Engine: Rejects when subtotal is below minimum order value', () => {
  const coupon = {
    id: 2,
    code: 'FLAT100',
    discount_type: 'FIXED',
    discount_value: 100,
    minimum_order_value: 999,
    maximum_discount: null,
    expiry_date: new Date(Date.now() + 86400000).toISOString(),
    is_active: true,
    usage_limit: null,
    usage_count: 0
  };

  const result = evaluateCoupon(coupon, 800);
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.discountAmount, 0);
  assert.ok(result.error.includes('Minimum order value'));
  assert.strictEqual(result.shortfall, 199);
});

test('Coupon Engine: Rejects expired coupon', () => {
  const coupon = {
    id: 3,
    code: 'EXPIRED10',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    minimum_order_value: 100,
    maximum_discount: 50,
    expiry_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    is_active: true,
    usage_limit: 100,
    usage_count: 5
  };

  const result = evaluateCoupon(coupon, 500);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.error.includes('expired'));
});

test('Coupon Engine: Rejects inactive coupon', () => {
  const coupon = {
    id: 4,
    code: 'DISABLED',
    discount_type: 'FIXED',
    discount_value: 50,
    minimum_order_value: 100,
    maximum_discount: null,
    expiry_date: new Date(Date.now() + 86400000).toISOString(),
    is_active: false,
    usage_limit: 100,
    usage_count: 0
  };

  const result = evaluateCoupon(coupon, 500);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.error.includes('disabled') || result.error.includes('inactive'));
});

test('Coupon Engine: Discount never exceeds subtotal', () => {
  const coupon = {
    id: 5,
    code: 'BIGDISCOUNT',
    discount_type: 'FIXED',
    discount_value: 500,
    minimum_order_value: 100,
    maximum_discount: null,
    expiry_date: new Date(Date.now() + 86400000).toISOString(),
    is_active: true,
    usage_limit: null,
    usage_count: 0
  };

  const result = evaluateCoupon(coupon, 300);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.discountAmount, 300); // capped at subtotal
});
