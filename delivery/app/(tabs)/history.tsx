import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice } from '../../src/lib/utils';

export default function DeliveryHistoryScreen() {
  const router = useRouter();
  const { orders, shops } = useShopStore();
  const { user } = useAuthStore();

  const completedOrders = orders.filter((o) => o.status === 'delivered');
  const totalEarnings = completedOrders.length * 40; // ₹40 payout per order

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings & History</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={completedOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={styles.statsCard}>
            <View style={styles.walletHeader}>
              <View style={styles.walletIconCircle}>
                <Ionicons name="wallet" size={24} color="#0284C7" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.walletLabel}>TOTAL DELIVERIES PAYOUT</Text>
                <Text style={styles.walletAmount}>₹{totalEarnings}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxCount}>{completedOrders.length}</Text>
                <Text style={styles.statBoxLabel}>Trips Completed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxCount}>₹40</Text>
                <Text style={styles.statBoxLabel}>Rate Per Order</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statBoxCount, { color: '#10B981' }]}>100%</Text>
                <Text style={styles.statBoxLabel}>On-Time Rating</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={54} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Completed Deliveries Yet</Text>
            <Text style={styles.emptySubtitle}>
              Completed customer deliveries will be logged here with your delivery payout breakdown.
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const shop = shops.find((s) => s.id === item.shop_id);

          return (
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.statusPill}>
                  <Ionicons name="checkmark-circle" size={14} color="#059669" />
                  <Text style={styles.statusPillText}>Delivered</Text>
                </View>
                <Text style={styles.earningGreenText}>+₹40.00</Text>
              </View>

              <Text style={styles.orderIdText}>Order #{item.id.slice(-6)}</Text>
              <Text style={styles.metaRowText}>🏪 {shop?.name || 'Local Grocery Store'}</Text>
              <Text style={styles.metaRowText}>📍 {item.delivery_address || 'Delivery Address'}</Text>

              <View style={styles.footerRow}>
                <Text style={styles.dateText}>
                  {item.delivered_at
                    ? new Date(item.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Delivered'}
                </Text>
                <Text style={styles.itemsCountText}>{item.items?.length || 1} items</Text>
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  walletAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0284C7',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxCount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  earningGreenText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A',
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  metaRowText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
    marginTop: 8,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  itemsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
});
