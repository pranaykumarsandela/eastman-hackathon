import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Package,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  TrendingDown
} from 'lucide-react';
import AdminNavbar from '../../components/AdminNavbar';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { formatINR } from '../../utils/formatters';

export default function AdminInventoryPage() {
  const { addToast } = useNotification();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'LOW' | 'OUT'
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminProducts();
      if (res.success && res.data) {
        setProducts(res.data.products);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockAdjustment = async (productId, newStock) => {
    if (newStock < 0) return;
    try {
      setUpdatingId(productId);
      const res = await api.updateProductStock(productId, newStock);
      if (res.success && res.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stockQuantity: res.data.stockQuantity } : p))
        );
        addToast(`Inventory updated to ${res.data.stockQuantity} units`, 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update stock', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      (p.title || p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'OUT') return p.stockQuantity === 0;
    if (filterType === 'LOW') return p.stockQuantity > 0 && p.stockQuantity < 10;
    return true;
  });

  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;
  const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity < 10).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Inventory & Restock Controls
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Rapidly replenish stock, monitor depletion thresholds, and prevent checkout overselling
            </p>
          </div>

          <button
            onClick={fetchProducts}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Inventory
          </button>
        </div>

        {/* Quick Filter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setFilterType('ALL')}
            className={`p-4 rounded-2xl border text-left transition ${
              filterType === 'ALL'
                ? 'bg-slate-800 border-brand-500 shadow-md'
                : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>All Catalog Items</span>
              <Package className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-xl font-black text-white">{products.length}</span>
          </button>

          <button
            onClick={() => setFilterType('LOW')}
            className={`p-4 rounded-2xl border text-left transition ${
              filterType === 'LOW'
                ? 'bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
              <span>Low Stock (&lt; 10 units)</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xl font-black text-amber-400">{lowStockCount}</span>
          </button>

          <button
            onClick={() => setFilterType('OUT')}
            className={`p-4 rounded-2xl border text-left transition ${
              filterType === 'OUT'
                ? 'bg-rose-950/40 border-rose-500 shadow-md'
                : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
              <span>Out of Stock (0 units)</span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-xl font-black text-rose-400">{outOfStockCount}</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or category..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Product Inventory Table */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl overflow-hidden shadow-xs">
          {loading && products.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading inventory records...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No items matching this filter</p>
              <p className="text-xs text-slate-400 mt-1">All stock levels are currently healthy!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-800">
                    <th className="py-3 px-4 font-semibold">Product</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Current Stock</th>
                    <th className="py-3 px-4 font-semibold text-right">Quick Restock Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredProducts.map((prod) => {
                    const isOut = prod.stockQuantity === 0;
                    const isLow = prod.stockQuantity > 0 && prod.stockQuantity < 10;
                    const isUpdating = updatingId === prod.id;

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
                              <span className="text-[10px] text-slate-400">
                                Unit Price: {formatINR(prod.price)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 text-[11px] border border-slate-700 font-medium">
                            {prod.category}
                          </span>
                        </td>

                        {/* Current Stock */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              isOut
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {isOut ? (
                              <TrendingDown className="w-3.5 h-3.5" />
                            ) : isLow ? (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            {prod.stockQuantity} units
                          </span>
                        </td>

                        {/* Quick Restock Buttons */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              disabled={isUpdating}
                              onClick={() => handleStockAdjustment(prod.id, prod.stockQuantity + 5)}
                              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                            >
                              +5
                            </button>
                            <button
                              disabled={isUpdating}
                              onClick={() => handleStockAdjustment(prod.id, prod.stockQuantity + 10)}
                              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                            >
                              +10
                            </button>
                            <button
                              disabled={isUpdating}
                              onClick={() => handleStockAdjustment(prod.id, prod.stockQuantity + 25)}
                              className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 shadow-xs"
                            >
                              +25
                            </button>
                          </div>
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
