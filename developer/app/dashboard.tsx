import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
  Switch,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useShopStore } from '../src/stores/shopStore';
import { useNotificationStore } from '../src/services/notificationService';
import { useAuthStore } from '../src/stores/authStore';
import { realtimeSync, getSyncServerUrl } from '../src/services/realtimeSync';
import { Shop, Product, Order } from '../types';

const CITY_PRESETS = [
  { name: 'Hyderabad (Banjara Hills)', address: 'Road No. 12, Banjara Hills, Hyderabad', lat: 17.4142, lng: 78.4335 },
  { name: 'Hyderabad (Madhapur / HITEC)', address: 'Cyber Towers, Madhapur, Hyderabad', lat: 17.4483, lng: 78.3915 },
  { name: 'Bengaluru (Indiranagar)', address: '100 Feet Road, Indiranagar, Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Mumbai (Bandra West)', address: 'Linking Road, Bandra West, Mumbai', lat: 19.0596, lng: 72.8295 },
  { name: 'Delhi NCR (Connaught Place)', address: 'Connaught Place, New Delhi', lat: 28.6304, lng: 77.2177 },
  { name: 'Chennai (T. Nagar)', address: 'Usman Road, T. Nagar, Chennai', lat: 13.0418, lng: 80.2341 },
  { name: 'Pune (Koregaon Park)', address: 'North Main Road, Koregaon Park, Pune', lat: 18.5362, lng: 73.8940 },
];

