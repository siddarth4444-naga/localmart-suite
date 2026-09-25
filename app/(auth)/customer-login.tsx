import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { authService } from '../../src/services/authService';

export default function CustomerLoginScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [showSmsBanner, setShowSmsBanner] = useState(false);

  const otpInputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // OTP Countdown Timer
  useEffect(() => {
    let interval: any;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Handle Send OTP
  const handleSendOtp = async () => {
    const cleanPhone = phone.trim();
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.sendOTP({ phone: cleanPhone, digits: 4 });
      const code = res.otp || Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setStep('otp');
      setTimer(30);
      setOtp(['', '', '', '']);
      setShowSmsBanner(true);
    } catch (e) {
      const fallback = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(fallback);
      setStep('otp');
      setTimer(30);
      setOtp(['', '', '', '']);
      setShowSmsBanner(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Input change
  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto focus next input
    if (text.length === 1 && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  // Handle KeyPress for Backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  // Auto-fill OTP from Banner
  const handleAutoFillOtp = () => {
    if (generatedOtp.length === 4) {
      const split = generatedOtp.split('');
      setOtp(split);
      otpInputRefs[3].current?.focus();
    }
  };

  // Verify OTP & Navigate
  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) {
      Alert.alert('Incomplete OTP', 'Please enter all 4 digits of the OTP.');
      return;
    }

    setLoading(true);
    const cleanPhone = phone.trim();
    const verifyRes = await authService.verifyOTP(cleanPhone, enteredOtp);

    const isMatch = (verifyRes && verifyRes.success) || enteredOtp === generatedOtp || enteredOtp === '1234';

    if (!isMatch) {
      setLoading(false);
      Alert.alert('Invalid OTP', `The OTP you entered is incorrect. Please enter ${generatedOtp} or use 1234.`);
      return;
    }

    setTimeout(() => {
      setLoading(false);
      // Check if user is returning with the same phone number
      if (user && user.phone === `+91 ${cleanPhone}` && user.name && user.address) {
        router.replace('/(customer)/(tabs)/home');
      } else {
        // Navigate to onboarding to collect Name, Age, Email & Delivery Address
        router.push({
          pathname: '/(auth)/customer-onboarding' as any,
          params: { phone: `+91 ${cleanPhone}` }
        });
      }
    }, 400);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* SMS Simulation Banner (Zepto/Blinkit style OTP preview) */}
      {showSmsBanner && step === 'otp' && (
        <TouchableOpacity 
          style={styles.smsNotificationCard} 
          activeOpacity={0.9}
          onPress={handleAutoFillOtp}
        >
          <View style={styles.smsIconCircle}>
            <Ionicons name="chatbox-ellipses" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.smsTextWrapper}>
            <View style={styles.smsHeaderRow}>
              <Text style={styles.smsSender}>MESSAGES • LOCALMART</Text>
              <Text style={styles.smsTapAutofill}>Tap to Autofill</Text>
            </View>
            <Text style={styles.smsBody}>
              Your LocalMart verification code is <Text style={styles.smsCode}>{generatedOtp}</Text>. Valid for 10 minutes.
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (step === 'otp') {
              setStep('phone');
              setShowSmsBanner(false);
            } else {
              router.back();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        {step === 'phone' ? (
          /* STEP 1: PHONE NUMBER INPUT */
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                <Ionicons name="basket" size={24} color="#10B981" />
                <Text style={styles.logoBadgeText}>LocalMart Quick Delivery</Text>
              </View>
              <Text style={styles.title}>Enter your phone number</Text>
              <Text style={styles.subtitle}>
                We will send an SMS with a 4-digit verification code to connect with your local shops.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <View style={styles.prefixContainer}>
                  <Text style={styles.flagEmoji}>🇮🇳</Text>
                  <Text style={styles.prefix}>+91</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10 digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                />
                {phone.length === 10 && (
                  <View style={styles.validCheck}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.buttonActive,
                  loading && { opacity: 0.8 }
                ]}
                onPress={() => {
                  useAuthStore.getState().setUser({
                    id: 'u_customer_1',
                    role: 'customer',
                    name: 'Ramesh Kumar',
                    email: 'ramesh.kumar@example.com',
                    phone: phone.length === 10 ? `+91 ${phone}` : '+91 98480 12345',
                    age: 28,
                    address: 'Flat 402, Sai Residency, Banjara Hills, Hyderabad',
                    latitude: 17.4142,
                    longitude: 78.4335,
                    created_at: new Date().toISOString(),
                  });
                  router.replace('/(customer)/(tabs)/home');
                }}
              >
                <Text style={styles.buttonText}>⚡ Enter App & Start Testing</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.termsWrapper}>
              <Text style={styles.termsText}>
                By continuing, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> & <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        ) : (
          /* STEP 2: 4-DIGIT OTP VERIFICATION */
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Verify with OTP</Text>
              <View style={styles.phoneChangeRow}>
                <Text style={styles.subtitle}>
                  Sent code to <Text style={{ fontWeight: '700', color: '#111827' }}>+91 {phone}</Text>
                </Text>
                <TouchableOpacity onPress={() => setStep('phone')} style={styles.editPhoneBtn}>
                  <Text style={styles.editPhoneText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4 OTP Input Boxes */}
            <View style={styles.otpBoxesRow}>
              {otp.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={otpInputRefs[idx]}
                  style={[
                    styles.otpBox, 
                    digit ? styles.otpBoxFilled : null,
                    otpInputRefs[idx].current?.isFocused() ? styles.otpBoxFocused : null
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, idx)}
                  onKeyPress={(e) => handleKeyPress(e, idx)}
                  selectTextOnFocus
                  autoFocus={idx === 0}
                />
              ))}
            </View>

            {/* Verify Button */}
            <TouchableOpacity 
              style={[
                styles.button, 
                otp.join('').length === 4 ? styles.buttonActive : null,
                loading && { opacity: 0.8 }
              ]}
              onPress={handleVerifyOtp}
              disabled={otp.join('').length !== 4 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Verify & Continue</Text>
              )}
            </TouchableOpacity>

            {/* Resend Timer */}
            <View style={styles.resendContainer}>
              {timer > 0 ? (
                <Text style={styles.timerText}>
                  Resend OTP in <Text style={{ fontWeight: '700', color: '#10B981' }}>{timer}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleSendOtp}>
                  <Text style={styles.resendButtonText}>Resend OTP via SMS</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  smsNotificationCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#1F2937',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  smsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  smsTextWrapper: {
    flex: 1,
  },
  smsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  smsSender: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  smsTapAutofill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
  smsBody: {
    fontSize: 12,
    color: '#F9FAFB',
    lineHeight: 16,
  },
  smsCode: {
    fontWeight: '800',
    color: '#FBBF24',
    fontSize: 13,
  },
  keyboardView: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 28,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  logoBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  phoneChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  editPhoneBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
  },
  editPhoneText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  form: {
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  flagEmoji: {
    fontSize: 18,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    letterSpacing: 1,
  },
  validCheck: {
    paddingRight: 14,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
    gap: 12,
  },
  otpBox: {
    flex: 1,
    height: 60,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  otpBoxFilled: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  otpBoxFocused: {
    borderColor: '#059669',
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonActive: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerText: {
    fontSize: 13,
    color: '#6B7280',
  },
  resendButtonText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },
  termsWrapper: {
    marginTop: 'auto',
    paddingVertical: 16,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#10B981',
    fontWeight: '600',
  },
});
