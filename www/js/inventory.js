/**
 * EEYES PRO Mobile - Inventory, Items & Bulk Stock Conversion Engine
 */

class MobileInventory {
  constructor() {
    this.currentCategory = 'all';
  }

  renderInventoryList() {
    const container = document.getElementById('inventory-list-container');
    if (!container) return;

    const items = db.get('items') || [];
    let filtered = items;

    if (this.currentCategory !== 'all') {
      filtered = items.filter(i => i.category === this.currentCategory);
    }

    const searchVal = (document.getElementById('inventory-search-input')?.value || '').toLowerCase();
    if (searchVal) {
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(searchVal) ||
        (i.barcode && i.barcode.toLowerCase().includes(searchVal)) ||
        (i.category && i.category.toLowerCase().includes(searchVal))
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:var(--text-muted);">
          <div style="font-size:32px; margin-bottom:8px;">📦</div>
          <div style="font-size:13px; font-weight:600;">No items found</div>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(item => {
      const isLow = item.stock <= (item.minStock || 5);
      const stockBadge = isLow ? 'badge-low' : 'badge-stock';
      const stockText = isLow ? `⚠️ Low: ${item.stock} ${item.unit}` : `${item.stock} ${item.unit}`;

      return `
        <div class="list-item" onclick="inventory.showItemQuickActions('${item.id}')">
          <div class="item-main">
            <div class="item-avatar" style="background:${isLow ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'}; color:${isLow ? '#f87171' : '#60a5fa'}; font-size:20px;">
              ${this.getItemIcon(item.category)}
            </div>
            <div class="item-details">
              <div class="item-title">${item.name}</div>
              <div class="item-sub">
                <span>Code: ${item.barcode || 'N/A'}</span>
                <span>•</span>
                <span>GST ${item.taxRate || 0}%</span>
              </div>
            </div>
          </div>
          <div class="item-right">
            <div class="item-amount" style="color:#34d399;">₹ ${Number(item.salePrice).toLocaleString('en-IN')}</div>
            <span class="badge ${stockBadge}">${stockText}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  getItemIcon(cat) {
    switch (cat) {
      case 'Grocery': return '🌾';
      case 'Cooking Oils': return '🛢️';
      case 'Spices': return '🌶️';
      case 'Sacks': return '📦';
      case 'Provisions': return '🧂';
      default: return '🛍️';
    }
  }

  filterItems() {
    this.renderInventoryList();
  }

  setCategoryFilter(cat, el) {
    this.currentCategory = cat;
    document.querySelectorAll('#tab-inventory .chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    this.renderInventoryList();
  }

  renderLowStockAlerts() {
    const listEl = document.getElementById('dash-low-stock-list');
    const countEl = document.getElementById('dash-low-stock-count');
    const cardEl = document.getElementById('dash-low-stock-card');
    if (!listEl) return;

    const items = db.get('items') || [];
    const lowItems = items.filter(i => i.stock <= (i.minStock || 5));

    if (countEl) countEl.textContent = `${lowItems.length} Items`;

    if (lowItems.length === 0) {
      if (cardEl) cardEl.style.display = 'none';
      return;
    }
    if (cardEl) cardEl.style.display = 'block';

    listEl.innerHTML = lowItems.slice(0, 3).map(i => `
      <div class="list-item" style="padding:8px 12px; margin-bottom:0; background:#162032;">
        <div style="flex:1;">
          <div style="font-size:12px; font-weight:700; color:#fff;">${i.name}</div>
          <div style="font-size:10px; color:#f87171;">Only ${i.stock} ${i.unit} left (Reorder level: ${i.minStock})</div>
        </div>
        <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="inventory.reorderItem('${i.id}')">
          + Restock
        </button>
      </div>
    `).join('');
  }

  showItemQuickActions(itemId) {
    const items = db.get('items') || [];
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newStockStr = prompt(`Update stock for ${item.name}:\nCurrent stock is ${item.stock} ${item.unit}. Enter new stock:`, item.stock);
    if (newStockStr !== null && !isNaN(newStockStr)) {
      item.stock = parseFloat(newStockStr);
      db.set('items', items);
      app.refreshAllData();
      app.showToast(`Updated stock for ${item.name} to ${item.stock} ${item.unit}`, 'success');
    }
  }

  reorderItem(itemId) {
    const items = db.get('items') || [];
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const addQty = prompt(`Enter inward quantity for ${item.name} (${item.unit}):`, '10');
    if (addQty && !isNaN(addQty)) {
      item.stock += parseFloat(addQty);
      db.set('items', items);
      app.refreshAllData();
      app.showToast(`✅ Inward stock recorded: +${addQty} ${item.unit}`, 'success');
    }
  }

  // ==========================================
  // BULK-TO-LOOSE CONVERSION ENGINE
  // ==========================================
  openBulkConversionModal() {
    this.calcConversionKPIs();
    const modal = document.getElementById('modal-bulk-conversion');
    if (modal) modal.classList.add('open');
  }

  closeBulkConversionModal() {
    const modal = document.getElementById('modal-bulk-conversion');
    if (modal) modal.classList.remove('open');
  }

  onBulkParentChanged() {
    const sel = document.getElementById('conv-parent-select');
    const childNameInput = document.getElementById('conv-child-name');
    if (!sel || !childNameInput) return;

    if (sel.value === 'item-sack-1') {
      childNameInput.value = 'Ajwa Rice - Loose (KG)';
    } else if (sel.value === 'item-sack-2') {
      childNameInput.value = 'Jaya Rice - Loose (KG)';
    } else {
      childNameInput.value = 'Matta Rice - Loose (KG)';
    }
    this.calcConversionKPIs();
  }

  calcConversionKPIs() {
    const weightInput = document.getElementById('conv-measured-weight');
    const usableEl = document.getElementById('conv-kpi-usable');
    const lossEl = document.getElementById('conv-kpi-loss');
    const costEl = document.getElementById('conv-kpi-cost');

    const usable = parseFloat(weightInput ? weightInput.value : 49.2) || 49.2;
    const nominal = 50.0;
    const lossKg = Math.max(0, nominal - usable);
    const lossPct = ((lossKg / nominal) * 100).toFixed(1);
    const sackCost = 2500; // Rs 2500 per sack
    const trueCostPerKg = (sackCost / usable).toFixed(2);

    if (usableEl) usableEl.textContent = `${usable.toFixed(2)} KG`;
    if (lossEl) lossEl.textContent = `${lossKg.toFixed(2)} KG (${Math.round(lossKg * 1000)}g • ${lossPct}%)`;
    if (costEl) costEl.textContent = `₹ ${trueCostPerKg} / KG`;
  }

  async processStockConversion() {
    const weightInput = document.getElementById('conv-measured-weight');
    const usable = parseFloat(weightInput ? weightInput.value : 49.2) || 49.2;
    const parentSel = document.getElementById('conv-parent-select');
    const parentId = parentSel ? parentSel.value : 'item-sack-1';
    const childName = document.getElementById('conv-child-name')?.value || 'Ajwa Rice - Loose (KG)';

    await db.processStockConversion(parentId, childName, usable);

    this.closeBulkConversionModal();
    app.refreshAllData();
    app.showToast(`✅ Conversion complete: 1 Sack converted to ${usable} KG loose in shared ERP!`, 'success');
  }
}

const inventory = new MobileInventory();
