import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService, useNotificationStore } from '../services/notificationService';

export const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      const isStandalone =
        (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
        (window.navigator as any)?.standalone === true;

      if (isStandalone) {
        setIsInstalled(true);
        return;
      }

      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      setTimeout(() => {
        notificationService.requestPermission();
      }, 2000);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    } catch (e) {}
  }, []);

  if (Platform.OS !== 'web') return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        showNotification({
          title: '🎉 Console Installed!',
          message: 'LocalMart Admin Console is now installed on your desktop/mobile home screen.',
          type: 'success',
        });
      }
      setDeferredPrompt(null);
    } else {
      showNotification({
        title: '📱 Install App',
        message: 'Tap the browser menu (⋮) and select "Install App" or "Add to Home Screen".',
        type: 'alert',
      });
    }
  };

  if (isInstalled || isDismissed) return null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.bannerContent}>
        <View style={styles.appIconCircle}>
          <Ionicons name="code-slash" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.bannerTextWrapper}>
          <Text style={styles.bannerTitle}>Install Developer Console App</Text>
          <Text style={styles.bannerSubtitle}>Desktop / Mobile Standalone Mode</Text>
        </View>
        <TouchableOpacity
          style={styles.installBtn}
          onPress={handleInstallClick}
          activeOpacity={0.85}
        >
          <Ionicons name="download-outline" size={15} color="#FFFFFF" />
          <Text style={styles.installBtnText}>Install</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => setIsDismissed(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextWrapper: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  installBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  installBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
});

