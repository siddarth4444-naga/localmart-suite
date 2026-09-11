import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';

export default function ShopkeeperTabsLayout() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    const doLogout = () => {
      logout();
      router.replace('/(auth)/login' as any);
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out of your shopkeeper account?')) doLogout();
    } else {
      Alert.alert('Sign Out', 'Sign out of your shopkeeper account?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#B45309',
        },
        headerTintColor: '#FFFFFF',
        headerTitle: '🏪 Shopkeeper Partner Center',
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 17,
        },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 14, padding: 4 }} accessibilityLabel="Logout">
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: '#D97706',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: styles.tabBar,
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cube' : 'cube-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopColor: '#eee',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 5,
    paddingTop: 5,
  },
});
