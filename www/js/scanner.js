/**
 * EEYES PRO Mobile - Camera Barcode & QR Code Scanner
 */

class MobileScanner {
  constructor() {
    this.currentMode = 'barcode';
    this.videoStream = null;
    this.scanInterval = null;
  }

  async openScannerModal(mode = 'barcode') {
    this.currentMode = mode;
    const modal = document.getElementById('modal-scanner');
    if (modal) modal.classList.add('open');

    const videoEl = document.getElementById('scanner-video');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        this.videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoEl) {
          videoEl.srcObject = this.videoStream;
          videoEl.play();
        }
      } catch (err) {
        console.warn('[Scanner] Camera access unavailable or denied:', err);
        app.showToast('Camera access unavailable. Use manual barcode entry below.', 'warn');
      }
    } else {
      app.showToast('Web camera not supported in this context. Use manual input.', 'warn');
    }
  }

  closeScannerModal() {
    const modal = document.getElementById('modal-scanner');
    if (modal) modal.classList.remove('open');

    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }

  submitManualBarcode() {
    const inputEl = document.getElementById('manual-barcode-input');
    const code = inputEl ? inputEl.value.trim() : '';
    if (!code) {
      app.showToast('Please enter a barcode or item code', 'warn');
      return;
    }
    this.processScannedCode(code);
    if (inputEl) inputEl.value = '';
    this.closeScannerModal();
  }

  processScannedCode(code) {
    if (navigator.vibrate) {
      navigator.vibrate(60); // Haptic feedback
    }

    const items = db.get('items') || [];
    const item = items.find(i => (i.barcode && i.barcode.toLowerCase() === code.toLowerCase()) || (i.id && i.id.toLowerCase() === code.toLowerCase()));

    if (this.currentMode === 'sale_item') {
      if (item) {
        billing.addItemDirectToCart(item);
        app.showToast(`Scanned: ${item.name} added to bill!`, 'success');
      } else {
        app.showToast(`Item code "${code}" not found in inventory.`, 'warn');
      }
      return;
    }

    if (item) {
      app.showToast(`Found: ${item.name} • Stock: ${item.stock} ${item.unit}`, 'info');
      app.switchTab('inventory');
      const searchBox = document.getElementById('inventory-search-input');
      if (searchBox) {
        searchBox.value = item.name;
        inventory.filterItems();
      }
    } else {
      app.showToast(`No item matching barcode: ${code}`, 'warn');
    }
  }
}

const scanner = new MobileScanner();
