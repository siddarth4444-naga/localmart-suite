import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useLocationStore } from '../src/stores/locationStore';
import { useShopStore } from '../src/stores/shopStore';

export default function CustomerIndex() {
  const router = useRouter();
  const { user, initialize: initAuth } = useAuthStore();
  const { setLocation } = useLocationStore();
  const { initialize: initShop } = useShopStore();

  useEffect(() => {
    const startup = async () => {
      await Promise.all([initAuth(), initShop()]);
      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser.id && currentUser.id !== 'u_guest_shopper') {
        if (currentUser.address) {
          setLocation(currentUser.latitude || 17.4142, currentUser.longitude || 78.4335, currentUser.address);
        }
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/login');
      }
    };
    startup();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
}
