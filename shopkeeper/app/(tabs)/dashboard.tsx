import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice, getOrderStatusInfo } from '../../src/lib/utils';

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
  const acceptedOrders = shopOrders.filter(o => o.status === 'accepted');
  const revenue = shopOrders
    .filter(o => o.status === 'delivered')
    .reduce((acc, o) => acc + o.total, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Active Shop Selector / Title */}
      <View style={styles.welcomeSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {/* Top Left: Back Arrow */}
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

          {/* Top Right: Logout Button */}
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

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{shopOrders.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#D97706' }]}>{pendingOrders.length}</Text>
          <Text style={[styles.statLabel, pendingOrders.length > 0 && { color: '#D97706', fontWeight: '700' }]}>
            Pending
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{acceptedOrders.length}</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{shopProducts.length}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
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
          <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Live Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Orders Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Store Orders ({shopOrders.length})</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/orders' as any)}>
          <Text style={styles.seeAllText}>View All</Text>
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
          shopOrders.slice(0, 5).map(order => {
            const statusInfo = getOrderStatusInfo(order.status);
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
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
                  <Text style={styles.totalAmount}>{formatPrice(order.total)}</Text>
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
              </View>
            );
          })
        )}
      </View>

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
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  storeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  shopPickerWrapper: {
    marginVertical: 4,
  },
  shopPickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  shopChoicePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  shopChoicePillActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  shopChoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  shopChoiceTextActive: {
    color: '#FFFFFF',
  },
  shopName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  shopAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  quickActionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  actionBtnAddProduct: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnManage: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  actionBtnSwitch: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  ordersList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  emptyOrdersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyOrdersTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptyOrdersSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  customerAddress: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  itemCount: {
    fontSize: 12,
    color: '#64748B',
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  rejectButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 12,
  },
  orderTimestamp: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemsSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    gap: 3,
  },
  orderItemLine: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerLogoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
});
