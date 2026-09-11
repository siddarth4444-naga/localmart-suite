import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useShopStore } from '../../../src/stores/shopStore';
import { useLocationStore } from '../../../src/stores/locationStore';
import { useCartStore } from '../../../src/stores/cartStore';
import { calculateDistance, formatDistance, getEstimatedTime, formatPrice } from '../../../src/lib/utils';
import { Product } from '../../../src/types';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { shops, products, categories, initialize } = useShopStore();
  const { latitude, longitude } = useLocationStore();
  const { items, addItem, updateQuantity, getCartItemCount, getSubtotal, activeShopId } = useCartStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  useFocusEffect(
    useCallback(() => {
      initialize();
    }, [])
  );

  const userLat = latitude ?? 17.4150;
  const userLng = longitude ?? 78.4350;

  // Find the exact shop from shopkeeper's store
  const shop = useMemo(() => {
    return shops.find(s => s.id === id);
  }, [shops, id]);

  // Calculate distance
  const distance = useMemo(() => {
    if (!shop) return 1.0;
    return calculateDistance(userLat, userLng, shop.latitude, shop.longitude);
  }, [userLat, userLng, shop]);

  const formattedDist = formatDistance(distance);
  const estTime = getEstimatedTime(distance);

  // Products belonging strictly to this shop
  const shopProducts = useMemo(() => {
    if (!shop) return [];
    return products.filter(p => p.shop_id === shop.id);
  }, [products, shop?.id]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (selectedCategoryId === 'all') return shopProducts;
    return shopProducts.filter(p => p.category_id === selectedCategoryId);
  }, [shopProducts, selectedCategoryId]);

  // Cart calculation for this shop
  const cartForShop = shop ? items.get(shop.id) || [] : [];
  const totalCartCount = shop ? getCartItemCount(shop.id) : 0;
  const subtotal = shop ? getSubtotal(shop.id) : 0;

  if (!shop) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="storefront-outline" size={48} color="#9CA3AF" />
        </View>
        <Text style={[styles.emptyTitle, { fontSize: 20, marginTop: 12 }]}>Store Not Found</Text>
        <Text style={[styles.emptySubtitle, { marginVertical: 8 }]}>
          This shop is not available or has not been published yet.
        </Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 24, marginTop: 16 }]}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAddToCart = (product: Product) => {
    if (activeShopId && activeShopId !== shop.id && (items.get(activeShopId)?.length ?? 0) > 0) {
      Alert.alert(
        'Replace cart item?',
        'Your cart contains items from another shop. Do you want to discard them and start a new order from this shop?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Yes, Start New', 
            style: 'destructive',
            onPress: () => addItem(product, shop.id, 1)
          }
        ]
      );
      return;
    }
    addItem(product, shop.id, 1);
  };

  const getProductQuantity = (productId: string) => {
    const item = cartForShop.find(ci => ci.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <View style={styles.container}>
      {/* Top Bar with Back Button & Shop Info */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButtonCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle} numberOfLines={1}>{shop.name}</Text>
        <TouchableOpacity style={styles.shareButtonCircle}>
          <Ionicons name="share-social-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Shop Cover Banner */}
        <View style={styles.coverWrapper}>
          <Image 
            source={{ uri: shop.cover_image_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80' }} 
            style={styles.coverImage}
          />
          <View style={styles.coverOverlay} />

          {/* Time & Distance Highlight Badge */}
          <View style={styles.heroBadgeCard}>
            <View style={styles.heroTimePill}>
              <Ionicons name="flash" size={14} color="#D97706" />
              <Text style={styles.heroTimeText}>{estTime.toUpperCase()}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroDistancePill}>
              <Ionicons name="navigate" size={13} color="#059669" />
              <Text style={styles.heroDistanceText}>{formattedDist} away</Text>
            </View>
          </View>
        </View>

        {/* Shop Main Details Card */}
        <View style={styles.shopInfoCard}>
          <Text style={styles.shopTitle}>{shop.name}</Text>
          <Text style={styles.shopSubtitle}>{shop.description || 'Quality products delivered fast'}</Text>
          <Text style={styles.shopAddressText}>
            <Ionicons name="location-outline" size={13} color="#6B7280" /> {shop.address}
          </Text>

          {/* Meta Row: Rating, Min Order, Delivery Fee */}
          <View style={styles.metaRow}>
            {shop.rating && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingScore}>{shop.rating.toFixed(1)}</Text>
                <Text style={styles.ratingVotes}>({shop.rating_count || 100}+)</Text>
              </View>
            )}

            <View style={styles.metaPill}>
              <Ionicons name="bicycle-outline" size={14} color="#059669" />
              <Text style={styles.metaPillText}>
                {shop.delivery_fee === 0 ? 'Free Delivery' : `₹${shop.delivery_fee} Fee`}
              </Text>
            </View>

            <View style={styles.metaPill}>
              <Ionicons name="wallet-outline" size={14} color="#4B5563" />
              <Text style={styles.metaPillText}>Min ₹{shop.min_order_amount}</Text>
            </View>

            {(shop.is_24_hours || shop.opening_time === '24 Hours') ? (
              <View style={[styles.metaPill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <Ionicons name="flash" size={14} color="#059669" />
                <Text style={[styles.metaPillText, { color: '#065F46', fontWeight: '800' }]}>Open 24/7 (24 Hours)</Text>
              </View>
            ) : shop.opening_time && shop.closing_time ? (
              <View style={styles.metaPill}>
                <Ionicons name="time-outline" size={14} color="#059669" />
                <Text style={styles.metaPillText}>{shop.opening_time} - {shop.closing_time}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Categories Tab Scroll */}
        <View style={styles.categorySection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            <TouchableOpacity 
              style={[styles.catTab, selectedCategoryId === 'all' && styles.catTabActive]}
              onPress={() => setSelectedCategoryId('all')}
            >
              <Text style={[styles.catTabText, selectedCategoryId === 'all' && styles.catTabTextActive]}>
                All Items ({shopProducts.length})
              </Text>
            </TouchableOpacity>

            {categories.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.catTab, selectedCategoryId === cat.id && styles.catTabActive]}
                onPress={() => setSelectedCategoryId(cat.id)}
              >
                <Text style={[styles.catTabText, selectedCategoryId === cat.id && styles.catTabTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Products Grid */}
        <View style={styles.productsGrid}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyProductsCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="basket-outline" size={40} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No products available</Text>
              <Text style={styles.emptySubtitle}>
                There are no items listed under this category right now. Please browse other categories!
              </Text>
            </View>
          ) : (
            filteredProducts.map(product => {
              const qty = getProductQuantity(product.id);
              const hasDiscount = product.mrp > product.price;
              const discountPct = hasDiscount ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

              return (
                <View key={product.id} style={styles.productCard}>
                  {/* Product Image */}
                  <View style={styles.productImageWrapper}>
                    <Image 
                      source={{ uri: product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80' }} 
                      style={styles.productImage}
                    />
                    {hasDiscount && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{discountPct}% OFF</Text>
                      </View>
                    )}
                  </View>

                  {/* Unit info */}
                  <Text style={styles.unitText}>{product.unit_value} {product.unit}</Text>

                  {/* Product Name */}
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>

                  {/* Price & Add Stepper */}
                  <View style={styles.productFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.currentPrice}>{formatPrice(product.price)}</Text>
                      {hasDiscount && (
                        <Text style={styles.mrpPrice}>{formatPrice(product.mrp)}</Text>
                      )}
                    </View>

                    {qty === 0 ? (
                      <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => handleAddToCart(product)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addButtonText}>ADD</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity 
                          style={styles.stepperButton}
                          onPress={() => updateQuantity(product.id, shop.id, qty - 1)}
                        >
                          <Ionicons name="remove" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.stepperCount}>{qty}</Text>
                        <TouchableOpacity 
                          style={styles.stepperButton}
                          onPress={() => updateQuantity(product.id, shop.id, qty + 1)}
                        >
                          <Ionicons name="add" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Checkout Bar (Zepto/Blinkit Style) */}
      {totalCartCount > 0 && (
        <View style={styles.floatingCartWrapper}>
          <TouchableOpacity 
            style={styles.floatingCartBar}
            activeOpacity={0.9}
            onPress={() => router.push('/(customer)/(tabs)/cart')}
          >
            <View style={styles.cartBarLeft}>
              <View style={styles.cartCountPill}>
                <Text style={styles.cartCountText}>{totalCartCount} ITEMS</Text>
              </View>
              <Text style={styles.cartTotalText}>{formatPrice(subtotal)}</Text>
            </View>

            <View style={styles.cartBarRight}>
              <Text style={styles.viewCartText}>View Cart</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  shareButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  coverWrapper: {
    height: 180,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  heroBadgeCard: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  heroTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroTimeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  heroDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  heroDistancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroDistanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  shopInfoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  shopTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  shopSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  shopAddressText: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  ratingVotes: {
    fontSize: 10,
    color: '#B45309',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  categorySection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  catTabActive: {
    backgroundColor: '#10B981',
  },
  catTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  catTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  emptyProductsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productImageWrapper: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    height: 36,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'column',
  },
  currentPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  mrpPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 6,
  },
  floatingCartWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  floatingCartBar: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  cartBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartCountPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cartCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cartTotalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  cartBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewCartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});