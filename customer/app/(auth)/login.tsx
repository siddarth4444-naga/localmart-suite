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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/stores/authStore';
import { useLocationStore } from '../../src/stores/locationStore';
import { User } from '../../src/types';

const STORAGE_KEY_CUSTOMERS = '@localmart_registered_customers';

export const PRESET_DEMO_CUSTOMERS: User[] = [
  {
    id: 'u_cust_ramesh',
    role: 'customer',
    name: 'Customer A (Ramesh)',
    phone: '+91 98480 12345',
    email: 'ramesh@localmart.in',
    address: 'Road No. 12, Banjara Hills, Hyderabad',
    latitude: 17.4142,
    longitude: 78.4335,
    created_at: new Date().toISOString(),
  },
  {
    id: 'u_cust_priya',
    role: 'customer',
    name: 'Customer B (Priya)',
    phone: '+91 98765 43210',
    email: 'priya@localmart.in',
    address: 'Cyber Towers, Madhapur, HITEC City, Hyderabad',
    latitude: 17.4483,
    longitude: 78.3915,
    created_at: new Date().toISOString(),
  },
  {
    id: 'u_cust_amit',
    role: 'customer',
    name: 'Customer C (Amit)',
    phone: '+91 91234 56780',
    email: 'amit@localmart.in',
    address: 'Road No. 36, Jubilee Hills, Hyderabad',
    latitude: 17.4319,
    longitude: 78.4073,
    created_at: new Date().toISOString(),
  },
];

