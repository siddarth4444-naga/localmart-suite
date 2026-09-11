import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice, getOrderStatusInfo, openGoogleMapsDirections, openPhoneCall } from '../../src/lib/utils';
import { OrderStatus } from '../../src/types';

const FILTER_TABS = ['All', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

export default function ShopkeeperOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const { orders, shops, activeShopkeeperShopId, setActiveShopkeeperShopId, updateOrderStatus } = useShopStore();
  const { user } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      useShopStore.getState().initialize();
      useAuthStore.getState().initialize();
    }, [])
  );

  // Strictly identify the active store for this shopkeeper
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

  // Strictly filter orders belonging to this shopkeeper's store
  const shopOrders = activeShop ? orders.filter(o => o.shop_id === activeShop.id) : [];

  const filteredOrders = activeTab === 'All' 
    ? shopOrders 
    : shopOrders.filter(order => order.status.toLowerCase() === activeTab.toLowerCase());

  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus, actionLabel?: string) => {
    updateOrderStatus(orderId, nextStatus);
  };

  return (
    <View style={styles.container}>
      {/* Top Shop Badge */}
      <View style={styles.topShopHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={18} color="#111827" />
          </TouchableOpacity>
          <View style={styles.storeBadge}>
            <Ionicons name="storefront" size={14} color="#059669" />
            <Text style={styles.storeBadgeText} numberOfLines={1}>
              {activeShop?.name || 'My Store'}
            </Text>
          </View>
        </View>
        <Text style={styles.ordersCountText}>{shopOrders.length} orders</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {FILTER_TABS.map(tab => {
            const count = tab === 'All' 
              ? shopOrders.length 
              : shopOrders.filter(o => o.status.toLowerCase() === tab.toLowerCase()).length;
            const isActive = activeTab === tab;

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isActive && styles.activeTabButton]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} orders found</Text>
            <Text style={styles.emptySubtitle}>
              When customers place orders from {activeShop?.name || 'your store'}, they will show up here instantly!
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const statusInfo = getOrderStatusInfo(item.status);

          return (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
                  <Text style={styles.timestamp}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '18', borderColor: statusInfo.color + '40' }]}>
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.badge}
                  </Text>
                </View>
              </View>

              {/* Customer & Address */}
              <View style={styles.customerInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={styles.infoRow}>
                    <Ionicons name="person" size={14} color="#64748B" />
                    <Text style={styles.customerName}>
                      {item.customer_name || `Customer #${item.customer_id.slice(-6)}`}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity 
                      style={styles.mapSmallBtn}
                      onPress={() => openGoogleMapsDirections(item.delivery_lat, item.delivery_lng, item.delivery_address, item.customer_name)}
                    >
                      <Ionicons name="navigate-circle" size={13} color="#059669" />
                      <Text style={styles.mapSmallBtnText}>Maps</Text>
                    </TouchableOpacity>
                    {item.customer_phone ? (
                      <TouchableOpacity 
                        style={styles.callTinyBtn}
                        onPress={() => openPhoneCall(item.customer_phone || '', item.customer_name || 'Customer')}
                      >
                        <Ionicons name="call" size={12} color="#0284C7" />
                        <Text style={styles.callTinyBtnText}>Call</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="location" size={14} color="#059669" />
                  <Text style={styles.customerAddress} numberOfLines={2}>
                    {item.delivery_address || 'Banjara Hills, Hyderabad'}
                  </Text>
                </View>
              </View>

              {/* Items List */}
              <View style={styles.itemsPreview}>
                <Text style={styles.itemsHeading}>ORDERED ITEMS ({item.items?.length || 0}):</Text>
                {item.items && item.items.length > 0 ? (
                  item.items.map((prod, idx) => (
                    <View key={prod.id || idx} style={styles.itemRow}>
                      <Text style={styles.itemName} numberOfLines={1}>• {prod.product_name}</Text>
                      <Text style={styles.itemQtyPrice}>{prod.quantity} × {formatPrice(prod.product_price)}</Text>
                      <Text style={styles.itemTotal}>{formatPrice(prod.total || prod.product_price * prod.quantity)}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.itemText}>Grocery products</Text>
                )}
              </View>

              {/* Bill Details */}
              <View style={styles.footer}>
                <View>
                  {item.payment_status === 'paid' || item.payment_method === 'online' ? (
                    <Text style={[styles.paymentMethodText, { color: '#059669', fontWeight: '800' }]}>
                      💳 Prepaid Online {item.payment_id ? `(#${item.payment_id.slice(-6)})` : ''}
                    </Text>
                  ) : item.payment_method === 'upi_on_delivery' ? (
                    <Text style={[styles.paymentMethodText, { color: '#0284C7', fontWeight: '700' }]}>
                      📱 UPI on Delivery (Scan QR)
                    </Text>
                  ) : (
                    <Text style={styles.paymentMethodText}>💵 Cash on Delivery (COD)</Text>
                  )}
                  <Text style={styles.totalAmount}>{formatPrice(item.total)}</Text>
                </View>

                {/* Status Action Buttons */}
                <View style={styles.actionButtonsWrapper}>
                  {item.status === 'pending' && (
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity 
                        style={styles.acceptButton}
                        onPress={() => handleUpdateStatus(item.id, 'accepted', 'Accept Order')}
                      >
                        <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                        <Text style={styles.acceptButtonText}>Accept Order</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.rejectButton}
                        onPress={() => handleUpdateStatus(item.id, 'cancelled', 'Reject Order')}
                      >
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {item.status === 'accepted' && (
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity 
                        style={[styles.acceptButton, { backgroundColor: '#8B5CF6' }]}
                        onPress={() => handleUpdateStatus(item.id, 'preparing', 'Start Preparing')}
                      >
                        <Ionicons name="fast-food-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.acceptButtonText}>Mark Preparing</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.rejectButton}
                        onPress={() => handleUpdateStatus(item.id, 'cancelled', 'Cancel Order')}
                      >
                        <Text style={styles.rejectButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {item.status === 'preparing' && (
                    <TouchableOpacity 
                      style={[styles.acceptButton, { backgroundColor: '#06B6D4' }]}
                      onPress={() => handleUpdateStatus(item.id, 'ready', 'Mark Ready')}
                    >
                      <Ionicons name="cube-outline" size={14} color="#FFFFFF" />
                      <Text style={styles.acceptButtonText}>Mark Ready for Pickup</Text>
                    </TouchableOpacity>
                  )}

                  {item.status === 'ready' && (
                    <View style={{ gap: 8 }}>
                      <View style={styles.deliveryStatusBadge}>
                        <Ionicons name="time-outline" size={14} color="#0284C7" />
                        <Text style={styles.deliveryStatusBadgeText}>
                          Ready for Pickup • Waiting for Delivery Guy to Accept
                        </Text>
                      </View>
                    </View>
                  )}

                  {item.status === 'delivery_accepted' && (
                    <View style={styles.deliveryStatusBadge}>
                      <Ionicons name="bicycle" size={16} color="#0284C7" />
                      <Text style={styles.deliveryStatusBadgeText}>
                        🛵 {item.delivery_partner_name || 'Delivery Guy'} accepted! Arriving at shop for pickup
                      </Text>
                    </View>
                  )}

                  {(item.status === 'picked_up' || item.status === 'out_for_delivery') && (
                    <View style={[styles.deliveryStatusBadge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                      <Ionicons name="navigate" size={16} color="#2563EB" />
                      <Text style={[styles.deliveryStatusBadgeText, { color: '#1E40AF' }]}>
                        🚴 Picked up by {item.delivery_partner_name || 'Delivery Partner'} • On way to customer
                      </Text>
                    </View>
                  )}

                  {item.status === 'delivered' && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.completedBadgeText}>Completed & Delivered</Text>
                    </View>
                  )}

                  {item.status === 'cancelled' && (
                    <View style={styles.cancelledBadge}>
                      <Ionicons name="close-circle" size={14} color="#EF4444" />
                      <Text style={styles.cancelledBadgeText}>Cancelled</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topShopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerBackBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    maxWidth: '65%',
  },
  storeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  ordersCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsScroll: {
    paddingHorizontal: 12,
    gap: 6,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeTabButton: {
    backgroundColor: '#10B981',
  },
  tabText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 12,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    gap: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontWeight: '900',
    fontSize: 15,
    color: '#0F172A',
  },
  timestamp: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontWeight: '800',
    fontSize: 11,
  },
  customerInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  customerAddress: {
    color: '#475569',
    fontSize: 11,
    flex: 1,
  },
  mapSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mapSmallBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  callTinyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  callTinyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  itemsPreview: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 8,
    marginBottom: 10,
  },
  itemsHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  itemQtyPrice: {
    fontSize: 11,
    color: '#64748B',
    marginHorizontal: 8,
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemText: {
    color: '#64748B',
    fontSize: 12,
  },
  footer: {
    flexDirection: 'column',
    gap: 10,
  },
  paymentMethodText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  totalAmount: {
    fontWeight: '900',
    fontSize: 17,
    color: '#0F172A',
  },
  actionButtonsWrapper: {
    width: '100%',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  rejectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  deliveryStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deliveryStatusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    textAlign: 'center',
    flexShrink: 1,
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelledBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },
});
