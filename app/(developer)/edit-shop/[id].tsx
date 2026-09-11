import React, { useState, useEffect } from 'react';
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

import { useShopStore } from '../../../src/stores/shopStore';

export default function EditShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { shops, updateShop, deleteShop } = useShopStore();

  const shop = shops.find(s => s.id === id);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [minOrder, setMinOrder] = useState('50');
  const [is24Hours, setIs24Hours] = useState(false);
  const [openingTime, setOpeningTime] = useState('07:00 AM');
  const [closingTime, setClosingTime] = useState('10:30 PM');
  const [detectingGps, setDetectingGps] = useState(false);

  useEffect(() => {
    if (shop) {
      setName(shop.name);
      setPhone(shop.phone || '');
      setOwnerEmail(shop.owner_email || '');
      setDescription(shop.description || '');
      setAddress(shop.address);
      setLatitude(shop.latitude.toString());
      setLongitude(shop.longitude.toString());
      setDeliveryFee(shop.delivery_fee.toString());
      setMinOrder(shop.min_order_amount.toString());
      const is24 = !!shop.is_24_hours || shop.opening_time === '24 Hours' || (shop.opening_time === '00:00:00' && shop.closing_time === '23:59:59');
      setIs24Hours(is24);
      setOpeningTime(shop.opening_time || '07:00 AM');
      setClosingTime(shop.closing_time || '10:30 PM');
    }
  }, [shop]);

  if (!shop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Shop not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleDeleteShop = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(`Delete Shop: Are you sure you want to delete "${shop.name}"? All its products will also be removed.`);
      if (confirmed) {
        deleteShop(shop.id);
        router.back();
      }
      return;
    }

    Alert.alert(
      'Delete Shop',
      `Are you sure you want to delete "${shop.name}"? All its products will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            deleteShop(shop.id);
            router.back();
          } 
        }
      ]
    );
  };

  const handleDetectGps = async () => {
    try {
      setDetectingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permission to detect GPS.');
        setDetectingGps(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(loc.coords.latitude.toFixed(6));
      setLongitude(loc.coords.longitude.toFixed(6));

      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo) {
        setAddress([geo.name, geo.street, geo.district, geo.city].filter(Boolean).join(', '));
      }
    } catch (e) {
      Alert.alert('GPS Error', 'Could not detect location.');
    } finally {
      setDetectingGps(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Shop name is required');
      return;
    }

    updateShop(shop.id, {
      name: name.trim(),
      phone: phone.trim(),
      owner_email: ownerEmail.trim(),
      description: description.trim(),
      address: address.trim(),
      latitude: parseFloat(latitude) || shop.latitude,
      longitude: parseFloat(longitude) || shop.longitude,
      delivery_fee: parseFloat(deliveryFee) || 0,
      min_order_amount: parseFloat(minOrder) || 50,
      is_24_hours: is24Hours,
      opening_time: is24Hours ? '24 Hours' : openingTime.trim(),
      closing_time: is24Hours ? '24 Hours' : closingTime.trim(),
    });

    Alert.alert('Success', 'Shop details updated successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Top Header */}
          <View style={styles.topHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.pageTitle}>Edit Shop Profile</Text>
              <Text style={styles.pageSubtitle} numberOfLines={1}>{shop.name}</Text>
            </View>
          </View>

          {/* Details Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Shop & Owner Profile</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shop Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Owner Email</Text>
                <TextInput
                  style={styles.input}
                  value={ownerEmail}
                  onChangeText={setOwnerEmail}
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* Location & GPS */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Location & GPS</Text>

            <TouchableOpacity 
              style={styles.gpsBtn}
              onPress={handleDetectGps}
              disabled={detectingGps}
            >
              {detectingGps ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="locate" size={16} color="#FFFFFF" />
                  <Text style={styles.gpsBtnText}>Update GPS to Current Location</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Latitude</Text>
                <TextInput
                  style={styles.input}
                  value={latitude}
                  onChangeText={setLatitude}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Longitude</Text>
                <TextInput
                  style={styles.input}
                  value={longitude}
                  onChangeText={setLongitude}
                />
              </View>
            </View>
          </View>

          {/* Operational Hours */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Operational Timings</Text>

            {/* Timing Mode Selection */}
            <View style={styles.timingModeContainer}>
              <View style={styles.timingToggleRow}>
                <TouchableOpacity
                  style={[styles.timingModeBtn, !is24Hours && styles.timingModeBtnActive]}
                  onPress={() => setIs24Hours(false)}
                >
                  <Ionicons name="time-outline" size={16} color={!is24Hours ? '#FFFFFF' : '#4B5563'} />
                  <Text style={[styles.timingModeBtnText, !is24Hours && styles.timingModeBtnTextActive]}>
                    Custom Hours
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.timingModeBtn, is24Hours && styles.timingModeBtnActive]}
                  onPress={() => setIs24Hours(true)}
                >
                  <Ionicons name="flash" size={16} color={is24Hours ? '#FFFFFF' : '#4B5563'} />
                  <Text style={[styles.timingModeBtnText, is24Hours && styles.timingModeBtnTextActive]}>
                    24 Hours (Open 24/7)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {is24Hours ? (
              <View style={styles.alwaysOpenCard}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alwaysOpenTitle}>Open 24/7 (24 Hours Always Open)</Text>
                  <Text style={styles.alwaysOpenSub}>
                    Store operates continuously day and night. Customers can place orders at any time.
                  </Text>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Opening Time</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="07:00 AM"
                      value={openingTime}
                      onChangeText={setOpeningTime}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Closing Time</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="10:30 PM"
                      value={closingTime}
                      onChangeText={setClosingTime}
                    />
                  </View>
                </View>

                {/* Quick Presets */}
                <View style={styles.timingPresetRow}>
                  <Text style={styles.presetLabel}>Presets:</Text>
                  {[
                    { label: '6 AM - 10 PM', open: '06:00 AM', close: '10:00 PM' },
                    { label: '7 AM - 11 PM', open: '07:00 AM', close: '11:00 PM' },
                    { label: '8 AM - 10:30 PM', open: '08:00 AM', close: '10:30 PM' },
                  ].map((p, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.timingPresetChip}
                      onPress={() => {
                        setOpeningTime(p.open);
                        setClosingTime(p.close);
                      }}
                    >
                      <Text style={styles.timingPresetChipText}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Delivery Settings */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Delivery Settings</Text>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Delivery Fee (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={deliveryFee}
                  onChangeText={setDeliveryFee}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Min Order (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={minOrder}
                  onChangeText={setMinOrder}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteShop}>
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text style={styles.deleteBtnText}>Delete This Shop</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 16,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 12,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  gpsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 40,
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  timingModeContainer: {
    marginBottom: 14,
  },
  timingToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  timingModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  timingModeBtnActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  timingModeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  timingModeBtnTextActive: {
    color: '#FFFFFF',
  },
  alwaysOpenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginTop: 4,
  },
  alwaysOpenTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  alwaysOpenSub: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16,
  },
  timingPresetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  timingPresetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timingPresetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
});
