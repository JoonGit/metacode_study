import { create } from 'zustand';
import { backendApi } from '../api/client';

export interface Menu {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  isSoldOut: boolean;
  aiKeywords: string[];
}

export interface CartItem extends Menu {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isCheckingOut: boolean;
  addItem: (menu: Menu) => void;
  removeItem: (menuId: number) => void;
  increaseQuantity: (menuId: number) => void;
  decreaseQuantity: (menuId: number) => void;
  clearCart: () => void;
  totalAmount: () => number;
  checkout: () => Promise<number | null>;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isCheckingOut: false,
  addItem: (menu) => set((state) => {
    const existing = state.items.find(item => item.id === menu.id);
    if (existing) {
      return {
        items: state.items.map(item => 
          item.id === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      };
    }
    return { items: [...state.items, { ...menu, quantity: 1 }] };
  }),
  removeItem: (menuId) => set((state) => ({
    items: state.items.filter(item => item.id !== menuId)
  })),
  increaseQuantity: (menuId) => set((state) => ({
    items: state.items.map(item => 
      item.id === menuId ? { ...item, quantity: item.quantity + 1 } : item
    )
  })),
  decreaseQuantity: (menuId) => set((state) => ({
    items: state.items.map(item => 
      item.id === menuId && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
    )
  })),
  clearCart: () => set({ items: [] }),
  totalAmount: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
  checkout: async () => {
    set({ isCheckingOut: true });
    try {
      const items = get().items.map(item => ({
        menuId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        selectedOptions: ""
      }));
      const response = await backendApi.post('/orders', {
        storeId: 1, // default store
        userId: 1, // anonymous or guest
        orderType: 'DINE_IN',
        paymentMethod: 'CARD',
        items: items
      });
      set({ items: [] });
      return response.data.orderId || response.data.orderNumber || Date.now();
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      set({ isCheckingOut: false });
    }
  }
}));
