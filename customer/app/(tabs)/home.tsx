import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';
import { calculateDistance, getEstimatedTime } from '../../src/lib/utils';
import { useLocationStore } from '../../src/stores/locationStore';
import ShopCard from '../../src/components/ShopCard';

const { width } = Dimensions.get('window');

const PRESET_NEIGHBORHOODS = [
  { name: 'Hyderabad (Banjara / Central)', address: 'Road No. 12, Banjara Hills, Hyderabad', lat: 17.4142, lng: 78.4335, icon: 'business' as const },
  { name: 'Madhapur / HITEC City', address: 'Cyber Towers, Madhapur, Hyderabad', lat: 17.4483, lng: 78.3915, icon: 'laptop' as const },
  { name: 'Bengaluru (Indiranagar / Koramangala)', address: '100 Feet Road, Indiranagar, Bengaluru', lat: 12.9716, lng: 77.5946, icon: 'navigate' as const },
  { name: 'Mumbai (Bandra / Andheri)', address: 'Linking Road, Bandra West, Mumbai', lat: 19.0596, lng: 72.8295, icon: 'business' as const },
  { name: 'Delhi NCR (Connaught Place)', address: 'Connaught Place, New Delhi', lat: 28.6304, lng: 77.2177, icon: 'storefront' as const },
  { name: 'Chennai (T. Nagar)', address: 'Usman Road, T. Nagar, Chennai', lat: 13.0418, lng: 80.2341, icon: 'home' as const },
  { name: 'Pune (Koregaon Park)', address: 'North Main Road, Koregaon Park, Pune', lat: 18.5362, lng: 73.8940, icon: 'trail-sign' as const },
];

const PROMO_BANNERS = [
  {
    id: 'b1',
    title: 'Local Kirana at your Doorstep',
    subtitle: 'Delivered in 10-15 Mins • 0 Delivery Fee',
    tag: '⚡ BLINK SPEED',
    bg: '#059669',
    icon: 'flash',
  },
  {
    id: 'b2',
    title: 'Fresh Farm Vegetables',
    subtitle: 'Direct from Mandi • Up to 40% OFF',
    tag: '🥬 100% FRESH',
    bg: '#D97706',
    icon: 'nutrition',
  },
  {
    id: 'b3',
    title: 'Pure Milk & Dairy Essentials',
    subtitle: 'Morning & Evening fresh supply',
    tag: '🥛 PURE & UNADULTERATED',
    bg: '#2563EB',
    icon: 'water',
  }
];

