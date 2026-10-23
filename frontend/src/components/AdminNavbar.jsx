import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingBag,
  AlertTriangle,
  Store,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Products', path: '/admin/products', icon: Package, end: true },
    { name: 'Add Product', path: '/admin/products/new', icon: PlusCircle },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Inventory', path: '/admin/inventory', icon: AlertTriangle }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Badge */}
          <div className="flex items-center gap-6">
            <Link to="/admin" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-black shadow-md group-hover:bg-brand-400 transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-white block">
                  SmartCart <span className="text-brand-400 text-xs uppercase tracking-wider font-bold">Admin</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-1">Management Portal</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </Link>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600/30 text-brand-300 font-bold text-xs flex items-center justify-center">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <span className="text-xs text-slate-300 font-medium max-w-[120px] truncate">
                {user?.fullName || 'Admin'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {item.name}
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
}