export default function DeveloperIndexScreen() {
  const router = useRouter();
  const {
    shops,
    products,
    orders,
    categories,
    initialize,
    addShop,
    updateShop,
    deleteShop,
    toggleShopStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    clearAllShops,
    seedDemoShops,
    updateOrderStatus,
  } = useShopStore();

  const { logout } = useAuthStore();

  // Active Main Tab: 'shops' | 'products' | 'orders' | 'rawdb'
  const [activeTab, setActiveTab] = useState<'shops' | 'products' | 'orders' | 'rawdb'>('shops');
  const [syncing, setSyncing] = useState(false);
  const [pingStatus, setPingStatus] = useState('online');
  const [serverUrl, setServerUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [addShopModalVisible, setAddShopModalVisible] = useState(false);
  const [editShopModalVisible, setEditShopModalVisible] = useState(false);
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  const [editProductModalVisible, setEditProductModalVisible] = useState(false);
  const [storeInventoryModalShop, setStoreInventoryModalShop] = useState<Shop | null>(null);
  const [storeInventorySearch, setStoreInventorySearch] = useState('');

  // Shop Form States (Add & Edit)
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');
  const [shopEmail, setShopEmail] = useState('');
  const [shopPassword, setShopPassword] = useState('');
  const [shopPhone, setPhone] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopLat, setShopLat] = useState('17.4142');
  const [shopLng, setShopLng] = useState('78.4335');
  const [shopOpenTime, setShopOpenTime] = useState('07:00:00');
  const [shopCloseTime, setShopCloseTime] = useState('22:00:00');
  const [shopIs24Hours, setShopIs24Hours] = useState(false);
  const [shopRadius, setShopRadius] = useState('5');
  const [shopDeliveryFee, setShopDeliveryFee] = useState('0');
  const [shopMinOrder, setShopMinOrder] = useState('50');
  const [shopCategory, setShopCategory] = useState('Groceries');
  const [shopCoverUrl, setShopCoverUrl] = useState('');
  const [shopLogoUrl, setShopLogoUrl] = useState('');

  // Product Form States (Add & Edit)
  const [selectedShopForProduct, setSelectedShopForProduct] = useState<string>('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('c1');
  const [prodPrice, setProdPrice] = useState('');
  const [prodMrp, setProdMrp] = useState('');
  const [prodUnit, setProdUnit] = useState<'kg' | 'g' | 'L' | 'mL' | 'piece' | 'pack'>('kg');
  const [prodUnitValue, setProdUnitValue] = useState('1');
  const [prodStock, setProdStock] = useState('50');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodIsAvailable, setProdIsAvailable] = useState(true);

  // Filter for products tab
  const [productShopFilter, setProductShopFilter] = useState<string>('all');

  useEffect(() => {
    initialize();
    setServerUrl(getSyncServerUrl());
  }, []);

  const showAlert = (title: string, msg: string, type: 'success' | 'alert' | 'order' | 'shop' = 'success') => {
    useNotificationStore.getState().showNotification({
      title,
      message: msg,
      type: title.toLowerCase().includes('error') || title.toLowerCase().includes('warning') || title.toLowerCase().includes('required') ? 'alert' : 'success',
    });
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setPingStatus('checking');
    try {
      const url = getSyncServerUrl();
      const res = await fetch(`${url}/api/sync`);
      if (res.ok) {
        const db = await res.json();
        if (db && Array.isArray(db.shops)) {
          useShopStore.setState({
            shops: db.shops,
            products: db.products || [],
            orders: db.orders || [],
          });
        }
        setPingStatus('online');
        showAlert('Cloud Sync Complete', `Successfully synced snapshot with ${url}`);
      } else {
        setPingStatus('offline');
        showAlert('Sync Warning', `Server responded with status ${res.status}`);
      }
    } catch (e: any) {
      setPingStatus('offline');
      showAlert('Sync Error', `Could not reach ${getSyncServerUrl()}: ${e?.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // --- Shop Actions ---
  const openAddShopModal = () => {
    setEditingShopId(null);
    setShopName('');
    setShopEmail('');
    setShopPassword('store123');
    setPhone('+91 98480 12345');
    setShopAddress('Road No. 12, Banjara Hills, Hyderabad');
    setShopLat('17.4142');
    setShopLng('78.4335');
    setShopOpenTime('07:00:00');
    setShopCloseTime('22:00:00');
    setShopIs24Hours(false);
    setShopRadius('5');
    setShopDeliveryFee('0');
    setShopMinOrder('50');
    setShopCategory('Groceries');
    setShopCoverUrl('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80');
    setShopLogoUrl('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80');
    setAddShopModalVisible(true);
  };

  const openEditShopModal = (shop: Shop) => {
    setEditingShopId(shop.id);
    setShopName(shop.name);
    setShopEmail(shop.owner_email || '');
    setShopPassword((shop as any).password || 'store123');
    setPhone(shop.phone || '');
    setShopAddress(shop.address || '');
    setShopLat(String(shop.latitude || 17.4142));
    setShopLng(String(shop.longitude || 78.4335));
    setShopOpenTime(shop.opening_time || '07:00:00');
    setShopCloseTime(shop.closing_time || '22:00:00');
    setShopIs24Hours(!!shop.is_24_hours);
    setShopRadius(String(shop.delivery_radius_km || 5));
    setShopDeliveryFee(String(shop.delivery_fee || 0));
    setShopMinOrder(String(shop.min_order_amount || 50));
    setShopCategory(shop.tags && shop.tags[0] ? shop.tags[0] : 'Groceries');
    setShopCoverUrl(shop.cover_image_url || '');
    setShopLogoUrl(shop.logo_url || '');
    setEditShopModalVisible(true);
  };

  const handleSaveAddShop = () => {
    if (!shopName.trim()) {
      showAlert('Required', 'Please enter a shop name.');
      return;
    }
    const cleanEmail = shopEmail.trim().toLowerCase() || `owner_${Date.now()}@localmart.com`;

    const newShop = addShop({
      name: shopName.trim(),
      owner_email: cleanEmail,
      phone: shopPhone.trim() || '+91 98480 12345',
      address: shopAddress.trim() || 'Neighborhood Area, Hyderabad',
      latitude: parseFloat(shopLat) || 17.4142,
      longitude: parseFloat(shopLng) || 78.4335,
      opening_time: shopOpenTime,
      closing_time: shopCloseTime,
      is_24_hours: shopIs24Hours,
      isOpen: true,
      is_active: true,
      delivery_radius_km: parseFloat(shopRadius) || 5,
      delivery_fee: parseFloat(shopDeliveryFee) || 0,
      min_order_amount: parseFloat(shopMinOrder) || 50,
      tags: [shopCategory, 'Local Store', 'Fast Delivery'],
      cover_image_url: shopCoverUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      logo_url: shopLogoUrl || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80',
      rating: 5.0,
      rating_count: 1,
      ...({ password: shopPassword.trim() || 'store123' } as any),
    });

    setAddShopModalVisible(false);
    showAlert('Shop Registered', `"${newShop.name}" added successfully!\n\n🔑 Shopkeeper Login:\nEmail: ${cleanEmail}\nPassword: ${shopPassword || 'store123'}\n\nVisible on Customer (8081) and Shopkeeper (8082)!`);
  };

  const handleSaveEditShop = () => {
    if (!editingShopId || !shopName.trim()) return;

    updateShop(editingShopId, {
      name: shopName.trim(),
      owner_email: shopEmail.trim().toLowerCase(),
      phone: shopPhone.trim(),
      address: shopAddress.trim(),
      latitude: parseFloat(shopLat) || 17.4142,
      longitude: parseFloat(shopLng) || 78.4335,
      opening_time: shopOpenTime,
      closing_time: shopCloseTime,
      is_24_hours: shopIs24Hours,
      delivery_radius_km: parseFloat(shopRadius) || 5,
      delivery_fee: parseFloat(shopDeliveryFee) || 0,
      min_order_amount: parseFloat(shopMinOrder) || 50,
      tags: [shopCategory, 'Local Store'],
      cover_image_url: shopCoverUrl,
      logo_url: shopLogoUrl,
      ...({ password: shopPassword.trim() || 'store123' } as any),
    });

    setEditShopModalVisible(false);
    showAlert('Updated', `Shop "${shopName}" details updated and broadcast across all portals!`);
  };

  const handleDeleteShopConfirm = (shopId: string, name: string) => {
    const doDelete = () => {
      deleteShop(shopId);
      showAlert('Deleted', `Shop "${name}" was removed.`);
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Delete Shop: Are you sure you want to delete "${name}" and all its products?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Delete Shop', `Are you sure you want to delete "${name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // --- Product Actions ---
  const openAddProductModal = (targetShopId?: string) => {
    setEditingProductId(null);
    setSelectedShopForProduct(targetShopId || (shops[0]?.id || ''));
    setProdName('');
    setProdCategory('c1');
    setProdPrice('40');
    setProdMrp('50');
    setProdUnit('kg');
    setProdUnitValue('1');
    setProdStock('100');
    setProdImageUrl('https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80');
    setProdIsAvailable(true);
    setAddProductModalVisible(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProductId(product.id);
    setSelectedShopForProduct(product.shop_id);
    setProdName(product.name);
    setProdCategory(product.category_id || 'c1');
    setProdPrice(String(product.price));
    setProdMrp(String(product.mrp || product.price));
    setProdUnit(product.unit || 'kg');
    setProdUnitValue(String(product.unit_value || 1));
    setProdStock(String(product.stock_quantity || 50));
    setProdImageUrl(product.image_url || '');
    setProdIsAvailable(product.is_available !== false);
    setEditProductModalVisible(true);
  };

  const handleSaveAddProduct = () => {
    if (!prodName.trim() || !selectedShopForProduct) {
      showAlert('Required', 'Please enter a product name and select a shop.');
      return;
    }

    const newProd = addProduct({
      shop_id: selectedShopForProduct,
      name: prodName.trim(),
      category_id: prodCategory,
      price: parseFloat(prodPrice) || 0,
      mrp: parseFloat(prodMrp) || parseFloat(prodPrice) || 0,
      unit: prodUnit,
      unit_value: parseFloat(prodUnitValue) || 1,
      stock_quantity: parseInt(prodStock, 10) || 50,
      image_url: prodImageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      is_available: prodIsAvailable,
    });

    setAddProductModalVisible(false);
    showAlert('Product Added', `"${newProd.name}" added to shop! Reflected instantly in Customer & Shopkeeper portals.`);
  };

  const handleSaveEditProduct = () => {
    if (!editingProductId || !prodName.trim()) return;

    updateProduct(editingProductId, {
      name: prodName.trim(),
      category_id: prodCategory,
      price: parseFloat(prodPrice) || 0,
      mrp: parseFloat(prodMrp) || 0,
      unit: prodUnit,
      unit_value: parseFloat(prodUnitValue) || 1,
      stock_quantity: parseInt(prodStock, 10) || 0,
      image_url: prodImageUrl,
      is_available: prodIsAvailable,
    });

    setEditProductModalVisible(false);
    showAlert('Updated', `Product "${prodName}" updated successfully.`);
  };

  const handleDeleteProductConfirm = (prodId: string, name: string) => {
    const doDel = () => {
      deleteProduct(prodId);
      showAlert('Deleted', `Product "${name}" was removed.`);
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Delete Product: Are you sure you want to delete "${name}"?`)) {
        doDel();
      }
    } else {
      Alert.alert('Delete Product', `Delete "${name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDel },
      ]);
    }
  };

  const handleApplyPreset = (preset: typeof CITY_PRESETS[0]) => {
    setShopAddress(preset.address);
    setShopLat(String(preset.lat));
    setShopLng(String(preset.lng));
  };

  const openAppUrl = (url: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const appUrls = useMemo(() => {
    const isCloud = typeof window !== 'undefined' && window.location && window.location.hostname.includes('onrender.com');
    if (isCloud) {
      return {
        customer: 'https://localmart-customer.onrender.com',
        shopkeeper: 'https://localmart-shopkeeper.onrender.com',
        delivery: 'https://localmart-delivery.onrender.com',
        backend: 'https://localmart-sync-api.onrender.com/api/sync',
      };
    }
    const host = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
    return {
      customer: `http://${host}:8081`,
      shopkeeper: `http://${host}:8082`,
      delivery: `http://${host}:8083`,
      backend: `http://${host}:5000/api/sync`,
    };
  }, []);

  const filteredShops = useMemo(() => {
    if (!searchQuery.trim()) return shops;
    const q = searchQuery.toLowerCase();
    return shops.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q) ||
      s.owner_email?.toLowerCase().includes(q)
    );
  }, [shops, searchQuery]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (productShopFilter !== 'all') {
      list = list.filter(p => p.shop_id === productShopFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, productShopFilter, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Mission Control Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <View style={styles.logoBadge}>
            <Ionicons name="terminal" size={20} color="#10B981" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.appTitle}>LocalMart Developer Console</Text>
              <View style={styles.adminPill}>
                <Text style={styles.adminPillText}>ADMIN</Text>
              </View>
            </View>
            <View style={styles.syncStatusRow}>
              <View style={[styles.statusDot, { backgroundColor: pingStatus === 'online' ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.serverText}>Sync Engine: {serverUrl}</Text>
            </View>
          </View>
        </View>

        <View style={styles.topRight}>
          <TouchableOpacity style={styles.syncBtn} onPress={handleSyncNow} disabled={syncing}>
            {syncing ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={16} color="#10B981" />
                <Text style={styles.syncBtnText}>Live Sync</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              logout();
              router.replace('/');
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Launch Switcher Banner */}
      <View style={styles.quickLaunchBanner}>
        <Text style={styles.quickLaunchLabel}>⚡ 1-CLICK APP SWITCHER (CROSS-TESTING):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickLaunchRow}>
          <TouchableOpacity style={[styles.appBtn, { backgroundColor: '#2563EB' }]} onPress={() => openAppUrl(appUrls.customer)}>
            <Ionicons name="cart" size={16} color="#FFFFFF" />
            <Text style={styles.appBtnText}>🛒 Open Customer (8081)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.appBtn, { backgroundColor: '#D97706' }]} onPress={() => openAppUrl(appUrls.shopkeeper)}>
            <Ionicons name="storefront" size={16} color="#FFFFFF" />
            <Text style={styles.appBtnText}>🏪 Open Shopkeeper (8082)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.appBtn, { backgroundColor: '#7C3AED' }]} onPress={() => openAppUrl(appUrls.delivery)}>
            <Ionicons name="bicycle" size={16} color="#FFFFFF" />
            <Text style={styles.appBtnText}>🛵 Open Delivery (8083)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.appBtn, { backgroundColor: '#059669' }]} onPress={() => openAppUrl(appUrls.backend)}>
            <Ionicons name="server" size={16} color="#FFFFFF" />
            <Text style={styles.appBtnText}>⚡ Sync DB JSON (5000)</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'shops' && styles.tabItemActive]}
          onPress={() => setActiveTab('shops')}
        >
          <Ionicons name="storefront" size={16} color={activeTab === 'shops' ? '#10B981' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'shops' && styles.tabTextActive]}>
            🏬 Shops ({shops.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'products' && styles.tabItemActive]}
          onPress={() => setActiveTab('products')}
        >
          <Ionicons name="cube" size={16} color={activeTab === 'products' ? '#10B981' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            📦 Products ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Ionicons name="receipt" size={16} color={activeTab === 'orders' ? '#10B981' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            📋 Orders ({orders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'rawdb' && styles.tabItemActive]}
          onPress={() => setActiveTab('rawdb')}
        >
          <Ionicons name="code-slash" size={16} color={activeTab === 'rawdb' ? '#10B981' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'rawdb' && styles.tabTextActive]}>
            🔍 Raw DB
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB CONTENT */}
      <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent}>
        {/* TAB 1: SHOPS MANAGER */}
        {activeTab === 'shops' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Global Stores & Kirana Registry</Text>
                <Text style={styles.sectionSubtitle}>
                  Add, edit, change timings/email/address, or delete shops. Changes sync immediately.
                </Text>
              </View>
              <TouchableOpacity style={styles.primaryActionBtn} onPress={openAddShopModal}>
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>+ Register New Shop</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search shops by name, address, or email..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>

            {filteredShops.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="storefront-outline" size={48} color="#64748B" />
                <Text style={styles.emptyTitle}>No Shops Found</Text>
                <Text style={styles.emptySub}>Click "+ Register New Shop" or Seed Demo Data.</Text>
                <TouchableOpacity style={styles.seedBtn} onPress={seedDemoShops}>
                  <Text style={styles.seedBtnText}>🌱 Seed Demo Stores</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredShops.map(shop => {
                const shopProds = products.filter(p => p.shop_id === shop.id);
                return (
                  <View key={shop.id} style={styles.shopCard}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        setStoreInventorySearch('');
                        setStoreInventoryModalShop(shop);
                      }}
                      style={styles.shopCardTop}
                    >
                      <Image
                        source={{ uri: shop.logo_url || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80' }}
                        style={styles.shopLogo}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={styles.shopNameText}>{shop.name}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: shop.is_active ? '#05966920' : '#EF444420' }]}>
                            <Text style={[styles.statusBadgeText, { color: shop.is_active ? '#10B981' : '#EF4444' }]}>
                              {shop.is_active ? '● Active' : '● Inactive'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.shopAddressText}>📍 {shop.address || 'Address not specified'}</Text>
                        <Text style={styles.shopMetaText}>
                          ✉️ Login: <Text style={{ color: '#60A5FA', fontWeight: 'bold' }}>{shop.owner_email || 'No email'}</Text> | 🔑 Pwd: {(shop as any).password || 'store123'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Meta Info Grid */}
                    <View style={styles.metaGrid}>
                      <View style={styles.metaBox}>
                        <Text style={styles.metaBoxLabel}>Operating Hours</Text>
                        <Text style={styles.metaBoxVal}>
                          {shop.is_24_hours ? '🟢 24 Hours Open' : `⏰ ${shop.opening_time || '07:00'} - ${shop.closing_time || '22:00'}`}
                        </Text>
                      </View>
                      <View style={styles.metaBox}>
                        <Text style={styles.metaBoxLabel}>Coordinates (GPS)</Text>
                        <Text style={styles.metaBoxVal}>
                          🌐 {shop.latitude?.toFixed(4)}, {shop.longitude?.toFixed(4)}
                        </Text>
                      </View>
                      <View style={styles.metaBox}>
                        <Text style={styles.metaBoxLabel}>Delivery / Min Order</Text>
                        <Text style={styles.metaBoxVal}>
                          🚚 ₹{shop.delivery_fee} fee | Min ₹{shop.min_order_amount} | {shop.delivery_radius_km}km
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.metaBox, { borderColor: '#8B5CF6', borderWidth: 1 }]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setStoreInventorySearch('');
                          setStoreInventoryModalShop(shop);
                        }}
                      >
                        <Text style={[styles.metaBoxLabel, { color: '#C084FC' }]}>Products Catalog (Click to View)</Text>
                        <Text style={[styles.metaBoxVal, { color: '#A855F7', fontWeight: '800' }]}>
                          📦 {shopProds.length} Products listed ➔
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.shopActionRow}>
                      <TouchableOpacity
                        style={styles.viewItemsBtn}
                        onPress={() => {
                          setStoreInventorySearch('');
                          setStoreInventoryModalShop(shop);
                        }}
                      >
                        <Ionicons name="cube" size={16} color="#C084FC" />
                        <Text style={styles.viewItemsBtnText}>📦 View Products ({shopProds.length})</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => openEditShopModal(shop)}
                      >
                        <Ionicons name="create-outline" size={16} color="#3B82F6" />
                        <Text style={styles.editBtnText}>✏️ Edit Shop</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.addProdToShopBtn}
                        onPress={() => openAddProductModal(shop.id)}
                      >
                        <Ionicons name="add" size={16} color="#10B981" />
                        <Text style={styles.addProdToShopBtnText}>+ Add Item</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.toggleBtn}
                        onPress={() => toggleShopStatus(shop.id)}
                      >
                        <Ionicons name={shop.is_active ? 'eye-off-outline' : 'eye-outline'} size={16} color="#F59E0B" />
                        <Text style={styles.toggleBtnText}>{shop.is_active ? 'Disable' : 'Enable'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteShopConfirm(shop.id, shop.name)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 2: PRODUCTS MANAGER */}
        {activeTab === 'products' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Global Products & Inventory</Text>
                <Text style={styles.sectionSubtitle}>
                  Add items to any shop, edit pricing, MRP, units, or stock quantities.
                </Text>
              </View>
              <TouchableOpacity style={styles.primaryActionBtn} onPress={() => openAddProductModal()}>
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>+ Add New Product</Text>
              </TouchableOpacity>
            </View>

            {/* Shop Filter Selector */}
            <View style={styles.filterRow}>
              <Text style={styles.filterRowLabel}>Filter By Store:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  style={[styles.filterChip, productShopFilter === 'all' && styles.filterChipActive]}
                  onPress={() => setProductShopFilter('all')}
                >
                  <Text style={[styles.filterChipText, productShopFilter === 'all' && styles.filterChipTextActive]}>
                    All Stores ({products.length})
                  </Text>
                </TouchableOpacity>
                {shops.map(s => {
                  const count = products.filter(p => p.shop_id === s.id).length;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.filterChip, productShopFilter === s.id && styles.filterChipActive]}
                      onPress={() => setProductShopFilter(s.id)}
                    >
                      <Text style={[styles.filterChipText, productShopFilter === s.id && styles.filterChipTextActive]}>
                        {s.name} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products by title..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {filteredProducts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="cube-outline" size={48} color="#64748B" />
                <Text style={styles.emptyTitle}>No Products Found</Text>
                <Text style={styles.emptySub}>Click "+ Add New Product" to list groceries in a shop.</Text>
              </View>
            ) : (
              filteredProducts.map(prod => {
                const shop = shops.find(s => s.id === prod.shop_id);
                return (
                  <View key={prod.id} style={styles.prodCard}>
                    <Image
                      source={{ uri: prod.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80' }}
                      style={styles.prodImage}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prodNameText}>{prod.name}</Text>
                      <Text style={styles.prodShopText}>🏬 Store: {shop?.name || 'Unknown Store'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                        <Text style={styles.prodPriceText}>₹{prod.price}</Text>
                        {prod.mrp > prod.price && (
                          <Text style={styles.prodMrpText}>₹{prod.mrp}</Text>
                        )}
                        <Text style={styles.prodUnitText}>({prod.unit_value} {prod.unit})</Text>
                        <Text style={styles.prodStockText}>Stock: {prod.stock_quantity}</Text>
                      </View>
                    </View>

                    <View style={styles.prodActionCol}>
                      <TouchableOpacity
                        style={styles.prodEditBtn}
                        onPress={() => openEditProductModal(prod)}
                      >
                        <Ionicons name="create-outline" size={16} color="#3B82F6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.prodAvailBtn}
                        onPress={() => toggleProductAvailability(prod.id)}
                      >
                        <Ionicons name={prod.is_available ? 'checkmark-circle' : 'close-circle'} size={18} color={prod.is_available ? '#10B981' : '#EF4444'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.prodDeleteBtn}
                        onPress={() => handleDeleteProductConfirm(prod.id, prod.name)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 3: ORDERS INSPECTOR */}
        {activeTab === 'orders' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Global Orders Stream</Text>
                <Text style={styles.sectionSubtitle}>
                  Monitor customer orders across all stores.
                </Text>
              </View>
            </View>

            {orders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={48} color="#64748B" />
                <Text style={styles.emptyTitle}>No Orders Placed Yet</Text>
                <Text style={styles.emptySub}>Open Customer App (8081) to place a test order!</Text>
                <TouchableOpacity style={styles.seedBtn} onPress={() => openAppUrl(appUrls.customer)}>
                  <Text style={styles.seedBtnText}>🛒 Launch Customer App</Text>
                </TouchableOpacity>
              </View>
            ) : (
              orders.map(order => {
                const shop = shops.find(s => s.id === order.shop_id);
                return (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderCardTop}>
                      <View>
                        <Text style={styles.orderIdText}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                        <Text style={styles.orderStoreText}>🏬 {shop?.name || 'LocalMart Store'}</Text>
                      </View>
                      <View style={[styles.orderStatusPill, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                        <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>
                          {order.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.orderAddressText}>📍 Drop: {order.delivery_address || 'Customer Address'}</Text>
                    <Text style={styles.orderItemsText}>
                      Items: {order.items?.map(i => `${i.product_name} x${i.quantity}`).join(', ') || 'Grocery items'}
                    </Text>
                    <View style={styles.orderBottomRow}>
                      <Text style={styles.orderTotalText}>Total: ₹{order.total} ({order.payment_method?.toUpperCase() || 'COD'})</Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={[styles.statusMiniBtn, { backgroundColor: '#3B82F6' }]}
                          onPress={() => updateOrderStatus(order.id, 'accepted')}
                        >
                          <Text style={styles.statusMiniBtnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.statusMiniBtn, { backgroundColor: '#8B5CF6' }]}
                          onPress={() => updateOrderStatus(order.id, 'ready')}
                        >
                          <Text style={styles.statusMiniBtnText}>Ready</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.statusMiniBtn, { backgroundColor: '#10B981' }]}
                          onPress={() => updateOrderStatus(order.id, 'delivered')}
                        >
                          <Text style={styles.statusMiniBtnText}>Deliver</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 4: RAW DB INSPECTOR */}
        {activeTab === 'rawdb' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Real-Time Shared Database JSON</Text>
                <Text style={styles.sectionSubtitle}>
                  Live snapshot synchronized between localhost:5000 and Render cloud.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.seedBtn} onPress={seedDemoShops}>
                  <Text style={styles.seedBtnText}>🌱 Reset Demo Data</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.wipeBtn} onPress={() => {
                  if (confirm('Wipe all data?')) clearAllShops();
                }}>
                  <Text style={styles.wipeBtnText}>🗑️ Wipe DB</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.jsonBox}>
              <Text style={styles.jsonText}>
                {JSON.stringify({ shops, products, orders }, null, 2)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: ADD NEW SHOP */}
      <Modal visible={addShopModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏬 Register New Store in LocalMart</Text>
              <TouchableOpacity onPress={() => setAddShopModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Shop Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Sri Krishna Supermarket"
                placeholderTextColor="#64748B"
                value={shopName}
                onChangeText={setShopName}
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Owner Login Email *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. krishna@localmart.com"
                    placeholderTextColor="#64748B"
                    value={shopEmail}
                    onChangeText={setShopEmail}
                    autoCapitalize="none"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Owner Password *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. store123"
                    placeholderTextColor="#64748B"
                    value={shopPassword}
                    onChangeText={setShopPassword}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Contact Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. +91 98480 12345"
                placeholderTextColor="#64748B"
                value={shopPhone}
                onChangeText={setPhone}
              />

              {/* City Presets */}
              <Text style={styles.fieldLabel}>📍 Quick City / Location Preset:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
                {CITY_PRESETS.map(p => (
                  <TouchableOpacity key={p.name} style={styles.presetChip} onPress={() => handleApplyPreset(p)}>
                    <Text style={styles.presetChipText}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Street Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Road No. 12, Banjara Hills, Hyderabad"
                placeholderTextColor="#64748B"
                value={shopAddress}
                onChangeText={setShopAddress}
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Latitude</Text>
                  <TextInput style={styles.modalInput} value={shopLat} onChangeText={setShopLat} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Longitude</Text>
                  <TextInput style={styles.modalInput} value={shopLng} onChangeText={setShopLng} keyboardType="numeric" />
                </View>
              </View>

              {/* Operating Hours */}
              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>🟢 Open 24 Hours (24/7)</Text>
                <Switch value={shopIs24Hours} onValueChange={setShopIs24Hours} />
              </View>

              {!shopIs24Hours && (
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Opening Time</Text>
                    <TextInput style={styles.modalInput} value={shopOpenTime} onChangeText={setShopOpenTime} placeholder="07:00:00" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Closing Time</Text>
                    <TextInput style={styles.modalInput} value={shopCloseTime} onChangeText={setShopCloseTime} placeholder="22:00:00" />
                  </View>
                </View>
              )}

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Delivery Radius (km)</Text>
                  <TextInput style={styles.modalInput} value={shopRadius} onChangeText={setShopRadius} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Delivery Fee (₹)</Text>
                  <TextInput style={styles.modalInput} value={shopDeliveryFee} onChangeText={setShopDeliveryFee} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Min Order (₹)</Text>
                  <TextInput style={styles.modalInput} value={shopMinOrder} onChangeText={setShopMinOrder} keyboardType="numeric" />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddShopModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAddShop}>
                <Text style={styles.saveBtnText}>Register & Broadcast Shop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: EDIT SHOP */}
      <Modal visible={editShopModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Edit Shop & Operating Details</Text>
              <TouchableOpacity onPress={() => setEditShopModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Shop Name *</Text>
              <TextInput style={styles.modalInput} value={shopName} onChangeText={setShopName} />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Owner Email (Login) *</Text>
                  <TextInput style={styles.modalInput} value={shopEmail} onChangeText={setShopEmail} autoCapitalize="none" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Owner Password *</Text>
                  <TextInput style={styles.modalInput} value={shopPassword} onChangeText={setShopPassword} />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Contact Phone Number</Text>
              <TextInput style={styles.modalInput} value={shopPhone} onChangeText={setPhone} />

              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput style={styles.modalInput} value={shopAddress} onChangeText={setShopAddress} />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Latitude</Text>
                  <TextInput style={styles.modalInput} value={shopLat} onChangeText={setShopLat} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Longitude</Text>
                  <TextInput style={styles.modalInput} value={shopLng} onChangeText={setShopLng} keyboardType="numeric" />
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>🟢 Open 24 Hours</Text>
                <Switch value={shopIs24Hours} onValueChange={setShopIs24Hours} />
              </View>

              {!shopIs24Hours && (
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Opening Time</Text>
                    <TextInput style={styles.modalInput} value={shopOpenTime} onChangeText={setShopOpenTime} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Closing Time</Text>
                    <TextInput style={styles.modalInput} value={shopCloseTime} onChangeText={setShopCloseTime} />
                  </View>
                </View>
              )}

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Delivery Radius (km)</Text>
                  <TextInput style={styles.modalInput} value={shopRadius} onChangeText={setShopRadius} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Delivery Fee (₹)</Text>
                  <TextInput style={styles.modalInput} value={shopDeliveryFee} onChangeText={setShopDeliveryFee} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Min Order (₹)</Text>
                  <TextInput style={styles.modalInput} value={shopMinOrder} onChangeText={setShopMinOrder} keyboardType="numeric" />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditShopModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEditShop}>
                <Text style={styles.saveBtnText}>Save & Sync Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: ADD / EDIT PRODUCT */}
      <Modal visible={addProductModalVisible || editProductModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProductId ? '✏️ Edit Product' : '📦 Add New Item to Store'}</Text>
              <TouchableOpacity onPress={() => { setAddProductModalVisible(false); setEditProductModalVisible(false); }}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              {!editingProductId && (
                <>
                  <Text style={styles.fieldLabel}>Target Store *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
                    {shops.map(s => (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.presetChip, selectedShopForProduct === s.id && styles.filterChipActive]}
                        onPress={() => setSelectedShopForProduct(s.id)}
                      >
                        <Text style={[styles.presetChipText, selectedShopForProduct === s.id && styles.filterChipTextActive]}>
                          {s.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={styles.fieldLabel}>Product Name *</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. Amul Taaza Milk 500ml" placeholderTextColor="#64748B" value={prodName} onChangeText={setProdName} />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Selling Price (₹) *</Text>
                  <TextInput style={styles.modalInput} value={prodPrice} onChangeText={setProdPrice} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>MRP (₹)</Text>
                  <TextInput style={styles.modalInput} value={prodMrp} onChangeText={setProdMrp} keyboardType="numeric" />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Unit (kg, g, L, mL, piece, pack)</Text>
                  <TextInput style={styles.modalInput} value={prodUnit} onChangeText={(t: any) => setProdUnit(t)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Unit Value</Text>
                  <TextInput style={styles.modalInput} value={prodUnitValue} onChangeText={setProdUnitValue} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Stock Qty</Text>
                  <TextInput style={styles.modalInput} value={prodStock} onChangeText={setProdStock} keyboardType="numeric" />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Product Image URL</Text>
              <TextInput style={styles.modalInput} value={prodImageUrl} onChangeText={setProdImageUrl} placeholder="https://..." placeholderTextColor="#64748B" />

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>🟢 Available in Stock</Text>
                <Switch value={prodIsAvailable} onValueChange={setProdIsAvailable} />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setAddProductModalVisible(false); setEditProductModalVisible(false); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={editingProductId ? handleSaveEditProduct : handleSaveAddProduct}
              >
                <Text style={styles.saveBtnText}>{editingProductId ? 'Save Product Changes' : 'Add Item to Shop'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: STORE INVENTORY & PRODUCTS */}
      {storeInventoryModalShop && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '92%', width: '100%', maxWidth: 720 }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="storefront" size={22} color="#10B981" />
                    <Text style={styles.modalTitle}>{storeInventoryModalShop.name} — Products & Inventory</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                    📍 {storeInventoryModalShop.address} • ✉️ {storeInventoryModalShop.owner_email || 'No email'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setStoreInventoryModalShop(null)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Action Toolbar */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { flex: 1, minWidth: 160 }]}
                  onPress={() => {
                    openAddProductModal(storeInventoryModalShop.id);
                  }}
                >
                  <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>+ Add Item to this Store</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.editBtn, { paddingVertical: 8, paddingHorizontal: 12 }]}
                  onPress={() => {
                    const target = storeInventoryModalShop;
                    setStoreInventoryModalShop(null);
                    openEditShopModal(target);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color="#3B82F6" />
                  <Text style={styles.editBtnText}>✏️ Edit Shop</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.viewItemsBtn, { paddingVertical: 8, paddingHorizontal: 12 }]}
                  onPress={() => {
                    const shopId = storeInventoryModalShop.id;
                    setStoreInventoryModalShop(null);
                    setProductShopFilter(shopId);
                    setActiveTab('products');
                  }}
                >
                  <Ionicons name="open-outline" size={16} color="#C084FC" />
                  <Text style={styles.viewItemsBtnText}>🔍 Open in Products Tab</Text>
                </TouchableOpacity>
              </View>

              {/* Search Inside Store */}
              <View style={[styles.searchBar, { marginBottom: 10 }]}>
                <Ionicons name="search" size={16} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search ${storeInventoryModalShop.name}'s products...`}
                  placeholderTextColor="#64748B"
                  value={storeInventorySearch}
                  onChangeText={setStoreInventorySearch}
                />
                {storeInventorySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setStoreInventorySearch('')}>
                    <Ionicons name="close-circle" size={16} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Items List */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {(() => {
                  const storeItems = products.filter(
                    p => p.shop_id === storeInventoryModalShop.id &&
                      (!storeInventorySearch.trim() || p.name.toLowerCase().includes(storeInventorySearch.toLowerCase()))
                  );

                  if (storeItems.length === 0) {
                    return (
                      <View style={{ alignItems: 'center', padding: 30 }}>
                        <Ionicons name="cube-outline" size={44} color="#64748B" />
                        <Text style={{ color: '#E2E8F0', fontWeight: '800', fontSize: 15, marginTop: 8 }}>
                          No products found in this store
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                          Tap "+ Add Item to this Store" to list your first item with custom price, MRP, and stock.
                        </Text>
                        <TouchableOpacity
                          style={[styles.primaryActionBtn, { marginTop: 14 }]}
                          onPress={() => openAddProductModal(storeInventoryModalShop.id)}
                        >
                          <Ionicons name="add" size={16} color="#FFFFFF" />
                          <Text style={styles.primaryActionBtnText}>+ Add First Product</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }

                  return storeItems.map(item => (
                    <View
                      key={item.id}
                      style={{
                        backgroundColor: '#0F172A',
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 10,
                        borderWidth: 1,
                        borderColor: '#334155',
                        flexDirection: 'row',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Image
                        source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80' }}
                        style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#1E293B' }}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: '#F8FAFC', fontWeight: '800', fontSize: 14 }}>{item.name}</Text>
                          <View style={{
                            backgroundColor: item.is_available !== false ? '#05966920' : '#EF444420',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}>
                            <Text style={{
                              color: item.is_available !== false ? '#10B981' : '#EF4444',
                              fontSize: 10,
                              fontWeight: '800',
                            }}>
                              {item.is_available !== false ? 'In Stock' : 'Out of Stock'}
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 15 }}>₹{item.price}</Text>
                          {item.mrp && item.mrp > item.price && (
                            <Text style={{ color: '#64748B', textDecorationLine: 'line-through', fontSize: 12 }}>
                              ₹{item.mrp}
                            </Text>
                          )}
                          <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                            • {item.unit_value || 1} {item.unit || 'kg'} • Stock: {item.stock_quantity ?? 50}
                          </Text>
                        </View>

                        {/* Action Buttons for this item */}
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                          <TouchableOpacity
                            style={[styles.editBtn, { paddingVertical: 4, paddingHorizontal: 8 }]}
                            onPress={() => openEditProductModal(item)}
                          >
                            <Ionicons name="create-outline" size={13} color="#3B82F6" />
                            <Text style={[styles.editBtnText, { fontSize: 11 }]}>✏️ Edit Price / Item</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.toggleBtn, { paddingVertical: 4, paddingHorizontal: 8 }]}
                            onPress={() => toggleProductAvailability(item.id)}
                          >
                            <Ionicons name={item.is_available !== false ? "eye-off-outline" : "eye-outline"} size={13} color="#F59E0B" />
                            <Text style={[styles.toggleBtnText, { fontSize: 11 }]}>
                              {item.is_available !== false ? 'Mark Out of Stock' : 'Mark Available'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.deleteBtn, { paddingVertical: 4, paddingHorizontal: 8 }]}
                            onPress={() => handleDeleteProductConfirm(item.id, item.name)}
                          >
                            <Ionicons name="trash-outline" size={13} color="#EF4444" />
                            <Text style={[styles.deleteBtnText, { fontSize: 11 }]}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ));
                })()}
              </ScrollView>

              {/* Modal Close Button */}
              <View style={[styles.modalFooter, { marginTop: 12 }]}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setStoreInventoryModalShop(null)}>
                  <Text style={styles.cancelBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return '#F59E0B';
    case 'accepted': return '#3B82F6';
    case 'preparing': return '#8B5CF6';
    case 'ready': return '#10B981';
    case 'delivered': return '#10B981';
    case 'cancelled': return '#EF4444';
    default: return '#64748B';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  adminPill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serverText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B98150',
  },
  syncBtnText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  quickLaunchBanner: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  quickLaunchLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  quickLaunchRow: {
    gap: 10,
  },
  appBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  appBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#10B981',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#10B981',
    fontWeight: '800',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },
  shopCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  shopCardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  shopLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  shopNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  shopAddressText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  shopMetaText: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  metaBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 6,
  },
  metaBoxLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaBoxVal: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
    marginTop: 2,
  },
  shopActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexWrap: 'wrap',
  },
  viewItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#581C8740',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A855F7',
  },
  viewItemsBtnText: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E3A8A40',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  editBtnText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  addProdToShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064E3B40',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  addProdToShopBtnText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#78350F40',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  toggleBtnText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7F1D1D40',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteBtnText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterRowLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 6,
  },
  filterChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#10B981',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  prodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  prodImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  prodNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  prodShopText: {
    fontSize: 11,
    color: '#60A5FA',
    marginTop: 2,
  },
  prodPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
  prodMrpText: {
    fontSize: 12,
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  prodUnitText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  prodStockText: {
    fontSize: 11,
    color: '#F59E0B',
  },
  prodActionCol: {
    flexDirection: 'row',
    gap: 6,
  },
  prodEditBtn: {
    padding: 6,
    backgroundColor: '#1E3A8A40',
    borderRadius: 6,
  },
  prodAvailBtn: {
    padding: 6,
    backgroundColor: '#0F172A',
    borderRadius: 6,
  },
  prodDeleteBtn: {
    padding: 6,
    backgroundColor: '#7F1D1D40',
    borderRadius: 6,
  },
  orderCard: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  orderStoreText: {
    fontSize: 12,
    color: '#60A5FA',
    marginTop: 2,
  },
  orderStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  orderAddressText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  orderItemsText: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 4,
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  orderTotalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
  statusMiniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusMiniBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  seedBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  seedBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  wipeBtn: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  wipeBtnText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  jsonBox: {
    backgroundColor: '#020617',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  jsonText: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    color: '#38BDF8',
    fontSize: 11,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 13,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  presetChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetChipText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
