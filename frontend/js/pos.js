/**
 * مصنع تو-A (Factory 2-A)
 * Point of Sale (POS) & Invoice Generation Module (Clean Architecture)
 */

window.App = window.App || {};

(function (App) {
  'use strict';

  function getState() {
    return (window.App && window.App.State) ? window.App.State : (App.State || {});
  }

  function getDOM() {
    return (window.App && window.App.DOM) ? window.App.DOM : (App.DOM || {});
  }

  // ================= 1. INITIALIZATION & RESET =================
  function initPOS() {
    setupCustomColorDropdown();
    refreshPOSDropdowns();
    resetInvoiceMeta();
    renderCart();
  }

  function resetInvoiceMeta() {
    const DOM = getDOM();
    const state = getState();
    if (!DOM || !state) return;

    state.editingInvoiceNumber = null;
    if (DOM.posEditModeBanner) DOM.posEditModeBanner.style.display = 'none';
    if (DOM.btnCancelEditInvoice) DOM.btnCancelEditInvoice.style.display = 'none';
    if (DOM.btnSaveInvoice) {
      DOM.btnSaveInvoice.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ الفاتورة والمعاينة';
    }
    if (DOM.currentInvoiceNumberTag) {
      DOM.currentInvoiceNumberTag.textContent = AppStore.getNextInvoiceNumber();
      DOM.currentInvoiceNumberTag.style.background = '';
      DOM.currentInvoiceNumberTag.style.color = '';
    }
    if (DOM.posInvoiceDate) DOM.posInvoiceDate.value = new Date().toISOString().split('T')[0];
    if (DOM.posPaymentMethod) DOM.posPaymentMethod.value = 'نقدي';
    if (DOM.posItemColorSelect) DOM.posItemColorSelect.value = '';
    if (DOM.posItemThickness) DOM.posItemThickness.value = '';
    if (DOM.posItemSupports) DOM.posItemSupports.value = '';
    
    syncCustomColorDropdown('');
    if (DOM.posItemColor) {
      DOM.posItemColor.value = '';
      DOM.posItemColor.style.display = 'none';
    }
    if (DOM.posItemWeightTon) DOM.posItemWeightTon.value = '';
    if (DOM.chkDispatchOven) {
      DOM.chkDispatchOven.checked = false;
      if (DOM.dispatchOvenSelectWrap) DOM.dispatchOvenSelectWrap.style.display = 'none';
    }
    if (DOM.chkDispatchCutter) {
      DOM.chkDispatchCutter.checked = false;
      if (DOM.dispatchCutterSelectWrap) DOM.dispatchCutterSelectWrap.style.display = 'none';
    }
    if (DOM.posInvoiceNotes) DOM.posInvoiceNotes.value = '';
    if (DOM.posDiscountInput) DOM.posDiscountInput.value = '0';

    // Reset Linked Client Invoice State
    state.selectedLinkedClientInvoice = null;
    state.selectedLinkedClientInvoiceNumber = null;
    state.selectedLinkedClientItemIndex = 0;
    if (DOM.posLinkCustomerSelect) DOM.posLinkCustomerSelect.value = '';
    if (DOM.posLinkInvoiceSelect) {
      DOM.posLinkInvoiceSelect.innerHTML = '<option value="">-- اختر العميل أولاً --</option>';
      DOM.posLinkInvoiceSelect.disabled = true;
    }
    if (DOM.posLinkInvoicePreview) DOM.posLinkInvoicePreview.style.display = 'none';

    state.posCart = [];
    renderCart();
  }

  // ================= 2. CUSTOM COLOR SELECT DROPDOWN =================
  function syncCustomColorDropdown(value) {
    const trigger = document.getElementById('customColorSelectTrigger');
    const menu = document.getElementById('customColorDropdownMenu');
    if (!trigger || !menu) return;

    const currentText = trigger.querySelector('#customColorCurrentText') || trigger.querySelector('.color-text') || trigger.querySelector('.current-color-text');
    const currentDot = trigger.querySelector('#customColorCurrentDot') || trigger.querySelector('.color-dot');
    const options = menu.querySelectorAll('.custom-color-opt, .color-option');

    const colorMap = {
      '': { text: 'عادي (بدون لون)', dotClass: 'default-dot', isIcon: false },
      'اسود': { text: 'اسود', dotClass: 'dot-black', isIcon: false },
      'بيج': { text: 'بيج', dotClass: 'dot-beige', isIcon: false },
      'رصاصي': { text: 'رصاصي', dotClass: 'dot-lead', isIcon: false },
      'رمادي': { text: 'رمادي', dotClass: 'dot-gray', isIcon: false },
      'برتقالي': { text: 'برتقالي', dotClass: 'dot-orange', isIcon: false },
      'custom': { text: 'لون آخر (كتابة يدوية)...', dotClass: 'dot-custom', isIcon: true }
    };

    const targetKey = colorMap[value] ? value : (value ? 'custom' : '');
    const cfg = colorMap[targetKey];

    if (currentText) {
      if (targetKey === 'custom' && value && value !== 'custom') {
        currentText.textContent = value;
      } else {
        currentText.textContent = cfg.text;
      }
    }
    if (currentDot) {
      currentDot.className = 'color-dot ' + cfg.dotClass;
      if (cfg.isIcon) {
        currentDot.innerHTML = '<i class="fa-solid fa-pen-nib"></i>';
      } else {
        currentDot.innerHTML = '';
      }
    }

    options.forEach(opt => {
      const optVal = opt.getAttribute('data-value');
      if (optVal === targetKey) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  function setupCustomColorDropdown() {
    const wrapper = document.getElementById('customColorSelectWrapper');
    const trigger = document.getElementById('customColorSelectTrigger');
    const menu = document.getElementById('customColorDropdownMenu');
    const nativeSelect = document.getElementById('posItemColorSelect');
    const customInput = document.getElementById('posItemColor');
    if (!wrapper || !trigger || !menu) return;

    trigger.onclick = (e) => {
      e.stopPropagation();
      wrapper.classList.toggle('open');
    };

    const options = menu.querySelectorAll('.custom-color-opt, .color-option');
    options.forEach(opt => {
      opt.onclick = (e) => {
        e.stopPropagation();
        const val = opt.getAttribute('data-value');
        if (nativeSelect) {
          nativeSelect.value = val;
          nativeSelect.dispatchEvent(new Event('change'));
        }
        syncCustomColorDropdown(val);
        wrapper.classList.remove('open');

        if (val === 'custom') {
          if (customInput) {
            customInput.style.display = 'block';
            customInput.value = '';
            customInput.focus();
          }
        } else {
          if (customInput) {
            customInput.style.display = 'none';
            customInput.value = val;
          }
        }
      };
    });

    if (customInput) {
      customInput.addEventListener('input', (e) => {
        const text = e.target.value.trim();
        const currentText = trigger.querySelector('#customColorCurrentText') || trigger.querySelector('.color-text');
        if (currentText) {
          currentText.textContent = text || 'لون آخر (كتابة يدوية)...';
        }
      });
    }

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove('open');
      }
    });
  }

  // ================= 3. PARTY SELECTION & DROPDOWNS =================
  function setPOSPartyType(type) {
    const DOM = getDOM();
    if (!DOM || !DOM.posPartyTypeRadios) return;
    DOM.posPartyTypeRadios.forEach(radio => {
      const isMatch = (radio.value === type);
      radio.checked = isMatch;
      if (radio.closest('.radio-chip')) {
        radio.closest('.radio-chip').classList.toggle('active', isMatch);
      }
    });
    refreshPOSDropdowns();
  }

  function getSelectedPartyType() {
    const DOM = getDOM();
    let selected = 'customer';
    if (DOM && DOM.posPartyTypeRadios) {
      DOM.posPartyTypeRadios.forEach(r => {
        if (r.checked) selected = r.value;
      });
    }
    return selected;
  }

  function refreshPOSDropdowns() {
    const DOM = getDOM();
    if (!DOM || !DOM.posPartySelect) return;
    const partyType = getSelectedPartyType();

    DOM.posPartySelect.innerHTML = '<option value="">-- اختر الجهة المستهدفة --</option>';
    
    if (partyType === 'customer') {
      DOM.partySelectLabel.textContent = 'اختيار العميل:';
      if (DOM.posLinkedDispatchSection) DOM.posLinkedDispatchSection.style.display = 'block';
      if (DOM.posLinkClientSection) DOM.posLinkClientSection.style.display = 'none';
      const customers = AppStore.getCustomers();
      customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.code || c.id})`;
        DOM.posPartySelect.appendChild(opt);
      });

      if (DOM.dispatchOvenSelect) {
        DOM.dispatchOvenSelect.innerHTML = '<option value="">-- اختر فرن التشغيل --</option>';
        AppStore.getOvens().forEach(o => {
          const opt = document.createElement('option');
          opt.value = o.id;
          opt.textContent = `${o.name} (${o.code || o.id})`;
          DOM.dispatchOvenSelect.appendChild(opt);
        });
      }
      if (DOM.dispatchCutterSelect) {
        DOM.dispatchCutterSelect.innerHTML = '<option value="">-- اختر مقص التشغيل --</option>';
        AppStore.getCutters().forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = `${c.name} (${c.code || c.id})`;
          DOM.dispatchCutterSelect.appendChild(opt);
        });
      }
    } else if (partyType === 'supplier') {
      DOM.partySelectLabel.textContent = 'اختيار المورد:';
      if (DOM.posLinkedDispatchSection) DOM.posLinkedDispatchSection.style.display = 'none';
      if (DOM.posLinkClientSection) DOM.posLinkClientSection.style.display = 'none';
      const suppliers = AppStore.getSuppliers();
      suppliers.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.code || s.id})`;
        DOM.posPartySelect.appendChild(opt);
      });
    } else if (partyType === 'oven') {
      DOM.partySelectLabel.textContent = 'اختيار الفرن / المعالجة:';
      if (DOM.posLinkedDispatchSection) DOM.posLinkedDispatchSection.style.display = 'none';
      if (DOM.posLinkClientSection) DOM.posLinkClientSection.style.display = 'block';
      const ovens = AppStore.getOvens();
      ovens.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = `${o.name} (${o.code || o.id})`;
        DOM.posPartySelect.appendChild(opt);
      });
      updateLinkClientSectionUI('oven');
    } else if (partyType === 'cutter') {
      DOM.partySelectLabel.textContent = 'اختيار المقص / الورشة:';
      if (DOM.posLinkedDispatchSection) DOM.posLinkedDispatchSection.style.display = 'none';
      if (DOM.posLinkClientSection) DOM.posLinkClientSection.style.display = 'block';
      const cutters = AppStore.getCutters();
      cutters.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.code || c.id})`;
        DOM.posPartySelect.appendChild(opt);
      });
      updateLinkClientSectionUI('cutter');
    }

    if (DOM.posSupplierWeightGroup) {
      DOM.posSupplierWeightGroup.style.display = (partyType === 'supplier') ? 'block' : 'none';
    }
    if (DOM.thCartWeight) {
      DOM.thCartWeight.style.display = (partyType === 'supplier') ? '' : 'none';
    }
    if (DOM.posSupplierTotalWeightItem) {
      DOM.posSupplierTotalWeightItem.style.display = (partyType === 'supplier') ? 'flex' : 'none';
    }

    const isOperational = (partyType === 'oven' || partyType === 'cutter');
    if (DOM.posItemPrice) {
      if (isOperational) {
        DOM.posItemPrice.value = '0';
        DOM.posItemPrice.disabled = true;
        if (DOM.posOperationalPriceNotice) DOM.posOperationalPriceNotice.style.display = 'block';
      } else {
        DOM.posItemPrice.disabled = false;
        if (DOM.posOperationalPriceNotice) DOM.posOperationalPriceNotice.style.display = 'none';
      }
    }
    if (DOM.thCartPrice) DOM.thCartPrice.style.display = isOperational ? 'none' : '';
    if (DOM.thCartTotal) DOM.thCartTotal.style.display = isOperational ? 'none' : '';
    if (DOM.posNormalSummaryDetails) DOM.posNormalSummaryDetails.style.display = isOperational ? 'none' : 'grid';
    if (DOM.posOperationalSummaryDetails) DOM.posOperationalSummaryDetails.style.display = isOperational ? 'flex' : 'none';

    if (DOM.posItemSelect) {
      DOM.posItemSelect.innerHTML = '<option value="">-- اختر صنفاً جاهزاً من القائمة --</option>';
      const items = AppStore.getItems();
      items.forEach(itm => {
        const opt = document.createElement('option');
        opt.value = itm.id;
        opt.textContent = `[${itm.category}] ${itm.name}`;
        DOM.posItemSelect.appendChild(opt);
      });
    }

    handlePartySelectionChange();
  }

  function handlePartySelectionChange() {
    const DOM = getDOM();
    if (!DOM || !DOM.posPartySelect) return;
    const partyType = getSelectedPartyType();
    const selectedId = DOM.posPartySelect.value;

    if (!selectedId) {
      if (DOM.partyPreviewCard) DOM.partyPreviewCard.style.display = 'none';
      return;
    }

    let party = null;
    if (partyType === 'customer') party = AppStore.getCustomers().find(c => c.id === selectedId);
    if (partyType === 'supplier') party = AppStore.getSuppliers().find(s => s.id === selectedId);
    if (partyType === 'oven') party = AppStore.getOvens().find(o => o.id === selectedId);
    if (partyType === 'cutter') party = AppStore.getCutters().find(c => c.id === selectedId);

    if (party && DOM.partyPreviewCard) {
      DOM.partyPreviewPhone.textContent = party.phone || 'غير مسجل';
      DOM.partyPreviewAddress.textContent = party.address || party.code || '-';
      DOM.partyPreviewCard.style.display = 'block';
    } else if (DOM.partyPreviewCard) {
      DOM.partyPreviewCard.style.display = 'none';
    }
  }

  function handleItemSelectChange() {
    const DOM = getDOM();
    if (!DOM || !DOM.posItemSelect) return;
    const itemId = DOM.posItemSelect.value;
    if (!itemId) return;

    const partyType = getSelectedPartyType();
    const isOperational = (partyType === 'oven' || partyType === 'cutter');

    const item = AppStore.getItems().find(i => i.id === itemId);
    if (item) {
      DOM.posItemName.value = item.name;
      DOM.posItemPrice.value = isOperational ? '0' : '';
      DOM.posItemWidth.value = '';
      DOM.posItemLength.value = '';
      if (DOM.posItemThickness) DOM.posItemThickness.value = '';
      if (DOM.posItemSupports) DOM.posItemSupports.value = '';
      DOM.posItemQty.value = 1;
      if (DOM.posItemWeightTon) DOM.posItemWeightTon.value = '';
      if (!isOperational) DOM.posItemPrice.focus();
    }
  }

  function handleCoreChipClick(category) {
    const DOM = getDOM();
    const partyType = getSelectedPartyType();
    const isOperational = (partyType === 'oven' || partyType === 'cutter');

    const items = AppStore.getItems().filter(i => i.category === category);
    if (items.length > 0) {
      const itm = items[0];
      DOM.posItemSelect.value = itm.id;
      handleItemSelectChange();
    } else {
      DOM.posItemName.value = category + ' ';
      DOM.posItemPrice.value = isOperational ? '0' : '';
      DOM.posItemWidth.value = '';
      DOM.posItemLength.value = '';
      if (DOM.posItemThickness) DOM.posItemThickness.value = '';
      if (DOM.posItemSupports) DOM.posItemSupports.value = '';
      if (DOM.posItemWeightTon) DOM.posItemWeightTon.value = '';
      if (!isOperational) DOM.posItemPrice.focus();
    }
  }

  // ================= 4. LINK CLIENT INVOICE HANDLERS (Oven & Cutter POS) =================
  function updateLinkClientSectionUI(partyType) {
    const DOM = getDOM();
    const state = getState();
    if (!DOM || !DOM.posLinkClientSection) return;

    if (partyType === 'cutter') {
      if (DOM.posLinkClientBoxTitle) {
        DOM.posLinkClientBoxTitle.innerHTML = '<i class="fa-solid fa-scissors" style="color: #a855f7;"></i> استيراد من فاتورة عميل (مقص):';
      }
      if (DOM.posLinkClientTypeBadge) {
        DOM.posLinkClientTypeBadge.textContent = 'زيادة مقص (+8 × +4)';
        DOM.posLinkClientTypeBadge.className = 'badge-status badge-cutter';
      }
      if (DOM.posLinkClientNotice) {
        DOM.posLinkClientNotice.textContent = 'اختر العميل وفاتورته لجلب الأرقام بزيادة +8 سم عرض و +4 سم طول للمقص';
      }
    } else {
      if (DOM.posLinkClientBoxTitle) {
        DOM.posLinkClientBoxTitle.innerHTML = '<i class="fa-solid fa-fire text-danger"></i> استيراد من فاتورة عميل (فرن):';
      }
      if (DOM.posLinkClientTypeBadge) {
        DOM.posLinkClientTypeBadge.textContent = 'أمر فرن (نفس الأبعاد)';
        DOM.posLinkClientTypeBadge.className = 'badge-status badge-oven';
      }
      if (DOM.posLinkClientNotice) {
        DOM.posLinkClientNotice.textContent = 'اختر العميل وفاتورته لجلب أبعاد البنود كما هي تماماً وبدون سعر';
      }
    }

    populateLinkCustomerDropdown();

    if (state && state.selectedLinkedClientInvoice) {
      applySelectedLinkedInvoice(state.selectedLinkedClientInvoice, partyType, false);
    }
  }

  function populateLinkCustomerDropdown() {
    const DOM = getDOM();
    if (!DOM || !DOM.posLinkCustomerSelect) return;
    const currentVal = DOM.posLinkCustomerSelect.value;
    DOM.posLinkCustomerSelect.innerHTML = '<option value="">-- اختر العميل لعرض فواتيره --</option>';

    const invoices = AppStore.getInvoices();
    const customerInvoices = invoices.filter(inv => inv.partyType === 'customer' || !inv.partyType);
    const customers = AppStore.getCustomers();

    customers.forEach(cust => {
      const custInvs = customerInvoices.filter(inv => inv.partyId === cust.id || inv.partyName === cust.name);
      const opt = document.createElement('option');
      opt.value = cust.id;
      opt.textContent = `${cust.name} (${custInvs.length > 0 ? `${custInvs.length} فاتورة مسجلة` : 'بدون فواتير'})`;
      DOM.posLinkCustomerSelect.appendChild(opt);
    });

    if (currentVal) {
      DOM.posLinkCustomerSelect.value = currentVal;
    }
  }

  function handleLinkCustomerChange() {
    const DOM = getDOM();
    const state = getState();
    const custId = DOM.posLinkCustomerSelect.value;
    if (!custId) {
      DOM.posLinkInvoiceSelect.innerHTML = '<option value="">-- اختر العميل أولاً --</option>';
      DOM.posLinkInvoiceSelect.disabled = true;
      if (DOM.posLinkInvoicePreview) DOM.posLinkInvoicePreview.style.display = 'none';
      state.selectedLinkedClientInvoice = null;
      state.selectedLinkedClientInvoiceNumber = null;
      return;
    }

    const invoices = AppStore.getInvoices();
    const cust = AppStore.getCustomers().find(c => c.id === custId);
    const clientInvoices = invoices.filter(inv => 
      (inv.partyType === 'customer' || !inv.partyType) && 
      (inv.partyId === custId || (cust && inv.partyName === cust.name))
    );

    if (clientInvoices.length === 0) {
      DOM.posLinkInvoiceSelect.innerHTML = '<option value="">-- لا توجد فواتير سابقة لهذا العميل --</option>';
      DOM.posLinkInvoiceSelect.disabled = true;
      if (DOM.posLinkInvoicePreview) DOM.posLinkInvoicePreview.style.display = 'none';
      state.selectedLinkedClientInvoice = null;
      state.selectedLinkedClientInvoiceNumber = null;
      return;
    }

    DOM.posLinkInvoiceSelect.innerHTML = '<option value="">-- اختر رقم الفاتورة --</option>';
    clientInvoices.forEach(inv => {
      const opt = document.createElement('option');
      opt.value = inv.invoiceNumber;
      const count = inv.items ? inv.items.length : 0;
      opt.textContent = `${inv.invoiceNumber} (بتاريخ ${inv.date || '-'} - عدد ${count} بند)`;
      DOM.posLinkInvoiceSelect.appendChild(opt);
    });

    DOM.posLinkInvoiceSelect.disabled = false;

    if (clientInvoices.length === 1) {
      DOM.posLinkInvoiceSelect.value = clientInvoices[0].invoiceNumber;
      handleLinkInvoiceChange();
    }
  }

  function handleLinkInvoiceChange() {
    const DOM = getDOM();
    const state = getState();
    const invNum = DOM.posLinkInvoiceSelect.value;
    if (!invNum) {
      if (DOM.posLinkInvoicePreview) DOM.posLinkInvoicePreview.style.display = 'none';
      state.selectedLinkedClientInvoice = null;
      state.selectedLinkedClientInvoiceNumber = null;
      return;
    }

    const invoices = AppStore.getInvoices();
    const targetInv = invoices.find(inv => inv.invoiceNumber === invNum);
    if (!targetInv) return;

    state.selectedLinkedClientItemIndex = 0;
    const partyType = getSelectedPartyType();
    applySelectedLinkedInvoice(targetInv, partyType, true);
  }

  function applySelectedLinkedInvoice(targetInv, partyType, showNotification = true) {
    const DOM = getDOM();
    const state = getState();
    if (!targetInv) return;
    state.selectedLinkedClientInvoice = targetInv;
    state.selectedLinkedClientInvoiceNumber = targetInv.invoiceNumber;

    if (DOM.posLinkInvoicePreview) {
      DOM.posLinkInvoicePreview.style.display = 'block';
    }

    if (DOM.posLinkRuleBanner) {
      if (partyType === 'cutter') {
        DOM.posLinkRuleBanner.className = 'link-formula-banner cutter mb-2';
        DOM.posLinkRuleBanner.innerHTML = '<i class="fa-solid fa-scissors" style="color: #c084fc; margin-top: 2px;"></i><div><b>مقاسات مقص:</b> تم زيادة <b>+8 سم عرض</b> و <b>+4 سم طول</b> وبدون سعر.</div>';
      } else {
        DOM.posLinkRuleBanner.className = 'link-formula-banner oven mb-2';
        DOM.posLinkRuleBanner.innerHTML = '<i class="fa-solid fa-fire text-danger" style="margin-top: 2px;"></i><div><b>مقاسات فرن:</b> تم جلب نفس الأبعاد كما هي بالظبط وبدون سعر.</div>';
      }
    }

    const items = targetInv.items || [];
    if (items.length > 0) {
      const activeIdx = (state.selectedLinkedClientItemIndex >= 0 && state.selectedLinkedClientItemIndex < items.length)
        ? state.selectedLinkedClientItemIndex
        : 0;

      loadClientItemToInputs(items[activeIdx], partyType);

      if (DOM.posLinkItemsChips) {
        DOM.posLinkItemsChips.innerHTML = '';
        items.forEach((item, idx) => {
          const w = (partyType === 'cutter') ? App.Utils.addDimensionOffset(item.width, 8) : (item.width || '-');
          const l = (partyType === 'cutter') ? App.Utils.addDimensionOffset(item.length, 4) : (item.length || '-');
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = `chip-btn item-link-chip ${idx === activeIdx ? 'active' : ''}`;
          chip.innerHTML = `<i class="fa-solid fa-cube text-accent"></i> بند ${idx + 1}: ${item.name} (${w} × ${l}) [${item.qty}]`;
          chip.addEventListener('click', () => {
            state.selectedLinkedClientItemIndex = idx;
            document.querySelectorAll('.item-link-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            loadClientItemToInputs(item, partyType);
            App.Utils.showToast(`تم تحميل أرقام البند [${item.name}] في حقول الإدخال`, 'info');
          });
          DOM.posLinkItemsChips.appendChild(chip);
        });
      }

      if (DOM.btnImportAllClientItemsText) {
        DOM.btnImportAllClientItemsText.textContent = `إدراج كافة البنود في الجدول (${items.length} بند)`;
      }
    }

    const typeLabel = (partyType === 'cutter') ? 'أمر تشغيل مقصات' : 'أمر تشغيل وصهر أفران';
    const offsetNote = (partyType === 'cutter') ? ' (تمت إضافة +8 سم في العرض و +4 سم في الطول مقاسات مقص)' : '';
    DOM.posInvoiceNotes.value = `${typeLabel} مرتبط بفاتورة العميل [${targetInv.invoiceNumber} - ${targetInv.partyName || ''}]${offsetNote}`;

    if (showNotification) {
      if (partyType === 'cutter') {
        App.Utils.showToast(`تم استيراد أرقام فاتورة العميل [${targetInv.invoiceNumber}] مع تطبيق زيادة +8 سم عرض و +4 سم طول للمقص بنجاح`, 'success');
      } else {
        App.Utils.showToast(`تم استيراد أرقام فاتورة العميل [${targetInv.invoiceNumber}] بنفس الأبعاد للفرن بنجاح`, 'success');
      }
    }
  }

  function loadClientItemToInputs(item, partyType) {
    const DOM = getDOM();
    if (!item || !DOM) return;

    DOM.posItemName.value = item.name || '';
    if (partyType === 'cutter') {
      DOM.posItemWidth.value = App.Utils.addDimensionOffset(item.width, 8);
      DOM.posItemLength.value = App.Utils.addDimensionOffset(item.length, 4);
    } else {
      DOM.posItemWidth.value = item.width || '';
      DOM.posItemLength.value = item.length || '';
    }

    DOM.posItemQty.value = item.qty || 1;
    DOM.posItemPrice.value = '0';
    if (DOM.posItemPrice) DOM.posItemPrice.disabled = true;
    if (DOM.posOperationalPriceNotice) DOM.posOperationalPriceNotice.style.display = 'block';

    if (DOM.posItemThickness) DOM.posItemThickness.value = item.thickness || '';
    if (DOM.posItemSupports) DOM.posItemSupports.value = item.supports || '';

    const itemColor = item.color || '';
    if (DOM.posItemColor) {
      DOM.posItemColor.value = itemColor;
    }
    updateColorChipActive(itemColor);

    [DOM.posItemName, DOM.posItemWidth, DOM.posItemLength, DOM.posItemThickness, DOM.posItemSupports, DOM.posItemQty].forEach(input => {
      if (input) {
        input.classList.remove('input-highlight-pulse');
        void input.offsetWidth;
        input.classList.add('input-highlight-pulse');
      }
    });
  }

  function updateColorChipActive(colorVal) {
    const DOM = getDOM();
    const val = (colorVal || '').trim();
    if (!DOM) return;
    if (DOM.posItemColorSelect) {
      const knownColors = ['', 'اسود', 'بيج', 'رصاصي', 'رمادي', 'برتقالي'];
      if (knownColors.includes(val)) {
        DOM.posItemColorSelect.value = val;
        syncCustomColorDropdown(val);
        if (DOM.posItemColor) {
          DOM.posItemColor.value = val;
          DOM.posItemColor.style.display = 'none';
        }
      } else {
        DOM.posItemColorSelect.value = 'custom';
        syncCustomColorDropdown('custom');
        if (DOM.posItemColor) {
          DOM.posItemColor.value = val;
          DOM.posItemColor.style.display = 'block';
        }
      }
    } else if (DOM.posItemColor) {
      DOM.posItemColor.value = val;
      DOM.posItemColor.style.display = val ? 'block' : 'none';
    }
  }

  function importAllClientItemsToCart() {
    const state = getState();
    if (!state.selectedLinkedClientInvoice) {
      App.Utils.showToast('الرجاء اختيار فاتورة عميل أولاً', 'danger');
      return;
    }
    const clientInv = state.selectedLinkedClientInvoice;
    if (!clientInv.items || clientInv.items.length === 0) {
      App.Utils.showToast('فاتورة العميل المختارة لا تحتوي على بنود!', 'danger');
      return;
    }
    const partyType = getSelectedPartyType();
    const mappedItems = clientInv.items.map(item => ({
      name: item.name,
      color: item.color || '',
      width: (partyType === 'cutter') ? App.Utils.addDimensionOffset(item.width, 8) : (item.width || '-'),
      length: (partyType === 'cutter') ? App.Utils.addDimensionOffset(item.length, 4) : (item.length || '-'),
      thickness: item.thickness || '',
      supports: item.supports || '',
      qty: parseInt(item.qty, 10) || 1,
      price: 0,
      total: 0
    }));

    if (state.posCart.length > 0) {
      if (confirm('الجدول يحتوي على بنود حالياً. هل تريد استبدالها ببنود فاتورة العميل؟\n(اضغط "موافق" للاستبدال، أو "إلغاء" للإضافة إلى البنود الحالية)')) {
        state.posCart = mappedItems;
      } else {
        state.posCart = state.posCart.concat(mappedItems);
      }
    } else {
      state.posCart = mappedItems;
    }

    renderCart();
    const msg = (partyType === 'cutter')
      ? `تم إدراج ${mappedItems.length} بند بنجاح مع زيادة +8 سم عرض و +4 سم طول للمقص`
      : `تم إدراج ${mappedItems.length} بند بنجاح بنفس الأبعاد للفرن`;
    App.Utils.showToast(msg, 'success');
  }

  // ================= 5. CART OPERATIONS =================
  function addItemToCart() {
    const DOM = getDOM();
    const state = getState();
    const partyType = getSelectedPartyType();
    const isOperational = (partyType === 'oven' || partyType === 'cutter');
    const name = DOM.posItemName.value.trim();
    const price = isOperational ? 0 : (parseFloat(DOM.posItemPrice.value) || 0);
    const width = DOM.posItemWidth.value.trim() || '-';
    const length = DOM.posItemLength.value.trim() || '-';
    const thickness = (DOM.posItemThickness && DOM.posItemThickness.value.trim()) || '';
    const supports = (DOM.posItemSupports && DOM.posItemSupports.value.trim()) || '';
    const qty = parseInt(DOM.posItemQty.value, 10) || 1;

    let color = '';
    if (DOM.posItemColorSelect) {
      if (DOM.posItemColorSelect.value === 'custom') {
        color = DOM.posItemColor ? DOM.posItemColor.value.trim() : '';
      } else {
        color = DOM.posItemColorSelect.value;
      }
    } else if (DOM.posItemColor) {
      color = DOM.posItemColor.value.trim();
    }

    const weightTon = (DOM.posItemWeightTon && partyType === 'supplier') ? (parseFloat(DOM.posItemWeightTon.value) || 0) : 0;

    if (!name) {
      App.Utils.showToast('الرجاء إدخال اسم الصنف أو اختياره من القائمة', 'danger');
      DOM.posItemName.focus();
      return;
    }
    if (!isOperational && price <= 0) {
      App.Utils.showToast('الرجاء تحديد سعر صحيح للصنف', 'danger');
      DOM.posItemPrice.focus();
      return;
    }
    if (qty <= 0) {
      App.Utils.showToast('الكمية يجب أن تكون 1 على الأقل', 'danger');
      DOM.posItemQty.focus();
      return;
    }

    const total = price * qty;

    state.posCart.push({
      name,
      color,
      width,
      length,
      thickness,
      supports,
      qty,
      price,
      total,
      weightTon: weightTon > 0 ? weightTon : undefined
    });

    DOM.posItemSelect.value = '';
    DOM.posItemName.value = '';
    DOM.posItemPrice.value = isOperational ? '0' : '';
    DOM.posItemWidth.value = '';
    DOM.posItemLength.value = '';
    if (DOM.posItemThickness) DOM.posItemThickness.value = '';
    if (DOM.posItemSupports) DOM.posItemSupports.value = '';
    DOM.posItemQty.value = 1;
    if (DOM.posItemColorSelect) DOM.posItemColorSelect.value = '';
    syncCustomColorDropdown('');
    if (DOM.posItemColor) {
      DOM.posItemColor.value = '';
      DOM.posItemColor.style.display = 'none';
    }

    renderCart();
    App.Utils.showToast('تمت إضافة البند إلى الفاتورة بنجاح');
  }

  function removeCartItem(index) {
    const state = getState();
    state.posCart.splice(index, 1);
    renderCart();
  }

  function renderCart() {
    const DOM = getDOM();
    const state = getState();
    if (!DOM || !DOM.posCartBody) return;

    DOM.posCartBody.innerHTML = '';
    const partyType = getSelectedPartyType();
    const isOperational = (partyType === 'oven' || partyType === 'cutter');
    const isSupplier = (partyType === 'supplier');

    if (DOM.thCartWeight) DOM.thCartWeight.style.display = isSupplier ? '' : 'none';
    if (DOM.thCartPrice) DOM.thCartPrice.style.display = isOperational ? 'none' : '';
    if (DOM.thCartTotal) DOM.thCartTotal.style.display = isOperational ? 'none' : '';

    let subtotal = 0;
    let totalWeightTon = 0;
    let totalPieces = 0;

    if (state.posCart.length === 0) {
      DOM.posEmptyCartNotice.style.display = 'flex';
      DOM.posCartTable.style.display = 'none';
    } else {
      DOM.posEmptyCartNotice.style.display = 'none';
      DOM.posCartTable.style.display = 'table';

      state.posCart.forEach((item, index) => {
        subtotal += (item.total || 0);
        totalWeightTon += (item.weightTon || 0);
        totalPieces += (item.qty || 0);

        let colorBadge = '<span class="text-muted">-</span>';
        if (item.color) {
          const c = String(item.color).trim();
          if (c === 'اسود') {
            colorBadge = '<span class="badge-color-black" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#0f172a; font-size:0.65em;"></i> اسود</span>';
          } else if (c === 'بيج') {
            colorBadge = '<span class="badge-color-beige" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#d8b88c; font-size:0.65em;"></i> بيج</span>';
          } else if (c === 'رصاصي') {
            colorBadge = '<span class="badge-color-lead" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#475569; font-size:0.65em;"></i> رصاصي</span>';
          } else if (c === 'رمادي') {
            colorBadge = '<span class="badge-color-gray" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#94a3b8; font-size:0.65em;"></i> رمادي</span>';
          } else if (c === 'برتقالي') {
            colorBadge = '<span class="badge-color-orange" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#ea580c; font-size:0.65em;"></i> برتقالي</span>';
          } else if (c === 'فضي') {
            colorBadge = '<span class="badge-color-silver" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#94a3b8; font-size:0.65em;"></i> فضي</span>';
          } else if (c === 'دهبي') {
            colorBadge = '<span class="badge-color-gold" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#f59e0b; font-size:0.65em;"></i> دهبي</span>';
          } else {
            colorBadge = `<span class="badge-color-custom" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-palette text-accent" style="font-size:0.7em;"></i> ${c}</span>`;
          }
        }

        const weightCol = isSupplier
          ? `<td>${item.weightTon ? `<span class="badge-status" style="color:#0284c7; border-color:rgba(2,132,199,0.3); font-weight:700;">${item.weightTon} طن</span>` : '<span class="text-muted">-</span>'}</td>`
          : '';

        const priceCol = isOperational ? '' : `<td>${App.Utils.formatMoney(item.price)}</td>`;
        const totalCol = isOperational ? '' : `<td><strong>${App.Utils.formatMoney(item.total)}</strong></td>`;

        const thicknessDisplay = item.thickness ? `<span class="badge-status" style="color: #0284c7; border-color: rgba(2,132,199,0.3); font-weight: 700;">${item.thickness}</span>` : '<span class="text-muted">-</span>';
        const supportsDisplay = item.supports ? `<span class="badge-status" style="color: #9333ea; border-color: rgba(147,51,234,0.3); font-weight: 700;">${item.supports}</span>` : '<span class="text-muted">-</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td><strong>${item.name}</strong></td>
          <td>${colorBadge}</td>
          <td>${item.width}</td>
          <td>${item.length}</td>
          <td style="text-align: center;">${thicknessDisplay}</td>
          <td style="text-align: center;">${supportsDisplay}</td>
          <td><span class="badge-status">${item.qty}</span></td>
          ${weightCol}
          ${priceCol}
          ${totalCol}
          <td class="text-center">
            <button class="btn-table-action delete" onclick="window.removeCartItem(${index})" title="حذف البند">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        `;
        DOM.posCartBody.appendChild(tr);
      });
    }

    window.removeCartItem = (idx) => removeCartItem(idx);

    if (isOperational) {
      if (DOM.posNormalSummaryDetails) DOM.posNormalSummaryDetails.style.display = 'none';
      if (DOM.posOperationalSummaryDetails) DOM.posOperationalSummaryDetails.style.display = 'flex';
      if (DOM.posOperationalItemsCount) DOM.posOperationalItemsCount.textContent = state.posCart.length;
      if (DOM.posOperationalPiecesCount) DOM.posOperationalPiecesCount.textContent = totalPieces;
      if (DOM.posSupplierTotalWeightItem) DOM.posSupplierTotalWeightItem.style.display = 'none';
    } else {
      if (DOM.posNormalSummaryDetails) DOM.posNormalSummaryDetails.style.display = 'grid';
      if (DOM.posOperationalSummaryDetails) DOM.posOperationalSummaryDetails.style.display = 'none';

      if (isSupplier && DOM.posSupplierTotalWeightItem) {
        DOM.posSupplierTotalWeightItem.style.display = 'flex';
        if (DOM.posTotalWeightDisplay) {
          DOM.posTotalWeightDisplay.textContent = totalWeightTon > 0 ? `${Math.round(totalWeightTon * 1000) / 1000} طن` : '0 طن';
        }
      } else if (DOM.posSupplierTotalWeightItem) {
        DOM.posSupplierTotalWeightItem.style.display = 'none';
      }

      const discount = parseFloat(DOM.posDiscountInput.value) || 0;
      const grandTotal = Math.max(0, subtotal - discount);

      DOM.posSubtotalDisplay.textContent = App.Utils.formatMoney(subtotal, true);
      DOM.posGrandTotalDisplay.textContent = App.Utils.formatMoney(grandTotal, true);
    }
  }

  function clearCart() {
    const state = getState();
    if (state.posCart.length === 0) return;
    if (confirm('هل أنت متأكد من تفريغ بنود الفاتورة الحالية؟')) {
      state.posCart = [];
      renderCart();
      App.Utils.showToast('تم تفريغ الفاتورة');
    }
  }

  // ================= 6. SAVE INVOICE =================
  function saveInvoice() {
    const DOM = getDOM();
    const state = getState();
    const partyType = getSelectedPartyType();
    const partyId = DOM.posPartySelect.value;
    const date = DOM.posInvoiceDate.value;
    const paymentMethod = DOM.posPaymentMethod.value;
    const notes = DOM.posInvoiceNotes.value.trim();
    const discount = parseFloat(DOM.posDiscountInput.value) || 0;
    const isOperational = (partyType === 'oven' || partyType === 'cutter');

    if (!partyId) {
      App.Utils.showToast('الرجاء اختيار العميل أو المورد أو الفرن أو المقص أولاً', 'danger');
      DOM.posPartySelect.focus();
      return;
    }

    if (state.posCart.length === 0) {
      App.Utils.showToast('الفاتورة فارغة! يرجى إضافة بند واحد على الأقل', 'danger');
      DOM.posItemName.focus();
      return;
    }

    let party = null;
    if (partyType === 'customer') party = AppStore.getCustomers().find(c => c.id === partyId);
    if (partyType === 'supplier') party = AppStore.getSuppliers().find(s => s.id === partyId);
    if (partyType === 'oven') party = AppStore.getOvens().find(o => o.id === partyId);
    if (partyType === 'cutter') party = AppStore.getCutters().find(c => c.id === partyId);

    if (!party) {
      App.Utils.showToast('الجهة المحددة غير موجودة بالنظام', 'danger');
      return;
    }

    const subtotal = isOperational ? 0 : state.posCart.reduce((sum, item) => sum + (item.total || 0), 0);
    const finalDiscount = isOperational ? 0 : discount;
    const grandTotal = isOperational ? 0 : Math.max(0, subtotal - finalDiscount);
    const totalWeightTon = state.posCart.reduce((sum, item) => sum + (item.weightTon || 0), 0);

    const isEditing = Boolean(state.editingInvoiceNumber);
    const invoices = AppStore.getInvoices();
    let clientInvoiceNumber = isEditing ? state.editingInvoiceNumber : '';

    let currentMaxNum = 1000;
    invoices.forEach(inv => {
      const match = inv.invoiceNumber && String(inv.invoiceNumber).match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > currentMaxNum) currentMaxNum = num;
      }
    });

    if (!isEditing) {
      clientInvoiceNumber = `INV-${++currentMaxNum}`;
    }

    let linkedOvenInvoiceNumber = null;
    let linkedCutterInvoiceNumber = null;
    const extraInvoicesToSave = [];

    // Automatic Linked Dispatch for Client Invoice
    if (partyType === 'customer' && !isEditing) {
      const dispatchToOven = DOM.chkDispatchOven && DOM.chkDispatchOven.checked;
      const dispatchToCutter = DOM.chkDispatchCutter && DOM.chkDispatchCutter.checked;

      if (dispatchToOven) {
        linkedOvenInvoiceNumber = `INV-${++currentMaxNum}`;
        const targetOvenId = DOM.dispatchOvenSelect ? DOM.dispatchOvenSelect.value : '';
        const ovens = AppStore.getOvens();
        const targetOven = ovens.find(o => o.id === targetOvenId) || ovens[0] || {
          id: 'OVN-GEN',
          name: 'فرن التشغيل العام',
          phone: '',
          address: ''
        };

        const ovenItems = state.posCart.map(item => ({
          name: item.name,
          color: item.color || '',
          width: item.width,
          length: item.length,
          thickness: item.thickness || '',
          supports: item.supports || '',
          qty: item.qty,
          price: 0,
          total: 0
        }));

        extraInvoicesToSave.push({
          id: linkedOvenInvoiceNumber,
          invoiceNumber: linkedOvenInvoiceNumber,
          partyType: 'oven',
          partyId: targetOven.id,
          partyName: targetOven.name,
          partyPhone: targetOven.phone || '',
          partyAddress: targetOven.address || targetOven.code || '',
          date: date || new Date().toISOString().split('T')[0],
          paymentMethod: 'تشغيل',
          color: '',
          notes: `أمر تشغيل وصهر أفران صادر آلياً مرتبط بفاتورة العميل [${clientInvoiceNumber} - ${party.name}]`,
          items: ovenItems,
          subtotal: 0,
          discount: 0,
          grandTotal: 0,
          linkedClientInvoiceNumber: clientInvoiceNumber,
          createdAt: new Date().toISOString()
        });
      }

      if (dispatchToCutter) {
        linkedCutterInvoiceNumber = `INV-${++currentMaxNum}`;
        const targetCutterId = DOM.dispatchCutterSelect ? DOM.dispatchCutterSelect.value : '';
        const cutters = AppStore.getCutters();
        const targetCutter = cutters.find(c => c.id === targetCutterId) || cutters[0] || {
          id: 'CUT-GEN',
          name: 'مقص التشغيل العام',
          phone: '',
          address: ''
        };

        const cutterItems = state.posCart.map(item => ({
          name: item.name,
          color: item.color || '',
          width: App.Utils.addDimensionOffset(item.width, 8),
          length: App.Utils.addDimensionOffset(item.length, 4),
          thickness: item.thickness || '',
          supports: item.supports || '',
          qty: item.qty,
          price: 0,
          total: 0
        }));

        extraInvoicesToSave.push({
          id: linkedCutterInvoiceNumber,
          invoiceNumber: linkedCutterInvoiceNumber,
          partyType: 'cutter',
          partyId: targetCutter.id,
          partyName: targetCutter.name,
          partyPhone: targetCutter.phone || '',
          partyAddress: targetCutter.address || targetCutter.code || '',
          date: date || new Date().toISOString().split('T')[0],
          paymentMethod: 'تشغيل',
          color: '',
          notes: `أمر تشغيل مقصات صادر آلياً مرتبط بفاتورة العميل [${clientInvoiceNumber} - ${party.name}] (تمت إضافة +8 سم في العرض و +4 سم في الطول مقاسات مقص)`,
          items: cutterItems,
          subtotal: 0,
          discount: 0,
          grandTotal: 0,
          linkedClientInvoiceNumber: clientInvoiceNumber,
          createdAt: new Date().toISOString()
        });
      }
    }

    const colors = Array.from(new Set((state.posCart || []).map(i => i.color).filter(Boolean)));
    const colorSummary = colors.join(' / ');

    const existingIndex = isEditing ? invoices.findIndex(inv => inv.invoiceNumber === clientInvoiceNumber) : -1;
    const existingInv = existingIndex >= 0 ? invoices[existingIndex] : null;

    const mainInvoice = {
      id: clientInvoiceNumber,
      invoiceNumber: clientInvoiceNumber,
      partyType: partyType,
      partyId: party.id,
      partyName: party.name,
      partyPhone: party.phone || '',
      partyAddress: party.address || party.code || '',
      date: date || (existingInv ? existingInv.date : new Date().toISOString().split('T')[0]),
      paymentMethod: paymentMethod,
      color: colorSummary || (existingInv ? existingInv.color : ''),
      notes: notes,
      items: JSON.parse(JSON.stringify(state.posCart)),
      subtotal: subtotal,
      discount: finalDiscount,
      grandTotal: grandTotal,
      totalWeightTon: (partyType === 'supplier') ? totalWeightTon : undefined,
      linkedOvenInvoiceNumber: (existingInv && existingInv.linkedOvenInvoiceNumber) ? existingInv.linkedOvenInvoiceNumber : (linkedOvenInvoiceNumber || undefined),
      linkedCutterInvoiceNumber: (existingInv && existingInv.linkedCutterInvoiceNumber) ? existingInv.linkedCutterInvoiceNumber : (linkedCutterInvoiceNumber || undefined),
      linkedClientInvoiceNumber: (partyType === 'oven' || partyType === 'cutter') ? (state.selectedLinkedClientInvoiceNumber || (existingInv ? existingInv.linkedClientInvoiceNumber : undefined)) : undefined,
      createdAt: existingInv ? existingInv.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if ((partyType === 'oven' || partyType === 'cutter') && state.selectedLinkedClientInvoiceNumber) {
      const clientInv = invoices.find(inv => inv.invoiceNumber === state.selectedLinkedClientInvoiceNumber);
      if (clientInv) {
        if (partyType === 'oven') clientInv.linkedOvenInvoiceNumber = clientInvoiceNumber;
        if (partyType === 'cutter') clientInv.linkedCutterInvoiceNumber = clientInvoiceNumber;
      }
    }

    if (existingIndex >= 0) {
      invoices[existingIndex] = mainInvoice;

      if (mainInvoice.partyType === 'customer') {
        if (mainInvoice.linkedOvenInvoiceNumber) {
          const ovenIndex = invoices.findIndex(i => 
            (i.invoiceNumber === mainInvoice.linkedOvenInvoiceNumber || i.id === mainInvoice.linkedOvenInvoiceNumber) &&
            i.partyType === 'oven'
          );
          if (ovenIndex >= 0) {
            const ovenInv = invoices[ovenIndex];
            ovenInv.items = (mainInvoice.items || []).map(item => ({
              name: item.name,
              color: item.color || '',
              width: item.width,
              length: item.length,
              thickness: item.thickness || '',
              supports: item.supports || '',
              qty: item.qty,
              price: 0,
              total: 0
            }));
            ovenInv.date = mainInvoice.date;
            ovenInv.notes = `أمر تشغيل وصهر أفران صادر آلياً مرتبط بفاتورة العميل [${mainInvoice.invoiceNumber} - ${mainInvoice.partyName}]`;
            ovenInv.updatedAt = new Date().toISOString();
            invoices[ovenIndex] = ovenInv;
          }
        }

        if (mainInvoice.linkedCutterInvoiceNumber) {
          const cutterIndex = invoices.findIndex(i => 
            (i.invoiceNumber === mainInvoice.linkedCutterInvoiceNumber || i.id === mainInvoice.linkedCutterInvoiceNumber) &&
            i.partyType === 'cutter'
          );
          if (cutterIndex >= 0) {
            const cutterInv = invoices[cutterIndex];
            cutterInv.items = (mainInvoice.items || []).map(item => ({
              name: item.name,
              color: item.color || '',
              width: App.Utils.addDimensionOffset(item.width, 8),
              length: App.Utils.addDimensionOffset(item.length, 4),
              thickness: item.thickness || '',
              supports: item.supports || '',
              qty: item.qty,
              price: 0,
              total: 0
            }));
            cutterInv.date = mainInvoice.date;
            cutterInv.notes = `أمر تشغيل مقصات صادر آلياً مرتبط بفاتورة العميل [${mainInvoice.invoiceNumber} - ${mainInvoice.partyName}] (تمت إضافة +8 سم في العرض و +4 سم في الطول مقاسات مقص)`;
            cutterInv.updatedAt = new Date().toISOString();
            invoices[cutterIndex] = cutterInv;
          }
        }
      }
    } else {
      extraInvoicesToSave.forEach(inv => invoices.unshift(inv));
      invoices.unshift(mainInvoice);
    }
    AppStore.saveInvoices(invoices);

    const wasEditing = isEditing;
    state.editingInvoiceNumber = null;
    resetInvoiceMeta();

    // Refresh invoices table and update sidebar badge count
    if (App.Invoices) {
      if (typeof App.Invoices.renderInvoicesTable === 'function') App.Invoices.renderInvoicesTable();
      else if (typeof App.Invoices.renderTable === 'function') App.Invoices.renderTable();
      if (typeof App.Invoices.updateInvoicesBadge === 'function') App.Invoices.updateInvoicesBadge();
      else if (typeof App.Invoices.updateBadge === 'function') App.Invoices.updateBadge();
    }
    const badgeEl = document.getElementById('invoicesBadgeCount');
    if (badgeEl) {
      badgeEl.textContent = AppStore.getInvoices().length;
    }

    let successMsg = wasEditing ? `تم تعديل وتحديث بيانات الفاتورة ${clientInvoiceNumber} بنجاح!` : `تم حفظ الفاتورة بنجاح برقم: ${clientInvoiceNumber}`;
    if (!wasEditing) {
      if ((partyType === 'oven' || partyType === 'cutter') && state.selectedLinkedClientInvoiceNumber) {
        successMsg += ` (مرتبطة بفاتورة العميل [${state.selectedLinkedClientInvoiceNumber}])`;
      } else if (linkedOvenInvoiceNumber && linkedCutterInvoiceNumber) {
        successMsg += ` (وتم إنشاء أمر الفرن ${linkedOvenInvoiceNumber} وأمر المقص ${linkedCutterInvoiceNumber})`;
      } else if (linkedOvenInvoiceNumber) {
        successMsg += ` (وتم إنشاء أمر الفرن ${linkedOvenInvoiceNumber})`;
      } else if (linkedCutterInvoiceNumber) {
        successMsg += ` (وتم إنشاء أمر المقص ${linkedCutterInvoiceNumber})`;
      }
    }

    App.Utils.showToast(successMsg, 'success');

    // Display invoice preview modal immediately
    if (typeof window.viewInvoiceModal === 'function') {
      window.viewInvoiceModal(mainInvoice);
    } else if (App.Print && typeof App.Print.viewInvoiceModal === 'function') {
      App.Print.viewInvoiceModal(mainInvoice);
    } else if (App.Print && typeof App.Print.viewModal === 'function') {
      App.Print.viewModal(mainInvoice);
    }
  }

  // ================= 7. EDIT INVOICE IN POS =================
  function startEditInvoice(invNum) {
    const DOM = getDOM();
    const state = getState();
    const inv = AppStore.getInvoices().find(i => i.invoiceNumber === invNum);
    if (!inv) {
      App.Utils.showToast(`لم يتم العثور على الفاتورة ${invNum}`, 'danger');
      return;
    }

    if (DOM.invoiceModal && DOM.invoiceModal.classList.contains('open')) {
      DOM.invoiceModal.classList.remove('open');
    }
    if (DOM.statementModal && DOM.statementModal.classList.contains('open')) {
      DOM.statementModal.classList.remove('open');
    }

    if (typeof App.switchTab === 'function') {
      App.switchTab('pos');
    }
    state.editingInvoiceNumber = inv.invoiceNumber;

    setPOSPartyType(inv.partyType || 'customer');

    if (DOM.posPartySelect) {
      DOM.posPartySelect.value = inv.partyId;
      handlePartySelectionChange();
    }

    if (DOM.posInvoiceDate) DOM.posInvoiceDate.value = inv.date || new Date().toISOString().split('T')[0];
    if (DOM.posPaymentMethod) DOM.posPaymentMethod.value = inv.paymentMethod || 'نقدي';
    if (DOM.posInvoiceNotes) DOM.posInvoiceNotes.value = inv.notes || '';
    if (DOM.posDiscountInput) DOM.posDiscountInput.value = inv.discount || 0;

    state.posCart = JSON.parse(JSON.stringify(inv.items || []));
    renderCart();

    if (DOM.currentInvoiceNumberTag) {
      DOM.currentInvoiceNumberTag.textContent = `#${inv.invoiceNumber} (تعديل)`;
      DOM.currentInvoiceNumberTag.style.background = '#f59e0b';
      DOM.currentInvoiceNumberTag.style.color = '#000';
    }

    if (DOM.posEditModeBanner) {
      DOM.posEditModeBanner.style.display = 'flex';
      if (DOM.posEditInvoiceNumberText) DOM.posEditInvoiceNumberText.textContent = inv.invoiceNumber;
    }

    if (DOM.btnCancelEditInvoice) {
      DOM.btnCancelEditInvoice.style.display = 'inline-flex';
    }

    if (DOM.btnSaveInvoice) {
      DOM.btnSaveInvoice.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ وتحديث الفاتورة';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    App.Utils.showToast(`تم فتح الفاتورة ${inv.invoiceNumber} في وضع التعديل`, 'info');
  }

  function cancelInvoiceEdit() {
    const state = getState();
    state.editingInvoiceNumber = null;
    resetInvoiceMeta();
    App.Utils.showToast('تم إلغاء التعديل والعودة لفاتورة جديدة', 'info');
  }

  window.editInvoice = (invNum) => startEditInvoice(invNum);
  window.cancelInvoiceEdit = () => cancelInvoiceEdit();

  App.POS = {
    init: initPOS,
    initPOS: initPOS,
    resetMeta: resetInvoiceMeta,
    resetInvoiceMeta: resetInvoiceMeta,
    syncCustomColor: syncCustomColorDropdown,
    syncCustomColorDropdown: syncCustomColorDropdown,
    setPartyType: setPOSPartyType,
    setPOSPartyType: setPOSPartyType,
    getPartyType: getSelectedPartyType,
    getSelectedPartyType: getSelectedPartyType,
    refreshDropdowns: refreshPOSDropdowns,
    refreshPOSDropdowns: refreshPOSDropdowns,
    handlePartyChange: handlePartySelectionChange,
    handlePartySelectionChange: handlePartySelectionChange,
    handleItemChange: handleItemSelectChange,
    handleItemSelectChange: handleItemSelectChange,
    handleCoreChip: handleCoreChipClick,
    handleCoreChipClick: handleCoreChipClick,
    handleLinkCustomerChange,
    handleLinkInvoiceChange,
    importAllClientItems: importAllClientItemsToCart,
    importAllClientItemsToCart: importAllClientItemsToCart,
    addItem: addItemToCart,
    addItemToCart: addItemToCart,
    removeCartItem,
    renderCart,
    clearCart,
    save: saveInvoice,
    saveInvoice: saveInvoice,
    editInvoice: startEditInvoice,
    startEditInvoice: startEditInvoice,
    cancelEdit: cancelInvoiceEdit,
    cancelInvoiceEdit: cancelInvoiceEdit
  };

})(window.App);
