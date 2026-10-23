import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Calendar,
  User,
  MapPin
} from 'lucide-react';
import AdminNavbar from '../../components/AdminNavbar';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { formatINR } from '../../utils/formatters';

const STATUS_OPTIONS = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const { addToast } = useNotification();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminOrders({
        search: search.trim() || undefined,
        status: statusFilter || undefined
      });
      if (res.success && res.data) {
        const orderList = Array.isArray(res.data) ? res.data : (res.data.orders || []);
        setOrders(orderList);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await api.updateOrderStatus(orderId, newStatus);
      if (res.success && res.data) {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderId ? { ...ord, orderStatus: res.data.orderStatus } : ord))
        );
        addToast(`Order #${orderId} marked as ${newStatus}`, 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const setStatus = (status) => {
    setStatusFilter(status);
    if (status) {
      setSearchParams({ status });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Order Fulfillment & Management
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Review customer orders, update tracking statuses, and verify fulfillment
            </p>
          </div>

          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Orders
          </button>
        </div>

        {/* Filters and Tabs */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-4 mb-6 space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setStatus('')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                statusFilter === ''
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              All Orders
            </button>
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st}
                onClick={() => setStatus(st)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number (e.g. SC-2026...), customer name, or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading && orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-12 text-center">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No orders match this criteria</p>
              <p className="text-xs text-slate-400 mt-1">
                Try selecting "All Orders" or clearing your search term.
              </p>
            </div>
          ) : (
            orders.map((order) => {
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
                  className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-xs hover:border-slate-600 transition"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-white">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {dateStr}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-3">
                        <span className="font-semibold text-white">{order.customerName}</span>
                        <span className="text-slate-400">• {order.email}</span>
                        {order.phone && <span className="text-slate-400">• {order.phone}</span>}
                      </div>
                    </div>

                    {/* Status updater */}
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                          Update Status
                        </span>
                        <select
                          value={order.orderStatus}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`mt-1 py-1 px-3 bg-slate-900 border rounded-xl text-xs font-bold transition focus:outline-none ${
                            order.orderStatus === 'CONFIRMED'
                              ? 'text-blue-400 border-blue-500/40'
                              : order.orderStatus === 'PROCESSING'
                              ? 'text-amber-400 border-amber-500/40'
                              : order.orderStatus === 'SHIPPED'
                              ? 'text-purple-400 border-purple-500/40'
                              : order.orderStatus === 'DELIVERED'
                              ? 'text-emerald-400 border-emerald-500/40'
                              : 'text-rose-400 border-rose-500/40'
                          }`}
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Summary row */}
                  <div className="py-3 border-b border-slate-700/60 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-semibold">
                        {order.itemCount || 1} Item(s)
                      </span>
                      <span className="text-slate-400">
                        Payment: <span className="font-semibold text-slate-200">{order.paymentMethod || 'COD'}</span> ({order.paymentStatus || 'PENDING'})
                      </span>
                      {order.couponCode && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-[11px] font-mono">
                          Coupon: {order.couponCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Bar: Shipping address & Total */}
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <span>{order.address}</span>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total Amount</span>
                        <span className="text-base font-black text-white">
                          {formatINR(order.totalAmount)}
                        </span>
                      </div>

                      <Link
                        to={`/order-confirmation/${order.orderNumber}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition"
                      >
                        Receipt <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
