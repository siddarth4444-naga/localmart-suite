import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shop } from '../types';
import { formatDistance, getEstimatedTime } from '../lib/utils';

interface ShopCardProps {
  shop: Shop;
  distance: number;
  onPress: () => void;
}

export default function ShopCard({ shop, distance, onPress }: ShopCardProps) {
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
          {/* Fast Delivery Pill */}
          <View style={styles.deliveryTimePill}>
            <Ionicons name="flash" size={13} color="#D97706" />
            <Text style={styles.deliveryTimeText}>{estTime.toUpperCase()}</Text>
          </View>

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
        {/* Title & Distance Highlight */}
        <View style={styles.titleRow}>
          <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
        </View>

        {/* Address / Description */}
        <Text style={styles.shopAddress} numberOfLines={1}>
          {shop.address || shop.description}
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
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate" size={13} color="#059669" />
            <Text style={styles.distanceHighlight}>{formattedDist} away</Text>
          </View>

          <View style={styles.dot} />

          <View style={styles.feeBadge}>
            <Ionicons name="bicycle" size={14} color="#4B5563" />
            <Text style={styles.feeText}>
              {shop.delivery_fee === 0 ? (
                <Text style={{ color: '#059669', fontWeight: '700' }}>Free</Text>
              ) : (
                `₹${shop.delivery_fee}`
              )}
            </Text>
          </View>

          <View style={styles.dot} />

          <Text style={styles.minOrderText}>
            Min ₹{shop.min_order_amount}
          </Text>

          {/* Action Arrow */}
          <View style={styles.arrowIcon}>
            <Ionicons name="chevron-forward-circle" size={20} color="#10B981" />
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: 140,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.12)',
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
  deliveryTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    gap: 3,
  },
  deliveryTimeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.4,
  },
  twentyFourSevenBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  twentyFourSevenText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  ratingCount: {
    fontSize: 10,
    color: '#6B7280',
  },
  freeDeliveryBanner: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  freeDeliveryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.3,
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  closedText: {
    color: '#B91C1C',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  detailsContainer: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  shopAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distanceHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  feeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  feeText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  minOrderText: {
    fontSize: 12,
    color: '#6B7280',
  },
  arrowIcon: {
    marginLeft: 'auto',
  },
});
