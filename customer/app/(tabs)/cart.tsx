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
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useCartStore } from '../../src/stores/cartStore';
import { useLocationStore } from '../../src/stores/locationStore';
import { useShopStore } from '../../src/stores/shopStore';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice, calculateDistance, formatDistance, getEstimatedTime } from '../../src/lib/utils';

interface PromoPreset {
  code: string;
  description: string;
  type: 'percent' | 'flat' | 'free_delivery';
  discountValue: number;
  minOrder: number;
  maxDiscount?: number;
}

const PROMO_PRESETS: PromoPreset[] = [
  {
    code: 'WELCOME50',
    description: '50% OFF up to ₹100 on your neighborhood order',
    type: 'percent',
    discountValue: 50,
    minOrder: 99,
    maxDiscount: 100,
  },
  {
    code: 'BLINKMART',
    description: 'Flat ₹50 OFF on orders above ₹249',
    type: 'flat',
    discountValue: 50,
    minOrder: 249,
  },
  {
    code: 'FREEDEL',
    description: '100% Free Doorstep Delivery',
    type: 'free_delivery',
    discountValue: 0,
    minOrder: 50,
  },
];

const DELIVERY_INSTRUCTIONS = [
  { id: 'door', label: 'Leave at door', icon: 'home-outline' as const },
  { id: 'bell', label: 'Ring bell', icon: 'notifications-outline' as const },
  { id: 'call', label: 'Call upon arrival', icon: 'call-outline' as const },
  { id: 'nocall', label: 'Avoid calling', icon: 'volume-mute-outline' as const },
];

