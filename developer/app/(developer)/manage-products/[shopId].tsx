import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert,
  Switch,
  Modal,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useShopStore } from '../../../src/stores/shopStore';
import { Product } from '../../../src/types';
import { formatPrice } from '../../../src/lib/utils';

export default function ManageShopProductsScreen() {
  const { shopId } = useLocalSearchParams<{ shopId: string }>();
  const router = useRouter();
  
  const { 
    shops, 
    products, 
    categories, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductAvailability 
  } = useShopStore();

  const shop = shops.find(s => s.id === shopId);
  const shopProducts = products.filter(p => p.shop_id === shopId);

  // Add/Edit Product Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [unit, setUnit] = useState<'kg' | 'g' | 'L' | 'mL' | 'piece' | 'pack'>('piece');
  const [unitValue, setUnitValue] = useState('1');
  const [categoryId, setCategoryId] = useState('c1');
  const [stock, setStock] = useState('50');

  const openAddModal = () => {
    setEditingProductId(null);
    setName('');
    setPrice('');
    setMrp('');
    setUnit('piece');
    setUnitValue('1');
    setCategoryId(categories[0]?.id || 'c1');
    setStock('50');
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setName(product.name);
    setPrice(product.price.toString());
    setMrp(product.mrp.toString());
    setUnit(product.unit);
    setUnitValue(product.unit_value.toString());
    setCategoryId(product.category_id);
    setStock(product.stock_quantity.toString());
    setModalVisible(true);
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSaveProduct = () => {
    if (!name.trim()) {
      showAlert('Missing Name', 'Please enter the product name (e.g. Fresh Milk, Brown Bread).');
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showAlert('Invalid Price', 'Please enter a valid price in rupees (e.g. 40).');
      return;
    }

    const mrpNum = parseFloat(mrp) || priceNum;
    const unitValNum = parseFloat(unitValue) || 1;
    const stockNum = parseInt(stock, 10) || 50;

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: name.trim(),
        price: priceNum,
        mrp: mrpNum,
        unit,
        unit_value: unitValNum,
        category_id: categoryId,
        stock_quantity: stockNum,
      });
    } else {
      addProduct({
        shop_id: shopId,
        name: name.trim(),
        price: priceNum,
        mrp: mrpNum,
        unit,
        unit_value: unitValNum,
        category_id: categoryId,
        stock_quantity: stockNum,
        is_available: true,
      });
    }

    setModalVisible(false);
  };

  const handleDelete = (prodId: string, prodName: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(`Delete Product: Are you sure you want to delete "${prodName}" from ${shop?.name}?`);
      if (confirmed) {
        deleteProduct(prodId);
      }
      return;
    }

    Alert.alert(
      'Delete Product',
      `Delete "${prodName}" from ${shop?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(prodId) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header Info */}
      <View style={styles.shopBanner}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.bannerShopName}>{shop?.name || 'Shop'}</Text>
          <Text style={styles.bannerSubtitle}>
            {shopProducts.length} items listed • Real-time synced
          </Text>
        </View>

        <TouchableOpacity style={styles.addBtnHeader} onPress={openAddModal}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnHeaderText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {shopProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={50} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No items in this shop yet</Text>
            <Text style={styles.emptySub}>
              Add grocery products like Atta, Milk, Bread, Tomatoes, Snacks with their prices.
            </Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddModal}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyAddBtnText}>Add First Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productsList}>
            {shopProducts.map(product => {
              const cat = categories.find(c => c.id === product.category_id);
              return (
                <View key={product.id} style={styles.productRowCard}>
                  <Image 
                    source={{ uri: product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80' }}
                    style={styles.productThumb} 
                  />

                  <View style={styles.productDetails}>
                    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                    <Text style={styles.productUnit}>
                      {product.unit_value} {product.unit} • {cat?.name || 'General'}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceText}>{formatPrice(product.price)}</Text>
                      {product.mrp > product.price && (
                        <Text style={styles.mrpText}>{formatPrice(product.mrp)}</Text>
                      )}
                      <Text style={styles.stockText}>Stock: {product.stock_quantity}</Text>
                    </View>
                  </View>

                  <View style={styles.actionsColumn}>
                    <View style={styles.availabilityRow}>
                      <Text style={[styles.availText, { color: product.is_available ? '#059669' : '#EF4444' }]}>
                        {product.is_available ? 'In Stock' : 'Out'}
                      </Text>
                      <Switch
                        value={product.is_available}
                        onValueChange={() => toggleProductAvailability(product.id)}
                        trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                    <View style={styles.btnRow}>
                      <TouchableOpacity 
                        style={styles.editIconBtn}
                        onPress={() => openEditModal(product)}
                      >
                        <Ionicons name="pencil" size={14} color="#3B82F6" />
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.deleteIconBtn}
                        onPress={() => handleDelete(product.id, product.name)}
                      >
                        <Ionicons name="trash" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add / Edit Product Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProductId ? 'Edit Product Item' : 'Add New Item to Shop'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Product Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Aashirvaad Shudh Chakki Atta"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.rowTwo}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>Selling Price (₹) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="275"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>MRP (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="310"
                    keyboardType="numeric"
                    value={mrp}
                    onChangeText={setMrp}
                  />
                </View>
              </View>

              <View style={styles.rowTwo}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>Unit Value</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="1 or 500"
                    keyboardType="numeric"
                    value={unitValue}
                    onChangeText={setUnitValue}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1.2 }]}>
                  <Text style={styles.modalLabel}>Unit Type</Text>
                  <View style={styles.unitPillsRow}>
                    {(['kg', 'g', 'L', 'mL', 'piece', 'pack'] as const).map(u => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitPill, unit === u && styles.unitPillActive]}
                        onPress={() => setUnit(u)}
                      >
                        <Text style={[styles.unitPillText, unit === u && styles.unitPillTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 6 }}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catPill, categoryId === cat.id && styles.catPillActive]}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <Text style={[styles.catPillText, categoryId === cat.id && styles.catPillTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Stock Quantity</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="50"
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveProduct}>
              <Text style={styles.modalSaveBtnText}>
                {editingProductId ? 'Update Product' : 'Add Product'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  shopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bannerShopName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  addBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  productsList: {
    gap: 10,
  },
  productRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  productUnit: {
    fontSize: 11,
    color: '#64748B',
    marginVertical: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  mrpText: {
    fontSize: 10,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  stockText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 4,
  },
  actionsColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availText: {
    fontSize: 10,
    fontWeight: '800',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editIconBtn: {
    padding: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  deleteIconBtn: {
    padding: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
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
    color: '#0F172A',
  },
  inputGroup: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  unitPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  unitPill: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  unitPillActive: {
    backgroundColor: '#10B981',
  },
  unitPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  unitPillTextActive: {
    color: '#FFFFFF',
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  catPillActive: {
    backgroundColor: '#10B981',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  modalSaveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
