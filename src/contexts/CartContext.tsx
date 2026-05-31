import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { Product } from '../types';
import Toast from '../components/Toast';

interface CartItem extends Product {
  quantity: number;
  cart_item_id?: string;
  selectedSize?: string;
  selectedColor?: string;
}

interface TaxSettings {
  is_enabled: boolean;
  tax_percentage: number;
  gst_number: string;
  tax_label: string;
  include_in_price: boolean;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, qty?: number, selectedSize?: string, selectedColor?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateCartItem: (oldCartItemId: string, newSize?: string, newColor?: string) => void;
  clearCart: () => void;
  subtotal: number;
  shippingCharge: number;
  taxAmount: number;
  total: number;
  itemCount: number;
  loading: boolean;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
  getCartItemId: (productId: string) => string | null;
  getItemPrice: (item: CartItem) => number;
  taxSettings: TaxSettings | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [dynamicShippingCharge, setDynamicShippingCharge] = useState<number>(80);
  const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null);
  const [billSettings, setBillSettings] = useState<any>(null);

  useEffect(() => {
    loadCartFromLocalStorage();
  }, []);

  useEffect(() => {
    const shippingRef = ref(db, 'settings/shipping_price');
    const unsubscribe = onValue(shippingRef, (snapshot) => {
      if (snapshot.exists()) {
        setDynamicShippingCharge(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const taxRef = ref(db, 'tax_settings');
    const unsubscribe = onValue(taxRef, (snapshot) => {
      if (snapshot.exists()) {
        setTaxSettings(snapshot.val());
      } else {
        setTaxSettings({
          is_enabled: false,
          tax_percentage: 0,
          gst_number: '',
          tax_label: 'GST',
          include_in_price: true,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const billRef = ref(db, 'bill_settings');
    const unsubscribe = onValue(billRef, (snapshot) => {
      if (snapshot.exists()) {
        setBillSettings(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, []);

  const loadCartFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items]);

  const addToCart = (product: Product, qty: number = 1, selectedSize?: string, selectedColor?: string) => {
    setItems(currentItems => {
      const cartItemId = `${product.id}-${selectedSize || 'no-size'}-${selectedColor || 'no-color'}`;
      const existingItem = currentItems.find(item => item.cart_item_id === cartItemId);

      if (existingItem) {
        return currentItems.map(item =>
          item.cart_item_id === cartItemId
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }

      return [...currentItems, { ...product, quantity: qty, cart_item_id: cartItemId, selectedSize, selectedColor }];
    });

    setToastMessage('Item added to cart successfully!');
    setShowToast(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.cart_item_id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.cart_item_id === cartItemId ? { ...item, quantity } : item
      )
    );
  };

  const updateCartItem = (oldCartItemId: string, newSize?: string, newColor?: string) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.cart_item_id === oldCartItemId);
      if (!existingItem) return currentItems;

      const updatedSize = newSize !== undefined ? newSize : existingItem.selectedSize;
      const updatedColor = newColor !== undefined ? newColor : existingItem.selectedColor;
      const newCartItemId = `${existingItem.id}-${updatedSize || 'no-size'}-${updatedColor || 'no-color'}`;

      if (newCartItemId === oldCartItemId) {
        return currentItems;
      }

      const duplicateItem = currentItems.find(item => item.cart_item_id === newCartItemId);

      if (duplicateItem) {
        return currentItems
          .filter(item => item.cart_item_id !== oldCartItemId)
          .map(item =>
            item.cart_item_id === newCartItemId
              ? { ...item, quantity: item.quantity + existingItem.quantity }
              : item
          );
      }

      return currentItems.map(item =>
        item.cart_item_id === oldCartItemId
          ? { ...item, cart_item_id: newCartItemId, selectedSize: updatedSize, selectedColor: updatedColor }
          : item
      );
    });

    setToastMessage('Cart updated successfully!');
    setShowToast(true);
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const getItemPrice = (item: CartItem): number => {
    if (item.selectedSize && item.size_pricing && item.size_pricing[item.selectedSize]) {
      return item.size_pricing[item.selectedSize].price;
    }
    return item.price;
  };

  const subtotal = items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  
  // Get free delivery threshold from bill settings, default to 2000
  const freeDeliveryThreshold = billSettings?.free_delivery_minimum_amount || 2000;
  
  // Calculate shipping: 0 if above threshold, else use dynamic charge
  const shippingCharge = items.length > 0 ? (subtotal >= freeDeliveryThreshold ? 0 : dynamicShippingCharge) : 0;

  const taxAmount =
    items.length > 0 && taxSettings?.is_enabled && !taxSettings?.include_in_price
      ? (subtotal + shippingCharge) * (taxSettings.tax_percentage / 100)
      : 0;

  const total = subtotal + shippingCharge + taxAmount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const isInCart = (productId: string) => {
    return items.some(item => item.id === productId);
  };

  const getItemQuantity = (productId: string) => {
    return items.filter(item => item.id === productId).reduce((sum, item) => sum + item.quantity, 0);
  };

  const getCartItemId = (productId: string) => {
    const item = items.find(item => item.id === productId);
    return item?.cart_item_id || null;
  };

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCartItem,
    clearCart,
    subtotal,
    shippingCharge,
    taxAmount,
    total,
    itemCount,
    loading,
    isInCart,
    getItemQuantity,
    getCartItemId,
    getItemPrice,
    taxSettings
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