export default function CustomerLoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { setLocation } = useLocationStore();

  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('1234');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    // Generate a 4-digit OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);

    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 600);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit verification code.');
      return;
    }

    if (otp !== generatedOtp && otp !== '1234') {
      Alert.alert('Incorrect OTP', `The OTP entered is incorrect. Use ${generatedOtp} or 1234.`);
      return;
    }

    setLoading(true);

    try {
      // Check if user already exists in registered customers storage
      const stored = await AsyncStorage.getItem(STORAGE_KEY_CUSTOMERS);
      let registeredCustomers: User[] = stored ? JSON.parse(stored) : [];
      
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = `+91 ${cleanPhone.slice(-10, -5)} ${cleanPhone.slice(-5)}`;
      
      // Check preset demo customers first
      const matchedPreset = PRESET_DEMO_CUSTOMERS.find(
        p => p.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-10))
      );

      let existingCustomer = matchedPreset || registeredCustomers.find(
        c => c.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-10))
      );

      if (!existingCustomer) {
        // Create customer profile if first time
        existingCustomer = {
          id: `u_cust_${Date.now()}`,
          role: 'customer',
          name: 'Customer ' + cleanPhone.slice(-4),
          email: `user${cleanPhone.slice(-4)}@localmart.in`,
          phone: formattedPhone,
          address: 'Banjara Hills, Hyderabad',
          latitude: 17.4142,
          longitude: 78.4335,
          created_at: new Date().toISOString(),
        };
        registeredCustomers.push(existingCustomer);
        await AsyncStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(registeredCustomers));
      }

      setUser(existingCustomer);
      setLocation(
        existingCustomer.latitude || 17.4142,
        existingCustomer.longitude || 78.4335,
        existingCustomer.address || 'Banjara Hills, Hyderabad'
      );

      setLoading(false);
      router.replace('/(tabs)/home');
    } catch (e) {
      setLoading(false);
      Alert.alert('Sign In Error', 'Could not sign in. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            {step === 'otp' && (
              <TouchableOpacity
                onPress={() => setStep('phone')}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
          </View>

          {/* Logo & Hero Card */}
          <View style={styles.heroSection}>
            <View style={styles.logoBadge}>
              <Ionicons name="cart" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.appTitle}>LocalMart Customer</Text>
            <Text style={styles.appSubtitle}>
              Fresh groceries delivered fast from your neighborhood shops
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.card}>
            {step === 'phone' ? (
              <>
                <Text style={styles.cardTitle}>Customer Login / Sign In</Text>
                <Text style={styles.cardDescription}>
                  Enter your mobile phone number to receive a secure login OTP
                </Text>

                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCodeBadge}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter 10-digit mobile"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Send OTP</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>NEW TO LOCALMART?</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Register Link */}
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => router.push('/(auth)/register')}
                >
                  <Ionicons name="person-add-outline" size={18} color="#10B981" />
                  <Text style={styles.registerButtonText}>
                    Create New Customer Account
                  </Text>
                </TouchableOpacity>

                {/* Direct Guest Browse */}
                <TouchableOpacity
                  style={styles.guestButton}
                  onPress={() => {
                    const guestUser = {
                      id: 'u_guest_shopper',
                      role: 'customer' as const,
                      name: 'Guest Customer',
                      email: 'guest@localmart.in',
                      phone: '+91 98480 12345',
                      address: 'Flat 402, Sai Balaji Residency, Banjara Hills, Hyderabad',
                      latitude: 17.4142,
                      longitude: 78.4335,
                      created_at: new Date().toISOString(),
                    };
                    setUser(guestUser);
                    setLocation(17.4142, 78.4335, guestUser.address);
                    router.replace('/(tabs)/home');
                  }}
                >
                  <Ionicons name="sparkles" size={18} color="#0284C7" />
                  <Text style={styles.guestButtonText}>
                    Continue as Guest (Browse Without Login)
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>Enter OTP</Text>
                <Text style={styles.cardDescription}>
                  We sent a 4-digit code to <Text style={{ fontWeight: '700', color: '#111827' }}>+91 {phone}</Text>
                </Text>

                {/* Demo OTP Banner for immediate testing */}
                <View style={styles.demoOtpBanner}>
                  <Ionicons name="key-outline" size={18} color="#059669" />
                  <Text style={styles.demoOtpText}>
                    Demo Test Code: <Text style={{ fontWeight: '800', color: '#059669' }}>{generatedOtp}</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.demoFillBtn}
                    onPress={() => setOtp(generatedOtp)}
                  >
                    <Text style={styles.demoFillBtnText}>Auto-Fill</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.otpInputContainer}>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="• • • •"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={otp}
                    onChangeText={setOtp}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleSendOtp}
                >
                  <Text style={styles.resendText}>Didn't receive code? Resend OTP</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Quick Demo Test Profiles */}
          <View style={styles.demoCard}>
            <Text style={styles.demoCardTitle}>Quick Demo Test Accounts (Different Locations):</Text>
            <View style={styles.demoPillsStack}>
              {PRESET_DEMO_CUSTOMERS.map(demo => (
                <TouchableOpacity
                  key={demo.id}
                  style={styles.demoProfileCard}
                  onPress={() => {
                    const clean = demo.phone.replace(/\D/g, '').slice(-10);
                    setPhone(clean);
                    setStep('otp');
                    setOtp('1234');
                    setGeneratedOtp('1234');
                  }}
                >
                  <View style={styles.demoProfileTop}>
                    <Ionicons name="person-circle" size={16} color="#059669" />
                    <Text style={styles.demoProfileName}>{demo.name}</Text>
                    <View style={styles.autoFillTag}>
                      <Text style={styles.autoFillTagText}>1-Tap Login</Text>
                    </View>
                  </View>
                  <Text style={styles.demoProfileLocation}>📍 {demo.address}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 18,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  countryCodeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#ECFDF5',
    borderRightWidth: 1,
    borderRightColor: '#A7F3D0',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  otpInputContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  otpInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 12,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  demoOtpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 8,
  },
  demoOtpText: {
    fontSize: 12,
    color: '#065F46',
    flex: 1,
  },
  demoFillBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  demoFillBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    gap: 8,
  },
  registerButtonText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
    gap: 8,
    marginTop: 10,
  },
  guestButtonText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
  },
  resendButton: {
    marginTop: 14,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },
  demoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoPillsStack: {
    gap: 8,
  },
  demoProfileCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoProfileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  demoProfileName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  autoFillTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  autoFillTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  demoProfileLocation: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  demoPillsRow: {
    gap: 8,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
});
