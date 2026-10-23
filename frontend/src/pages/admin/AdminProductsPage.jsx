import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Search,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import AdminNavbar from '../../components/AdminNavbar';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { formatINR } from '../../utils/formatters';

export default function AdminProductsPage() {
  const { addToast } = useNotification();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminProducts({
        search: search.trim() || undefined,
        category: categoryFilter || undefined
      });
      if (res.success && res.data) {
        setProducts(res.data.products);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch categories:', err.message);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, categoryFilter]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      setActionLoading(id);
      const res = await api.toggleProductStatus(id);
      if (res.success && res.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: res.data.isActive } : p))
        );
        addToast(
          `Product ${res.data.isActive ? 'activated' : 'deactivated'} successfully`,
          'success'
        );
      }
    } catch (err) {
      addToast(err.message || 'Error updating product status', 'error');
    } finally {
      setActionLoading(null);
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
              Catalog & Inventory Management
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Edit product pricing, manage inventory stock, and control storefront visibility
            </p>
          </div>

          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add New Product
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-4 mb-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by title or description..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-3 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition w-full sm:w-auto"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={fetchProducts}
              className="p-2 bg-slate-900/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl overflow-hidden shadow-xs">
          {loading && products.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading catalog...</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No products found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or category filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-800">
                    <th className="py-3 px-4 font-semibold">Product</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Price</th>
                    <th className="py-3 px-4 font-semibold">Stock</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {products.map((prod) => {
                    const isLowStock = prod.stockQuantity < 10;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                        {/* Title & Image */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.imageUrl}
                              alt={prod.title || prod.name}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-900 border border-slate-700 shrink-0"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';
                              }}
                            />
                            <div>
                              <span className="font-bold text-white line-clamp-1 block">
                                {prod.title || prod.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                /{prod.slug || prod.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 text-[11px] border border-slate-700/80 font-medium">
                            {prod.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 font-bold text-white">
                          {formatINR(prod.price)}
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              prod.stockQuantity === 0
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : isLowStock
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isLowStock && <AlertTriangle className="w-3 h-3" />}
                            {prod.stockQuantity} units
                          </span>
                        </td>

                        {/* Visibility Status */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleStatus(prod.id, prod.isActive)}
                            disabled={actionLoading === prod.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition border ${
                              prod.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {prod.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/admin/products/${prod.id}/edit`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
