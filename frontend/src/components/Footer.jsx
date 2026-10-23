import React from 'react';
import { ShoppingCart, ShieldCheck, Zap, Database, Server, RefreshCw } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-20">
      {/* Guarantees row */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">PostgreSQL Powered</h4>
              <p className="text-xs text-slate-400 mt-0.5">ACID compliance with row-level locks</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Smart Savings Engine</h4>
              <p className="text-xs text-slate-400 mt-0.5">Deterministic best coupon matching</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Inventory Consistency</h4>
              <p className="text-xs text-slate-400 mt-0.5">Zero overselling with atomic updates</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Express + React Vite</h4>
              <p className="text-xs text-slate-400 mt-0.5">Clean REST APIs & modern UI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <span className="text-white font-bold">SmartCart</span> — Smart E-commerce & Checkout System
            <div className="text-xs text-slate-500">Built for hackathon demonstration with local PostgreSQL & pgAdmin.</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400">
          <span>₹ INR Standard Pricing</span>
          <span>•</span>
          <span>5% Documented GST</span>
          <span>•</span>
          <span>Free Delivery Above ₹999</span>
        </div>
      </div>
    </footer>
  );
}
