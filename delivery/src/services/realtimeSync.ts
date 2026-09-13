import { useShopStore } from '../stores/shopStore';

// Dynamic Sync URL: Reads cloud env variable or local host fallback
export const getSyncServerUrl = () => {
  let url = process.env.EXPO_PUBLIC_SYNC_SERVER_URL;
  if (url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/$/, '');
  }

  // Local development fallback
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
      return `http://${host}:5000`;
    }
  }

  // Production Render cloud fallback
  return 'https://localmart-sync-api.onrender.com';
};

class RealtimeSyncService {
  public getSyncServerUrl = getSyncServerUrl;
  private eventSource: any = null;
  private isConnected = false;

  public initListeners() {
    this.pollSync();

    if (typeof window !== 'undefined' && typeof window.EventSource !== 'undefined') {
      try {
        const syncUrl = getSyncServerUrl();
        this.eventSource = new window.EventSource(`${syncUrl}/api/events`);

        this.eventSource.onopen = () => {
          this.isConnected = true;
          this.fetchSnapshot();
        };

        this.eventSource.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'CONNECTED') {
              this.fetchSnapshot();
            } else if (data.snapshot) {
              this.applySnapshot(data.snapshot);
            }
          } catch (err) {
            console.error('[Delivery Sync] Error parsing SSE payload:', err);
          }
        };

        this.eventSource.onerror = () => {
          this.isConnected = false;
        };
      } catch (err) {
        console.warn('[Delivery Sync] SSE initialization failed, fallback to polling:', err);
      }
    }

    const interval = setInterval(() => {
      this.fetchSnapshot();
    }, 2000);

    return () => {
      clearInterval(interval);
      if (this.eventSource) {
        this.eventSource.close();
      }
    };
  }

  public async fetchSnapshot() {
    try {
      const syncUrl = getSyncServerUrl();
      const res = await fetch(`${syncUrl}/api/sync`);
      if (res.ok) {
        const db = await res.json();
        this.applySnapshot(db);
      }
    } catch (e) {
      // Server might be offline
    }
  }

  public async pushUpdate(snapshotUpdate: any, eventType: string = 'DELIVERY_UPDATE') {
    try {
      const syncUrl = getSyncServerUrl();
      await fetch(`${syncUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: eventType,
          snapshot: snapshotUpdate,
        }),
      });
    } catch (e) {
      console.error('[Delivery Sync] Error pushing update:', e);
    }
  }

  private applySnapshot(db: any) {
    if (!db) return;
    const store = useShopStore.getState();
    store.syncFromExternalSnapshot(db);
  }

  private pollSync() {
    this.fetchSnapshot();
  }
}

export const realtimeSync = new RealtimeSyncService();
