import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, PackageCheck, Zap, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/formatters';

export default function Navbar({ onSearchChange, searchTerm = '' }) {
  const { totalItemCount, subtotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [localSearch, setLocalSearch] = useState(searchTerm);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearch);
    }
    if (location.pathname !== '/') {
      navigate(`/?search=${encodeURIComponent(localSearch)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top micro banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-slate-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-white">SmartCart Enterprise</span>
            <span className="hidden sm:inline text-slate-400">• ACID Transactions & Deterministic Smart Savings</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> PostgreSQL Verified
            </span>
            <Link to="/orders/lookup" className="hover:text-white transition flex items-center gap-1">
              <PackageCheck className="w-3.5 h-3.5" /> Track Order
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold tracking-tight text-slate-900">Smart<span className="text-brand-600">Cart</span></span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 tracking-wide uppercase">PRO</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium -mt-1 hidden sm:block">Intelligent E-Commerce</p>
            </div>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl mx-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search headphones, laptops, sneakers, fashion..."
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  if (onSearchChange) onSearchChange(e.target.value);
                }}
                className="w-full pl-11 pr-24 py-2.5 text-sm bg-slate-100/80 border border-slate-200 rounded-full focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition shadow-inner placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-xs transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Action triggers */}
          <div className="flex items-center gap-3">
            {/* Order lookup */}
            <Link
              to="/orders/lookup"
              className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition"
            >
              <PackageCheck className="w-4 h-4 text-slate-500" />
              <span>Lookup Order</span>
            </Link>

            {/* Cart trigger button */}
            <Link
              to="/cart"
              className="relative flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition group"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-brand-400 group-hover:scale-110 transition-transform" />
                {totalItemCount > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 bg-amber-500 text-slate-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white animate-bounce-short">
                    {totalItemCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-[10px] text-slate-400 font-medium leading-none">Cart</div>
                <div className="text-xs font-bold text-white leading-tight mt-0.5">
                  {formatINR(subtotal)}
                </div>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
