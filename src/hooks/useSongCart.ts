import { useState, useEffect, useCallback } from "react";

export interface CartSong {
  id: string;
  title: string;
  artist: string | null;
  default_key: string | null;
}

const STORAGE_KEY = "k-worship-song-cart";

const loadCartFromStorage = (): CartSong[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (items: CartSong[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    console.error("Failed to save cart to localStorage");
  }
};

export const useSongCart = () => {
  const [cartItems, setCartItems] = useState<CartSong[]>(() => loadCartFromStorage());

  // Sync with localStorage on changes
  useEffect(() => {
    saveCartToStorage(cartItems);
  }, [cartItems]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setCartItems(JSON.parse(e.newValue));
        } catch {
          // Ignore parse errors
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const addToCart = useCallback((song: { id: string; title: string; artist?: string | null; default_key?: string | null }) => {
    setCartItems((prev) => {
      if (prev.some((item) => item.id === song.id)) {
        return prev; // Already in cart
      }
      return [...prev, { 
        id: song.id, 
        title: song.title, 
        artist: song.artist || null, 
        default_key: song.default_key || null 
      }];
    });
  }, []);

  const removeFromCart = useCallback((songId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== songId));
  }, []);

  const toggleCart = useCallback((song: { id: string; title: string; artist?: string | null; default_key?: string | null }) => {
    setCartItems((prev) => {
      const exists = prev.some((item) => item.id === song.id);
      if (exists) {
        return prev.filter((item) => item.id !== song.id);
      }
      return [...prev, { 
        id: song.id, 
        title: song.title, 
        artist: song.artist || null, 
        default_key: song.default_key || null 
      }];
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const isInCart = useCallback((songId: string) => {
    return cartItems.some((item) => item.id === songId);
  }, [cartItems]);

  const cartCount = cartItems.length;

  return {
    cartItems,
    addToCart,
    removeFromCart,
    toggleCart,
    clearCart,
    isInCart,
    cartCount,
  };
};