const FILTER_TABS = [
  { id: 'all', label: 'All Shops' },
  { id: 'fast', label: '⚡ Under 15 mins' },
  { id: 'free_delivery', label: '🏷️ Free Delivery' },
  { id: 'top_rated', label: '⭐ Top Rated (4.8+)' },
  { id: 'kirana', label: '🌾 Kirana & Atta' },
  { id: 'veggies', label: '🥬 Farm Veggies' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { shops, categories, initialize } = useShopStore();
  const { latitude, longitude, address, setLocation } = useLocationStore();

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [customAddressInput, setCustomAddressInput] = useState('');

  const handleSelectNeighborhood = (preset: typeof PRESET_NEIGHBORHOODS[0]) => {
    setLocation(preset.lat, preset.lng, preset.address);
    if (user && user.id && user.id !== 'u_guest_shopper') {
      useAuthStore.getState().setUser({
        ...user,
        address: preset.address,
        latitude: preset.lat,
        longitude: preset.lng,
      });
    }
    setLocationModalVisible(false);
  };

  const handleSaveCustomAddress = () => {
    if (!customAddressInput.trim()) return;
    const addr = customAddressInput.trim();
    // Default coordinate near Hyderabad Banjara Hills / Central
    const lat = userLat || 17.4142;
    const lng = userLng || 78.4335;
    setLocation(lat, lng, addr);
    if (user && user.id && user.id !== 'u_guest_shopper') {
      useAuthStore.getState().setUser({
        ...user,
        address: addr,
        latitude: lat,
        longitude: lng,
      });
    }
    setCustomAddressInput('');
    setLocationModalVisible(false);
  };

  useEffect(() => {
    initialize();
  }, []);

  useFocusEffect(
    useCallback(() => {
      initialize();
    }, [])
  );

  // Default coordinate if GPS not available (Hyderabad Banjara Hills)
  const userLat = latitude ?? 17.4142;
  const userLng = longitude ?? 78.4335;
  const displayAddress = address ?? 'Banjara Hills, Hyderabad';

  // Request & Fetch real user GPS location with safe timeout and fallback
  const fetchLiveLocation = async () => {
    try {
      setLoadingLocation(true);

      // On Web: use standard navigator.geolocation if available
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setLocation(lat, lng, 'Current Live Location');
            setLoadingLocation(false);
          },
          () => {
            // Permission denied or timeout - keep default location smoothly
            setLoadingLocation(false);
          },
          { timeout: 6000, maximumAge: 60000, enableHighAccuracy: false }
        );
        return;
      }

      // Native iOS / Android flow
      const { status } = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' as const }));
      if (status !== 'granted') {
        setLoadingLocation(false);
        return;
      }

      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
      ]);

      if (loc && loc.coords) {
        const currentLat = loc.coords.latitude;
        const currentLng = loc.coords.longitude;
        setLocation(currentLat, currentLng, 'Current Location');
      }
    } catch (e) {
      // Gracefully catch any timeout error and keep default Banjara Hills location
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    if (!latitude || !longitude) {
      setLocation(17.4142, 78.4335, 'Banjara Hills, Hyderabad');
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await initialize();
    await fetchLiveLocation();
    setRefreshing(false);
  };

  // Calculate dynamic exact distance for each shop from user's live coordinates & sort
  const shopsWithDistance = useMemo(() => {
    const list = shops.map(shop => {
      const dist = calculateDistance(userLat, userLng, shop.latitude, shop.longitude);
      return {
        ...shop,
        distance: dist,
        estimated_time: getEstimatedTime(dist),
      };
    });

    // Sort closest first
    list.sort((a, b) => a.distance - b.distance);
    return list;
  }, [shops, userLat, userLng]);

  // Filter shops according to active tab & category selection
  const filteredShops = useMemo(() => {
    return shopsWithDistance.filter(shop => {
      if (selectedCategory) {
        if (selectedCategory === 'c1' && !shop.tags?.some(t => t.toLowerCase().includes('veg') || t.toLowerCase().includes('fruit'))) return false;
        if (selectedCategory === 'c2' && !shop.tags?.some(t => t.toLowerCase().includes('milk') || t.toLowerCase().includes('bread') || t.toLowerCase().includes('dairy'))) return false;
        if (selectedCategory === 'c3' && !shop.tags?.some(t => t.toLowerCase().includes('snack') || t.toLowerCase().includes('munch') || t.toLowerCase().includes('chips'))) return false;
        if (selectedCategory === 'c6' && !shop.tags?.some(t => t.toLowerCase().includes('kirana') || t.toLowerCase().includes('atta') || t.toLowerCase().includes('dal'))) return false;
      }

      if (activeFilter === 'fast') return (shop.distance ?? 0) <= 2.5;
      if (activeFilter === 'free_delivery') return shop.delivery_fee === 0;
      if (activeFilter === 'top_rated') return (shop.rating ?? 0) >= 4.8;
      if (activeFilter === 'kirana') return shop.tags?.some(t => t.toLowerCase().includes('kirana') || t.toLowerCase().includes('atta') || t.toLowerCase().includes('rice'));
      if (activeFilter === 'veggies') return shop.tags?.some(t => t.toLowerCase().includes('veg') || t.toLowerCase().includes('fruit'));
      return true;
    });
  }, [shopsWithDistance, activeFilter, selectedCategory]);

  const nearestShop = shopsWithDistance.length > 0 ? shopsWithDistance[0] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Zepto/Blinkit Style Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {/* Customer Portal Brand Badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 }}>
              <Ionicons name="cart" size={15} color="#FFFFFF" />
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>CUSTOMER STOREFRONT</Text>
            </View>
            <View style={styles.flashHeaderPill}>
              <Ionicons name="flash" size={14} color="#D97706" />
              <Text style={styles.flashHeaderText}>10-15 MINS</Text>
            </View>
          </View>

          {/* Top Right Corner: User Profile / Login / Logout & GPS */}
          <View style={styles.headerActionsRow}>
            {user && user.id && user.id !== 'u_guest_shopper' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity 
                  style={styles.userBadgeBtn}
                  onPress={() => router.push('/(tabs)/profile')}
                >
                  <Ionicons name="person-circle" size={16} color="#059669" />
                  <Text style={styles.userBadgeText} numberOfLines={1}>
                    {user.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickLogoutBtn}
                  onPress={() => {
                    const confirmLogout = Platform.OS === 'web' 
                      ? window.confirm('Log out from this customer account?')
                      : true;
                    if (confirmLogout) {
                      useAuthStore.getState().logout();
                      router.replace('/(auth)/login');
                    }
                  }}
                  title="Logout"
                >
                  <Ionicons name="log-out-outline" size={15} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.loginBadgeBtn}
                onPress={() => router.push('/(auth)/login')}
              >
                <Ionicons name="log-in-outline" size={14} color="#FFFFFF" />
                <Text style={styles.loginBadgeText}>Login</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.gpsRefreshButton} 
              onPress={fetchLiveLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <>
                  <Ionicons name="locate" size={13} color="#10B981" />
                  <Text style={styles.gpsRefreshText}>GPS</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Dropdown Row */}
        <TouchableOpacity 
          style={styles.locationSelector} 
          activeOpacity={0.8}
          onPress={() => setLocationModalVisible(true)}
        >
          <View style={styles.locationPinCircle}>
            <Ionicons name="location" size={18} color="#10B981" />
          </View>
          <View style={styles.locationTextWrapper}>
            <Text style={styles.locationLabel}>Delivering to (Tap to change)</Text>
            <View style={styles.addressRow}>
              <Text style={styles.addressText} numberOfLines={1}>
                {displayAddress}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#1F2937" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />}
      >
        {/* Search Bar Bar */}
        <TouchableOpacity 
          style={styles.searchBar} 
          activeOpacity={0.9} 
          onPress={() => router.push('/(tabs)/search')}
        >
          <Ionicons name="search" size={20} color="#10B981" />
          <Text style={styles.searchText}>Search groceries, atta, milk, stores...</Text>
        </TouchableOpacity>

        {/* Promotional Offer Carousel */}
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promoCarouselContainer}
        >
          {PROMO_BANNERS.map(banner => (
            <View key={banner.id} style={[styles.promoCard, { backgroundColor: banner.bg }]}>
              <View style={styles.promoContent}>
                <View style={styles.promoTagPill}>
                  <Text style={styles.promoTagText}>{banner.tag}</Text>
                </View>
                <Text style={styles.promoTitle}>{banner.title}</Text>
                <Text style={styles.promoSubtitle}>{banner.subtitle}</Text>
              </View>
              <View style={styles.promoIconCircle}>
                <Ionicons name={banner.icon as any} size={36} color="#FFFFFF" />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Categories Horizontal Scroll */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {selectedCategory && (
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map(category => {
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity 
                key={category.id} 
                style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
                onPress={() => setSelectedCategory(isSelected ? null : category.id)}
              >
                <View style={[styles.categoryIconCircle, isSelected && styles.categoryIconCircleSelected]}>
                  <Ionicons 
                    name={category.icon as any} 
                    size={22} 
                    color={isSelected ? '#FFFFFF' : '#10B981'} 
                  />
                </View>
                <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]} numberOfLines={1}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filter Badges Row */}
        {shops.length > 0 && (
          <View style={styles.filterSection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.filterScroll}
            >
              {FILTER_TABS.map(tab => {
                const isActive = activeFilter === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                    onPress={() => setActiveFilter(tab.id)}
                  >
                    <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Nearby Local Shops Section */}
        <View style={styles.shopsSection}>
          <View style={styles.shopsHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Nearby Local Shops</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <View style={styles.sortAscendingPill}>
                  <Ionicons name="arrow-up" size={11} color="#059669" />
                  <Text style={styles.sortAscendingPillText}>Nearest First (Ascending)</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  • {filteredShops.length} stores
                </Text>
              </View>
            </View>
          </View>

          {/* Shop Cards List with Distance */}
          {filteredShops.length === 0 ? (
            <View style={styles.noShopsCard}>
              <View style={styles.noShopsIconCircle}>
                <Ionicons name="storefront-outline" size={44} color="#9CA3AF" />
              </View>
              <Text style={styles.noShopsTitle}>No Local Shops in this View</Text>
              <Text style={styles.noShopsSubtitle}>
                No nearby grocery stores found right now. Tap Refresh to check for active stores in your area.
              </Text>
              <View style={styles.emptyActionsStack}>
                <TouchableOpacity 
                  style={styles.refreshEmptyBtn}
                  onPress={onRefresh}
                >
                  <Ionicons name="refresh" size={16} color="#059669" />
                  <Text style={styles.refreshEmptyBtnText}>Refresh Nearby Stores</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.shopsList}>
              {filteredShops.map((shop, idx) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  distance={shop.distance ?? 1.2}
                  isNearest={idx === 0}
                  onPress={() => router.push(`/shop/${shop.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Select / Change Delivery Location Modal */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location" size={22} color="#059669" />
                <Text style={styles.modalTitle}>Choose Delivery Location</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setLocationModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Shops will automatically re-sort from nearest to farthest based on your selected address.
            </Text>

            {/* Use Current GPS Location Button */}
            <TouchableOpacity 
              style={styles.useGpsBtn}
              onPress={() => {
                setLocationModalVisible(false);
                fetchLiveLocation();
              }}
            >
              <Ionicons name="locate" size={18} color="#FFFFFF" />
              <Text style={styles.useGpsBtnText}>Use Current Live GPS Pin</Text>
            </TouchableOpacity>

            <Text style={styles.presetSectionLabel}>Popular Neighborhoods (Quick Switch):</Text>

            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {PRESET_NEIGHBORHOODS.map(preset => {
                const isSelected = displayAddress.includes(preset.name);
                return (
                  <TouchableOpacity
                    key={preset.name}
                    style={[styles.presetRow, isSelected && styles.presetRowSelected]}
                    onPress={() => handleSelectNeighborhood(preset)}
                  >
                    <View style={[styles.presetIconCircle, isSelected && styles.presetIconCircleSelected]}>
                      <Ionicons name={preset.icon} size={16} color={isSelected ? '#059669' : '#64748B'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.presetName, isSelected && styles.presetNameSelected]}>
                        {preset.name}
                      </Text>
                      <Text style={styles.presetAddressText} numberOfLines={1}>
                        {preset.address}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color="#059669" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Custom Address Input */}
            <View style={styles.customAddressSection}>
              <Text style={styles.customAddressLabel}>Or Enter Custom Address:</Text>
              <View style={styles.customAddressInputRow}>
                <TextInput
                  style={styles.customAddressInput}
                  placeholder="e.g. Flat 204, Rainbow Vistas, Hitec City"
                  value={customAddressInput}
                  onChangeText={setCustomAddressInput}
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity 
                  style={[styles.saveCustomBtn, !customAddressInput.trim() && { opacity: 0.5 }]}
                  onPress={handleSaveCustomAddress}
                  disabled={!customAddressInput.trim()}
                >
                  <Text style={styles.saveCustomBtnText}>Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flashHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  flashHeaderText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    maxWidth: 110,
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  quickLogoutBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  loginBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topShopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    maxWidth: 140,
  },
  topShopBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  gpsRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  gpsRefreshText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationPinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationTextWrapper: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  scrollContent: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 10,
  },
  searchText: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  promoCarouselContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  promoCard: {
    width: width - 32,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  promoContent: {
    flex: 1,
    paddingRight: 12,
  },
  promoTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  promoTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  promoSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  promoIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  clearFilterText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  categoryItem: {
    alignItems: 'center',
    width: 72,
  },
  categoryItemSelected: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  categoryIconCircleSelected: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  categoryName: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: '#10B981',
    fontWeight: '800',
  },
  filterSection: {
    marginTop: 14,
    marginBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  shopsSection: {
    marginTop: 6,
    paddingHorizontal: 16,
  },
  shopsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sortAscendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  sortAscendingPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  addShopHeaderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addShopHeaderLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  noShopsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 10,
  },
  noShopsIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  noShopsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  noShopsSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyActionsStack: {
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  addShopCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    maxWidth: 260,
  },
  addShopCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  refreshEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  refreshEmptyBtnText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  shopsList: {
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
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
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 17,
  },
  useGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  useGpsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  presetSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  presetRowSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  presetIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetIconCircleSelected: {
    backgroundColor: '#D1FAE5',
  },
  presetName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  presetNameSelected: {
    color: '#065F46',
  },
  presetAddressText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  customAddressSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 4,
  },
  customAddressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  customAddressInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customAddressInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  saveCustomBtn: {
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  saveCustomBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
