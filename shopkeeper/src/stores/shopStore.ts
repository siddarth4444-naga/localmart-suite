import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shop, Product, Category, Order, OrderStatus } from '../types';
import { realtimeSync, getSyncServerUrl } from '../services/realtimeSync';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Fruits & Veggies', icon: 'nutrition-outline', sort_order: 1 },
  { id: 'c2', name: 'Dairy & Bread', icon: 'water-outline', sort_order: 2 },
  { id: 'c3', name: 'Snacks & Munchies', icon: 'fast-food-outline', sort_order: 3 },
  { id: 'c4', name: 'Cold Drinks & Juices', icon: 'wine-outline', sort_order: 4 },
  { id: 'c5', name: 'Instant Food', icon: 'pizza-outline', sort_order: 5 },
  { id: 'c6', name: 'Atta, Rice & Dal', icon: 'restaurant-outline', sort_order: 6 },
  { id: 'c7', name: 'Masala & Dry Fruits', icon: 'leaf-outline', sort_order: 7 },
  { id: 'c8', name: 'Personal & Baby Care', icon: 'medkit-outline', sort_order: 8 },
];

const STORAGE_KEY_SHOPS = '@localmart_shops';
const STORAGE_KEY_PRODUCTS = '@localmart_products';
const STORAGE_KEY_ORDERS = '@localmart_orders';
const STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID = '@localmart_active_shopkeeper_shop_id';

interface ShopState {
  shops: Shop[];
  products: Product[];
  categories: Category[];
  orders: Order[];
  activeShopkeeperShopId: string | null;
  isLoading: boolean;

  // Init / Hydrate
  initialize: () => Promise<void>;

  // Developer / Admin Shop Actions
  addShop: (shopData: Partial<Shop>) => Shop;
  updateShop: (id: string, updates: Partial<Shop>) => void;
  deleteShop: (id: string) => void;
  toggleShopStatus: (id: string) => void;
  setActiveShopkeeperShopId: (shopId: string | null) => void;

