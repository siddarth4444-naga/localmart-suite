import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Platform,
  Linking 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice, getOrderStatusInfo, openGoogleMapsDirections, openPhoneCall } from '../../src/lib/utils';
import { Order } from '../../src/types';

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, shops, updateOrderStatus } = useShopStore();
  const { user } = useAuthStore();
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});

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

  const toggleExpand = (orderId: string) => {
    setExpandedOrderIds(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleCall = (phoneNumber: string, name: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    if (Platform.OS === 'web') {
      window.alert(`Calling ${name}: ${phoneNumber}`);
    } else {
      Linking.openURL(`tel:${cleanNumber}`).catch(() => {
        Alert.alert('Phone Call', `Contact ${name} at ${phoneNumber}`);
      });
    }
  };

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

  // Helper to get active step index (0: Placed, 1: Packing/Preparing, 2: Out for Delivery, 3: Delivered)
  const getOrderStep = (status: string): number => {
    switch (status) {
      case 'pending': return 0;
      case 'accepted':
      case 'preparing':
      case 'ready': return 1;
      case 'delivery_accepted':
      case 'picked_up':
      case 'out_for_delivery': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} 
          style={styles.headerBackBtn}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders ({customerOrders.length})</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/home')}
          style={styles.headerShopBtn}
        >
          <Ionicons name="cart-outline" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={customerOrders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name={isGuestOrLoggedOut ? 'person-circle-outline' : 'receipt-outline'} size={60} color="#059669" />
            </View>
            <Text style={styles.emptyTitle}>
              {isGuestOrLoggedOut ? 'Sign In to View Orders' : 'No orders placed yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isGuestOrLoggedOut 
                ? 'Please log in to your account to view your past orders & live delivery progress.'
                : 'Browse neighborhood stores for fresh groceries with instant live tracking.'}
            </Text>
            <TouchableOpacity 
              style={styles.shopNowBtn}
              onPress={() => router.push(isGuestOrLoggedOut ? '/(auth)/login' : '/(tabs)/home')}
            >
              <Text style={styles.shopNowBtnText}>
                {isGuestOrLoggedOut ? 'Sign In / Register' : 'Explore Local Stores'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => {
          const shop = shops.find(s => s.id === item.shop_id);
          const statusInfo = getOrderStatusInfo(item.status);
          const shopName = shop?.name || 'Local Grocery Store';
          const shopPhone = shop?.phone || '+91 98480 12345';

          const isPending = item.status === 'pending';
          const isCancelled = item.status === 'cancelled';
          const isDelivered = item.status === 'delivered';
          const isAcceptedOrBeyond = !isPending && !isCancelled && !isDelivered;
          const currentStep = getOrderStep(item.status);
          const isExpanded = !!expandedOrderIds[item.id];

          return (
            <View style={styles.orderCard}>
              {/* Card Header */}
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

              {/* Status Message Banner */}
              <View style={[styles.statusNoticeBox, { backgroundColor: item.status === 'pending' ? '#FEF3C7' : item.status === 'accepted' || item.status === 'ready' ? '#ECFDF5' : item.status === 'cancelled' ? '#FEE2E2' : '#F0F9FF' }]}>
                <Ionicons 
                  name={item.status === 'pending' ? 'time-outline' : item.status === 'accepted' || item.status === 'ready' ? 'checkmark-circle-outline' : item.status === 'cancelled' ? 'close-circle-outline' : item.status === 'delivery_accepted' || item.status === 'out_for_delivery' ? 'bicycle-outline' : 'information-circle-outline'} 
                  size={16} 
                  color={statusInfo.color} 
                />
                <Text style={[styles.statusNoticeText, { color: statusInfo.color }]}>
                  {item.status === 'pending' && 'Order placed! Waiting for the shopkeeper to accept.'}
                  {item.status === 'accepted' && 'Store accepted your order! Packing fresh items now.'}
                  {item.status === 'preparing' && 'Items are being packed carefully by store staff.'}
                  {item.status === 'ready' && 'Order packed and ready for delivery pickup.'}
                  {item.status === 'delivery_accepted' && 'Delivery partner assigned! Heading to store.'}
                  {item.status === 'picked_up' && 'Rider picked up your order! On the way to your doorstep.'}
                  {item.status === 'out_for_delivery' && 'Rider is arriving at your doorstep shortly.'}
                  {item.status === 'delivered' && 'Order successfully delivered to your address.'}
                  {item.status === 'cancelled' && 'This order was cancelled.'}
                </Text>
              </View>

              {/* Live Multi-Stage Stepper (Zepto/Blinkit feature) */}
              {!isCancelled && (
                <View style={styles.stepperContainer}>
                  <View style={styles.stepperTrack}>
                    <View style={[styles.stepperTrackProgress, { width: `${(currentStep / 3) * 100}%` }]} />
                  </View>
                  <View style={styles.stepperNodesRow}>
                    {/* Step 1: Placed */}
                    <View style={styles.stepNodeCol}>
                      <View style={[styles.stepNodeCircle, currentStep >= 0 && styles.stepNodeCircleActive]}>
                        <Ionicons name="checkmark" size={11} color={currentStep >= 0 ? '#FFFFFF' : '#94A3B8'} />
                      </View>
                      <Text style={[styles.stepNodeLabel, currentStep >= 0 && styles.stepNodeLabelActive]}>Placed</Text>
                    </View>

                    {/* Step 2: Packing */}
                    <View style={styles.stepNodeCol}>
                      <View style={[styles.stepNodeCircle, currentStep >= 1 && styles.stepNodeCircleActive]}>
                        <Ionicons name="cube" size={11} color={currentStep >= 1 ? '#FFFFFF' : '#94A3B8'} />
                      </View>
                      <Text style={[styles.stepNodeLabel, currentStep >= 1 && styles.stepNodeLabelActive]}>Packing</Text>
                    </View>

                    {/* Step 3: On The Way */}
                    <View style={styles.stepNodeCol}>
                      <View style={[styles.stepNodeCircle, currentStep >= 2 && styles.stepNodeCircleActive]}>
                        <Ionicons name="bicycle" size={11} color={currentStep >= 2 ? '#FFFFFF' : '#94A3B8'} />
                      </View>
                      <Text style={[styles.stepNodeLabel, currentStep >= 2 && styles.stepNodeLabelActive]}>On The Way</Text>
                    </View>

                    {/* Step 4: Delivered */}
                    <View style={styles.stepNodeCol}>
                      <View style={[styles.stepNodeCircle, currentStep >= 3 && styles.stepNodeCircleActive]}>
                        <Ionicons name="home" size={11} color={currentStep >= 3 ? '#FFFFFF' : '#94A3B8'} />
                      </View>
                      <Text style={[styles.stepNodeLabel, currentStep >= 3 && styles.stepNodeLabelActive]}>Delivered</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Items Preview */}
              <View style={styles.itemsPreviewContainer}>
                {(isExpanded ? item.items : item.items.slice(0, 2)).map((it, idx) => (
                  <View key={it.id || idx} style={styles.orderItemRow}>
                    {it.product_image_url ? (
                      <Image source={{ uri: it.product_image_url }} style={styles.itemImgThumb} />
                    ) : (
                      <View style={styles.itemImgThumbPlaceholder}>
                        <Ionicons name="cube-outline" size={14} color="#059669" />
                      </View>
                    )}
                    <Text style={styles.itemText} numberOfLines={1}>
                      {it.quantity}x {it.product_name}
                    </Text>
                    <Text style={styles.itemTotalText}>{formatPrice(it.total)}</Text>
                  </View>
                ))}

                {item.items.length > 2 && (
                  <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.toggleMoreItemsBtn}>
                    <Text style={styles.toggleMoreItemsText}>
                      {isExpanded ? 'Show less' : `+ ${item.items.length - 2} more items`}
                    </Text>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#059669" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Delivery Address & Bill */}
              <View style={styles.metaRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.addressLine}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.deliveryAddressText} numberOfLines={1}>
                      {item.delivery_address || 'Banjara Hills, Hyderabad'}
                    </Text>
                  </View>
                  
                  {/* Dynamic Payment Method & Status Badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    {item.payment_status === 'paid' || item.payment_method === 'online' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#A7F3D0' }}>
                        <Ionicons name="shield-checkmark" size={12} color="#059669" />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669' }}>
                          PAID ONLINE {item.payment_id ? `• ${item.payment_id.slice(-6)}` : ''}
                        </Text>
                      </View>
                    ) : item.payment_method === 'upi_on_delivery' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E0F2FE', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#BAE6FD' }}>
                        <Ionicons name="qr-code-outline" size={12} color="#0284C7" />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284C7' }}>
                          UPI on Delivery (Scan QR)
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#FDE68A' }}>
                        <Ionicons name="cash-outline" size={12} color="#D97706" />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>
                          Cash on Delivery (COD)
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.totalAmountLabel}>Total Bill</Text>
                  <Text style={styles.totalAmountValue}>{formatPrice(item.total)}</Text>
                </View>
              </View>

              {/* Action Buttons Row: Map / Call Store / Cancel Order */}
              <View style={styles.orderActionsRow}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {/* Shop on Map */}
                  <TouchableOpacity 
                    style={styles.mapButton}
                    onPress={() => openGoogleMapsDirections(shop?.latitude, shop?.longitude, shop?.address, shopName)}
                  >
                    <Ionicons name="navigate-circle" size={13} color="#059669" />
                    <Text style={styles.mapButtonText}>Store Map</Text>
                  </TouchableOpacity>

                  {/* Call Store Button */}
                  <TouchableOpacity 
                    style={styles.callButton}
                    onPress={() => handleCall(shopPhone, shopName)}
                  >
                    <Ionicons name="call" size={13} color="#059669" />
                    <Text style={styles.callButtonText}>Call</Text>
                  </TouchableOpacity>
                </View>

                {/* Cancel Button / Locked State */}
                {isPending && (
                  <TouchableOpacity 
                    style={styles.cancelBtn}
                    onPress={() => handleCancelOrder(item, shopName)}
                  >
                    <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
                    <Text style={styles.cancelBtnText}>Cancel Order</Text>
                  </TouchableOpacity>
                )}

                {isAcceptedOrBeyond && (
                  <View style={styles.lockedCancelBox}>
                    <Ionicons name="lock-closed" size={12} color="#94A3B8" />
                    <Text style={styles.lockedCancelText}>Locked (Processing)</Text>
                  </View>
                )}

                {isDelivered && (
                  <TouchableOpacity 
                    style={styles.reorderBtn}
                    onPress={() => router.push(`/(customer)/shop/${item.shop_id}` as any)}
                  >
                    <Ionicons name="repeat" size={13} color="#059669" />
                    <Text style={styles.reorderBtnText}>Order Again</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerShopBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shopMetaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  statusNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  stepperContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperTrack: {
    height: 3,
    backgroundColor: '#E2E8F0',
    position: 'absolute',
    left: 36,
    right: 36,
    top: 22,
    borderRadius: 2,
  },
  stepperTrackProgress: {
    height: 3,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  stepperNodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepNodeCol: {
    alignItems: 'center',
    width: 64,
  },
  stepNodeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNodeCircleActive: {
    backgroundColor: '#10B981',
  },
  stepNodeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepNodeLabelActive: {
    color: '#059669',
    fontWeight: '700',
  },
  itemsPreviewContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemImgThumb: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 8,
  },
  itemImgThumbPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  itemText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    fontWeight: '500',
  },
  itemTotalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleMoreItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 6,
  },
  toggleMoreItemsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginBottom: 12,
  },
  addressLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  deliveryAddressText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  paymentInfoText: {
    fontSize: 11,
    color: '#64748B',
  },
  totalAmountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  totalAmountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  orderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  lockedCancelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  lockedCancelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 280,
  },
  shopNowBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shopNowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
