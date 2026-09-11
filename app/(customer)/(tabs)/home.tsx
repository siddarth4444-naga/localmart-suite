import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';

import { useShopStore } from '../../../src/stores/shopStore';
import { calculateDistance, getEstimatedTime } from '../../../src/lib/utils';
import { useLocationStore } from '../../../src/stores/locationStore';
import ShopCard from '../../../src/components/ShopCard';

const { width } = Dimensions.get('window');

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
  const { shops, categories, initialize } = useShopStore();
  const { latitude, longitude, address, setLocation } = useLocationStore();

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  useFocusEffect(
    useCallback(() => {
      initialize();
    }, [])
  );

  // Default coordinate if GPS not available (Hyderabad Banjara Hills)
  const userLat = latitude ?? 17.4150;
  const userLng = longitude ?? 78.4350;
  const displayAddress = address ?? 'Banjara Hills, Hyderabad';

  // Request & Fetch real user GPS location
  const fetchLiveLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLoadingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const currentLat = loc.coords.latitude;
      const currentLng = loc.coords.longitude;

      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: currentLat,
          longitude: currentLng,
        });

        if (geo) {
          const formatted = [geo.name, geo.street, geo.district || geo.subregion, geo.city]
            .filter(Boolean)
            .join(', ');
          setLocation(currentLat, currentLng, formatted || 'Current Location');
        } else {
          setLocation(currentLat, currentLng, 'Current Location');
        }
      } catch {
        setLocation(currentLat, currentLng, 'Current Location');
      }
    } catch (e) {
      console.log('Location error:', e);
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    if (!latitude || !longitude) {
      fetchLiveLocation();
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
          {/* Fast Delivery Brand Tag */}
          <View style={styles.flashHeaderPill}>
            <Ionicons name="flash" size={14} color="#D97706" />
            <Text style={styles.flashHeaderText}>10-15 MINS</Text>
          </View>

          {/* Top Right Corner: Nearest/Assigned Shop Name & GPS */}
          <View style={styles.headerActionsRow}>
            {nearestShop && (
              <View style={styles.topShopBadge}>
                <Ionicons name="storefront" size={13} color="#059669" />
                <Text style={styles.topShopBadgeText} numberOfLines={1}>
                  {nearestShop.name}
                </Text>
              </View>
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
          onPress={fetchLiveLocation}
        >
          <View style={styles.locationPinCircle}>
            <Ionicons name="location" size={18} color="#10B981" />
          </View>
          <View style={styles.locationTextWrapper}>
            <Text style={styles.locationLabel}>Delivering to</Text>
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
          onPress={() => router.push('/(customer)/(tabs)/search')}
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
              <Text style={styles.sectionSubtitle}>
                {filteredShops.length} shops sorted by nearest distance
              </Text>
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
              {filteredShops.map(shop => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  distance={shop.distance ?? 1.2}
                  onPress={() => router.push(`/(customer)/shop/${shop.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
});
