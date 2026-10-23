import React, { useEffect, useState } from 'react';
import { X, Tag, Sparkles, Check, Clock, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { formatINR, formatDate } from '../utils/formatters';

export default function CouponModal({ isOpen, onClose }) {
  const { appliedCoupon, applyCoupon, subtotal } = useCart();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getPublicCoupons()
        .then((res) => {
          if (res.success && res.data) {
            setCoupons(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Available Promo Coupons</h3>
              <p className="text-xs text-slate-500">Pick any eligible discount coupon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coupon list */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm animate-pulse">
              Loading available coupons...
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No promotional coupons active currently.
            </div>
          ) : (
            coupons.map((coupon) => {
              const isApplied = appliedCoupon && appliedCoupon.code === coupon.code;
              const isEligible = subtotal >= coupon.minOrder;
              const shortfall = Math.max(0, coupon.minOrder - subtotal);

              return (
                <div
                  key={coupon.id}
                  className={`relative p-4 rounded-2xl border transition-all ${
                    isApplied
                      ? 'bg-emerald-50/60 border-emerald-400 ring-1 ring-emerald-400'
                      : isEligible
                      ? 'bg-white border-slate-200 hover:border-brand-300 hover:shadow-md'
                      : 'bg-slate-50 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {/* Code Pill */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold px-3 py-1 bg-slate-900 text-white rounded-lg tracking-wider">
                          {coupon.code}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          {coupon.description}
                        </span>
                      </div>

                      {/* Terms */}
                      <div className="mt-2.5 text-xs text-slate-600 space-y-1">
                        <div>
                          • Min. cart value: <span className="font-bold text-slate-800">{formatINR(coupon.minOrder)}</span>
                        </div>
                        {coupon.maxDiscount && (
                          <div>
                            • Max discount cap: <span className="font-bold text-slate-800">{formatINR(coupon.maxDiscount)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-1">
                          <Clock className="w-3 h-3" />
                          <span>Valid till {formatDate(coupon.expiryDate)}</span>
                        </div>
                      </div>

                      {!isEligible && (
                        <div className="mt-2 text-[11px] font-semibold text-amber-600">
                          Add {formatINR(shortfall)} more to unlock this coupon
                        </div>
                      )}
                    </div>

                    {/* Apply action */}
                    <div>
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
                          <Check className="w-3.5 h-3.5" /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            const success = await applyCoupon(coupon.code);
                            if (success) onClose();
                          }}
                          disabled={!isEligible}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                            isEligible
                              ? 'bg-brand-600 hover:bg-brand-700 text-white active:scale-95'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Server-side validated
          </span>
          <button
            onClick={onClose}
            className="text-slate-700 hover:text-slate-900 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
