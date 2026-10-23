import React from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { CheckCircle, PackageCheck, Printer, ArrowRight, ShieldCheck, MapPin, CreditCard, Banknote } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { formatINR, formatDate } from '../utils/formatters';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Success Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-brand-500" />
          
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
            <CheckCircle className="w-9 h-9" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full">
            Order Confirmed & Verified
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 tracking-tight">
            Thank you for your order!
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
            Your transaction has been securely processed and is being prepared for dispatch.
          </p>

          {/* Order Reference Badge */}
          <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl shadow-inner">
            <span className="text-xs text-slate-500 font-medium">Order Reference:</span>
            <span className="font-mono text-base font-black text-slate-900 tracking-wider">
              {orderNumber || order?.orderNumber}
            </span>
          </div>

          {/* Action Row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <Link
              to="/orders/lookup"
              className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <PackageCheck className="w-4 h-4" /> Track in Orders
            </Link>
          </div>
        </div>

        {/* Detailed Receipt Breakdown */}
        {order && (
          <div className="mt-8 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Purchase Receipt & Snapshots
            </h2>

            {/* Customer & Delivery details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Delivering to</span>
                <div className="font-bold text-slate-900 text-sm">{order.customerName}</div>
                <div className="text-slate-600 mt-0.5 leading-relaxed">{order.address}</div>
                <div className="text-slate-500 mt-1">Contact: {order.phone} • {order.email}</div>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Payment & Status</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                  {order.paymentMethod === 'COD' ? (
                    <>
                      <Banknote className="w-4 h-4 text-emerald-600" /> Cash on Delivery
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 text-brand-600" /> Simulated Online Payment
                    </>
                  )}
                </div>
                <div className="mt-1 text-slate-600">
                  Status: <span className="font-bold text-emerald-700">{order.orderStatus}</span>
                </div>
                <div className="text-slate-400 mt-1">
                  Placed: {formatDate(order.createdAt)}
                </div>
              </div>
            </div>

            {/* Items Purchased Snapshot */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Items Snapshot at Purchase
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="p-3.5 sm:p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                      <div className="text-slate-500 mt-0.5">
                        Qty: {item.quantity} × {formatINR(item.unitPrice)}
                      </div>
                    </div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      {formatINR(item.lineTotal || (item.unitPrice * item.quantity))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-sm max-w-sm ml-auto">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">{formatINR(order.subtotal)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Savings</span>
                  <span>-{formatINR(order.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-semibold text-slate-800">
                  {order.shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : formatINR(order.shippingFee)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>GST Tax (5%)</span>
                <span className="font-semibold text-slate-800">{formatINR(order.taxAmount)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between text-base">
                <span className="font-bold text-slate-900">Paid / Payable Total</span>
                <span className="text-xl font-black text-slate-900">{formatINR(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Continue Shopping button */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg transition active:scale-95"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
