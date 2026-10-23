const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // Retrieve token from localStorage if available
  const token = localStorage.getItem('smartcart_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      let message = json.message || `Request failed with status ${res.status}`;
      if (json.errors && Array.isArray(json.errors) && json.errors.length > 0) {
        const errorDetails = json.errors.map((e) => e.message || `${e.field}: invalid`).join('. ');
        message = `${message}: ${errorDetails}`;
      }
      const error = new Error(message);
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

  // Authentication
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),

  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),

  getMe: () => request('/auth/me'),

  // Products (Public)
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

  getMyOrders: () => request('/orders/my-orders'),

  lookupOrder: (orderNumber, contact) => request('/orders/lookup', {
    method: 'POST',
    body: JSON.stringify({ orderNumber, contact })
  }),

  getOrderById: (orderNumber, contact) => request(`/orders/${orderNumber}?contact=${encodeURIComponent(contact)}`),

  // Admin APIs (Protected)
  getAdminMetrics: () => request('/admin/metrics'),

  getAdminProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/admin/products?${query.toString()}`);
  },

  createProduct: (productData) => request('/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  }),

  updateProduct: (id, productData) => request(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  }),

  toggleProductStatus: (id) => request(`/admin/products/${id}/toggle`, {
    method: 'PATCH'
  }),

  updateProductStock: (id, stockQuantity) => request(`/admin/products/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stockQuantity })
  }),

  getAdminOrders: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/admin/orders?${query.toString()}`);
  },

  updateOrderStatus: (id, orderStatus) => request(`/admin/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ orderStatus })
  })
};
