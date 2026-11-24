/**
 * EEYES PRO Mobile - Bilingual i18n Engine (English & Malayalam)
 */

class MobileI18n {
  constructor() {
    this.currentLang = localStorage.getItem('eeyes_mobile_lang') || 'ml'; // Default to Malayalam as requested by user
    this.translations = {
      // Header & Navigation
      'brand_subtitle': { en: 'E.S TRADING CO.', ml: 'ഇ.എസ് ട്രേഡിംഗ് കമ്പനി' },
      'nav_home': { en: 'Home', ml: 'ഹോം' },
      'nav_billing': { en: 'Billing', ml: 'ബില്ലിംഗ്' },
      'nav_stock': { en: 'Stock', ml: 'സ്റ്റോക്ക്' },
      'nav_khata': { en: 'Khata', ml: 'ഖാത' },
      'nav_more': { en: 'More', ml: 'കൂടുതൽ' },

      // Dashboard
      'welcome_sub': { en: "TODAY'S OVERVIEW", ml: 'ഇന്നത്തെ സംഗ്രഹം' },
      'refresh': { en: 'Refresh', ml: 'പുതുക്കുക' },
      'kpi_sales': { en: "TODAY'S SALES", ml: 'ഇന്നത്തെ വിൽപന' },
      'kpi_purchase': { en: 'INWARD PURCHASES', ml: 'പർച്ചേസ് ഇൻവേർഡ്' },
      'kpi_receivable': { en: 'RECEIVABLES (UDHAR)', ml: 'ലഭിക്കാനുള്ളത് (ഉദ്ധാർ)' },
      'kpi_cash': { en: 'CASH IN HAND', ml: 'കൈവശമുള്ള പണം' },
      'vs_yesterday': { en: 'vs yesterday', ml: 'ഇന്നലെയേക്കാൾ' },

      // Quick Actions
      'act_newsale': { en: 'New Sale<br>(Bill)', ml: 'പുതിയ സെയിൽ<br>(ബിൽ)' },
      'act_scan': { en: 'Scan Item<br>(Barcode)', ml: 'സ്കാൻ ഇനം<br>(ബാർകോഡ്)' },
      'act_addparty': { en: 'Add Party<br>(Customer)', ml: 'പാർട്ടി ചേർക്കുക<br>(കസ്റ്റമർ)' },
      'act_collect': { en: 'Collect Pay<br>(Cash/UPI)', ml: 'പണം വരവ്<br>(കളക്ഷൻ)' },

      // Low Stock & Invoices
      'low_stock_title': { en: 'Low Stock Alerts', ml: 'സ്റ്റോക്ക് കുറവുള്ള ഇനങ്ങൾ' },
      'recent_invoices': { en: 'Recent Invoices', ml: 'സമീപകാല ബില്ലുകൾ' },
      'view_all': { en: 'View All →', ml: 'എല്ലാം കാണുക →' },

      // Billing Screen
      'search_bills': { en: 'Search bill no, party name...', ml: 'ബിൽ നമ്പർ, പാർട്ടി പേര് തിരയുക...' },
      'chip_all_bills': { en: 'All Bills', ml: 'എല്ലാ ബില്ലുകളും' },
      'chip_sales': { en: 'Sales (സെയിൽസ്)', ml: 'സെയിൽസ് (വിൽപന)' },
      'chip_purchases': { en: 'Purchases (പർച്ചേസ്)', ml: 'പർച്ചേസ് (വാങ്ങൽ)' },
      'chip_unpaid': { en: 'Unpaid / Udhar', ml: 'ബാക്കി / ഉദ്ധാർ' },

      // Parties & Khata
      'party_to_receive': { en: 'TO RECEIVE (ലഭിക്കാനുള്ളത്)', ml: 'ലഭിക്കാനുള്ളത് (കസ്റ്റമർ ബാക്കി)' },
      'party_to_pay': { en: 'TO PAY (കൊടുക്കാനുള്ളത്)', ml: 'കൊടുക്കാനുള്ളത് (സപ്ലയർ ബാക്കി)' },

      // Modules
      'erp_modules': { en: 'ERP BUSINESS MODULES', ml: 'ഇആർപി ബിസിനസ്സ് മൊഡ്യൂളുകൾ' },
      'mod_salesman': { en: 'Salesman Field Tracker', ml: 'സെയിൽസ്മാൻ ഫീൽഡ് ട്രാക്കർ' },
      'mod_salesman_sub': { en: 'GPS check-ins, customer routes & on-field billing', ml: 'ജിപിഎസ് റൂട്ട്, സന്ദർശനം & ഫീൽഡ് ബില്ലിംഗ്' },
      'mod_daybook': { en: 'Daily Cash & Bank Register', ml: 'ഡെയ്‌ലി ക്യാഷ് & ബാങ്ക് രജിസ്റ്റർ' },
      'mod_daybook_sub': { en: 'Inflows, outflows, petty cash & bank reconcile', ml: 'പണത്തിന്റെ വരവു-ചെലവ്, പെറ്റി ക്യാഷ് & ബാങ്ക്' },
      'mod_rewards': { en: 'Smart Rewards & Rulebook', ml: 'സ്മാർട്ട് റിവാർഡ്സ് & റൂൾബുക്ക്' },
      'mod_rewards_sub': { en: 'Customer loyalty wallet & profit ratio discounts', ml: 'കസ്റ്റമർ പോയിന്റ്സ് & ലാഭ അനുപാത കിഴിവ്' },
      'mod_copilot': { en: 'AI Commodity Price Forecast', ml: 'എഐ ചരക്ക് വിപണി പ്രവചനം' },
      'mod_copilot_sub': { en: 'Rice, edible oil & provisions wholesale trends', ml: 'അരി, വെളിച്ചെണ്ണ, പലചരക്ക് വിലക്കയറ്റ പ്രവചനം' },
      'mod_hr': { en: 'HR & Staff Payroll', ml: 'ജീവനക്കാരുടെ ശമ്പളം & ഹാജർ' },
      'mod_hr_sub': { en: 'Staff attendance, salary advances & loans', ml: 'സ്റ്റാഫ് അറ്റൻഡൻസ്, അഡ്വാൻസ് & ശമ്പളം' },
      'mod_sync': { en: 'Desktop ERP Server Link', ml: 'ഡെസ്ക്ടോപ്പ് ഇആർപി കണക്ഷൻ' },
      'mod_sync_sub': { en: 'Sync with http://localhost:3000 or local Wi-Fi', ml: 'കമ്പ്യൂട്ടറുമായി ലൈവ് ഡാറ്റ സിങ്ക് ചെയ്യുക' },
      'mod_backup': { en: 'Backup Mobile Database', ml: 'മൊബൈൽ ബാക്കപ്പ് എടുക്കുക' },
      'mod_backup_sub': { en: 'Save local backup JSON file to device storage', ml: 'ഫോണിലേക്ക് സുരക്ഷിതമായി ഡാറ്റ സേവ് ചെയ്യുക' },

      // Modals
      'modal_new_sale': { en: '⚡ New Sales Bill (സെയിൽസ് ബിൽ)', ml: '⚡ പുതിയ സെയിൽസ് ബിൽ (വിൽപന)' },
      'select_customer': { en: 'Select Customer (പാർട്ടി)', ml: 'കസ്റ്റമറെ തിരഞ്ഞെടുക്കുക' },
      'add_item': { en: 'Add Product (ഉൽപ്പന്നം ചേർക്കുക)', ml: 'ഉൽപ്പന്നം ചേർക്കുക' },
      'cart_items': { en: 'Bill Items', ml: 'ബിൽ ഇനങ്ങൾ' },
      'taxable_amt': { en: 'Taxable Value:', ml: 'ടാക്സബിൾ മൂല്യം:' },
      'gst_amt': { en: 'Total GST (5% / 12% / 18%):', ml: 'ആകെ ജിഎസ്ടി (GST):' },
      'grand_total': { en: 'Grand Total:', ml: 'ആകെ തുക (Grand Total):' },
      'pay_mode': { en: 'Payment Mode (പേയ്മെന്റ് രീതി)', ml: 'പേയ്മെന്റ് രീതി' }
    };
  }