  // Product Actions (Developer + Shopkeeper)
  addProduct: (productData: Partial<Product>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailability: (id: string) => void;

  // Order Actions (Customer + Shopkeeper)
  addOrder: (orderData: Partial<Order>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Reset / Clear
  clearAllShops: () => void;
  seedDemoShops: () => void;
}

export const useShopStore = create<ShopState>((set, get) => ({
  shops: [],
  products: [],
  categories: DEFAULT_CATEGORIES,
  orders: [],
  activeShopkeeperShopId: null,
  isLoading: true,

  initialize: async () => {
    try {
      const [storedShops, storedProducts, storedOrders, storedActiveShopId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_SHOPS),
        AsyncStorage.getItem(STORAGE_KEY_PRODUCTS),
        AsyncStorage.getItem(STORAGE_KEY_ORDERS),
        AsyncStorage.getItem(STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID),
      ]);

      let parsedShops: Shop[] = storedShops ? JSON.parse(storedShops) : [];
      let parsedProducts: Product[] = storedProducts ? JSON.parse(storedProducts) : [];
      let parsedOrders: Order[] = storedOrders ? JSON.parse(storedOrders) : [];

      // Fetch latest snapshot from Shared Sync Bridge Server
      try {
        const syncUrl = getSyncServerUrl();
        const syncRes = await fetch(`${syncUrl}/api/sync`);
        if (syncRes.ok) {
          const serverDb = await syncRes.json();
          if (serverDb && Array.isArray(serverDb.shops) && serverDb.shops.length > 0) {
            parsedShops = serverDb.shops;
            parsedProducts = Array.isArray(serverDb.products) ? serverDb.products : [];
            parsedOrders = Array.isArray(serverDb.orders) ? serverDb.orders : [];
            AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify(parsedShops)).catch(() => {});
            AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(parsedProducts)).catch(() => {});
            AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(parsedOrders)).catch(() => {});
          } else if (parsedShops.length > 0 && (!serverDb.shops || serverDb.shops.length === 0)) {
            fetch(`${syncUrl}/api/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'SYNC_UPDATE',
                snapshot: { shops: parsedShops, products: parsedProducts, orders: parsedOrders }
              })
            }).catch(() => {});
          }
        }
      } catch (err) {
        // Sync server offline - using local storage
      }

      let chosenActiveShopId = storedActiveShopId;
      if (!chosenActiveShopId || !parsedShops.some(s => s.id === chosenActiveShopId)) {
        chosenActiveShopId = parsedShops.length > 0 ? parsedShops[0].id : null;
      }

      set({
        shops: parsedShops,
        products: parsedProducts,
        orders: parsedOrders,
        activeShopkeeperShopId: chosenActiveShopId,
        isLoading: false,
      });
    } catch (e) {
      console.log('Error initializing shop store:', e);
      set({ isLoading: false });
    }
  },

  addShop: (shopData) => {
    const newId = `shop_${Date.now()}`;
    const newShop: Shop = {
      id: newId,
      owner_id: shopData.owner_id || `owner_${Date.now()}`,
      owner_email: shopData.owner_email || 'owner@example.com',
      name: shopData.name || 'New Local Store',
      description: shopData.description || 'Neighborhood grocery store',
      address: shopData.address || 'Local Street, Hyderabad',
      latitude: shopData.latitude ?? 17.4142,
      longitude: shopData.longitude ?? 78.4335,
      phone: shopData.phone || '9848012345',
      is_active: shopData.is_active ?? true,
      isOpen: shopData.isOpen ?? true,
      is_24_hours: shopData.is_24_hours ?? (shopData.opening_time === '24 Hours' || (shopData.opening_time === '00:00:00' && shopData.closing_time === '23:59:59')),
      opening_time: shopData.is_24_hours ? '24 Hours' : (shopData.opening_time || '07:00:00'),
      closing_time: shopData.is_24_hours ? '24 Hours' : (shopData.closing_time || '22:00:00'),
      delivery_radius_km: shopData.delivery_radius_km ?? 5,
      min_order_amount: shopData.min_order_amount ?? 50,
      delivery_fee: shopData.delivery_fee ?? 0,
      created_at: new Date().toISOString(),
      cover_image_url: shopData.cover_image_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      logo_url: shopData.logo_url || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80',
      rating: shopData.rating || 5.0,
      rating_count: shopData.rating_count || 1,
      tags: shopData.tags || ['Groceries', 'Local Store', 'Fast Delivery'],
    };

    const updatedShops = [newShop, ...get().shops];
    set({ 
      shops: updatedShops, 
      activeShopkeeperShopId: newId 
    });
    AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify(updatedShops)).catch(() => {});
    AsyncStorage.setItem(STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID, newId).catch(() => {});
    realtimeSync.broadcast('SHOP_CREATED', {
      payload: newShop,
      snapshot: { shops: updatedShops, products: get().products, orders: get().orders }
    });
    return newShop;
  },

  updateShop: (id, updates) => {
    const updatedShops = get().shops.map(shop => 
      shop.id === id ? { ...shop, ...updates } : shop
    );
    set({ shops: updatedShops });
    AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify(updatedShops)).catch(() => {});
    realtimeSync.broadcast('SHOP_UPDATED', {
      payload: { id, ...updates },
      snapshot: { shops: updatedShops, products: get().products, orders: get().orders }
    });
  },

  deleteShop: (id) => {
    const updatedShops = get().shops.filter(shop => shop.id !== id);
    const updatedProducts = get().products.filter(p => p.shop_id !== id);
    const updatedOrders = get().orders.filter(o => o.shop_id !== id);
    const nextActive = updatedShops.length > 0 ? updatedShops[0].id : null;
    const finalActiveShopId = get().activeShopkeeperShopId === id ? nextActive : get().activeShopkeeperShopId;

    set({ 
      shops: updatedShops, 
      products: updatedProducts, 
      orders: updatedOrders,
      activeShopkeeperShopId: finalActiveShopId 
    });

    AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify(updatedShops)).catch(() => {});
    AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProducts)).catch(() => {});
    AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
    if (finalActiveShopId) {
      AsyncStorage.setItem(STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID, finalActiveShopId).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID).catch(() => {});
    }
    realtimeSync.broadcast('SHOP_DELETED', {
      payload: { id },
      snapshot: { shops: updatedShops, products: updatedProducts, orders: updatedOrders }
    });
  },

  toggleShopStatus: (id) => {
    const updatedShops = get().shops.map(shop => {
      if (shop.id === id) {
        const nextStatus = !shop.is_active;
        return { ...shop, is_active: nextStatus, isOpen: nextStatus };
      }
      return shop;
    });
    set({ shops: updatedShops });
    AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify(updatedShops)).catch(() => {});
    realtimeSync.broadcast('SHOP_UPDATED', {
      payload: { id },
      snapshot: { shops: updatedShops, products: get().products, orders: get().orders }
    });
  },

  setActiveShopkeeperShopId: (shopId) => {
    set({ activeShopkeeperShopId: shopId });
    if (shopId) {
      AsyncStorage.setItem(STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID, shopId).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID).catch(() => {});
    }
  },

  addProduct: (productData) => {
    const newId = `prod_${Date.now()}`;
    let targetShopId = productData.shop_id || get().activeShopkeeperShopId || (get().shops.length > 0 ? get().shops[0].id : '');
    let currentShops = get().shops;

    if (!targetShopId || currentShops.length === 0) {
      const defaultShop: Shop = {
        id: 'shop_demo_1',
        owner_id: 'owner_demo_1',
        owner_email: 'srisai.kirana@example.com',
        name: 'Sri Sai Kirana & General Store',
        description: 'Fresh Atta, Dal, Oils, Grains & Daily Spices',
        address: 'Road No. 12, Banjara Hills, Hyderabad',
        latitude: 17.4142,
        longitude: 78.4335,
        phone: '9848012345',
        is_active: true,
        isOpen: true,
        opening_time: '06:30:00',
        closing_time: '23:00:00',
        delivery_radius_km: 5,
        min_order_amount: 50,
        delivery_fee: 0,
        created_at: new Date().toISOString(),
        cover_image_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
        logo_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80',
        rating: 4.9,
        rating_count: 840,
        tags: ['Kirana', 'Atta & Dal', 'Oils', 'Spices'],
      };
      targetShopId = defaultShop.id;
      currentShops = [defaultShop];
      set({ shops: currentShops, activeShopkeeperShopId: targetShopId });
      AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify(currentShops)).catch(() => {});
    }

    const newProduct: Product = {
      id: newId,
      shop_id: targetShopId,
      category_id: productData.category_id || 'c1',
      name: productData.name || 'New Item',
      description: productData.description || '',
      image_url: productData.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
      price: productData.price ?? 50,
      mrp: productData.mrp ?? (productData.price ? productData.price + 10 : 60),
      unit: productData.unit || 'piece',
      unit_value: productData.unit_value ?? 1,
      stock_quantity: productData.stock_quantity ?? 50,
      is_available: productData.is_available ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedProducts = [newProduct, ...get().products];
    set({ products: updatedProducts });
    AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProducts)).catch(() => {});
    realtimeSync.broadcast('PRODUCT_CREATED', {
      payload: newProduct,
      snapshot: { shops: get().shops, products: updatedProducts, orders: get().orders }
    });
    return newProduct;
  },

  updateProduct: (id, updates) => {
    const updatedProducts = get().products.map(p => 
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    );
    set({ products: updatedProducts });
    AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProducts)).catch(() => {});
    realtimeSync.broadcast('PRODUCT_UPDATED', {
      payload: { id, ...updates },
      snapshot: { shops: get().shops, products: updatedProducts, orders: get().orders }
    });
  },

  deleteProduct: (id) => {
    const updatedProducts = get().products.filter(p => p.id !== id);
    set({ products: updatedProducts });
    AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProducts)).catch(() => {});
    realtimeSync.broadcast('PRODUCT_DELETED', {
      payload: { id },
      snapshot: { shops: get().shops, products: updatedProducts, orders: get().orders }
    });
  },

  toggleProductAvailability: (id) => {
    const updatedProducts = get().products.map(p => 
      p.id === id ? { ...p, is_available: !p.is_available, updated_at: new Date().toISOString() } : p
    );
    set({ products: updatedProducts });
    AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProducts)).catch(() => {});
    realtimeSync.broadcast('PRODUCT_UPDATED', {
      payload: { id },
      snapshot: { shops: get().shops, products: updatedProducts, orders: get().orders }
    });
  },

  addOrder: (orderData) => {
    const newId = `ord_${Date.now()}`;
    const newOrder: Order = {
      id: newId,
      customer_id: orderData.customer_id || 'cust_1',
      customer_name: orderData.customer_name || 'Customer',
      customer_phone: orderData.customer_phone || '',
      shop_id: orderData.shop_id || '',
      status: 'pending',
      subtotal: orderData.subtotal ?? 0,
      delivery_fee: orderData.delivery_fee ?? 0,
      total: orderData.total ?? 0,
      delivery_address: orderData.delivery_address || '',
      delivery_lat: orderData.delivery_lat || 17.4142,
      delivery_lng: orderData.delivery_lng || 78.4335,
      payment_method: orderData.payment_method || 'cod',
      payment_status: orderData.payment_status || 'pending',
      payment_id: orderData.payment_id,
      payment_time: orderData.payment_time,
      paid_amount: orderData.paid_amount,
      notes: orderData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: orderData.items || [],
    };

    const updatedOrders = [newOrder, ...get().orders];
    set({ orders: updatedOrders });
    AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
    realtimeSync.broadcast('ORDER_CREATED', {
      payload: newOrder,
      snapshot: { shops: get().shops, products: get().products, orders: updatedOrders }
    });
    return newOrder;
  },

  updateOrderStatus: (orderId, status) => {
    const updatedOrders = get().orders.map(o => 
      o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o
    );
    set({ orders: updatedOrders });
    AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders)).catch(() => {});
    realtimeSync.broadcast('ORDER_STATUS_UPDATED', {
      payload: { id: orderId, status },
      snapshot: { shops: get().shops, products: get().products, orders: updatedOrders }
    });
  },

  clearAllShops: () => {
    set({ shops: [], products: [], orders: [], activeShopkeeperShopId: null });
    AsyncStorage.multiRemove([
      STORAGE_KEY_SHOPS,
      STORAGE_KEY_PRODUCTS,
      STORAGE_KEY_ORDERS,
      STORAGE_KEY_ACTIVE_SHOPKEEPER_SHOP_ID,
      '@localmart_registered_users',
      '@localmart_current_user',
    ]).catch(() => {});
    realtimeSync.broadcast('DATA_RELOAD', {
      snapshot: { shops: [], products: [], orders: [] }
    });
  },

  seedDemoShops: () => {
    const demoShop1: Shop = {
      id: 'shop_demo_1',
      owner_id: 'owner_demo_1',
      owner_email: 'srisai.kirana@example.com',
      name: 'Sri Sai Kirana & General Store',
      description: 'Fresh Atta, Dal, Oils, Grains & Daily Spices',
      address: 'Road No. 12, Banjara Hills, Hyderabad',
      latitude: 17.4142,
      longitude: 78.4335,
      phone: '9848012345',
      is_active: true,
      isOpen: true,
      opening_time: '06:30:00',
      closing_time: '23:00:00',
      delivery_radius_km: 5,
      min_order_amount: 50,
      delivery_fee: 0,
      created_at: new Date().toISOString(),
      cover_image_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      logo_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80',
      rating: 4.9,
      rating_count: 840,
      tags: ['Kirana', 'Atta & Dal', 'Oils', 'Spices'],
    };

    const demoShop2: Shop = {
      id: 'shop_demo_2',
      owner_id: 'owner_demo_2',
      owner_email: 'farmfresh@example.com',
      name: 'Fresh Farm Veggies & Mandi',
      description: 'Farm fresh leafy vegetables, organic fruits & greens',
      address: 'Near Apollo Cradle, Jubilee Hills, Hyderabad',
      latitude: 17.4258,
      longitude: 78.4112,
      phone: '9848023456',
      is_active: true,
      isOpen: true,
      opening_time: '06:00:00',
      closing_time: '22:00:00',
      delivery_radius_km: 6,
      min_order_amount: 99,
      delivery_fee: 15,
      created_at: new Date().toISOString(),
      cover_image_url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80',
      logo_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
      rating: 4.8,
      rating_count: 1250,
      tags: ['Fresh Veggies', 'Organic Fruits', 'Green Leafy'],
    };

    const demoProducts: Product[] = [
      {
        id: 'prod_d1',
        shop_id: 'shop_demo_1',
        category_id: 'c6',
        name: 'Aashirvaad Shudh Chakki Atta',
        price: 275,
        mrp: 310,
        unit: 'kg',
        unit_value: 5,
        stock_quantity: 40,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod_d2',
        shop_id: 'shop_demo_1',
        category_id: 'c5',
        name: 'Maggi 2-Minute Masala Noodles',
        price: 14,
        mrp: 14,
        unit: 'pack',
        unit_value: 1,
        stock_quantity: 100,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod_d3',
        shop_id: 'shop_demo_2',
        category_id: 'c1',
        name: 'Farm Fresh Tomatoes',
        price: 35,
        mrp: 50,
        unit: 'kg',
        unit_value: 1,
        stock_quantity: 60,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod_d4',
        shop_id: 'shop_demo_2',
        category_id: 'c1',
        name: 'Nashik Red Onions',
        price: 28,
        mrp: 40,
        unit: 'kg',
        unit_value: 1,
        stock_quantity: 120,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=300&q=80',
      }
    ];

    set({ shops: [demoShop1, demoShop2], products: demoProducts, activeShopkeeperShopId: 'shop_demo_1' });
    AsyncStorage.setItem(STORAGE_KEY_SHOPS, JSON.stringify([demoShop1, demoShop2])).catch(() => {});
    AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(demoProducts)).catch(() => {});
  }
}));
