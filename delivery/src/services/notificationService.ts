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
      notificationService.playChime(notif.type || 'delivery');
      notificationService.vibrate([150, 80, 150, 80, 250]);
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
  // 1. Synthesize Rider Dispatch Chimes using Web Audio API
  playChime(type: 'order' | 'delivery' | 'shop' | 'alert' | 'success' = 'delivery') {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Double pulse horn/bell chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.12); // A5

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.5);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.5);
    } catch (e) {}
  },

  // 2. Hardware Vibration
  vibrate(pattern: number[] = [150, 80, 150, 80, 250]) {
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
  async sendOSNotification(title: string, body: string, type: string = 'delivery') {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const icon = '/favicon.ico';
        new Notification(title, {
          body,
          icon,
          badge: icon,
          tag: `delivery-${Date.now()}`,
        } as any);
      }
    } catch (e) {}
  },
};
