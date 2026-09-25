import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/authStore';
import { useLocationStore } from '../../../src/stores/locationStore';
import { authService } from '../../../src/services/authService';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { address } = useLocationStore();

  // Support Modal State
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportCategory, setSupportCategory] = useState('Order Issue');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportOrderId, setSupportOrderId] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);

  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState(user?.email || '');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetLoading, setResetLoading] = useState(false);

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

  // Submit Support Ticket to localshoppp@gmail.com
  const handleSubmitSupportTicket = async () => {
    if (!supportMessage.trim()) {
      Alert.alert('Empty Message', 'Please describe your inquiry or issue.');
      return;
    }

    setSupportLoading(true);
    const res = await authService.submitSupportTicket({
      name: user?.name || 'Customer',
      email: user?.email || 'customer@localmart.in',
      phone: user?.phone || '+91 98480 12345',
      role: 'Customer',
      category: supportCategory,
      message: supportMessage.trim(),
      orderId: supportOrderId.trim() || undefined,
    });
    setSupportLoading(false);

    if (res.success) {
      Alert.alert(
        'Support Ticket Dispatched! ✉️',
        `Your inquiry has been emailed to our official store desk at localshoppp@gmail.com.\n\nTicket Reference: ${res.ticketId || 'TKT-1001'}\nOur team will contact you shortly.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowSupportModal(false);
              setSupportMessage('');
              setSupportOrderId('');
            }
          }
        ]
      );
    } else {
      Alert.alert('Error', res.message || 'Failed to submit ticket.');
    }
  };

  // Handle Request Reset Password Email
  const handleSendResetEmail = async () => {
    const clean = resetEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setResetLoading(true);
    const res = await authService.forgotPassword(clean, 'customer');
    setResetLoading(false);

    if (res.success) {
      Alert.alert(
        'Reset Code Dispatched! ✉️',
        `A 6-digit verification code has been dispatched from localshoppp@gmail.com to ${clean}. Please check your inbox and enter the code below.`
      );
      setResetStep('verify');
    } else {
      Alert.alert('Error', res.message || 'Failed to send reset email.');
    }
  };

  // Handle Confirm Reset Password
  const handleConfirmResetPassword = async () => {
    if (!resetCode.trim() || resetCode.trim().length < 4) {
      Alert.alert('Incomplete Code', 'Please enter the 6-digit reset code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters long.');
      return;
    }

    setResetLoading(true);
    const res = await authService.resetPassword(resetEmail, resetCode, newPassword);
    setResetLoading(false);

    if (res.success) {
      Alert.alert(
        'Password Updated! 🎉',
        'Your password has been changed successfully. A confirmation email has been dispatched to your inbox.',
        [
          {
            text: 'Done',
            onPress: () => {
              setShowResetModal(false);
              setResetCode('');
              setNewPassword('');
            }
          }
        ]
      );
    } else {
      Alert.alert('Verification Error', res.message || 'Invalid reset code. Please try again.');
    }
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

        {/* Support Direct Banner */}
        <View style={styles.supportBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.supportIconCircle}>
              <Ionicons name="headset" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.supportBannerTitle}>24/7 Store Customer Support</Text>
              <Text style={styles.supportBannerSub}>Email: <Text style={{ fontWeight: '800', color: '#047857' }}>localshoppp@gmail.com</Text></Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.supportBannerBtn}
            onPress={() => setShowSupportModal(true)}
          >
            <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
            <Text style={styles.supportBannerBtnText}>Contact Support Desk</Text>
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
            { id: '2', title: 'Customer Support & Help Desk', icon: 'help-buoy-outline', action: () => setShowSupportModal(true) },
            { id: '3', title: 'Reset Account Password', icon: 'key-outline', action: () => { setResetEmail(user?.email || ''); setResetStep('request'); setShowResetModal(true); } },
            { id: '4', title: 'Payment Methods (COD / UPI)', icon: 'card-outline', action: () => Alert.alert('Payment Methods', 'Cash on Delivery & Instant UPI at Doorstep are active.') },
            { id: '5', title: 'Switch App Mode / Change Role', icon: 'swap-horizontal-outline', action: () => router.replace('/') },
            { id: '6', title: 'About LocalMart & Local Shops', icon: 'information-circle-outline', action: () => Alert.alert('LocalMart', 'Empowering local neighborhood shopkeepers to connect directly with nearby customers with lightning-fast delivery.') },
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

        <Text style={styles.versionText}>LocalMart Version 1.0.0 • Support: localshoppp@gmail.com</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Customer Support Modal */}
      {showSupportModal && (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <TouchableOpacity 
                style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
                onPress={() => setShowSupportModal(false)}
              >
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>

              <View style={[styles.modalIconCircle, { backgroundColor: '#10B981' }]}>
                <Ionicons name="headset" size={32} color="#FFFFFF" />
              </View>

              <Text style={styles.modalSuccessTitle}>Customer Support Desk</Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 16 }}>
                Official Desk: <Text style={{ fontWeight: '800', color: '#059669' }}>localshoppp@gmail.com</Text>
              </Text>

              {/* Category selector */}
              <Text style={styles.inputLabel}>Select Inquiry Type</Text>
              <View style={styles.categoryRow}>
                {['Order Issue', 'Delivery Delay', 'Refund / Payment', 'Other'].map(cat => (
                  <TouchableOpacity 
                    key={cat}
                    style={[styles.categoryPill, supportCategory === cat && styles.categoryPillActive]}
                    onPress={() => setSupportCategory(cat)}
                  >
                    <Text style={[styles.categoryPillText, supportCategory === cat && styles.categoryPillTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Order ID optional */}
              <Text style={styles.inputLabel}>Order ID (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. #ORD-123456"
                value={supportOrderId}
                onChangeText={setSupportOrderId}
                placeholderTextColor="#9CA3AF"
              />

              {/* Message */}
              <Text style={styles.inputLabel}>Your Message / Query *</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Describe your issue or feedback in detail..."
                multiline
                numberOfLines={3}
                value={supportMessage}
                onChangeText={setSupportMessage}
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity 
                style={[styles.modalProceedBtn, supportLoading && { opacity: 0.7 }]}
                onPress={handleSubmitSupportTicket}
                disabled={supportLoading}
              >
                {supportLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                    <Text style={styles.modalProceedBtnText}>Send to localshoppp@gmail.com</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Password Reset Modal */}
      {showResetModal && (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <TouchableOpacity 
                style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
                onPress={() => setShowResetModal(false)}
              >
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>

              <View style={[styles.modalIconCircle, { backgroundColor: '#059669' }]}>
                <Ionicons name="key-outline" size={32} color="#FFFFFF" />
              </View>

              <Text style={styles.modalSuccessTitle}>Reset Password</Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 16 }}>
                {resetStep === 'request'
                  ? 'We will dispatch a 6-digit password reset security code from localshoppp@gmail.com to your email.'
                  : `Enter the 6-digit security code sent to ${resetEmail} and your new password.`}
              </Text>

              {resetStep === 'request' ? (
                <>
                  <TextInput
                    style={[styles.modalInput, { marginBottom: 16 }]}
                    placeholder="Enter your email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity 
                    style={[styles.modalProceedBtn, resetLoading && { opacity: 0.7 }]}
                    onPress={handleSendResetEmail}
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="mail" size={18} color="#FFFFFF" />
                        <Text style={styles.modalProceedBtnText}>Dispatch Reset Code</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput
                    style={[styles.modalInput, { marginBottom: 12 }]}
                    placeholder="6-Digit Reset Code (e.g. 123456)"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={resetCode}
                    onChangeText={setResetCode}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TextInput
                    style={[styles.modalInput, { marginBottom: 16 }]}
                    placeholder="New Password (min 6 characters)"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity 
                    style={[styles.modalProceedBtn, resetLoading && { opacity: 0.7 }]}
                    onPress={handleConfirmResetPassword}
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                        <Text style={styles.modalProceedBtnText}>Save New Password</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}
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
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  email: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  supportBanner: {
    backgroundColor: '#ECFDF5',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  supportIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  supportBannerSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  supportBannerBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  supportBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  addressValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 18,
  },
  changeAddressLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
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
    borderRadius: 8,
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
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSuccessTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  inputLabel: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
    width: '100%',
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  categoryPillText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 12,
  },
  modalProceedBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
  },
  modalProceedBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
