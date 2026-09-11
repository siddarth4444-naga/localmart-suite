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
import { useAuthStore } from '../../src/stores/authStore';
import { User } from '../../src/types';

export default function DeliveryLoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [name, setName] = useState('Ravi Kumar');
  const [phone, setPhone] = useState('9848099887');
  const [vehicle, setVehicle] = useState('TS 09 AB 1234');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your Full Name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Required', 'Please enter a 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const deliveryUser: User = {
        id: `dp_${cleanPhone.slice(-6)}`,
        role: 'delivery',
        name: name.trim(),
        email: `${name.toLowerCase().replace(/\s+/g, '')}@localmart.in`,
        phone: `+91 ${cleanPhone.slice(-10, -5)} ${cleanPhone.slice(-5)}`,
        vehicle_type: 'Motorcycle',
        vehicle_number: vehicle.trim() || 'TS 09 AB 1234',
        created_at: new Date().toISOString(),
      };

      setUser(deliveryUser);
      setLoading(false);
      router.replace('/(tabs)/deliveries');
    }, 600);
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
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoBadge}>
              <Ionicons name="bicycle" size={34} color="#FFFFFF" />
            </View>
            <Text style={styles.appTitle}>LocalMart Delivery Partner</Text>
            <Text style={styles.appSubtitle}>
              Pick up orders from local shops and deliver fresh groceries to customers
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rider / Partner Sign In</Text>
            <Text style={styles.cardDescription}>
              Sign in to accept pickups and track your deliveries in real-time
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rider Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ravi Kumar"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Phone Number</Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Number (Bike / Scooter)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="bicycle-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. TS 09 AB 1234"
                  placeholderTextColor="#94A3B8"
                  value={vehicle}
                  onChangeText={setVehicle}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Start Delivering</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Demo Rider Switcher */}
          <View style={styles.demoCard}>
            <Text style={styles.demoCardTitle}>Demo Delivery Partners:</Text>
            {[
              { name: 'Ravi Kumar', phone: '9848099887', vehicle: 'TS 09 AB 1234' },
              { name: 'Suresh Reddy', phone: '9876501234', vehicle: 'TS 10 CD 5678' },
            ].map(demo => (
              <TouchableOpacity
                key={demo.phone}
                style={styles.demoPill}
                onPress={() => {
                  setName(demo.name);
                  setPhone(demo.phone);
                  setVehicle(demo.vehicle);
                }}
              >
                <Ionicons name="flash" size={14} color="#0284C7" />
                <Text style={styles.demoPillText}>{demo.name} • {demo.vehicle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  appTitle: {
    fontSize: 22,
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
    padding: 22,
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
    marginBottom: 18,
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
    color: '#0369A1',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#0284C7',
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
  demoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  demoCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  demoPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
});
