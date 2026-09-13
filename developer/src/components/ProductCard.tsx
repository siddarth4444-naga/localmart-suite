import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from './ui/Badge';
import Button from './ui/Button';

export interface Product {
  id: string;
  name: string;
  image_url?: string;
  price: number;
  mrp?: number;
  unit: string;
  in_stock: boolean;
}

interface ProductCardProps {
  product: Product;
  cartQuantity: number;
  onAddToCart: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export default function ProductCard({
  product,
  cartQuantity,
  onAddToCart,
  onIncrement,
  onDecrement,
}: ProductCardProps) {
  const discount = product.mrp && product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={32} color="#9CA3AF" />
          </View>
        )}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Badge text={`${discount}% OFF`} size="sm" backgroundColor="#EF4444" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{product.price}</Text>
          {product.mrp && product.mrp > product.price && (
            <Text style={styles.mrp}>₹{product.mrp}</Text>
          )}
        </View>

        <View style={styles.actionContainer}>
          {!product.in_stock ? (
            <Text style={styles.outOfStock}>Out of stock</Text>
          ) : cartQuantity === 0 ? (
            <Button
              title="ADD"
              onPress={onAddToCart}
              size="sm"
              variant="secondary"
              fullWidth
            />
          ) : (
            <View style={styles.quantityControl}>
              <TouchableOpacity onPress={onDecrement} style={styles.qtyBtn}>
                <Ionicons name="remove" size={20} color="#10B981" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{cartQuantity}</Text>
              <TouchableOpacity onPress={onIncrement} style={styles.qtyBtn}>
                <Ionicons name="add" size={20} color="#10B981" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    width: '100%',
    flex: 1,
  },
  imageContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
    height: 40,
  },
  unit: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 6,
  },
  mrp: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  actionContainer: {
    height: 36,
    justifyContent: 'center',
  },
  outOfStock: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    height: 36,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
});
