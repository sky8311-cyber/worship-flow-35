import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";

export interface CartSong {
  id: string;
  title: string;
  artist: string | null;
  default_key: string | null;
}

interface SongCartContextType {
  cartItems: CartSong[];
  cartIds: Set<string>;
  addToCart: (song: { id: string; title: string; artist?: string | null; default_key?: string | null }) => void;
  removeFromCart: (songId: string) => void;
  toggleCart: (song: { id: string; title: string; artist?: string | null; default_key?: string | null }) => void;
  clearCart: () => void;
  isInCart: (songId: string) => boolean;
  cartCount: number;
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

const SongCartContext = createContext<SongCartContextType | null>(null);

export const SongCartProvider = ({ children }: { children: ReactNode }) => {
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

  // Memoized Set for O(1) lookups
  const cartIds = useMemo(() => new Set(cartItems.map(item => item.id)), [cartItems]);

  const addToCart = useCallback((song: { id: string; title: string; artist?: string | null; default_key?: string | null }) => {
    setCartItems((prev) => {
      if (prev.some((item) => item.id === song.id)) {
        return prev;
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
    return cartIds.has(songId);
  }, [cartIds]);

  const cartCount = cartItems.length;

  const value = useMemo(() => ({
    cartItems,
    cartIds,
    addToCart,
    removeFromCart,
    toggleCart,
    clearCart,
    isInCart,
    cartCount,
  }), [cartItems, cartIds, addToCart, removeFromCart, toggleCart, clearCart, isInCart, cartCount]);

  return (
    <SongCartContext.Provider value={value}>
      {children}
    </SongCartContext.Provider>
  );
};

export const useSongCart = () => {
  const context = useContext(SongCartContext);
  if (!context) {
    throw new Error("useSongCart must be used within SongCartProvider");
  }
  return context;
};
