import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useNotification } from './NotificationContext';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'smartcart_items_v1';
const COUPON_STORAGE_KEY = 'smartcart_coupon_v1';

export function CartProvider({ children }) {
  const { addToast } = useNotification();

  // Load initial cart from localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Applied coupon state
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [couponDiscount, setCouponDiscount] = useState(0);
  const [smartRecommendation, setSmartRecommendation] = useState(null);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [cartIssues, setCartIssues] = useState([]);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (err) {
      console.error('Failed to save cart to localStorage', err);
    }
  }, [cartItems]);

  // Save coupon to localStorage
  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to save coupon to localStorage', err);
    }
  }, [appliedCoupon]);

  // Derived metrics
  const totalItemCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const rawSubtotal = useMemo(() => {
    const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    return Math.round(total * 100) / 100;
  }, [cartItems]);

  // Fetch smart savings assistant recommendation when subtotal changes
  const fetchSavingsRecommendation = useCallback(async (subtotal) => {
    if (subtotal <= 0) {
      setSmartRecommendation(null);
      return;
    }
    try {
      const res = await api.getCouponRecommendation(subtotal);
      if (res.success && res.data) {
        setSmartRecommendation(res.data);
      }
    } catch {
      // Ignore background recommendation errors
    }
  }, []);

  useEffect(() => {
    fetchSavingsRecommendation(rawSubtotal);
  }, [rawSubtotal, fetchSavingsRecommendation]);

  // Revalidate coupon whenever cart items / subtotal change
  useEffect(() => {
    if (!appliedCoupon) {
      setCouponDiscount(0);
      return;
    }

    if (rawSubtotal <= 0) {
      setCouponDiscount(0);
      return;
    }

    // Call validate endpoint
    api.validateCoupon(appliedCoupon.code, rawSubtotal)
      .then((res) => {
        if (res.success && res.data) {
          setCouponDiscount(res.data.discountAmount);
        }
      })
      .catch((err) => {
        addToast(err.message || `Coupon "${appliedCoupon.code}" no longer qualifies.`, 'warning');
        setAppliedCoupon(null);
        setCouponDiscount(0);
      });
  }, [rawSubtotal, appliedCoupon?.code, addToast]);

  // Add product to cart
  const addToCart = useCallback((product, quantity = 1) => {
    if (!product || !product.id) return;

    if (product.stockQuantity <= 0) {
      addToast(`Sorry, "${product.name}" is currently out of stock.`, 'error');
      return;
    }

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > product.stockQuantity) {
          addToast(`Maximum stock available for "${product.name}" is ${product.stockQuantity}.`, 'warning');
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          price: product.price, // update with current price
          stockQuantity: product.stockQuantity
        };
        addToast(`Updated "${product.name}" quantity to ${newQty}.`, 'success');
        return updated;
      } else {
        if (quantity > product.stockQuantity) {
          addToast(`Cannot add ${quantity} units. Only ${product.stockQuantity} in stock.`, 'warning');
          return prevItems;
        }

        addToast(`Added "${product.name}" to cart.`, 'success');
        return [
          ...prevItems,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            imageUrl: product.imageUrl,
            stockQuantity: product.stockQuantity,
            quantity
          }
        ];
      }
    });
  }, [addToast]);

  // Update item quantity
  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id === productId) {
          if (newQuantity > item.stockQuantity) {
            addToast(`Cannot exceed available stock of ${item.stockQuantity} units.`, 'warning');
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  }, [addToast]);

  // Remove item from cart
  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) => {
      const itemToRemove = prev.find((i) => i.id === productId);
      if (itemToRemove) {
        addToast(`Removed "${itemToRemove.name}" from cart.`, 'info');
      }
      return prev.filter((i) => i.id !== productId);
    });
  }, [addToast]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCartIssues([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {}
  }, []);

  // Apply a coupon manually or via recommendation
  const applyCoupon = useCallback(async (code) => {
    if (!code || !code.trim()) {
      addToast('Please enter a coupon code.', 'warning');
      return false;
    }

    if (rawSubtotal <= 0) {
      addToast('Your cart is empty. Add products before applying coupons.', 'warning');
      return false;
    }

    try {
      const trimmed = code.trim().toUpperCase();
      const res = await api.validateCoupon(trimmed, rawSubtotal);

      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        setCouponDiscount(res.data.discountAmount);
        addToast(res.message, 'success');
        return true;
      }
      return false;
    } catch (err) {
      addToast(err.message || 'Invalid or expired coupon.', 'error');
      return false;
    }
  }, [rawSubtotal, addToast]);

  // Remove applied coupon
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    addToast('Coupon removed.', 'info');
  }, [addToast]);

  // Revalidate cart with backend
  const revalidateCart = useCallback(async () => {
    if (cartItems.length === 0) return { isValid: true, issues: [] };

    setIsRevalidating(true);
    setCartIssues([]);

    try {
      const payload = {
        items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })),
        couponCode: appliedCoupon ? appliedCoupon.code : null
      };

      const res = await api.previewCheckout(payload.items, payload.couponCode);

      if (res.success && res.data) {
        const preview = res.data;

        // Update any price or stock differences
        setCartItems((prev) => {
          return prev.map((localItem) => {
            const verified = preview.items.find((v) => v.productId === localItem.id);
            if (verified) {
              return {
                ...localItem,
                price: verified.unitPrice,
                name: verified.name,
                stockQuantity: verified.stockQuantity
              };
            }
            return localItem;
          });
        });

        if (preview.issues && preview.issues.length > 0) {
          setCartIssues(preview.issues);
          preview.issues.forEach((issue) => addToast(issue, 'warning'));
        }

        if (preview.coupon) {
          setCouponDiscount(preview.discountAmount);
        } else if (appliedCoupon && preview.couponError) {
          setAppliedCoupon(null);
          setCouponDiscount(0);
          addToast(preview.couponError, 'error');
        }

        return {
          isValid: !preview.hasStockIssues,
          preview
        };
      }
    } catch (err) {
      addToast(`Validation error: ${err.message}`, 'error');
      return { isValid: false, error: err.message };
    } finally {
      setIsRevalidating(false);
    }
  }, [cartItems, appliedCoupon, addToast]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItemCount,
        subtotal: rawSubtotal,
        appliedCoupon,
        couponDiscount,
        smartRecommendation,
        isRevalidating,
        cartIssues,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        revalidateCart,
        refreshSavingsRecommendation: () => fetchSavingsRecommendation(rawSubtotal)
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
