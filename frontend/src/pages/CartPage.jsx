import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Tag, ShieldCheck, Sparkles, Check, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EmptyState from '../components/EmptyState';
import FreeShippingProgressBar from '../components/FreeShippingProgressBar';
import SmartSavingsBanner from '../components/SmartSavingsBanner';
import CouponModal from '../components/CouponModal';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/formatters';

export default function CartPage() {
  const {
    cartItems,
    subtotal,
    totalItemCount,
    updateQuantity,
    removeFromCart,
    clearCart,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    isRevalidating
  } = useCart();

  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  // Authoritative preliminary client estimates (backend re-verifies on checkout)
  const taxableAmount = Math.max(0, subtotal - couponDiscount);
  const shippingFee = (taxableAmount >= 999 || taxableAmount === 0) ? 0.00 : 79.00;
  const taxAmount = Math.round((taxableAmount * 0.05) * 100) / 100; // 5% GST
  const grandTotal = Math.round((taxableAmount + shippingFee + taxAmount) * 100) / 100;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const ok = await applyCoupon(couponInput.trim());
    if (ok) setCouponInput('');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full flex items-center justify-center">
          <EmptyState
            title="Your shopping cart is empty"
            message="Discover premium electronics, curated fashion, and smart accessories to start shopping."
            actionText="Explore Catalog"
            actionLink="/"
            icon={ShoppingBag}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Breadcrumb / Back button */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
          <div className="text-xs text-slate-500 font-medium">
            <span>{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in your cart</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
          Shopping Cart & Savings
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Free Delivery Bar */}
            <FreeShippingProgressBar subtotal={taxableAmount} threshold={999} />

            {/* Smart Savings Assistant Banner */}
            <SmartSavingsBanner onOpenAllCoupons={() => setIsCouponModalOpen(true)} />

            {/* Items Container */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Cart Items</span>
                <button
                  onClick={clearCart}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition"
                >
                  Clear Cart
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => {
                  const lineTotal = item.price * item.quantity;
                  const isMaxStock = item.quantity >= item.stockQuantity;

                  return (
                    <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Image & Title */}
                      <div className="flex items-center gap-4 flex-1">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {item.category}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                            {item.name}
                          </h3>
                          <div className="mt-1 text-xs text-slate-500 font-medium">
                            Unit Price: <span className="font-bold text-slate-800">{formatINR(item.price)}</span>
                            {isMaxStock && (
                              <span className="ml-2 text-amber-600 font-semibold">• Max stock reached ({item.stockQuantity})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Price */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 font-bold transition rounded-l-xl text-sm"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-xs font-bold text-slate-900 w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isMaxStock}
                            className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 font-bold transition rounded-r-xl disabled:opacity-30 text-sm"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right min-w-[90px]">
                          <div className="text-sm sm:text-base font-extrabold text-slate-900">
                            {formatINR(lineTotal)}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Coupon Form */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Coupon Box */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-600" /> Coupon Promo
                </span>
                <button
                  onClick={() => setIsCouponModalOpen(true)}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  View Offers
                </button>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-2xl p-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-extrabold bg-emerald-700 text-white px-2 py-0.5 rounded-md">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-xs font-bold text-emerald-800">Applied</span>
                    </div>
                    <div className="text-xs text-emerald-700 font-semibold mt-1">
                      Discount: -{formatINR(couponDiscount)}
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon (e.g. SMART20)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
                  >
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Order Summary Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Cart Subtotal</span>
                  <span className="font-semibold text-slate-800">{formatINR(subtotal)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-semibold">
                    <span>Coupon Savings ({appliedCoupon?.code})</span>
                    <span>-{formatINR(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600">
                  <span>Estimated Delivery</span>
                  <span className="font-semibold text-slate-800">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      formatINR(shippingFee)
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>GST Tax (5% documented)</span>
                  <span className="font-semibold text-slate-800">{formatINR(taxAmount)}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-base">
                  <span className="font-bold text-slate-900">Payable Total</span>
                  <span className="text-xl font-extrabold text-slate-900">{formatINR(grandTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full mt-4 py-3.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> PostgreSQL ACID Guaranteed Checkout
                </span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Available Coupons Modal */}
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
