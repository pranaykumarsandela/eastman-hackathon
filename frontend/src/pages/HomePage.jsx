import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import SmartSavingsBanner from '../components/SmartSavingsBanner';
import CouponModal from '../components/CouponModal';
import { SlidersHorizontal, ArrowUpDown, Check, RefreshCw, AlertTriangle } from 'lucide-react';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamQuery = searchParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('rating_desc');
  const [searchTerm, setSearchTerm] = useState(searchParamQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick view modal
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Coupon modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  // Sync searchTerm with URL query param if changed
  useEffect(() => {
    if (searchParamQuery !== searchTerm) {
      setSearchTerm(searchParamQuery);
    }
  }, [searchParamQuery]);

  // Load categories
  useEffect(() => {
    api.getCategories()
      .then((res) => {
        if (res.success && res.data) {
          setCategories(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch products from backend
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        sortBy,
        search: searchTerm.trim() || undefined
      };
      const res = await api.getProducts(params);
      if (res.success && res.data) {
        setProducts(res.data.products);
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to SmartCart database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, searchTerm]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar onSearchChange={setSearchTerm} searchTerm={searchTerm} />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-slate-100/60 border-b border-slate-200/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-200 text-brand-700 rounded-full text-xs font-bold mb-3">
                <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
                Next-Gen Smart Cart & Checkout Architecture
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Curated Products with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Smart Savings</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                Seamless real-time inventory management, row-level PostgreSQL transaction locking, and a deterministic coupon savings engine.
              </p>
            </div>

            {/* Quick stats badge */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <div className="px-4 py-2 text-center border-r border-slate-100">
                <div className="text-xs text-slate-400 font-semibold uppercase">Engine</div>
                <div className="text-sm font-bold text-slate-900">PostgreSQL 18</div>
              </div>
              <div className="px-4 py-2 text-center border-r border-slate-100">
                <div className="text-xs text-slate-400 font-semibold uppercase">Currency</div>
                <div className="text-sm font-bold text-slate-900">₹ INR</div>
              </div>
              <div className="px-4 py-2 text-center">
                <div className="text-xs text-slate-400 font-semibold uppercase">Checkout</div>
                <div className="text-sm font-bold text-emerald-600">ACID Safe</div>
              </div>
            </div>
          </div>

          {/* Smart Savings Assistant Banner */}
          <div className="mt-6">
            <SmartSavingsBanner onOpenAllCoupons={() => setIsCouponModalOpen(true)} />
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Category Pills & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-xs ${
                selectedCategory === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-xs flex items-center gap-1.5 ${
                  selectedCategory === cat.name
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="rating_desc">Top Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">New Arrivals</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>

        </div>

        {/* Product Grid Area */}
        <div className="mt-8">
          {loading ? (
            <SkeletonLoader count={8} />
          ) : error ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-rose-200 shadow-xs max-w-xl mx-auto my-8">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Database Connection Required</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{error}</p>
              <div className="mt-4">
                <button
                  onClick={fetchProducts}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Fetching Products
                </button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No products match your criteria"
              message={`We couldn't find any products in "${selectedCategory}" matching "${searchTerm}".`}
              actionText="Reset Filters"
              actionLink="/"
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 text-xs text-slate-500 font-medium">
                <span>Showing {products.length} verified products from PostgreSQL database</span>
                {searchTerm && (
                  <span>Filtered by: "{searchTerm}"</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Quick View Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Promo Coupons Modal */}
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
