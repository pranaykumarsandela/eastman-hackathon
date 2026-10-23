import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, PackageCheck, User, LogOut, ShieldCheck, ChevronDown, LayoutDashboard, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/formatters';

export default function Navbar({ onSearchChange, searchTerm = '' }) {
  const { totalItemCount, subtotal } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearch);
    }
    if (location.pathname !== '/') {
      navigate(`/?search=${encodeURIComponent(localSearch)}`);
    }
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Customer Announcement Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-slate-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-white">Festive Mega Savings</span>
            <span className="hidden sm:inline text-slate-400">• Free Express Delivery on orders over ₹999</span>
          </div>
          <div className="flex items-center gap-5 text-xs font-medium">
            <span className="hidden md:flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Genuine Products
            </span>
            <Link to="/orders/lookup" className="hover:text-white transition flex items-center gap-1 text-slate-300">
              <PackageCheck className="w-3.5 h-3.5" /> Track Order
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 sm:gap-6">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Smart<span className="text-brand-600">Cart</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-brand-100 text-brand-700 tracking-wide">
                  STORE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium -mt-0.5 hidden sm:block">Intelligent Shopping</p>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl mx-1 sm:mx-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search headphones, laptops, sneakers, fashion..."
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  if (onSearchChange) onSearchChange(e.target.value);
                }}
                className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-full focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition shadow-inner placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-xs transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Actions: Account + Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* User Account Dropdown */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-2xl border border-slate-200 transition"
                >
                  <div className="w-7 h-7 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="line-clamp-1 max-w-[110px]">{user?.fullName?.split(' ')[0]}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{user?.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-bold text-xs text-slate-900">{user?.fullName}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-brand-600 hover:bg-brand-50 transition"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <User className="w-4 h-4 text-slate-400" /> My Orders & Profile
                    </Link>

                    <Link
                      to="/orders/lookup"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <PackageCheck className="w-4 h-4 text-slate-400" /> Track Any Order
                    </Link>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-brand-600 hover:bg-slate-100 rounded-2xl border border-slate-200 transition"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Redesigned Spacious Cart Button */}
            <Link
              to="/cart"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-sm hover:shadow-md transition group shrink-0 border border-slate-800"
              aria-label="View Shopping Cart"
            >
              {/* Icon with Counter Badge */}
              <div className="relative flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-brand-400 group-hover:scale-105 transition-transform" />
                {totalItemCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-amber-400 text-slate-950 text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-slate-900">
                    {totalItemCount}
                  </span>
                )}
              </div>

              {/* Text: Cart + Total */}
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-xs font-bold text-white">
                  Cart
                </span>
                {totalItemCount > 0 && (
                  <span className="text-xs font-bold text-amber-400">
                    ({totalItemCount})
                  </span>
                )}
                {subtotal > 0 && (
                  <span className="hidden sm:inline-block text-[11px] font-extrabold text-slate-200 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700/80 ml-0.5">
                    {formatINR(subtotal)}
                  </span>
                )}
              </div>
            </Link>

          </div>

        </div>
      </div>
    </header>
  );
}
