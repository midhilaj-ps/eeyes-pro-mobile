/**
 * EEYES PRO Mobile - Field Salesman GPS Tracker & Route Manager
 */

class MobileSalesman {
  constructor() {
    this.currentLocation = null;
    this.salesmen = [
      { id: 'sm-1', name: 'Rahul K. (Field Rep)', phone: '9847001122', route: 'Thodupuzha - Udumbannoor', activeOrders: 8, collectionsToday: 18500 },
      { id: 'sm-2', name: 'Anish V. (Delivery Van)', phone: '9447112233', route: 'Vannappuram - Kaliyar', activeOrders: 5, collectionsToday: 12400 }
    ];
  }

  openSalesmanTrackerModal() {
    this.requestGpsLocation();

    let details = `🚚 EEYES PRO - Field Salesman Route & GPS Tracking\n\n`;
    this.salesmen.forEach(sm => {
      details += `• ${sm.name}\n  Route: ${sm.route}\n  Collections: ₹ ${sm.collectionsToday.toLocaleString('en-IN')} (Orders: ${sm.activeOrders})\n\n`;
    });

    if (confirm(details + `Tap OK to log your current GPS field visit location for customer verification:`)) {
      this.logVisitCheckIn();
    }
  }

  requestGpsLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.currentLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          };
          console.log('[GPS] Acquired location:', this.currentLocation);
        },
        (err) => {
          console.warn('[GPS] Geolocation unavailable:', err);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }

  logVisitCheckIn() {
    const lat = this.currentLocation ? this.currentLocation.latitude.toFixed(4) : '9.8972';
    const lon = this.currentLocation ? this.currentLocation.longitude.toFixed(4) : '76.7135';

    app.showToast(`📍 Field Visit Logged at GPS [${lat}, ${lon}] • Thodupuzha Route!`, 'success');
  }
}

const salesman = new MobileSalesman();
