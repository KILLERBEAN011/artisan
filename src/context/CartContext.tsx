"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { lineKey } from "@/lib/cart-key";
import { MAX_QTY_PER_ITEM } from "@/lib/marketplace-config";

/* The cart lives in this browser (localStorage). Prices here are only for
   showing; checkout always re-prices everything on the server. */

export interface CartItem {
  key: string; // product + chosen options, e.g. "6ab8…|Size=M"
  id: string; // product id
  name: string;
  price: number;
  image: string;
  sellerId: string;
  quantity: number;
  options?: Record<string, string>; // { Size: "M", Colour: "Indigo" }
  slug?: string;
}

export type NewCartItem = Omit<CartItem, "key" | "quantity"> & { quantity?: number };

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: NewCartItem) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  isLoaded: boolean;
}

const STORAGE_KEY = "naijacraft_cart";
const CartContext = createContext<CartContextType | undefined>(undefined);

function readStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<CartItem>[]) : [];
    // Older carts had no `key`: rebuild it so they keep working
    return parsed
      .filter((i) => i && i.id && i.quantity)
      .map((i) => ({ ...(i as CartItem), key: i.key ?? lineKey(String(i.id), i.options) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load the saved cart after the first render (localStorage only exists in the browser)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCart(readStoredCart());
      setIsLoaded(true);
    }, 0);
    // Keep several open tabs in sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCart(readStoredCart());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Private browsing or storage full: the cart still works for this visit
    }
  }, [cart, isLoaded]);

  const addToCart = useCallback((item: NewCartItem) => {
    const key = lineKey(item.id, item.options);
    const add = Math.max(1, Math.floor(item.quantity ?? 1));
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: Math.min(i.quantity + add, MAX_QTY_PER_ITEM) } : i,
        );
      }
      return [...prev, { ...item, key, quantity: Math.min(add, MAX_QTY_PER_ITEM) }];
    });
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    const q = Math.floor(quantity);
    setCart((prev) =>
      q < 1 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(q, MAX_QTY_PER_ITEM) } : i)),
    );
  }, []);

  const removeFromCart = useCallback((key: string) => {
    // Accepts a line key, or a product id (removes every line of that product)
    setCart((prev) => prev.filter((i) => i.key !== key && i.id !== key));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const value = useMemo<CartContextType>(
    () => ({
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartTotal: cart.reduce((total, i) => total + i.price * i.quantity, 0),
      itemCount: cart.reduce((n, i) => n + i.quantity, 0),
      isLoaded,
    }),
    [cart, addToCart, updateQuantity, removeFromCart, clearCart, isLoaded],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
