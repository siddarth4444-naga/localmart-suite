import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useShopStore } from '../src/stores/shopStore';

export default function DeliveryIndex() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { initialize } = useShopStore();

  useEffect(() => {
    initialize();
    const deliveryPartner = {
      id: 'dp_ravi_kumar',
      role: 'delivery' as const,
      name: 'Ravi Kumar (Rider)',
      email: 'ravi.rider@localmart.in',
      phone: '+91 98480 99887',
      vehicle_type: 'Motorcycle',
      vehicle_number: 'TS 09 AB 1234',
      created_at: new Date().toISOString(),
    };
    setUser(deliveryPartner);
    router.replace('/(tabs)/deliveries');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9FF' }}>
      <ActivityIndicator size="large" color="#0284C7" />
    </View>
  );
}
