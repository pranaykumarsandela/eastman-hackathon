import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  PlusCircle,
  RefreshCw
} from 'lucide-react';
import AdminNavbar from '../../components/AdminNavbar';
import { api } from '../../services/api';
import { formatINR } from '../../utils/formatters';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getAdminMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load admin metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Store Operations Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time sales, live catalog inventory, and fulfillment tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <Link
              to="/admin/products/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Product
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {loading && !metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-800/60 rounded-3xl" />
            ))}
          </div>
        ) : metrics ? (
          <>
            {/* KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Gross Revenue */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Total Revenue</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-white tracking-tight">
                    {formatINR(metrics.orders?.totalRevenue || 0)}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Excludes cancelled orders
                  </span>
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Total Orders</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-white tracking-tight">
                    {metrics.orders?.totalOrders || 0}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Active lifetime checkouts
                  </span>
                </div>
              </div>

              {/* Product Catalog */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Catalog Products</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-white tracking-tight">
                    {metrics.products?.total || 0}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {metrics.products?.active || 0} active, {metrics.products?.inactive || 0} inactive
                  </span>
                </div>
              </div>

              {/* Low Stock Alert */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Low Stock Alert</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-amber-400 tracking-tight">
                    {metrics.products?.lowStock || 0}
                  </span>
                  <Link
                    to="/admin/inventory"
                    className="text-[11px] text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 mt-1 font-semibold"
                  >
                    Restock now <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Status Breakdown Section */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 mb-8">
              <h2 className="text-sm font-bold text-white mb-4">Orders by Fulfillment Status</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { status: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle, color: 'text-blue-400' },
                  { status: 'PROCESSING', label: 'Processing', icon: Clock, color: 'text-amber-400' },
                  { status: 'SHIPPED', label: 'Shipped', icon: Truck, color: 'text-purple-400' },
                  { status: 'DELIVERED', label: 'Delivered', icon: CheckCircle, color: 'text-emerald-400' },
                  { status: 'CANCELLED', label: 'Cancelled', icon: XCircle, color: 'text-rose-400' }
                ].map((item) => {
                  const count = metrics.orders?.statusCounts?.[item.status] || 0;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.status}
                      to={`/admin/orders?status=${item.status}`}
                      className="p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-2xl transition group"
                    >
                      <div className="flex items-center justify-between text-slate-400 group-hover:text-white mb-1">
                        <span className="text-xs font-semibold">{item.label}</span>
                        <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                      </div>
                      <span className="text-lg font-black text-white">{count}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white">Recent Orders</h2>
                <Link
                  to="/admin/orders"
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
                >
                  View All Orders <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {metrics.recentOrders && metrics.recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="pb-3 font-semibold">Order Number</th>
                        <th className="pb-3 font-semibold">Customer</th>
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Total Amount</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {metrics.recentOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 font-mono font-bold text-slate-200">
                            {ord.orderNumber}
                          </td>
                          <td className="py-3 text-slate-300">
                            <span className="block font-medium">{ord.customerName}</span>
                            <span className="block text-[11px] text-slate-500">{ord.email}</span>
                          </td>
                          <td className="py-3 text-slate-400 text-[11px]">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3 font-bold text-white">
                            {formatINR(ord.totalAmount)}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {ord.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Link
                              to={`/order-confirmation/${ord.orderNumber}`}
                              className="text-brand-400 hover:text-brand-300 font-semibold"
                            >
                              Inspect
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No orders registered yet.</p>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
