// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format price in INR
export function formatPrice(price: number): string {
  return `₹${price.toFixed(0)}`;
}

// Calculate discount percentage
export function getDiscountPercent(price: number, mrp: number): number {
  if (mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

// Format distance
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
}

// Get estimated delivery time based on distance
export function getEstimatedTime(km: number): string {
  const minutes = Math.max(10, Math.round(km * 8)); // ~8 min per km
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
}

// Get order status display text and color
export function getOrderStatusInfo(status: string): { label: string; color: string; badge: string } {
  const statusMap: Record<string, { label: string; color: string; badge: string }> = {
    pending: { label: 'Processing (Waiting for Shop)', color: '#F59E0B', badge: '⏳ Processing' },
    accepted: { label: 'Order Accepted', color: '#10B981', badge: '✅ Accepted' },
    preparing: { label: 'Preparing Items', color: '#8B5CF6', badge: '👨‍🍳 Preparing' },
    ready: { label: 'Ready for Pickup / Delivery', color: '#06B6D4', badge: '📦 Ready' },
    out_for_delivery: { label: 'Out for Delivery', color: '#3B82F6', badge: '🚴 Out for Delivery' },
    delivered: { label: 'Delivered', color: '#059669', badge: '🎉 Delivered' },
    cancelled: { label: 'Cancelled', color: '#EF4444', badge: '❌ Cancelled' },
  };
  return statusMap[status] || { label: status, color: '#6B7280', badge: status };
}

// Get payment method display details
export function getPaymentMethodInfo(method: string): { label: string; color: string; badge: string; icon: string; isOnline: boolean } {
  const methodMap: Record<string, { label: string; color: string; badge: string; icon: string; isOnline: boolean }> = {
    phonepe: { label: 'PhonePe UPI', color: '#5F259F', badge: '🟣 PhonePe UPI', icon: 'phone-portrait', isOnline: true },
    gpay: { label: 'Google Pay (GPay)', color: '#1A73E8', badge: '🔵 Google Pay', icon: 'logo-google', isOnline: true },
    card: { label: 'Credit / Debit Card', color: '#0F172A', badge: '💳 Card Paid', icon: 'card', isOnline: true },
    cod: { label: 'Cash on Delivery', color: '#059669', badge: '💵 Cash on Delivery', icon: 'cash', isOnline: false },
    upi: { label: 'UPI Payment', color: '#0284C7', badge: '📱 UPI Paid', icon: 'qr-code', isOnline: true },
    online: { label: 'Online Payment', color: '#10B981', badge: '💳 Online Paid', icon: 'card', isOnline: true },
    upi_on_delivery: { label: 'UPI on Delivery', color: '#059669', badge: '📲 UPI on Delivery', icon: 'qr-code', isOnline: false },
  };
  return methodMap[method] || { label: method || 'Cash on Delivery', color: '#059669', badge: method || 'COD', icon: 'cash', isOnline: false };
}

