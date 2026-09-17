import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useCartStore } from '../../../src/stores/cartStore';
import { useLocationStore } from '../../../src/stores/locationStore';
import { useShopStore } from '../../../src/stores/shopStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { formatPrice, calculateDistance, formatDistance, getEstimatedTime } from '../../../src/lib/utils';

export default function CartScreen() {
  const router = useRouter();
  const { activeShopId, items, updateQuantity, clearCart, getSubtotal } = useCartStore();
  const { address, latitude, longitude } = useLocationStore();
  const { shops, addOrder } = useShopStore();
  const { user } = useAuthStore();

  const [placingOrder, setPlacingOrder] = useState(false);

  const cartItems = activeShopId ? (items.get(activeShopId) || []) : [];
  const activeShop = activeShopId ? shops.find(s => s.id === activeShopId) : null;

  const userLat = latitude ?? 17.4150;
  const userLng = longitude ?? 78.4350;

  const distance = activeShop 
    ? calculateDistance(userLat, userLng, activeShop.latitude, activeShop.longitude)
    : 1.2;

  const subtotal = activeShopId ? getSubtotal(activeShopId) : 0;
  const deliveryFee = activeShop?.delivery_fee ?? 0;
  const handlingFee = subtotal > 0 ? 5 : 0;
  const total = subtotal > 0 ? subtotal + deliveryFee + handlingFee : 0;

  const handlePlaceOrder = () => {
    if (subtotal === 0) return;

    if (activeShop && subtotal < activeShop.min_order_amount) {
      Alert.alert(
        'Minimum Order Not Met',
        `Minimum order amount for ${activeShop.name} is ₹${activeShop.min_order_amount}. Please add more items.`
      );
      return;
    }

    setPlacingOrder(true);
    setTimeout(() => {
      // Save order to store
      addOrder({
        customer_id: user?.id || 'cust_1',
        shop_id: activeShopId || '',
        subtotal,
        delivery_fee: deliveryFee,
        total,
        delivery_address: address || 'Banjara Hills, Hyderabad',
        delivery_lat: userLat,
        delivery_lng: userLng,
        items: cartItems.map((ci, idx) => ({
          id: `item_${Date.now()}_${idx}`,
          order_id: '',
          product_id: ci.product.id,
          product_name: ci.product.name,
          product_price: ci.product.price,
          product_image_url: ci.product.image_url,
          quantity: ci.quantity,
          total: ci.product.price * ci.quantity,
        })),
      });

      setPlacingOrder(false);
      clearCart();
      Alert.alert(
        '🎉 Order Placed Successfully!',
        `Your order has been notified to ${activeShop?.name || 'the shopkeeper'}. Estimated delivery in ${getEstimatedTime(distance)}.`,
        [
          {
            text: 'Track Order',
            onPress: () => router.push('/(customer)/(tabs)/orders')
          }
        ]
      );
    }, 1000);
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={64} color="#10B981" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse nearby neighborhood shops and add your daily groceries!
          </Text>
          <TouchableOpacity 
            style={styles.browseButton} 
            onPress={() => router.push('/(customer)/(tabs)/home')}
          >
            <Text style={styles.browseButtonText}>Browse Nearby Shops</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Your Order</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearCartText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shop Info Card */}
        {activeShop && (
          <View style={styles.shopCard}>
            <View style={styles.shopIconCircle}>
              <Ionicons name="storefront" size={20} color="#059669" />
            </View>
            <View style={styles.shopTextWrapper}>
              <Text style={styles.shopOrderingFrom}>ORDERING FROM</Text>
              <Text style={styles.shopName}>{activeShop.name}</Text>
              <View style={styles.shopMetaRow}>
                <Ionicons name="navigate" size={12} color="#059669" />
                <Text style={styles.shopDistanceText}>{formatDistance(distance)} away</Text>
                <Text style={styles.dot}>•</Text>
                <Ionicons name="flash" size={12} color="#D97706" />
                <Text style={styles.shopTimeText}>{getEstimatedTime(distance)} delivery</Text>
              </View>
            </View>
          </View>
        )}

        {/* Delivery Address Card */}
        <View style={styles.addressCard}>
          <View style={styles.addressIconCircle}>
            <Ionicons name="location" size={18} color="#10B981" />
          </View>
          <View style={styles.addressTextWrapper}>
            <Text style={styles.addressLabel}>DELIVERY ADDRESS</Text>
            <Text style={styles.addressValue} numberOfLines={2}>
              {address || 'Home - Banjara Hills, Hyderabad'}
            </Text>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Items ({cartItems.length})</Text>
          {cartItems.map(item => (
            <View key={item.product.id} style={styles.itemRow}>
              <Image 
                source={{ uri: item.product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80' }} 
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.itemUnit}>{item.product.unit_value} {item.product.unit}</Text>
                <Text style={styles.itemPrice}>{formatPrice(item.product.price * item.quantity)}</Text>
              </View>

              {/* Stepper */}
              <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={styles.stepperBtn}
                  onPress={() => updateQuantity(item.product.id, activeShopId!, item.quantity - 1)}
                >
                  <Ionicons name="remove" size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.stepperCount}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={styles.stepperBtn}
                  onPress={() => updateQuantity(item.product.id, activeShopId!, item.quantity + 1)}
                >
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Bill Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee ({formatDistance(distance)})</Text>
            <Text style={styles.billValue}>
              {deliveryFee === 0 ? (
                <Text style={{ color: '#059669', fontWeight: '700' }}>FREE</Text>
              ) : (
                formatPrice(deliveryFee)
              )}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Handling / Packaging Fee</Text>
            <Text style={styles.billValue}>{formatPrice(handlingFee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Payment Mode */}
        <View style={styles.paymentCard}>
          <Ionicons name="cash-outline" size={22} color="#059669" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.paymentTitle}>Cash / UPI on Delivery</Text>
            <Text style={styles.paymentSubtitle}>Pay directly to the local shopkeeper at your door</Text>
          </View>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Checkout Bar */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerTotalLabel}>TO PAY</Text>
          <Text style={styles.footerTotal}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.placeOrderButton, placingOrder && { opacity: 0.8 }]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order (COD)</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  clearCartText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shopIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopTextWrapper: {
    flex: 1,
  },
  shopOrderingFrom: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  shopDistanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  shopTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  dot: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressTextWrapper: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  addressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  itemUnit: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
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
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: '#4B5563',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: 12,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  paymentSubtitle: {
    fontSize: 11,
    color: '#047857',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  placeOrderButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
