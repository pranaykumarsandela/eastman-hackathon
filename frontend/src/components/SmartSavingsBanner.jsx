import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Tag, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/formatters';

export default function SmartSavingsBanner({ onOpenAllCoupons }) {
  const { subtotal, smartRecommendation, appliedCoupon, applyCoupon, removeCoupon } = useCart();

  if (subtotal <= 0) return null;

  const best = smartRecommendation?.bestCoupon;
  const isBestApplied = appliedCoupon && best && appliedCoupon.code === best.code;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-indigo-500/10 border border-amber-500/30 p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Assistant Info */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                Smart Savings Assistant
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Deterministic Coupon Optimizer
              </span>
            </div>

            {best ? (
              <div className="mt-1">
                <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Save {formatINR(best.discountAmount)} with code <span className="text-brand-600 font-extrabold">{best.code}</span></span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {smartRecommendation.reason}
                </p>
              </div>
            ) : smartRecommendation?.nudge ? (
              <div className="mt-1">
                <div className="text-sm font-bold text-slate-900">
                  {smartRecommendation.nudge}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Keep shopping to unlock maximum checkout savings!
                </p>
              </div>
            ) : (
              <div className="mt-1 text-sm font-medium text-slate-700">
                Explore available promotional coupons for instant discounts.
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {best && (
            isBestApplied ? (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4" /> Best Deal Applied
              </div>
            ) : (
              <button
                onClick={() => applyCoupon(best.code)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Apply {best.code}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          )}

          {onOpenAllCoupons && (
            <button
              onClick={onOpenAllCoupons}
              className="px-3.5 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 rounded-xl transition border border-brand-200 flex items-center gap-1"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>View All</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
