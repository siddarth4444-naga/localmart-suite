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

    if (notif.sound !== false) {
      notificationService.playChime(notif.type || 'alert');
      notificationService.vibrate([100, 50, 100]);
    }

    notificationService.sendOSNotification(notif.title, notif.message, notif.type);

    set((state) => ({
      currentNotification: newNotif,
      notificationHistory: [newNotif, ...state.notificationHistory.slice(0, 49)],
    }));

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
  playChime(type: 'order' | 'delivery' | 'shop' | 'alert' | 'success' = 'alert') {
    try {
      if (Platform.OS !== 'web' || typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  },

  vibrate(pattern: number[] = [100, 50, 100]) {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  },

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

  async sendOSNotification(title: string, body: string, type: string = 'alert') {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const icon = '/favicon.ico';
        new Notification(title, {
          body,
          icon,
          badge: icon,
          tag: `dev-${Date.now()}`,
        } as any);
      }
    } catch (e) {}
  },
};

