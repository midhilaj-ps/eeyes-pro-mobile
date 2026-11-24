/**
 * EEYES PRO Mobile - Parties & Khata Ledger Engine
 */

class MobileParties {
  constructor() {
    this.currentFilter = 'all';
    this.selectedPartyId = null;
  }

  renderPartiesList() {
    const container = document.getElementById('parties-list-container');
    if (!container) return;

    const partiesList = db.get('parties') || [];
    let filtered = partiesList;

    if (this.currentFilter === 'customer') {
      filtered = partiesList.filter(p => p.type === 'customer');
    } else if (this.currentFilter === 'supplier') {
      filtered = partiesList.filter(p => p.type === 'supplier');
    } else if (this.currentFilter === 'due') {
      filtered = partiesList.filter(p => (p.balance || 0) > 0);
    }

    const searchVal = (document.getElementById('parties-search-input')?.value || '').toLowerCase();
    if (searchVal) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchVal) ||
        (p.phone && p.phone.includes(searchVal)) ||
        (p.place && p.place.toLowerCase().includes(searchVal))
      );
    }

    // Update Totals
    let totalRec = 0;
    let totalPay = 0;
    partiesList.forEach(p => {
      if (p.type === 'customer' && p.balanceType === 'DR') totalRec += p.balance || 0;
      if (p.type === 'supplier' && p.balanceType === 'CR') totalPay += p.balance || 0;
    });

    const recEl = document.getElementById('parties-total-rec');
    const payEl = document.getElementById('parties-total-pay');
    if (recEl) recEl.textContent = `₹ ${totalRec.toLocaleString('en-IN')}`;
    if (payEl) payEl.textContent = `₹ ${totalPay.toLocaleString('en-IN')}`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:var(--text-muted);">
          <div style="font-size:32px; margin-bottom:8px;">👥</div>
          <div style="font-size:13px; font-weight:600;">No parties found</div>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(party => {
      const isCust = party.type === 'customer';
      const isDue = (party.balance || 0) > 0;
      const amountColor = isCust ? '#f87171' : '#34d399';
      const balanceLabel = isCust ? 'Due (ലഭിക്കാനുള്ളത്)' : 'Payable (കൊടുക്കാനുള്ളത്)';

      return `
        <div class="list-item" onclick="parties.openPartyLedger('${party.id}')">
          <div class="item-main">
            <div class="item-avatar" style="background:${isCust ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}; color:${amountColor}; font-weight:800; font-size:14px;">
              ${party.name.substring(0, 2).toUpperCase()}
            </div>
            <div class="item-details">
              <div class="item-title">${party.name}</div>
              <div class="item-sub">
                <span>📱 ${party.phone || 'No phone'}</span>
                <span>•</span>
                <span>${party.place || 'Local'}</span>
              </div>
            </div>
          </div>
          <div class="item-right">
            <div class="item-amount" style="color:${amountColor};">
              ₹ ${Number(party.balance || 0).toLocaleString('en-IN')}
            </div>
            <span class="badge ${isDue ? 'badge-unpaid' : 'badge-paid'}" style="font-size:9px;">
              ${balanceLabel}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  filterParties() {
    this.renderPartiesList();
  }

  setPartyFilter(filter, el) {
    this.currentFilter = filter;
    document.querySelectorAll('#tab-parties .chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    this.renderPartiesList();
  }

  openPartyLedger(partyId) {
    this.selectedPartyId = partyId;
    const partiesList = db.get('parties') || [];
    const party = partiesList.find(p => p.id === partyId);
    if (!party) return;

    const modal = document.getElementById('modal-party-ledger');
    const nameEl = document.getElementById('ledger-party-name');
    const balanceEl = document.getElementById('ledger-balance-val');
    const phoneEl = document.getElementById('ledger-phone-val');
    const listEl = document.getElementById('ledger-entries-list');

    if (nameEl) nameEl.textContent = `${party.name} (${party.type.toUpperCase()})`;
    if (balanceEl) balanceEl.textContent = `₹ ${Number(party.balance || 0).toLocaleString('en-IN')}`;
    if (phoneEl) phoneEl.textContent = `📱 ${party.phone} • ${party.place || 'Thodupuzha'}`;

    // Load related invoices
    const invoices = db.get('invoices') || [];
    const partyInvoices = invoices.filter(i => i.partyId === party.id || i.partyName === party.name);

    if (listEl) {
      if (partyInvoices.length === 0) {
        listEl.innerHTML = `
          <div style="text-align:center; padding:16px; color:var(--text-dim); font-size:12px;">
            Opening Balance: ₹ ${Number(party.balance || 0).toLocaleString('en-IN')}
          </div>
        `;
      } else {
        listEl.innerHTML = partyInvoices.map(inv => `
          <div class="list-item" style="padding:10px 12px; margin-bottom:0;">
            <div style="flex:1;">
              <div style="font-size:13px; font-weight:700; color:#fff;">${inv.invoiceNo}</div>
              <div style="font-size:11px; color:var(--text-muted);">${inv.date} • ${inv.paymentMode}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:13px; font-weight:800; color:#fff;">₹ ${inv.amount.toLocaleString('en-IN')}</div>
              <span class="badge ${inv.status === 'PAID' ? 'badge-paid' : 'badge-unpaid'}">${inv.status}</span>
            </div>
          </div>
        `).join('');
      }
    }

    if (modal) modal.classList.add('open');
  }

  closeLedgerModal() {
    const modal = document.getElementById('modal-party-ledger');
    if (modal) modal.classList.remove('open');
  }

  callParty() {
    const partiesList = db.get('parties') || [];
    const party = partiesList.find(p => p.id === this.selectedPartyId);
    if (party && party.phone) {
      window.location.href = `tel:${party.phone}`;
    } else {
      app.showToast('Phone number not available', 'warn');
    }
  }

  sendWhatsAppReminder() {
    const partiesList = db.get('parties') || [];
    const party = partiesList.find(p => p.id === this.selectedPartyId);
    if (!party) return;

    const upiLink = upi.generateUpiUri(party.balance, 'REMINDER', `Payment to E.S Trading Co.`);
    const msg = `*E.S TRADING COMPANY - PAYMENT REMINDER*\nDear ${party.name},\nThis is a friendly reminder that an outstanding balance of *₹ ${Number(party.balance).toLocaleString('en-IN')}* is pending in your ledger account.\n\nYou can pay instantly via UPI using this link:\n${upiLink}\n\nOr UPI ID: estrading@sbi\nThank you!`;

    const waUrl = `https://wa.me/91${party.phone || ''}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  }

  openRecordPaymentModal() {
    const amountStr = prompt('Enter payment amount received (₹):');
    if (!amountStr || isNaN(amountStr) || Number(amountStr) <= 0) return;

    const amt = Number(amountStr);
    const partiesList = db.get('parties') || [];
    const party = partiesList.find(p => p.id === this.selectedPartyId);
    if (party) {
      party.balance = Math.max(0, (party.balance || 0) - amt);
      db.set('parties', partiesList);

      // Log invoice payment
      const invoices = db.get('invoices') || [];
      invoices.unshift({
        id: 'rec-' + Date.now(),
        invoiceNo: `REC-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        type: 'sale',
        partyId: party.id,
        partyName: party.name,
        amount: amt,
        status: 'PAID',
        paymentMode: 'CASH',
        items: [{ name: 'Ledger Payment Receipt (പണം വരവ്)', qty: 1, rate: amt, total: amt }]
      });
      db.set('invoices', invoices);

      app.refreshAllData();
      this.openPartyLedger(party.id);
      app.showToast(`✅ Recorded payment of ₹ ${amt.toLocaleString('en-IN')}!`, 'success');
    }
  }

  async openAddPartyModal() {
    const name = prompt('Customer / Party Name:');
    if (!name) return;
    const phone = prompt('Mobile Phone Number:');
    const place = prompt('Town / Location:', 'Thodupuzha');

    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const newParty = {
      id: cleanPhone.length >= 10 ? `party-${cleanPhone}` : `party-${Date.now()}`,
      name: name.trim(),
      type: 'customer',
      partyType: 'customer',
      phone: cleanPhone || phone || '',
      place: place ? place.trim() : 'Local',
      city: place ? place.trim() : 'Local',
      balance: 0,
      currentBalance: 0,
      openingBalance: 0,
      balanceType: 'to_collect',
      source: 'EEYES PRO Mobile App'
    };

    // Save directly to shared EEYES PRO database via API
    await db.addOrUpdateParty(newParty);
    app.refreshAllData();
    app.showToast(`✅ Added party "${name}" to EEYES PRO Database!`, 'success');
  }

  openQuickCollectModal() {
    app.switchTab('parties');
    app.showToast('Select a customer to record payment or send UPI reminder', 'info');
  }
}

const parties = new MobileParties();
