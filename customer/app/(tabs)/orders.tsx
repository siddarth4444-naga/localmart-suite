import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice, getOrderStatusInfo, getPaymentMethodInfo } from '../../src/lib/utils';
import { Order } from '../../src/types';

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, shops, updateOrderStatus } = useShopStore();
  const { user } = useAuthStore();

  const isGuestOrLoggedOut = !user || !user.id || user.id === 'u_guest_shopper';

  // Strictly isolate orders belonging only to the logged-in customer (by ID or Phone)
  const customerOrders = React.useMemo(() => {
    if (isGuestOrLoggedOut) return [];
    const cleanUserPhone = user.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';

    return orders.filter(o => {
      if (o.customer_id === user.id) return true;
      if (cleanUserPhone && o.customer_phone) {
        const cleanOrderPhone = o.customer_phone.replace(/\D/g, '').slice(-10);
        if (cleanOrderPhone === cleanUserPhone) return true;
      }
      return false;
    });
  }, [orders, user, isGuestOrLoggedOut]);

  const handleCancelOrder = (order: Order, shopName: string) => {
    const confirmMsg = `Are you sure you want to cancel your order #${order.id.slice(-6)} from "${shopName}"?`;
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(confirmMsg);
      if (confirmed) {
        updateOrderStatus(order.id, 'cancelled');
        window.alert('Order Cancelled successfully!');
      }
      return;
    }

    Alert.alert(
      'Cancel Order',
      confirmMsg,
      [
        { text: 'No, Keep Order', style: 'cancel' },
        { 
          text: 'Yes, Cancel Order', 
          style: 'destructive',
          onPress: () => {
            updateOrderStatus(order.id, 'cancelled');
            Alert.alert('Order Cancelled', 'Your order has been cancelled and updated in the shopkeeper database.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders ({customerOrders.length})</Text>
      </View>

      <FlatList
        data={customerOrders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No orders placed yet</Text>
            <Text style={styles.emptySubtitle}>
              Orders placed from local shops will appear here with live preparation & delivery status.
            </Text>
            <TouchableOpacity 
              style={styles.shopNowBtn}
              onPress={() => router.push('/(customer)/(tabs)/home')}
            >
              <Text style={styles.shopNowBtnText}>Explore Local Stores</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => {
          const shop = shops.find(s => s.id === item.shop_id);
          const statusInfo = getOrderStatusInfo(item.status);
          const shopName = shop?.name || 'Local Grocery Store';

          const isPending = item.status === 'pending';
          const isCancelled = item.status === 'cancelled';
          const isDelivered = item.status === 'delivered';

          return (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.shopMetaWrapper}>
                  <View style={styles.shopIconCircle}>
                    <Ionicons name="storefront" size={16} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shopName} numberOfLines={1}>
                      {shopName}
                    </Text>
                    <Text style={styles.orderDate}>
                      Order #{item.id.slice(-6)} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '18', borderColor: statusInfo.color + '40' }]}>
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.badge}
                  </Text>
                </View>
              </View>

              <View style={[styles.statusNoticeBox, { backgroundColor: item.status === 'pending' ? '#FEF3C7' : item.status === 'accepted' ? '#ECFDF5' : item.status === 'cancelled' ? '#FEE2E2' : '#F1F5F9' }]}>
                <Ionicons 
                  name={item.status === 'pending' ? 'time-outline' : item.status === 'accepted' ? 'checkmark-circle-outline' : item.status === 'cancelled' ? 'close-circle-outline' : 'information-circle-outline'} 
                  size={15} 
                  color={statusInfo.color} 
                />
                <Text style={[styles.statusNoticeText, { color: statusInfo.color }]}>
                  {item.status === 'pending' && 'Order is processing. Waiting for the shopkeeper to accept.'}
                  {item.status === 'accepted' && 'Shopkeeper accepted your order! Packing items now.'}
                  {item.status === 'preparing' && 'Groceries are being packed fresh at the store.'}
                  {item.status === 'ready' && 'Order is packed & ready for pickup / delivery.'}
                  {item.status === 'out_for_delivery' && 'Delivery partner is on the way to your address!'}
                  {item.status === 'delivered' && 'Order delivered successfully to your doorstep.'}
                  {item.status === 'cancelled' && 'This order was cancelled.'}
                </Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.itemsSection}>
                <Text style={styles.itemsSectionHeading}>ITEMS IN THIS ORDER ({item.items?.length || 0}):</Text>
                {item.items && item.items.length > 0 ? (
                  item.items.map((prod, idx) => (
                    <View key={prod.id || idx} style={styles.itemRow}>
                      <Image
                        source={{ uri: prod.product_image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80' }}
                        style={styles.itemThumb}
                      />
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemTitle} numberOfLines={1}>{prod.product_name}</Text>
                        <Text style={styles.itemQty}>{prod.quantity} × {formatPrice(prod.product_price)}</Text>
                      </View>
                      <Text style={styles.itemTotalAmount}>{formatPrice(prod.total || prod.product_price * prod.quantity)}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.itemTitle}>Grocery items</Text>
                )}
              </View>

              <View style={styles.priceBreakdownBox}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Subtotal</Text>
                  <Text style={styles.priceVal}>{formatPrice(item.subtotal)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Delivery Fee</Text>
                  <Text style={styles.priceVal}>{item.delivery_fee === 0 ? 'FREE' : formatPrice(item.delivery_fee)}</Text>
                </View>
                <View style={[styles.priceRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#E2E8F0' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.totalPriceLabel}>Total Amount</Text>
                    <View style={{ backgroundColor: getPaymentMethodInfo(item.payment_method).color + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: getPaymentMethodInfo(item.payment_method).color }}>
                        {getPaymentMethodInfo(item.payment_method).badge}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.totalPriceVal}>{formatPrice(item.total)}</Text>
                </View>
              </View>

              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color="#64748B" />
                <Text style={styles.addressText} numberOfLines={1}>
                  {item.delivery_address || 'Banjara Hills, Hyderabad'}
                </Text>
              </View>

              {/* Cancel Action Button */}
              {!isCancelled && !isDelivered && (
                <View style={styles.cardActionsRow}>
                  {isPending ? (
                    <TouchableOpacity 
                      style={styles.cancelBtn}
                      onPress={() => handleCancelOrder(item, shopName)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                      <Text style={styles.cancelBtnText}>Cancel Order</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.cancelBtnDisabled}>
                      <Ionicons name="lock-closed" size={14} color="#94A3B8" />
                      <Text style={styles.cancelBtnDisabledText}>Cannot Cancel (Accepted by Store)</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
  },
  shopNowBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shopNowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  shopMetaWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shopIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 10,
  },
  statusNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  itemsSection: {
    marginBottom: 10,
  },
  itemsSectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  itemThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemQty: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemTotalAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  priceBreakdownBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  priceLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  priceVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  totalPriceLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalPriceVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  cardActionsRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelBtnDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  cancelBtnDisabledText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
});
