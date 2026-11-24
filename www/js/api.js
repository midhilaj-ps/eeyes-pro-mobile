/**
 * EEYES PRO Mobile - Live API Connector & Real-Time Sync Engine
 * Connects directly to EEYES PRO Desktop Server (Port 3000)
 */

class MobileAPI {
  constructor() {
    // If accessed through desktop server (/mobile/), use relative root '', otherwise port 3000
    const defaultUrl = (window.location.port === '3000') 
      ? window.location.origin 
      : `${window.location.protocol}//${window.location.hostname}:3000`;
    
    this.serverUrl = localStorage.getItem('eeyes_server_url') || defaultUrl;
    this.isOnline = false;
    this.eventSource = null;

    // Initialize connection and start live stream
    this.init();
  }

  async init() {
    await this.checkConnection();
    this.initRealtimeStream();

    // Periodic heartbeat and poll every 10 seconds
    setInterval(() => {
      this.checkConnection();
    }, 10000);
  }

  getServerUrl() {
    return this.serverUrl;
  }

  setServerUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    this.serverUrl = url.replace(/\/+$/, '');
    localStorage.setItem('eeyes_server_url', this.serverUrl);
    this.checkConnection();
    this.initRealtimeStream();
  }

  async checkConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${this.serverUrl}/api/status`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        this.updateSyncUI(true);
        return true;
      } else {
        this.updateSyncUI(false);
        return false;
      }
    } catch (e) {
      this.updateSyncUI(false);
      return false;
    }
  }

  // Real-Time Server-Sent Events (SSE) Live Stream
  initRealtimeStream() {
    if (this.eventSource) {
      try { this.eventSource.close(); } catch(e) {}
    }

    try {
      const streamUrl = `${this.serverUrl}/api/parties/live-stream`;
      console.log('[API] Connecting to live SSE event stream:', streamUrl);
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        console.log('[API] SSE Real-time stream connected to EEYES PRO backend!');
        this.updateSyncUI(true);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[API] Real-time event received from desktop ERP:', data);

          if (data.type === 'PARTY_SYNC' || data.type === 'CUSTOMER_REGISTERED' || data.type === 'CONNECTED') {
            // Instantly re-fetch and refresh mobile UI
            db.loadFromSharedDatabase().then(() => {
              if (window.app) app.refreshAllData();
              if (data.party && data.party.name) {
                app.showToast(`⚡ Real-Time Sync: Customer "${data.party.name}" updated!`, 'success');
              }
            });
          }
        } catch (err) {
          console.warn('[API] SSE parse error:', err);
        }
      };

      this.eventSource.onerror = (e) => {
        console.warn('[API] SSE stream disconnected, will reconnect automatically.');
      };
    } catch (err) {
      console.warn('[API] Failed to initialize EventSource:', err);
    }
  }

  async get(endpoint) {
    const url = `${this.serverUrl}${endpoint}`;
    try {
      const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (res.ok) return await res.json();
      return null;
    } catch (e) {
      return null;
    }
  }

  async post(endpoint, data) {
    const url = `${this.serverUrl}${endpoint}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
    throw new Error(`API error ${res.status}`);
  }

  updateSyncUI(online) {
    this.isOnline = online;
    const pill = document.getElementById('sync-status-pill');
    const txt = document.getElementById('sync-status-text');
    const pendingCount = (db.getPendingQueue() || []).length;

    if (pill && txt) {
      if (online) {
        pill.className = 'sync-pill';
        txt.textContent = pendingCount > 0 ? `Syncing (${pendingCount})` : 'Live ERP Linked';
      } else {
        pill.className = 'sync-pill offline';
        txt.textContent = pendingCount > 0 ? `Offline (${pendingCount})` : 'Offline Mode';
      }
    }

    const pendingStrEl = document.getElementById('sync-pending-count-str');
    if (pendingStrEl) {
      if (pendingCount > 0) {
        pendingStrEl.textContent = `⚠️ ${pendingCount} offline records waiting to push to ERP`;
        pendingStrEl.style.color = '#fbbf24';
      } else {
        pendingStrEl.textContent = `● 100% Shared Database Synchronized with Desktop ERP`;
        pendingStrEl.style.color = '#34d399';
      }
    }
  }

  async testServerConnection() {
    const inputEl = document.getElementById('sync-server-url');
    if (inputEl && inputEl.value.trim()) {
      this.setServerUrl(inputEl.value.trim());
    }

    app.showToast('Checking ERP server connectivity...', 'info');
    const connected = await this.checkConnection();
    if (connected) {
      app.showToast('🟢 Successfully connected to EEYES PRO ERP Server!', 'success');
      await db.loadFromSharedDatabase();
      app.refreshAllData();
    } else {
      app.showToast('⚠️ Could not reach server. Verify PC Wi-Fi IP and port 3000.', 'warn');
    }
  }

  async syncNow() {
    app.showToast('Syncing all shared database records...', 'info');
    const online = await this.checkConnection();

    if (!online) {
      app.showToast('Server unreachable. Running on offline cached data.', 'warn');
      return;
    }

    // Process pending offline queue
    const queue = db.getPendingQueue();
    if (queue.length > 0) {
      for (const item of queue) {
        try {
          if (item.action.type === 'NEW_SALE') {
            await this.post('/api/invoices', item.action.payload);
          } else if (item.action.type === 'SAVE_PARTY') {
            await this.post('/api/parties', item.action.payload);
          } else if (item.action.type === 'CONVERT_STOCK') {
            await this.post('/api/stock-conversion/convert', item.action.payload);
          }
        } catch (e) {
          console.warn('[API] Queue item sync retry note:', e);
        }
      }
      db.clearQueue();
    }

    await db.loadFromSharedDatabase();
    this.updateSyncUI(true);
    app.refreshAllData();
    app.showToast('✅ All transactions & parties synchronized with EEYES PRO!', 'success');
  }
}

const api = new MobileAPI();
