import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { useShopStore } from '../../../src/stores/shopStore';
import { useLocationStore } from '../../../src/stores/locationStore';
import { useCartStore } from '../../../src/stores/cartStore';
import { calculateDistance, formatDistance, formatPrice } from '../../../src/lib/utils';
import { Product } from '../../../src/types';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  
  const { shops, products, initialize } = useShopStore();
  const { latitude, longitude } = useLocationStore();
  const { items, addItem, updateQuantity, activeShopId } = useCartStore();

  useFocusEffect(
    useCallback(() => {
      initialize();
    }, [])
  );

  const userLat = latitude ?? 17.4150;
  const userLng = longitude ?? 78.4350;

  // Search through all products and attach shop metadata
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const lower = query.toLowerCase();
    const matches = products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.unit.toLowerCase().includes(lower)
    );

    return matches
      .map(product => {
        const shop = shops.find(s => s.id === product.shop_id);
        if (!shop || !shop.is_active) return null;
        const distance = calculateDistance(userLat, userLng, shop.latitude, shop.longitude);
        return {
          product,
          shop,
          distance,
        };
      })
      .filter((item): item is { product: Product; shop: any; distance: number } => item !== null);
  }, [query, products, shops, userLat, userLng]);

  const handleAddToCart = (product: Product, shopId: string) => {
    if (activeShopId && activeShopId !== shopId && (items.get(activeShopId)?.length ?? 0) > 0) {
      const activeShop = shops.find(s => s.id === activeShopId);
      Alert.alert(
        'Replace Cart Items?',
        `Your cart currently has items from ${activeShop?.name || 'another shop'}. You can only order from 1 shop at a time. Discard existing items?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Yes, Start New', 
            style: 'destructive',
            onPress: () => addItem(product, shopId, 1)
          }
        ]
      );
      return;
    }
    addItem(product, shopId, 1);
  };

  const getProductQuantity = (productId: string, shopId: string) => {
    const shopCart = items.get(shopId) || [];
    const item = shopCart.find(ci => ci.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#10B981" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groceries, milk, veggies..."
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholderTextColor="#9CA3AF"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearIcon}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={item => `${item.product.id}-${item.shop.id}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const qty = getProductQuantity(item.product.id, item.shop.id);
            const hasDiscount = item.product.mrp > item.product.price;
            const discountPct = hasDiscount ? Math.round(((item.product.mrp - item.product.price) / item.product.mrp) * 100) : 0;

            return (
              <View style={styles.productCard}>
                <Image 
                  source={{ uri: item.product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80' }} 
                  style={styles.productImage} 
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{item.product.name}</Text>
                  
                  {/* Shop & Distance Row */}
                  <TouchableOpacity 
                    style={styles.shopMetaRow}
                    onPress={() => router.push(`/(customer)/shop/${item.shop.id}`)}
                  >
                    <Ionicons name="storefront-outline" size={13} color="#059669" />
                    <Text style={styles.shopName} numberOfLines={1}>{item.shop.name}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
                  </TouchableOpacity>

                  <View style={styles.priceRow}>
                    <View>
                      <Text style={styles.price}>{formatPrice(item.product.price)}</Text>
                      {hasDiscount && (
                        <Text style={styles.mrp}>{formatPrice(item.product.mrp)} ({discountPct}% off)</Text>
                      )}
                    </View>

                    {qty === 0 ? (
                      <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => handleAddToCart(item.product, item.shop.id)}
                      >
                        <Text style={styles.addButtonText}>ADD</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity 
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(item.product.id, item.shop.id, qty - 1)}
                        >
                          <Ionicons name="remove" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.stepperCount}>{qty}</Text>
                        <TouchableOpacity 
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(item.product.id, item.shop.id, qty + 1)}
                        >
                          <Ionicons name="add" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No products found for "{query}"</Text>
              <Text style={styles.emptyStateSubtitle}>Try searching for "Milk", "Atta", "Tomatoes", "Noodles"</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.popularContainer}>
          <Text style={styles.popularTitle}>Popular Grocery Searches</Text>
          <View style={styles.tagsContainer}>
            {['Amul Milk', 'Fresh Tomatoes', 'Aashirvaad Atta', 'Onion', 'Maggi', 'Bread', 'Potato', 'Biscuits', 'Ghee', 'Paneer'].map(tag => (
              <TouchableOpacity key={tag} style={styles.tag} onPress={() => setQuery(tag)}>
                <Ionicons name="trending-up" size={13} color="#10B981" />
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Shops suggestions */}
          {shops.length > 0 && (
            <>
              <Text style={[styles.popularTitle, { marginTop: 24 }]}>Browse Popular Stores</Text>
              <View style={styles.quickShopsList}>
                {shops.slice(0, 4).map(shop => (
                  <TouchableOpacity 
                    key={shop.id}
                    style={styles.quickShopItem}
                    onPress={() => router.push(`/(customer)/shop/${shop.id}`)}
                  >
                    <Ionicons name="storefront" size={20} color="#10B981" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.quickShopName}>{shop.name}</Text>
                      <Text style={styles.quickShopAddress}>{shop.address}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  clearIcon: {
    padding: 6,
  },
  listContent: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  shopName: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    flexShrink: 1,
  },
  dot: {
    color: '#9CA3AF',
  },
  distanceText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  mrp: {
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
    fontWeight: '800',
    fontSize: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepperCount: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  popularContainer: {
    padding: 20,
  },
  popularTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  quickShopsList: {
    gap: 10,
  },
  quickShopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickShopName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  quickShopAddress: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});
