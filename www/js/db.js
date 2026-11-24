/**
 * EEYES PRO Mobile - Unified Real-Time ERP Database Layer
 * Shares 100% of the live database with EEYES PRO Desktop Software
 * Data Source: vyapar-web/data (eeyes-parties.json, eeyes-items.json, eeyes-invoices.json)
 */

class MobileDB {
  constructor() {
    this.STORAGE_PREFIX = 'eeyes_live_';
    this.items = [];
    this.parties = [];
    this.invoices = [];
    this.settings = null;
    this.offlineQueue = this.getLocalStorage('offline_queue') || [];
    this.isLoaded = false;
  }

  getLocalStorage(key) {
    try {
      const data = localStorage.getItem(this.STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  setLocalStorage(key, val) {
    try {
      localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(val));
    } catch (e) {}
  }

  // Load live data from EEYES PRO Desktop Database via API
  async loadFromSharedDatabase() {
    try {
      console.log('[DB] Connecting to shared EEYES PRO database via API...');

      // 1. Fetch live parties from eeyes-parties.json
      const partiesData = await api.get('/api/parties');
      if (partiesData && (partiesData.parties || Array.isArray(partiesData))) {
        this.parties = partiesData.parties || partiesData;
        this.setLocalStorage('parties', this.parties);
      } else {
        this.parties = this.getLocalStorage('parties') || [];
      }

      // 2. Fetch live items from eeyes-items.json
      const itemsData = await api.get('/api/items');
      if (itemsData && (itemsData.items || Array.isArray(itemsData))) {
        this.items = (itemsData.items || itemsData).map(item => ({
          id: item.id || `item-${item.code || item.name}`,
          name: item.name,
          category: item.category || 'General',
          unit: item.unit || 'NOS',
          salePrice: parseFloat(item.sellingPriceRetail || item.salePrice || item.purchasePrice || 0),
          purchasePrice: parseFloat(item.purchasePrice || item.costPrice || 0),
          taxRate: parseFloat(item.taxRate || 0),
          stock: parseFloat(item.stock || 0),
          minStock: parseFloat(item.minStock || 5),
          barcode: item.barcode || item.code || (item.batches && item.batches[0] ? item.batches[0].batchNo : '')
        }));
        this.setLocalStorage('items', this.items);
      } else {
        this.items = this.getLocalStorage('items') || [];
      }

      // 3. Fetch live invoices from eeyes-invoices.json
      const invoicesData = await api.get('/api/invoices');
      if (invoicesData && (invoicesData.invoices || Array.isArray(invoicesData))) {
        this.invoices = (invoicesData.invoices || invoicesData).map(inv => ({
          id: inv.id || inv.invoiceNo,
          invoiceNo: inv.invoiceNo,
          date: inv.date || new Date().toISOString().split('T')[0],
          type: (inv.type === 'tax_invoice' || inv.type === 'sale' || !inv.type) ? 'sale' : 'purchase',
          partyId: inv.partyId,
          partyName: inv.partyName || 'Cash Customer',
          partyPhone: inv.partyPhone,
          amount: parseFloat(inv.grandTotal || inv.amount || 0),
          tax: parseFloat(inv.taxTotal || inv.tax || 0),
          status: (inv.balanceDue === 0 || inv.status === 'PAID') ? 'PAID' : 'UNPAID',
          paymentMode: inv.paymentMode || 'CASH',
          items: inv.items || []
        }));
        this.setLocalStorage('invoices', this.invoices);
      } else {
        this.invoices = this.getLocalStorage('invoices') || [];
      }

      // 4. Fetch general business settings
      const settingsData = await api.get('/api/settings/general');
      if (settingsData && settingsData.settings) {
        this.settings = settingsData.settings;
        this.setLocalStorage('settings', this.settings);
      }

      this.isLoaded = true;
      console.log(`[DB] Live ERP database loaded: ${this.parties.length} parties, ${this.items.length} items, ${this.invoices.length} invoices.`);
      return true;
    } catch (err) {
      console.warn('[DB] API connection offline. Falling back to local offline cache:', err.message);
      this.parties = this.getLocalStorage('parties') || [];
      this.items = this.getLocalStorage('items') || [];
      this.invoices = this.getLocalStorage('invoices') || [];
      this.isLoaded = true;
      return false;
    }
  }

  get(key) {
    if (key === 'items') return this.items;
    if (key === 'parties') return this.parties;
    if (key === 'invoices') return this.invoices;
    if (key === 'settings') return this.settings || this.getLocalStorage('settings');
    if (key === 'offline_queue') return this.offlineQueue;
    return this.getLocalStorage(key);
  }

  set(key, val) {
    if (key === 'items') this.items = val;
    if (key === 'parties') this.parties = val;
    if (key === 'invoices') this.invoices = val;
    if (key === 'settings') this.settings = val;
    if (key === 'offline_queue') this.offlineQueue = val;
    this.setLocalStorage(key, val);
  }

  // Real-time Single Party Add/Update to EEYES PRO Database
  async addOrUpdateParty(party) {
    // 1. Optimistic local update
    const existingIdx = this.parties.findIndex(p => p.id === party.id || (party.phone && p.phone === party.phone));
    if (existingIdx >= 0) {
      this.parties[existingIdx] = Object.assign({}, this.parties[existingIdx], party);
    } else {
      this.parties.unshift(party);
    }
    this.setLocalStorage('parties', this.parties);

    // 2. Post directly to server POST /api/parties
    try {
      const res = await api.post('/api/parties', party);
      console.log('[DB] Party saved to shared EEYES PRO database:', res);
      return res;
    } catch (e) {
      console.warn('[DB] Offline: queued party save for sync', e);
      this.queueOfflineAction({ type: 'SAVE_PARTY', payload: party });
    }
  }

  // Real-time Invoice Creation to EEYES PRO Database
  async saveInvoice(invoice) {
    // 1. Optimistic local update
    this.invoices.unshift(invoice);
    this.setLocalStorage('invoices', this.invoices);

    // 2. Deduct item stock locally
    if (Array.isArray(invoice.items)) {
      invoice.items.forEach(line => {
        const item = this.items.find(i => i.id === line.id || i.name === line.name);
        if (item) {
          item.stock = Math.max(0, item.stock - (line.qty || 1));
        }
      });
      this.setLocalStorage('items', this.items);
    }

    // 3. Post to EEYES PRO server POST /api/invoices
    try {
      const payload = {
        invoiceNo: invoice.invoiceNo,
        date: invoice.date,
        type: invoice.type || 'tax_invoice',
        partyId: invoice.partyId,
        partyName: invoice.partyName,
        partyPhone: invoice.partyPhone,
        grandTotal: invoice.amount,
        subtotal: invoice.amount - (invoice.tax || 0),
        taxTotal: invoice.tax || 0,
        balanceDue: invoice.status === 'UNPAID' ? invoice.amount : 0,
        receivedAmount: invoice.status === 'PAID' ? invoice.amount : 0,
        paymentMode: invoice.paymentMode || 'CASH',
        items: invoice.items
      };
      const res = await api.post('/api/invoices', payload);
      console.log('[DB] Invoice saved to shared EEYES PRO database:', res);
      return res;
    } catch (e) {
      console.warn('[DB] Offline: queued invoice for sync', e);
      this.queueOfflineAction({ type: 'NEW_SALE', payload: invoice });
    }
  }

  // Real-time Stock Conversion via EEYES PRO Engine
  async processStockConversion(parentSackId, childLooseName, measuredWeight) {
    const payload = {
      parentItemId: parentSackId,
      actualWeight: measuredWeight,
      wasteRecalculate: true,
      timestamp: new Date().toISOString()
    };

    try {
      const res = await api.post('/api/stock-conversion/convert', payload);
      await this.loadFromSharedDatabase();
      return res;
    } catch (e) {
      // Offline fallback
      const parent = this.items.find(i => i.id === parentSackId);
      const child = this.items.find(i => i.name.toLowerCase().includes('loose'));
      if (parent && parent.stock >= 1) {
        parent.stock -= 1;
        if (child) child.stock += measuredWeight;
        this.setLocalStorage('items', this.items);
      }
      this.queueOfflineAction({ type: 'CONVERT_STOCK', payload });
    }
  }

  queueOfflineAction(action) {
    this.offlineQueue.push({
      id: 'queue_' + Date.now(),
      timestamp: new Date().toISOString(),
      action: action
    });
    this.setLocalStorage('offline_queue', this.offlineQueue);
  }

  getPendingQueue() {
    return this.offlineQueue;
  }

  clearQueue() {
    this.offlineQueue = [];
    this.setLocalStorage('offline_queue', []);
  }
}

const db = new MobileDB();
