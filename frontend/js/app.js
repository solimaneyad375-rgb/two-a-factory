/**
 * TOW_A FACTORY SYSTEM - MAIN APPLICATION CONTROLLER
 * Coordinates system initialization, routing, sidebar pinning, and global events.
 */

(function () {
  'use strict';

  // Global Application Namespace
  window.App = window.App || {};
  const DOM = window.App.DOM = window.App.DOM || {};

  // Global Reactive State (Preserve object reference across modules)
  const state = window.App.State = window.App.State || {};
  Object.assign(state, {
    currentTab: state.currentTab || 'pos',
    posCart: state.posCart || [],
    currentInvoice: state.currentInvoice || null,
    editingItemIndex: null,
    editingCustomerIndex: null,
    editingSupplierIndex: null,
    editingOvenIndex: null,
    currentStatementParty: null,
    selectedLinkedClientInvoice: null,
    selectedLinkedClientInvoiceNumber: null,
    selectedLinkedClientItemIndex: 0,
    editingInvoiceNumber: null,
    lastGeneratedImageBlob: null,
    lastGeneratedImageUrl: null
  });

  const PINNED_STORAGE_KEY = 'twoA_sidebar_pinned';

  function initApp() {
    // 1. Cache All DOM Elements maintaining shared object reference
    Object.assign(DOM, cacheDOMElements());

    // 2. Wire Global Event Listeners FIRST so user interactions work immediately
    try {
      setupEventListeners();
    } catch (err) {
      console.error('Error setting up event listeners:', err);
    }

    // 3. Initialize Core Submodules safely
    try {
      if (window.App.Invoices && window.App.Invoices.sanitizeAndRepairInvoices) {
        window.App.Invoices.sanitizeAndRepairInvoices();
      }
    } catch (err) { console.error('Error in sanitizeAndRepairInvoices:', err); }

    try {
      initSidebarPinState();
    } catch (err) { console.error('Error in initSidebarPinState:', err); }

    try {
      if (window.App.Utils && window.App.Utils.startClock) {
        window.App.Utils.startClock(DOM.liveTime || document.getElementById('liveTime'));
      }
    } catch (err) { console.error('Error in startClock:', err); }

    try {
      if (window.App.Settings && (window.App.Settings.loadSettingsIntoUI || window.App.Settings.load)) {
        (window.App.Settings.loadSettingsIntoUI || window.App.Settings.load)();
      }
    } catch (err) { console.error('Error in loadSettingsIntoUI:', err); }

    try {
      if (window.App.Auth && (window.App.Auth.loadAuthIntoUI || window.App.Auth.load)) {
        (window.App.Auth.loadAuthIntoUI || window.App.Auth.load)();
      }
    } catch (err) { console.error('Error in loadAuthIntoUI:', err); }

    // 4. Render Data Tables
    try {
      renderAllTables();
    } catch (err) { console.error('Error in renderAllTables:', err); }

    try {
      if (window.App.Auth && (window.App.Auth.renderUsersTable || window.App.Auth.renderUsers)) {
        (window.App.Auth.renderUsersTable || window.App.Auth.renderUsers)();
      }
    } catch (err) { console.error('Error in renderUsersTable:', err); }

    // 5. Initialize Point of Sale
    try {
      if (window.App.POS && (window.App.POS.initPOS || window.App.POS.init)) {
        (window.App.POS.initPOS || window.App.POS.init)();
      }
    } catch (err) { console.error('Error in initPOS:', err); }

    // 6. Apply User Permissions
    try {
      if (window.App.Auth && (window.App.Auth.applyCurrentUserPermissions || window.App.Auth.applyPermissions)) {
        (window.App.Auth.applyCurrentUserPermissions || window.App.Auth.applyPermissions)();
      }
    } catch (err) { console.error('Error in applyCurrentUserPermissions:', err); }
  }

  // ================= DOM ELEMENT CACHE =================
  function cacheDOMElements() {
    return {
      // Navigation & Layout
      appLayout: document.querySelector('.app-layout'),
      sidebar: document.getElementById('sidebar'),
      btnPinSidebar: document.getElementById('btnPinSidebar'),
      btnSidebarToggle: document.getElementById('btnSidebarToggle'),
      navItems: document.querySelectorAll('.nav-item'),
      tabPanes: document.querySelectorAll('.tab-pane'),
      pageTitle: document.getElementById('pageTitle'),
      pageSubtitle: document.getElementById('pageSubtitle'),
      brandNameDisplay: document.getElementById('brandNameDisplay'),
      brandSubDisplay: document.getElementById('brandSubDisplay'),
      brandSubContainer: document.getElementById('brandSubContainer'),
      currentUsernameDisplay: document.getElementById('currentUsernameDisplay'),
      invoicesBadgeCount: document.getElementById('invoicesBadgeCount'),
      liveTime: document.getElementById('liveTime'),
      btnQuickLock: document.getElementById('btnQuickLock'),
      btnNewInvoiceQuick: document.getElementById('btnNewInvoiceQuick'),

      // POS Elements
      posPartyTypeRadios: document.querySelectorAll('input[name="posPartyType"]'),
      partySelectLabel: document.getElementById('partySelectLabel'),
      posPartySelect: document.getElementById('posPartySelect'),
      btnQuickAddParty: document.getElementById('btnQuickAddParty'),
      partyPreviewCard: document.getElementById('partyPreviewCard'),
      partyPreviewPhone: document.getElementById('partyPreviewPhone'),
      partyPreviewAddress: document.getElementById('partyPreviewAddress'),
      posInvoiceDate: document.getElementById('posInvoiceDate'),
      posPaymentMethod: document.getElementById('posPaymentMethod'),
      posInvoiceNotes: document.getElementById('posInvoiceNotes'),
      currentInvoiceNumberTag: document.getElementById('currentInvoiceNumberTag'),
      posEditModeBanner: document.getElementById('posEditModeBanner'),
      posEditInvoiceNumberText: document.getElementById('posEditInvoiceNumberText'),
      btnCancelEditInvoice: document.getElementById('btnCancelEditInvoice'),
      btnModalEditInvoice: document.getElementById('btnModalEditInvoice'),

      // Linked Customer Invoice Section (For Oven & Cutter)
      posLinkClientSection: document.getElementById('posLinkClientSection'),
      posLinkClientBoxTitle: document.getElementById('posLinkClientBoxTitle'),
      posLinkClientTypeBadge: document.getElementById('posLinkClientTypeBadge'),
      posLinkClientNotice: document.getElementById('posLinkClientNotice'),
      posLinkCustomerSelect: document.getElementById('posLinkCustomerSelect'),
      posLinkInvoiceSelect: document.getElementById('posLinkInvoiceSelect'),
      posLinkInvoicePreview: document.getElementById('posLinkInvoicePreview'),
      posLinkRuleBanner: document.getElementById('posLinkRuleBanner'),
      posLinkItemsChips: document.getElementById('posLinkItemsChips'),
      btnImportAllClientItems: document.getElementById('btnImportAllClientItems'),
      btnImportAllClientItemsText: document.getElementById('btnImportAllClientItemsText'),

      posItemSelect: document.getElementById('posItemSelect'),
      posItemName: document.getElementById('posItemName'),
      posItemColorSelect: document.getElementById('posItemColorSelect'),
      posItemColor: document.getElementById('posItemColor'),
      posItemPrice: document.getElementById('posItemPrice'),
      posItemPriceGroup: document.getElementById('posItemPriceGroup'),
      posItemPriceLabel: document.getElementById('posItemPriceLabel'),
      posOperationalPriceNotice: document.getElementById('posOperationalPriceNotice'),
      posItemWidth: document.getElementById('posItemWidth'),
      posItemLength: document.getElementById('posItemLength'),
      posItemThickness: document.getElementById('posItemThickness'),
      posItemSupports: document.getElementById('posItemSupports'),
      posItemQty: document.getElementById('posItemQty'),
      posSupplierWeightGroup: document.getElementById('posSupplierWeightGroup'),
      posItemWeightTon: document.getElementById('posItemWeightTon'),
      btnAddToCart: document.getElementById('btnAddToCart'),
      posCartTable: document.getElementById('posCartTable'),
      posCartBody: document.getElementById('posCartBody'),
      posEmptyCartNotice: document.getElementById('posEmptyCartNotice'),
      thCartThickness: document.getElementById('thCartThickness'),
      thCartSupports: document.getElementById('thCartSupports'),
      thCartWeight: document.getElementById('thCartWeight'),
      thCartPrice: document.getElementById('thCartPrice'),
      thCartTotal: document.getElementById('thCartTotal'),
      posNormalSummaryDetails: document.getElementById('posNormalSummaryDetails'),
      posOperationalSummaryDetails: document.getElementById('posOperationalSummaryDetails'),
      posOperationalItemsCount: document.getElementById('posOperationalItemsCount'),
      posOperationalPiecesCount: document.getElementById('posOperationalPiecesCount'),
      posSupplierTotalWeightItem: document.getElementById('posSupplierTotalWeightItem'),
      posTotalWeightDisplay: document.getElementById('posTotalWeightDisplay'),
      posSubtotalDisplay: document.getElementById('posSubtotalDisplay'),
      posDiscountInput: document.getElementById('posDiscountInput'),
      posGrandTotalDisplay: document.getElementById('posGrandTotalDisplay'),
      btnClearCart: document.getElementById('btnClearCart'),
      btnSaveInvoice: document.getElementById('btnSaveInvoice'),
      coreChips: document.querySelectorAll('.chip-btn'),

      // Linked External Dispatch Elements
      posLinkedDispatchSection: document.getElementById('posLinkedDispatchSection'),
      chkDispatchOven: document.getElementById('chkDispatchOven'),
      dispatchOvenSelectWrap: document.getElementById('dispatchOvenSelectWrap'),
      dispatchOvenSelect: document.getElementById('dispatchOvenSelect'),
      chkDispatchCutter: document.getElementById('chkDispatchCutter'),
      dispatchCutterSelectWrap: document.getElementById('dispatchCutterSelectWrap'),
      dispatchCutterSelect: document.getElementById('dispatchCutterSelect'),

      // Items Elements
      itemsTableBody: document.getElementById('itemsTableBody'),
      searchItemsInput: document.getElementById('searchItemsInput'),
      itemsCategoryFilter: document.getElementById('itemsCategoryFilter'),
      btnOpenAddItemModal: document.getElementById('btnOpenAddItemModal'),
      itemModal: document.getElementById('itemModal'),
      itemModalTitle: document.getElementById('itemModalTitle'),
      itemForm: document.getElementById('itemForm'),
      itemFormId: document.getElementById('itemFormId'),
      itemFormName: document.getElementById('itemFormName'),
      itemFormCategory: document.getElementById('itemFormCategory'),
      btnCloseItemModal: document.getElementById('btnCloseItemModal'),
      btnCancelItemModal: document.getElementById('btnCancelItemModal'),

      // Customers Elements
      customersTableBody: document.getElementById('customersTableBody'),
      searchCustomersInput: document.getElementById('searchCustomersInput'),
      btnPrintCustomersReport: document.getElementById('btnPrintCustomersReport'),
      btnOpenAddCustomerModal: document.getElementById('btnOpenAddCustomerModal'),
      customerModal: document.getElementById('customerModal'),
      customerModalTitle: document.getElementById('customerModalTitle'),
      customerForm: document.getElementById('customerForm'),
      customerFormId: document.getElementById('customerFormId'),
      customerFormName: document.getElementById('customerFormName'),
      customerFormCode: document.getElementById('customerFormCode'),
      customerFormPhone: document.getElementById('customerFormPhone'),
      customerFormAddress: document.getElementById('customerFormAddress'),
      customerFormNotes: document.getElementById('customerFormNotes'),
      btnCloseCustomerModal: document.getElementById('btnCloseCustomerModal'),
      btnCancelCustomerModal: document.getElementById('btnCancelCustomerModal'),

      // Suppliers Elements
      suppliersTableBody: document.getElementById('suppliersTableBody'),
      searchSuppliersInput: document.getElementById('searchSuppliersInput'),
      btnPrintSuppliersReport: document.getElementById('btnPrintSuppliersReport'),
      btnOpenAddSupplierModal: document.getElementById('btnOpenAddSupplierModal'),
      supplierModal: document.getElementById('supplierModal'),
      supplierModalTitle: document.getElementById('supplierModalTitle'),
      supplierForm: document.getElementById('supplierForm'),
      supplierFormId: document.getElementById('supplierFormId'),
      supplierFormName: document.getElementById('supplierFormName'),
      supplierFormCode: document.getElementById('supplierFormCode'),
      supplierFormPhone: document.getElementById('supplierFormPhone'),
      supplierFormAddress: document.getElementById('supplierFormAddress'),
      supplierFormSupplies: document.getElementById('supplierFormSupplies'),
      btnCloseSupplierModal: document.getElementById('btnCloseSupplierModal'),
      btnCancelSupplierModal: document.getElementById('btnCancelSupplierModal'),

      // Ovens Elements
      ovensTableBody: document.getElementById('ovensTableBody'),
      searchOvensInput: document.getElementById('searchOvensInput'),
      btnPrintOvensReport: document.getElementById('btnPrintOvensReport'),
      btnOpenAddOvenModal: document.getElementById('btnOpenAddOvenModal'),
      ovenModal: document.getElementById('ovenModal'),
      ovenModalTitle: document.getElementById('ovenModalTitle'),
      ovenForm: document.getElementById('ovenForm'),
      ovenFormId: document.getElementById('ovenFormId'),
      ovenFormName: document.getElementById('ovenFormName'),
      ovenFormCode: document.getElementById('ovenFormCode'),
      ovenFormPhone: document.getElementById('ovenFormPhone'),
      ovenFormAddress: document.getElementById('ovenFormAddress'),
      ovenFormNotes: document.getElementById('ovenFormNotes'),
      btnCloseOvenModal: document.getElementById('btnCloseOvenModal'),
      btnCancelOvenModal: document.getElementById('btnCancelOvenModal'),

      // Cutters Elements
      cuttersTableBody: document.getElementById('cuttersTableBody'),
      searchCuttersInput: document.getElementById('searchCuttersInput'),
      btnPrintCuttersReport: document.getElementById('btnPrintCuttersReport'),
      btnOpenAddCutterModal: document.getElementById('btnOpenAddCutterModal'),
      cutterModal: document.getElementById('cutterModal'),
      cutterModalTitle: document.getElementById('cutterModalTitle'),
      cutterForm: document.getElementById('cutterForm'),
      cutterFormId: document.getElementById('cutterFormId'),
      cutterFormName: document.getElementById('cutterFormName'),
      cutterFormCode: document.getElementById('cutterFormCode'),
      cutterFormPhone: document.getElementById('cutterFormPhone'),
      cutterFormAddress: document.getElementById('cutterFormAddress'),
      cutterFormNotes: document.getElementById('cutterFormNotes'),
      btnCloseCutterModal: document.getElementById('btnCloseCutterModal'),
      btnCancelCutterModal: document.getElementById('btnCancelCutterModal'),

      // Invoices Elements
      invoicesTableBody: document.getElementById('invoicesTableBody'),
      searchInvoicesInput: document.getElementById('searchInvoicesInput'),
      invoicesTypeFilter: document.getElementById('invoicesTypeFilter'),
      btnPrintInvoicesLog: document.getElementById('btnPrintInvoicesLog'),
      invoicesCategorySummaryBar: document.getElementById('invoicesCategorySummaryBar'),
      activeInvoicesFilterName: document.getElementById('activeInvoicesFilterName'),
      activeInvoicesCount: document.getElementById('activeInvoicesCount'),
      activeInvoicesSum: document.getElementById('activeInvoicesSum'),
      statTotalInvoicesCount: document.getElementById('statTotalInvoicesCount'),
      statTotalSalesAmount: document.getElementById('statTotalSalesAmount'),
      statTotalPurchasesAmount: document.getElementById('statTotalPurchasesAmount'),
      statTotalOvensCount: document.getElementById('statTotalOvensCount') || document.getElementById('statTotalOvensAmount'),
      statTotalCuttersCount: document.getElementById('statTotalCuttersCount'),

      // Invoice View Modal & Printable Sheet
      invoiceModal: document.getElementById('invoiceModal'),
      btnCloseInvoiceModal: document.getElementById('btnCloseInvoiceModal'),
      btnDownloadInvoiceImage: document.getElementById('btnDownloadInvoiceImage'),
      btnShareWhatsApp: document.getElementById('btnShareWhatsApp'),
      btnPrintInvoice: document.getElementById('btnPrintInvoice'),
      btnModalDispatchOven: document.getElementById('btnModalDispatchOven'),
      btnModalDispatchCutter: document.getElementById('btnModalDispatchCutter'),
      printableInvoiceSheet: document.getElementById('printableInvoiceSheet'),
      invSheetLogoImg: document.getElementById('invSheetLogoImg'),

      // WhatsApp Image Modal Elements
      whatsappModal: document.getElementById('whatsappModal'),
      btnCloseWhatsappModal: document.getElementById('btnCloseWhatsappModal'),
      whatsappModalSubtitle: document.getElementById('whatsappModalSubtitle'),
      whatsappPreviewImg: document.getElementById('whatsappPreviewImg'),
      btnCopyImageAgain: document.getElementById('btnCopyImageAgain'),
      whatsappTargetPhoneInput: document.getElementById('whatsappTargetPhoneInput'),
      btnResetToOriginalPhone: document.getElementById('btnResetToOriginalPhone'),
      btnOpenWhatsAppWeb: document.getElementById('btnOpenWhatsAppWeb'),
      btnOpenWhatsAppApp: document.getElementById('btnOpenWhatsAppApp'),

      invSheetFactoryName: document.getElementById('invSheetFactoryName'),
      invSheetSub: document.getElementById('invSheetSub'),
      invSheetFactoryPhone: document.getElementById('invSheetFactoryPhone'),
      invSheetFactoryPhone2: document.getElementById('invSheetFactoryPhone2'),
      invSheetPhoneSeparator: document.getElementById('invSheetPhoneSeparator'),
      invSheetFactoryAddress: document.getElementById('invSheetFactoryAddress'),
      invSheetInvoiceNumber: document.getElementById('invSheetInvoiceNumber'),
      invSheetInvoiceDate: document.getElementById('invSheetInvoiceDate'),
      invSheetInvoiceType: document.getElementById('invSheetInvoiceType'),
      invSheetPaymentMethod: document.getElementById('invSheetPaymentMethod'),
      invSheetColor: document.getElementById('invSheetColor'),
      invSheetColorMetaItem: document.getElementById('invSheetColorMetaItem'),
      invSheetEntityTitle: document.getElementById('invSheetEntityTitle'),
      invSheetPartyName: document.getElementById('invSheetPartyName'),
      invSheetPartyPhone: document.getElementById('invSheetPartyPhone'),
      invSheetPartyAddress: document.getElementById('invSheetPartyAddress'),
      invSheetLinkedBanner: document.getElementById('invSheetLinkedBanner'),
      invSheetLinkedContent: document.getElementById('invSheetLinkedContent'),
      invSheetMainTable: document.getElementById('invSheetMainTable'),
      invSheetTableHead: document.getElementById('invSheetTableHead'),
      thSheetItemNum: document.getElementById('thSheetItemNum'),
      thSheetItemName: document.getElementById('thSheetItemName'),
      thSheetItemColor: document.getElementById('thSheetItemColor'),
      thSheetItemDims: document.getElementById('thSheetItemDims'),
      thSheetItemThickness: document.getElementById('thSheetItemThickness'),
      thSheetItemSupports: document.getElementById('thSheetItemSupports'),
      thSheetItemQty: document.getElementById('thSheetItemQty'),
      thSheetWeight: document.getElementById('thSheetWeight'),
      thSheetPrice: document.getElementById('thSheetPrice'),
      thSheetTotal: document.getElementById('thSheetTotal'),
      invSheetWeightMetaItem: document.getElementById('invSheetWeightMetaItem'),
      invSheetMetaWeight: document.getElementById('invSheetMetaWeight'),
      invSheetOperationalNotice: document.getElementById('invSheetOperationalNotice'),
      invSheetTotalsBox: document.getElementById('invSheetTotalsBox'),
      invSheetWeightRow: document.getElementById('invSheetWeightRow'),
      invSheetTotalWeight: document.getElementById('invSheetTotalWeight'),
      invSheetTableBody: document.getElementById('invSheetTableBody'),
      invSheetNotesText: document.getElementById('invSheetNotesText'),
      invSheetSubtotal: document.getElementById('invSheetSubtotal'),
      invSheetDiscountRow: document.getElementById('invSheetDiscountRow'),
      invSheetDiscount: document.getElementById('invSheetDiscount'),
      invSheetGrandTotal: document.getElementById('invSheetGrandTotal'),
      invSheetFooterText: document.getElementById('invSheetFooterText'),

      // Dispatch Manual Operation Modal
      dispatchModal: document.getElementById('dispatchModal'),
      dispatchModalTitle: document.getElementById('dispatchModalTitle'),
      btnCloseDispatchModal: document.getElementById('btnCloseDispatchModal'),
      btnCancelDispatchModal: document.getElementById('btnCancelDispatchModal'),
      dispatchForm: document.getElementById('dispatchForm'),
      dispatchTargetType: document.getElementById('dispatchTargetType'),
      dispatchSourceInvoiceNum: document.getElementById('dispatchSourceInvoiceNum'),
      dispatchInfoAlert: document.getElementById('dispatchInfoAlert'),
      dispatchSelectLabel: document.getElementById('dispatchSelectLabel'),
      dispatchSelectEntity: document.getElementById('dispatchSelectEntity'),
      dispatchNotes: document.getElementById('dispatchNotes'),
      dispatchSourceInvoiceBadge: document.getElementById('dispatchSourceInvoiceBadge'),
      dispatchSourceCustomerBadge: document.getElementById('dispatchSourceCustomerBadge'),
      radioDispatchOven: document.getElementById('radioDispatchOven'),
      radioDispatchCutter: document.getElementById('radioDispatchCutter'),
      dispatchCardOven: document.getElementById('dispatchCardOven'),
      dispatchCardCutter: document.getElementById('dispatchCardCutter'),

      // Settings
      factorySettingsForm: document.getElementById('factorySettingsForm'),
      settingFactoryName: document.getElementById('settingFactoryName'),
      settingFactorySub: document.getElementById('settingFactorySub'),
      settingFactoryPhone: document.getElementById('settingFactoryPhone'),
      settingFactoryPhone2: document.getElementById('settingFactoryPhone2'),
      settingFactoryAddress: document.getElementById('settingFactoryAddress'),
      settingInvoiceFooterMsg: document.getElementById('settingInvoiceFooterMsg'),

      // Users and Permissions Elements
      addUserForm: document.getElementById('addUserForm'),
      newUserName: document.getElementById('newUserName'),
      newUserLogin: document.getElementById('newUserLogin'),
      newUserPassword: document.getElementById('newUserPassword'),
      btnToggleNewPassword: document.getElementById('btnToggleNewPassword'),
      toggleNewPasswordIcon: document.getElementById('toggleNewPasswordIcon'),
      usersTableBody: document.getElementById('usersTableBody'),
      perm_pos: document.getElementById('perm_pos'),
      perm_invoices: document.getElementById('perm_invoices'),
      perm_items: document.getElementById('perm_items'),
      perm_customers: document.getElementById('perm_customers'),
      perm_suppliers: document.getElementById('perm_suppliers'),
      perm_ovens: document.getElementById('perm_ovens'),
      perm_cutters: document.getElementById('perm_cutters'),
      perm_settings: document.getElementById('perm_settings'),

      // Edit User Modal Elements
      editUserModal: document.getElementById('editUserModal'),
      editUserForm: document.getElementById('editUserForm'),
      editUserId: document.getElementById('editUserId'),
      editUserName: document.getElementById('editUserName'),
      editUserLogin: document.getElementById('editUserLogin'),
      editUserPassword: document.getElementById('editUserPassword'),
      btnToggleEditPassword: document.getElementById('btnToggleEditPassword'),
      toggleEditPasswordIcon: document.getElementById('toggleEditPasswordIcon'),
      btnCloseEditUserModal: document.getElementById('btnCloseEditUserModal'),
      btnCancelEditUserModal: document.getElementById('btnCancelEditUserModal'),
      editAdminPermNotice: document.getElementById('editAdminPermNotice'),
      edit_perm_pos: document.getElementById('edit_perm_pos'),
      edit_perm_invoices: document.getElementById('edit_perm_invoices'),
      edit_perm_items: document.getElementById('edit_perm_items'),
      edit_perm_customers: document.getElementById('edit_perm_customers'),
      edit_perm_suppliers: document.getElementById('edit_perm_suppliers'),
      edit_perm_ovens: document.getElementById('edit_perm_ovens'),
      edit_perm_cutters: document.getElementById('edit_perm_cutters'),
      edit_perm_settings: document.getElementById('edit_perm_settings'),

      // Statement Modal Elements
      statementModal: document.getElementById('statementModal'),
      statementModalTitle: document.getElementById('statementModalTitle'),
      statementPartyTypeTag: document.getElementById('statementPartyTypeTag'),
      btnDownloadStatementImage: document.getElementById('btnDownloadStatementImage'),
      btnShareStatementWhatsApp: document.getElementById('btnShareStatementWhatsApp'),
      btnPrintStatement: document.getElementById('btnPrintStatement'),
      btnCloseStatementModal: document.getElementById('btnCloseStatementModal'),
      printableStatementSheet: document.getElementById('printableStatementSheet'),
      stmtSheetLogoImg: document.getElementById('stmtSheetLogoImg'),
      stmtFactoryName: document.getElementById('stmtFactoryName'),
      stmtFactorySub: document.getElementById('stmtFactorySub'),
      stmtFactoryPhone: document.getElementById('stmtFactoryPhone'),
      stmtFactoryAddress: document.getElementById('stmtFactoryAddress'),
      stmtPrintDate: document.getElementById('stmtPrintDate'),
      stmtPartyTypeBadge: document.getElementById('stmtPartyTypeBadge'),
      stmtPartyCode: document.getElementById('stmtPartyCode'),
      stmtPartyName: document.getElementById('stmtPartyName'),
      stmtPartyPhone: document.getElementById('stmtPartyPhone'),
      stmtPartyAddress: document.getElementById('stmtPartyAddress'),
      stmtCountVal: document.getElementById('stmtCountVal'),
      stmtTotalVal: document.getElementById('stmtTotalVal'),
      stmtFirstDateVal: document.getElementById('stmtFirstDateVal'),
      stmtLastDateVal: document.getElementById('stmtLastDateVal'),
      stmtInvoicesBody: document.getElementById('stmtInvoicesBody'),
      stmtFooterGrandTotal: document.getElementById('stmtFooterGrandTotal'),

      // Printable General Report Container
      printableReportContainer: document.getElementById('printableReportContainer'),

      // Mobile Sidebar Elements
      btnCloseSidebar: document.getElementById('btnCloseSidebar'),
      sidebarBackdrop: document.getElementById('sidebarBackdrop'),

      // Header Auth & Account Controls
      btnHeaderAuth: document.getElementById('btnHeaderAuth'),
      headerAuthDropdown: document.getElementById('headerAuthDropdown'),
      headerAuthUsername: document.getElementById('headerAuthUsername'),
      currentUserRoleDisplay: document.getElementById('currentUserRoleDisplay'),
      dropUserName: document.getElementById('dropUserName'),
      dropUserRole: document.getElementById('dropUserRole'),
      btnHeaderSwitchUser: document.getElementById('btnHeaderSwitchUser'),
      btnHeaderLogout: document.getElementById('btnHeaderLogout'),

      // Lock Screen / Account Switch
      lockModal: document.getElementById('lockModal'),
      lockLoginForm: document.getElementById('lockLoginForm'),
      lockUserSelect: document.getElementById('lockUserSelect'),
      lockPasswordInput: document.getElementById('lockPasswordInput'),
      lockErrorMsg: document.getElementById('lockErrorMsg'),

      // Toasts
      toastContainer: document.getElementById('toastContainer')
    };
  }

  // ================= NAVIGATION TAB SWITCHING =================
  function switchTab(tabId) {
    const DOM = window.App.DOM;
    const currentUser = AppStore.getCurrentUser();
    if (currentUser && currentUser.permissions && currentUser.permissions[tabId] === false) {
      showToast('ليس لديك صلاحية للدخول إلى هذا القسم', 'danger');
      return;
    }

    state.currentTab = tabId;

    if (DOM.navItems) {
      DOM.navItems.forEach(item => {
        if (item.dataset.tab === tabId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    if (DOM.tabPanes) {
      DOM.tabPanes.forEach(pane => {
        if (pane.id === `pane-${tabId}`) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
    }

    const titles = {
      pos: { title: 'نقطة البيع وإصدار الفواتير', sub: 'إنشاء فواتير للعملاء، الموردين، وعمليات الأفران بسرعة وسهولة' },
      items: { title: 'الأصناف ودليل الخامات', sub: 'إدارة وتصنيف خامات المصنع (صاج، سبايك، مواسير، أرفف ليزر)' },
      customers: { title: 'إدارة دليل العملاء', sub: 'قائمة العملاء وبيانات الاتصال وكشف حساب لكل عميل' },
      suppliers: { title: 'إدارة دليل الموردين', sub: 'سجل موردي الخامات والمعادن والمشتريات وكشوف الحسابات' },
      ovens: { title: 'الأفران والتشغيل الخارجي', sub: 'بيانات أفران الصهر والمعالجة الحرارية ومسحوبات التشغيل' },
      cutters: { title: 'المقصات والتشغيل الخارجي', sub: 'إدارة ورش ومقصات تفصيل وتجهيز ألواح الصاج والمعادن' },
      invoices: { title: 'سجل وأرشيف الفواتير', sub: 'استعراض وطباعة الفواتير ومتابعة إجماليات كل قسم' },
      settings: { title: 'إعدادات النظام والحسابات', sub: 'تعديل بيانات المصنع، وإدارة حسابات ومستخدمي النظام بالصلاحيات' }
    };

    if (titles[tabId]) {
      if (DOM.pageTitle) DOM.pageTitle.textContent = titles[tabId].title;
      if (DOM.pageSubtitle) DOM.pageSubtitle.textContent = titles[tabId].sub;
    }

    // Refresh content for selected view
    if (tabId === 'items' && window.App.Entities) window.App.Entities.renderItemsTable();
    if (tabId === 'customers' && window.App.Entities) window.App.Entities.renderCustomersTable();
    if (tabId === 'suppliers' && window.App.Entities) window.App.Entities.renderSuppliersTable();
    if (tabId === 'ovens' && window.App.Entities) window.App.Entities.renderOvensTable();
    if (tabId === 'cutters' && window.App.Entities) window.App.Entities.renderCuttersTable();
    if (tabId === 'invoices' && window.App.Invoices) window.App.Invoices.renderInvoicesTable();
    if (tabId === 'settings' && window.App.Auth) window.App.Auth.renderUsersTable();

    // Close mobile drawer if open
    if (DOM.sidebar) DOM.sidebar.classList.remove('mobile-open');
    if (DOM.sidebarBackdrop) DOM.sidebarBackdrop.classList.remove('active');
  }

  // ================= SIDEBAR PIN STATE =================
  function initSidebarPinState() {
    const isPinned = localStorage.getItem(PINNED_STORAGE_KEY) === 'true';
    applySidebarPinnedState(isPinned);
  }

  function toggleSidebarPin() {
    const DOM = window.App.DOM;
    const isCurrentlyPinned = DOM.sidebar && DOM.sidebar.classList.contains('is-pinned');
    const newState = !isCurrentlyPinned;
    applySidebarPinnedState(newState);
    localStorage.setItem(PINNED_STORAGE_KEY, newState ? 'true' : 'false');
    showToast(newState ? 'تم تثبيت القائمة مفتوحة' : 'تم إلغاء تثبيت القائمة (قابلة للطي)', 'info');
  }

  function applySidebarPinnedState(pinned) {
    const DOM = window.App.DOM;
    if (!DOM.sidebar) return;

    if (pinned) {
      DOM.sidebar.classList.add('is-pinned');
      if (DOM.appLayout) DOM.appLayout.classList.add('sidebar-pinned');
      if (DOM.btnPinSidebar) {
        DOM.btnPinSidebar.classList.add('is-pinned');
        DOM.btnPinSidebar.title = 'إلغاء تثبيت القائمة (جعلها قابلة للطي)';
        DOM.btnPinSidebar.setAttribute('aria-pressed', 'true');
      }
      if (DOM.btnSidebarToggle) {
        DOM.btnSidebarToggle.classList.add('active');
        DOM.btnSidebarToggle.title = 'طي القائمة الرئيسية';
      }
    } else {
      DOM.sidebar.classList.remove('is-pinned');
      if (DOM.appLayout) DOM.appLayout.classList.remove('sidebar-pinned');
      if (DOM.btnPinSidebar) {
        DOM.btnPinSidebar.classList.remove('is-pinned');
        DOM.btnPinSidebar.title = 'تثبيت القائمة مفتوحة';
        DOM.btnPinSidebar.setAttribute('aria-pressed', 'false');
      }
      if (DOM.btnSidebarToggle) {
        DOM.btnSidebarToggle.classList.remove('active');
        DOM.btnSidebarToggle.title = 'فتح / تثبيت القائمة الرئيسية';
      }
    }
  }

  function renderAllTables() {
    if (window.App.Entities) {
      if (typeof window.App.Entities.renderItemsTable === 'function') window.App.Entities.renderItemsTable();
      else if (typeof window.App.Entities.renderItems === 'function') window.App.Entities.renderItems();

      if (typeof window.App.Entities.renderCustomersTable === 'function') window.App.Entities.renderCustomersTable();
      else if (typeof window.App.Entities.renderCustomers === 'function') window.App.Entities.renderCustomers();

      if (typeof window.App.Entities.renderSuppliersTable === 'function') window.App.Entities.renderSuppliersTable();
      else if (typeof window.App.Entities.renderSuppliers === 'function') window.App.Entities.renderSuppliers();

      if (typeof window.App.Entities.renderOvensTable === 'function') window.App.Entities.renderOvensTable();
      else if (typeof window.App.Entities.renderOvens === 'function') window.App.Entities.renderOvens();

      if (typeof window.App.Entities.renderCuttersTable === 'function') window.App.Entities.renderCuttersTable();
      else if (typeof window.App.Entities.renderCutters === 'function') window.App.Entities.renderCutters();
    }
    if (window.App.Invoices) {
      if (typeof window.App.Invoices.renderInvoicesTable === 'function') window.App.Invoices.renderInvoicesTable();
      else if (typeof window.App.Invoices.renderTable === 'function') window.App.Invoices.renderTable();
      if (typeof window.App.Invoices.updateInvoicesBadge === 'function') window.App.Invoices.updateInvoicesBadge();
      else if (typeof window.App.Invoices.updateBadge === 'function') window.App.Invoices.updateBadge();
    }
    const badgeEl = (DOM && DOM.invoicesBadgeCount) || document.getElementById('invoicesBadgeCount');
    if (badgeEl && typeof AppStore !== 'undefined' && typeof AppStore.getInvoices === 'function') {
      badgeEl.textContent = AppStore.getInvoices().length;
    }
  }

  // ================= GLOBAL EVENT LISTENERS =================
  function setupEventListeners() {
    const DOM = window.App.DOM;

    // Pin / Unpin Sidebar in Sidebar Header
    if (DOM.btnPinSidebar) {
      DOM.btnPinSidebar.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebarPin();
      });
    }

    // Sidebar Toggle (Mobile Drawer or Desktop Pin/Collapse)
    if (DOM.btnSidebarToggle) {
      DOM.btnSidebarToggle.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          const isOpen = DOM.sidebar.classList.toggle('mobile-open');
          if (DOM.sidebarBackdrop) {
            DOM.sidebarBackdrop.classList.toggle('active', isOpen);
          }
        } else {
          toggleSidebarPin();
        }
      });
    }

    if (DOM.btnCloseSidebar) {
      DOM.btnCloseSidebar.addEventListener('click', () => {
        DOM.sidebar.classList.remove('mobile-open');
        if (DOM.sidebarBackdrop) DOM.sidebarBackdrop.classList.remove('active');
      });
    }

    if (DOM.sidebarBackdrop) {
      DOM.sidebarBackdrop.addEventListener('click', () => {
        DOM.sidebar.classList.remove('mobile-open');
        DOM.sidebarBackdrop.classList.remove('active');
      });
    }

    // Navigation Tab Clicks
    if (DOM.navItems) {
      DOM.navItems.forEach(item => {
        item.addEventListener('click', () => {
          const tab = item.dataset.tab;
          switchTab(tab);
        });
      });
    }

    // Quick New Invoice Header Button
    if (DOM.btnNewInvoiceQuick) {
      DOM.btnNewInvoiceQuick.addEventListener('click', () => {
        if (state.editingInvoiceNumber && window.cancelInvoiceEdit) {
          window.cancelInvoiceEdit();
        }
        switchTab('pos');
      });
    }

    // Header Auth Dropdown Actions
    if (DOM.btnHeaderAuth) {
      DOM.btnHeaderAuth.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.headerAuthDropdown.classList.toggle('open');
      });
    }

    if (DOM.btnHeaderSwitchUser) {
      DOM.btnHeaderSwitchUser.addEventListener('click', () => {
        if (window.App.Auth) window.App.Auth.triggerLockScreen(false);
      });
    }

    if (DOM.btnHeaderLogout) {
      DOM.btnHeaderLogout.addEventListener('click', () => {
        if (window.App.Auth) window.App.Auth.triggerLockScreen(true);
      });
    }

    document.addEventListener('click', (e) => {
      if (DOM.headerAuthDropdown && !e.target.closest('.header-auth-wrapper')) {
        DOM.headerAuthDropdown.classList.remove('open');
      }
    });

    if (DOM.btnQuickLock) {
      DOM.btnQuickLock.addEventListener('click', () => {
        if (window.App.Auth) window.App.Auth.triggerLockScreen(false);
      });
    }
    if (DOM.lockLoginForm) {
      DOM.lockLoginForm.addEventListener('submit', (e) => {
        if (window.App.Auth) window.App.Auth.unlockScreen(e);
      });
    }

    // POS Events
    if (DOM.posPartyTypeRadios) {
      DOM.posPartyTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
          DOM.posPartyTypeRadios.forEach(r => r.closest('.radio-chip').classList.remove('active'));
          e.target.closest('.radio-chip').classList.add('active');
          if (window.App.POS) window.App.POS.refreshPOSDropdowns();
        });
      });
    }

    if (DOM.posPartySelect) {
      DOM.posPartySelect.addEventListener('change', () => {
        if (window.App.POS) window.App.POS.handlePartySelectionChange();
      });
    }

    if (DOM.posItemSelect) {
      DOM.posItemSelect.addEventListener('change', () => {
        if (window.App.POS) window.App.POS.handleItemSelectChange();
      });
    }

    if (DOM.btnQuickAddParty) {
      DOM.btnQuickAddParty.addEventListener('click', () => {
        const type = window.App.POS ? window.App.POS.getSelectedPartyType() : 'customer';
        if (type === 'customer' && window.App.Entities) window.App.Entities.openCustomerModal();
        else if (type === 'supplier' && window.App.Entities) window.App.Entities.openSupplierModal();
        else if (type === 'oven' && window.App.Entities) window.App.Entities.openOvenModal();
        else if (type === 'cutter' && window.App.Entities) window.App.Entities.openCutterModal();
      });
    }

    if (DOM.chkDispatchOven) {
      DOM.chkDispatchOven.addEventListener('change', (e) => {
        if (DOM.dispatchOvenSelectWrap) {
          DOM.dispatchOvenSelectWrap.style.display = e.target.checked ? 'block' : 'none';
        }
      });
    }

    if (DOM.chkDispatchCutter) {
      DOM.chkDispatchCutter.addEventListener('change', (e) => {
        if (DOM.dispatchCutterSelectWrap) {
          DOM.dispatchCutterSelectWrap.style.display = e.target.checked ? 'block' : 'none';
        }
      });
    }

    if (DOM.posLinkCustomerSelect) {
      DOM.posLinkCustomerSelect.addEventListener('change', () => {
        if (window.App.POS) window.App.POS.handleLinkCustomerChange();
      });
    }
    if (DOM.posLinkInvoiceSelect) {
      DOM.posLinkInvoiceSelect.addEventListener('change', () => {
        if (window.App.POS) window.App.POS.handleLinkInvoiceChange();
      });
    }
    if (DOM.btnImportAllClientItems) {
      DOM.btnImportAllClientItems.addEventListener('click', () => {
        if (window.App.POS) window.App.POS.importAllClientItemsToCart();
      });
    }

    if (DOM.coreChips) {
      DOM.coreChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const category = chip.dataset.category;
          if (window.App.POS) window.App.POS.handleCoreChipClick(category);
        });
      });
    }

    if (DOM.btnAddToCart) {
      DOM.btnAddToCart.addEventListener('click', () => {
        if (window.App.POS) window.App.POS.addItemToCart();
      });
    }
    if (DOM.posDiscountInput) {
      DOM.posDiscountInput.addEventListener('input', () => {
        if (window.App.POS) window.App.POS.renderCart();
      });
    }
    if (DOM.btnClearCart) {
      DOM.btnClearCart.addEventListener('click', () => {
        if (window.App.POS) window.App.POS.clearCart();
      });
    }
    if (DOM.btnSaveInvoice) {
      DOM.btnSaveInvoice.addEventListener('click', () => {
        if (window.App.POS) window.App.POS.saveInvoice();
      });
    }

    // Invoice View Modal Actions
    if (DOM.btnCloseInvoiceModal) {
      DOM.btnCloseInvoiceModal.addEventListener('click', () => {
        if (window.App.Print) window.App.Print.closeInvoiceModal();
      });
    }
    if (DOM.btnModalEditInvoice) {
      DOM.btnModalEditInvoice.addEventListener('click', () => {
        const curInv = (window.App && window.App.State && window.App.State.currentInvoice) || state.currentInvoice;
        if (!curInv) return;
        if (window.App && window.App.POS && typeof window.App.POS.startEditInvoice === 'function') {
          window.App.POS.startEditInvoice(curInv.invoiceNumber);
        } else if (typeof window.editInvoice === 'function') {
          window.editInvoice(curInv.invoiceNumber);
        }
      });
    }
    if (DOM.btnDownloadInvoiceImage) {
      DOM.btnDownloadInvoiceImage.addEventListener('click', () => {
        if (window.App.Print) window.App.Print.downloadInvoiceAsImage();
      });
    }
    if (DOM.btnShareWhatsApp) {
      DOM.btnShareWhatsApp.addEventListener('click', () => {
        if (window.App.Print) window.App.Print.shareInvoiceWhatsApp();
      });
    }
    if (DOM.btnPrintInvoice) {
      DOM.btnPrintInvoice.addEventListener('click', () => {
        if (window.App.Print) window.App.Print.printInvoice();
      });
    }

    // Dispatch Actions from Invoice View Modal
    if (DOM.btnModalDispatchOven) {
      DOM.btnModalDispatchOven.addEventListener('click', () => {
        const curInv = (window.App && window.App.State && window.App.State.currentInvoice) || state.currentInvoice;
        if (!curInv) return;
        if (curInv.linkedOvenInvoiceNumber) {
          window.viewInvoiceDetail(curInv.linkedOvenInvoiceNumber, 'oven');
        } else if (window.App.Invoices && typeof window.App.Invoices.openDispatchModal === 'function') {
          window.App.Invoices.openDispatchModal('oven', curInv);
        }
      });
    }

    if (DOM.btnModalDispatchCutter) {
      DOM.btnModalDispatchCutter.addEventListener('click', () => {
        const curInv = (window.App && window.App.State && window.App.State.currentInvoice) || state.currentInvoice;
        if (!curInv) return;
        if (curInv.linkedCutterInvoiceNumber) {
          window.viewInvoiceDetail(curInv.linkedCutterInvoiceNumber, 'cutter');
        } else if (window.App.Invoices && typeof window.App.Invoices.openDispatchModal === 'function') {
          window.App.Invoices.openDispatchModal('cutter', curInv);
        }
      });
    }

    // Dispatch Modal Actions
    if (DOM.dispatchForm) {
      DOM.dispatchForm.addEventListener('submit', (e) => {
        if (window.App.Invoices) window.App.Invoices.handleDispatchFormSubmit(e);
      });
    }
    if (DOM.btnCloseDispatchModal) {
      DOM.btnCloseDispatchModal.addEventListener('click', () => DOM.dispatchModal.classList.remove('open'));
    }
    if (DOM.btnCancelDispatchModal) {
      DOM.btnCancelDispatchModal.addEventListener('click', () => DOM.dispatchModal.classList.remove('open'));
    }

    if (DOM.radioDispatchOven) {
      DOM.radioDispatchOven.addEventListener('change', () => {
        if (window.App.Invoices) window.App.Invoices.setDispatchTargetType('oven');
      });
    }
    if (DOM.radioDispatchCutter) {
      DOM.radioDispatchCutter.addEventListener('change', () => {
        if (window.App.Invoices) window.App.Invoices.setDispatchTargetType('cutter');
      });
    }
    if (DOM.dispatchCardOven) {
      DOM.dispatchCardOven.addEventListener('click', () => {
        if (window.App.Invoices) window.App.Invoices.setDispatchTargetType('oven');
      });
    }
    if (DOM.dispatchCardCutter) {
      DOM.dispatchCardCutter.addEventListener('click', () => {
        if (window.App.Invoices) window.App.Invoices.setDispatchTargetType('cutter');
      });
    }

    // WhatsApp Image Modal Actions
    if (DOM.btnCloseWhatsappModal) {
      DOM.btnCloseWhatsappModal.addEventListener('click', () => {
        DOM.whatsappModal.classList.remove('open');
      });
    }

    if (DOM.btnCopyImageAgain) {
      DOM.btnCopyImageAgain.addEventListener('click', async () => {
        if (state.lastGeneratedImageBlob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': state.lastGeneratedImageBlob })
            ]);
            showToast('تم نسخ الصورة مجدداً إلى الحافظة! (Ctrl + V)', 'success');
          } catch (e) {
            showToast('الملف متاح أيضاً في مجلد التنزيلات بجهازك', 'info');
          }
        } else {
          showToast('الصورة جاهزة ومحفوظة في مجلد التنزيلات بجهازك', 'info');
        }
      });
    }

    // Statement Modal Actions
    if (DOM.btnCloseStatementModal) {
      DOM.btnCloseStatementModal.addEventListener('click', () => {
        DOM.statementModal.classList.remove('open');
      });
    }
    if (DOM.btnDownloadStatementImage) {
      DOM.btnDownloadStatementImage.addEventListener('click', () => {
        if (window.App.Print) window.App.Print.downloadStatementAsImage();
      });
    }
    if (DOM.btnShareStatementWhatsApp) {
      DOM.btnShareStatementWhatsApp.addEventListener('click', () => {
        if (window.App.Print) window.App.Print.shareStatementWhatsApp();
      });
    }
    if (DOM.btnPrintStatement) {
      DOM.btnPrintStatement.addEventListener('click', () => {
        if (window.App.Print) window.App.Print.printAccountStatement();
      });
    }

    // Reports Print Actions
    if (DOM.btnPrintCustomersReport) {
      DOM.btnPrintCustomersReport.addEventListener('click', () => {
        if (window.App.Print) window.App.Print.printCustomersReport();
      });
    }
    if (DOM.btnPrintSuppliersReport) {
      DOM.btnPrintSuppliersReport.addEventListener('click', () => {
        if (window.App.Print) window.App.Print.printSuppliersReport();
      });
    }
    if (DOM.btnPrintOvensReport) {
      DOM.btnPrintOvensReport.addEventListener('click', () => {
        if (window.App.Print) window.App.Print.printOvensReport();
      });
    }
    if (DOM.btnPrintCuttersReport) {
      DOM.btnPrintCuttersReport.addEventListener('click', () => {
        if (window.App.Print) window.App.Print.printCuttersReport();
      });
    }

    // Items Events
    if (DOM.btnOpenAddItemModal) {
      DOM.btnOpenAddItemModal.addEventListener('click', () => {
        if (window.App.Entities) window.App.Entities.openItemModal();
      });
    }
    if (DOM.btnCloseItemModal) DOM.btnCloseItemModal.addEventListener('click', () => DOM.itemModal.classList.remove('open'));
    if (DOM.btnCancelItemModal) DOM.btnCancelItemModal.addEventListener('click', () => DOM.itemModal.classList.remove('open'));
    if (DOM.itemForm) {
      DOM.itemForm.addEventListener('submit', (e) => {
        if (window.App.Entities) window.App.Entities.saveItemForm(e);
      });
    }
    if (DOM.searchItemsInput) {
      DOM.searchItemsInput.addEventListener('input', () => {
        if (window.App.Entities) window.App.Entities.renderItemsTable();
      });
    }
    if (DOM.itemsCategoryFilter) {
      DOM.itemsCategoryFilter.querySelectorAll('.pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
          DOM.itemsCategoryFilter.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
          e.target.classList.add('active');
          if (window.App.Entities) window.App.Entities.renderItemsTable();
        });
      });
    }

    // Customers Events
    if (DOM.btnOpenAddCustomerModal) {
      DOM.btnOpenAddCustomerModal.addEventListener('click', () => {
        if (window.App.Entities) window.App.Entities.openCustomerModal();
      });
    }
    if (DOM.btnCloseCustomerModal) DOM.btnCloseCustomerModal.addEventListener('click', () => DOM.customerModal.classList.remove('open'));
    if (DOM.btnCancelCustomerModal) DOM.btnCancelCustomerModal.addEventListener('click', () => DOM.customerModal.classList.remove('open'));
    if (DOM.customerForm) {
      DOM.customerForm.addEventListener('submit', (e) => {
        if (window.App.Entities) window.App.Entities.saveCustomerForm(e);
      });
    }
    if (DOM.searchCustomersInput) {
      DOM.searchCustomersInput.addEventListener('input', () => {
        if (window.App.Entities) window.App.Entities.renderCustomersTable();
      });
    }

    // Suppliers Events
    if (DOM.btnOpenAddSupplierModal) {
      DOM.btnOpenAddSupplierModal.addEventListener('click', () => {
        if (window.App.Entities) window.App.Entities.openSupplierModal();
      });
    }
    if (DOM.btnCloseSupplierModal) DOM.btnCloseSupplierModal.addEventListener('click', () => DOM.supplierModal.classList.remove('open'));
    if (DOM.btnCancelSupplierModal) DOM.btnCancelSupplierModal.addEventListener('click', () => DOM.supplierModal.classList.remove('open'));
    if (DOM.supplierForm) {
      DOM.supplierForm.addEventListener('submit', (e) => {
        if (window.App.Entities) window.App.Entities.saveSupplierForm(e);
      });
    }
    if (DOM.searchSuppliersInput) {
      DOM.searchSuppliersInput.addEventListener('input', () => {
        if (window.App.Entities) window.App.Entities.renderSuppliersTable();
      });
    }

    // Ovens Events
    if (DOM.btnOpenAddOvenModal) {
      DOM.btnOpenAddOvenModal.addEventListener('click', () => {
        if (window.App.Entities) window.App.Entities.openOvenModal();
      });
    }
    if (DOM.btnCloseOvenModal) DOM.btnCloseOvenModal.addEventListener('click', () => DOM.ovenModal.classList.remove('open'));
    if (DOM.btnCancelOvenModal) DOM.btnCancelOvenModal.addEventListener('click', () => DOM.ovenModal.classList.remove('open'));
    if (DOM.ovenForm) {
      DOM.ovenForm.addEventListener('submit', (e) => {
        if (window.App.Entities) window.App.Entities.saveOvenForm(e);
      });
    }
    if (DOM.searchOvensInput) {
      DOM.searchOvensInput.addEventListener('input', () => {
        if (window.App.Entities) window.App.Entities.renderOvensTable();
      });
    }

    // Cutters Events
    if (DOM.btnOpenAddCutterModal) {
      DOM.btnOpenAddCutterModal.addEventListener('click', () => {
        if (window.App.Entities) window.App.Entities.openCutterModal();
      });
    }
    if (DOM.btnCloseCutterModal) DOM.btnCloseCutterModal.addEventListener('click', () => DOM.cutterModal.classList.remove('open'));
    if (DOM.btnCancelCutterModal) DOM.btnCancelCutterModal.addEventListener('click', () => DOM.cutterModal.classList.remove('open'));
    if (DOM.cutterForm) {
      DOM.cutterForm.addEventListener('submit', (e) => {
        if (window.App.Entities) window.App.Entities.saveCutterForm(e);
      });
    }
    if (DOM.searchCuttersInput) {
      DOM.searchCuttersInput.addEventListener('input', () => {
        if (window.App.Entities) window.App.Entities.renderCuttersTable();
      });
    }

    // Invoices Events
    if (DOM.searchInvoicesInput) {
      DOM.searchInvoicesInput.addEventListener('input', () => {
        if (window.App.Invoices) window.App.Invoices.renderInvoicesTable();
      });
    }
    if (DOM.invoicesTypeFilter) {
      DOM.invoicesTypeFilter.querySelectorAll('.pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
          DOM.invoicesTypeFilter.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
          e.target.classList.add('active');
          if (window.App.Invoices) window.App.Invoices.renderInvoicesTable();
        });
      });
    }
    if (DOM.btnPrintInvoicesLog) {
      DOM.btnPrintInvoicesLog.addEventListener('click', () => {
        if (window.App.Print) window.App.Print.printInvoicesLog();
      });
    }

    // Color Selector Dropdown
    if (DOM.posItemColorSelect) {
      DOM.posItemColorSelect.addEventListener('change', () => {
        if (window.App.POS) window.App.POS.syncCustomColorDropdown(DOM.posItemColorSelect.value);
        if (DOM.posItemColorSelect.value === 'custom') {
          if (DOM.posItemColor) {
            DOM.posItemColor.style.display = 'block';
            DOM.posItemColor.value = '';
            DOM.posItemColor.focus();
          }
        } else {
          if (DOM.posItemColor) {
            DOM.posItemColor.style.display = 'none';
            DOM.posItemColor.value = DOM.posItemColorSelect.value;
          }
        }
      });
    }

    // Print Cleanup Listener
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-invoice-mode', 'printing-statement-mode', 'printing-report-mode');
      if (DOM.printableReportContainer) {
        DOM.printableReportContainer.innerHTML = '';
      }
    });

    // Settings & Users Events
    if (DOM.factorySettingsForm) {
      DOM.factorySettingsForm.addEventListener('submit', (e) => {
        if (window.App.Settings) window.App.Settings.saveFactorySettings(e);
      });
    }
    if (DOM.addUserForm) {
      DOM.addUserForm.addEventListener('submit', (e) => {
        if (window.App.Auth) window.App.Auth.handleAddUserForm(e);
      });
    }
    if (DOM.editUserForm) {
      DOM.editUserForm.addEventListener('submit', (e) => {
        if (window.App.Auth) window.App.Auth.handleEditUserForm(e);
      });
    }
    if (DOM.btnCloseEditUserModal) {
      DOM.btnCloseEditUserModal.addEventListener('click', () => DOM.editUserModal.classList.remove('open'));
    }
    if (DOM.btnCancelEditUserModal) {
      DOM.btnCancelEditUserModal.addEventListener('click', () => DOM.editUserModal.classList.remove('open'));
    }

    // Password Visibility Toggles
    if (DOM.btnToggleNewPassword && DOM.newUserPassword) {
      DOM.btnToggleNewPassword.addEventListener('click', () => {
        const isPass = DOM.newUserPassword.type === 'password';
        DOM.newUserPassword.type = isPass ? 'text' : 'password';
        if (DOM.toggleNewPasswordIcon) {
          DOM.toggleNewPasswordIcon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        }
      });
    }

    if (DOM.btnToggleEditPassword && DOM.editUserPassword) {
      DOM.btnToggleEditPassword.addEventListener('click', () => {
        const isPass = DOM.editUserPassword.type === 'password';
        DOM.editUserPassword.type = isPass ? 'text' : 'password';
        if (DOM.toggleEditPasswordIcon) {
          DOM.toggleEditPasswordIcon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        }
      });
    }

    // Close Modals on click outside dialog
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal && modal.id !== 'lockModal') {
          modal.classList.remove('open');
        }
      });
    });
  }

  // Export methods to App
  window.App.switchTab = switchTab;
  window.switchTab = switchTab;
  window.App.toggleSidebarPin = toggleSidebarPin;
  window.App.applySidebarPinnedState = applySidebarPinnedState;
  window.App.renderAllTables = renderAllTables;

  // Initialize on DOMContentLoaded or immediately
  const startAppAfterDatabase = () => {
    const ready = window.FactoryApiBridge && window.FactoryApiBridge.ready;
    if (ready && typeof ready.then === 'function') ready.finally(initApp);
    else initApp();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAppAfterDatabase);
  } else {
    startAppAfterDatabase();
  }

})();
