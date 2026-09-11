import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';

const OPENING_PRESETS = ['06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '09:00 AM'];
const CLOSING_PRESETS = ['09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'];

export default function SettingsScreen() {
  const router = useRouter();
  const { shops, activeShopkeeperShopId, setActiveShopkeeperShopId, toggleShopStatus, updateShop } = useShopStore();
  const { user, logout } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      useShopStore.getState().initialize();
      useAuthStore.getState().initialize();
    }, [])
  );

  const myShops = user
    ? shops.filter(s => s.owner_id === user.id || s.owner_email?.toLowerCase() === user.email?.toLowerCase())
    : shops;
  const activeShop = (myShops.length > 0 ? myShops.find(s => s.id === activeShopkeeperShopId) || myShops[0] : null)
    || shops.find(s => s.id === activeShopkeeperShopId) 
    || shops[0];

  useEffect(() => {
    if (activeShop && !activeShopkeeperShopId) {
      setActiveShopkeeperShopId(activeShop.id);
    }
  }, [activeShop, activeShopkeeperShopId]);

  // Timing Modal State
  const [timingModalVisible, setTimingModalVisible] = useState(false);
  const [is24HoursInput, setIs24HoursInput] = useState(false);
  const [openTimeInput, setOpenTimeInput] = useState('');
  const [closeTimeInput, setCloseTimeInput] = useState('');

  // Shop & Contact Edit Modal State
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [radiusInput, setRadiusInput] = useState('5');
  const [feeInput, setFeeInput] = useState('0');
  const [minOrderInput, setMinOrderInput] = useState('50');

  useEffect(() => {
    if (activeShop) {
      const is24 = !!activeShop.is_24_hours || activeShop.opening_time === '24 Hours' || (activeShop.opening_time === '00:00:00' && activeShop.closing_time === '23:59:59');
      setIs24HoursInput(is24);
      setOpenTimeInput(activeShop.opening_time || '07:00 AM');
      setCloseTimeInput(activeShop.closing_time || '10:30 PM');
      setNameInput(activeShop.name || '');
      setPhoneInput(activeShop.phone || '');
      setEmailInput(activeShop.owner_email || '');
      setDescInput(activeShop.description || '');
      setAddressInput(activeShop.address || '');
      setRadiusInput(String(activeShop.delivery_radius_km ?? 5));
      setFeeInput(String(activeShop.delivery_fee ?? 0));
      setMinOrderInput(String(activeShop.min_order_amount ?? 50));
    }
  }, [activeShop]);

  const handleOpenTimingEdit = () => {
    if (activeShop) {
      const is24 = !!activeShop.is_24_hours || activeShop.opening_time === '24 Hours' || (activeShop.opening_time === '00:00:00' && activeShop.closing_time === '23:59:59');
      setIs24HoursInput(is24);
      setOpenTimeInput(activeShop.opening_time || '07:00 AM');
      setCloseTimeInput(activeShop.closing_time || '10:30 PM');
      setTimingModalVisible(true);
    }
  };

  const handleOpenDetailsEdit = () => {
    if (activeShop) {
      setNameInput(activeShop.name || '');
      setPhoneInput(activeShop.phone || '');
      setEmailInput(activeShop.owner_email || '');
      setDescInput(activeShop.description || '');
      setAddressInput(activeShop.address || '');
      setRadiusInput(String(activeShop.delivery_radius_km ?? 5));
      setFeeInput(String(activeShop.delivery_fee ?? 0));
      setMinOrderInput(String(activeShop.min_order_amount ?? 50));
      setDetailsModalVisible(true);
    }
  };

  const handleSaveTimings = () => {
    if (!is24HoursInput && (!openTimeInput.trim() || !closeTimeInput.trim())) {
      Alert.alert('Missing Info', 'Please provide both opening and closing times.');
      return;
    }

    if (activeShop) {
      updateShop(activeShop.id, {
        is_24_hours: is24HoursInput,
        opening_time: is24HoursInput ? '24 Hours' : openTimeInput.trim(),
        closing_time: is24HoursInput ? '24 Hours' : closeTimeInput.trim(),
      });
      setTimingModalVisible(false);
      Alert.alert(
        'Timings Updated', 
        is24HoursInput 
          ? 'Store hours set to: 24 Hours Open (Always Open / 24/7)' 
          : `Store hours set to: ${openTimeInput.trim()} - ${closeTimeInput.trim()}`
      );
    }
  };

  const handleSaveDetails = () => {
    if (!nameInput.trim()) {
      Alert.alert('Missing Store Name', 'Please enter a shop name.');
      return;
    }
    if (!phoneInput.trim()) {
      Alert.alert('Missing Phone', 'Please enter a phone number.');
      return;
    }

    if (activeShop) {
      updateShop(activeShop.id, {
        name: nameInput.trim(),
        phone: phoneInput.trim(),
        owner_email: emailInput.trim() || activeShop.owner_email,
        description: descInput.trim(),
        address: addressInput.trim() || activeShop.address,
        delivery_radius_km: parseFloat(radiusInput) || 5,
        delivery_fee: parseFloat(feeInput) || 0,
        min_order_amount: parseFloat(minOrderInput) || 50,
      });
      setDetailsModalVisible(false);
      Alert.alert('Store Updated', 'Your shop and contact details have been saved successfully!');
    }
  };

  const Section = ({ title, rightAction, children }: { title: string, rightAction?: React.ReactNode, children: React.ReactNode }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {rightAction}
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const InfoRow = ({ label, value, icon, onPress }: { label: string, value: string, icon: any, onPress?: () => void }) => (
    <TouchableOpacity 
      style={styles.infoRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.infoRowLeft}>
        <Ionicons name={icon} size={18} color="#059669" style={styles.infoIcon} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <View style={styles.infoRowRight}>
        <Text style={styles.infoValue}>{value}</Text>
        {onPress && <Ionicons name="pencil" size={14} color="#10B981" style={{ marginLeft: 6 }} />}
      </View>
    </TouchableOpacity>
  );

  if (!activeShop) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="storefront-outline" size={54} color="#94A3B8" />
        <Text style={styles.emptyText}>No Store Registered</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.replace('/(auth)/login' as any)}>
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Register Your Store</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Header Bar */}
      <View style={styles.topTitleBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topTitleBarText}>Store Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Active Toggle Header */}
      <View style={styles.header}>
        <View style={styles.activeToggleContainer}>
          <View>
            <Text style={styles.activeToggleText}>Accepting Orders (Store Open)</Text>
            <Text style={styles.statusHelper}>
              {activeShop.is_active ? '✅ Store is OPEN on customer app.' : '❌ Store is CLOSED. No new customer orders.'}
            </Text>
          </View>
          <Switch
            value={activeShop.is_active}
            onValueChange={() => toggleShopStatus(activeShop.id)}
            trackColor={{ false: '#d1d5db', true: '#10B981' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Shop & Contact Details with Edit Button */}
      <Section 
        title="Shop & Contact Details"
        rightAction={
          <TouchableOpacity style={styles.editSectionBtn} onPress={handleOpenDetailsEdit}>
            <Ionicons name="pencil" size={13} color="#059669" />
            <Text style={styles.editSectionBtnText}>Edit Details</Text>
          </TouchableOpacity>
        }
      >
        <InfoRow icon="business" label="Shop Name" value={activeShop.name} onPress={handleOpenDetailsEdit} />
        <InfoRow icon="call" label="Phone" value={activeShop.phone} onPress={handleOpenDetailsEdit} />
        <InfoRow icon="mail" label="Owner Email" value={activeShop.owner_email || 'owner@example.com'} onPress={handleOpenDetailsEdit} />
        <InfoRow icon="location" label="Address" value={activeShop.address} onPress={handleOpenDetailsEdit} />
        <InfoRow icon="navigate" label="GPS" value={`${activeShop.latitude.toFixed(4)}, ${activeShop.longitude.toFixed(4)}`} onPress={handleOpenDetailsEdit} />
      </Section>

      {/* Operational Timings */}
      <Section 
        title="Operational Timings" 
        rightAction={
          <TouchableOpacity style={styles.editSectionBtn} onPress={handleOpenTimingEdit}>
            <Ionicons name="pencil" size={13} color="#059669" />
            <Text style={styles.editSectionBtnText}>Edit Hours</Text>
          </TouchableOpacity>
        }
      >
        <InfoRow 
          icon="time" 
          label="Store Schedule" 
          value={
            activeShop.is_24_hours || activeShop.opening_time === '24 Hours' 
              ? '⚡ 24 Hours (Always Open / 24/7)' 
              : `${activeShop.opening_time} - ${activeShop.closing_time}`
          } 
          onPress={handleOpenTimingEdit} 
        />
        {(!activeShop.is_24_hours && activeShop.opening_time !== '24 Hours') && (
          <>
            <InfoRow icon="sunny" label="Opening Time" value={activeShop.opening_time} onPress={handleOpenTimingEdit} />
            <InfoRow icon="moon" label="Closing Time" value={activeShop.closing_time} onPress={handleOpenTimingEdit} />
          </>
        )}
      </Section>

      {/* Delivery Preferences */}
      <Section 
        title="Delivery Preferences"
        rightAction={
          <TouchableOpacity style={styles.editSectionBtn} onPress={handleOpenDetailsEdit}>
            <Ionicons name="pencil" size={13} color="#059669" />
            <Text style={styles.editSectionBtnText}>Edit</Text>
          </TouchableOpacity>
        }
      >
        <InfoRow icon="map" label="Delivery Radius" value={`${activeShop.delivery_radius_km} km`} onPress={handleOpenDetailsEdit} />
        <InfoRow icon="bicycle" label="Delivery Fee" value={activeShop.delivery_fee === 0 ? 'FREE' : `₹${activeShop.delivery_fee}`} onPress={handleOpenDetailsEdit} />
        <InfoRow icon="cart" label="Min Order" value={`₹${activeShop.min_order_amount}`} onPress={handleOpenDetailsEdit} />
      </Section>

      {/* Action Buttons */}
      <TouchableOpacity 
        style={styles.editShopCta}
        onPress={handleOpenDetailsEdit}
      >
        <Ionicons name="create-outline" size={18} color="#FFFFFF" />
        <Text style={styles.editShopCtaText}>Edit Shop & Contact Details</Text>
      </TouchableOpacity>

      {/* Edit Shop Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="storefront" size={22} color="#10B981" />
                <Text style={styles.modalTitle}>Edit Shop & Contact</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Store / Shop Name *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Shop Name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  keyboardType="phone-pad"
                  placeholder="9848012345"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Owner Email</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  keyboardType="email-address"
                  placeholder="owner@localmart.in"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Street Address</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={addressInput}
                  onChangeText={setAddressInput}
                  placeholder="Road No 12, Banjara Hills, Hyderabad"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Description</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={descInput}
                  onChangeText={setDescInput}
                  placeholder="Neighborhood grocery store"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.modalInputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.modalInputLabel}>Delivery Radius (km)</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    value={radiusInput}
                    onChangeText={setRadiusInput}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={styles.modalInputLabel}>Delivery Fee (₹)</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    value={feeInput}
                    onChangeText={setFeeInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Min Order Amount (₹)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={minOrderInput}
                  onChangeText={setMinOrderInput}
                  keyboardType="numeric"
                  placeholder="50"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveDetails}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.modalSaveBtnText}>Save Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Timing Edit Modal */}
      <Modal
        visible={timingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTimingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="time" size={22} color="#10B981" />
                <Text style={styles.modalTitle}>Edit Store Timings</Text>
              </View>
              <TouchableOpacity onPress={() => setTimingModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Timing Mode Toggle */}
            <View style={styles.modalTimingModeContainer}>
              <View style={styles.modalTimingToggleRow}>
                <TouchableOpacity
                  style={[styles.modalTimingModeBtn, !is24HoursInput && styles.modalTimingModeBtnActive]}
                  onPress={() => setIs24HoursInput(false)}
                >
                  <Ionicons name="time-outline" size={15} color={!is24HoursInput ? '#FFFFFF' : '#4B5563'} />
                  <Text style={[styles.modalTimingModeBtnText, !is24HoursInput && styles.modalTimingModeBtnTextActive]}>
                    Custom Hours
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalTimingModeBtn, is24HoursInput && styles.modalTimingModeBtnActive]}
                  onPress={() => setIs24HoursInput(true)}
                >
                  <Ionicons name="flash" size={15} color={is24HoursInput ? '#FFFFFF' : '#4B5563'} />
                  <Text style={[styles.modalTimingModeBtnText, is24HoursInput && styles.modalTimingModeBtnTextActive]}>
                    24 Hours (Open 24/7)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {is24HoursInput ? (
              <View style={styles.alwaysOpenModalCard}>
                <Ionicons name="checkmark-circle" size={26} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alwaysOpenModalTitle}>Always Open (24/7 Mode)</Text>
                  <Text style={styles.alwaysOpenModalSub}>
                    Your store will be visible as Open 24 Hours on the customer storefront. Customers can order round the clock!
                  </Text>
                </View>
              </View>
            ) : (
              <View>
                {/* Opening Time Input */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>Store Opening Time</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="e.g. 07:00 AM"
                    value={openTimeInput}
                    onChangeText={setOpenTimeInput}
                    placeholderTextColor="#94A3B8"
                  />
                  <Text style={styles.presetLabel}>Quick Select Opening:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 6, marginVertical: 4 }}>
                    {OPENING_PRESETS.map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        style={[styles.presetPill, openTimeInput === preset && styles.presetPillActive]}
                        onPress={() => setOpenTimeInput(preset)}
                      >
                        <Text style={[styles.presetPillText, openTimeInput === preset && styles.presetPillTextActive]}>
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Closing Time Input */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>Store Closing Time</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="e.g. 10:30 PM"
                    value={closeTimeInput}
                    onChangeText={setCloseTimeInput}
                    placeholderTextColor="#94A3B8"
                  />
                  <Text style={styles.presetLabel}>Quick Select Closing:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 6, marginVertical: 4 }}>
                    {CLOSING_PRESETS.map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        style={[styles.presetPill, closeTimeInput === preset && styles.presetPillActive]}
                        onPress={() => setCloseTimeInput(preset)}
                      >
                        <Text style={[styles.presetPillText, closeTimeInput === preset && styles.presetPillTextActive]}>
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Modal Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setTimingModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveTimings}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.modalSaveBtnText}>Save Timings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sign Out Button */}
      <TouchableOpacity 
        style={styles.signOutBtn}
        onPress={() => {
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const confirmed = window.confirm('Are you sure you want to sign out of your shopkeeper account?');
            if (confirmed) {
              logout();
              router.replace('/(auth)/login' as any);
            }
            return;
          }

          Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out of your shopkeeper account?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Sign Out', 
                style: 'destructive',
                onPress: () => {
                  logout();
                  router.replace('/(auth)/login' as any);
                }
              }
            ]
          );
        }}
      >
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.signOutBtnText}>Sign Out of Store</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 12,
    marginTop: 8,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  topTitleBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topTitleBarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 12,
  },
  activeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeToggleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusHelper: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  section: {
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 10,
  },
  editShopCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  editShopCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  editSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  editSectionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  infoRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalCardLarge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalInputGroup: {
    marginBottom: 12,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
    marginBottom: 2,
  },
  presetPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  presetPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  presetPillTextActive: {
    color: '#FFFFFF',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  modalSaveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  modalTimingModeContainer: {
    marginBottom: 14,
  },
  modalTimingToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  modalTimingModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  modalTimingModeBtnActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  modalTimingModeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalTimingModeBtnTextActive: {
    color: '#FFFFFF',
  },
  alwaysOpenModalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginVertical: 10,
  },
  alwaysOpenModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  alwaysOpenModalSub: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16,
  },
});
