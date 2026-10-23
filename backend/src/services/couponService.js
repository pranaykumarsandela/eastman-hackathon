const { query } = require('../config/db');

/**
 * Validates a single coupon against a given subtotal.
 * Returns { isValid: boolean, error?: string, discountAmount: number, coupon?: object }
 */
const evaluateCoupon = (coupon, subtotal) => {
  const numericSubtotal = parseFloat(subtotal) || 0;

  if (!coupon) {
    return {
      isValid: false,
      error: 'Coupon not found.',
      discountAmount: 0
    };
  }

  if (!coupon.is_active) {
    return {
      isValid: false,
      error: `Coupon "${coupon.code}" is currently disabled or inactive.`,
      discountAmount: 0,
      coupon
    };
  }

  const now = new Date();
  const expiry = new Date(coupon.expiry_date);
  if (expiry < now) {
    return {
      isValid: false,
      error: `Coupon "${coupon.code}" expired on ${expiry.toLocaleDateString('en-IN')}.`,
      discountAmount: 0,
      coupon
    };
  }

  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return {
      isValid: false,
      error: `Coupon "${coupon.code}" has reached its maximum redemption limit.`,
      discountAmount: 0,
      coupon
    };
  }

  const minOrder = parseFloat(coupon.minimum_order_value) || 0;
  if (numericSubtotal < minOrder) {
    const shortfall = (minOrder - numericSubtotal).toFixed(2);
    return {
      isValid: false,
      error: `Minimum order value for "${coupon.code}" is ₹${minOrder.toLocaleString('en-IN')}. Add ₹${shortfall} more to apply.`,
      discountAmount: 0,
      coupon,
      shortfall: parseFloat(shortfall)
    };
  }

  // Calculate discount amount
  let discount = 0;
  const discountVal = parseFloat(coupon.discount_value);
  const maxDiscount = coupon.maximum_discount ? parseFloat(coupon.maximum_discount) : null;

  if (coupon.discount_type === 'PERCENTAGE') {
    discount = (numericSubtotal * discountVal) / 100;
    if (maxDiscount !== null && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else if (coupon.discount_type === 'FIXED') {
    discount = discountVal;
  }

  // Discount cannot exceed the subtotal
  discount = Math.min(discount, numericSubtotal);
  discount = Math.round(discount * 100) / 100; // Round to 2 decimal places

  return {
    isValid: true,
    discountAmount: discount,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: parseFloat(coupon.discount_value),
      minimum_order_value: parseFloat(coupon.minimum_order_value),
      maximum_discount: coupon.maximum_discount ? parseFloat(coupon.maximum_discount) : null,
      expiry_date: coupon.expiry_date
    }
  };
};

/**
 * Validates a coupon code from the database against a subtotal.
 */
const validateCouponCode = async (code, subtotal) => {
  if (!code || typeof code !== 'string') {
    return { isValid: false, error: 'Coupon code is required.', discountAmount: 0 };
  }

  const trimmed = code.trim().toUpperCase();
  const res = await query(
    'SELECT * FROM coupons WHERE UPPER(code) = $1',
    [trimmed]
  );

  if (res.rowCount === 0) {
    return {
      isValid: false,
      error: `Coupon code "${trimmed}" does not exist. Please check the spelling.`,
      discountAmount: 0
    };
  }

  return evaluateCoupon(res.rows[0], subtotal);
};

/**
 * Smart Savings Assistant: Deterministically evaluates all active coupons
 * and selects the one that provides the maximum legitimate savings for the cart.
 */
const getBestCouponRecommendation = async (subtotal) => {
  const numericSubtotal = parseFloat(subtotal) || 0;

  // Fetch all active, non-expired coupons
  const res = await query(
    `SELECT * FROM coupons 
     WHERE is_active = TRUE AND expiry_date > NOW() 
     ORDER BY minimum_order_value ASC`
  );

  const allCoupons = res.rows;
  const eligibleCoupons = [];
  const nearEligibleCoupons = [];

  for (const coupon of allCoupons) {
    const evaluation = evaluateCoupon(coupon, numericSubtotal);
    if (evaluation.isValid && evaluation.discountAmount > 0) {
      let description = '';
      if (coupon.discount_type === 'PERCENTAGE') {
        description = `${coupon.discount_value}% OFF`;
        if (coupon.maximum_discount) {
          description += ` up to ₹${coupon.maximum_discount}`;
        }
      } else {
        description = `Flat ₹${coupon.discount_value} OFF`;
      }

      eligibleCoupons.push({
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: parseFloat(coupon.discount_value),
        discountAmount: evaluation.discountAmount,
        minOrder: parseFloat(coupon.minimum_order_value),
        maxDiscount: coupon.maximum_discount ? parseFloat(coupon.maximum_discount) : null,
        description
      });
    } else if (evaluation.shortfall && evaluation.shortfall > 0) {
      nearEligibleCoupons.push({
        code: coupon.code,
        shortfall: evaluation.shortfall,
        minOrder: parseFloat(coupon.minimum_order_value),
        discountValue: parseFloat(coupon.discount_value),
        discountType: coupon.discount_type
      });
    }
  }

  if (eligibleCoupons.length === 0) {
    // Check if there is a near-eligible coupon to nudge user
    let nudge = null;
    if (nearEligibleCoupons.length > 0) {
      // Sort by smallest shortfall
      nearEligibleCoupons.sort((a, b) => a.shortfall - b.shortfall);
      const closest = nearEligibleCoupons[0];
      nudge = `Add ₹${closest.shortfall.toFixed(2)} more to unlock ${closest.code} (${closest.discountType === 'PERCENTAGE' ? `${closest.discountValue}% OFF` : `₹${closest.discountValue} OFF`})!`;
    }

    return {
      bestCoupon: null,
      savingsAmount: 0,
      reason: 'No coupons qualify for this cart value yet.',
      nudge,
      eligibleCoupons: []
    };
  }

  // Sort descending by discountAmount, then descending by percentage/value
  eligibleCoupons.sort((a, b) => b.discountAmount - a.discountAmount);

  const best = eligibleCoupons[0];
  const reason = `Applying ${best.code} saves you the highest amount of ₹${best.discountAmount.toFixed(2)} (${best.description}) on this order!`;

  return {
    bestCoupon: best,
    savingsAmount: best.discountAmount,
    reason,
    eligibleCoupons
  };
};

module.exports = {
  evaluateCoupon,
  validateCouponCode,
  getBestCouponRecommendation
};
