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

// Prevent splash screen auto-hiding with safe fallback
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reload / already hidden */
});

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    useAuthStore.getState().initialize();
    useShopStore.getState().initialize();
    const cleanup = realtimeSync.initListeners();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 800);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(shopkeeper)" />
          <Stack.Screen name="(developer)" />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

