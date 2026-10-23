import React from 'react';
import { ShoppingBag, ShieldCheck, Zap, Truck, RotateCcw, Headphones, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-20">
      {/* Customer Trust Pillars */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">100% Genuine Products</h4>
              <p className="text-xs text-slate-400 mt-0.5">Direct from verified brands & makers</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Free Express Delivery</h4>
              <p className="text-xs text-slate-400 mt-0.5">On all purchases over ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">7-Day Easy Returns</h4>
              <p className="text-xs text-slate-400 mt-0.5">Hassle-free replacement policy</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Secure Checkout</h4>
              <p className="text-xs text-slate-400 mt-0.5">Protected orders & doorstep delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3 text-center md:text-left">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-bold text-base">SmartCart</div>
            <div className="text-xs text-slate-400">Intelligent e-commerce storefront with automated coupon savings and live inventory.</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <Link to="/" className="hover:text-white transition">Catalog</Link>
          <Link to="/cart" className="hover:text-white transition">Shopping Cart</Link>
          <Link to="/orders/lookup" className="hover:text-white transition">Order Tracking</Link>
          <Link to="/login" className="hover:text-white transition">Account</Link>
        </div>
      </div>
    </footer>
  );
}
