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
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

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
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        showNotification({
          title: '🎉 App Installed Successfully!',
          message: 'LocalMart Merchant Partner is now added to your home screen with order alert chimes.',
          type: 'success',
        });
      }
      setDeferredPrompt(null);
    } else {
      const isIOS =
        typeof window !== 'undefined' &&
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as any).MSStream;

      if (isIOS) {
        setShowIOSModal(true);
      } else {
        showNotification({
          title: '📱 Add to Home Screen',
          message: 'Tap the 3 dots in your browser menu (⋮) and select "Install App" to add Store Partner to your device.',
          type: 'alert',
        });
      }
    }
  };

  if (isInstalled || isDismissed) return null;

  return (
    <>
      <View style={styles.bannerContainer}>
        <View style={styles.bannerContent}>
          <View style={styles.appIconCircle}>
            <Ionicons name="storefront" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.bannerTextWrapper}>
            <Text style={styles.bannerTitle}>Install Store Partner App</Text>
            <Text style={styles.bannerSubtitle}>Works like a Play Store App • Loud Order Chimes</Text>
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

      <Modal
        visible={showIOSModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIOSModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBadge}>
                <Ionicons name="storefront" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.modalTitle}>Install Store Partner on iPhone</Text>
              <Text style={styles.modalSubtitle}>
                Add LocalMart Merchant Partner directly to your home screen for quick order management:
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepMainText}>
                  Tap the <Ionicons name="share-outline" size={18} color="#007AFF" /> <Text style={{ fontWeight: '700' }}>Share</Text> icon in Safari.
                </Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepMainText}>
                  Tap <Ionicons name="add-circle-outline" size={18} color="#10B981" /> <Text style={{ fontWeight: '700' }}>Add to Home Screen</Text>.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowIOSModal(false)}
            >
              <Text style={styles.modalDoneBtnText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
    backgroundColor: '#10B981',
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
    backgroundColor: '#10B981',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  stepTextWrapper: {
    flex: 1,
  },
  stepMainText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  modalDoneBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
