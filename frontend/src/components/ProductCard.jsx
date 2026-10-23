import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Star, Eye, Check, AlertCircle } from 'lucide-react';
import { formatINR } from '../utils/formatters';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function ProductCard({ product, onQuickView }) {
  const { addToCart, cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [imageError, setImageError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Check if item is already in cart
  const cartItem = cartItems.find((i) => i.id === product.id);
  const currentQuantityInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stockQuantity <= 0;
  const isMaxStockReached = currentQuantityInCart >= product.stockQuantity;

  const handleAdd = (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      addToast('Please sign in to add items to your cart.', 'warning');
      navigate('/login', { state: { from: location } });
      return;
    }

    if (isOutOfStock || isMaxStockReached) return;
    const ok = addToCart(product, 1);
    if (ok) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1200);
    }
  };

  const fallbackImage = `https://placehold.co/600x400/e2e8f0/475569?text=${encodeURIComponent(product.category || 'Product')}`;

  return (
    <div
      onClick={() => onQuickView && onQuickView(product)}
      className="group relative bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Category & Stock Pills */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <span className="px-2.5 py-1 text-[11px] font-semibold bg-white/90 backdrop-blur-md text-slate-700 rounded-full shadow-xs border border-slate-200/60 uppercase tracking-wider">
          {product.category}
        </span>
        {isOutOfStock ? (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 rounded-full border border-rose-200">
            Out of Stock
          </span>
        ) : product.stockQuantity <= 5 ? (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-700 rounded-full border border-amber-200 animate-pulse">
            Only {product.stockQuantity} left!
          </span>
        ) : (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            In Stock
          </span>
        )}
      </div>

      {/* Image container */}
      <div className="relative aspect-4/3 overflow-hidden bg-slate-100 flex items-center justify-center">
        <img
          src={imageError ? fallbackImage : product.imageUrl}
          alt={product.name}
          onError={() => setImageError(true)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Quick view overlay icon */}
        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-4 py-2 bg-white/95 text-slate-800 text-xs font-semibold rounded-full shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5" /> Quick View
          </span>
        </div>
      </div>

      {/* Product Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold text-slate-800">{product.rating}</span>
            <span className="text-[11px] text-slate-400">• High Demand</span>
          </div>

          {/* Name */}
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
            {product.name}
          </h3>

          {/* Description */}
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Price</div>
            <div className="text-base sm:text-lg font-extrabold text-slate-900">
              {formatINR(product.price)}
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock || isMaxStockReached}
            className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition shadow-xs ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isMaxStockReached
                ? 'bg-amber-100 text-amber-800 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-600 hover:bg-brand-700 text-white active:scale-95'
            }`}
            title={isMaxStockReached ? 'Maximum stock in cart' : 'Add to cart'}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" /> Added
              </>
            ) : isOutOfStock ? (
              'Sold Out'
            ) : isMaxStockReached ? (
              'Max in Cart'
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" /> Add
                {currentQuantityInCart > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                    {currentQuantityInCart}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
