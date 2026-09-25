import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { useAuthStore } from '../../src/stores/authStore';
import { useLocationStore } from '../../src/stores/locationStore';
import { authService } from '../../src/services/authService';

export default function CustomerOnboardingScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const { setUser } = useAuthStore();
  const { setLocation } = useLocationStore();

  // Personal Info State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');

  // Address State
  const [flatNumber, setFlatNumber] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [cityPincode, setCityPincode] = useState('Hyderabad, Telangana');
  const [addressType, setAddressType] = useState<'home' | 'work' | 'other'>('home');

  // GPS State
  const [latitude, setLatitude] = useState<number>(17.4142);
  const [longitude, setLongitude] = useState<number>(78.4335);
  const [detectingGps, setDetectingGps] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch Live GPS Location & Autofill Address
  const handleDetectGps = async () => {
    try {
      setDetectingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permission to auto-detect your delivery address.');
        setDetectingGps(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const currentLat = loc.coords.latitude;
      const currentLng = loc.coords.longitude;
      setLatitude(currentLat);
      setLongitude(currentLng);

      // Reverse geocode to get street / area details
      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: currentLat,
          longitude: currentLng,
        });

        if (geo) {
          if (geo.street || geo.name) {
            setStreetArea([geo.name, geo.street, geo.district].filter(Boolean).join(', '));
          }
          if (geo.city || geo.postalCode) {
            setCityPincode([geo.city || geo.subregion, geo.postalCode, geo.region].filter(Boolean).join(' - '));
          }
        }
      } catch (geoErr) {
        console.log('Geocoding error:', geoErr);
      }
    } catch (err) {
      console.log('GPS error:', err);
      Alert.alert('GPS Error', 'Could not detect location. Please fill in your address manually.');
    } finally {
      setDetectingGps(false);
    }
  };

  // Validate and Complete Registration
  const handleCompleteSetup = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!flatNumber.trim() && !streetArea.trim()) {
      Alert.alert('Missing Address', 'Please provide your delivery address (House/Flat & Street/Area) so local shops can deliver your order.');
      return;
    }

    setSaving(true);

    const fullAddress = [
      flatNumber.trim(),
      streetArea.trim(),
      cityPincode.trim()
    ].filter(Boolean).join(', ');

    const newUser = {
      id: `u_${Date.now()}`,
      role: 'customer' as const,
      name: name.trim(),
      email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone: phone || '+91 9848012345',
      age: age ? parseInt(age, 10) : undefined,
      address: fullAddress,
      address_type: addressType,
      latitude: latitude,
      longitude: longitude,
      created_at: new Date().toISOString(),
    };

    // Save to Zustand stores
    setUser(newUser);
    setLocation(latitude, longitude, fullAddress);

    // Send Automated Welcome Email
    authService.sendWelcomeNotificationEmail(newUser.email, newUser.name, 'customer').catch(() => {});

    setTimeout(() => {
      setSaving(false);
      Alert.alert(
        `Welcome to LocalMart, ${newUser.name}! 🎉`,
        `Your delivery address has been set to: ${fullAddress}. You can now order from nearby local shops!`,
        [
          {
            text: 'Start Shopping',
            onPress: () => router.replace('/(customer)/(tabs)/home')
          }
        ]
      );
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>STEP 2 OF 2 • PROFILE SETUP</Text>
            </View>
            <Text style={styles.title}>Complete your profile</Text>
            <Text style={styles.subtitle}>
              Set up your details & delivery address to receive fast deliveries from local shops.
            </Text>
          </View>

          {/* SECTION 1: PERSONAL DETAILS */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="person-circle" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Personal Details</Text>
            </View>

            {/* Phone (Read Only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number (Verified)</Text>
              <View style={[styles.inputWrapper, styles.inputDisabled]}>
                <Ionicons name="call" size={18} color="#059669" style={styles.inputIcon} />
                <Text style={styles.disabledText}>{phone || '+91 98480 12345'}</Text>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginLeft: 'auto' }} />
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Age & Email Row */}
            <View style={styles.rowTwoInputs}>
              {/* Age */}
              <View style={[styles.inputGroup, { flex: 0.35 }]}>
                <Text style={styles.inputLabel}>Age</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 28"
                    keyboardType="number-pad"
                    maxLength={3}
                    value={age}
                    onChangeText={setAge}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={[styles.inputGroup, { flex: 0.65 }]}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="ramesh@gmail.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* SECTION 2: DELIVERY ADDRESS SETUP */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="location" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Where should we deliver?</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Shops use this exact address to calculate distance and deliver groceries to your door.
            </Text>

            {/* Detect GPS Button */}
            <TouchableOpacity 
              style={styles.gpsDetectButton}
              onPress={handleDetectGps}
              disabled={detectingGps}
            >
              {detectingGps ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="locate" size={18} color="#FFFFFF" />
                  <Text style={styles.gpsDetectButtonText}>Use Current GPS Location</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Flat / House No */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>House / Flat / Floor / Building <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="home-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Flat 302, Sai Balaji Residency"
                  value={flatNumber}
                  onChangeText={setFlatNumber}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Street / Area / Landmark */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street / Locality / Landmark <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="navigate-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Road No. 12, Near Metro Station"
                  value={streetArea}
                  onChangeText={setStreetArea}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* City & Pincode */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City & Pincode</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Hyderabad - 500034"
                  value={cityPincode}
                  onChangeText={setCityPincode}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Address Type Tag (Home / Work / Other) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Save Address As</Text>
              <View style={styles.tagRow}>
                {[
                  { key: 'home', label: 'Home', icon: 'home' },
                  { key: 'work', label: 'Work', icon: 'briefcase' },
                  { key: 'other', label: 'Other', icon: 'location' }
                ].map(item => {
                  const isSelected = addressType === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.typePill, isSelected && styles.typePillActive]}
                      onPress={() => setAddressType(item.key as any)}
                    >
                      <Ionicons 
                        name={item.icon as any} 
                        size={15} 
                        color={isSelected ? '#FFFFFF' : '#4B5563'} 
                      />
                      <Text style={[styles.typePillText, isSelected && styles.typePillTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, saving && { opacity: 0.8 }]}
            onPress={handleCompleteSetup}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Save & Start Ordering</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 12,
    marginBottom: 20,
  },
  stepBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 14,
  },
  gpsDetectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  gpsDetectButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  disabledText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  rowTwoInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typePillActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  typePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
