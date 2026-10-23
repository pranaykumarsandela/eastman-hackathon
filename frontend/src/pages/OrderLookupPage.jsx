import React, { useState } from 'react';
import { PackageCheck, Search, ShieldCheck, ArrowRight, Clock, MapPin, Truck, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';

export default function OrderLookupPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim() || !contact.trim()) {
      setError('Please provide both your Order Number and Contact info.');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const res = await api.lookupOrder(orderNumber.trim(), contact.trim());
      if (res.success && res.data) {
        setOrder(res.data);
      }
    } catch (err) {
      setError(err.message || 'No matching order found. Please verify your order number and contact email/phone.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <PackageCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Order Verification & Tracking
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            For privacy and security, enter your unique SmartCart Order Number and registered Email or Phone.
          </p>
        </div>

        {/* Lookup Form */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto">
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Order Number *
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. SC-20261023-AB12C"
                className="w-full px-4 py-2.5 text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Verification Email or Phone *
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="name@example.com or +91 98765 43210"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Searching order records...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Lookup Order</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Secure verification protects customer order details
            </span>
          </div>
        </div>

        {/* Order Result Card */}
        {order && (
          <div className="mt-8 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Reference</span>
                <div className="text-xl font-mono font-black text-slate-900">{order.orderNumber}</div>
                <div className="text-xs text-slate-500 mt-0.5">Placed on {formatDate(order.createdAt)}</div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  {order.orderStatus}
                </span>
              </div>
            </div>

            {/* Delivery & Payment Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer & Address</span>
                <div className="font-bold text-slate-900 text-sm">{order.customerName}</div>
                <div className="text-slate-600 mt-0.5">{order.address}, {order.city}, {order.state} - {order.postalCode}</div>
                <div className="text-slate-500 mt-1">Phone: {order.phone}</div>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment Details</span>
                <div className="font-bold text-slate-900 text-sm">Method: {order.paymentMethod}</div>
                <div className="text-slate-600 mt-0.5">Payment Status: <span className="font-bold text-emerald-700">{order.paymentStatus}</span></div>
                {order.couponCode && (
                  <div className="text-slate-500 mt-1">Coupon Used: <span className="font-mono font-bold text-brand-600">{order.couponCode}</span></div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Items In This Order
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {order.items?.map((item) => (
                  <div key={item.id} className="p-3.5 sm:p-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                      )}
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                        <div className="text-slate-500 mt-0.5">
                          Qty: {item.quantity} × {formatINR(item.unitPrice)}
                        </div>
                      </div>
                    </div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      {formatINR(item.lineTotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-sm max-w-sm ml-auto">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatINR(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-{formatINR(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-semibold text-slate-900">
                  {order.shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : formatINR(order.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5%)</span>
                <span className="font-semibold text-slate-900">{formatINR(order.taxAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base">
                <span className="font-bold text-slate-900">Final Total</span>
                <span className="text-xl font-black text-slate-900">{formatINR(order.totalAmount)}</span>
              </div>
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
