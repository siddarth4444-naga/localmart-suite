import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shop } from '../types';
import { formatDistance, getEstimatedTime } from '../lib/utils';

interface ShopCardProps {
  shop: Shop;
  distance: number;
  isNearest?: boolean;
  onPress: () => void;
}

export default function ShopCard({ shop, distance, isNearest, onPress }: ShopCardProps) {
  const estTime = getEstimatedTime(distance);
  const formattedDist = formatDistance(distance);
  const isOpen = shop.isOpen ?? shop.is_active;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Top Banner Image with Badges */}
      <View style={styles.imageWrapper}>
        <Image 
          source={{ uri: shop.cover_image_url || shop.logo_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80' }} 
          style={styles.coverImage}
        />
        
        {/* Gradient overlay tint */}
        <View style={styles.imageOverlay} />

        {/* Top Badges */}
        <View style={styles.badgeRow}>
          {/* Nearest store badge */}
          {isNearest ? (
            <View style={styles.nearestBadge}>
              <Ionicons name="location" size={12} color="#FFFFFF" />
              <Text style={styles.nearestBadgeText}>NEAREST STORE</Text>
            </View>
          ) : (
            <View style={styles.deliveryTimePill}>
              <Ionicons name="flash" size={13} color="#D97706" />
              <Text style={styles.deliveryTimeText}>{estTime.toUpperCase()}</Text>
            </View>
          )}

          {/* 24/7 Badge */}
          {(shop.is_24_hours || shop.opening_time === '24 Hours') && (
            <View style={styles.twentyFourSevenBadge}>
              <Text style={styles.twentyFourSevenText}>24/7 OPEN</Text>
            </View>
          )}

          {/* Rating Badge */}
          {shop.rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
              {shop.rating_count ? (
                <Text style={styles.ratingCount}>({shop.rating_count})</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Free Delivery Banner if fee is 0 */}
        {shop.delivery_fee === 0 && (
          <View style={styles.freeDeliveryBanner}>
            <Ionicons name="gift-outline" size={12} color="#065F46" />
            <Text style={styles.freeDeliveryText}>FREE DELIVERY</Text>
          </View>
        )}

        {/* Closed Overlay */}
        {!isOpen && (
          <View style={styles.closedOverlay}>
            <View style={styles.closedPill}>
              <Ionicons name="time" size={14} color="#EF4444" />
              <Text style={styles.closedText}>CLOSED FOR ORDERS</Text>
            </View>
          </View>
        )}
      </View>

      {/* Details Container */}
      <View style={styles.detailsContainer}>
        {/* Shop Name */}
        <View style={styles.titleRow}>
          <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
        </View>

        {/* PROMINENT DISTANCE BANNER DIRECTLY BELOW SHOP NAME */}
        <View style={styles.distanceRowBelowTitle}>
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate" size={13} color="#059669" />
            <Text style={styles.distanceTextHighlight}>{formattedDist} away</Text>
          </View>
          <Text style={styles.dotSeparator}>•</Text>
          <View style={styles.timeBadge}>
            <Ionicons name="flash" size={12} color="#D97706" />
            <Text style={styles.timeTextHighlight}>{estTime} delivery</Text>
          </View>
        </View>

        {/* Address / Description */}
        <Text style={styles.shopAddress} numberOfLines={1}>
          📍 {shop.address || shop.description}
        </Text>

        {/* Tags Pill Row */}
        {shop.tags && shop.tags.length > 0 && (
          <View style={styles.tagRow}>
            {shop.tags.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom Distance & Delivery Info Row */}
        <View style={styles.footerRow}>
          <View style={styles.feeBadge}>
            <Ionicons name="bicycle" size={14} color="#4B5563" />
            <Text style={styles.feeText}>
              {shop.delivery_fee === 0 ? (
                <Text style={{ color: '#059669', fontWeight: '700' }}>Free Delivery</Text>
              ) : (
                `Delivery: ₹${shop.delivery_fee}`
              )}
            </Text>
          </View>

          <View style={styles.dot} />

          <Text style={styles.minOrderText}>
            Min ₹{shop.min_order_amount}
          </Text>

          {/* Action Arrow */}
          <View style={styles.arrowIcon}>
            <Ionicons name="chevron-forward-circle" size={22} color="#10B981" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrapper: {
    height: 145,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  badgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nearestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  nearestBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  deliveryTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  deliveryTimeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  twentyFourSevenBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  twentyFourSevenText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
  },
  ratingCount: {
    fontSize: 10,
    color: '#64748B',
  },
  freeDeliveryBanner: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  freeDeliveryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  closedText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  detailsContainer: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  distanceRowBelowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  distanceTextHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  dotSeparator: {
    color: '#94A3B8',
    fontSize: 12,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  timeTextHighlight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  shopAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  minOrderText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  arrowIcon: {
    marginLeft: 'auto',
  },
});
