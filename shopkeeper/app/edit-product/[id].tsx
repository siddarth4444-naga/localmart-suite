import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Switch, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useShopStore } from '../../src/stores/shopStore';

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, updateProduct, categories } = useShopStore();

  const product = products.find(p => p.id === id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [unit, setUnit] = useState<'kg' | 'g' | 'L' | 'mL' | 'piece' | 'pack'>('piece');
  const [unitValue, setUnitValue] = useState('1');
  const [categoryId, setCategoryId] = useState('c1');
  const [stock, setStock] = useState('50');
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setMrp(product.mrp.toString());
      setUnit(product.unit);
      setUnitValue(product.unit_value.toString());
      setCategoryId(product.category_id);
      setStock(product.stock_quantity.toString());
      setIsAvailable(product.is_available);
    }
  }, [product]);

  if (!product) {
    return (
      <View style={styles.notFound}>
        <Text style={{ color: '#64748B', fontSize: 16 }}>Product not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Product name is required.');
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Valid price is required.');
      return;
    }

    updateProduct(product.id, {
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      mrp: parseFloat(mrp) || priceNum,
      unit,
      unit_value: parseFloat(unitValue) || 1,
      category_id: categoryId,
      stock_quantity: parseInt(stock, 10) || 50,
      is_available: isAvailable,
    });

    Alert.alert('Success', 'Product updated successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topTitleBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topTitleBarText}>Edit Product</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput 
            style={styles.input} 
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            multiline 
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Selling Price (₹)</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              value={price}
              onChangeText={setPrice}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>MRP (₹)</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              value={mrp}
              onChangeText={setMrp}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 0.8, marginRight: 10 }]}>
            <Text style={styles.label}>Unit Value</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              value={unitValue}
              onChangeText={setUnitValue}
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
            keyboardType="numeric" 
            value={stock}
            onChangeText={setStock}
          />
        </View>

        <View style={styles.switchGroup}>
          <Text style={styles.label}>In Stock / Available</Text>
          <Switch 
            value={isAvailable} 
            onValueChange={setIsAvailable}
            trackColor={{ false: '#d1d5db', true: '#10B981' }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
          <Text style={styles.submitButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topTitleBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topTitleBarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    marginTop: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
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
});
