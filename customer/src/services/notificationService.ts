import { create } from 'zustand';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'delivery' | 'shop' | 'alert' | 'success';
  timestamp: string;
  orderId?: string;
  shopId?: string;
  actionLabel?: string;
  onPress?: () => void;
  sound?: boolean;
}

interface NotificationState {
  currentNotification: AppNotification | null;
  notificationHistory: AppNotification[];
  showNotification: (notification: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  dismissNotification: () => void;
  clearHistory: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  currentNotification: null,
  notificationHistory: [],

  showNotification: (notif) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Play chime sound & vibrate
    if (notif.sound !== false) {
      notificationService.playChime(notif.type || 'alert');
      notificationService.vibrate([100, 50, 150]);
    }

    // Trigger Native OS Notification if permitted
    notificationService.sendOSNotification(notif.title, notif.message, notif.type);

    set((state) => ({
      currentNotification: newNotif,
      notificationHistory: [newNotif, ...state.notificationHistory.slice(0, 49)],
    }));

    // Auto-dismiss after 5.5 seconds
    setTimeout(() => {
      const current = get().currentNotification;
      if (current && current.id === newNotif.id) {
        set({ currentNotification: null });
      }
    }, 5500);
  },

  dismissNotification: () => {
    set({ currentNotification: null });
  },

  clearHistory: () => {
    set({ notificationHistory: [] });
  },
}));

export const notificationService = {
  // 1. Synthesize Native Push Notification Audio Chime using Web Audio API
  playChime(type: 'order' | 'delivery' | 'shop' | 'alert' | 'success' = 'alert') {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'order' || type === 'alert') {
        // High-low-high alert chime (Ding-Dong-Ding)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.15); // E6

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.51, now + 0.18);
        osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.35); // A6

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.2);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.6);
      } else if (type === 'delivery') {
        // Double pulse chime (Scooter/Delivery alert)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1174.66, now + 0.1); // D6

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      } else {
        // Gentle success chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now); // C6
        osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.2); // G6

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  },

  // 2. Hardware Vibration for Android Devices
  vibrate(pattern: number[] = [100, 50, 150]) {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  },

  // 3. Request OS Notification Permissions (Android/Desktop)
  async requestPermission(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') return true;
        if (Notification.permission !== 'denied') {
          const res = await Notification.requestPermission();
          return res === 'granted';
        }
      }
    } catch (e) {}
    return false;
  },

  // 4. Send OS Level System Notification (Shows in Android notification bar/drawer)
  async sendOSNotification(title: string, body: string, type: string = 'alert') {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const icon = '/favicon.ico';
        new Notification(title, {
          body,
          icon,
          badge: icon,
          tag: `localmart-${Date.now()}`,
        } as any);
      }
    } catch (e) {}
  },
};
