'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from './types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
  totalItems: () => number;
}

function sameLine(a: CartItem, productId: string, size: string, color: string) {
  return a.productId === productId && a.size === size && a.color === color;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => sameLine(i, item.productId, item.size, item.color));
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameLine(i, item.productId, item.size, item.color)
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, item], isOpen: true };
        }),
      removeItem: (productId, size, color) =>
        set((state) => ({
          items: state.items.filter((i) => !sameLine(i, productId, size, color)),
        })),
      updateQuantity: (productId, size, color, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (sameLine(i, productId, size, color) ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'brooklyn-cart',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
