import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice, getOrderStatusInfo, openGoogleMapsDirections, openPhoneCall } from '../../src/lib/utils';
import { Order } from '../../src/types';

export default function ShopkeeperDashboardScreen() {
  const router = useRouter();
  const { 
    shops, 
    products, 
    orders, 
    activeShopkeeperShopId, 
    setActiveShopkeeperShopId,
    updateOrderStatus 
  } = useShopStore();
  const { user, logout } = useAuthStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleLogout = () => {
    const doLogout = () => {
      logout();
      router.replace('/(auth)/login');
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Are you sure you want to log out of the Shopkeeper portal?')) {
        doLogout();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out of the Shopkeeper portal?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      useShopStore.getState().initialize();
      useAuthStore.getState().initialize();
    }, [])
  );

  // Strictly filter shops owned by this shopkeeper
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
  const shopOrders = activeShop ? orders.filter(o => o.shop_id === activeShop.id) : [];

  const pendingOrders = shopOrders.filter(o => o.status === 'pending');
  const acceptedOrders = shopOrders.filter(o => o.status === 'accepted' || o.status === 'preparing');
  const deliveredOrders = shopOrders.filter(o => o.status === 'delivered');
  const activeOrders = shopOrders.filter(o => 
    ['pending', 'accepted', 'preparing', 'ready', 'delivery_accepted', 'picked_up', 'out_for_delivery'].includes(o.status)
  );

  const totalEarnedRevenue = deliveredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const todayDelivered = deliveredOrders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todayDelivered.reduce((acc, o) => acc + (o.total || 0), 0);
  const pipelineAmount = activeOrders.reduce((acc, o) => acc + (o.total || 0), 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Active Shop Selector / Title */}
      <View style={styles.welcomeSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <TouchableOpacity 
            style={styles.headerBackBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/dashboard');
              }
            }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D97706', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <Ionicons name="storefront" size={15} color="#FFFFFF" />
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 }}>SHOPKEEPER PORTAL</Text>
          </View>

          <TouchableOpacity 
            style={styles.headerLogoutBtn}
            onPress={handleLogout}
            accessibilityLabel="Log Out"
          >
            <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            <Text style={styles.headerLogoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {myShops.length > 1 ? (
          <View style={styles.shopPickerWrapper}>
            <Text style={styles.shopPickerLabel}>My Stores:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 8, marginTop: 4 }}>
              {myShops.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.shopChoicePill, activeShop?.id === s.id && styles.shopChoicePillActive]}
                  onPress={() => setActiveShopkeeperShopId(s.id)}
                >
                  <Text style={[styles.shopChoiceText, activeShop?.id === s.id && styles.shopChoiceTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <Text style={styles.shopName}>{activeShop?.name || 'My Local Store'}</Text>
        )}

        <Text style={styles.shopAddress}>📍 {activeShop?.address || 'Set your store location'}</Text>
      </View>

      {/* 💰 PROMINENT DASHBOARD TOTAL EARNINGS BANNER */}
      <TouchableOpacity
        style={styles.revenueBannerCard}
        activeOpacity={0.88}
        onPress={() => router.push('/(tabs)/orders' as any)}
      >
        <View style={styles.revenueBannerHeader}>
          <View style={styles.revenueBadgeRow}>
            <View style={styles.rupeeCircle}>
              <Text style={styles.rupeeIcon}>₹</Text>
            </View>
            <View>
              <Text style={styles.revenueBannerTitle}>TOTAL STORE EARNINGS</Text>
              <Text style={styles.revenueBannerAmount}>₹{totalEarnedRevenue.toFixed(0)}</Text>
            </View>
          </View>
          <View style={styles.orderDetailBadge}>
            <Text style={styles.orderDetailBadgeText}>Orders & Bill ➔</Text>
          </View>
        </View>

        <View style={styles.revenueSubRow}>
          <View style={styles.revenueSubItem}>
            <Text style={styles.revenueSubLabel}>Today's Earnings</Text>
            <Text style={styles.revenueSubValue}>₹{todayRevenue.toFixed(0)}</Text>
            <Text style={styles.revenueSubSub}>{todayDelivered.length} delivered</Text>
          </View>
          <View style={styles.revenueSubDivider} />
          <View style={styles.revenueSubItem}>
            <Text style={styles.revenueSubLabel}>Total Delivered</Text>
            <Text style={styles.revenueSubValue}>{deliveredOrders.length} Orders</Text>
            <Text style={styles.revenueSubSub}>Fulfilled</Text>
          </View>
          <View style={styles.revenueSubDivider} />
          <View style={styles.revenueSubItem}>
            <Text style={styles.revenueSubLabel}>In Pipeline</Text>
            <Text style={[styles.revenueSubValue, { color: '#FCD34D' }]}>₹{pipelineAmount.toFixed(0)}</Text>
            <Text style={styles.revenueSubSub}>{activeOrders.length} active</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 📊 UPDATED DASHBOARD STATS GRID (INCLUDES TOTAL AMOUNT EARNED) */}
      <View style={styles.statsContainer}>
        {/* Stat 1: Total Amount Earned */}
        <TouchableOpacity 
          style={[styles.statCard, styles.statCardEarned]}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/orders' as any)}
        >
          <View style={styles.statIconBadge}>
            <Ionicons name="cash" size={14} color="#059669" />
          </View>
          <Text style={[styles.statValue, { color: '#059669' }]}>₹{totalEarnedRevenue.toFixed(0)}</Text>
          <Text style={[styles.statLabel, { color: '#047857', fontWeight: '800' }]}>Total Earned</Text>
        </TouchableOpacity>

        {/* Stat 2: Total Orders */}
        <TouchableOpacity 
          style={styles.statCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/orders' as any)}
        >
          <View style={[styles.statIconBadge, { backgroundColor: '#F1F5F9' }]}>
            <Ionicons name="receipt" size={14} color="#475569" />
          </View>
          <Text style={styles.statValue}>{shopOrders.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </TouchableOpacity>

        {/* Stat 3: Pending Orders */}
        <TouchableOpacity 
          style={styles.statCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/orders' as any)}
        >
          <View style={[styles.statIconBadge, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time" size={14} color="#D97706" />
          </View>
          <Text style={[styles.statValue, { color: '#D97706' }]}>{pendingOrders.length}</Text>
          <Text style={[styles.statLabel, pendingOrders.length > 0 && { color: '#D97706', fontWeight: '800' }]}>
            Pending
          </Text>
        </TouchableOpacity>

        {/* Stat 4: Accepted & Preparing */}
        <TouchableOpacity 
          style={styles.statCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/orders' as any)}
        >
          <View style={[styles.statIconBadge, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="flash" size={14} color="#2563EB" />
          </View>
          <Text style={[styles.statValue, { color: '#2563EB' }]}>{acceptedOrders.length}</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </TouchableOpacity>

        {/* Stat 5: Delivered Orders */}
        <TouchableOpacity 
          style={styles.statCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/orders' as any)}
        >
          <View style={[styles.statIconBadge, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="checkmark-done" size={14} color="#16A34A" />
          </View>
          <Text style={[styles.statValue, { color: '#16A34A' }]}>{deliveredOrders.length}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </TouchableOpacity>

        {/* Stat 6: Inventory Items */}
        <TouchableOpacity 
          style={styles.statCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/products' as any)}
        >
          <View style={[styles.statIconBadge, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="cube" size={14} color="#9333EA" />
          </View>
          <Text style={styles.statValue}>{shopProducts.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Bar */}
      <View style={styles.quickActionsBar}>
        <TouchableOpacity 
          style={styles.actionBtnAddProduct}
          onPress={() => router.push('/add-product' as any)}
        >
          <Ionicons name="add-circle" size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Add Item</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtnManage}
          onPress={() => router.push('/(tabs)/products' as any)}
        >
          <Ionicons name="cube-outline" size={18} color="#059669" />
          <Text style={[styles.actionBtnText, { color: '#059669' }]}>Manage Stock</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtnSwitch}
          onPress={() => router.push('/(tabs)/orders' as any)}
        >
          <Ionicons name="receipt-outline" size={18} color="#3B82F6" />
          <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Live Orders ({shopOrders.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Orders Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Orders ({shopOrders.length})</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/orders' as any)}>
          <Text style={styles.seeAllText}>View All Orders ➔</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ordersList}>
        {shopOrders.length === 0 ? (
          <View style={styles.emptyOrdersCard}>
            <Ionicons name="receipt-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyOrdersTitle}>No orders received yet</Text>
            <Text style={styles.emptyOrdersSubtitle}>
              When a customer places an order from {activeShop?.name || 'your shop'}, it will appear here in real time!
            </Text>
          </View>
        ) : (
          shopOrders.slice(0, 6).map(order => {
            const statusInfo = getOrderStatusInfo(order.status);
            return (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderCard}
                activeOpacity={0.9}
                onPress={() => setSelectedOrder(order)}
              >
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.orderTimestamp}>
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '18', borderColor: statusInfo.color + '40', borderWidth: 1 }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.badge}</Text>
                  </View>
                </View>

                {/* Items Summary */}
                <View style={styles.itemsSummaryBox}>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((it, idx) => (
                      <Text key={it.id || idx} style={styles.orderItemLine} numberOfLines={1}>
                        • {it.product_name} ({it.quantity}x - {formatPrice(it.product_price)})
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.orderItemLine}>• Grocery order</Text>
                  )}
                </View>

                <Text style={styles.customerAddress} numberOfLines={1}>
                  📍 {order.delivery_address || 'Banjara Hills, Hyderabad'}
                </Text>

                <View style={styles.orderDetails}>
                  <Text style={styles.itemCount}>{order.items?.length || 1} items</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.totalAmount}>{formatPrice(order.total)}</Text>
                    <Text style={styles.clickDetailsHint}>Tap for details ➔</Text>
                  </View>
                </View>

                {order.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.acceptButton}
                      onPress={() => {
                        updateOrderStatus(order.id, 'accepted');
                        Alert.alert('Order Accepted', 'Customer notified!');
                      }}
                    >
                      <Text style={styles.buttonText}>Accept Order</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.rejectButton}
                      onPress={() => {
                        updateOrderStatus(order.id, 'cancelled');
                        Alert.alert('Order Rejected', 'Order marked as cancelled.');
                      }}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {order.status === 'accepted' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.acceptButton, { backgroundColor: '#8B5CF6' }]}
                      onPress={() => {
                        updateOrderStatus(order.id, 'preparing');
                        Alert.alert('Status Updated', 'Order marked as preparing.');
                      }}
                    >
                      <Text style={styles.buttonText}>Mark Preparing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.rejectButton}
                      onPress={() => {
                        updateOrderStatus(order.id, 'cancelled');
                        Alert.alert('Order Cancelled', 'Order cancelled.');
                      }}
                    >
                      <Text style={styles.rejectButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* 🧾 QUICK ORDER DETAILS MODAL FROM DASHBOARD */}
      <Modal
        visible={!!selectedOrder}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalCard}>
            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  <View>
                    <Text style={styles.detailTitle}>Order #{selectedOrder.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.detailTime}>
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.detailCloseBtn}
                    onPress={() => setSelectedOrder(null)}
                  >
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Status & Amount */}
                <View style={styles.detailPillsRow}>
                  <View style={[styles.detailStatusPill, { backgroundColor: getOrderStatusInfo(selectedOrder.status).color + '20' }]}>
                    <Text style={[styles.detailStatusText, { color: getOrderStatusInfo(selectedOrder.status).color }]}>
                      Status: {selectedOrder.status.toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.detailStatusPill, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.detailStatusText, { color: '#059669' }]}>
                      Earned: ₹{selectedOrder.total || 0}
                    </Text>
                  </View>
                </View>

                {/* Customer Details */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Customer & Delivery Info</Text>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailCustomerName}>{selectedOrder.customer_name || 'Customer'}</Text>
                    <Text style={styles.detailCustomerPhone}>{selectedOrder.customer_phone || '+91 98480 12345'}</Text>
                    <Text style={styles.detailCustomerAddress}>{selectedOrder.delivery_address || 'Banjara Hills, Hyderabad'}</Text>
                  </View>
                </View>

                {/* Items Ordered */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    Order Items ({selectedOrder.items?.length || 0})
                  </Text>
                  <View style={styles.detailBox}>
                    {selectedOrder.items && selectedOrder.items.map((prod, idx) => (
                      <View key={prod.id || idx} style={styles.detailItemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailItemName}>{prod.product_name}</Text>
                          <Text style={styles.detailItemSub}>{prod.quantity} × {formatPrice(prod.product_price)}</Text>
                        </View>
                        <Text style={styles.detailItemTotal}>
                          {formatPrice(prod.total || prod.product_price * prod.quantity)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Payment Summary */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Bill Breakdown</Text>
                  <View style={styles.detailBox}>
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Item Subtotal</Text>
                      <Text style={styles.billValue}>{formatPrice(selectedOrder.subtotal || selectedOrder.total)}</Text>
                    </View>
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Delivery Fee</Text>
                      <Text style={styles.billValue}>{formatPrice(selectedOrder.delivery_fee || 0)}</Text>
                    </View>
                    <View style={[styles.billRow, styles.billTotalRow]}>
                      <Text style={styles.billTotalLabel}>Total Order Value</Text>
                      <Text style={styles.billTotalValue}>{formatPrice(selectedOrder.total || 0)}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.detailDoneBtn}
                  onPress={() => setSelectedOrder(null)}
                >
                  <Text style={styles.detailDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  welcomeSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  headerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  headerLogoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  shopPickerWrapper: {
    marginTop: 4,
  },
  shopPickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  shopChoicePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shopChoicePillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  shopChoiceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  shopChoiceTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  shopName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  shopAddress: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },

  /* 💰 PROMINENT DASHBOARD REVENUE CARD */
  revenueBannerCard: {
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 6,
    backgroundColor: '#064E3B',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#047857',
  },
  revenueBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rupeeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rupeeIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  revenueBannerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6EE7B7',
    letterSpacing: 0.8,
  },
  revenueBannerAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  orderDetailBadge: {
    backgroundColor: '#042F2E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  orderDetailBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
  },
  revenueSubRow: {
    flexDirection: 'row',
    backgroundColor: '#022C22',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  revenueSubItem: {
    alignItems: 'center',
    flex: 1,
  },
  revenueSubDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#065F46',
  },
  revenueSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  revenueSubValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F9FAFB',
  },
  revenueSubSub: {
    fontSize: 10,
    color: '#6EE7B7',
    fontWeight: '600',
    marginTop: 1,
  },

  /* 📊 STATS GRID (6 TILES) */
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 8,
  },
  statCard: {
    width: '31.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statCardEarned: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },

  /* QUICK ACTIONS */
  quickActionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginVertical: 6,
    gap: 8,
  },
  actionBtnAddProduct: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 11,
    borderRadius: 10,
  },
  actionBtnManage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  actionBtnSwitch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* SECTION HEADER */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  /* ORDERS LIST */
  ordersList: {
    paddingHorizontal: 14,
    gap: 10,
  },
  emptyOrdersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyOrdersTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyOrdersSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderTimestamp: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemsSummaryBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginVertical: 6,
  },
  orderItemLine: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  customerAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  itemCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  clickDetailsHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },

  /* 🧾 DETAIL MODAL */
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  detailModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 450,
    maxHeight: '90%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  detailTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  detailCloseBtn: {
    padding: 4,
  },
  detailPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  detailStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailSection: {
    marginBottom: 14,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailCustomerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailCustomerPhone: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
  },
  detailCustomerAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  detailItemSub: {
    fontSize: 11,
    color: '#64748B',
  },
  detailItemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  billLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  billValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  billTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 4,
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  billTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  detailDoneBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  detailDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
