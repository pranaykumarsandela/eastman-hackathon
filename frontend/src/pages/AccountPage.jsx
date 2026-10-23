import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Shield,
  ShoppingBag,
  Package,
  Calendar,
  ExternalLink,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';

const STATUS_CONFIG = {
  CONFIRMED: {
    label: 'Order Confirmed',
    icon: CheckCircle,
    color: 'text-blue-700 bg-blue-50 border-blue-200'
  },
  PROCESSING: {
    label: 'Processing',
    icon: Clock,
    color: 'text-amber-700 bg-amber-50 border-amber-200'
  },
  SHIPPED: {
    label: 'Out for Delivery',
    icon: Truck,
    color: 'text-purple-700 bg-purple-50 border-purple-200'
  },
  DELIVERED: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-rose-700 bg-rose-50 border-rose-200'
  }
};

export default function AccountPage() {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.getMyOrders();
        if (res.success && res.data) {
          setOrders(res.data);
        }
      } catch (err) {
        setError(err.message || 'Unable to retrieve your order history.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Breadcrumb */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              My Account
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your personal profile and view your past orders
            </p>
          </div>

          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition self-start sm:self-auto"
            >
              <Shield className="w-3.5 h-3.5" />
              Open Admin Portal
            </Link>
          )}
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center font-bold text-xl">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {user?.fullName || 'Customer'}
                  </h2>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isAdmin
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isAdmin ? 'Store Administrator' : 'Verified Customer'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user?.email}
                  </span>
                  {user?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {user?.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-center sm:text-right">
              <span className="text-[11px] font-medium text-slate-400 block">Total Orders</span>
              <span className="text-base font-black text-slate-900">{orders.length}</span>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-600" />
              Recent Orders
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/4 mb-3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 bg-white rounded-3xl border border-rose-200 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-xs text-rose-700 font-medium">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center max-w-lg mx-auto">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No orders placed yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Once you place an order on SmartCart, you can review its status and digital receipt right here.
              </p>
              <div className="mt-5">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Explore Catalog
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusInfo = STATUS_CONFIG[order.orderStatus] || {
                  label: order.orderStatus,
                  icon: Package,
                  color: 'text-slate-700 bg-slate-100 border-slate-200'
                };
                const StatusIcon = statusInfo.icon;
                const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-slate-300 transition"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          Placed on {dateStr}
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-slate-400 block">Total Amount</span>
                        <span className="text-base font-black text-slate-900">
                          {formatINR(order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Order items preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="py-4 space-y-2 border-b border-slate-100">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-slate-700 font-medium">
                              {item.title} <span className="text-slate-400">× {item.quantity}</span>
                            </span>
                            <span className="text-slate-900 font-bold">
                              {formatINR(item.totalPrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="text-slate-500">
                        Deliver to: <span className="font-semibold text-slate-800">{order.city}, {order.state}</span>
                      </div>

                      <Link
                        to={`/order-confirmation/${order.orderNumber}`}
                        className="inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-brand-700 self-start sm:self-auto"
                      >
                        View Order Receipt & Details <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