export default function CartScreen() {
  const router = useRouter();
  const { activeShopId, items, updateQuantity, clearCart, getSubtotal } = useCartStore();
  const { address, latitude, longitude } = useLocationStore();
  const { shops, addOrder } = useShopStore();
  const { user } = useAuthStore();

  const [placingOrder, setPlacingOrder] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoPreset | null>(null);
  const [promoError, setPromoError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'upi_on_delivery' | 'cod'>('online');
  const [selectedInstruction, setSelectedInstruction] = useState<string>('door');

  // Payment Gateway Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTab, setPaymentTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'cred' | 'custom'>('gpay');
  const [customUpiId, setCustomUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('4532 8921 7840 9924');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('842');
  const [cardHolder, setCardHolder] = useState(user?.name || 'Ramesh Kumar');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [gatewayProcessing, setGatewayProcessing] = useState(false);
  const [gatewaySuccess, setGatewaySuccess] = useState(false);
  const [createdPaymentId, setCreatedPaymentId] = useState('');

  const cartItems = activeShopId ? (items.get(activeShopId) || []) : [];
  const activeShop = activeShopId ? shops.find(s => s.id === activeShopId) : null;

  const userLat = latitude ?? 17.4150;
  const userLng = longitude ?? 78.4350;

  const distance = activeShop 
    ? calculateDistance(userLat, userLng, activeShop.latitude, activeShop.longitude)
    : 1.2;

  const subtotal = activeShopId ? getSubtotal(activeShopId) : 0;
  let rawDeliveryFee = activeShop?.delivery_fee ?? 0;
  
  // Calculate discount
  let discountAmount = 0;
  if (appliedPromo && subtotal >= appliedPromo.minOrder) {
    if (appliedPromo.type === 'percent') {
      discountAmount = Math.min((subtotal * appliedPromo.discountValue) / 100, appliedPromo.maxDiscount || 100);
    } else if (appliedPromo.type === 'flat') {
      discountAmount = Math.min(appliedPromo.discountValue, subtotal);
    } else if (appliedPromo.type === 'free_delivery') {
      rawDeliveryFee = 0;
      discountAmount = 0;
    }
  }

  const deliveryFee = appliedPromo?.type === 'free_delivery' ? 0 : rawDeliveryFee;
  const handlingFee = subtotal > 0 ? 5 : 0;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee + handlingFee);

  const handleApplyPromoCode = (codeToApply?: string) => {
    const code = (codeToApply || promoInput).trim().toUpperCase();
    setPromoError('');

    if (!code) {
      setPromoError('Please enter a valid promo code');
      return;
    }

    const preset = PROMO_PRESETS.find(p => p.code === code);
    if (!preset) {
      setPromoError('Invalid coupon code. Try WELCOME50 or BLINKMART.');
      return;
    }

    if (subtotal < preset.minOrder) {
      setPromoError(`Minimum order amount of ₹${preset.minOrder} required for ${preset.code}.`);
      return;
    }

    setAppliedPromo(preset);
    setPromoInput(preset.code);
    setPromoError('');
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
  };

  const executePlaceOrder = (isOnlinePaid = false, payId = '') => {
    const finalPaymentMethod = isOnlinePaid ? 'online' : paymentMethod;
    const finalPaymentStatus = isOnlinePaid ? 'paid' : 'pending';
    const finalPaymentId = isOnlinePaid ? (payId || `PAY_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`) : undefined;

    addOrder({
      customer_id: user?.id || 'cust_1',
      customer_name: user?.name || 'Customer',
      customer_phone: user?.phone || '',
      shop_id: activeShopId || '',
      subtotal,
      delivery_fee: deliveryFee,
      total,
      delivery_address: user?.address || address || 'Banjara Hills, Hyderabad',
      delivery_lat: user?.latitude || userLat,
      delivery_lng: user?.longitude || userLng,
      payment_method: finalPaymentMethod,
      payment_status: finalPaymentStatus,
      payment_id: finalPaymentId,
      payment_time: isOnlinePaid ? new Date().toISOString() : undefined,
      paid_amount: isOnlinePaid ? total : 0,
      notes: selectedInstruction ? `Delivery Note: ${DELIVERY_INSTRUCTIONS.find(d => d.id === selectedInstruction)?.label}` : undefined,
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
    setShowPaymentModal(false);
    router.push('/(tabs)/orders');
  };

  const handlePlaceOrder = () => {
    if (subtotal === 0) return;

    // Check if user is authenticated
    if (!user || !user.id || user.id === 'u_guest_shopper') {
      const msg = 'Please login or register to place your order so the store can deliver to your exact address.';
      if (Platform.OS === 'web') {
        window.alert(msg);
        router.push('/(auth)/login');
      } else {
        Alert.alert(
          'Login Required',
          msg,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Login / Register', 
              onPress: () => router.push('/(auth)/login') 
            }
          ]
        );
      }
      return;
    }

    if (activeShop && subtotal < activeShop.min_order_amount) {
      Alert.alert(
        'Minimum Order Not Met',
        `Minimum order amount for ${activeShop.name} is ₹${activeShop.min_order_amount}. Please add more items.`
      );
      return;
    }

    if (paymentMethod === 'online') {
      setGatewayProcessing(false);
      setGatewaySuccess(false);
      setShowPaymentModal(true);
    } else {
      setPlacingOrder(true);
      setTimeout(() => {
        executePlaceOrder(false);
      }, 700);
    }
  };

  const handleProcessOnlinePayment = () => {
    setGatewayProcessing(true);
    const txnId = `PAY_UPI_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    setCreatedPaymentId(txnId);

    setTimeout(() => {
      setGatewayProcessing(false);
      setGatewaySuccess(true);

      setTimeout(() => {
        executePlaceOrder(true, txnId);
      }, 1100);
    }, 1400);
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={64} color="#10B981" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse nearby neighborhood shops and add fresh daily essentials!
          </Text>
          <TouchableOpacity 
            style={styles.browseButton} 
            onPress={() => router.push('/(tabs)/home')}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout & Bill</Text>
        </View>
        <TouchableOpacity onPress={clearCart} style={styles.clearCartBtn}>
          <Ionicons name="trash-outline" size={15} color="#EF4444" />
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
              {user?.address || address || 'Home - Banjara Hills, Hyderabad'}
            </Text>
          </View>
        </View>

        {/* Delivery Instructions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Delivery Instructions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.instructionScroll}>
            {DELIVERY_INSTRUCTIONS.map(item => {
              const isSelected = selectedInstruction === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.instructionChip, isSelected && styles.instructionChipActive]}
                  onPress={() => setSelectedInstruction(item.id)}
                >
                  <Ionicons 
                    name={item.icon} 
                    size={14} 
                    color={isSelected ? '#059669' : '#64748B'} 
                  />
                  <Text style={[styles.instructionChipText, isSelected && styles.instructionChipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Items List */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Items ({cartItems.length})</Text>
            <Text style={styles.sectionSubCount}>{cartItems.reduce((acc, ci) => acc + ci.quantity, 0)} total units</Text>
          </View>
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

        {/* Coupons & Promo Codes Section (Zepto / Blinkit feature) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="pricetag" size={16} color="#059669" />
              <Text style={styles.sectionHeader}>Offers & Coupons</Text>
            </View>
            {appliedPromo && (
              <TouchableOpacity onPress={handleRemovePromo}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Promo Input */}
          <View style={styles.promoInputRow}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter coupon (e.g. WELCOME50)"
              value={promoInput}
              onChangeText={(text) => {
                setPromoInput(text);
                setPromoError('');
              }}
              autoCapitalize="characters"
              placeholderTextColor="#94A3B8"
            />
            <TouchableOpacity 
              style={[styles.applyPromoBtn, (!promoInput.trim() || !!appliedPromo) && styles.applyPromoBtnDisabled]}
              onPress={() => handleApplyPromoCode()}
              disabled={!promoInput.trim() || !!appliedPromo}
            >
              <Text style={styles.applyPromoBtnText}>
                {appliedPromo ? 'APPLIED' : 'APPLY'}
              </Text>
            </TouchableOpacity>
          </View>

          {promoError ? (
            <Text style={styles.promoErrorText}>{promoError}</Text>
          ) : null}

          {appliedPromo ? (
            <View style={styles.appliedBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.appliedBannerText}>
                Coupon <Text style={{ fontWeight: '800' }}>{appliedPromo.code}</Text> applied successfully!
              </Text>
            </View>
          ) : (
            <View style={styles.promoPresetsContainer}>
              {PROMO_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.code}
                  style={styles.promoPresetCard}
                  onPress={() => handleApplyPromoCode(preset.code)}
                >
                  <View style={styles.presetTopRow}>
                    <View style={styles.presetTag}>
                      <Text style={styles.presetTagText}>{preset.code}</Text>
                    </View>
                    <Text style={styles.presetApplyLink}>APPLY</Text>
                  </View>
                  <Text style={styles.presetDesc}>{preset.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bill Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>{formatPrice(subtotal)}</Text>
          </View>

          {discountAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: '#059669', fontWeight: '700' }]}>
                Coupon Discount ({appliedPromo?.code})
              </Text>
              <Text style={[styles.billValue, { color: '#059669', fontWeight: '700' }]}>
                - {formatPrice(discountAmount)}
              </Text>
            </View>
          )}

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
            <View>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.savingsSubtext}>
                {discountAmount > 0 ? `You saved ${formatPrice(discountAmount)} on this order!` : 'Guaranteed fresh & on time'}
              </Text>
            </View>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Payment Options Selector (Zepto / Blinkit style) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Payment Method</Text>
            <View style={styles.secureBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#059669" />
              <Text style={styles.secureBadgeText}>100% Safe & Secure</Text>
            </View>
          </View>
          
          {/* Option 1: Instant Online Payment */}
          <TouchableOpacity 
            style={[styles.paymentOptionRow, paymentMethod === 'online' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('online')}
          >
            <View style={styles.paymentRadio}>
              {paymentMethod === 'online' && <View style={styles.paymentRadioInner} />}
            </View>
            <View style={styles.paymentIconBox}>
              <Ionicons name="flash" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.paymentTitle}>Instant Online Payment</Text>
                <View style={styles.fastTag}>
                  <Text style={styles.fastTagText}>RECOMMENDED</Text>
                </View>
              </View>
              <Text style={styles.paymentSubtitle}>UPI (GPay, PhonePe, Paytm), Cards & Net Banking</Text>
              <View style={styles.paymentBrandsRow}>
                <Text style={styles.paymentBrandPill}>GPay</Text>
                <Text style={styles.paymentBrandPill}>PhonePe</Text>
                <Text style={styles.paymentBrandPill}>Paytm</Text>
                <Text style={styles.paymentBrandPill}>Cards</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Option 2: UPI on Delivery */}
          <TouchableOpacity 
            style={[styles.paymentOptionRow, paymentMethod === 'upi_on_delivery' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('upi_on_delivery')}
          >
            <View style={styles.paymentRadio}>
              {paymentMethod === 'upi_on_delivery' && <View style={styles.paymentRadioInner} />}
            </View>
            <View style={[styles.paymentIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="qr-code-outline" size={20} color="#0284C7" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.paymentTitle}>UPI on Delivery (Scan QR)</Text>
              <Text style={styles.paymentSubtitle}>Scan delivery partner's dynamic QR at your doorstep</Text>
            </View>
          </TouchableOpacity>

          {/* Option 3: Cash on Delivery */}
          <TouchableOpacity 
            style={[styles.paymentOptionRow, paymentMethod === 'cod' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={styles.paymentRadio}>
              {paymentMethod === 'cod' && <View style={styles.paymentRadioInner} />}
            </View>
            <View style={[styles.paymentIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="cash-outline" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.paymentTitle}>Cash on Delivery (COD)</Text>
              <Text style={styles.paymentSubtitle}>Pay physical cash directly to delivery partner</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Checkout Bar */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerTotalLabel}>TO PAY</Text>
          <Text style={styles.footerTotal}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.placeOrderButton, placingOrder && { opacity: 0.8 }]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>
                {paymentMethod === 'online' 
                  ? `Pay Online (${formatPrice(total)})` 
                  : paymentMethod === 'upi_on_delivery'
                  ? 'Place Order (UPI QR)'
                  : 'Place Order (Cash COD)'}
              </Text>
              <Ionicons name={paymentMethod === 'online' ? "lock-closed" : "arrow-forward"} size={17} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ONLINE PAYMENT GATEWAY MODAL (Razorpay / UPI Simulation) */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => !gatewayProcessing && setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.gatewayCard}>
            {/* Modal Header */}
            <View style={styles.gatewayHeader}>
              <View style={styles.gatewayHeaderLeft}>
                <View style={styles.gatewayShieldIcon}>
                  <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.gatewayTitle}>LocalMart Secure Gateway</Text>
                  <Text style={styles.gatewaySubtitle}>256-bit SSL Bank Encrypted</Text>
                </View>
              </View>
              {!gatewayProcessing && !gatewaySuccess && (
                <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={styles.gatewayCloseBtn}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Processing / Success State */}
            {gatewayProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={styles.processingTitle}>Authorizing Payment...</Text>
                <Text style={styles.processingSub}>Contacting bank & verifying 256-bit token</Text>
                <View style={styles.processingAmountPill}>
                  <Text style={styles.processingAmountText}>{formatPrice(total)}</Text>
                </View>
              </View>
            ) : gatewaySuccess ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark-sharp" size={48} color="#FFFFFF" />
                </View>
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <Text style={styles.successAmount}>{formatPrice(total)} Paid</Text>
                <Text style={styles.successTxn}>Ref ID: {createdPaymentId}</Text>
                <Text style={styles.successRedirect}>Redirecting to your orders...</Text>
              </View>
            ) : (
              /* Payment Methods Content */
              <View style={styles.gatewayBody}>
                {/* Order Summary Ribbon */}
                <View style={styles.gatewaySummaryRow}>
                  <View>
                    <Text style={styles.gatewayShopName}>{activeShop?.name || 'Local Store'}</Text>
                    <Text style={styles.gatewayItemSummary}>{cartItems.length} items • Fast Delivery</Text>
                  </View>
                  <Text style={styles.gatewayTotalAmount}>{formatPrice(total)}</Text>
                </View>

                {/* Gateway Tabs */}
                <View style={styles.gatewayTabsRow}>
                  <TouchableOpacity 
                    style={[styles.gatewayTab, paymentTab === 'upi' && styles.gatewayTabActive]}
                    onPress={() => setPaymentTab('upi')}
                  >
                    <Ionicons name="qr-code" size={14} color={paymentTab === 'upi' ? '#059669' : '#64748B'} />
                    <Text style={[styles.gatewayTabText, paymentTab === 'upi' && styles.gatewayTabTextActive]}>UPI Apps</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.gatewayTab, paymentTab === 'card' && styles.gatewayTabActive]}
                    onPress={() => setPaymentTab('card')}
                  >
                    <Ionicons name="card" size={14} color={paymentTab === 'card' ? '#059669' : '#64748B'} />
                    <Text style={[styles.gatewayTabText, paymentTab === 'card' && styles.gatewayTabTextActive]}>Cards</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.gatewayTab, paymentTab === 'netbanking' && styles.gatewayTabActive]}
                    onPress={() => setPaymentTab('netbanking')}
                  >
                    <Ionicons name="business" size={14} color={paymentTab === 'netbanking' ? '#059669' : '#64748B'} />
                    <Text style={[styles.gatewayTabText, paymentTab === 'netbanking' && styles.gatewayTabTextActive]}>NetBanking</Text>
                  </TouchableOpacity>
                </View>

                {/* TAB 1: UPI APPS */}
                {paymentTab === 'upi' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.tabHeading}>Select your preferred UPI App:</Text>
                    
                    <View style={styles.upiGrid}>
                      {[
                        { id: 'gpay', name: 'Google Pay', icon: 'logo-google' as const, color: '#4285F4' },
                        { id: 'phonepe', name: 'PhonePe', icon: 'phone-portrait' as const, color: '#5F259F' },
                        { id: 'paytm', name: 'Paytm UPI', icon: 'wallet' as const, color: '#00B9F5' },
                        { id: 'cred', name: 'CRED UPI', icon: 'flash' as const, color: '#1E293B' },
                      ].map(app => (
                        <TouchableOpacity
                          key={app.id}
                          style={[styles.upiCard, selectedUpiApp === app.id && styles.upiCardActive]}
                          onPress={() => setSelectedUpiApp(app.id as any)}
                        >
                          <View style={[styles.upiIconCircle, { backgroundColor: app.color }]}>
                            <Ionicons name={app.icon} size={18} color="#FFFFFF" />
                          </View>
                          <Text style={styles.upiAppName}>{app.name}</Text>
                          {selectedUpiApp === app.id && (
                            <View style={styles.upiCheckedBadge}>
                              <Ionicons name="checkmark-circle" size={16} color="#059669" />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Custom UPI ID */}
                    <View style={styles.customUpiBox}>
                      <Text style={styles.customUpiLabel}>Or enter UPI ID / VPA</Text>
                      <View style={styles.customUpiInputWrapper}>
                        <TextInput
                          style={styles.customUpiInput}
                          placeholder="e.g. mobile@okhdfcbank"
                          value={customUpiId}
                          onChangeText={(t) => {
                            setCustomUpiId(t);
                            setSelectedUpiApp('custom');
                          }}
                          placeholderTextColor="#94A3B8"
                        />
                        <TouchableOpacity 
                          style={styles.verifyUpiBtn}
                          onPress={() => setSelectedUpiApp('custom')}
                        >
                          <Text style={styles.verifyUpiBtnText}>Verify</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* TAB 2: CREDIT / DEBIT CARDS */}
                {paymentTab === 'card' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.tabHeading}>Card Details:</Text>
                    
                    <View style={styles.cardInputGroup}>
                      <Text style={styles.inputLabel}>Card Number</Text>
                      <View style={styles.cardInputRow}>
                        <Ionicons name="card-outline" size={18} color="#64748B" />
                        <TextInput
                          style={styles.cardTextInput}
                          value={cardNumber}
                          onChangeText={setCardNumber}
                          placeholder="16-digit card number"
                          keyboardType="numeric"
                        />
                        <Text style={styles.visaBadge}>VISA / RuPay</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Expiry</Text>
                        <TextInput
                          style={styles.cardSmallInput}
                          value={cardExpiry}
                          onChangeText={setCardExpiry}
                          placeholder="MM/YY"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>CVV</Text>
                        <TextInput
                          style={styles.cardSmallInput}
                          value={cardCvv}
                          onChangeText={setCardCvv}
                          placeholder="3 digits"
                          secureTextEntry
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={[styles.cardInputGroup, { marginTop: 8 }]}>
                      <Text style={styles.inputLabel}>Cardholder Name</Text>
                      <TextInput
                        style={styles.cardSmallInput}
                        value={cardHolder}
                        onChangeText={setCardHolder}
                        placeholder="Name on card"
                      />
                    </View>
                  </View>
                )}

                {/* TAB 3: NETBANKING */}
                {paymentTab === 'netbanking' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.tabHeading}>Select Popular Bank:</Text>
                    <View style={styles.bankGrid}>
                      {['HDFC Bank', 'ICICI Bank', 'SBI Bank', 'Axis Bank', 'Kotak Bank', 'Punjab National Bank'].map(bank => (
                        <TouchableOpacity
                          key={bank}
                          style={[styles.bankItem, selectedBank === bank && styles.bankItemActive]}
                          onPress={() => setSelectedBank(bank)}
                        >
                          <Ionicons 
                            name={selectedBank === bank ? "radio-button-on" : "radio-button-off"} 
                            size={16} 
                            color={selectedBank === bank ? "#059669" : "#94A3B8"} 
                          />
                          <Text style={[styles.bankItemText, selectedBank === bank && styles.bankItemTextActive]}>
                            {bank}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Modal Pay CTA Button */}
                <TouchableOpacity 
                  style={styles.modalPayBtn}
                  onPress={handleProcessOnlinePayment}
                >
                  <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                  <Text style={styles.modalPayBtnText}>
                    Pay {formatPrice(total)} Now
                  </Text>
                </TouchableOpacity>

                <Text style={styles.gatewaySecurityNote}>
                  🛡️ Protected by 256-bit AES end-to-end security. No card data is stored.
                </Text>
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
  headerBackBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  clearCartText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  shopIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  shopOrderingFrom: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
    marginTop: 1,
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  shopDistanceText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
  dot: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  shopTimeText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '700',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  addressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSubCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  instructionScroll: {
    gap: 8,
    paddingTop: 4,
  },
  instructionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  instructionChipActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  instructionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  instructionChipTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemUnit: {
    fontSize: 12,
    color: '#64748B',
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
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  stepperBtn: {
    padding: 4,
  },
  stepperCount: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    paddingHorizontal: 8,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  promoInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  applyPromoBtn: {
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  applyPromoBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  applyPromoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  removeCouponText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
  },
  promoErrorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 6,
  },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  appliedBannerText: {
    fontSize: 12,
    color: '#065F46',
  },
  promoPresetsContainer: {
    gap: 8,
    marginTop: 6,
  },
  promoPresetCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 10,
  },
  presetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  presetTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  presetTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  presetApplyLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  presetDesc: {
    fontSize: 12,
    color: '#475569',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  billLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  billValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  savingsSubtext: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#059669',
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  paymentOptionActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  paymentRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  paymentSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  footerLeft: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
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
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Payment Options Extras
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
  paymentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  fastTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fastTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.4,
  },
  paymentBrandsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  paymentBrandPill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Payment Gateway Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  gatewayCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  gatewayHeader: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gatewayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gatewayShieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gatewayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gatewaySubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  gatewayCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#334155',
  },
  gatewayBody: {
    padding: 20,
  },
  gatewaySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  gatewayShopName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  gatewayItemSummary: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  gatewayTotalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
  },
  gatewayTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  gatewayTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  gatewayTabActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gatewayTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  gatewayTabTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  tabContent: {
    marginBottom: 20,
  },
  tabHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  upiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  upiCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  upiCardActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  upiIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upiAppName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  upiCheckedBadge: {
    marginLeft: 'auto',
  },
  customUpiBox: {
    marginTop: 4,
  },
  customUpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  customUpiInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  customUpiInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1E293B',
  },
  verifyUpiBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  verifyUpiBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardInputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  cardTextInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1E293B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  visaBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardSmallInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  bankGrid: {
    gap: 8,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  bankItemActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  bankItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  bankItemTextActive: {
    fontWeight: '800',
    color: '#059669',
  },
  modalPayBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalPayBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  gatewaySecurityNote: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
  },
  processingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 6,
  },
  processingSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  processingAmountPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  processingAmountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  successContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#065F46',
    marginBottom: 6,
  },
  successAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  successTxn: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  successRedirect: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
  },
});
