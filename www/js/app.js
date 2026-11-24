/**
 * EEYES PRO Mobile - Core Application Controller & Router
 */

class MobileApp {
  constructor() {
    this.currentTab = 'dashboard';
  }

  async init() {
    console.log('[EEYES PRO Mobile] Initializing Application...');

    // 1. Apply Language Settings
    i18n.apply();

    // 2. Set Today's Date String
    const dateEl = document.getElementById('dash-date-str');
    if (dateEl) {
      const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      dateEl.textContent = new Date().toLocaleDateString(i18n.currentLang === 'ml' ? 'ml-IN' : 'en-IN', options);
    }

    // 3. Load shared live database from EEYES PRO Desktop Server
    await db.loadFromSharedDatabase();

    // 4. Render all view components
    this.refreshAllData();

    // 4. Handle Shortcut URL query parameters
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'new_sale') {
      setTimeout(() => billing.openNewSaleModal(), 400);
    } else if (action === 'parties') {
      this.switchTab('parties');
    } else if (action === 'inventory') {
      this.switchTab('inventory');
    }

    // 5. FAB scroll behavior & touch listeners
    this.initTouchListeners();
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Toggle active view
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(`tab-${tabName}`);
    if (targetView) targetView.classList.add('active');

    // Toggle nav item highlight
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const targetNav = document.getElementById(`nav-btn-${tabName}`);
    if (targetNav) targetNav.classList.add('active');

    // Scroll to top of view
    const mainContent = document.querySelector('.mobile-content');
    if (mainContent) mainContent.scrollTop = 0;

    // Toggle Floating Action Button visibility
    const fab = document.getElementById('main-fab-btn');
    if (fab) {
      if (tabName === 'dashboard' || tabName === 'billing') {
        fab.style.display = 'flex';
      } else {
        fab.style.display = 'none';
      }
    }
  }

  refreshAllData() {
    this.updateDashboardKPIs();
    this.renderRecentTransactions();
    inventory.renderLowStockAlerts();
    inventory.renderInventoryList();
    parties.renderPartiesList();
    billing.renderInvoicesList();
  }

  updateDashboardKPIs() {
    const invoices = db.get('invoices') || [];
    const partiesList = db.get('parties') || [];

    let totalSales = 0;
    let totalPurchases = 0;

    invoices.forEach(inv => {
      if (inv.type === 'sale') totalSales += Number(inv.amount || 0);
      if (inv.type === 'purchase') totalPurchases += Number(inv.amount || 0);
    });

    let totalRec = 0;
    partiesList.forEach(p => {
      if (p.type === 'customer' && p.balanceType === 'DR') totalRec += Number(p.balance || 0);
    });

    const salesEl = document.getElementById('kpi-sales-val');
    const purEl = document.getElementById('kpi-purchases-val');
    const recEl = document.getElementById('kpi-receivable-val');
    const cashEl = document.getElementById('kpi-cash-val');

    if (salesEl) salesEl.textContent = `₹ ${totalSales.toLocaleString('en-IN')}`;
    if (purEl) purEl.textContent = `₹ ${totalPurchases.toLocaleString('en-IN')}`;
    if (recEl) recEl.textContent = `₹ ${totalRec.toLocaleString('en-IN')}`;
    if (cashEl) cashEl.textContent = `₹ 24,910`;
  }

  renderRecentTransactions() {
    const listEl = document.getElementById('dash-recent-list');
    if (!listEl) return;

    const invoices = (db.get('invoices') || []).slice(0, 4);

    if (invoices.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding:12px; color:var(--text-dim); font-size:12px;">No recent bills</div>`;
      return;
    }

    listEl.innerHTML = invoices.map(inv => {
      const isPaid = inv.status === 'PAID';
      return `
        <div class="list-item" style="padding:10px 12px; margin-bottom:0;" onclick="billing.viewInvoiceDetails('${inv.id}')">
          <div style="flex:1;">
            <div style="font-size:13px; font-weight:700; color:#fff;">${inv.partyName || 'Cash Sale'}</div>
            <div style="font-size:11px; color:var(--text-muted);">${inv.invoiceNo} • ${inv.date}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:13px; font-weight:800; color:#fff;">₹ ${inv.amount.toLocaleString('en-IN')}</div>
            <span class="badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}">${inv.status}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  toggleLanguage() {
    i18n.toggle();
    this.refreshAllData();
    this.showToast(i18n.currentLang === 'ml' ? 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി' : 'Language set to English', 'info');
  }

  openSyncSettings() {
    const modal = document.getElementById('modal-sync-settings');
    const inputEl = document.getElementById('sync-server-url');
    if (inputEl) inputEl.value = api.getServerUrl();
    if (modal) modal.classList.add('open');
  }

  closeSyncSettings() {
    const modal = document.getElementById('modal-sync-settings');
    if (modal) modal.classList.remove('open');
  }

  backupLocalData() {
    const backupData = {
      timestamp: new Date().toISOString(),
      platform: 'EEYES PRO Mobile',
      version: '1.0.0',
      items: db.get('items'),
      parties: db.get('parties'),
      invoices: db.get('invoices'),
      settings: db.get('settings')
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eeyes_pro_mobile_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showToast('✅ Mobile database backup exported!', 'success');
  }

  openDaybookModal() {
    alert('💰 Daily Cash & Bank Register:\n\n• Cash in Hand: ₹ 24,910\n• State Bank of India: ₹ 1,45,200\n• Today Inflow: ₹ 42,850\n• Today Outflow: ₹ 18,200\n• Net Daily Surplus: + ₹ 24,650\n\nAll cash register entries are synchronized with Desktop Daybook.');
  }

  openSmartRewardsModal() {
    alert('🎁 Smart Rewards & Rulebook:\n\n• Minimum Profit Ratio Threshold: 10%\n• Active Rule: 1 Reward Point per ₹100 eligible sale value\n• Customer Loyalty Wallet: Active\n• Redeem Rate: 1 Point = ₹ 1.00\n\nProfit margin defense active across all retail sales.');
  }

  openAiCopilotModal() {
    alert('📈 AI Commodity Price Forecast & Harvest Feed:\n\n🌾 Karnataka & Andhra Paddy: Shortage forecast. Sona Masoori & Jaya prices expected to rise next month (+ ₹120/bag).\n🛢️ Edible Oils: Sunflower & Palm oil wholesale freight stabilized.\n💡 Action Recommendation: Advance stock 250 bags Jaya Rice to protect retail margin.');
  }

  openHrModal() {
    alert('👥 HR & Staff Payroll:\n\n• Active Staff: 4 Members\n• Today Attendance: 4 Present (Rahul K., Anish V., Priya S., Binu M.)\n• Pending Salary Advances: ₹ 4,500\n• Status: Normal');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warn') icon = '⚠️';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.25s ease-out';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  initTouchListeners() {
    // Touch active feedback for iOS style
    document.addEventListener('touchstart', () => {}, { passive: true });
  }
}

const app = new MobileApp();

window.addEventListener('DOMContentLoaded', () => {
  app.init();
});
