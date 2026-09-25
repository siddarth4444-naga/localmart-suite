import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useCartStore } from '../../../src/stores/cartStore';
import { useLocationStore } from '../../../src/stores/locationStore';
import { useShopStore } from '../../../src/stores/shopStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { formatPrice, calculateDistance, formatDistance, getEstimatedTime, getPaymentMethodInfo } from '../../../src/lib/utils';
import { PaymentMethod } from '../../../src/types';

export default function CartScreen() {
  const router = useRouter();
  const { activeShopId, items, updateQuantity, clearCart, getSubtotal } = useCartStore();
  const { address, latitude, longitude } = useLocationStore();
  const { shops, addOrder } = useShopStore();
  const { user } = useAuthStore();

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('phonepe');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentProcessingStage, setPaymentProcessingStage] = useState<'processing' | 'success'>('processing');
  const [generatedTxnId, setGeneratedTxnId] = useState('');

  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const cartItems = activeShopId ? (items.get(activeShopId) || []) : [];
  const activeShop = activeShopId ? shops.find(s => s.id === activeShopId) : null;

  const userLat = latitude ?? 17.4150;
  const userLng = longitude ?? 78.4350;

  const distance = activeShop 
    ? calculateDistance(userLat, userLng, activeShop.latitude, activeShop.longitude)
    : 1.2;

  const subtotal = activeShopId ? getSubtotal(activeShopId) : 0;
  const deliveryFee = activeShop?.delivery_fee ?? 0;
  const handlingFee = subtotal > 0 ? 5 : 0;
  const total = subtotal > 0 ? subtotal + deliveryFee + handlingFee : 0;

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  // Format CVV (3 digits)
  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 3);
    setCardCvv(cleaned);
  };

  const processOrderPlacement = (paymentMethod: PaymentMethod, txnId?: string) => {
    const isOnline = paymentMethod !== 'cod';
    const isPaid = isOnline;

    const newOrder = addOrder({
      customer_id: user?.id || 'cust_1',
      customer_name: user?.name || 'Customer',
      customer_phone: user?.phone || '9876543210',
      customer_email: user?.email || 'customer@gmail.com',
      shop_id: activeShopId || '',
      subtotal,
      delivery_fee: deliveryFee,
      total,
      delivery_address: address || 'Banjara Hills, Hyderabad',
      delivery_lat: userLat,
      delivery_lng: userLng,
      payment_method: paymentMethod,
      payment_status: isPaid ? 'paid' : 'pending',
      payment_id: txnId || (isPaid ? `TXN_${Date.now().toString(36).toUpperCase()}` : undefined),
      payment_time: isPaid ? new Date().toISOString() : undefined,
      items: cartItems.map((ci, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        order_id: '',
        product_id: ci.product.id,
        product_name: ci.product.name,
        product_price: ci.product.price,
        product_image_url: ci.product.image_url,
        quantity: ci.quantity,
        total: ci.product.price * ci.quantity,
      })),
    });

    clearCart();
    setPlacingOrder(false);
    return newOrder;
  };

  const handleCheckout = () => {
    if (subtotal === 0) return;

    if (activeShop && subtotal < activeShop.min_order_amount) {
      Alert.alert(
        'Minimum Order Not Met',
        `Minimum order amount for ${activeShop.name} is ₹${activeShop.min_order_amount}. Please add more items.`
      );
      return;
    }

    if (selectedPayment === 'card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 16) {
        Alert.alert('Invalid Card', 'Please enter a valid 16-digit debit/credit card number.');
        return;
      }
      if (cardExpiry.length < 5) {
        Alert.alert('Invalid Expiry', 'Please enter valid expiry date in MM/YY format.');
        return;
      }
      if (cardCvv.length < 3) {
        Alert.alert('Invalid CVV', 'Please enter a valid 3-digit CVV.');
        return;
      }
    }

    if (selectedPayment === 'cod') {
      // Direct COD order placement
      setPlacingOrder(true);
      setTimeout(() => {
        processOrderPlacement('cod');
        Alert.alert(
          '🎉 Order Placed Successfully!',
          `Your Cash on Delivery order has been notified to ${activeShop?.name || 'the store'}. Pay ₹${total.toFixed(0)} upon arrival. Estimated delivery in ${getEstimatedTime(distance)}.`,
          [
            {
              text: 'Track Order ➔',
              onPress: () => router.push('/(customer)/(tabs)/orders')
            }
          ]
        );
      }, 700);
      return;
    }

    // Online Payments (PhonePe, GPay, Card) - Show Interactive Secure Payment Modal
    const prefix = selectedPayment === 'phonepe' ? 'PH' : selectedPayment === 'gpay' ? 'GP' : 'CARD';
    const txn = `TXN_${prefix}_${Math.floor(10000000 + Math.random() * 90000000)}`;
    setGeneratedTxnId(txn);
    setPaymentProcessingStage('processing');
    setPaymentModalVisible(true);

    // Simulate instant secure gateway verification
    setTimeout(() => {
      setPaymentProcessingStage('success');
      processOrderPlacement(selectedPayment, txn);
    }, 1800);
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={64} color="#10B981" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse nearby neighborhood shops and add your daily groceries!
          </Text>
          <TouchableOpacity 
            style={styles.browseButton} 
            onPress={() => router.push('/(customer)/(tabs)/home')}
          >
            <Text style={styles.browseButtonText}>Browse Nearby Shops</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Your Order</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearCartText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shop Info Card */}
        {activeShop && (
          <View style={styles.shopCard}>
            <View style={styles.shopIconCircle}>
              <Ionicons name="storefront" size={20} color="#059669" />
            </View>
            <View style={styles.shopTextWrapper}>
              <Text style={styles.shopOrderingFrom}>ORDERING FROM</Text>
              <Text style={styles.shopName}>{activeShop.name}</Text>
              <View style={styles.shopMetaRow}>
                <Ionicons name="navigate" size={12} color="#059669" />
                <Text style={styles.shopDistanceText}>{formatDistance(distance)} away</Text>
                <Text style={styles.dot}>•</Text>
                <Ionicons name="flash" size={12} color="#D97706" />
                <Text style={styles.shopTimeText}>{getEstimatedTime(distance)} delivery</Text>
              </View>
            </View>
          </View>
        )}

        {/* Delivery Address Card */}
        <View style={styles.addressCard}>
          <View style={styles.addressIconCircle}>
            <Ionicons name="location" size={18} color="#10B981" />
          </View>
          <View style={styles.addressTextWrapper}>
            <Text style={styles.addressLabel}>DELIVERY ADDRESS</Text>
            <Text style={styles.addressValue} numberOfLines={2}>
              {address || 'Home - Banjara Hills, Hyderabad'}
            </Text>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Items ({cartItems.length})</Text>
          {cartItems.map(item => (
            <View key={item.product.id} style={styles.itemRow}>
              <Image 
                source={{ uri: item.product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80' }} 
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.itemUnit}>{item.product.unit_value} {item.product.unit}</Text>
                <Text style={styles.itemPrice}>{formatPrice(item.product.price * item.quantity)}</Text>
              </View>

              {/* Stepper */}
              <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={styles.stepperBtn}
                  onPress={() => updateQuantity(item.product.id, activeShopId!, item.quantity - 1)}
                >
                  <Ionicons name="remove" size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.stepperCount}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={styles.stepperBtn}
                  onPress={() => updateQuantity(item.product.id, activeShopId!, item.quantity + 1)}
                >
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Bill Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee ({formatDistance(distance)})</Text>
            <Text style={styles.billValue}>
              {deliveryFee === 0 ? (
                <Text style={{ color: '#059669', fontWeight: '700' }}>FREE</Text>
              ) : (
                formatPrice(deliveryFee)
              )}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Handling / Packaging Fee</Text>
            <Text style={styles.billValue}>{formatPrice(handlingFee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* 💳 SELECT PAYMENT METHOD SECTION (PhonePe, GPay, Cards, COD) */}
        <View style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={styles.sectionHeader}>Select Payment Method</Text>
            <View style={styles.secureBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#059669" />
              <Text style={styles.secureBadgeText}>100% Safe & Secure</Text>
            </View>
          </View>

          {/* Option 1: PhonePe */}
          <TouchableOpacity 
            style={[styles.paymentOptionRow, selectedPayment === 'phonepe' && styles.paymentOptionActivePhonePe]}
            onPress={() => setSelectedPayment('phonepe')}
            activeOpacity={0.8}
          >
            <View style={[styles.paymentIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#5F259F' }}>P</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.paymentName}>PhonePe UPI</Text>
                <View style={styles.instantTag}>
                  <Text style={styles.instantTagText}>INSTANT</Text>
                </View>
              </View>
              <Text style={styles.paymentSubtext}>Pay directly using PhonePe UPI App</Text>
            </View>
            <View style={[styles.radioCircle, selectedPayment === 'phonepe' && { borderColor: '#5F259F' }]}>
              {selectedPayment === 'phonepe' && <View style={[styles.radioInner, { backgroundColor: '#5F259F' }]} />}
            </View>
          </TouchableOpacity>

          {/* Option 2: Google Pay (GPay) */}
          <TouchableOpacity 
            style={[styles.paymentOptionRow, selectedPayment === 'gpay' && styles.paymentOptionActiveGPay]}
            onPress={() => setSelectedPayment('gpay')}
            activeOpacity={0.8}
          >
            <View style={[styles.paymentIconBox, { backgroundColor: '#E8F0FE' }]}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A73E8' }}>G</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.paymentName}>Google Pay (GPay)</Text>
                <View style={[styles.instantTag, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={[styles.instantTagText, { color: '#0284C7' }]}>FAST</Text>
                </View>
              </View>
              <Text style={styles.paymentSubtext}>Fast UPI checkout with Google Pay</Text>
            </View>
            <View style={[styles.radioCircle, selectedPayment === 'gpay' && { borderColor: '#1A73E8' }]}>
              {selectedPayment === 'gpay' && <View style={[styles.radioInner, { backgroundColor: '#1A73E8' }]} />}
            </View>
          </TouchableOpacity>

          {/* Option 3: Credit / Debit Card */}
          <TouchableOpacity 
            style={[styles.paymentOptionRow, selectedPayment === 'card' && styles.paymentOptionActiveCard]}
            onPress={() => setSelectedPayment('card')}
            activeOpacity={0.8}
          >
            <View style={[styles.paymentIconBox, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="card" size={20} color="#0F172A" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.paymentName}>Credit / Debit Card</Text>
              <Text style={styles.paymentSubtext}>Visa, MasterCard, RuPay, Maestro</Text>
            </View>
            <View style={[styles.radioCircle, selectedPayment === 'card' && { borderColor: '#0F172A' }]}>
              {selectedPayment === 'card' && <View style={[styles.radioInner, { backgroundColor: '#0F172A' }]} />}
            </View>
          </TouchableOpacity>

          {/* Inline Card Inputs when Card is Selected */}
          {selectedPayment === 'card' && (
            <View style={styles.cardInputContainer}>
              <Text style={styles.cardSectionTitle}>Enter Card Details</Text>
              
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>CARD NUMBER</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="4000 1234 5678 9010"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>EXPIRY (MM/YY)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="MM/YY"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={5}
                    value={cardExpiry}
                    onChangeText={handleExpiryChange}
                  />
                </View>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVV / CVC</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="123"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={3}
                    value={cardCvv}
                    onChangeText={handleCvvChange}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>CARDHOLDER NAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94A3B8"
                  value={cardName}
                  onChangeText={setCardName}
                />
              </View>
            </View>
          )}

          {/* Option 4: Cash on Delivery (COD) */}
          <TouchableOpacity 
            style={[styles.paymentOptionRow, selectedPayment === 'cod' && styles.paymentOptionActiveCOD]}
            onPress={() => setSelectedPayment('cod')}
            activeOpacity={0.8}
          >
            <View style={[styles.paymentIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="cash" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.paymentName}>Cash on Delivery (COD)</Text>
              <Text style={styles.paymentSubtext}>Pay in cash when order is delivered</Text>
            </View>
            <View style={[styles.radioCircle, selectedPayment === 'cod' && { borderColor: '#059669' }]}>
              {selectedPayment === 'cod' && <View style={[styles.radioInner, { backgroundColor: '#059669' }]} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer Checkout Bar */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerTotalLabel}>TO PAY</Text>
          <Text style={styles.footerTotal}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.placeOrderButton, 
            selectedPayment === 'phonepe' && { backgroundColor: '#5F259F' },
            selectedPayment === 'gpay' && { backgroundColor: '#1A73E8' },
            selectedPayment === 'card' && { backgroundColor: '#0F172A' },
            selectedPayment === 'cod' && { backgroundColor: '#059669' },
            placingOrder && { opacity: 0.8 }
          ]}
          onPress={handleCheckout}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>
                {selectedPayment === 'phonepe' && `Pay ${formatPrice(total)} via PhonePe`}
                {selectedPayment === 'gpay' && `Pay ${formatPrice(total)} via GPay`}
                {selectedPayment === 'card' && `Pay ${formatPrice(total)} via Card`}
                {selectedPayment === 'cod' && `Place Order (Cash on Delivery)`}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 📱 ONLINE PAYMENT PROCESSING & SUCCESS MODAL */}
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.paymentModalCard}>
            {paymentProcessingStage === 'processing' ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={[
                  styles.gatewayLogoCircle,
                  selectedPayment === 'phonepe' && { backgroundColor: '#F3E8FF' },
                  selectedPayment === 'gpay' && { backgroundColor: '#E8F0FE' },
                  selectedPayment === 'card' && { backgroundColor: '#F1F5F9' },
                ]}>
                  {selectedPayment === 'phonepe' && <Text style={{ fontSize: 24, fontWeight: '900', color: '#5F259F' }}>PhonePe</Text>}
                  {selectedPayment === 'gpay' && <Text style={{ fontSize: 24, fontWeight: '900', color: '#1A73E8' }}>GPay</Text>}
                  {selectedPayment === 'card' && <Ionicons name="card" size={36} color="#0F172A" />}
                </View>

                <ActivityIndicator size="large" color={selectedPayment === 'phonepe' ? '#5F259F' : selectedPayment === 'gpay' ? '#1A73E8' : '#0F172A'} style={{ marginVertical: 20 }} />
                
                <Text style={styles.processingTitle}>
                  Connecting to {selectedPayment === 'phonepe' ? 'PhonePe UPI' : selectedPayment === 'gpay' ? 'Google Pay UPI' : 'Bank Gateway'}...
                </Text>
                <Text style={styles.processingSubtitle}>
                  Authorizing payment of {formatPrice(total)} securely
                </Text>
                <View style={styles.secureEncryptionRow}>
                  <Ionicons name="lock-closed" size={14} color="#059669" />
                  <Text style={styles.secureEncryptionText}>256-Bit SSL Bank Grade Security</Text>
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={44} color="#FFFFFF" />
                </View>
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <Text style={styles.successAmount}>{formatPrice(total)}</Text>
                
                <View style={styles.txnDetailsBox}>
                  <View style={styles.txnRow}>
                    <Text style={styles.txnLabel}>Payment Method</Text>
                    <Text style={styles.txnValue}>
                      {selectedPayment === 'phonepe' && 'PhonePe UPI'}
                      {selectedPayment === 'gpay' && 'Google Pay UPI'}
                      {selectedPayment === 'card' && 'Debit/Credit Card'}
                    </Text>
                  </View>
                  <View style={styles.txnRow}>
                    <Text style={styles.txnLabel}>Transaction ID</Text>
                    <Text style={styles.txnValueCode}>{generatedTxnId}</Text>
                  </View>
                  <View style={styles.txnRow}>
                    <Text style={styles.txnLabel}>Shop</Text>
                    <Text style={styles.txnValue}>{activeShop?.name}</Text>
                  </View>
                  <View style={styles.txnRow}>
                    <Text style={styles.txnLabel}>Estimated Delivery</Text>
                    <Text style={styles.txnValue}>{getEstimatedTime(distance)}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.doneButton}
                  onPress={() => {
                    setPaymentModalVisible(false);
                    router.push('/(customer)/(tabs)/orders');
                  }}
                >
                  <Text style={styles.doneButtonText}>Track Order Live ➔</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  clearCartText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shopIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopTextWrapper: {
    flex: 1,
  },
  shopOrderingFrom: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  shopDistanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  shopTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  dot: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressTextWrapper: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  addressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  secureBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  itemUnit: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperCount: {
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  billValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  paymentOptionActivePhonePe: {
    borderColor: '#5F259F',
    backgroundColor: '#FAF5FF',
  },
  paymentOptionActiveGPay: {
    borderColor: '#1A73E8',
    backgroundColor: '#F0F7FF',
  },
  paymentOptionActiveCard: {
    borderColor: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  paymentOptionActiveCOD: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  paymentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  paymentSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  instantTag: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  instantTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#7E22CE',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardInputContainer: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 10,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 10,
  },
  inputWrapper: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  footerLeft: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  footerTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  placeOrderButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  gatewayLogoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  processingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  secureEncryptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  secureEncryptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#065F46',
    marginBottom: 4,
  },
  successAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#047857',
    marginBottom: 16,
  },
  txnDetailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  txnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  txnLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  txnValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '800',
  },
  txnValueCode: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  doneButton: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
