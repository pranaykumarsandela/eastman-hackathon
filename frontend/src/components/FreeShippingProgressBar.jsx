import React from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function FreeShippingProgressBar({ subtotal, threshold = 999 }) {
  const current = Math.max(0, subtotal);
  const remaining = Math.max(0, threshold - current);
  const percentage = Math.min(100, Math.round((current / threshold) * 100));
  const isFree = remaining === 0;

  return (
    <div className="bg-slate-100/80 rounded-2xl p-3.5 border border-slate-200/80">
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Truck className={`w-4 h-4 ${isFree ? 'text-emerald-600' : 'text-brand-600'}`} />
          {isFree ? (
            <span className="text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> You've unlocked FREE Delivery!
            </span>
          ) : (
            <span>
              Add <span className="text-brand-600 font-extrabold">{formatINR(remaining)}</span> more for <span className="font-extrabold">FREE Delivery</span>
            </span>
          )}
        </div>
        <span className="font-semibold text-slate-500">{percentage}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            isFree
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
              : 'bg-gradient-to-r from-brand-500 to-sky-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
