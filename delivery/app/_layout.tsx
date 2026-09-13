import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { realtimeSync } from '../src/services/realtimeSync';
import { useShopStore } from '../src/stores/shopStore';
import { useAuthStore } from '../src/stores/authStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

export default function DeliveryRootLayout() {
  useEffect(() => {
    useAuthStore.getState().initialize();
    useShopStore.getState().initialize();
    SplashScreen.hideAsync().catch(() => {});
    const cleanup = realtimeSync.initListeners();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="order-delivery/[id]" />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
