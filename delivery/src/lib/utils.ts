import { Linking, Platform, Alert } from 'react-native';

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
  return Math.round(R * c * 10) / 10;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatPrice(price: number): string {
  return `₹${price.toFixed(0)}`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
}

export function getEstimatedTime(km: number): string {
  const minutes = Math.max(8, Math.round(km * 6));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
}

export function getOrderStatusInfo(status: string): { label: string; color: string; badge: string } {
  const statusMap: Record<string, { label: string; color: string; badge: string }> = {
    pending: { label: 'Waiting for Shop', color: '#F59E0B', badge: '⏳ Pending' },
    accepted: { label: 'Shop Accepted', color: '#10B981', badge: '✅ Accepted' },
    preparing: { label: 'Preparing', color: '#8B5CF6', badge: '👨‍🍳 Preparing' },
    ready: { label: 'Ready for Pickup', color: '#06B6D4', badge: '📦 Ready for Pickup' },
    delivery_accepted: { label: 'You Accepted (Assigned)', color: '#0284C7', badge: '🛵 Assigned' },
    picked_up: { label: 'Picked Up (On Way)', color: '#3B82F6', badge: '🚴 On Way' },
    out_for_delivery: { label: 'Out for Delivery', color: '#3B82F6', badge: '🚴 Out for Delivery' },
    delivered: { label: 'Delivered', color: '#059669', badge: '🎉 Delivered' },
    cancelled: { label: 'Cancelled', color: '#EF4444', badge: '❌ Cancelled' },
  };
  return statusMap[status] || { label: status, color: '#6B7280', badge: status };
}

/**
 * Open Turn-by-Turn Navigation directly in Google Maps
 * Supports coordinates or text address fallback across Web, Android, iOS.
 */
export function openGoogleMapsDirections(lat?: number, lng?: number, address?: string, label?: string) {
  let url = '';
  if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
    url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  } else if (address) {
    url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  } else {
    url = 'https://www.google.com/maps';
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url).catch(() => {
      Alert.alert('Navigation Error', `Unable to open Google Maps for ${label || 'location'}.`);
    });
  }
}

/**
 * Open Phone Call
 */
export function openPhoneCall(phoneNumber: string, contactName: string) {
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`Calling ${contactName}: ${phoneNumber}`);
  } else {
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert('Phone Call', `Contact ${contactName} at ${phoneNumber}`);
    });
  }
}
