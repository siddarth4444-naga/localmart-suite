import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useShopStore } from '../../src/stores/shopStore';
import { formatPrice, getOrderStatusInfo } from '../../src/lib/utils';
import { OrderStatus } from '../../src/types';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { orders, shops, updateOrderStatus } = useShopStore();

  const order = orders.find(o => o.id === id) || {
    id: id || 'ord_demo',
    customer_id: 'cust_1',
    shop_id: 'shop_1',
    status: 'pending' as OrderStatus,
    subtotal: 300,
    delivery_fee: 0,
    total: 300,
    delivery_address: 'Flat 402, Banjara Hills, Hyderabad',
    delivery_lat: 17.4142,
    delivery_lng: 78.4335,
    payment_method: 'cod' as const,
    payment_status: 'pending' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      { id: '1', order_id: id || '', product_id: 'p1', product_name: 'Fresh Apples', product_price: 120, quantity: 2, total: 240 },
      { id: '2', order_id: id || '', product_id: 'p2', product_name: 'Amul Milk 1L', product_price: 60, quantity: 1, total: 60 },
    ]
  };

  const shop = shops.find(s => s.id === order.shop_id);
  const statusInfo = getOrderStatusInfo(order.status);

  const handleUpdateStatus = (nextStatus: OrderStatus, actionLabel?: string) => {
    updateOrderStatus(order.id, nextStatus);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.topNavTitle}>Order Details</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.header}>
          <View>
            <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
            <Text style={styles.timestamp}>
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(order.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '18', borderColor: statusInfo.color + '40', borderWidth: 1 }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.badge}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer & Delivery Location</Text>
          <View style={styles.card}>
            <Text style={styles.customerName}>Customer ID: {order.customer_id.slice(-6)}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="storefront-outline" size={16} color="#059669" />
              <Text style={styles.infoText}>{shop?.name || 'Local Grocery Store'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#EF4444" />
              <Text style={styles.infoText}>{order.delivery_address || 'Banjara Hills, Hyderabad'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({order.items?.length || 0})</Text>
          <View style={styles.card}>
            {order.items && order.items.map((item, index) => (
              <View key={item.id || index} style={[styles.itemRow, index !== (order.items?.length || 0) - 1 && styles.borderBottom]}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemQtyPrice}>{item.quantity} × {formatPrice(item.product_price)}</Text>
                </View>
                <Text style={styles.itemTotal}>{formatPrice(item.total || item.product_price * item.quantity)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>{order.delivery_fee === 0 ? 'FREE' : formatPrice(order.delivery_fee)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
            </View>
            <View style={styles.paymentMethod}>
              <Ionicons name="cash-outline" size={20} color="#10B981" />
              <Text style={styles.paymentText}>Cash / UPI on Delivery (COD)</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footerActions}>
        {order.status === 'pending' && (
          <>
            <TouchableOpacity 
              style={styles.rejectButton}
              onPress={() => handleUpdateStatus('cancelled', 'Reject Order')}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => handleUpdateStatus('accepted', 'Accept Order')}
            >
              <Text style={styles.acceptText}>Accept Order</Text>
            </TouchableOpacity>
          </>
        )}

        {order.status === 'accepted' && (
          <>
            <TouchableOpacity 
              style={styles.rejectButton}
              onPress={() => handleUpdateStatus('cancelled', 'Cancel Order')}
            >
              <Text style={styles.rejectText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.acceptButton, { backgroundColor: '#8B5CF6' }]}
              onPress={() => handleUpdateStatus('preparing', 'Start Preparing')}
            >
              <Text style={styles.acceptText}>Mark Preparing</Text>
            </TouchableOpacity>
          </>
        )}

        {order.status === 'preparing' && (
          <TouchableOpacity 
            style={[styles.acceptButton, { backgroundColor: '#06B6D4' }]}
            onPress={() => handleUpdateStatus('ready', 'Mark Ready')}
          >
            <Text style={styles.acceptText}>Mark Ready for Pickup</Text>
          </TouchableOpacity>
        )}

        {order.status === 'ready' && (
          <TouchableOpacity 
            style={[styles.acceptButton, { backgroundColor: '#3B82F6' }]}
            onPress={() => handleUpdateStatus('out_for_delivery', 'Out for Delivery')}
          >
            <Text style={styles.acceptText}>Mark Out for Delivery</Text>
          </TouchableOpacity>
        )}

        {order.status === 'out_for_delivery' && (
          <TouchableOpacity 
            style={[styles.acceptButton, { backgroundColor: '#10B981' }]}
            onPress={() => handleUpdateStatus('delivered', 'Mark Delivered')}
          >
            <Text style={styles.acceptText}>Mark Delivered</Text>
          </TouchableOpacity>
        )}

        {order.status === 'delivered' && (
          <View style={[styles.acceptButton, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.acceptText, { color: '#059669' }]}>✓ Delivered</Text>
          </View>
        )}

        {order.status === 'cancelled' && (
          <View style={[styles.acceptButton, { backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.acceptText, { color: '#EF4444' }]}>✗ Cancelled</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topNavTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginLeft: 5,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  itemQtyPrice: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#666',
    fontSize: 14,
  },
  summaryValue: {
    color: '#333',
    fontSize: 14,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 5,
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#10B981',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
  },
  paymentText: {
    marginLeft: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 15,
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 15,
    width: 2,
    height: 30,
    backgroundColor: '#d1d5db',
    zIndex: 1,
  },
  timelineText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  timelineTextInactive: {
    fontSize: 14,
    color: '#888',
  },
  footerActions: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  rejectButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginRight: 10,
    alignItems: 'center',
  },
  rejectText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
