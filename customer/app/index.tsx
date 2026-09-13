import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useShopStore } from '../src/stores/shopStore';

export default function CustomerIndex() {
  useEffect(() => {
    useAuthStore.getState().initialize();
    useShopStore.getState().initialize();
  }, []);

  return <Redirect href="/(tabs)/home" />;
}
