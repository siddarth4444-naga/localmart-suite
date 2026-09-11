import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  Switch,
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';

export default function DeveloperDashboardScreen() {
  const router = useRouter();
  const { 
    shops, 
    products, 
    orders, 
    initialize, 
    deleteShop, 
    toggleShopStatus, 
    clearAllShops, 
    seedDemoShops,
    setActiveShopkeeperShopId
  } = useShopStore();

  const { setUser } = useAuthStore();
  const [selectShopModalVisible, setSelectShopModalVisible] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  const handleOpenAddItem = () => {
    if (shops.length === 0) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Please add a local shop first before adding items.');
      } else {
        Alert.alert('No Shops Found', 'Please add a local shop first before adding items.');
      }
      return;
    }
    if (shops.length === 1) {
      router.push(`/(developer)/manage-products/${shops[0].id}`);
    } else {
      setSelectShopModalVisible(true);
    }
  };

  const handleDeleteShop = (shopId: string, shopName: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(`Delete Shop: Are you sure you want to delete "${shopName}"? All its products will also be removed.`);
      if (confirmed) {
        deleteShop(shopId);
      }
      return;
    }

    Alert.alert(
      'Delete Shop',
      `Are you sure you want to delete "${shopName}"? All its products will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => deleteShop(shopId) 
        }
      ]
    );
  };

  const handleClearAll = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Clear All Stores: This will remove all shops, products, and orders from the app so you can start empty. Continue?');
      if (confirmed) {
        clearAllShops();
      }
      return;
    }

    Alert.alert(
      'Clear All Stores',
      'This will remove all shops, products, and orders from the app so you can add fresh shops from scratch.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive', 
          onPress: () => clearAllShops() 
        }
      ]
    );
  };

  const handleSwitchToCustomer = () => {
    setUser({
      id: 'u_customer_test',
      role: 'customer',
      name: 'Ramesh Kumar (Customer)',
      email: 'customer@example.com',
      phone: '+91 98480 12345',
      address: 'Banjara Hills, Hyderabad',
      latitude: 17.4142,
      longitude: 78.4335,
      created_at: new Date().toISOString(),
    });
    router.push('/(customer)/(tabs)/home');
  };

  const handleSwitchToShopkeeper = (shopId: string, shopName: string) => {
    setActiveShopkeeperShopId(shopId);
    setUser({
      id: `owner_${shopId}`,
      role: 'shopkeeper',
      name: `${shopName} Owner`,
      email: 'owner@localmart.in',
      phone: '+91 98480 99999',
      address: 'Shop Location',
      created_at: new Date().toISOString(),
    });
    router.push('/(shopkeeper)/(tabs)/dashboard' as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Developer Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.devTag}>
            <Ionicons name="code-slash" size={14} color="#10B981" />
            <Text style={styles.devTagText}>DEVELOPER / ADMIN PORTAL</Text>
          </View>
          <Text style={styles.headerTitle}>Store Management</Text>
        </View>

        <TouchableOpacity 
          style={styles.exitDevBtn}
          onPress={() => router.replace('/')}
        >
          <Ionicons name="home-outline" size={16} color="#4B5563" />
          <Text style={styles.exitDevBtnText}>Modes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick App Switcher Card */}
        <View style={styles.switchBannerCard}>
          <Text style={styles.switchBannerTitle}>Live Multi-Role View Switcher</Text>
          <Text style={styles.switchBannerSubtitle}>
            Changes made here update Customer and Shopkeeper apps in real time!
          </Text>

          <View style={styles.switchBtnRow}>
            <TouchableOpacity 
              style={styles.roleSwitchBtnCustomer}
              onPress={handleSwitchToCustomer}
            >
              <Ionicons name="cart" size={16} color="#FFFFFF" />
              <Text style={styles.roleSwitchBtnText}>Open Customer App</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.roleSwitchBtnShopkeeper}
              onPress={() => {
                if (shops.length === 0) {
                  Alert.alert('No Shops', 'Please add a shop first before opening Shopkeeper view.');
                  return;
                }
                handleSwitchToShopkeeper(shops[0].id, shops[0].name);
              }}
            >
              <Ionicons name="storefront" size={16} color="#FFFFFF" />
              <Text style={styles.roleSwitchBtnText}>Open Shopkeeper App</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Metrics Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{shops.length}</Text>
            <Text style={styles.statLabel}>Active Shops</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{products.length}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{orders.length}</Text>
            <Text style={styles.statLabel}>Live Orders</Text>
          </View>
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={styles.addShopPrimaryBtn}
            onPress={() => router.push('/(developer)/add-shop')}
            activeOpacity={0.88}
          >
            <Ionicons name="storefront" size={20} color="#FFFFFF" />
            <Text style={styles.addShopPrimaryBtnText}>+ Add Shop</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.addItemPrimaryBtn}
            onPress={handleOpenAddItem}
            activeOpacity={0.88}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.addItemPrimaryBtnText}>+ Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Store Database Controls */}
        <View style={styles.dbToolsRow}>
          {shops.length === 0 ? (
            <TouchableOpacity 
              style={styles.seedDemoBtn}
              onPress={seedDemoShops}
            >
              <Ionicons name="sparkles" size={15} color="#D97706" />
              <Text style={styles.seedDemoBtnText}>Load 2 Sample Stores (Optional)</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.clearAllBtn}
              onPress={handleClearAll}
            >
              <Ionicons name="trash-outline" size={15} color="#EF4444" />
              <Text style={styles.clearAllBtnText}>Clear All Stores (Start Empty)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Shops Listing Section */}
        <View style={styles.shopsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Configured Shops ({shops.length})
            </Text>
            <Text style={styles.sectionSubtitle}>
              Manage shopkeeper phone, email, GPS coordinates, and items
            </Text>
          </View>

          {shops.length === 0 ? (
            <View style={styles.emptyShopsCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="storefront-outline" size={44} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No shops added yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the "+ Add Local Shop" button above to add your first neighborhood grocery store!
              </Text>
              <TouchableOpacity 
                style={styles.emptyAddBtn}
                onPress={() => router.push('/(developer)/add-shop')}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Add Shop Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.shopsList}>
              {shops.map(shop => {
                const shopProducts = products.filter(p => p.shop_id === shop.id);
                return (
                  <View key={shop.id} style={styles.shopItemCard}>
                    {/* Shop Top Header */}
                    <View style={styles.shopCardTop}>
                      <Image 
                        source={{ uri: shop.cover_image_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80' }} 
                        style={styles.shopThumb} 
                      />
                      <View style={styles.shopMeta}>
                        <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
                        <Text style={styles.shopOwnerInfo} numberOfLines={1}>
                          Owner: {shop.owner_email || 'owner@example.com'} • 📞 {shop.phone}
                        </Text>
                        <Text style={styles.shopAddress} numberOfLines={1}>
                          📍 {shop.address}
                        </Text>
                        <Text style={styles.shopGps}>
                          GPS: {shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)}
                        </Text>
                      </View>
                      
                      <View style={styles.shopStatusToggle}>
                        <Switch
                          value={shop.is_active}
                          onValueChange={() => toggleShopStatus(shop.id)}
                          trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                          thumbColor="#FFFFFF"
                        />
                        <Text style={[styles.statusText, { color: shop.is_active ? '#059669' : '#EF4444' }]}>
                          {shop.is_active ? 'OPEN' : 'CLOSED'}
                        </Text>
                      </View>
                    </View>

                    {/* Tags */}
                    {shop.tags && shop.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {shop.tags.map((tag, i) => (
                          <View key={i} style={styles.tagChip}>
                            <Text style={styles.tagChipText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Operational Bar */}
                    <View style={styles.shopOperationalBar}>
                      <Text style={styles.opText}>
                        📦 <Text style={{ fontWeight: '700' }}>{shopProducts.length} Items</Text>
                      </Text>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.opText}>
                        🛵 <Text style={{ fontWeight: '700' }}>{shop.delivery_fee === 0 ? 'Free Delivery' : `₹${shop.delivery_fee}`}</Text>
                      </Text>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.opText}>
                        🕒 <Text style={{ fontWeight: '700', color: shop.is_24_hours || shop.opening_time === '24 Hours' ? '#059669' : '#4B5563' }}>
                          {shop.is_24_hours || shop.opening_time === '24 Hours' ? '24/7 (24 Hours)' : `${shop.opening_time} - ${shop.closing_time}`}
                        </Text>
                      </Text>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity 
                        style={styles.addItemsQuickBtn}
                        onPress={() => router.push(`/(developer)/manage-products/${shop.id}` as any)}
                        activeOpacity={0.88}
                      >
                        <Ionicons name="add-circle" size={15} color="#FFFFFF" />
                        <Text style={styles.addItemsQuickBtnText}>+ Add Items</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.manageItemsBtn}
                        onPress={() => router.push(`/(developer)/manage-products/${shop.id}` as any)}
                      >
                        <Ionicons name="cube" size={14} color="#059669" />
                        <Text style={styles.manageItemsBtnText}>Items ({shopProducts.length})</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.editShopBtn}
                        onPress={() => router.push(`/(developer)/edit-shop/${shop.id}` as any)}
                      >
                        <Ionicons name="pencil" size={14} color="#3B82F6" />
                        <Text style={styles.editShopBtnText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.loginAsShopBtn}
                        onPress={() => handleSwitchToShopkeeper(shop.id, shop.name)}
                      >
                        <Ionicons name="enter-outline" size={14} color="#6B7280" />
                        <Text style={styles.loginAsShopBtnText}>Owner</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.deleteShopBtn}
                        onPress={() => handleDeleteShop(shop.id, shop.name)}
                      >
                        <Ionicons name="trash" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Shop Button */}
      <TouchableOpacity 
        style={styles.fabButton}
        onPress={() => router.push('/(developer)/add-shop')}
        activeOpacity={0.88}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Shop</Text>
      </TouchableOpacity>

      {/* Select Shop Modal for Adding Items */}
      <Modal
        visible={selectShopModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectShopModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Store</Text>
              <TouchableOpacity onPress={() => setSelectShopModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Choose which store you want to add or manage products for:
            </Text>

            <ScrollView style={styles.modalShopList} showsVerticalScrollIndicator={false}>
              {shops.map(s => {
                const shopProdCount = products.filter(p => p.shop_id === s.id).length;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.modalShopOption}
                    onPress={() => {
                      setSelectShopModalVisible(false);
                      router.push(`/(developer)/manage-products/${s.id}` as any);
                    }}
                  >
                    <Image 
                      source={{ uri: s.cover_image_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80' }} 
                      style={styles.modalShopThumb}
                    />
                    <View style={styles.modalShopInfo}>
                      <Text style={styles.modalShopName}>{s.name}</Text>
                      <Text style={styles.modalShopCount}>📦 {shopProdCount} items currently in stock</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#10B981" />
                  </TouchableOpacity>
                );
              })}
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
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  devTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  devTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  exitDevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exitDevBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  switchBannerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  switchBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  switchBannerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 14,
  },
  switchBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleSwitchBtnCustomer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 10,
  },
  roleSwitchBtnShopkeeper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 10,
  },
  roleSwitchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  addShopPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  addShopPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  addItemPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  addItemPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dbToolsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  seedDemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  seedDemoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  shopsSection: {
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  emptyShopsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  shopsList: {
    gap: 14,
  },
  shopItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  shopCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  shopThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  shopMeta: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  shopOwnerInfo: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 2,
  },
  shopAddress: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  shopGps: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  shopStatusToggle: {
    alignItems: 'center',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  shopOperationalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  opText: {
    fontSize: 11,
    color: '#334155',
  },
  dot: {
    color: '#CBD5E1',
    fontSize: 10,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addItemsQuickBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  addItemsQuickBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  manageItemsBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    borderRadius: 8,
  },
  manageItemsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  editShopBtn: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    borderRadius: 8,
  },
  editShopBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  loginAsShopBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginAsShopBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  deleteShopBtn: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  modalShopList: {
    maxHeight: 350,
  },
  modalShopOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  modalShopThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  modalShopInfo: {
    flex: 1,
    marginLeft: 12,
  },
  modalShopName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalShopCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
