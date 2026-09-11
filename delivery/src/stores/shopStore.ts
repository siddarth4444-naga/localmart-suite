import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shop, Product, Category, Order, OrderStatus } from '../types';
import { realtimeSync } from '../services/realtimeSync';

const STORAGE_KEY_ORDERS = '@localmart_orders_cache';
const STORAGE_KEY_SHOPS = '@localmart_shops_cache';

interface ShopState {
  shops: Shop[];
  products: Product[];
  categories: Category[];
  orders: Order[];
  isLoading: boolean;
  
  initialize: () => Promise<void>;
  syncFromExternalSnapshot: (snapshot: { shops?: Shop[]; products?: Product[]; orders?: Order[] }) => void;
  
  // Delivery Partner Actions
  acceptDelivery: (orderId: string, partner: { id: string; name: string; phone: string }) => void;
  pickupDelivery: (orderId: string) => void;
  completeDelivery: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const useShopStore = create<ShopState>((set, get) => ({
  shops: [],
  products: [],
  categories: [],
  orders: [],
  isLoading: true,

  initialize: async () => {
    try {
      const storedOrders = await AsyncStorage.getItem(STORAGE_KEY_ORDERS);
      const storedShops = await AsyncStorage.getItem(STORAGE_KEY_SHOPS);
      if (storedOrders) {
        set({ orders: JSON.parse(storedOrders) });
      }
      if (storedShops) {
        set({ shops: JSON.parse(storedShops) });
      }
    } catch (e) {
      console.log('Error loading cached delivery data:', e);
    }
    set({ isLoading: false });
    realtimeSync.fetchSnapshot();
  },

  syncFromExternalSnapshot: (snapshot) => {
    set((state) => {
      const updatedShops = snapshot.shops !== undefined ? snapshot.shops : state.shops;
      const updatedProducts = snapshot.products !== undefined ? snapshot.products : state.products;
      const updatedOrders = snapshot.orders !== undefined ? snapshot.orders : state.orders;

      AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
      AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify(updatedShops)).catch(() => {});

      return {
        shops: updatedShops,
        products: updatedProducts,
        orders: updatedOrders,
      };
    });
  },

  acceptDelivery: (orderId, partner) => {
    set((state) => {
      const updatedOrders = state.orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: 'delivery_accepted' as OrderStatus,
            delivery_partner_id: partner.id,
            delivery_partner_name: partner.name,
            delivery_partner_phone: partner.phone,
            updated_at: new Date().toISOString(),
          };
        }
        return order;
      });

      AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
      realtimeSync.pushUpdate({ orders: updatedOrders }, 'ORDER_ACCEPTED_BY_DELIVERY');
      return { orders: updatedOrders };
    });
  },

  pickupDelivery: (orderId) => {
    set((state) => {
      const updatedOrders = state.orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: 'picked_up' as OrderStatus,
            picked_up_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        return order;
      });

      AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
      realtimeSync.pushUpdate({ orders: updatedOrders }, 'ORDER_PICKED_UP');
      return { orders: updatedOrders };
    });
  },

  completeDelivery: (orderId) => {
    set((state) => {
      const updatedOrders = state.orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: 'delivered' as OrderStatus,
            payment_status: 'paid' as const,
            delivered_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        return order;
      });

      AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
      realtimeSync.pushUpdate({ orders: updatedOrders }, 'ORDER_DELIVERED');
      return { orders: updatedOrders };
    });
  },

  updateOrderStatus: (orderId, status) => {
    set((state) => {
      const updatedOrders = state.orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status,
            updated_at: new Date().toISOString(),
          };
        }
        return order;
      });

      AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
      realtimeSync.pushUpdate({ orders: updatedOrders }, 'ORDER_STATUS_UPDATE');
      return { orders: updatedOrders };
    });
  },
}));
