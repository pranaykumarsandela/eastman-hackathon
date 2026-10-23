import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

// Storefront Pages
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderLookupPage from './pages/OrderLookupPage';
import NotFoundPage from './pages/NotFoundPage';

// Auth & Customer Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminProductFormPage from './pages/admin/AdminProductFormPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminInventoryPage from './pages/admin/AdminInventoryPage';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Storefront Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
              <Route path="/orders/lookup" element={<OrderLookupPage />} />

              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Customer Account Routes (Protected) */}
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Portal Routes (Admin Guarded) */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <AdminRoute>
                    <AdminProductsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/products/new"
                element={
                  <AdminRoute>
                    <AdminProductFormPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/products/:id/edit"
                element={
                  <AdminRoute>
                    <AdminProductFormPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <AdminRoute>
                    <AdminOrdersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/inventory"
                element={
                  <AdminRoute>
                    <AdminInventoryPage />
                  </AdminRoute>
                }
              />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
