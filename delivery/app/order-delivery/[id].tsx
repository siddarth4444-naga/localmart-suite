import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShopStore } from '../../src/stores/shopStore';
import { formatPrice } from '../../src/lib/utils';

export default function OrderDeliveryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { orders, shops, pickupDelivery, completeDelivery } = useShopStore();

  const order = orders.find((o) => o.id === id);
  const shop = order ? shops.find((s) => s.id === order.shop_id) : null;

  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Not Found</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>This delivery order could not be located.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPickedUp = order.status === 'picked_up' || order.status === 'out_for_delivery';
  const isDelivered = order.status === 'delivered';

  const toggleCheck = (itemId: string) => {
    setChecklist((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handlePickup = () => {
    pickupDelivery(order.id);
  };

  const handleDeliver = () => {
    completeDelivery(order.id);
    router.replace('/(tabs)/history');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task: #{order.id.slice(-6)}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.statusTitle}>Current Delivery State</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{order.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.statusDesc}>
            {order.status === 'delivery_accepted' && '1. Drive to the local store and verify items.'}
            {isPickedUp && '2. Drive to customer delivery location and collect payment.'}
            {isDelivered && '3. Order completed and delivered successfully.'}
          </Text>
        </View>

        {/* Pickup Details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>STORE PICKUP LOCATION</Text>
          <Text style={styles.boldTitle}>{shop?.name || 'Local Store'}</Text>
          <Text style={styles.detailText}>{shop?.address || 'Store Address'}</Text>
          <Text style={styles.phoneText}>📞 Phone: {shop?.phone || '+91 98480 00000'}</Text>
        </View>

        {/* Drop Details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>CUSTOMER DROP LOCATION</Text>
          <Text style={styles.boldTitle}>👤 {order.customer_name || 'Customer'}</Text>
          <Text style={styles.detailText}>{order.delivery_address || 'Delivery Address'}</Text>
          <Text style={styles.phoneText}>📞 Customer Phone: {order.customer_phone || '+91 98480 12345'}</Text>
        </View>

        {/* Checklist */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>ITEMS CHECKLIST ({order.items?.length || 1})</Text>
          {order.items?.map((item, idx) => {
            const key = item.id || `chk_${idx}`;
            const checked = !!checklist[key];

            return (
              <TouchableOpacity
                key={key}
                style={styles.checkItemRow}
                onPress={() => toggleCheck(key)}
              >
                <Ionicons
                  name={checked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={checked ? '#0284C7' : '#94A3B8'}
                />
                <Text style={[styles.checkItemText, checked && styles.checkItemDone]}>
                  {item.quantity}x {item.product_name}
                </Text>
                <Text style={styles.checkItemPrice}>
                  {formatPrice(item.product_price * item.quantity)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bill Box */}
        <View style={styles.billBox}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Collect Amount (COD):</Text>
            <Text style={styles.billTotal}>{formatPrice(order.total)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Your Rider Payout:</Text>
            <Text style={styles.billPayout}>+₹40.00</Text>
          </View>
        </View>

        {/* Action Button */}
        {!isPickedUp && !isDelivered && (
          <TouchableOpacity style={styles.primaryActionBtn} onPress={handlePickup}>
            <Ionicons name="cube" size={20} color="#FFFFFF" />
            <Text style={styles.btnText}>Confirm Picked Up from Store</Text>
          </TouchableOpacity>
        )}

        {isPickedUp && !isDelivered && (
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: '#10B981' }]}
            onPress={handleDeliver}
          >
            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
            <Text style={styles.btnText}>Confirm Delivered & Collect {formatPrice(order.total)}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
  },
  statusDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  boldTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 4,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  checkItemText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    flex: 1,
  },
  checkItemDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  checkItemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  billBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  billTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#B45309',
  },
  billPayout: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
  },
  primaryActionBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
});
