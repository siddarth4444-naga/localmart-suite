import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService, AuthResult } from '../../src/services/authService';
import { useShopStore } from '../../src/stores/shopStore';

export default function ShopkeeperLoginScreen() {
  const router = useRouter();

  // Mode: 'signin' or 'signup'
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Form Fields
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState<AuthResult | null>(null);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Handle Request Password Reset Email
  const handleSendResetEmail = async () => {
    const clean = forgotEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    const res = await authService.forgotPassword(clean, 'shopkeeper');
    setForgotLoading(false);

    if (res.success) {
      Alert.alert(
        'Reset Email Dispatched! ✉️',
        `A 6-digit security reset code has been sent from localshoppp@gmail.com to ${clean}. Please check your inbox and enter the code below.`
      );
      setForgotStep('verify');
    } else {
      Alert.alert('Error', res.message || 'Failed to dispatch reset email.');
    }
  };

  // Handle Confirm New Password
  const handleConfirmResetPassword = async () => {
    if (!forgotCode.trim() || forgotCode.trim().length < 4) {
      Alert.alert('Incomplete Code', 'Please enter the 6-digit reset code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters long.');
      return;
    }

    setForgotLoading(true);
    const res = await authService.resetPassword(forgotEmail, forgotCode, newPassword);
    setForgotLoading(false);

    if (res.success) {
      Alert.alert(
        'Password Reset Successful! 🎉',
        'Your password has been updated. You can now log in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => {
              setShowForgotModal(false);
              setEmail(forgotEmail);
              setPassword(newPassword);
            }
          }
        ]
      );
    } else {
      Alert.alert('Verification Error', res.message || 'Invalid or expired reset code. Please try again.');
    }
  };

  const handleAuthSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Basic format validation
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        Alert.alert('Missing Name', 'Please enter your Full Name.');
        return;
      }
      if (!shopName.trim()) {
        Alert.alert('Missing Shop Name', 'Please enter your Store Name.');
        return;
      }
      if (!phone.trim()) {
        Alert.alert('Missing Phone', 'Please enter your 10-digit phone number.');
        return;
      }

      setLoading(true);
      const res = await authService.signUpShopkeeper({
        name: name.trim(),
        email: cleanEmail,
        password,
        phone: phone.trim(),
        shopName: shopName.trim(),
      });
      setLoading(false);

      if (res.success) {
        setSuccessModal(res);
      } else {
        Alert.alert('Registration Error', res.error || 'Failed to register account.');
      }
    } else {
      // Sign In Flow
      setLoading(true);
      const res = await authService.signInShopkeeper(cleanEmail, password);
      setLoading(false);

      if (res.success) {
        setSuccessModal(res);
      } else {
        Alert.alert('Login Error', res.error || 'Invalid email or password. Please check your credentials.');
      }
    }
  };

  const handleProceedToDashboard = () => {
    if (successModal?.shop?.id) {
      useShopStore.getState().setActiveShopkeeperShopId(successModal.shop.id);
    }
    setSuccessModal(null);
    router.replace('/(shopkeeper)/(tabs)/dashboard' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Ionicons name="storefront" size={14} color="#D97706" />
                <Text style={styles.roleBadgeText}>SHOPKEEPER PARTNER</Text>
              </View>
            </View>
            <Text style={styles.title}>
              {mode === 'signin' ? 'Welcome Back!' : 'Register Your Store'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'signin' 
                ? 'Sign in to manage inventory, prices, and live orders' 
                : 'Connect your neighborhood shop with thousands of local customers'}
            </Text>
          </View>

          {/* Mode Tabs (Sign In / Register) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, mode === 'signin' && styles.tabButtonActive]}
              onPress={() => setMode('signin')}
            >
              <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabButton, mode === 'signup' && styles.tabButtonActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                New Store Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === 'signup' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Owner Full Name *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Ramesh Reddy"
                      value={name}
                      onChangeText={setName}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Store / Shop Name *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="storefront-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Sri Balaji Super Kirana"
                      value={shopName}
                      onChangeText={setShopName}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number (+91) *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="9848012345"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shopkeeper Email Address *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="owner@localmart.in"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password (min 6 characters) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link in Sign In mode */}
            {mode === 'signin' && (
              <TouchableOpacity 
                style={{ alignSelf: 'flex-end', marginTop: 4, marginBottom: 16 }}
                onPress={() => {
                  setForgotEmail(email);
                  setForgotStep('request');
                  setShowForgotModal(true);
                }}
              >
                <Text style={{ color: '#059669', fontSize: 13, fontWeight: '700' }}>Forgot Password? Reset via Email</Text>
              </TouchableOpacity>
            )}

            {/* Email notification notice */}
            <View style={styles.emailNoticeBox}>
              <Ionicons name="mail" size={16} color="#059669" />
              <Text style={styles.emailNoticeText}>
                📧 An instant confirmation email will be delivered to your email upon {mode === 'signin' ? 'login' : 'registration'}.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitBtn, loading && { opacity: 0.8 }]}
              onPress={handleAuthSubmit}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name={mode === 'signin' ? "log-in" : "checkmark-circle"} size={20} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>
                    {mode === 'signin' ? 'Sign In & Open Dashboard' : 'Register Store & Send Email'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Toggle Mode Footer */}
            <TouchableOpacity 
              style={styles.switchModeFooter}
              onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              <Text style={styles.switchModeText}>
                {mode === 'signin' 
                  ? "Don't have a store account? " 
                  : "Already registered your store? "}
                <Text style={styles.switchModeLink}>
                  {mode === 'signin' ? 'Register here' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <TouchableOpacity 
                style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
                onPress={() => setShowForgotModal(false)}
              >
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>

              <View style={[styles.modalIconCircle, { backgroundColor: '#059669' }]}>
                <Ionicons name="key-outline" size={36} color="#FFFFFF" />
              </View>

              <Text style={styles.modalSuccessTitle}>Reset Store Password</Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 18 }}>
                {forgotStep === 'request'
                  ? 'Enter your registered shopkeeper email. We will send you a 6-digit security code from localshoppp@gmail.com.'
                  : `Enter the 6-digit security code sent to ${forgotEmail} and choose a new password.`}
              </Text>

              {forgotStep === 'request' ? (
                <>
                  <View style={[styles.inputContainer, { width: '100%', marginBottom: 16 }]}>
                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter registered email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.modalProceedBtn, forgotLoading && { opacity: 0.7 }]}
                    onPress={handleSendResetEmail}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                        <Text style={styles.modalProceedBtnText}>Send Reset Code to Email</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={[styles.inputContainer, { width: '100%', marginBottom: 12 }]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="6-Digit Reset Code (e.g. 123456)"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={forgotCode}
                      onChangeText={setForgotCode}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={[styles.inputContainer, { width: '100%', marginBottom: 16 }]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="New Password (min 6 chars)"
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.modalProceedBtn, forgotLoading && { opacity: 0.7 }]}
                    onPress={handleConfirmResetPassword}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                        <Text style={styles.modalProceedBtnText}>Update & Save Password</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{ marginTop: 12 }}
                    onPress={() => setForgotStep('request')}
                  >
                    <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                      Didn't receive email? Tap to resend
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Success Confirmation Modal */}
      {successModal && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="mail-open" size={44} color="#FFFFFF" />
              </View>
              <Text style={styles.modalSuccessTitle}>
                {mode === 'signup' ? '🎉 Store Registered!' : '✅ Login Successful!'}
              </Text>
              <Text style={styles.modalEmailInfo}>
                Confirmation sent to: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{email.toLowerCase()}</Text>
              </Text>
              <Text style={styles.modalMessageText}>
                {successModal.message}
              </Text>

              <TouchableOpacity 
                style={styles.modalProceedBtn}
                onPress={handleProceedToDashboard}
                activeOpacity={0.88}
              >
                <Ionicons name="storefront" size={20} color="#FFFFFF" />
                <Text style={styles.modalProceedBtnText}>Enter Shopkeeper Dashboard</Text>
              </TouchableOpacity>
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
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  badgeRow: {
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeIcon: {
    padding: 8,
  },
  emailNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginVertical: 14,
  },
  emailNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 16,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  switchModeFooter: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 13,
    color: '#64748B',
  },
  switchModeLink: {
    color: '#10B981',
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  modalSuccessTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalEmailInfo: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },
  modalMessageText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalProceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalProceedBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