  t(key) {
    if (this.translations[key]) {
      return this.translations[key][this.currentLang] || this.translations[key]['en'];
    }
    return key;
  }

  toggle() {
    this.currentLang = this.currentLang === 'ml' ? 'en' : 'ml';
    localStorage.setItem('eeyes_mobile_lang', this.currentLang);
    this.apply();
  }

  apply() {
    const isMl = this.currentLang === 'ml';
    const langBtnFlag = document.getElementById('lang-flag');
    const langBtnCode = document.getElementById('lang-code');

    if (langBtnFlag && langBtnCode) {
      langBtnFlag.textContent = isMl ? '🌴' : '🌐';
      langBtnCode.textContent = isMl ? 'മലയാളം' : 'English';
    }

    // Update Navigation Labels
    const navLabels = {
      'lbl-nav-dash': 'nav_home',
      'lbl-nav-bill': 'nav_billing',
      'lbl-nav-stock': 'nav_stock',
      'lbl-nav-party': 'nav_khata',
      'lbl-nav-more': 'nav_more'
    };

    for (const [id, key] of Object.entries(navLabels)) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = this.t(key);
    }

    // Update Dashboard strings
    const strMap = {
      'header-branch-name': 'brand_subtitle',
      'txt-welcome-sub': 'welcome_sub',
      'txt-refresh': 'refresh',
      'txt-kpi-sales': 'kpi_sales',
      'txt-kpi-purchase': 'kpi_purchase',
      'txt-kpi-receivable': 'kpi_receivable',
      'txt-kpi-cash': 'kpi_cash',
      'txt-vs-yesterday': 'vs_yesterday',
      'txt-act-newsale': 'act_newsale',
      'txt-act-scan': 'act_scan',
      'txt-act-addparty': 'act_addparty',
      'txt-act-collect': 'act_collect',
      'txt-low-stock-title': 'low_stock_title',
      'txt-recent-invoices': 'recent_invoices',
      'txt-view-all': 'view_all',
      'chip-inv-all': 'chip_all_bills',
      'chip-inv-sale': 'chip_sales',
      'chip-inv-pur': 'chip_purchases',
      'chip-inv-unpaid': 'chip_unpaid',
      'txt-party-rec': 'party_to_receive',
      'txt-party-pay': 'party_to_pay',
      'txt-erp-modules': 'erp_modules',
      'txt-mod-salesman': 'mod_salesman',
      'txt-mod-salesman-sub': 'mod_salesman_sub',
      'txt-mod-daybook': 'mod_daybook',
      'txt-mod-daybook-sub': 'mod_daybook_sub',
      'txt-mod-rewards': 'mod_rewards',
      'txt-mod-rewards-sub': 'mod_rewards_sub',
      'txt-mod-copilot': 'mod_copilot',
      'txt-mod-copilot-sub': 'mod_copilot_sub',
      'txt-mod-hr': 'mod_hr',
      'txt-mod-hr-sub': 'mod_hr_sub',
      'txt-mod-sync': 'mod_sync',
      'txt-mod-sync-sub': 'mod_sync_sub',
      'txt-mod-backup': 'mod_backup',
      'txt-mod-backup-sub': 'mod_backup_sub',
      'txt-modal-sale-title': 'modal_new_sale',
      'lbl-select-customer': 'select_customer',
      'lbl-add-item': 'add_item',
      'lbl-cart-items': 'cart_items',
      'lbl-taxable-amt': 'taxable_amt',
      'lbl-gst-amt': 'gst_amt',
      'lbl-grand-total': 'grand_total',
      'lbl-pay-mode': 'pay_mode'
    };

    for (const [id, key] of Object.entries(strMap)) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = this.t(key);
    }
  }
}

const i18n = new MobileI18n();
