import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice, openGoogleMapsDirections, openPhoneCall } from '../../src/lib/utils';
import { Order } from '../../src/types';

export default function ActiveDeliveriesScreen() {
  const router = useRouter();
  const { orders, shops, pickupDelivery, completeDelivery } = useShopStore();
  const { user } = useAuthStore();

  const activeOrders = orders.filter(
    (o) =>
      o.status === 'delivery_accepted' ||
      o.status === 'picked_up' ||
      o.status === 'out_for_delivery'
  );

  const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean>>({});
  const [selectedQrOrder, setSelectedQrOrder] = useState<Order | null>(null);
  const [cashTendered, setCashTendered] = useState<string>('');

  const toggleItemVerify = (itemId: string) => {
    setVerifiedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handlePickupFromStore = (order: Order, shopName: string) => {
    pickupDelivery(order.id);
  };

  const handleCompleteDelivery = (order: Order) => {
    completeDelivery(order.id);
    router.push('/(tabs)/history');
  };

  if (activeOrders.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/deliveries')} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Active Delivery</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="bicycle-outline" size={60} color="#0284C7" />
          </View>
          <Text style={styles.emptyTitle}>No Active Delivery Right Now</Text>
          <Text style={styles.emptySubtitle}>
            Accept an order from the available pickups list to begin delivering fresh groceries.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push('/(tabs)/deliveries')}
          >
            <Ionicons name="cube-outline" size={18} color="#FFFFFF" />
            <Text style={styles.browseBtnText}>Check Available Pickups</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Task ({activeOrders.length})</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeOrders.map((order) => {
          const shop = shops.find((s) => s.id === order.shop_id);
          const shopName = shop?.name || 'Local Grocery Store';
          const isPickedUp = order.status === 'picked_up' || order.status === 'out_for_delivery';

          return (
            <View key={order.id} style={styles.activeCard}>
              {/* Progress Steps Header */}
              <View style={styles.progressContainer}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepCircle, styles.stepActive]}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={styles.stepText}>Assigned</Text>
                </View>
                <View style={[styles.stepBar, isPickedUp && styles.stepBarActive]} />
                <View style={styles.stepItem}>
                  <View style={[styles.stepCircle, isPickedUp ? styles.stepActive : styles.stepPending]}>
                    {isPickedUp ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.stepNumber}>2</Text>
                    )}
                  </View>
                  <Text style={styles.stepText}>Picked Up</Text>
                </View>
                <View style={styles.stepBar} />
                <View style={styles.stepItem}>
                  <View style={[styles.stepCircle, styles.stepPending]}>
                    <Text style={styles.stepNumber}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Delivered</Text>
                </View>
              </View>

              {/* Order ID & Earnings Badge */}
              <View style={styles.orderMetaRow}>
                <Text style={styles.orderIdText}>Order #{order.id.slice(-6)}</Text>
                <View style={styles.earningBadge}>
                  <Text style={styles.earningBadgeText}>Payout: ₹40</Text>
                </View>
              </View>

              {/* STEP 1: Pickup Info */}
              <View style={[styles.locationCard, !isPickedUp && styles.activeLocationBorder]}>
                <View style={styles.locationHeaderRow}>
                  <View style={styles.locationTag}>
                    <Ionicons name="storefront" size={14} color="#059669" />
                    <Text style={styles.locationTagText}>STEP 1: PICKUP STORE</Text>
                  </View>
                  {!isPickedUp ? (
                    <View style={styles.currentPill}>
                      <Text style={styles.currentPillText}>HEAD HERE NOW</Text>
                    </View>
                  ) : (
                    <View style={styles.donePill}>
                      <Text style={styles.donePillText}>✓ PICKED UP</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.shopNameText}>{shopName}</Text>
                <Text style={styles.shopAddressText}>{shop?.address || 'Store Address'}</Text>
                
                {/* Navigation and Call Actions for Shop */}
                <View style={styles.locationActionButtonsRow}>
                  <TouchableOpacity 
                    style={styles.navGoogleMapsBtn}
                    onPress={() => openGoogleMapsDirections(shop?.latitude, shop?.longitude, shop?.address, shopName)}
                  >
                    <Ionicons name="navigate-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.navGoogleMapsBtnText}>Navigate to Store</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.callSmallBtn}
                    onPress={() => openPhoneCall(shop?.phone || '+91 98480 00000', shopName)}
                  >
                    <Ionicons name="call" size={16} color="#059669" />
                    <Text style={styles.callSmallBtnText}>Call Shop</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* STEP 2: Delivery Info */}
              <View style={[styles.locationCard, isPickedUp && styles.activeLocationBorder]}>
                <View style={styles.locationHeaderRow}>
                  <View style={[styles.locationTag, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="location" size={14} color="#DC2626" />
                    <Text style={[styles.locationTagText, { color: '#DC2626' }]}>STEP 2: DROP ADDRESS</Text>
                  </View>
                  {isPickedUp && (
                    <View style={styles.currentPill}>
                      <Text style={styles.currentPillText}>DELIVER HERE NOW</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.customerNameText}>
                  👤 {order.customer_name || 'Customer'}
                </Text>
                <Text style={styles.shopAddressText}>{order.delivery_address || 'Delivery Address'}</Text>
                
                {/* Navigation and Call Actions for Customer */}
                <View style={styles.locationActionButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.navGoogleMapsBtn, { backgroundColor: '#0284C7' }]}
                    onPress={() => openGoogleMapsDirections(order.delivery_lat, order.delivery_lng, order.delivery_address, order.customer_name)}
                  >
                    <Ionicons name="navigate-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.navGoogleMapsBtnText}>Navigate to Customer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.callSmallBtn, { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF' }]}
                    onPress={() => openPhoneCall(order.customer_phone || '+91 98480 12345', order.customer_name || 'Customer')}
                  >
                    <Ionicons name="call" size={16} color="#0284C7" />
                    <Text style={[styles.callSmallBtnText, { color: '#0284C7' }]}>Call Customer</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Items Verification Checklist */}
              <View style={styles.itemsCard}>
                <Text style={styles.itemsCardTitle}>
                  Items to Verify ({order.items?.length || 1}):
                </Text>
                {order.items?.map((prod, idx) => {
                  const key = prod.id || `${order.id}-${idx}`;
                  const isChecked = !!verifiedItems[key];

                  return (
                    <TouchableOpacity
                      key={key}
                      style={styles.itemCheckRow}
                      onPress={() => toggleItemVerify(key)}
                    >
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isChecked ? '#0284C7' : '#94A3B8'}
                      />
                      <Text style={[styles.itemCheckText, isChecked && styles.itemCheckTextDone]}>
                        {prod.quantity}x {prod.product_name}
                      </Text>
                      <Text style={styles.itemPriceText}>{formatPrice(prod.product_price * prod.quantity)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Dynamic Collect Payment Box */}
              {order.payment_status === 'paid' || order.payment_method === 'online' ? (
                <View style={[styles.paymentBox, styles.prepaidBox]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="shield-checkmark" size={18} color="#059669" />
                    <Text style={[styles.paymentLabel, { color: '#059669', fontWeight: '800' }]}>
                      100% PREPAID ONLINE
                    </Text>
                  </View>
                  <Text style={styles.prepaidSubtext}>
                    Customer paid {formatPrice(order.total)} online {order.payment_id ? `(Ref: #${order.payment_id.slice(-6)})` : ''}.
                  </Text>
                  <View style={styles.zeroCollectBanner}>
                    <Ionicons name="checkmark-circle" size={14} color="#065F46" />
                    <Text style={styles.zeroCollectText}>COLLECT ₹0 FROM CUSTOMER (ALREADY PAID)</Text>
                  </View>
                </View>
              ) : order.payment_method === 'upi_on_delivery' ? (
                <View style={[styles.paymentBox, styles.upiDeliveryBox]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="qr-code" size={18} color="#0284C7" />
                      <Text style={[styles.paymentLabel, { color: '#0284C7', fontWeight: '800' }]}>
                        UPI ON DELIVERY
                      </Text>
                    </View>
                    <Text style={[styles.paymentTotal, { color: '#0284C7' }]}>{formatPrice(order.total)}</Text>
                  </View>
                  <Text style={styles.upiCollectSubtext}>
                    Customer will scan dynamic QR at doorstep using GPay / PhonePe / Paytm / BHIM:
                  </Text>
                  <TouchableOpacity
                    style={styles.openQrBtn}
                    onPress={() => setSelectedQrOrder(order)}
                  >
                    <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.openQrBtnText}>📱 Show Customer Dynamic UPI QR</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.paymentBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="cash-outline" size={18} color="#D97706" />
                      <Text style={styles.paymentLabel}>CASH ON DELIVERY (COD)</Text>
                    </View>
                    <Text style={styles.paymentTotal}>{formatPrice(order.total)}</Text>
                  </View>
                  <Text style={styles.cashSubtext}>Collect exact physical cash from customer</Text>
                </View>
              )}

              {/* Main Action Button */}
              {!isPickedUp ? (
                <TouchableOpacity
                  style={styles.pickupActionBtn}
                  onPress={() => handlePickupFromStore(order, shopName)}
                >
                  <Ionicons name="cube" size={20} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Confirm Pickup & Start Delivery</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.deliverActionBtn, (order.payment_status === 'paid' || order.payment_method === 'online') && { backgroundColor: '#059669' }]}
                  onPress={() => handleCompleteDelivery(order)}
                >
                  <Ionicons name="checkmark-done-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>
                    {order.payment_status === 'paid' || order.payment_method === 'online'
                      ? `Confirm Delivery (Prepaid: ₹0)`
                      : `Confirm Delivery & Settle ${formatPrice(order.total)}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* DYNAMIC UPI QR POPUP MODAL FOR DELIVERY GUY */}
      <Modal
        visible={!!selectedQrOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedQrOrder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="qr-code" size={20} color="#059669" />
                <Text style={styles.qrHeaderTitle}>Customer UPI QR Code</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedQrOrder(null)} style={styles.qrCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.qrStoreName}>{selectedQrOrder?.customer_name || 'Customer'} • Order #{selectedQrOrder?.id?.slice(-6)}</Text>
            <View style={styles.qrAmountContainer}>
              <Text style={styles.qrAmountLabel}>Collect Amount:</Text>
              <Text style={styles.qrAmountValue}>{formatPrice(selectedQrOrder?.total || 0)}</Text>
            </View>
            
            {/* Generated Dynamic QR Code */}
            <View style={styles.qrImageWrapper}>
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                    `upi://pay?pa=localmart.merchant@okhdfcbank&pn=LocalMart&am=${selectedQrOrder?.total || 0}&cu=INR&tn=Order_${selectedQrOrder?.id?.slice(-6)}`
                  )}`
                }}
                style={styles.qrImage}
              />
              <View style={styles.upiAppsRibbon}>
                <Text style={styles.upiAppBadge}>GPay</Text>
                <Text style={styles.upiAppBadge}>PhonePe</Text>
                <Text style={styles.upiAppBadge}>Paytm</Text>
                <Text style={styles.upiAppBadge}>BHIM</Text>
              </View>
            </View>

            <Text style={styles.qrInstruction}>
              Ask customer to open Google Pay, PhonePe, or Paytm and scan this QR code.
            </Text>

            <TouchableOpacity
              style={styles.confirmUpiReceivedBtn}
              onPress={() => {
                if (selectedQrOrder) {
                  Alert.alert('Payment Received', `₹${selectedQrOrder.total} verified via UPI.`);
                  setSelectedQrOrder(null);
                }
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.confirmUpiReceivedText}>
                Confirm Received {formatPrice(selectedQrOrder?.total || 0)}
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
    backgroundColor: '#F0F9FF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0F2FE',
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
    lineHeight: 18,
    marginBottom: 20,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  activeCard: {
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
    gap: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepActive: {
    backgroundColor: '#0284C7',
  },
  stepPending: {
    backgroundColor: '#E2E8F0',
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  stepText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  stepBar: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    marginBottom: 14,
  },
  stepBarActive: {
    backgroundColor: '#0284C7',
  },
  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  earningBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  earningBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },
  locationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  activeLocationBorder: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  locationTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  currentPill: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  donePill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  donePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  shopNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  customerNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  shopAddressText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  contactRow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 4,
  },
  locationActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  navGoogleMapsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navGoogleMapsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  callSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  callSmallBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  itemsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemsCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  itemCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  itemCheckText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  itemCheckTextDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  itemPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  paymentBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  paymentValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  paymentTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#B45309',
  },
  pickupActionBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deliverActionBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // Dynamic Payment Styles
  prepaidBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  prepaidSubtext: {
    fontSize: 12,
    color: '#065F46',
    marginTop: 4,
  },
  zeroCollectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  zeroCollectText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  upiDeliveryBox: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  upiCollectSubtext: {
    fontSize: 12,
    color: '#0369A1',
    marginTop: 4,
    marginBottom: 8,
  },
  openQrBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  openQrBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cashSubtext: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
  },

  // QR Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    elevation: 8,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  qrHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  qrCloseBtn: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  qrStoreName: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  qrAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  qrAmountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  qrAmountValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  qrImageWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    elevation: 2,
    marginBottom: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  upiAppsRibbon: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  upiAppBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qrInstruction: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  confirmUpiReceivedBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
  },
  confirmUpiReceivedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
