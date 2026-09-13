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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/stores/authStore';

export default function DeveloperLoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('admin@localmart.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleLogin = (isQuick = false) => {
    if (!isQuick) {
      if (!email.trim() || !password.trim()) {
        showAlert('Required Fields', 'Please enter your developer credentials.');
        return;
      }
    }

    setLoading(true);
    setTimeout(() => {
      setUser({
        id: 'u_developer_admin',
        role: 'developer',
        name: 'Lead Engineer (Admin)',
        email: email.trim() || 'admin@localmart.com',
        phone: '+91 99999 88888',
        address: 'LocalMart Cloud Operations HQ, Hyderabad',
        latitude: 17.4142,
        longitude: 78.4335,
        created_at: new Date().toISOString(),
      });
      setLoading(false);
      router.replace('/dashboard' as any);
    }, 400);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Developer Header Badge */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="terminal" size={40} color="#10B981" />
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text style={styles.badgeText}>SUPERUSER ADMIN CONSOLE</Text>
              </View>
            </View>
            <Text style={styles.title}>LocalMart Developer</Text>
            <Text style={styles.subtitle}>
              Mission control & multi-app ecosystem switcher for Customer, Shopkeeper & Delivery services.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Developer Authentication</Text>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Developer ID / Email</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-circle-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="admin@localmart.com"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Access Key / Password</Text>
              <View style={styles.inputBox}>
                <Ionicons name="key-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => handleLogin(false)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#0F172A" />
                  <Text style={styles.loginBtnText}>Unlock Control Tower</Text>
                </>
              )}
            </TouchableOpacity>

            {/* 1-Click Quick Access Button */}
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => handleLogin(true)}
            >
              <Ionicons name="flash" size={18} color="#10B981" />
              <Text style={styles.quickBtnText}>⚡ 1-Click Instant Developer Access</Text>
            </TouchableOpacity>
          </View>

          {/* Cloud Sync Status Notice */}
          <View style={styles.cloudNotice}>
            <Ionicons name="cloud-done-outline" size={20} color="#38BDF8" />
            <Text style={styles.cloudNoticeText}>
              Target Server: <Text style={{ fontWeight: '700', color: '#E2E8F0' }}>localmart-sync-api.onrender.com</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeRow: {
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    height: '100%',
  },
  eyeIcon: {
    padding: 6,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 48,
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  loginBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    height: 44,
    marginTop: 12,
  },
  quickBtnText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
  },
  cloudNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    padding: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  cloudNoticeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
