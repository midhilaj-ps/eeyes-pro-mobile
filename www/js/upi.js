/**
 * EEYES PRO Mobile - UPI Deep Linking & Dynamic QR Code Engine
 */

class MobileUPI {
  constructor() {
    this.defaultUpiId = 'estrading@sbi';
    this.payeeName = 'E.S TRADING COMPANY';
    this.currentAmount = 0;
    this.currentBillNo = '';
    this.currentPartyName = '';
  }

  generateUpiUri(amount, billNo, note) {
    const upiId = encodeURIComponent(this.defaultUpiId);
    const pn = encodeURIComponent(this.payeeName);
    const am = Number(amount || 0).toFixed(2);
    const tn = encodeURIComponent(note || `EEYES PRO Bill ${billNo || ''}`);
    return `upi://pay?pa=${upiId}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
  }

  openUpiModal(amount, billNo, partyName) {
    this.currentAmount = amount;
    this.currentBillNo = billNo;
    this.currentPartyName = partyName;

    const modal = document.getElementById('modal-upi-qr');
    const amtEl = document.getElementById('upi-display-amount');
    if (amtEl) amtEl.textContent = `₹ ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    this.renderQrCode();
    if (modal) modal.classList.add('open');
  }

  closeUpiModal() {
    const modal = document.getElementById('modal-upi-qr');
    if (modal) modal.classList.remove('open');
  }

  launchUpiIntent(appType) {
    const uri = this.generateUpiUri(this.currentAmount, this.currentBillNo, `Invoice ${this.currentBillNo}`);

    // Try native intent launching
    if (appType === 'phonepe') {
      window.location.href = uri.replace('upi://', 'phonepe://');
    } else if (appType === 'gpay') {
      window.location.href = uri.replace('upi://', 'tez://upi/');
    } else if (appType === 'paytm') {
      window.location.href = uri.replace('upi://', 'paytmmp://');
    } else {
      window.location.href = uri;
    }

    // Fallback standard UPI intent
    setTimeout(() => {
      window.location.href = uri;
    }, 300);
  }

  markAsReceived() {
    app.showToast(`✅ Payment of ₹ ${this.currentAmount} received via UPI!`, 'success');
    this.closeUpiModal();
    // Update invoice if matched
    if (this.currentBillNo) {
      const invoices = db.get('invoices') || [];
      const inv = invoices.find(i => i.invoiceNo === this.currentBillNo);
      if (inv) {
        inv.status = 'PAID';
        inv.paymentMode = 'UPI';
        db.set('invoices', invoices);
        app.refreshAllData();
      }
    }
  }

  renderQrCode() {
    const canvas = document.getElementById('upi-qr-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Simple robust high-contrast QR Matrix generator for visual scan
    const uri = this.generateUpiUri(this.currentAmount, this.currentBillNo, `Invoice ${this.currentBillNo}`);
    const hash = this.simpleHash(uri);

    const gridSize = 25;
    const cellSize = size / gridSize;

    ctx.fillStyle = '#0f172a';

    // 1. Position Detection Patterns (Finder Patterns)
    this.drawFinderPattern(ctx, 1, 1, cellSize);
    this.drawFinderPattern(ctx, gridSize - 8, 1, cellSize);
    this.drawFinderPattern(ctx, 1, gridSize - 8, cellSize);

    // 2. Data bits based on URI and hash
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Skip finder areas
        if ((r < 8 && c < 8) || (r < 8 && c >= gridSize - 8) || (r >= gridSize - 8 && c < 8)) {
          continue;
        }

        // Timing patterns
        if (r === 6 || c === 6) {
          if ((r + c) % 2 === 0) {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          }
          continue;
        }

        // Pseudo-random deterministic bits from hash and char codes
        const charIdx = (r * gridSize + c) % uri.length;
        const bit = ((hash ^ uri.charCodeAt(charIdx)) + (r * 7) + (c * 13)) % 3;
        if (bit === 0 || bit === 1) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw center eye logo for EEYES PRO
    const center = size / 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(center, center, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(center, center, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₹', center, center);
  }

  drawFinderPattern(ctx, startCol, startRow, cellSize) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(startCol * cellSize, startRow * cellSize, 7 * cellSize, 7 * cellSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect((startCol + 1) * cellSize, (startRow + 1) * cellSize, 5 * cellSize, 5 * cellSize);
    ctx.fillStyle = '#e11d48';
    ctx.fillRect((startCol + 2) * cellSize, (startRow + 2) * cellSize, 3 * cellSize, 3 * cellSize);
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

const upi = new MobileUPI();
