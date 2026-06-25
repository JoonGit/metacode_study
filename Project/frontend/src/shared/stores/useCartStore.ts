// [Task Verification] Phase 5: Frontend - Infrastructure & UI
import { create } from 'zustand';

export interface CartItem {
  id: string; // Internal cart item id (can be menu_id + options hash)
  menuId: number;
  name: string;
  price: number;
  quantity: number;
  options?: Record<string, any>;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => {
    const existingItemIndex = state.items.findIndex(i => i.id === item.id);
    if (existingItemIndex >= 0) {
      const updatedItems = [...state.items];
      updatedItems[existingItemIndex].quantity += item.quantity;
      return { items: updatedItems };
    }
    return { items: [...state.items, item] };
  }),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),
  updateQuantity: (id, quantity) => set((state) => ({
    items: state.items.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
    )
  })),
  clearCart: () => set({ items: [] }),
  getTotalPrice: () => {
    const { items } = get();
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));
