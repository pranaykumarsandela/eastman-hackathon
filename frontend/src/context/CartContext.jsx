import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { addToast } = useNotification();
  const { user, isAuthenticated } = useAuth();

  // State
  const [cartItems, setCartItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [smartRecommendation, setSmartRecommendation] = useState(null);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [cartIssues, setCartIssues] = useState([]);

  // Clean up legacy global cart if present
  useEffect(() => {
    try {
      localStorage.removeItem('smartcart_items_v1');
      localStorage.removeItem('smartcart_coupon_v1');
    } catch {}
  }, []);

  // Track which user's cart has been loaded from storage
  const loadedUserIdRef = React.useRef(null);

  // Sync cart with authenticated user
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // User is logged out -> cart MUST show zero items
      loadedUserIdRef.current = null;
      setCartItems([]);
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setSmartRecommendation(null);
      return;
    }

    // User is logged in -> load that specific user's cart
    const userCartKey = `smartcart_cart_${user.id}`;
    const userCouponKey = `smartcart_coupon_${user.id}`;

    try {
      const savedCart = localStorage.getItem(userCartKey);
      setCartItems(savedCart ? JSON.parse(savedCart) : []);

      const savedCoupon = localStorage.getItem(userCouponKey);
      setAppliedCoupon(savedCoupon ? JSON.parse(savedCoupon) : null);
    } catch (err) {
      console.warn('Failed to load user cart:', err);
      setCartItems([]);
      setAppliedCoupon(null);
    }

    loadedUserIdRef.current = user.id;
  }, [isAuthenticated, user?.id]);

  // Persist cart to user-scoped localStorage (only after user's cart is loaded)
  useEffect(() => {
    if (!isAuthenticated || !user?.id || loadedUserIdRef.current !== user.id) return;
    const userCartKey = `smartcart_cart_${user.id}`;
    try {
      localStorage.setItem(userCartKey, JSON.stringify(cartItems));
    } catch (err) {
      console.error('Failed to save cart to localStorage', err);
    }
  }, [cartItems, isAuthenticated, user?.id]);

  // Persist coupon to user-scoped localStorage
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const userCouponKey = `smartcart_coupon_${user.id}`;
    try {
      if (appliedCoupon) {
        localStorage.setItem(userCouponKey, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(userCouponKey);
      }
    } catch (err) {
      console.error('Failed to save coupon to localStorage', err);
    }
  }, [appliedCoupon, isAuthenticated, user?.id]);

  // Derived metrics
  const totalItemCount = useMemo(() => {
    if (!isAuthenticated) return 0;
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems, isAuthenticated]);

  const rawSubtotal = useMemo(() => {
    if (!isAuthenticated) return 0;
    const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    return Math.round(total * 100) / 100;
  }, [cartItems, isAuthenticated]);

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

  // Add product to cart (Strictly requires authenticated user)
  const addToCart = useCallback((product, quantity = 1) => {
    if (!isAuthenticated || !user) {
      addToast('Please sign in to add items to your cart.', 'warning');
      return false;
    }

    if (!product || !product.id) return false;

    if (product.stockQuantity <= 0) {
      addToast(`Sorry, "${product.name || product.title}" is currently out of stock.`, 'error');
      return false;
    }

    let success = true;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);
      const prodName = product.name || product.title || 'Product';

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > product.stockQuantity) {
          addToast(`Maximum stock available for "${prodName}" is ${product.stockQuantity}.`, 'warning');
          success = false;
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          price: product.price,
          stockQuantity: product.stockQuantity
        };
        addToast(`Updated "${prodName}" quantity to ${newQty}.`, 'success');
        return updated;
      } else {
        if (quantity > product.stockQuantity) {
          addToast(`Cannot add ${quantity} units. Only ${product.stockQuantity} in stock.`, 'warning');
          success = false;
          return prevItems;
        }

        addToast(`Added "${prodName}" to your cart.`, 'success');
        return [
          ...prevItems,
          {
            id: product.id,
            name: prodName,
            price: product.price,
            category: product.category,
            imageUrl: product.imageUrl,
            stockQuantity: product.stockQuantity,
            quantity
          }
        ];
      }
    });

    return success;
  }, [isAuthenticated, user, addToast]);

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
    if (user?.id) {
      try {
        localStorage.removeItem(`smartcart_cart_${user.id}`);
        localStorage.removeItem(`smartcart_coupon_${user.id}`);
      } catch {}
    }
  }, [user?.id]);

  // Apply a coupon manually
  const applyCoupon = useCallback(async (code) => {
    if (!isAuthenticated) {
      addToast('Please sign in to apply coupons.', 'warning');
      return false;
    }

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
  }, [isAuthenticated, rawSubtotal, addToast]);

  // Remove applied coupon
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    addToast('Coupon removed.', 'info');
  }, [addToast]);

  // Revalidate cart with backend
  const revalidateCart = useCallback(async () => {
    if (!isAuthenticated || cartItems.length === 0) return { isValid: true, issues: [] };

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
  }, [isAuthenticated, cartItems, appliedCoupon, addToast]);

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
