import { create } from 'zustand';
import { CartItem, Product } from '../types';

interface CartState {
  items: Map<string, CartItem[]>; // shopId -> CartItem[]
  activeShopId: string | null;
  deliveryFee: number;
  
  addItem: (product: Product, shopId: string, quantity?: number) => void;
  removeItem: (productId: string, shopId: string) => void;
  updateQuantity: (productId: string, shopId: string, quantity: number) => void;
  clearCart: () => void;
  
  getCartTotal: (shopId: string) => number;
  getSubtotal: (shopId: string) => number;
  getCartItemCount: (shopId: string) => number;
  getCartForShop: (shopId: string) => CartItem[];
}

export const useCartStore = create<CartState>((set, get) => ({
  items: new Map(),
  activeShopId: null,
  deliveryFee: 40, // Standard delivery fee

  addItem: (product, shopId, quantity = 1) => {
    set((state) => {
      const currentActiveShopId = state.activeShopId;
      const newItems = new Map(state.items);
      
      // If adding an item from a different shop, clear the existing cart
      // to enforce the "order from one shop at a time" rule.
      if (currentActiveShopId && currentActiveShopId !== shopId) {
        newItems.delete(currentActiveShopId);
      }

      const shopCart = newItems.get(shopId) || [];
      const existingItemIndex = shopCart.findIndex(item => item.product.id === product.id);

      const newShopCart = [...shopCart];
      if (existingItemIndex >= 0) {
        newShopCart[existingItemIndex] = {
          ...newShopCart[existingItemIndex],
          quantity: newShopCart[existingItemIndex].quantity + quantity
        };
      } else {
        newShopCart.push({ product, quantity });
      }

      newItems.set(shopId, newShopCart);

      return {
        items: newItems,
        activeShopId: shopId,
      };
    });
  },

  removeItem: (productId, shopId) => {
    set((state) => {
      const newItems = new Map(state.items);
      const shopCart = newItems.get(shopId) || [];
      
      const newShopCart = shopCart.filter(item => item.product.id !== productId);
      
      if (newShopCart.length === 0) {
        newItems.delete(shopId);
        return {
          items: newItems,
          activeShopId: state.activeShopId === shopId ? null : state.activeShopId
        };
      }
      
      newItems.set(shopId, newShopCart);
      return { items: newItems };
    });
  },

  updateQuantity: (productId, shopId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        // Remove item if quantity is zero or less
        const newItems = new Map(state.items);
        const shopCart = newItems.get(shopId) || [];
        const newShopCart = shopCart.filter(item => item.product.id !== productId);
        
        if (newShopCart.length === 0) {
          newItems.delete(shopId);
          return {
            items: newItems,
            activeShopId: state.activeShopId === shopId ? null : state.activeShopId
          };
        }
        
        newItems.set(shopId, newShopCart);
        return { items: newItems };
      }

      const newItems = new Map(state.items);
      const shopCart = newItems.get(shopId) || [];
      const newShopCart = shopCart.map(item => 
        item.product.id === productId ? { ...item, quantity } : item
      );

      newItems.set(shopId, newShopCart);
      return { items: newItems };
    });
  },

  clearCart: () => {
    set({ items: new Map(), activeShopId: null });
  },

  getSubtotal: (shopId: string) => {
    const shopCart = get().items.get(shopId) || [];
    return shopCart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  },

  getCartTotal: (shopId: string) => {
    const subtotal = get().getSubtotal(shopId);
    if (subtotal === 0) return 0;
    return subtotal + get().deliveryFee;
  },

  getCartItemCount: (shopId: string) => {
    const shopCart = get().items.get(shopId) || [];
    return shopCart.reduce((count, item) => count + item.quantity, 0);
  },

  getCartForShop: (shopId: string) => {
    return get().items.get(shopId) || [];
  }
}));
