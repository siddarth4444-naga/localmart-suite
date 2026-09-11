import { useShopStore } from '../stores/shopStore';

export const getSyncServerUrl = () => {
  if (process.env.EXPO_PUBLIC_SYNC_SERVER_URL) {
    return process.env.EXPO_PUBLIC_SYNC_SERVER_URL;
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    return `http://${host}:5000`;
  }
  return 'http://localhost:5000';
};

const SYNC_SERVER_HTTP = `${getSyncServerUrl()}/api`;

class RealtimeSyncService {
  private eventSource: any = null;
  private isConnected = false;

  public initListeners() {
    this.pollSync();

    if (typeof window !== 'undefined' && typeof window.EventSource !== 'undefined') {
      try {
        this.eventSource = new window.EventSource(`${SYNC_SERVER_HTTP}/events`);

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
      const res = await fetch(`${SYNC_SERVER_HTTP}/sync`);
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
      await fetch(`${SYNC_SERVER_HTTP}/sync`, {
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
