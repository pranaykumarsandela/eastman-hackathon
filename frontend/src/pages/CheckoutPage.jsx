import React, { useState, useEffect, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, Banknote, ArrowLeft, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FreeShippingProgressBar from '../components/FreeShippingProgressBar';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, appliedCoupon, clearCart } = useCart();
  const { addToast } = useNotification();
  const { user, isAuthenticated } = useAuth();

  // Form Fields
  const [formData, setFormData] = useState({
    customerName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    paymentMethod: 'COD' // 'COD' | 'SIMULATED_ONLINE'
  });

  // Sync user details when user loads
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || user.fullName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user]);

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendPreview, setBackendPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(true);

  // Generate unique idempotency key per checkout attempt
  const [idempotencyKey] = useState(() => `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  // Redirect if not logged in or cart empty
  useEffect(() => {
    if (!isAuthenticated) {
      addToast('Please sign in to proceed to checkout.', 'warning');
      navigate('/login', { state: { from: { pathname: '/checkout' } }, replace: true });
      return;
    }
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [isAuthenticated, cartItems, navigate, addToast]);

  // Fetch live backend calculation preview
  const fetchPreview = async () => {
    if (cartItems.length === 0) return;
    setLoadingPreview(true);
    try {
      const itemsPayload = cartItems.map((i) => ({ productId: i.id, quantity: i.quantity }));
      const couponCode = appliedCoupon ? appliedCoupon.code : null;
      const res = await api.previewCheckout(itemsPayload, couponCode);

      if (res.success && res.data) {
        setBackendPreview(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Error fetching server order calculations', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [cartItems, appliedCoupon]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim() || formData.customerName.trim().length < 2) {
      errors.customerName = 'Please enter your full name (at least 2 letters)';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 10) {
      errors.phone = 'Please enter a valid phone number (10+ digits)';
    }
    if (!formData.address.trim() || formData.address.trim().length < 5) {
      errors.address = 'Please enter a detailed street address';
    }
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }
    if (!formData.postalCode.trim() || formData.postalCode.trim().length < 4) {
      errors.postalCode = 'Valid PIN / postal code is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast('Please fill in all required shipping fields properly.', 'warning');
      return;
    }

    if (backendPreview?.hasStockIssues) {
      addToast('Some products in your cart have stock shortages. Please review your cart.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: formData.customerName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        paymentMethod: formData.paymentMethod,
        items: cartItems.map((i) => ({ productId: i.id, quantity: i.quantity })),
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        idempotencyKey
      };

      const res = await api.placeOrder(payload);

      if (res.success && res.data) {
        addToast('Order placed successfully! Thank you for shopping with SmartCart.', 'success');
        clearCart();
        navigate(`/order-confirmation/${res.data.orderNumber}`, {
          state: { order: res.data }
        });
      }
    } catch (err) {
      addToast(err.message || 'Failed to place order. Please try again.', 'error');
      // Re-fetch preview to update stock if someone else bought items
      fetchPreview();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex items-center gap-2 mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
          Secure Checkout
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form: Delivery & Payment Details */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Customer & Shipping Section */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Shipping & Delivery Details</h2>
                  <p className="text-xs text-slate-500">Where should we deliver your order?</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full px-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 ${
                      formErrors.customerName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.customerName && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.customerName}</p>
                  )}
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className={`w-full px-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 ${
                        formErrors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className={`w-full px-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 ${
                        formErrors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Street Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Street Address & House/Flat No. *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Flat 402, Green Valley Apartments, Hitech City"
                    className={`w-full px-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 ${
                      formErrors.address ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.address && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.address}</p>
                  )}
                </div>

                {/* City, State, PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Hyderabad"
                      className={`w-full px-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 ${
                        formErrors.city ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                    {formErrors.city && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Telangana"
                      className={`w-full px-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 ${
                        formErrors.state ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                    {formErrors.state && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="500081"
                      className={`w-full px-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 ${
                        formErrors.postalCode ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                    {formErrors.postalCode && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.postalCode}</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Payment Option</h2>
                  <p className="text-xs text-slate-500">Select payment method for this order</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Cash On Delivery */}
                <label className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition ${
                  formData.paymentMethod === 'COD'
                    ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={handleChange}
                    className="mt-1 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-brand-600" />
                      <span className="font-bold text-sm text-slate-900">Cash on Delivery (COD)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Zero Fee
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Pay easily using Cash or UPI at your doorstep when your package arrives.
                    </p>
                  </div>
                </label>

                {/* Simulated Online Payment */}
                <label className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition ${
                  formData.paymentMethod === 'SIMULATED_ONLINE'
                    ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="SIMULATED_ONLINE"
                    checked={formData.paymentMethod === 'SIMULATED_ONLINE'}
                    onChange={handleChange}
                    className="mt-1 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-brand-600" />
                      <span className="font-bold text-sm text-slate-900">Simulated Instant Payment</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                        Demo Mode
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Demonstrates instant online transaction confirmation without storing sensitive payment credentials.
                    </p>
                  </div>
                </label>
              </div>

              {/* Safety banner */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>SmartCart never stores card numbers, CVVs, or bank credentials.</span>
              </div>
            </div>

          </div>

          {/* Right Column: Live Backend Verified Summary */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Authoritative Order Review</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 font-bold uppercase">
                  Server Verified
                </span>
              </h3>

              {/* Items List Mini */}
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-800 line-clamp-1">{item.name}</div>
                        <div className="text-slate-400 font-medium">Qty: {item.quantity} × {formatINR(item.price)}</div>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">{formatINR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Stock issues notice if any */}
              {backendPreview?.hasStockIssues && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Stock discrepancy detected:</div>
                    {backendPreview.issues.map((issue, idx) => (
                      <div key={idx} className="mt-0.5">• {issue}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Free delivery tracker */}
              {backendPreview && (
                <FreeShippingProgressBar
                  subtotal={backendPreview.subtotal - backendPreview.discountAmount}
                  threshold={backendPreview.freeShippingThreshold}
                />
              )}

              {/* Financial Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    {backendPreview ? formatINR(backendPreview.subtotal) : '...'}
                  </span>
                </div>

                {backendPreview?.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount ({backendPreview.coupon?.code})</span>
                    <span>-{formatINR(backendPreview.discountAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-900">
                    {backendPreview ? (
                      backendPreview.shippingFee === 0 ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        formatINR(backendPreview.shippingFee)
                      )
                    ) : '...'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>GST (5% Policy)</span>
                  <span className="font-semibold text-slate-900">
                    {backendPreview ? formatINR(backendPreview.taxAmount) : '...'}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-base">
                  <span className="font-bold text-slate-900">Final Payable Amount</span>
                  <span className="text-2xl font-black text-slate-900">
                    {backendPreview ? formatINR(backendPreview.totalAmount) : '...'}
                  </span>
                </div>
              </div>

              {/* Submit Order Button */}
              <button
                type="submit"
                disabled={isSubmitting || backendPreview?.hasStockIssues || loadingPreview}
                className="w-full mt-4 py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Executing Transaction...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Place Order • {backendPreview ? formatINR(backendPreview.totalAmount) : ''}</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                By placing this order, inventory rows are locked using <code className="text-slate-600 font-mono">SELECT ... FOR UPDATE</code> to ensure zero overselling.
              </p>
            </div>

          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
}
