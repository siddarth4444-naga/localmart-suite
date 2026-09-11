import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Switch, 
  Alert,
  Modal 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';

export default function AddProductScreen() {
  const router = useRouter();
  const { shops, activeShopkeeperShopId, setActiveShopkeeperShopId, categories, addProduct } = useShopStore();
  const { user } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      useShopStore.getState().initialize();
      useAuthStore.getState().initialize();
    }, [])
  );

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

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [unit, setUnit] = useState<'kg' | 'g' | 'L' | 'mL' | 'piece' | 'pack'>('piece');
  const [unitValue, setUnitValue] = useState('1');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'c1');
  const [stock, setStock] = useState('50');
  const [isAvailable, setIsAvailable] = useState(true);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addedItemDetails, setAddedItemDetails] = useState<{ name: string; price: number; shop: string } | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setMrp('');
    setUnit('piece');
    setUnitValue('1');
    setStock('50');
    setIsAvailable(true);
    setShowSuccessModal(false);
    setAddedItemDetails(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a product name.');
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    const mrpNum = parseFloat(mrp) || priceNum;
    const unitValNum = parseFloat(unitValue) || 1;
    const stockNum = parseInt(stock, 10) || 50;
    const targetShopId = activeShop?.id || (shops.length > 0 ? shops[0].id : null);
    if (!targetShopId) {
      Alert.alert('No Store Found', 'Please register or create your shop first before adding products.');
      return;
    }

    addProduct({
      shop_id: targetShopId,
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      mrp: mrpNum,
      unit,
      unit_value: unitValNum,
      category_id: categoryId,
      stock_quantity: stockNum,
      is_available: isAvailable,
    });

    setAddedItemDetails({
      name: name.trim(),
      price: priceNum,
      shop: activeShop?.name || 'Your Store',
    });
    setShowSuccessModal(true);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.shopInfoBar}>
        <Ionicons name="storefront" size={16} color="#059669" />
        <Text style={styles.shopInfoText}>Adding to: <Text style={{ fontWeight: '800' }}>{activeShop?.name}</Text></Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Fresh Tomatoes, Aashirvaad Atta" 
            value={name}
            onChangeText={setName}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Details about product..." 
            multiline 
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Selling Price (₹) *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0.00" 
              keyboardType="numeric" 
              value={price}
              onChangeText={setPrice}
              placeholderTextColor="#94A3B8"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>MRP (₹)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0.00" 
              keyboardType="numeric" 
              value={mrp}
              onChangeText={setMrp}
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
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

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 0.8, marginRight: 10 }]}>
            <Text style={styles.label}>Unit Value</Text>
            <TextInput 
              style={styles.input} 
              placeholder="1 or 500" 
              keyboardType="numeric" 
              value={unitValue}
              onChangeText={setUnitValue}
              placeholderTextColor="#94A3B8"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1.2 }]}>
            <Text style={styles.label}>Unit Type</Text>
            <View style={styles.unitRow}>
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
          <Text style={styles.label}>Stock Quantity</Text>
          <TextInput 
            style={styles.input} 
            placeholder="50" 
            keyboardType="numeric" 
            value={stock}
            onChangeText={setStock}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.switchGroup}>
          <Text style={styles.label}>Available in Store</Text>
          <Switch 
            value={isAvailable} 
            onValueChange={setIsAvailable}
            trackColor={{ false: '#d1d5db', true: '#10B981' }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
          <Text style={styles.submitButtonText}>Add Product to Store</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />

      {/* Item Added Successfully Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={54} color="#10B981" />
            </View>

            <Text style={styles.modalTitle}>Item Added Successfully!</Text>
            <Text style={styles.modalSubtitle}>
              <Text style={{ fontWeight: '800', color: '#0F172A' }}>{addedItemDetails?.name}</Text> (₹{addedItemDetails?.price}) is now live in{' '}
              <Text style={{ fontWeight: '800', color: '#059669' }}>{addedItemDetails?.shop}</Text>
            </Text>

            <View style={styles.modalBadge}>
              <Ionicons name="eye-outline" size={14} color="#059669" />
              <Text style={styles.modalBadgeText}>Visible to nearby customers immediately</Text>
            </View>

            <View style={styles.modalButtonStack}>
              <TouchableOpacity
                style={styles.modalAddMoreBtn}
                onPress={resetForm}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.modalAddMoreBtnText}>+ Add Another Item</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalViewProductsBtn}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.back();
                }}
              >
                <Text style={styles.modalViewProductsBtnText}>View in Products List</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  shopInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  shopInfoText: {
    fontSize: 13,
    color: '#065F46',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
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
  unitRow: {
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
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 4,
  },
  submitButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  successIconCircle: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  modalBadgeText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  modalButtonStack: {
    width: '100%',
    gap: 10,
  },
  modalAddMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  modalAddMoreBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalViewProductsBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  modalViewProductsBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
});
