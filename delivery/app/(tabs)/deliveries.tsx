import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice, calculateDistance, formatDistance, openGoogleMapsDirections } from '../../src/lib/utils';
import { Order } from '../../src/types';

export default function AvailableDeliveriesScreen() {
  const router = useRouter();
  const { orders, shops, acceptDelivery, initialize } = useShopStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    const doLogout = () => {
      logout();
      router.replace('/(auth)/login');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Log out of the Delivery Partner app?')) doLogout();
    } else {
      Alert.alert('Log Out', 'Log out of the Delivery Partner app?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      initialize();
      useAuthStore.getState().initialize();
    }, [])
  );

  // Orders ready for delivery partner or in progress
  const readyOrders = orders.filter(o => o.status === 'ready');
  const otherUpcoming = orders.filter(o => o.status === 'accepted' || o.status === 'preparing');

  const handleAcceptOrder = (order: Order, shopName: string) => {
    const activeUser = user || {
      id: 'dp_ravi_kumar',
      role: 'delivery' as const,
      name: 'Ravi Kumar (Rider)',
      phone: '+91 98480 99887',
      email: 'ravi.rider@localmart.in',
      created_at: new Date().toISOString(),
    };

    acceptDelivery(order.id, {
      id: activeUser.id,
      name: activeUser.name,
      phone: activeUser.phone,
    });
    router.push('/(tabs)/active');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/deliveries')} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <View style={styles.riderPill}>
            <View style={styles.onlineDot} />
            <Text style={styles.riderPillText}>Online • {user?.name || 'Rider'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.headerTitle}>Available ({readyOrders.length})</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.quickLogoutBtn} accessibilityLabel="Logout">
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={readyOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={styles.banner}>
            <Ionicons name="flash" size={18} color="#0284C7" />
            <Text style={styles.bannerText}>
              Orders marked <Text style={{ fontWeight: '800' }}>Ready for Pickup</Text> by local shopkeepers appear here instantly.
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cube-outline" size={54} color="#0284C7" />
            </View>
            <Text style={styles.emptyTitle}>No Ready Pickups Right Now</Text>
            <Text style={styles.emptySubtitle}>
              When local stores accept customer orders and pack them, new pickups will pop up here live in real-time.
            </Text>

            {otherUpcoming.length > 0 && (
              <View style={styles.upcomingBox}>
                <Text style={styles.upcomingTitle}>
                  ⏳ {otherUpcoming.length} orders currently being prepared at shops:
                </Text>
                {otherUpcoming.map((uo) => {
                  const shop = shops.find((s) => s.id === uo.shop_id);
                  return (
                    <View key={uo.id} style={styles.upcomingRow}>
                      <Ionicons name="restaurant-outline" size={14} color="#64748B" />
                      <Text style={styles.upcomingText}>
                        Order #{uo.id.slice(-6)} at <Text style={{ fontWeight: '700' }}>{shop?.name || 'Store'}</Text> ({uo.status})
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
        renderItem={({ item }) => {
          const shop = shops.find((s) => s.id === item.shop_id);
          const shopName = shop?.name || 'Local Store';
          const riderEarnings = 40; // Flat ₹40 payout per local delivery

          return (
            <View style={styles.orderCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.shopBadge}>
                  <Ionicons name="storefront" size={16} color="#059669" />
                  <Text style={styles.shopBadgeName} numberOfLines={1}>
                    {shopName}
                  </Text>
                </View>
                <View style={styles.earningsPill}>
                  <Text style={styles.earningsText}>Earn ₹{riderEarnings}</Text>
                </View>
              </View>

              {/* Pickup Address */}
              <View style={styles.locationSection}>
                <View style={styles.locationRow}>
                  <View style={[styles.dotIcon, { backgroundColor: '#10B981' }]} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.locationLabel}>PICKUP FROM STORE</Text>
                      <TouchableOpacity 
                        style={styles.mapPillBtn}
                        onPress={() => openGoogleMapsDirections(shop?.latitude, shop?.longitude, shop?.address, shopName)}
                      >
                        <Ionicons name="navigate-circle" size={13} color="#059669" />
                        <Text style={styles.mapPillBtnText}>Map</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.locationText}>{shop?.address || 'Local Shop Address'}</Text>
                    <Text style={styles.contactPhone}>📞 Shop: {shop?.phone || '+91 98480 00000'}</Text>
                  </View>
                </View>

                <View style={styles.verticalLine} />

                {/* Drop Address */}
                <View style={styles.locationRow}>
                  <View style={[styles.dotIcon, { backgroundColor: '#EF4444' }]} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.locationLabel}>DELIVER TO CUSTOMER</Text>
                      <TouchableOpacity 
                        style={[styles.mapPillBtn, { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF' }]}
                        onPress={() => openGoogleMapsDirections(item.delivery_lat, item.delivery_lng, item.delivery_address, item.customer_name)}
                      >
                        <Ionicons name="navigate-circle" size={13} color="#0284C7" />
                        <Text style={[styles.mapPillBtnText, { color: '#0284C7' }]}>Map</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.locationText}>{item.delivery_address || 'Customer Address'}</Text>
                    <Text style={styles.contactPhone}>
                      👤 Customer: {item.customer_name || 'Customer'} {item.customer_phone ? `(${item.customer_phone})` : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Items Summary & Payment Type */}
              <View style={styles.itemsSummaryBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={styles.itemsCountText}>
                    📦 {item.items?.length || 1} items to pick up • Total: {formatPrice(item.total)}
                  </Text>
                  {item.payment_status === 'paid' || item.payment_method === 'online' ? (
                    <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#065F46' }}>PAID ONLINE</Text>
                    </View>
                  ) : item.payment_method === 'upi_on_delivery' ? (
                    <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#0369A1' }}>UPI ON DELIVERY</Text>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#92400E' }}>CASH (COD)</Text>
                    </View>
                  )}
                </View>
                {item.items?.map((p, idx) => (
                  <Text key={idx} style={styles.itemBullet} numberOfLines={1}>
                    • {p.quantity}x {p.product_name}
                  </Text>
                ))}
              </View>

              {/* Accept Button */}
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptOrder(item, shopName)}
              >
                <Ionicons name="bicycle" size={18} color="#FFFFFF" />
                <Text style={styles.acceptButtonText}>Accept Pickup (Earn ₹{riderEarnings})</Text>
              </TouchableOpacity>
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
  riderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  riderPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerBackBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickLogoutBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E0F2FE',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  bannerText: {
    fontSize: 12,
    color: '#0369A1',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
  upcomingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    gap: 8,
  },
  upcomingTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upcomingText: {
    fontSize: 12,
    color: '#475569',
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
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  shopBadge: {
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
  shopBadgeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  earningsPill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  earningsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },
  locationSection: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dotIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  verticalLine: {
    width: 2,
    height: 18,
    backgroundColor: '#CBD5E1',
    marginLeft: 5,
    marginVertical: 2,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  mapPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mapPillBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  contactPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemsSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemsCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  itemBullet: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  acceptButton: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
