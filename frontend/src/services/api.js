const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(json.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = json;
      throw error;
    }

    return json;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const offlineError = new Error('Cannot connect to SmartCart backend server. Please verify backend is running on port 5000.');
      offlineError.isNetworkError = true;
      throw offlineError;
    }
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/products?${query.toString()}`);
  },

  getProductById: (id) => request(`/products/${id}`),

  getCategories: () => request('/categories'),

  // Coupons
  getPublicCoupons: () => request('/coupons'),

  validateCoupon: (code, subtotal) => request('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal })
  }),

  getCouponRecommendation: (subtotal) => request(`/coupons/recommendation?subtotal=${subtotal}`),

  // Checkout
  previewCheckout: (items, couponCode) => request('/checkout/preview', {
    method: 'POST',
    body: JSON.stringify({ items, couponCode })
  }),

  // Orders
  placeOrder: (orderData) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),

  lookupOrder: (orderNumber, contact) => request('/orders/lookup', {
    method: 'POST',
    body: JSON.stringify({ orderNumber, contact })
  }),

  getOrderById: (orderNumber, contact) => request(`/orders/${orderNumber}?contact=${encodeURIComponent(contact)}`)
};
