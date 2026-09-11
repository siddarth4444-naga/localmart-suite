import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/authStore';
import { useLocationStore } from '../../../src/stores/locationStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { address } = useLocationStore();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of LocalMart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/customer-login');
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    router.push({
      pathname: '/(auth)/customer-onboarding' as any,
      params: { phone: user?.phone || '+91 9848012345' }
    });
  };

  const displayName = user?.name || 'Customer';
  const displayPhone = user?.phone || '+91 98480 12345';
  const displayEmail = user?.email || 'customer@example.com';
  const displayAddress = user?.address || address || 'Set delivery location';
  const displayAge = user?.age ? `${user.age} yrs` : 'Not specified';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Title */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageHeaderTitle}>My Account</Text>
        </View>

        {/* Profile Card with Avatar */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.phone}>{displayPhone}</Text>
            <Text style={styles.email}>{displayEmail}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={14} color="#059669" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Details Snapshot Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardHeaderTitle}>Personal & Delivery Details</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <Text style={styles.detailLabel}>Age</Text>
            <Text style={styles.detailValue}>{displayAge}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color="#059669" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.detailLabel}>Saved Delivery Address</Text>
              <Text style={styles.addressValue}>{displayAddress}</Text>
            </View>
            <TouchableOpacity onPress={handleEditProfile}>
              <Text style={styles.changeAddressLink}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Navigation */}
        <View style={styles.menuContainer}>
          {[
            { id: '1', title: 'My Orders & Invoices', icon: 'receipt-outline', action: () => router.push('/(customer)/(tabs)/orders') },
            { id: '2', title: 'Payment Options (COD / UPI)', icon: 'card-outline', action: () => Alert.alert('Payment Methods', 'Cash on Delivery & UPI at Doorstep are active.') },
            { id: '3', title: 'Switch App Mode / Change Role', icon: 'swap-horizontal-outline', action: () => router.replace('/') },
            { id: '4', title: 'Customer Support & Help', icon: 'help-circle-outline', action: () => Alert.alert('Customer Support', 'Contact us at support@localmart.in or call 1800-LOCAL-MART') },
            { id: '5', title: 'About LocalMart & Local Shops', icon: 'information-circle-outline', action: () => Alert.alert('LocalMart', 'Empowering local neighborhood shopkeepers to connect directly with nearby customers.') },
          ].map(item => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.action}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon as any} size={20} color="#10B981" />
                </View>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>LocalMart Version 1.0.0 • Made for Local Shops</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  pageHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pageHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  phone: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  email: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
  },
  editButtonText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 12,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  addressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  changeAddressLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 11,
    color: '#9CA3AF',
  },
});
