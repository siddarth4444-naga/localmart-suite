import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useShopStore } from '../../src/stores/shopStore';

export default function DeliveryTabsLayout() {
  const { orders } = useShopStore();

  const availableCount = orders.filter(o => o.status === 'ready' || o.status === 'preparing').length;
  const activeCount = orders.filter(o => o.status === 'delivery_accepted' || o.status === 'picked_up' || o.status === 'out_for_delivery').length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="deliveries"
        options={{
          title: 'Available Pickups',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="cube-outline" size={size} color={color} />
              {availableCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{availableCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: 'Active Delivery',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="bicycle" size={size} color={color} />
              {activeCount > 0 && (
                <View style={[styles.badge, { backgroundColor: '#0284C7' }]}>
                  <Text style={styles.badgeText}>{activeCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Rider Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
