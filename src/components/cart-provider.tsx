"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type CartEntry = { bookId: number; quantity: number };
type CartContextValue = {
  items: CartEntry[]; count: number; ready: boolean;
  addItem: (bookId: number) => Promise<void>;
  updateQuantity: (bookId: number, quantity: number) => Promise<void>;
  removeItem: (bookId: number) => Promise<void>;
  clearCart: () => void;
  showToast: (text: string) => void;
};
const CartContext = createContext<CartContextValue | null>(null);
const key = "bookbuch_cart";

export function CartProvider({ children, userId }: { children: ReactNode; userId: string | null }) {
  const [items, setItems] = useState<CartEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = useCallback((text: string) => { setToast(text); window.setTimeout(() => setToast(""), 3200); }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      let local: CartEntry[] = [];
      try { const parsed = JSON.parse(localStorage.getItem(key) || "[]"); if (Array.isArray(parsed)) local = parsed.filter((item) => Number.isInteger(item.bookId) && Number.isInteger(item.quantity) && item.quantity > 0); } catch { /* ignore corrupt local cart */ }
      if (userId) {
        try {
          for (const item of local) await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
          const response = await fetch("/api/cart", { cache: "no-store" });
          if (response.ok) {
            const data = await response.json();
            if (active) { setItems(data.items.map((item: CartEntry) => ({ bookId: item.bookId, quantity: item.quantity }))); localStorage.removeItem(key); }
          } else if (active) setItems(local);
        } catch { if (active) setItems(local); }
      } else if (active) setItems(local);
      if (active) setReady(true);
    }
    load();
    return () => { active = false; };
  }, [userId]);

  useEffect(() => { if (ready && !userId) localStorage.setItem(key, JSON.stringify(items)); }, [items, ready, userId]);
  const addItem = useCallback(async (bookId: number) => {
    setItems((current) => { const existing = current.find((item) => item.bookId === bookId); return existing ? current.map((item) => item.bookId === bookId ? { ...item, quantity: Math.min(10, item.quantity + 1) } : item) : [...current, { bookId, quantity: 1 }]; });
    if (userId) {
      try {
        const response = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId, quantity: 1 }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setItems((current) => current.map((item) => item.bookId === bookId ? { ...item, quantity: data.quantity } : item));
      } catch (error) { showToast(error instanceof Error ? error.message : "Could not add book."); }
    }
    showToast("Added to your cart");
  }, [userId, showToast]);
  const updateQuantity = useCallback(async (bookId: number, quantity: number) => {
    if (quantity < 1) return;
    setItems((current) => current.map((item) => item.bookId === bookId ? { ...item, quantity: Math.min(10, quantity) } : item));
    if (userId) {
      const response = await fetch("/api/cart", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId, quantity: Math.min(10, quantity) }) });
      if (!response.ok) { const data = await response.json(); showToast(data.error || "Could not update cart."); }
    }
  }, [userId, showToast]);
  const removeItem = useCallback(async (bookId: number) => {
    setItems((current) => current.filter((item) => item.bookId !== bookId));
    if (userId) await fetch("/api/cart", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId }) });
    showToast("Removed from cart");
  }, [userId, showToast]);
  const clearCart = useCallback(() => { setItems([]); localStorage.removeItem(key); }, []);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return <CartContext.Provider value={{ items, count, ready, addItem, updateQuantity, removeItem, clearCart, showToast }}>
    {children}{toast && <div role="status" className="toast">{toast}</div>}
  </CartContext.Provider>;
}
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error("CartProvider is missing"); return context; }
