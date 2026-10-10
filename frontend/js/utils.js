/**
 * مصنع تو-A (Factory 2-A)
 * Utilities & Helper Functions (Clean Architecture)
 */

window.App = window.App || {};

(function (App) {
  'use strict';

  /**
   * Central Currency & Number Formatter without trailing .00
   * @param {number|string} amount 
   * @param {boolean} withCurrency 
   * @returns {string}
   */
  function formatMoney(amount, withCurrency = false) {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return withCurrency ? '0 ج.م' : '0';
    }
    const n = Number(amount);
    const formatted = n.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return withCurrency ? `${formatted} ج.م` : formatted;
  }

  /**
   * Adjust dimensions with offset (e.g. +8cm width, +4cm length for cutter)
   * @param {string|number} dimStr 
   * @param {number} offsetCm 
   * @returns {string}
   */
  function addDimensionOffset(dimStr, offsetCm) {
    if (dimStr === null || dimStr === undefined) return `${offsetCm} سم`;
    const trimmed = String(dimStr).trim();
    if (trimmed === '-' || trimmed === '') return `${offsetCm} سم`;

    const match = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s*(.*)$/);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2].trim();

      if (unit === 'م' || unit.toLowerCase() === 'm' || unit === 'متر') {
        const offsetM = offsetCm / 100;
        const newNum = Math.round((num + offsetM) * 1000) / 1000;
        return `${newNum} ${unit || 'م'}`;
      }

      const newNum = Math.round((num + offsetCm) * 100) / 100;
      return unit ? `${newNum} ${unit}` : `${newNum} سم`;
    }

    return `${trimmed} (+${offsetCm} سم)`;
  }

  /**
   * Modern Toast Notification System
   * @param {string} message 
   * @param {'success'|'danger'|'info'|'warning'} type 
   */
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'fa-circle-check';
    if (type === 'danger') icon = 'fa-circle-xmark';
    if (type === 'info') icon = 'fa-circle-info';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideInLeft 0.25s reverse ease-in';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  let clockIntervalId = null;

  /**
   * Live Digital Clock in Arabic locale
   * @param {HTMLElement} [element]
   */
  function startClock(element) {
    if (clockIntervalId) {
      clearInterval(clockIntervalId);
      clockIntervalId = null;
    }

    function update() {
      const el = element || (window.App && window.App.DOM && window.App.DOM.liveTime) || document.getElementById('liveTime');
      if (el) {
        const now = new Date();
        el.textContent = now.toLocaleTimeString('ar-EG');
      }
    }

    update();
    clockIntervalId = setInterval(update, 1000);
  }

  // Auto-start clock when document is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => startClock());
    } else {
      startClock();
    }
  }

  /**
   * Clean phone number for WhatsApp links (default Egyptian country code +20)
   * @param {string} phone 
   * @returns {string}
   */
  function cleanPhoneForWhatsApp(phone) {
    if (!phone) return '';
    let clean = String(phone).replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) {
      clean = '2' + clean;
    } else if (clean.startsWith('1') && clean.length === 10) {
      clean = '20' + clean;
    }
    return clean;
  }

  // Export to App namespace
  App.Utils = {
    formatMoney,
    addDimensionOffset,
    showToast,
    startClock,
    cleanPhoneForWhatsApp
  };

  // Expose to window for global templates and backward compatibility
  window.formatMoney = formatMoney;
  window.addDimensionOffset = addDimensionOffset;
  window.showToast = showToast;
  window.startClock = startClock;
  window.cleanPhoneForWhatsApp = cleanPhoneForWhatsApp;

})(window.App);
