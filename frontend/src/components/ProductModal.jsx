import React, { useState } from 'react';
import { X, Star, ShoppingCart, Check, ShieldAlert, Truck, RotateCcw } from 'lucide-react';
import { formatINR } from '../utils/formatters';
import { useCart } from '../context/CartContext';

export default function ProductModal({ product, onClose }) {
  const { addToCart, cartItems } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  if (!product) return null;

  const cartItem = cartItems.find((i) => i.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const remainingStock = Math.max(0, product.stockQuantity - inCartQty);
  const isOutOfStock = product.stockQuantity <= 0;

  const handleAdd = () => {
    if (quantity > remainingStock) return;
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 900);
  };

  const fallbackImage = `https://placehold.co/800x600/e2e8f0/475569?text=${encodeURIComponent(product.category || 'Product')}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 rounded-full shadow-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative bg-slate-100 aspect-square md:aspect-auto">
            <img
              src={imageError ? fallbackImage : product.imageUrl}
              alt={product.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-xs font-bold text-slate-700 rounded-full shadow-xs uppercase tracking-wider">
                {product.category}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Rating and Stock */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg text-amber-700 text-xs font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{product.rating} / 5.0</span>
                </div>

                {isOutOfStock ? (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                    Out of Stock
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {product.stockQuantity} available
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {product.name}
              </h2>

              <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
                {formatINR(product.price)}
                <span className="ml-2 text-xs font-medium text-slate-400">Inclusive of all taxes</span>
              </div>

              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>

              {/* Badges */}
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-600 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Free shipping above ₹999</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>7-Day Return Policy</span>
                </div>
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-4">
                {/* Quantity picker */}
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="px-3.5 py-2.5 text-slate-600 hover:bg-slate-200 font-bold transition disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-bold text-slate-900 w-10 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(remainingStock, q + 1))}
                    disabled={quantity >= remainingStock || isOutOfStock}
                    className="px-3.5 py-2.5 text-slate-600 hover:bg-slate-200 font-bold transition disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                {/* Add to cart */}
                <button
                  onClick={handleAdd}
                  disabled={isOutOfStock || remainingStock <= 0}
                  className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition ${
                    isOutOfStock || remainingStock <= 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/25'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-5 h-5" /> Added to Cart
                    </>
                  ) : isOutOfStock ? (
                    'Out of Stock'
                  ) : remainingStock <= 0 ? (
                    'All In Cart'
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" /> Add to Cart • {formatINR(product.price * quantity)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
