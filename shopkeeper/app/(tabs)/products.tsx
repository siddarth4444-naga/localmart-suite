import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Switch, 
  Image, 
  Alert,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice } from '../../src/lib/utils';

export default function ProductsScreen() {
  const router = useRouter();
  const { 
    shops, 
    products, 
    categories, 
    activeShopkeeperShopId, 
    setActiveShopkeeperShopId,
    toggleProductAvailability,
    deleteProduct 
  } = useShopStore();
  const { user } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      useShopStore.getState().initialize();
      useAuthStore.getState().initialize();
    }, [])
  );

  const [search, setSearch] = useState('');

  // Strictly identify active shopkeeper store
  const myShops = user
    ? shops.filter(s => s.owner_id === user.id || s.owner_email?.toLowerCase() === user.email?.toLowerCase())
    : shops;
  const activeShop = (myShops.length > 0 ? myShops.find(s => s.id === activeShopkeeperShopId) || myShops[0] : null)
    || shops.find(s => s.id === activeShopkeeperShopId) 
    || shops[0];

  useEffect(() => {
    if (activeShop && !activeShopkeeperShopId) {
      setActiveShopkeeperShopId(activeShop.id);
    }
  }, [activeShop, activeShopkeeperShopId]);

  const shopProducts = activeShop ? products.filter(p => p.shop_id === activeShop.id) : [];

  const filteredProducts = search.trim()
    ? shopProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : shopProducts;

  const handleDelete = (productId: string, name: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(`Delete Product: Are you sure you want to delete "${name}"?`);
      if (confirmed) {
        deleteProduct(productId);
      }
      return;
    }

    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(productId) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Store Badge */}
      <View style={styles.storeHeaderBadge}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.storeHeaderTitle}>Manage Inventory</Text>
        </View>
        <View style={styles.activeStorePill}>
          <Ionicons name="storefront" size={13} color="#059669" />
          <Text style={styles.activeStorePillText} numberOfLines={1}>
            {activeShop?.name || 'My Store'}
          </Text>
        </View>
      </View>

      {/* Search and Add Bar */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeShop?.name || 'store'} items...`}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/add-product' as any)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={50} color="#CBD5E1" />
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubtext}>
              Tap the "+ Add" button above to add new grocery products to your store.
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const cat = categories.find(c => c.id === item.category_id);
          return (
            <View style={styles.productCard}>
              <Image 
                source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80' }} 
                style={styles.productImage} 
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productCategory}>{item.unit_value} {item.unit} • {cat?.name || 'General'}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
                  {item.mrp > item.price && (
                    <Text style={styles.productMrp}>{formatPrice(item.mrp)}</Text>
                  )}
                  <Text style={styles.productStock}>Stock: {item.stock_quantity}</Text>
                </View>
              </View>

              <View style={styles.productActions}>
                <View style={styles.statusRow}>
                  <Text style={[styles.statusLabel, { color: item.is_available ? '#059669' : '#EF4444' }]}>
                    {item.is_available ? 'In Stock' : 'Out'}
                  </Text>
                  <Switch
                    value={item.is_available}
                    onValueChange={() => toggleProductAvailability(item.id)}
                    trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.editDeleteContainer}>
                  <TouchableOpacity 
                    onPress={() => router.push(`/edit-product/${item.id}` as any)} 
                    style={styles.iconButton}
                  >
                    <Ionicons name="pencil" size={16} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDelete(item.id, item.name)} 
                    style={styles.deleteIconButton}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  storeHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  storeHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  activeStorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    maxWidth: '50%',
  },
  activeStorePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  header: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  addButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  listContainer: {
    padding: 14,
    gap: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  productCategory: {
    fontSize: 11,
    color: '#64748B',
    marginVertical: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  productMrp: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  productStock: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 4,
  },
  productActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  editDeleteContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  deleteIconButton: {
    padding: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
});
