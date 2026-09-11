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

export default function CustomerRegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { setLocation } = useLocationStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [area, setArea] = useState('Banjara Hills, Hyderabad');
  const [pincode, setPincode] = useState('500034');

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('1234');
  const [loading, setLoading] = useState(false);

  const handleProceedToOtp = () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your Full Name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Required Field', 'Please enter a valid 10-digit phone number.');
      return;
    }
    if (!streetAddress.trim()) {
      Alert.alert('Required Field', 'Please enter your delivery street/house address.');
      return;
    }

    setLoading(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);

    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 600);
  };

  const handleCompleteRegistration = async () => {
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
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = `+91 ${cleanPhone.slice(-10, -5)} ${cleanPhone.slice(-5)}`;
      const fullAddress = `${streetAddress.trim()}, ${area.trim()} - ${pincode.trim()}`;

      const newCustomer: User = {
        id: `u_cust_${Date.now()}`,
        role: 'customer',
        name: fullName.trim(),
        email: email.trim() || `cust_${cleanPhone.slice(-4)}@localmart.in`,
        phone: formattedPhone,
        address: fullAddress,
        latitude: 17.4142,
        longitude: 78.4335,
        created_at: new Date().toISOString(),
      };

      // Store in registered customer list
      const stored = await AsyncStorage.getItem(STORAGE_KEY_CUSTOMERS);
      let registeredCustomers: User[] = stored ? JSON.parse(stored) : [];
      registeredCustomers = registeredCustomers.filter(
        c => !c.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-10))
      );
      registeredCustomers.push(newCustomer);
      await AsyncStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(registeredCustomers));

      // Set active user & location
      setUser(newCustomer);
      setLocation(17.4142, 78.4335, fullAddress);

      setLoading(false);
      Alert.alert('Welcome to LocalMart! 🎉', 'Your customer account is ready. Happy shopping!');
      router.replace('/(tabs)/home');
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', 'Could not complete registration. Please try again.');
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
            <TouchableOpacity
              onPress={() => (step === 'otp' ? setStep('form') : router.back())}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Customer Registration</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.card}>
            {step === 'form' ? (
              <>
                <Text style={styles.cardTitle}>Create Your Account</Text>
                <Text style={styles.cardDescription}>
                  Join LocalMart to order groceries and daily essentials directly from neighborhood stores.
                </Text>

                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Siddharth Rao"
                      placeholderTextColor="#94A3B8"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mobile Phone Number *</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.prefixText}>🇮🇳 +91</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="10-digit mobile number"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address (Optional)</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. siddharth@example.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                {/* Delivery Street Address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Delivery Address (Flat / House No / Street) *</Text>
                  <View style={[styles.inputWrapper, { alignItems: 'flex-start' }]}>
                    <Ionicons name="home-outline" size={18} color="#64748B" style={[styles.inputIcon, { marginTop: 12 }]} />
                    <TextInput
                      style={[styles.input, { minHeight: 60, textAlignVertical: 'top', paddingTop: 10 }]}
                      placeholder="e.g. Flat 304, Green Heights, Road No. 10"
                      placeholderTextColor="#94A3B8"
                      multiline
                      value={streetAddress}
                      onChangeText={setStreetAddress}
                    />
                  </View>
                </View>

                {/* Area & Pincode */}
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
                    <Text style={styles.label}>Area / City</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={area}
                        onChangeText={setArea}
                      />
                    </View>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Pincode</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={pincode}
                        onChangeText={setPincode}
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleProceedToOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Verify Phone & Register</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Back to Login */}
                <TouchableOpacity
                  style={styles.loginLink}
                  onPress={() => router.push('/(auth)/login')}
                >
                  <Text style={styles.loginLinkText}>
                    Already registered? <Text style={{ color: '#10B981', fontWeight: '800' }}>Sign In here</Text>
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>Verify Mobile Number</Text>
                <Text style={styles.cardDescription}>
                  Enter the 4-digit verification code sent to <Text style={{ fontWeight: '700', color: '#111827' }}>+91 {phone}</Text>
                </Text>

                {/* Demo OTP Helper */}
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
                  onPress={handleCompleteRegistration}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Complete Registration</Text>
                      <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.loginLink}
                  onPress={() => setStep('form')}
                >
                  <Text style={styles.loginLinkText}>← Edit Registration Details</Text>
                </TouchableOpacity>
              </>
            )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
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
    marginBottom: 18,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  prefixText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
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
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 13,
    color: '#64748B',
  },
  otpInputContainer: {
    alignItems: 'center',
    marginVertical: 16,
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
    marginBottom: 12,
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
});
