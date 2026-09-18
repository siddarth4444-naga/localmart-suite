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
          bounciness: 8,
          speed: 14,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -150,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
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
        style={styles.card}
      >
        {/* Header */}
        <View style={styles.topRow}>
          <View style={styles.appBadge}>
            <View style={styles.iconCircle}>
              <Ionicons name="storefront" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>LocalMart Merchant Partner</Text>
          </View>
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>{currentNotification.timestamp || 'Just now'}</Text>
            <TouchableOpacity
              onPress={dismissNotification}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentRow}>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentNotification.title}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {currentNotification.message}
            </Text>
          </View>
        </View>

        {currentNotification.actionLabel && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handlePress}>
              <Text style={styles.actionBtnText}>{currentNotification.actionLabel}</Text>
              <Ionicons name="chevron-forward" size={14} color="#10B981" />
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
    top: Platform.OS === 'web' ? 12 : 44,
    left: 12,
    right: 12,
    zIndex: 99999,
    alignItems: 'center',
    maxWidth: 500,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
    textTransform: 'uppercase',
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
    color: '#F8FAFC',
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
    borderTopColor: '#334155',
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
    color: '#34D399',
  },
});
