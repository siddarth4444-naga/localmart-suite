import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';

export default function DeliveryProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);

  const handleLogout = () => {
    const doLogout = () => {
      logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to log out of the Delivery Partner app?');
      if (confirmed) {
        doLogout();
      }
      return;
    }

    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of the Delivery Partner app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: doLogout,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/deliveries')} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rider Account</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.quickLogoutBtn} accessibilityLabel="Logout">
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.nameText}>{user?.name || 'Rider Partner'}</Text>
            <Text style={styles.phoneText}>{user?.phone || '+91 98480 99887'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Verified LocalMart Delivery Partner</Text>
            </View>
          </View>
        </View>

        {/* Online Duty Status Toggle */}
        <View style={styles.dutyCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dutyTitle}>Duty Status</Text>
            <Text style={styles.dutySubtitle}>
              {isOnline ? '🟢 You are Online & receiving store pickup alerts.' : '🔴 Offline. Switch on to accept orders.'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#CBD5E1', true: '#0284C7' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Vehicle & Identity Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Vehicle & Partner Details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="bicycle-outline" size={18} color="#0284C7" />
            <Text style={styles.detailLabel}>Vehicle Type</Text>
            <Text style={styles.detailValue}>{user?.vehicle_type || 'Motorcycle / Scooter'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={18} color="#0284C7" />
            <Text style={styles.detailLabel}>Vehicle Reg. Number</Text>
            <Text style={styles.detailValue}>{user?.vehicle_number || 'TS 09 AB 1234'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="star-outline" size={18} color="#F59E0B" />
            <Text style={styles.detailLabel}>Rider Rating</Text>
            <Text style={[styles.detailValue, { color: '#D97706' }]}>★ 4.9 (142 Deliveries)</Text>
          </View>
        </View>

        {/* Quick Menu */}
        <View style={styles.menuContainer}>
          {[
            {
              title: 'Payout Bank Account & UPI',
              icon: 'cash-outline',
              action: () => Alert.alert('Payouts', 'Daily earnings auto-transferred to your linked UPI at 11:59 PM.'),
            },
            {
              title: 'Rider Support & Emergency Helpline',
              icon: 'call-outline',
              action: () => Alert.alert('Helpline', 'Call Rider Helpline: 1800-RIDER-MART (24/7 Support)'),
            },
            {
              title: 'About LocalMart Delivery Network',
              icon: 'information-circle-outline',
              action: () => Alert.alert('LocalMart', 'Connecting local store orders with neighborhood riders for ultra-fast local grocery delivery.'),
            },
          ].map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.menuItem} onPress={item.action}>
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={20} color="#0284C7" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Log Out from Rider App</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>LocalMart Delivery Partner App • Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickLogoutBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  phoneText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369A1',
  },
  dutyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dutyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  dutySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 10,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 10,
  },
});
