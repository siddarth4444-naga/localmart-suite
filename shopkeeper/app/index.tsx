import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useShopStore } from '../src/stores/shopStore';

export default function ShopkeeperIndex() {
  const router = useRouter();
  const { user, initialize: initAuth } = useAuthStore();
  const { initialize: initShop } = useShopStore();

  useEffect(() => {
    const init = async () => {
      await Promise.all([initAuth(), initShop()]);
      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser.role === 'shopkeeper') {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/(auth)/login');
      }
    };
    init();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
      <ActivityIndicator size="large" color="#D97706" />
    </View>
  );
}
