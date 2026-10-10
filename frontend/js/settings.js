/**
 * مصنع تو-A (Factory 2-A)
 * Factory Settings Module (Clean Architecture)
 */

window.App = window.App || {};

(function (App) {
  'use strict';

  function loadSettingsIntoUI() {
    const DOM = App.DOM;
    if (!DOM) return;
    const settings = AppStore.getSettings();

    if (DOM.settingFactoryName) DOM.settingFactoryName.value = settings.factoryName || '';
    if (DOM.settingFactorySub) DOM.settingFactorySub.value = settings.subTitle || '';
    if (DOM.settingFactoryPhone) DOM.settingFactoryPhone.value = settings.phone || '';
    if (DOM.settingFactoryPhone2) DOM.settingFactoryPhone2.value = settings.phone2 || '';
    if (DOM.settingFactoryAddress) DOM.settingFactoryAddress.value = settings.address || '';
    if (DOM.settingInvoiceFooterMsg) DOM.settingInvoiceFooterMsg.value = settings.footerMsg || '';

    const factorySub = settings.subTitle || 'لتصنيع الارفف والاستندات بتقنية الفايبر ليزر';
    if (DOM.brandNameDisplay) {
      DOM.brandNameDisplay.textContent = settings.factoryName || 'مصنع (tow_a)';
    }
    if (DOM.brandSubDisplay) {
      DOM.brandSubDisplay.textContent = factorySub;
      DOM.brandSubDisplay.title = factorySub;
    }
  }

  function saveFactorySettings(e) {
    if (e && e.preventDefault) e.preventDefault();
    const DOM = App.DOM;
    if (!DOM) return;

    const updated = {
      factoryName: DOM.settingFactoryName.value.trim(),
      subTitle: DOM.settingFactorySub.value.trim(),
      phone: DOM.settingFactoryPhone.value.trim(),
      phone2: DOM.settingFactoryPhone2.value.trim(),
      address: DOM.settingFactoryAddress.value.trim(),
      footerMsg: DOM.settingInvoiceFooterMsg.value.trim(),
      logoUrl: 'assets/logo.jpg'
    };

    AppStore.saveSettings(updated);
    loadSettingsIntoUI();
    App.Utils.showToast('تم حفظ وتحديث بيانات المصنع بنجاح');
  }

  App.Settings = {
    load: loadSettingsIntoUI,
    loadSettingsIntoUI: loadSettingsIntoUI,
    save: saveFactorySettings,
    saveFactorySettings: saveFactorySettings
  };

})(window.App);
