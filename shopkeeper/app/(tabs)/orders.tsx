import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice, getOrderStatusInfo, openGoogleMapsDirections, openPhoneCall } from '../../src/lib/utils';
import { Order, OrderStatus } from '../../src/types';

const FILTER_TABS = ['All', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

export default function ShopkeeperOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [earningsTimeFilter, setEarningsTimeFilter] = useState<'all' | 'today' | 'week' | 'active'>('all');
  const [earningsSearchQuery, setEarningsSearchQuery] = useState('');

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

  // Earnings calculations
  const deliveredOrders = shopOrders.filter(o => o.status === 'delivered');
  const totalEarned = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const todayDeliveredOrders = deliveredOrders.filter(o => {
    const orderDate = new Date(o.created_at).toDateString();
    const todayDate = new Date().toDateString();
    return orderDate === todayDate;
  });
  const todayEarned = todayDeliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const activePipelineOrders = shopOrders.filter(o =>
    ['pending', 'accepted', 'preparing', 'ready', 'delivery_accepted', 'picked_up', 'out_for_delivery'].includes(o.status)
  );
  const activePipelineAmount = activePipelineOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const filteredOrders = activeTab === 'All' 
    ? shopOrders 
    : shopOrders.filter(order => order.status.toLowerCase() === activeTab.toLowerCase());

  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus, actionLabel?: string) => {
    updateOrderStatus(orderId, nextStatus);
  };

  // Filtered orders inside Earnings Modal
  const getModalEarningsOrders = () => {
    let list = shopOrders;
    if (earningsTimeFilter === 'today') {
      list = shopOrders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
    } else if (earningsTimeFilter === 'week') {
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      list = shopOrders.filter(o => (now - new Date(o.created_at).getTime()) <= oneWeek);
    } else if (earningsTimeFilter === 'active') {
      list = activePipelineOrders;
    }

    if (earningsSearchQuery.trim()) {
      const q = earningsSearchQuery.toLowerCase().trim();
      list = list.filter(o => 
        o.id.toLowerCase().includes(q) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.customer_phone && o.customer_phone.includes(q))
      );
    }

    return list;
  };

  const modalOrders = getModalEarningsOrders();
  const modalEarningsSum = modalOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <View style={styles.container}>
      {/* Top Shop Header */}
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
        <Text style={styles.ordersCountText}>{shopOrders.length} Total Orders</Text>
      </View>

      {/* TOTAL AMOUNT EARNED HERO CARD (CLICKABLE FOR ORDER DETAILS) */}
      <TouchableOpacity
        style={styles.earningsHeroCard}
        activeOpacity={0.88}
        onPress={() => setShowEarningsModal(true)}
      >
        <View style={styles.earningsHeroTop}>
          <View style={styles.earningsTitleRow}>
            <View style={styles.rupeeIconBadge}>
              <Text style={styles.rupeeSymbol}>₹</Text>
            </View>
            <View>
              <Text style={styles.earningsHeroLabel}>TOTAL STORE EARNINGS</Text>
              <Text style={styles.earningsHeroAmount}>₹{totalEarned.toFixed(0)}</Text>
            </View>
          </View>
          <View style={styles.viewDetailsChip}>
            <Text style={styles.viewDetailsChipText}>Order Details</Text>
            <Ionicons name="chevron-forward" size={14} color="#10B981" />
          </View>
        </View>

        {/* Breakdown Submetrics */}
        <View style={styles.earningsSubMetricsRow}>
          <View style={styles.subMetricCol}>
            <Text style={styles.subMetricLabel}>Today's Earnings</Text>
            <Text style={styles.subMetricValue}>₹{todayEarned.toFixed(0)}</Text>
            <Text style={styles.subMetricSub}>{todayDeliveredOrders.length} delivered</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.subMetricCol}>
            <Text style={styles.subMetricLabel}>Delivered Total</Text>
            <Text style={styles.subMetricValue}>{deliveredOrders.length} Orders</Text>
            <Text style={styles.subMetricSub}>100% Completed</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.subMetricCol}>
            <Text style={styles.subMetricLabel}>Active Orders</Text>
            <Text style={[styles.subMetricValue, { color: '#F59E0B' }]}>₹{activePipelineAmount.toFixed(0)}</Text>
            <Text style={styles.subMetricSub}>{activePipelineOrders.length} in pipeline</Text>
          </View>
        </View>

        <View style={styles.earningsTapHintRow}>
          <Ionicons name="receipt-outline" size={13} color="#A7F3D0" />
          <Text style={styles.earningsTapHintText}>
            Tap anywhere on this card to view full earnings report & order details ➔
          </Text>
        </View>
      </TouchableOpacity>

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

      {/* ========================================================================= */}
      {/* 📊 TOTAL EARNINGS & ORDER DETAILS MODAL                                    */}
      {/* ========================================================================= */}
      <Modal
        visible={showEarningsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowEarningsModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowEarningsModal(false)}
              >
                <Ionicons name="close" size={22} color="#0F172A" />
              </TouchableOpacity>
              <View>
                <Text style={styles.modalHeaderTitle}>Earnings & Orders Report</Text>
                <Text style={styles.modalHeaderSubtitle}>{activeShop?.name || 'My Store'}</Text>
              </View>
            </View>
            <View style={styles.modalHeaderBadge}>
              <Text style={styles.modalHeaderBadgeText}>{modalOrders.length} orders</Text>
            </View>
          </View>

          {/* Revenue Summary Card */}
          <View style={styles.modalSummaryCard}>
            <View style={styles.modalSummaryTop}>
              <View>
                <Text style={styles.modalSummaryLabel}>
                  {earningsTimeFilter === 'all' ? 'All-Time Revenue' : earningsTimeFilter === 'today' ? "Today's Revenue" : earningsTimeFilter === 'week' ? 'Last 7 Days' : 'In Pipeline'}
                </Text>
                <Text style={styles.modalSummaryAmount}>₹{modalEarningsSum.toFixed(0)}</Text>
              </View>
              <View style={styles.modalSummaryStatsCol}>
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>
                    📦 {modalOrders.filter(o => o.status === 'delivered').length} Delivered
                  </Text>
                </View>
                <View style={[styles.statPill, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.statPillText, { color: '#B45309' }]}>
                    ⏳ {modalOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length} In Progress
                  </Text>
                </View>
              </View>
            </View>

            {/* Time Filter Tabs */}
            <View style={styles.modalTimeFilterRow}>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'active', label: 'Active Pipeline' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.modalTimeTab,
                    earningsTimeFilter === filter.id && styles.modalTimeTabActive,
                  ]}
                  onPress={() => setEarningsTimeFilter(filter.id as any)}
                >
                  <Text
                    style={[
                      styles.modalTimeTabText,
                      earningsTimeFilter === filter.id && styles.modalTimeTabTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Search bar inside Earnings */}
          <View style={styles.modalSearchContainer}>
            <Ionicons name="search" size={16} color="#94A3B8" />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search by customer name, phone, or order #..."
              placeholderTextColor="#94A3B8"
              value={earningsSearchQuery}
              onChangeText={setEarningsSearchQuery}
            />
            {earningsSearchQuery ? (
              <TouchableOpacity onPress={() => setEarningsSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Orders Breakdown List */}
          <FlatList
            data={modalOrders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalListContent}
            ListEmptyComponent={() => (
              <View style={styles.modalEmptyState}>
                <Ionicons name="cash-outline" size={48} color="#CBD5E1" />
                <Text style={styles.modalEmptyTitle}>No orders in this period</Text>
                <Text style={styles.modalEmptySub}>Orders placed in this time window will appear here with full pricing breakdowns.</Text>
              </View>
            )}
            renderItem={({ item }) => {
              const statusInfo = getOrderStatusInfo(item.status);
              const itemsCount = item.items?.reduce((cnt, it) => cnt + it.quantity, 0) || item.items?.length || 1;

              return (
                <TouchableOpacity
                  style={styles.earningOrderCard}
                  activeOpacity={0.85}
                  onPress={() => setSelectedOrderDetail(item)}
                >
                  <View style={styles.earningOrderTop}>
                    <View>
                      <Text style={styles.earningOrderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.earningOrderDate}>
                        {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={styles.earningOrderPriceBox}>
                      <Text style={styles.earningOrderAmount}>₹{item.total || 0}</Text>
                      <View style={[styles.miniStatusBadge, { backgroundColor: statusInfo.color + '15' }]}>
                        <Text style={[styles.miniStatusText, { color: statusInfo.color }]}>
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.earningOrderCustomerRow}>
                    <Ionicons name="person-circle-outline" size={16} color="#64748B" />
                    <Text style={styles.earningCustomerText}>
                      {item.customer_name || 'Customer'} • {item.customer_phone || '+91 98480 12345'}
                    </Text>
                  </View>

                  <View style={styles.earningOrderItemsSummary}>
                    <Text style={styles.earningItemsCountText}>
                      🛒 {itemsCount} items: {item.items?.map(it => `${it.quantity}x ${it.product_name}`).join(', ') || 'Grocery basket'}
                    </Text>
                  </View>

                  <View style={styles.earningOrderFooter}>
                    <Text style={styles.earningPaymentMethod}>
                      {item.payment_method === 'online' || item.payment_status === 'paid' ? '💳 Prepaid Online' : item.payment_method === 'upi_on_delivery' ? '📱 UPI QR' : '💵 Cash on Delivery'}
                    </Text>
                    <View style={styles.earningViewDetailBtn}>
                      <Text style={styles.earningViewDetailText}>Click for Order Details</Text>
                      <Ionicons name="arrow-forward" size={13} color="#10B981" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 🧾 FULL ORDER DETAILS SUB-MODAL                                           */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedOrderDetail}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedOrderDetail(null)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalCard}>
            {selectedOrderDetail && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.detailHeader}>
                  <View>
                    <Text style={styles.detailTitle}>Order #{selectedOrderDetail.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.detailTime}>
                      {new Date(selectedOrderDetail.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.detailCloseBtn}
                    onPress={() => setSelectedOrderDetail(null)}
                  >
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Status & Payment Pills */}
                <View style={styles.detailPillsRow}>
                  <View style={[styles.detailStatusPill, { backgroundColor: getOrderStatusInfo(selectedOrderDetail.status).color + '20' }]}>
                    <Text style={[styles.detailStatusText, { color: getOrderStatusInfo(selectedOrderDetail.status).color }]}>
                      Status: {selectedOrderDetail.status.toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.detailStatusPill, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.detailStatusText, { color: '#059669' }]}>
                      Earned: ₹{selectedOrderDetail.total || 0}
                    </Text>
                  </View>
                </View>

                {/* Customer Section */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Customer & Contact</Text>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailCustomerName}>{selectedOrderDetail.customer_name || 'Customer'}</Text>
                    <Text style={styles.detailCustomerPhone}>{selectedOrderDetail.customer_phone || '+91 98480 12345'}</Text>
                    <Text style={styles.detailCustomerAddress}>{selectedOrderDetail.delivery_address || 'Banjara Hills, Hyderabad'}</Text>
                  </View>
                </View>

                {/* Items List */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    Order Items ({selectedOrderDetail.items?.length || 0})
                  </Text>
                  <View style={styles.detailBox}>
                    {selectedOrderDetail.items && selectedOrderDetail.items.map((prod, idx) => (
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

                {/* Bill Breakdown */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Payment & Bill Summary</Text>
                  <View style={styles.detailBox}>
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Item Subtotal</Text>
                      <Text style={styles.billValue}>{formatPrice(selectedOrderDetail.subtotal || selectedOrderDetail.total)}</Text>
                    </View>
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Delivery Fee</Text>
                      <Text style={styles.billValue}>{formatPrice(selectedOrderDetail.delivery_fee || 0)}</Text>
                    </View>
                    <View style={[styles.billRow, styles.billTotalRow]}>
                      <Text style={styles.billTotalLabel}>Total Shopkeeper Earnings</Text>
                      <Text style={styles.billTotalValue}>{formatPrice(selectedOrderDetail.total || 0)}</Text>
                    </View>
                    <Text style={styles.detailPaymentMode}>
                      Mode: {selectedOrderDetail.payment_method === 'online' || selectedOrderDetail.payment_status === 'paid' ? 'Prepaid Online' : selectedOrderDetail.payment_method === 'upi_on_delivery' ? 'UPI QR' : 'Cash on Delivery (COD)'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.detailDoneBtn}
                  onPress={() => setSelectedOrderDetail(null)}
                >
                  <Text style={styles.detailDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    maxWidth: 200,
  },
  storeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  ordersCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },

  /* 💰 TOTAL EARNINGS HERO CARD STYLING */
  earningsHeroCard: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 6,
    backgroundColor: '#064E3B', // Deep Emerald Rich Background
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
  earningsHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rupeeIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  rupeeSymbol: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  earningsHeroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6EE7B7',
    letterSpacing: 0.8,
  },
  earningsHeroAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  viewDetailsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#042F2E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  viewDetailsChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
  },
  earningsSubMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#022C22',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  subMetricCol: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#065F46',
  },
  subMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  subMetricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F9FAFB',
  },
  subMetricSub: {
    fontSize: 10,
    color: '#6EE7B7',
    fontWeight: '600',
    marginTop: 1,
  },
  earningsTapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#065F46',
    justifyContent: 'center',
  },
  earningsTapHintText: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '700',
  },

  /* TABS */
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeTabButton: {
    backgroundColor: '#059669',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ORDER CARD */
  listContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  timestamp: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customerInfo: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  customerAddress: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  mapSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  mapSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  callTinyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  callTinyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  itemsPreview: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginBottom: 12,
  },
  itemsHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  itemName: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    fontWeight: '500',
  },
  itemQtyPrice: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 10,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemText: {
    fontSize: 13,
    color: '#64748B',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  paymentMethodText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
    marginTop: 2,
  },
  actionButtonsWrapper: {
    alignItems: 'flex-end',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  deliveryStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  deliveryStatusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelledBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },

  /* 📊 EARNINGS MODAL STYLES */
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  modalHeaderBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  modalHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  modalSummaryCard: {
    margin: 14,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
  },
  modalSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalSummaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  modalSummaryAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10B981',
    marginTop: 2,
  },
  modalSummaryStatsCol: {
    gap: 6,
    alignItems: 'flex-end',
  },
  statPill: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7F3D0',
  },
  modalTimeFilterRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  modalTimeTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  modalTimeTabActive: {
    backgroundColor: '#10B981',
  },
  modalTimeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  modalTimeTabTextActive: {
    color: '#FFFFFF',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  modalListContent: {
    paddingHorizontal: 14,
    paddingBottom: 30,
    gap: 12,
  },
  modalEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  modalEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  modalEmptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },

  /* EARNING ORDER ITEM */
  earningOrderCard: {
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
  earningOrderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  earningOrderId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  earningOrderDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  earningOrderPriceBox: {
    alignItems: 'flex-end',
    gap: 3,
  },
  earningOrderAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: '#059669',
  },
  miniStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  earningOrderCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  earningCustomerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  earningOrderItemsSummary: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  earningItemsCountText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  earningOrderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  earningPaymentMethod: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  earningViewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningViewDetailText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
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
  detailPaymentMode: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 6,
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
