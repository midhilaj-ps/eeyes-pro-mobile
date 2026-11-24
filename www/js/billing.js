/**
 * EEYES PRO Mobile - Billing & Sales Invoicing Engine
 */

class MobileBilling {
  constructor() {
    this.currentFilter = 'all';
    this.cart = [];
    this.selectedPaymentMode = 'CASH';
  }

  renderInvoicesList() {
    const container = document.getElementById('invoices-list-container');
    if (!container) return;

    const invoices = db.get('invoices') || [];
    let filtered = invoices;

    if (this.currentFilter === 'sale') {
      filtered = invoices.filter(i => i.type === 'sale');
    } else if (this.currentFilter === 'purchase') {
      filtered = invoices.filter(i => i.type === 'purchase');
    } else if (this.currentFilter === 'unpaid') {
      filtered = invoices.filter(i => i.status === 'UNPAID');
    }

    const searchVal = (document.getElementById('billing-search-input')?.value || '').toLowerCase();
    if (searchVal) {
      filtered = filtered.filter(i =>
        (i.invoiceNo && i.invoiceNo.toLowerCase().includes(searchVal)) ||
        (i.partyName && i.partyName.toLowerCase().includes(searchVal))
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:var(--text-muted);">
          <div style="font-size:32px; margin-bottom:8px;">🧾</div>
          <div style="font-size:13px; font-weight:600;">No matching invoices found</div>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(inv => {
      const isSale = inv.type === 'sale';
      const isPaid = inv.status === 'PAID';
      const badgeClass = isPaid ? 'badge-paid' : 'badge-unpaid';
      const typeBadge = isSale ? 'Sale' : 'Purchase';
      const typeColor = isSale ? '#38bdf8' : '#c084fc';

      return `
        <div class="list-item" onclick="billing.viewInvoiceDetails('${inv.id}')">
          <div class="item-main">
            <div class="item-avatar" style="background:${isSale ? 'rgba(56, 189, 248, 0.15)' : 'rgba(192, 132, 252, 0.15)'}; color:${typeColor};">
              ${isSale ? '🧾' : '📦'}
            </div>
            <div class="item-details">
              <div class="item-title">${inv.partyName || 'Cash Customer'}</div>
              <div class="item-sub">
                <span>${inv.invoiceNo}</span>
                <span>•</span>
                <span>${inv.date}</span>
              </div>
            </div>
          </div>
          <div class="item-right">
            <div class="item-amount">₹ ${Number(inv.amount || 0).toLocaleString('en-IN')}</div>
            <span class="badge ${badgeClass}">${inv.status}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  filterInvoices() {
    this.renderInvoicesList();
  }

  setInvoiceFilter(filter, el) {
    this.currentFilter = filter;
    document.querySelectorAll('#tab-billing .chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    this.renderInvoicesList();
  }

  openNewSaleModal() {
    this.cart = [];
    this.selectedPaymentMode = 'CASH';

    // Populate party dropdown
    const partySelect = document.getElementById('sale-party-select');
    if (partySelect) {
      const partiesList = db.get('parties') || [];
      const customers = partiesList.filter(p => p.type === 'customer');
      partySelect.innerHTML = `
        <option value="">Cash Customer (നേരിട്ടുള്ള ഉപഭോക്താവ്)</option>
        ${customers.map(c => `<option value="${c.id}">${c.name} (${c.place || 'Local'})</option>`).join('')}
      `;
    }

    // Populate items dropdown
    const itemSelect = document.getElementById('sale-item-select');
    if (itemSelect) {
      const itemsList = db.get('items') || [];
      itemSelect.innerHTML = itemsList.map(item =>
        `<option value="${item.id}">${item.name} - ₹${item.salePrice} (Stock: ${item.stock})</option>`
      ).join('');
    }

    this.onPartySelected();
    this.renderCart();

    const modal = document.getElementById('modal-new-sale');
    if (modal) modal.classList.add('open');
  }

  closeNewSaleModal() {
    const modal = document.getElementById('modal-new-sale');
    if (modal) modal.classList.remove('open');
  }

  onPartySelected() {
    const partySelect = document.getElementById('sale-party-select');
    const balancePill = document.getElementById('sale-party-balance-pill');
    if (!partySelect || !balancePill) return;

    const partyId = partySelect.value;
    if (!partyId) {
      balancePill.textContent = 'Cash Sale: No previous ledger balance';
      balancePill.style.color = '#94a3b8';
      return;
    }

    const partiesList = db.get('parties') || [];
    const party = partiesList.find(p => p.id === partyId);
    if (party) {
      balancePill.textContent = `Current Khata Balance: ₹ ${Number(party.balance || 0).toLocaleString('en-IN')} (Due)`;
      balancePill.style.color = '#fbbf24';
    }
  }

  addItemToCart() {
    const itemSelect = document.getElementById('sale-item-select');
    if (!itemSelect) return;
    const itemId = itemSelect.value;
    const itemsList = db.get('items') || [];
    const item = itemsList.find(i => i.id === itemId);
    if (item) {
      this.addItemDirectToCart(item);
    }
  }

  addItemDirectToCart(item) {
    const existing = this.cart.find(c => c.id === item.id);
    if (existing) {
      existing.qty += 1;
      existing.total = existing.qty * existing.rate;
    } else {
      this.cart.push({
        id: item.id,
        name: item.name,
        qty: 1,
        unit: item.unit || 'NOS',
        rate: item.salePrice,
        taxRate: item.taxRate || 0,
        total: item.salePrice
      });
    }
    this.renderCart();
  }

  updateCartQty(index, delta) {
    if (this.cart[index]) {
      this.cart[index].qty += delta;
      if (this.cart[index].qty <= 0) {
        this.cart.splice(index, 1);
      } else {
        this.cart[index].total = this.cart[index].qty * this.cart[index].rate;
      }
      this.renderCart();
    }
  }

  renderCart() {
    const cartList = document.getElementById('sale-cart-list');
    const countEl = document.getElementById('cart-item-count');
    const taxableEl = document.getElementById('sale-taxable-val');
    const gstEl = document.getElementById('sale-gst-val');
    const grandEl = document.getElementById('sale-grand-total');

    if (!cartList) return;

    if (countEl) countEl.textContent = this.cart.length;

    if (this.cart.length === 0) {
      cartList.innerHTML = `
        <div style="text-align:center; padding:16px; color:var(--text-dim); font-size:12px;">
          Cart is empty. Select an item or scan barcode.
        </div>
      `;
      if (taxableEl) taxableEl.textContent = '₹ 0.00';
      if (gstEl) gstEl.textContent = '₹ 0.00';
      if (grandEl) grandEl.textContent = '₹ 0.00';
      return;
    }

    let subtotal = 0;
    let totalTax = 0;

    cartList.innerHTML = this.cart.map((c, idx) => {
      subtotal += c.total;
      const tax = (c.total * (c.taxRate || 0)) / 100;
      totalTax += tax;

      return `
        <div class="list-item" style="padding:10px 12px; margin-bottom:0;">
          <div style="flex:1;">
            <div style="font-size:13px; font-weight:700; color:#fff;">${c.name}</div>
            <div style="font-size:11px; color:var(--text-muted);">₹ ${c.rate} / ${c.unit} • Tax ${c.taxRate}%</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="btn btn-secondary" style="padding:2px 8px; font-size:14px;" onclick="billing.updateCartQty(${idx}, -1)">-</button>
            <span style="font-size:13px; font-weight:800; min-width:20px; text-align:center;">${c.qty}</span>
            <button type="button" class="btn btn-secondary" style="padding:2px 8px; font-size:14px;" onclick="billing.updateCartQty(${idx}, 1)">+</button>
            <div style="font-size:13px; font-weight:800; color:#34d399; margin-left:8px; min-width:60px; text-align:right;">
              ₹ ${c.total.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      `;
    }).join('');

    const grandTotal = subtotal + totalTax;
    if (taxableEl) taxableEl.textContent = `₹ ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (gstEl) gstEl.textContent = `₹ ${totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (grandEl) grandEl.textContent = `₹ ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }

  setPaymentMode(mode, el) {
    this.selectedPaymentMode = mode;
    document.querySelectorAll('.sale-pay-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
  }

  async saveAndPrintSale() {
    if (this.cart.length === 0) {
      app.showToast('Please add at least one product to the bill', 'warn');
      return;
    }

    const partySelect = document.getElementById('sale-party-select');
    const partyId = partySelect ? partySelect.value : '';
    const partiesList = db.get('parties') || [];
    const party = partiesList.find(p => p.id === partyId);
    const partyName = party ? party.name : 'Cash Customer';
    const partyPhone = party ? party.phone : '';

    let subtotal = 0;
    let totalTax = 0;
    this.cart.forEach(c => {
      subtotal += c.total;
      totalTax += (c.total * (c.taxRate || 0)) / 100;
    });
    const grandTotal = Math.round(subtotal + totalTax);

    const invoiceNo = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInvoice = {
      id: 'inv-' + Date.now(),
      invoiceNo: invoiceNo,
      date: new Date().toISOString().split('T')[0],
      type: 'tax_invoice',
      partyId: partyId || 'cash',
      partyName: partyName,
      partyPhone: partyPhone,
      amount: grandTotal,
      tax: Math.round(totalTax),
      status: this.selectedPaymentMode === 'CREDIT' ? 'UNPAID' : 'PAID',
      paymentMode: this.selectedPaymentMode,
      items: this.cart.map(c => ({
        itemId: c.id,
        name: c.name,
        qty: c.qty,
        rate: c.rate,
        total: c.total,
        taxRate: c.taxRate
      }))
    };

    // Save directly to shared EEYES PRO database
    await db.saveInvoice(newInvoice);

    // Update customer Khata if credit
    if (party && this.selectedPaymentMode === 'CREDIT') {
      party.balance = (party.balance || 0) + grandTotal;
      party.currentBalance = party.balance;
      await db.addOrUpdateParty(party);
    }

    this.closeNewSaleModal();
    app.refreshAllData();
    app.showToast(`✅ Bill ${invoiceNo} generated & saved to EEYES PRO Database!`, 'success');

    // If UPI chosen, immediately pop QR
    if (this.selectedPaymentMode === 'UPI') {
      upi.openUpiModal(grandTotal, invoiceNo, partyName);
    } else {
      this.promptShareReceipt(newInvoice);
    }
  }

  promptShareReceipt(invoice) {
    const isMl = i18n.currentLang === 'ml';
    const textMsg = `*E.S TRADING COMPANY - TAX INVOICE*\nInvoice: ${invoice.invoiceNo}\nDate: ${invoice.date}\nCustomer: ${invoice.partyName}\nTotal Amount: ₹ ${invoice.amount.toLocaleString('en-IN')}\nPayment: ${invoice.paymentMode}\nStatus: ${invoice.status}\n\nThank you for shopping with E.S Trading Co.!`;

    if (navigator.share) {
      navigator.share({
        title: `Bill ${invoice.invoiceNo}`,
        text: textMsg
      }).catch(() => {});
    } else if (invoice.partyPhone) {
      const waUrl = `https://wa.me/91${invoice.partyPhone}?text=${encodeURIComponent(textMsg)}`;
      window.open(waUrl, '_blank');
    }
  }

  viewInvoiceDetails(invId) {
    const invoices = db.get('invoices') || [];
    const inv = invoices.find(i => i.id === invId);
    if (!inv) return;

    if (inv.status === 'UNPAID' && inv.type === 'sale') {
      upi.openUpiModal(inv.amount, inv.invoiceNo, inv.partyName);
    } else {
      this.promptShareReceipt(inv);
    }
  }
}

const billing = new MobileBilling();
