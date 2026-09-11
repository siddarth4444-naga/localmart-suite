import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/stores/authStore';
import { useLocationStore } from '../src/stores/locationStore';
import { useShopStore } from '../src/stores/shopStore';

const STORAGE_APP_MODE_KEY = '@localmart_device_app_mode';

export default function WelcomeScreen() {
  const router = useRouter();
  const { setUser, user } = useAuthStore();
  const { setLocation } = useLocationStore();
  const { initialize } = useShopStore();

  const [checkingMode, setCheckingMode] = useState(true);
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
    initialize();
    checkAutoLaunch();
  }, []);

  const checkAutoLaunch = async () => {
    try {
      // 1. Check if an environment variable is forcing app mode
      const envMode = process.env.EXPO_PUBLIC_APP_MODE;
      if (envMode === 'customer') {
        handleOpenCustomer(false);
        return;
      } else if (envMode === 'shopkeeper') {
        handleOpenShopkeeper(false);
        return;
      }

      // 2. Check saved device default mode
      const savedMode = await AsyncStorage.getItem(STORAGE_APP_MODE_KEY);
      if (savedMode === 'customer') {
        handleOpenCustomer(false);
        return;
      } else if (savedMode === 'shopkeeper') {
        handleOpenShopkeeper(false);
        return;
      }
    } catch (e) {}
    setCheckingMode(false);
  };

  const handleOpenDeveloper = () => {
    setUser({
      id: 'u_developer_admin',
      role: 'developer',
      name: 'LocalMart Developer (Admin)',
      email: 'admin@localmart.in',
      phone: '+91 99999 99999',
      address: 'Developer HQ, Hyderabad',
      latitude: 17.4142,
      longitude: 78.4335,
      created_at: new Date().toISOString(),
    });
    router.push('/(developer)/dashboard' as any);
  };

  const handleOpenCustomer = async (persist = rememberChoice) => {
    if (persist) {
      await AsyncStorage.setItem(STORAGE_APP_MODE_KEY, 'customer').catch(() => {});
    }

    setUser({
      id: user?.id || 'u_customer_1',
      role: 'customer',
      name: user?.name || 'Ramesh Kumar',
      email: user?.email || 'ramesh.kumar@example.com',
      phone: user?.phone || '+91 98480 12345',
      age: user?.age || 28,
      address: user?.address || 'Flat 402, Sai Balaji Residency, Road No. 12, Banjara Hills, Hyderabad',
      address_type: 'home',
      latitude: 17.4142,
      longitude: 78.4335,
      created_at: new Date().toISOString(),
    });

    setLocation(17.4142, 78.4335, 'Flat 402, Banjara Hills, Hyderabad');
    router.replace('/(customer)/(tabs)/home');
  };

  const handleOpenShopkeeper = async (persist = rememberChoice) => {
    if (persist) {
      await AsyncStorage.setItem(STORAGE_APP_MODE_KEY, 'shopkeeper').catch(() => {});
    }
    router.push('/(auth)/shopkeeper-login' as any);
  };

  const handleResetDeviceMode = async () => {
    await AsyncStorage.removeItem(STORAGE_APP_MODE_KEY).catch(() => {});
    setRememberChoice(false);
  };

  if (checkingMode) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo & Title */}
        <View style={styles.topSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="basket" size={54} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>LocalMart</Text>
          <Text style={styles.subtitle}>
            Hyperlocal Delivery Platform Connecting Local Shopkeepers with Customers
          </Text>
          <View style={styles.systemBadge}>
            <Ionicons name="git-network-outline" size={14} color="#059669" />
            <Text style={styles.systemBadgeText}>3 Interconnected Live Views</Text>
          </View>
        </View>

        {/* Device Persistence Option */}
        <View style={styles.rememberContainer}>
          <TouchableOpacity 
            style={styles.rememberRow}
            onPress={() => setRememberChoice(!rememberChoice)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberChoice && styles.checkboxActive]}>
              {rememberChoice && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rememberTitle}>Remember my selection on this device</Text>
              <Text style={styles.rememberSub}>Automatically open this mode next time app launches</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3 Interactive Mode Selection Cards */}
        <View style={styles.cardsContainer}>
          <Text style={styles.sectionHeading}>SELECT ACCESS MODE:</Text>

          {/* 1. Developer / Admin Mode */}
          <TouchableOpacity 
            style={[styles.roleCard, styles.roleCardDev]}
            onPress={handleOpenDeveloper}
            activeOpacity={0.88}
          >
            <View style={[styles.roleIconCircle, { backgroundColor: '#059669' }]}>
              <Ionicons name="code-slash" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.roleCardInfo}>
              <View style={styles.roleTitleRow}>
                <Text style={styles.roleTitle}>1. Developer / Admin</Text>
                <View style={[styles.badgePill, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.badgePillText, { color: '#059669' }]}>Master Control</Text>
                </View>
              </View>
              <Text style={styles.roleDescription}>
                Add new local shops with (+), edit shopkeeper details, phone, GPS location & inventory items.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#059669" />
          </TouchableOpacity>

          {/* 2. Customer Mode */}
          <TouchableOpacity 
            style={[styles.roleCard, styles.roleCardCustomer]}
            onPress={() => handleOpenCustomer(rememberChoice)}
            activeOpacity={0.88}
          >
            <View style={[styles.roleIconCircle, { backgroundColor: '#2563EB' }]}>
              <Ionicons name="cart" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.roleCardInfo}>
              <View style={styles.roleTitleRow}>
                <Text style={styles.roleTitle}>2. Customer App</Text>
                <View style={[styles.badgePill, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.badgePillText, { color: '#2563EB' }]}>Ordering View</Text>
                </View>
              </View>
              <Text style={styles.roleDescription}>
                Browse nearby shops, see exact distance from GPS, add items to cart & place orders.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#2563EB" />
          </TouchableOpacity>

          {/* 3. Shopkeeper Mode */}
          <TouchableOpacity 
            style={[styles.roleCard, styles.roleCardShopkeeper]}
            onPress={() => handleOpenShopkeeper(rememberChoice)}
            activeOpacity={0.88}
          >
            <View style={[styles.roleIconCircle, { backgroundColor: '#D97706' }]}>
              <Ionicons name="storefront" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.roleCardInfo}>
              <View style={styles.roleTitleRow}>
                <Text style={styles.roleTitle}>3. Shopkeeper Portal</Text>
                <View style={[styles.badgePill, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.badgePillText, { color: '#D97706' }]}>Store Owner</Text>
                </View>
              </View>
              <Text style={styles.roleDescription}>
                Store owner dashboard to manage products, toggle in/out of stock, change prices & handle live orders.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D97706" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLiveRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.footerSyncTitle}>Instant Real-Time Two-Way Sync Active</Text>
          </View>
          <Text style={styles.footerSyncText}>
            • Any item added or price updated by Shopkeeper reflects immediately on Customer phones.{'\n'}
            • Any order placed or cancelled by Customer pops up live in the Shopkeeper dashboard.
          </Text>
        </View>

        {/* Clear All Data / Clean Slate Reset */}
        <TouchableOpacity
          style={styles.wipeDataBtn}
          onPress={() => {
            useShopStore.getState().clearAllShops();
            handleResetDeviceMode();
            Alert.alert(
              'Data Wiped Successfully',
              'All shops, products, and customer orders have been deleted. You now have a clean slate to register new shops and add items!'
            );
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={16} color="#DC2626" />
          <Text style={styles.wipeDataBtnText}>Wipe All App Data (Start 100% Fresh)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
  },
  topSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  systemBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  cardsContainer: {
    marginTop: 8,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  roleCardDev: {
    borderColor: '#10B981',
  },
  roleCardCustomer: {
    borderColor: '#3B82F6',
  },
  roleCardShopkeeper: {
    borderColor: '#F59E0B',
  },
  roleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  roleCardInfo: {
    flex: 1,
    paddingRight: 6,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  roleDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  rememberContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  checkboxActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  rememberTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  rememberSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  footer: {
    marginTop: 24,
    marginBottom: 20,
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  footerLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  footerSyncTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  footerSyncText: {
    fontSize: 11,
    color: '#15803D',
    textAlign: 'left',
    fontWeight: '500',
    lineHeight: 16,
  },
  wipeDataBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 30,
  },
  wipeDataBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
});
