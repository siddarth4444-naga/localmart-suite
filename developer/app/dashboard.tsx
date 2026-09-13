import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useShopStore } from '../src/stores/shopStore';
import { useAuthStore } from '../src/stores/authStore';
import { realtimeSync, getSyncServerUrl } from '../src/services/realtimeSync';

export default function DeveloperDashboardScreen() {
  const router = useRouter();
  const {
    shops,
    products,
    orders,
    initialize,
    addShop,
    deleteShop,
    toggleShopStatus,
    clearAllShops,
    seedDemoShops,
    updateOrderStatus,
  } = useShopStore();

  const { logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState('switcher');
  const [addShopModalVisible, setAddShopModalVisible] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pingStatus, setPingStatus] = useState('online');
  const [serverUrl, setServerUrl] = useState('');

  const [newShopName, setNewShopName] = useState('');
  const [newShopEmail, setNewShopEmail] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [newShopCategory, setNewShopCategory] = useState('Groceries');

  useEffect(() => {
    initialize();
    setServerUrl(getSyncServerUrl());
  }, []);

  const showAlert = (title, msg) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
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
        showAlert('Cloud Sync Complete', `Successfully synced with ${url}`);
      } else {
        setPingStatus('offline');
        showAlert('Sync Warning', `Server responded with status ${res.status}`);
      }
    } catch (e) {
      setPingStatus('offline');
      showAlert('Sync Error', `Could not reach ${getSyncServerUrl()}: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateShopSubmit = () => {
    if (!newShopName.trim()) {
      showAlert('Missing Field', 'Please enter a shop name.');
      return;
    }

    const shop = addShop({
      name: newShopName.trim(),
      owner_email: newShopEmail.trim() || `${Date.now()}@localmart.com`,
      phone: newShopPhone.trim() || '9848012345',
      address: newShopAddress.trim() || 'Road No. 12, Banjara Hills, Hyderabad',
      tags: [newShopCategory, 'Local Store', 'Fast Delivery'],
      is_active: true,
      isOpen: true,
      opening_time: '07:00:00',
      closing_time: '23:00:00',
      delivery_radius_km: 5,
      delivery_fee: 0,
      min_order_amount: 50,
      rating: 5.0,
      rating_count: 1,
    });

    setAddShopModalVisible(false);
    setNewShopName('');
    setNewShopEmail('');
    setNewShopPhone('');
    setNewShopAddress('');
    showAlert('Shop Created', `"${shop.name}" has been registered and broadcast across cloud apps!`);
  };

  const handleWipeDatabase = () => {
    const doWipe = () => {
      clearAllShops();
      showAlert('Database Wiped', 'Database is now fresh and empty.');
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Wipe Database: Are you sure you want to clear all shops, products, and orders?')) {
        doWipe();
      }
    } else {
      Alert.alert('Wipe Database', 'Are you sure you want to clear all shops, products, and orders?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Wipe All', style: 'destructive', onPress: doWipe },
      ]);
    }
  };

  const handleSeedDemoData = () => {
    seedDemoShops();
    showAlert('Demo Data Seeded', 'Loaded demo shops and products into the ecosystem!');
  };

  const openExternalUrl = (url) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const getAppUrls = () => {
    const isCloud = typeof window !== 'undefined' && window.location && window.location.hostname.includes('onrender.com');
    if (isCloud) {
      return {
        customer: 'https://localmart-customer.onrender.com',
        shopkeeper: 'https://localmart-shopkeeper.onrender.com',
        delivery: 'https://localmart-delivery.onrender.com',
        backend: 'https://localmart-sync-api.onrender.com',
      };
    }
    const host = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
    return {
      customer: `http://${host}:8081`,
      shopkeeper: `http://${host}:8082`,
      delivery: `http://${host}:8083`,
      backend: `http://${host}:5000`,
    };
  };

  const appUrls = getAppUrls();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <View style={styles.logoBadge}>
            <Ionicons name="terminal" size={20} color="#10B981" />
          </View>
          <View>
            <Text style={styles.appTitle}>LocalMart Developer Console</Text>
            <View style={styles.syncStatusRow}>
              <View style={[styles.statusDot, { backgroundColor: pingStatus === 'online' ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.serverText}>{serverUrl}</Text>
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

      {/* Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'switcher' && styles.tabItemActive]}
          onPress={() => setActiveTab('switcher')}
        >
          <Ionicons name="apps" size={16} color={activeTab === 'switcher' ? '#10B981' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'switcher' && styles.tabTextActive]}>App Switcher</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'shops' && styles.tabItemActive]}
          onPress={() => setActiveTab('shops')}
        >
          <Ionicons name="storefront" size={16} color={activeTab === 'shops' ? '#10B981' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'shops' && styles.tabTextActive]}>
            Shops ({shops.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'products' && styles.tabItemActive]}
          onPress={() => setActiveTab('products')}
        >
          <Ionicons name="cube" size={16} color={activeTab === 'products' ? '#10B981' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            Products ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Ionicons name="receipt" size={16} color={activeTab === 'orders' ? '#10B981' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Orders ({orders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'json' && styles.tabItemActive]}
          onPress={() => setActiveTab('json')}
        >
          <Ionicons name="code-slash" size={16} color={activeTab === 'json' ? '#10B981' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'json' && styles.tabTextActive]}>JSON DB</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ================= APP SWITCHER TAB ================= */}
        {activeTab === 'switcher' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Multi-App Ecosystem Switcher</Text>
              <Text style={styles.sectionSubtitle}>
                Switch between Customer, Shopkeeper, and Delivery apps to verify real-time data sync.
              </Text>
            </View>

            <View style={styles.gridContainer}>
              {/* 1. Customer Storefront Switcher Card */}
              <View style={styles.appCard}>
                <View style={[styles.appCardHeader, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <View style={styles.appCardIconBg}>
                    <Ionicons name="cart" size={28} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.appCardTitle}>Customer Storefront</Text>
                    <Text style={styles.appCardBadge}>Blinkit / Zepto UI • Shopper</Text>
                  </View>
                </View>
                <View style={styles.appCardBody}>
                  <Text style={styles.appCardDesc}>
                    View available shops, browse grocery aisles, add items to cart, and place live Cash-on-Delivery orders.
                  </Text>
                  <View style={styles.urlBox}>
                    <Ionicons name="link-outline" size={14} color="#64748B" />
                    <Text style={styles.urlText} numberOfLines={1}>{appUrls.customer}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.launchBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => openExternalUrl(appUrls.customer)}
                  >
                    <Ionicons name="open-outline" size={18} color="#0F172A" />
                    <Text style={styles.launchBtnText}>Open Customer App</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. Shopkeeper Portal Switcher Card */}
              <View style={styles.appCard}>
                <View style={[styles.appCardHeader, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <View style={[styles.appCardIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                    <Ionicons name="storefront" size={28} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.appCardTitle}>Shopkeeper Merchant</Text>
                    <Text style={[styles.appCardBadge, { color: '#F59E0B' }]}>Store Owner Portal</Text>
                  </View>
                </View>
                <View style={styles.appCardBody}>
                  <Text style={styles.appCardDesc}>
                    Manage products, add inventory, update pricing, accept customer orders, and mark orders ready.
                  </Text>
                  <View style={styles.urlBox}>
                    <Ionicons name="link-outline" size={14} color="#64748B" />
                    <Text style={styles.urlText} numberOfLines={1}>{appUrls.shopkeeper}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.launchBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={() => openExternalUrl(appUrls.shopkeeper)}
                  >
                    <Ionicons name="open-outline" size={18} color="#0F172A" />
                    <Text style={styles.launchBtnText}>Open Shopkeeper App</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 3. Delivery Partner Switcher Card */}
              <View style={styles.appCard}>
                <View style={[styles.appCardHeader, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                  <View style={[styles.appCardIconBg, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                    <Ionicons name="bicycle" size={28} color="#38BDF8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.appCardTitle}>Delivery Partner</Text>
                    <Text style={[styles.appCardBadge, { color: '#38BDF8' }]}>Rider Fleet & UPI QR</Text>
                  </View>
                </View>
                <View style={styles.appCardBody}>
                  <Text style={styles.appCardDesc}>
                    Claim delivery tasks, navigate to pickup store, deliver to customer doorstep, and collect UPI payments.
                  </Text>
                  <View style={styles.urlBox}>
                    <Ionicons name="link-outline" size={14} color="#64748B" />
                    <Text style={styles.urlText} numberOfLines={1}>{appUrls.delivery}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.launchBtn, { backgroundColor: '#38BDF8' }]}
                    onPress={() => openExternalUrl(appUrls.delivery)}
                  >
                    <Ionicons name="open-outline" size={18} color="#0F172A" />
                    <Text style={styles.launchBtnText}>Open Delivery App</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Ecosystem Action Toolbar */}
            <View style={styles.actionCard}>
              <Text style={styles.actionCardTitle}>⚡ Quick Admin Actions</Text>
              <View style={styles.actionButtonRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => setAddShopModalVisible(true)}
                >
                  <Ionicons name="add-circle" size={18} color="#0F172A" />
                  <Text style={styles.actionBtnText}>Add New Store</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#334155' }]}
                  onPress={handleSeedDemoData}
                >
                  <Ionicons name="sparkles" size={18} color="#38BDF8" />
                  <Text style={[styles.actionBtnText, { color: '#F8FAFC' }]}>Seed Demo Data</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: '#EF4444' }]}
                  onPress={handleWipeDatabase}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Wipe Database</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ================= SHOPS TAB ================= */}
        {activeTab === 'shops' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Registered Shops ({shops.length})</Text>
                <Text style={styles.sectionSubtitle}>All stores registered in the shared cloud database.</Text>
              </View>
              <TouchableOpacity
                style={styles.smallAddBtn}
                onPress={() => setAddShopModalVisible(true)}
              >
                <Ionicons name="add" size={18} color="#0F172A" />
                <Text style={styles.smallAddBtnText}>Add Store</Text>
              </TouchableOpacity>
            </View>

            {shops.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="storefront-outline" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>No shops registered yet</Text>
                <Text style={styles.emptySubtitle}>Add your first store or seed demo data.</Text>
              </View>
            ) : (
              shops.map((shop) => (
                <View key={shop.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <View style={styles.itemHeaderRow}>
                      <Text style={styles.itemName}>{shop.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: shop.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                        <Text style={[styles.statusBadgeText, { color: shop.is_active ? '#10B981' : '#EF4444' }]}>
                          {shop.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemMeta}>Owner: {shop.owner_email || 'No email'}</Text>
                    <Text style={styles.itemMeta}>Address: {shop.address}</Text>
                    <Text style={styles.itemMeta}>
                      Coords: ({shop.latitude ? shop.latitude.toFixed(4) : '0'}, {shop.longitude ? shop.longitude.toFixed(4) : '0'}) • Delivery Fee: ₹{shop.delivery_fee}
                    </Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => toggleShopStatus(shop.id)}
                    >
                      <Ionicons
                        name={shop.is_active ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={shop.is_active ? '#10B981' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                      onPress={() => {
                        if (Platform.OS === 'web' && typeof window !== 'undefined') {
                          if (window.confirm(`Delete shop "${shop.name}"?`)) deleteShop(shop.id);
                        } else {
                          deleteShop(shop.id);
                        }
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= PRODUCTS TAB ================= */}
        {activeTab === 'products' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Products Catalog ({products.length})</Text>
              <Text style={styles.sectionSubtitle}>All catalog inventory items across all stores.</Text>
            </View>

            {products.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="cube-outline" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>No products found</Text>
                <Text style={styles.emptySubtitle}>Products will appear here when added by store owners.</Text>
              </View>
            ) : (
              products.map((product) => {
                const shop = shops.find((s) => s.id === product.shop_id);
                return (
                  <View key={product.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{product.name}</Text>
                      <Text style={styles.itemMeta}>
                        Store: <Text style={{ color: '#F59E0B' }}>{shop ? shop.name : product.shop_id}</Text>
                      </Text>
                      <Text style={styles.itemMeta}>
                        Price: ₹{product.price} (MRP: ₹{product.mrp || product.price}) • Stock: {product.stock_quantity ?? 'In Stock'}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ================= ORDERS TAB ================= */}
        {activeTab === 'orders' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ecosystem Orders ({orders.length})</Text>
              <Text style={styles.sectionSubtitle}>Real-time order statuses and customer deliveries.</Text>
            </View>

            {orders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>No orders placed yet</Text>
                <Text style={styles.emptySubtitle}>Place an order from the Customer App to view it live here.</Text>
              </View>
            ) : (
              orders.map((order) => {
                const shop = shops.find((s) => s.id === order.shop_id);
                return (
                  <View key={order.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <View style={styles.itemHeaderRow}>
                        <Text style={styles.itemName}>Order #{order.id.slice(-6)}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                          <Text style={[styles.statusBadgeText, { color: '#38BDF8' }]}>
                            {order.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.itemMeta}>
                        Store: {shop?.name || order.shop_id} • Total: ₹{order.total}
                      </Text>
                      <Text style={styles.itemMeta}>Address: {order.delivery_address}</Text>
                      <Text style={styles.itemMeta}>
                        Items: {order.items?.map((i) => `${i.product_name} (x${i.quantity})`).join(', ')}
                      </Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={[styles.smallStatusBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => updateOrderStatus(order.id, 'delivered')}
                      >
                        <Text style={styles.smallStatusBtnText}>Delivered</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ================= RAW JSON TAB ================= */}
        {activeTab === 'json' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Raw Database JSON</Text>
              <Text style={styles.sectionSubtitle}>Current state mirrored from {serverUrl}</Text>
            </View>
            <View style={styles.jsonBox}>
              <Text style={styles.jsonText}>
                {JSON.stringify({ shops, products, orders, count: { shops: shops.length, products: products.length, orders: orders.length } }, null, 2)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ================= ADD SHOP MODAL ================= */}
      <Modal visible={addShopModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Store to Cloud</Text>
              <TouchableOpacity onPress={() => setAddShopModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shop Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Sri Balaji Supermarket"
                  placeholderTextColor="#64748B"
                  value={newShopName}
                  onChangeText={setNewShopName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Owner Email</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="owner@example.com"
                  placeholderTextColor="#64748B"
                  value={newShopEmail}
                  onChangeText={setNewShopEmail}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="9848012345"
                  placeholderTextColor="#64748B"
                  value={newShopPhone}
                  onChangeText={setNewShopPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Road No. 12, Banjara Hills, Hyderabad"
                  placeholderTextColor="#64748B"
                  value={newShopAddress}
                  onChangeText={setNewShopAddress}
                />
              </View>

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateShopSubmit}>
                <Text style={styles.modalSubmitBtnText}>Create & Broadcast Store</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncBtnText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 16,
    overflow: 'scroll',
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
  content: {
    padding: 20,
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  appCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  appCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  appCardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  appCardBadge: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  appCardBody: {
    padding: 16,
  },
  appCardDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 8,
    marginBottom: 14,
  },
  urlText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  launchBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  actionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 14,
  },
  actionButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  smallAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  smallStatusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  smallStatusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  jsonBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  jsonText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#34D399',
    fontSize: 12,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    maxWidth: 500,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: '#F8FAFC',
    fontSize: 14,
  },
  modalSubmitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  modalSubmitBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
});
