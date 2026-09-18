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
      notificationService.vibrate([200, 100, 200, 100, 300]);
    }

    // Trigger Native OS Notification if permitted
    notificationService.sendOSNotification(notif.title, notif.message, notif.type);

    set((state) => ({
      currentNotification: newNotif,
      notificationHistory: [newNotif, ...state.notificationHistory.slice(0, 49)],
    }));

    // Auto-dismiss after 6.5 seconds
    setTimeout(() => {
      const current = get().currentNotification;
      if (current && current.id === newNotif.id) {
        set({ currentNotification: null });
      }
    }, 6500);
  },

  dismissNotification: () => {
    set({ currentNotification: null });
  },

  clearHistory: () => {
    set({ notificationHistory: [] });
  },
}));

export const notificationService = {
  // 1. Synthesize Loud Store Alert Chimes using Web Audio API
  playChime(type: 'order' | 'delivery' | 'shop' | 'alert' | 'success' = 'alert') {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'order' || type === 'alert') {
        // High attention store bell sound (3-tone ascending alert)
        const tones = [587.33, 880, 1174.66, 1760];
        tones.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.12;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.35, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.35);
        });
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.2);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch (e) {}
  },

  // 2. Hardware Vibration
  vibrate(pattern: number[] = [200, 100, 200, 100, 300]) {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  },

  // 3. Request OS Permissions
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

  // 4. Send OS System Notification
  async sendOSNotification(title: string, body: string, type: string = 'alert') {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const icon = '/favicon.ico';
        new Notification(title, {
          body,
          icon,
          badge: icon,
          tag: `shopkeeper-${Date.now()}`,
        } as any);
      }
    } catch (e) {}
  },
};
