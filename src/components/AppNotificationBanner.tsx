import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../services/notificationService';

export const AppNotificationBanner: React.FC = () => {
  const { currentNotification, dismissNotification } = useNotificationStore();
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentNotification) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
          speed: 16,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -150,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentNotification]);

  if (!currentNotification) return null;

  const handlePress = () => {
    if (currentNotification.onPress) {
      currentNotification.onPress();
    }
    dismissNotification();
  };

  const getTypeStyle = () => {
    const type = currentNotification.type || 'success';
    switch (type) {
      case 'success':
      case 'shop':
        return {
          borderColor: '#10B981',
          shadowColor: '#10B981',
          iconName: 'checkmark-circle' as const,
          iconColor: '#10B981',
          badgeBg: '#064E3B',
          tagText: 'SUCCESS',
          tagColor: '#34D399',
        };
      case 'order':
        return {
          borderColor: '#F59E0B',
          shadowColor: '#F59E0B',
          iconName: 'receipt' as const,
          iconColor: '#F59E0B',
          badgeBg: '#451A03',
          tagText: 'ORDER',
          tagColor: '#FBBF24',
        };
      case 'delivery':
        return {
          borderColor: '#8B5CF6',
          shadowColor: '#8B5CF6',
          iconName: 'bicycle' as const,
          iconColor: '#8B5CF6',
          badgeBg: '#2E1065',
          tagText: 'DELIVERY',
          tagColor: '#A78BFA',
        };
      case 'alert':
      default:
        return {
          borderColor: '#6366F1',
          shadowColor: '#6366F1',
          iconName: 'notifications' as const,
          iconColor: '#818CF8',
          badgeBg: '#1E1B4B',
          tagText: 'NOTIFICATION',
          tagColor: '#818CF8',
        };
    }
  };

  const typeConfig = getTypeStyle();

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={[styles.card, { borderColor: typeConfig.borderColor, shadowColor: typeConfig.shadowColor }]}
      >
        <View style={styles.topRow}>
          <View style={styles.appBadge}>
            <View style={[styles.iconCircle, { backgroundColor: typeConfig.badgeBg }]}>
              <Ionicons name={typeConfig.iconName} size={15} color={typeConfig.iconColor} />
            </View>
            <View>
              <Text style={styles.appName}>LocalMart Console</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: typeConfig.badgeBg }]}>
              <Text style={[styles.tagText, { color: typeConfig.tagColor }]}>{typeConfig.tagText}</Text>
            </View>
          </View>
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>{currentNotification.timestamp || 'Just now'}</Text>
            <TouchableOpacity
              onPress={dismissNotification}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentRow}>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentNotification.title}
            </Text>
            <Text style={styles.message} numberOfLines={3}>
              {currentNotification.message}
            </Text>
          </View>
        </View>

        {currentNotification.actionLabel && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handlePress}>
              <Text style={[styles.actionBtnText, { color: typeConfig.tagColor }]}>{currentNotification.actionLabel}</Text>
              <Ionicons name="chevron-forward" size={14} color={typeConfig.tagColor} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 14 : 48,
    left: 14,
    right: 14,
    zIndex: 999999,
    alignItems: 'center',
    maxWidth: 520,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: 0.4,
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  closeBtn: {
    padding: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  message: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    fontWeight: '500',
  },
  actionRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
