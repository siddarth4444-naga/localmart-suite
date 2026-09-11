import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseLive } from '../lib/supabase';
import { useShopStore } from '../stores/shopStore';

// Dynamic Sync URL: Reads cloud env variable or local host fallback
export const getSyncServerUrl = () => {
  let url = process.env.EXPO_PUBLIC_SYNC_SERVER_URL;
  if (url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/$/, '');
  }

  // Local development fallback
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
      return `http://${host}:5000`;
    }
  }

  // Production Render cloud fallback
  return 'https://localmart-sync-api.onrender.com';
};

const SYNC_SERVER_URL = getSyncServerUrl();

// Web Broadcast Channel for instant sub-millisecond tab-to-tab sync on web
let broadcastChannel: any = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('localmart_realtime_sync');
  } catch (e) {}
}

export type SyncEventType = 
  | 'SHOP_CREATED' 
  | 'SHOP_UPDATED' 
  | 'SHOP_DELETED' 
  | 'PRODUCT_CREATED' 
  | 'PRODUCT_UPDATED' 
  | 'PRODUCT_DELETED' 
  | 'ORDER_CREATED' 
  | 'ORDER_STATUS_UPDATED'
  | 'DATA_RELOAD';

export interface SyncMessage {
  type: SyncEventType;
  payload?: any;
  snapshot?: {
    shops?: any[];
    products?: any[];
    orders?: any[];
  };
  timestamp: number;
}

export const realtimeSync = {
  // 1. Broadcast an update across local server, BroadcastChannel, and Supabase
  async broadcast(type: SyncEventType, data?: { payload?: any; snapshot?: { shops?: any[]; products?: any[]; orders?: any[] } } | any) {
    let payload = data?.payload !== undefined ? data.payload : data;
    let snapshot = data?.snapshot;

    if (!snapshot) {
      const state = useShopStore.getState();
      snapshot = {
        shops: state.shops,
        products: state.products,
        orders: state.orders,
      };
    }

    const msg: SyncMessage = {
      type,
      payload,
      snapshot,
      timestamp: Date.now(),
    };

    // A. Broadcast across browser windows/tabs on the same origin
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(msg);
      } catch (e) {}
    }

    // B. Push to shared Local Sync Server (Cross-Port / Cross-App Bridge)
    try {
      fetch(`${SYNC_SERVER_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      }).catch(() => {});
    } catch (e) {}

    // C. Cloud push if Supabase is active
    if (isSupabaseLive) {
      this.pushToCloud(type, payload);
    }
  },

  // 2. Initialize listeners (Local Server SSE + BroadcastChannel + Polling + Supabase)
  initListeners() {
    // Initial fetch from Shared Sync Server
    this.fetchFromServer();

    let eventSource: any = null;
    let reconnectTimer: any = null;
    let isCleanedUp = false;

    const connectSSE = () => {
      if (isCleanedUp) return;
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        try {
          if (eventSource) {
            try { eventSource.close(); } catch (e) {}
          }
          eventSource = new EventSource(`${SYNC_SERVER_URL}/api/events`);
          eventSource.onmessage = (event: any) => {
            try {
              const data = JSON.parse(event.data);
              if (data && data.snapshot) {
                this.applySnapshot(data.snapshot);
              }
            } catch (err) {}
          };
          eventSource.onerror = () => {
            try { eventSource.close(); } catch (e) {}
            if (!isCleanedUp && !reconnectTimer) {
              reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                connectSSE();
              }, 3000);
            }
          };
        } catch (e) {}
      }
    };

    connectSSE();

    // B. Listen to local broadcast messages (Instant sub-millisecond memory sync on same origin)
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event: MessageEvent) => {
        const msg = event.data as SyncMessage;
        if (msg && msg.snapshot) {
          this.applySnapshot(msg.snapshot);
        } else {
          useShopStore.getState().initialize();
        }
      };
    }

    // C. Listen to web storage events & window focus
    if (typeof window !== 'undefined' && 'addEventListener' in window) {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key && e.key.startsWith('@localmart_')) {
          useShopStore.getState().initialize();
        }
      };
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('focus', () => {
        this.fetchFromServer();
        useShopStore.getState().initialize();
      });
    }

    // D. Periodic background sync polling (every 1 second)
    const interval = setInterval(() => {
      this.fetchFromServer();
    }, 1000);

    return () => {
      isCleanedUp = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) {
        try { eventSource.close(); } catch (e) {}
      }
      clearInterval(interval);
    };
  },

  async fetchFromServer() {
    try {
      const res = await fetch(`${SYNC_SERVER_URL}/api/sync`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.shops || data.products || data.orders)) {
          this.applySnapshot(data);
        }
      }
    } catch (e) {
      // Offline fallback: load from local AsyncStorage
    }
  },

  applySnapshot(snapshot: { shops?: any[]; products?: any[]; orders?: any[] }) {
    if (!snapshot) return;
    const currentState = useShopStore.getState();

    // Check if snapshot is different to prevent redundant re-renders
    const shopsChanged = snapshot.shops !== undefined && JSON.stringify(snapshot.shops) !== JSON.stringify(currentState.shops);
    const productsChanged = snapshot.products !== undefined && JSON.stringify(snapshot.products) !== JSON.stringify(currentState.products);
    const ordersChanged = snapshot.orders !== undefined && JSON.stringify(snapshot.orders) !== JSON.stringify(currentState.orders);

    if (shopsChanged || productsChanged || ordersChanged) {
      useShopStore.setState({
        ...(snapshot.shops ? { shops: snapshot.shops } : {}),
        ...(snapshot.products ? { products: snapshot.products } : {}),
        ...(snapshot.orders ? { orders: snapshot.orders } : {}),
        isLoading: false,
      });

      // Persist to local device storage
      if (snapshot.shops) AsyncStorage.setItem('@localmart_shops', JSON.stringify(snapshot.shops)).catch(() => {});
      if (snapshot.products) AsyncStorage.setItem('@localmart_products', JSON.stringify(snapshot.products)).catch(() => {});
      if (snapshot.orders) AsyncStorage.setItem('@localmart_orders', JSON.stringify(snapshot.orders)).catch(() => {});
    }
  },

  // 3. Optional Cloud sync helpers for Supabase
  async pushToCloud(type: SyncEventType, payload?: any) {
    if (!isSupabaseLive) return;
    try {
      if (type === 'PRODUCT_CREATED' && payload) {
        await supabase.from('products').upsert(payload);
      } else if (type === 'PRODUCT_UPDATED' && payload) {
        await supabase.from('products').upsert(payload);
      } else if (type === 'ORDER_CREATED' && payload) {
        await supabase.from('orders').upsert(payload);
      } else if (type === 'ORDER_STATUS_UPDATED' && payload) {
        await supabase.from('orders').update({ status: payload.status }).eq('id', payload.id);
      }
    } catch (e) {
      console.log('Error pushing to Supabase cloud:', e);
    }
  }
};