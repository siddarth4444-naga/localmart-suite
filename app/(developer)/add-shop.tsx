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
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { useShopStore } from '../../src/stores/shopStore';
import { Shop } from '../../src/types';

const PRESET_TAGS = [
  'Kirana',
  'Fresh Veggies',
  'Organic Fruits',
  'Dairy & Milk',
  'Bakery & Breads',
  'Snacks & Munchies',
  'Atta & Rice',
  'Cold Drinks',
  'Spices & Dry Fruits',
  'Personal Care',
  'Pooja Items'
];

const PRESET_IMAGES = [
  { label: 'Grocery / Kirana', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80' },
  { label: 'Fresh Veggies', url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Dairy & Milk', url: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=600&q=80' },
  { label: 'Bakery Store', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
  { label: 'Supermarket', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80' },
  { label: 'Dry Fruits & Spices', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80' },
];

export default function AddShopScreen() {
  const router = useRouter();
  const { addShop } = useShopStore();

  // Form State
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  
  // Location
  const [address, setAddress] = useState('Banjara Hills, Road No. 12, Hyderabad');
  const [latitude, setLatitude] = useState('17.4142');
  const [longitude, setLongitude] = useState('78.4335');
  const [detectingGps, setDetectingGps] = useState(false);

  // Operations
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [minOrder, setMinOrder] = useState('50');
  const [deliveryRadius, setDeliveryRadius] = useState('5');
  const [is24Hours, setIs24Hours] = useState(false);
  const [openingTime, setOpeningTime] = useState('07:00 AM');
  const [closingTime, setClosingTime] = useState('10:30 PM');

  // Tags & Image
  const [selectedTags, setSelectedTags] = useState<string[]>(['Kirana', 'Atta & Rice']);
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGES[0].url);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  
  // Success Modal
  const [createdShop, setCreatedShop] = useState<Shop | null>(null);

  // GPS Auto-Detection
  const handleDetectGps = async () => {
    try {
      setDetectingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Note', 'Using default Hyderabad coordinates. You can also type your address manually.');
        setDetectingGps(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));

      // Reverse geocode
      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geo) {
          const fullAddr = [geo.name, geo.street, geo.subregion || geo.district, geo.city, geo.postalCode]
            .filter(Boolean)
            .join(', ');
          setAddress(fullAddr || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } catch (err) {
        setAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch (e) {
      console.log('GPS error:', e);
      Alert.alert('GPS Info', 'Could not detect exact location. Set default location coordinates.');
    } finally {
      setDetectingGps(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSaveShop = () => {
    const newErrors: { name?: string; phone?: string; address?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter the Shop Name';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Please enter the Shopkeeper phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Missing Details', 'Please enter the required shop name and phone number.');
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const latNum = parseFloat(latitude) || 17.4142;
      const lngNum = parseFloat(longitude) || 78.4335;
      const feeNum = parseFloat(deliveryFee) || 0;
      const minOrderNum = parseFloat(minOrder) || 50;
      const radiusNum = parseFloat(deliveryRadius) || 5;

      const shopResult = addShop({
        name: name.trim(),
        owner_email: ownerEmail.trim() || 'shopkeeper@localmart.in',
        phone: phone.trim(),
        description: description.trim() || 'Local neighborhood store with fast delivery',
        address: address.trim() || 'Local Area, Hyderabad',
        latitude: latNum,
        longitude: lngNum,
        delivery_fee: feeNum,
        min_order_amount: minOrderNum,
        delivery_radius_km: radiusNum,
        is_24_hours: is24Hours,
        opening_time: is24Hours ? '24 Hours' : openingTime.trim(),
        closing_time: is24Hours ? '24 Hours' : closingTime.trim(),
        cover_image_url: selectedImage,
        tags: selectedTags.length > 0 ? selectedTags : ['Local Store'],
        is_active: true,
        isOpen: true,
      });

      setSaving(false);
      setCreatedShop(shopResult);
    } catch (err: any) {
      setSaving(false);
      Alert.alert('Error', err?.message || 'Failed to save shop. Please try again.');
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.topHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.pageTitle}>Add Local Shop</Text>
              <Text style={styles.pageSubtitle}>Register new neighborhood store</Text>
            </View>
          </View>

          {/* Section 1: Shop & Shopkeeper Details */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="storefront" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Shop & Owner Information</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shop Name <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.name ? styles.inputError : null]}
                placeholder="e.g. Sri Venkateswara Kirana & General Store"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                }}
                placeholderTextColor="#9CA3AF"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Phone Number <Text style={styles.star}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.phone ? styles.inputError : null]}
                  placeholder="e.g. 9848012345"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  placeholderTextColor="#9CA3AF"
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={styles.label}>Owner Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="owner@gmail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={ownerEmail}
                  onChangeText={setOwnerEmail}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Short Description / Tagline</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Fresh Atta, Dal, Oils, Grains & Daily Spices"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Section 2: GPS Location Auto-Detection */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="location" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Shop Location & GPS Mapping</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Distance to nearby customers will be calculated dynamically from these coordinates.
            </Text>

            <TouchableOpacity 
              style={styles.gpsDetectBtn}
              onPress={handleDetectGps}
              disabled={detectingGps}
            >
              {detectingGps ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="locate" size={18} color="#FFFFFF" />
                  <Text style={styles.gpsDetectBtnText}>Auto-Detect Shop GPS Location</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shop Street Address / Locality <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.address ? styles.inputError : null]}
                placeholder="e.g. Shop #4, Road No. 12, Banjara Hills, Hyderabad"
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  if (errors.address) setErrors(prev => ({ ...prev, address: undefined }));
                }}
                placeholderTextColor="#9CA3AF"
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Latitude</Text>
                <TextInput
                  style={styles.input}
                  placeholder="17.4142"
                  keyboardType="numeric"
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Longitude</Text>
                <TextInput
                  style={styles.input}
                  placeholder="78.4335"
                  keyboardType="numeric"
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>

          {/* Section 3: Delivery & Timings */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="bicycle" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Delivery & Operational Settings</Text>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Delivery Fee (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  value={deliveryFee}
                  onChangeText={setDeliveryFee}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Min Order (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="50"
                  keyboardType="numeric"
                  value={minOrder}
                  onChangeText={setMinOrder}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Radius (km)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="5"
                  keyboardType="numeric"
                  value={deliveryRadius}
                  onChangeText={setDeliveryRadius}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Timing Mode Selection */}
            <View style={styles.timingModeContainer}>
              <Text style={styles.label}>Operating Hours Mode</Text>
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
                  <Text style={styles.alwaysOpenTitle}>Open 24/7 (24 Hours / Round the Clock)</Text>
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
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Closing Time</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="10:30 PM"
                      value={closingTime}
                      onChangeText={setClosingTime}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                {/* Quick Presets */}
                <View style={styles.timingPresetRow}>
                  <Text style={styles.presetLabel}>Quick Presets:</Text>
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

          {/* Section 4: Category Tags */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="pricetags" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Shop Category Tags</Text>
            </View>
            <View style={styles.tagsContainer}>
              {PRESET_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagPill, isSelected && styles.tagPillActive]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Ionicons 
                      name={isSelected ? "checkmark" : "add"} 
                      size={14} 
                      color={isSelected ? "#FFFFFF" : "#475569"} 
                    />
                    <Text style={[styles.tagPillText, isSelected && styles.tagPillTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 5: Store Cover Image */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="image" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Choose Store Banner</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
              {PRESET_IMAGES.map((img, idx) => {
                const isSelected = selectedImage === img.url;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.imageOption, isSelected && styles.imageOptionActive]}
                    onPress={() => setSelectedImage(img.url)}
                  >
                    <Text style={[styles.imageOptionLabel, isSelected && styles.imageOptionLabelActive]}>
                      {img.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, saving && { opacity: 0.8 }]}
            onPress={handleSaveShop}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Create & Publish Shop</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Interactive Success Modal */}
      {createdShop && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={42} color="#FFFFFF" />
              </View>
              <Text style={styles.modalTitle}>🎉 Shop Published!</Text>
              <Text style={styles.modalShopName}>{createdShop.name}</Text>
              <Text style={styles.modalSubtitle}>
                Your shop is now live across the Customer App and Shopkeeper Portal!
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnPrimary]}
                  onPress={() => {
                    const shopId = createdShop.id;
                    setCreatedShop(null);
                    router.replace(`/(developer)/manage-products/${shopId}` as any);
                  }}
                  activeOpacity={0.88}
                >
                  <Ionicons name="cube" size={20} color="#FFFFFF" />
                  <Text style={styles.modalBtnPrimaryText}>Add Items / Products Now</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnCustomer]}
                  onPress={() => {
                    setCreatedShop(null);
                    router.push('/(customer)/(tabs)/home');
                  }}
                  activeOpacity={0.88}
                >
                  <Ionicons name="cart" size={20} color="#FFFFFF" />
                  <Text style={styles.modalBtnCustomerText}>View in Customer App</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnSecondary]}
                  onPress={() => {
                    setCreatedShop(null);
                    router.back();
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.modalBtnSecondaryText}>Go to Developer Dashboard</Text>
                </TouchableOpacity>
              </View>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 16,
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  gpsDetectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
  star: {
    color: '#EF4444',
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
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '600',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tagPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  imagesRow: {
    gap: 10,
  },
  imageOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  imageOptionActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  imageOptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  imageOptionLabelActive: {
    color: '#059669',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
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
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
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
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalShopName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#059669',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modalBtnPrimary: {
    backgroundColor: '#10B981',
  },
  modalBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalBtnCustomer: {
    backgroundColor: '#2563EB',
  },
  modalBtnCustomerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalBtnSecondary: {
    backgroundColor: '#F1F5F9',
  },
  modalBtnSecondaryText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  timingModeContainer: {
    marginBottom: 12,
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

