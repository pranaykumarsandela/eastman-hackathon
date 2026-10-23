import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  Layers,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import AdminNavbar from '../../components/AdminNavbar';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const IMAGE_PRESETS = [
  { label: '🪑 Table / Desk', url: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=600&auto=format&fit=crop&q=80' },
  { label: '🎧 Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80' },
  { label: '💻 Laptop', url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80' },
  { label: '📱 Phone', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80' },
  { label: '💺 Chair', url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80' },
  { label: '☕ Mug / Kettle', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80' }
];

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { addToast } = useNotification();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    stockQuantity: '',
    category: 'Electronics',
    imageUrl: '',
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);

  // Auto slug generation helper
  const slugify = (text) =>
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');

  // Load product if editing
  useEffect(() => {
    const loadProduct = async () => {
      if (!isEditMode) return;
      try {
        setFetching(true);
        const res = await api.getProductById(id);
        if (res.success && res.data) {
          const p = res.data;
          setFormData({
            title: p.title || p.name || '',
            slug: p.slug || '',
            description: p.description || '',
            price: p.price !== undefined ? p.price.toString() : '',
            stockQuantity: p.stockQuantity !== undefined ? p.stockQuantity.toString() : '',
            category: p.category || 'Electronics',
            imageUrl: p.imageUrl || '',
            isActive: p.isActive !== undefined ? p.isActive : true
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch product details.');
      } finally {
        setFetching(false);
      }
    };

    loadProduct();
  }, [id, isEditMode]);

  // Load categories dynamically from database
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.getCategories();
        if (res.success && res.data && res.data.length > 0) {
          const names = res.data.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean);
          setCategories(names);
        }
      } catch (err) {
        console.warn('Failed to fetch categories:', err.message);
      }
    };
    fetchCats();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => {
        const updated = { ...prev, [name]: value };
        // If changing title and in create mode or slug is empty, auto-generate slug
        if (name === 'title' && (!isEditMode || !prev.slug)) {
          updated.slug = slugify(value);
        }
        return updated;
      });
      if (name === 'imageUrl') {
        setImageLoadError(false);
      }
    }
    if (error) setError('');
  };

  const getSmartFallbackImage = (title, category) => {
    const t = (title || '').toLowerCase();
    const c = (category || '').toLowerCase();
    if (t.includes('table') || t.includes('desk') || c.includes('furniture')) {
      return 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=600&auto=format&fit=crop&q=80';
    }
    if (t.includes('headphone') || t.includes('earphone') || t.includes('audio') || c.includes('audio')) {
      return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80';
    }
    if (t.includes('laptop') || t.includes('computer')) {
      return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80';
    }
    if (t.includes('chair')) {
      return 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Product title is required.');
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please provide a valid price greater than 0.');
      return;
    }

    const stockNum = parseInt(formData.stockQuantity, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setError('Please provide a valid non-negative stock quantity.');
      return;
    }

    if (!formData.category.trim()) {
      setError('Category is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const chosenImage = formData.imageUrl.trim() || getSmartFallbackImage(formData.title, formData.category);

      const payload = {
        name: formData.title.trim(),
        title: formData.title.trim(),
        slug: formData.slug.trim() || slugify(formData.title),
        description: formData.description.trim(),
        price: priceNum,
        stockQuantity: stockNum,
        category: formData.category.trim(),
        imageUrl: chosenImage,
        isActive: formData.isActive
      };

      if (isEditMode) {
        await api.updateProduct(id, payload);
        addToast('Product updated successfully!', 'success');
      } else {
        await api.createProduct(payload);
        addToast('Product created successfully!', 'success');
      }

      navigate('/admin/products');
    } catch (err) {
      setError(err.message || 'Failed to save product. Please verify fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <AdminNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isEditMode
              ? 'Update product pricing, inventory quantity, or storefront display attributes'
              : 'Add a new genuine item to your store catalog with real inventory tracking'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {fetching ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading product data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-5">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="e.g. sony-wh-1000xm5"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Detailed product specifications and highlights..."
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition leading-relaxed"
                />
              </div>

              {/* Price, Stock, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Price (INR ₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="29999"
                      required
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleChange}
                    placeholder="25"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    list="category-suggestions"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="Select or enter category"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition"
                  />
                  <datalist id="category-suggestions">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Image URL & Live Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Product Image URL
                </label>
                <div className="flex gap-4 items-start">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      placeholder="https://images.unsplash.com/..."
                      className={`w-full px-3.5 py-2.5 bg-slate-900/90 border rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none transition ${
                        imageLoadError
                          ? 'border-amber-500/80 focus:border-amber-500'
                          : 'border-slate-700 focus:border-brand-500'
                      }`}
                    />
                  </div>

                  <div className={`w-16 h-16 rounded-2xl bg-slate-900 border overflow-hidden shrink-0 flex items-center justify-center transition ${
                    imageLoadError ? 'border-amber-500/60 bg-amber-500/10' : 'border-slate-700'
                  }`}>
                    {formData.imageUrl ? (
                      imageLoadError ? (
                        <div className="flex flex-col items-center justify-center p-1 text-center" title="Image failed to load">
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                          <span className="text-[8px] font-bold text-amber-300 uppercase mt-0.5">Failed</span>
                        </div>
                      ) : (
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={() => setImageLoadError(true)}
                        />
                      )
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                </div>

                {/* Error warning if user pastes an HTML page or dead link */}
                {imageLoadError && (
                  <div className="flex items-start gap-2 mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <span className="font-bold">Image preview unavailable:</span> The URL entered is not a direct photo file (it might be a webpage link like Magnific/Pinterest). Image URLs must point directly to a picture file (.jpg, .png, Unsplash).
                      <div className="mt-1 text-[11px] text-amber-200">
                        👉 Click one of the curated high-res photo presets below to instantly use it!
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick-Fill Curated Image Presets */}
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Curated Photo Presets (Click to Auto-Fill):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, imageUrl: preset.url }));
                          setImageLoadError(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                          formData.imageUrl === preset.url
                            ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-xs font-semibold text-slate-300">
                    Product is Active & Visible in Storefront
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Link
                to="/admin/products"
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditMode ? 'Update Product' : 'Create Product'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
