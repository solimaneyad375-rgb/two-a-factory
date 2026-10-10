/**
 * TOW_A FACTORY SYSTEM - INVOICES & DISPATCH MODULE
 * Handles invoice archiving, filtering, dispatching to oven/cutter, and repairs.
 */

(function () {
  'use strict';

  window.App = window.App || {};
  const state = window.App.State = window.App.State || {};
  const DOM = window.App.DOM = window.App.DOM || {};

  // ================= INVOICE SANITIZATION & REPAIR =================
  function sanitizeAndRepairInvoices() {
    const invoices = AppStore.getInvoices();
    if (!Array.isArray(invoices) || invoices.length === 0) return;

    let modified = false;

    // 1. Calculate max integer currently in invoices
    let maxNum = 1000;
    invoices.forEach(inv => {
      const match = inv.invoiceNumber && String(inv.invoiceNumber).match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    // 2. Resolve collisions where an oven or cutter invoice shares invoiceNumber with a customer invoice
    const customerInvoices = invoices.filter(i => i.partyType === 'customer');

    customerInvoices.forEach(custInv => {
      // Check oven collision
      if (custInv.linkedOvenInvoiceNumber && custInv.linkedOvenInvoiceNumber === custInv.invoiceNumber) {
        const newOvenNum = `INV-${++maxNum}`;
        const ovenInv = invoices.find(i => 
          i.partyType === 'oven' && 
          (i.linkedClientInvoiceNumber === custInv.invoiceNumber || i.invoiceNumber === custInv.invoiceNumber)
        );
        if (ovenInv) {
          ovenInv.id = newOvenNum;
          ovenInv.invoiceNumber = newOvenNum;
          ovenInv.linkedClientInvoiceNumber = custInv.invoiceNumber;
        }
        custInv.linkedOvenInvoiceNumber = newOvenNum;
        modified = true;
      }

      // Check cutter collision
      if (custInv.linkedCutterInvoiceNumber && custInv.linkedCutterInvoiceNumber === custInv.invoiceNumber) {
        const newCutterNum = `INV-${++maxNum}`;
        const cutterInv = invoices.find(i => 
          i.partyType === 'cutter' && 
          (i.linkedClientInvoiceNumber === custInv.invoiceNumber || i.invoiceNumber === custInv.invoiceNumber)
        );
        if (cutterInv) {
          cutterInv.id = newCutterNum;
          cutterInv.invoiceNumber = newCutterNum;
          cutterInv.linkedClientInvoiceNumber = custInv.invoiceNumber;
        }
        custInv.linkedCutterInvoiceNumber = newCutterNum;
        modified = true;
      }
    });

    // 3. Resolve any general duplicate numbers across all invoices
    const seenNumbers = new Set();
    invoices.forEach(inv => {
      if (seenNumbers.has(inv.invoiceNumber)) {
        const newNum = `INV-${++maxNum}`;
        const oldNum = inv.invoiceNumber;
        inv.id = newNum;
        inv.invoiceNumber = newNum;
        modified = true;
        invoices.forEach(other => {
          if (other.linkedOvenInvoiceNumber === oldNum && inv.partyType === 'oven') {
            other.linkedOvenInvoiceNumber = newNum;
          }
          if (other.linkedCutterInvoiceNumber === oldNum && inv.partyType === 'cutter') {
            other.linkedCutterInvoiceNumber = newNum;
          }
        });
      } else if (inv.invoiceNumber) {
        seenNumbers.add(inv.invoiceNumber);
      }
    });

    if (modified) {
      AppStore.saveInvoices(invoices);
    }
  }

  // ================= MANUAL DISPATCH MODAL HANDLERS =================
  let dispatchCurrentClientInvoice = null;

  function setDispatchTargetType(targetType) {
    if (!DOM.dispatchTargetType) return;
    DOM.dispatchTargetType.value = targetType;

    const isOven = (targetType === 'oven');

    if (DOM.radioDispatchOven) DOM.radioDispatchOven.checked = isOven;
    if (DOM.radioDispatchCutter) DOM.radioDispatchCutter.checked = !isOven;

    if (DOM.dispatchCardOven) {
      if (isOven) {
        DOM.dispatchCardOven.style.border = '2px solid #ef4444';
        DOM.dispatchCardOven.style.background = 'rgba(239, 68, 68, 0.12)';
      } else {
        DOM.dispatchCardOven.style.border = '2px solid var(--border-color)';
        DOM.dispatchCardOven.style.background = 'rgba(255, 255, 255, 0.02)';
      }
    }

    if (DOM.dispatchCardCutter) {
      if (!isOven) {
        DOM.dispatchCardCutter.style.border = '2px solid #c084fc';
        DOM.dispatchCardCutter.style.background = 'rgba(168, 85, 247, 0.12)';
      } else {
        DOM.dispatchCardCutter.style.border = '2px solid var(--border-color)';
        DOM.dispatchCardCutter.style.background = 'rgba(255, 255, 255, 0.02)';
      }
    }

    if (!DOM.dispatchSelectEntity) return;
    DOM.dispatchSelectEntity.innerHTML = '';

    if (isOven) {
      if (DOM.dispatchSelectLabel) DOM.dispatchSelectLabel.innerHTML = 'اختر فرن التشغيل <span class="required">*</span>';
      let ovenAlert = '<i class="fa-solid fa-circle-info"></i> سيتم نقل مقاسات وبنود الفاتورة بالكامل (الطول والعرض) <b>كما هي دون تغيير</b> وبسعر 0 (تشغيل).';
      if (dispatchCurrentClientInvoice && dispatchCurrentClientInvoice.linkedOvenInvoiceNumber) {
        ovenAlert += `<div style="margin-top:6px; color:#f87171; font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> تنبيه: سبق إصدار أمر فرن لهذه الفاتورة (${dispatchCurrentClientInvoice.linkedOvenInvoiceNumber})</div>`;
      }
      if (DOM.dispatchInfoAlert) DOM.dispatchInfoAlert.innerHTML = ovenAlert;

      const ovens = AppStore.getOvens();
      DOM.dispatchSelectEntity.innerHTML = '<option value="">-- اختر فرن التشغيل --</option>';
      ovens.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = `${o.name} (${o.code || o.id})`;
        DOM.dispatchSelectEntity.appendChild(opt);
      });
      if (ovens.length === 0) {
        DOM.dispatchSelectEntity.innerHTML = '<option value="">لا توجد أفران مسجلة في النظام</option>';
      }
    } else {
      if (DOM.dispatchSelectLabel) DOM.dispatchSelectLabel.innerHTML = 'اختر مقص التشغيل <span class="required">*</span>';
      let cutterAlert = '<i class="fa-solid fa-calculator"></i> سيتم تطبيق معادلة المقص آلياً: <b>زيادة +8 سم في العرض</b> و <b>زيادة +4 سم في الطول</b> على كافة البنود وبسعر 0 (تشغيل).';
      if (dispatchCurrentClientInvoice && dispatchCurrentClientInvoice.linkedCutterInvoiceNumber) {
        cutterAlert += `<div style="margin-top:6px; color:#c084fc; font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> تنبيه: سبق إصدار أمر مقص لهذه الفاتورة (${dispatchCurrentClientInvoice.linkedCutterInvoiceNumber})</div>`;
      }
      if (DOM.dispatchInfoAlert) DOM.dispatchInfoAlert.innerHTML = cutterAlert;

      const cutters = AppStore.getCutters();
      DOM.dispatchSelectEntity.innerHTML = '<option value="">-- اختر مقص التشغيل --</option>';
      cutters.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.code || c.id})`;
        DOM.dispatchSelectEntity.appendChild(opt);
      });
      if (cutters.length === 0) {
        DOM.dispatchSelectEntity.innerHTML = '<option value="">لا توجد مقصات مسجلة في النظام</option>';
      }
    }
  }

  function openDispatchModal(targetType, clientInvoice) {
    if (!clientInvoice) return;
    dispatchCurrentClientInvoice = clientInvoice;

    if (DOM.dispatchSourceInvoiceNum) DOM.dispatchSourceInvoiceNum.value = clientInvoice.invoiceNumber;
    if (DOM.dispatchSourceInvoiceBadge) DOM.dispatchSourceInvoiceBadge.textContent = clientInvoice.invoiceNumber;
    if (DOM.dispatchSourceCustomerBadge) DOM.dispatchSourceCustomerBadge.textContent = clientInvoice.partyName || 'عميل';
    if (DOM.dispatchNotes) DOM.dispatchNotes.value = '';

    setDispatchTargetType(targetType || 'oven');

    if (DOM.dispatchModal) DOM.dispatchModal.classList.add('open');
  }

  function handleDispatchFormSubmit(e) {
    e.preventDefault();
    if (!dispatchCurrentClientInvoice) return;

    const targetType = (DOM.dispatchTargetType && DOM.dispatchTargetType.value) || 
      (document.getElementById('radioDispatchCutter')?.checked ? 'cutter' : 'oven');
    const targetEntityId = DOM.dispatchSelectEntity ? DOM.dispatchSelectEntity.value : '';
    const extraNotes = DOM.dispatchNotes ? DOM.dispatchNotes.value.trim() : '';

    if (!targetEntityId) {
      showToast('الرجاء اختيار جهة التشغيل المستهدفة أولاً', 'danger');
      if (DOM.dispatchSelectEntity) DOM.dispatchSelectEntity.focus();
      return;
    }

    const invoices = AppStore.getInvoices();
    let currentMaxNum = 1000;
    invoices.forEach(inv => {
      const match = inv.invoiceNumber && String(inv.invoiceNumber).match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > currentMaxNum) currentMaxNum = num;
      }
    });

    const newInvoiceNumber = `INV-${currentMaxNum + 1}`;
    let newInvoice = null;

    if (targetType === 'oven') {
      const ovens = AppStore.getOvens();
      const targetOven = ovens.find(o => o.id === targetEntityId) || ovens[0];
      const ovenItems = (dispatchCurrentClientInvoice.items || []).map(item => ({
        name: item.name,
        color: item.color || '',
        width: item.width,   // As-is
        length: item.length, // As-is
        thickness: item.thickness || '',
        supports: item.supports || '',
        qty: item.qty,
        price: 0,
        total: 0
      }));

      newInvoice = {
        id: newInvoiceNumber,
        invoiceNumber: newInvoiceNumber,
        partyType: 'oven',
        partyId: targetOven ? targetOven.id : '',
        partyName: targetOven ? targetOven.name : '',
        partyPhone: targetOven ? targetOven.phone || '' : '',
        partyAddress: targetOven ? targetOven.address || targetOven.code || '' : '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'تشغيل',
        color: '',
        notes: `أمر تشغيل وصهر أفران مرتبط بفاتورة العميل [${dispatchCurrentClientInvoice.invoiceNumber} - ${dispatchCurrentClientInvoice.partyName}]${extraNotes ? ' - ' + extraNotes : ''}`,
        items: ovenItems,
        subtotal: 0,
        discount: 0,
        grandTotal: 0,
        linkedClientInvoiceNumber: dispatchCurrentClientInvoice.invoiceNumber,
        createdAt: new Date().toISOString()
      };

      // Link back in client invoice
      dispatchCurrentClientInvoice.linkedOvenInvoiceNumber = newInvoiceNumber;
    } else if (targetType === 'cutter') {
      const cutters = AppStore.getCutters();
      const targetCutter = cutters.find(c => c.id === targetEntityId) || cutters[0];
      const cutterItems = (dispatchCurrentClientInvoice.items || []).map(item => ({
        name: item.name,
        color: item.color || '',
        width: addDimensionOffset(item.width, 8),   // +8 cm
        length: addDimensionOffset(item.length, 4), // +4 cm
        thickness: item.thickness || '',
        supports: item.supports || '',
        qty: item.qty,
        price: 0,
        total: 0
      }));

      newInvoice = {
        id: newInvoiceNumber,
        invoiceNumber: newInvoiceNumber,
        partyType: 'cutter',
        partyId: targetCutter ? targetCutter.id : '',
        partyName: targetCutter ? targetCutter.name : '',
        partyPhone: targetCutter ? targetCutter.phone || '' : '',
        partyAddress: targetCutter ? targetCutter.address || targetCutter.code || '' : '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'تشغيل',
        color: '',
        notes: `أمر تشغيل مقصات مرتبط بفاتورة العميل [${dispatchCurrentClientInvoice.invoiceNumber} - ${dispatchCurrentClientInvoice.partyName}] (تمت إضافة +8 سم في العرض و +4 سم في الطول مقاسات مقص)${extraNotes ? ' - ' + extraNotes : ''}`,
        items: cutterItems,
        subtotal: 0,
        discount: 0,
        grandTotal: 0,
        linkedClientInvoiceNumber: dispatchCurrentClientInvoice.invoiceNumber,
        createdAt: new Date().toISOString()
      };

      // Link back in client invoice
      dispatchCurrentClientInvoice.linkedCutterInvoiceNumber = newInvoiceNumber;
    }

    if (newInvoice) {
      // Update invoices store
      const updatedInvoices = invoices.map(inv => {
        if (inv.invoiceNumber === dispatchCurrentClientInvoice.invoiceNumber) {
          return {
            ...inv,
            linkedOvenInvoiceNumber: dispatchCurrentClientInvoice.linkedOvenInvoiceNumber,
            linkedCutterInvoiceNumber: dispatchCurrentClientInvoice.linkedCutterInvoiceNumber
          };
        }
        return inv;
      });
      updatedInvoices.unshift(newInvoice);
      AppStore.saveInvoices(updatedInvoices);

      if (DOM.dispatchModal) DOM.dispatchModal.classList.remove('open');
      renderInvoicesTable();
      updateInvoicesBadge();

      showToast(`تم إنشاء أمر التشغيل بنجاح برقم: ${newInvoiceNumber}`, 'success');
      if (window.viewInvoiceModal) window.viewInvoiceModal(newInvoice);
    }
  }

  // ================= INVOICES ARCHIVE =================
  function renderInvoicesTable() {
    const invoices = AppStore.getInvoices();
    const query = DOM.searchInvoicesInput ? (DOM.searchInvoicesInput.value || '').trim().toLowerCase() : '';
    const activeFilterBtn = DOM.invoicesTypeFilter ? DOM.invoicesTypeFilter.querySelector('.pill.active') : null;
    const typeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';

    if (!DOM.invoicesTableBody) return;
    DOM.invoicesTableBody.innerHTML = '';

    // Calculate Overview Stats
    let totalSales = 0;
    let totalPurchases = 0;
    let totalOvensCount = 0;
    let totalCuttersCount = 0;

    invoices.forEach(inv => {
      if (inv.partyType === 'customer') totalSales += (inv.grandTotal || 0);
      else if (inv.partyType === 'supplier') totalPurchases += (inv.grandTotal || 0);
      else if (inv.partyType === 'oven') totalOvensCount++;
      else if (inv.partyType === 'cutter') totalCuttersCount++;
    });

    if (DOM.statTotalInvoicesCount) DOM.statTotalInvoicesCount.textContent = invoices.length;
    if (DOM.statTotalSalesAmount) DOM.statTotalSalesAmount.textContent = formatMoney(totalSales, true);
    if (DOM.statTotalPurchasesAmount) DOM.statTotalPurchasesAmount.textContent = formatMoney(totalPurchases, true);
    if (DOM.statTotalOvensCount) DOM.statTotalOvensCount.textContent = totalOvensCount;
    if (DOM.statTotalCuttersCount) DOM.statTotalCuttersCount.textContent = totalCuttersCount;

    // Filter table rows
    const filtered = invoices.filter(inv => {
      const matchType = typeFilter === 'all' || inv.partyType === typeFilter;
      const matchQuery = !query || 
        inv.invoiceNumber.toLowerCase().includes(query) ||
        (inv.partyName && inv.partyName.toLowerCase().includes(query)) ||
        (inv.date && inv.date.includes(query));
      return matchType && matchQuery;
    });

    // Update Category Summary Banner
    let categoryName = 'جميع الفواتير';
    let categoryTotalSum = 0;

    if (typeFilter === 'customer') {
      categoryName = 'فواتير العملاء (المبيعات)';
      categoryTotalSum = filtered.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
    } else if (typeFilter === 'supplier') {
      categoryName = 'فواتير الموردين (المشتريات)';
      categoryTotalSum = filtered.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
    } else if (typeFilter === 'oven') {
      categoryName = 'فواتير الأفران (التشغيل)';
      categoryTotalSum = filtered.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
    } else if (typeFilter === 'cutter') {
      categoryName = 'فواتير المقصات والتشغيل';
      categoryTotalSum = filtered.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
    } else {
      categoryName = 'جميع الفواتير المسجلة';
      categoryTotalSum = filtered.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
    }

    if (DOM.activeInvoicesFilterName) DOM.activeInvoicesFilterName.textContent = categoryName;
    if (DOM.activeInvoicesCount) DOM.activeInvoicesCount.textContent = filtered.length;
    if (DOM.activeInvoicesSum) DOM.activeInvoicesSum.textContent = formatMoney(categoryTotalSum, true);

    if (filtered.length === 0) {
      DOM.invoicesTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted p-4">لا توجد فواتير مطابقة للبحث في هذا القسم</td></tr>`;
      return;
    }

    filtered.forEach(inv => {
      let typeBadge = '<span class="badge-status" style="color: #60a5fa; border-color: rgba(96,165,250,0.3);">عميل</span>';
      if (inv.partyType === 'supplier') typeBadge = '<span class="badge-status" style="color: #fbbf24; border-color: rgba(251,191,36,0.3);">مورد</span>';
      if (inv.partyType === 'oven') typeBadge = '<span class="badge-status" style="color: #f87171; border-color: rgba(248,113,113,0.3);"><i class="fa-solid fa-fire-burner"></i> فرن</span>';
      if (inv.partyType === 'cutter') typeBadge = '<span class="badge-status" style="color: #a855f7; border-color: rgba(168,85,247,0.3);"><i class="fa-solid fa-scissors"></i> مقص</span>';

      function renderItemColorBadge(c) {
        if (!c) return '';
        if (c === 'اسود') return '<span class="badge-status" style="color: #cbd5e1; border-color: rgba(100,116,139,0.5); font-size: 0.76rem;"><i class="fa-solid fa-circle" style="color:#0f172a; font-size: 0.65em;"></i> اسود</span>';
        if (c === 'بيج') return '<span class="badge-status" style="color: #92400e; border-color: rgba(217,119,6,0.3); background: rgba(254,243,199,0.1); font-size: 0.76rem;"><i class="fa-solid fa-circle" style="color:#d8b88c; font-size: 0.65em;"></i> بيج</span>';
        if (c === 'رصاصي') return '<span class="badge-status" style="color: #cbd5e1; border-color: rgba(71,85,105,0.5); font-size: 0.76rem;"><i class="fa-solid fa-circle" style="color:#475569; font-size: 0.65em;"></i> رصاصي</span>';
        if (c === 'رمادي') return '<span class="badge-status" style="color: #94a3b8; border-color: rgba(148,163,184,0.4); font-size: 0.76rem;"><i class="fa-solid fa-circle" style="color:#94a3b8; font-size: 0.65em;"></i> رمادي</span>';
        if (c === 'برتقالي') return '<span class="badge-status" style="color: #f97316; border-color: rgba(249,115,22,0.4); font-size: 0.76rem;"><i class="fa-solid fa-circle" style="color:#ea580c; font-size: 0.65em;"></i> برتقالي</span>';
        if (c === 'فضي') return '<span class="badge-status" style="color: #94a3b8; border-color: rgba(148,163,184,0.4); font-size: 0.76rem;"><i class="fa-solid fa-circle" style="color:#cbd5e1; font-size: 0.65em;"></i> فضي</span>';
        if (c === 'دهبي') return '<span class="badge-status" style="color: #fbbf24; border-color: rgba(251,191,36,0.4); font-size: 0.76rem;"><i class="fa-solid fa-circle" style="color:#f59e0b; font-size: 0.65em;"></i> دهبي</span>';
        return `<span class="badge-status" style="color: #38bdf8; border-color: rgba(56,189,248,0.4); font-size: 0.76rem;"><i class="fa-solid fa-palette" style="font-size: 0.7em;"></i> ${c}</span>`;
      }

      const itemColors = Array.from(new Set((inv.items || []).map(it => it.color).filter(Boolean)));
      let colorBadge = '<span class="text-muted">-</span>';
      if (itemColors.length > 0) {
        colorBadge = itemColors.map(c => renderItemColorBadge(c)).join(' ');
      } else if (inv.color) {
        colorBadge = renderItemColorBadge(inv.color);
      }

      const isOperational = (inv.partyType === 'oven' || inv.partyType === 'cutter');
      const totalColContent = isOperational
        ? '<span class="badge-status" style="color:#a855f7; border-color:rgba(168,85,247,0.3); font-size:0.75rem;">بدون سعر (تشغيل)</span>'
        : `<strong>${formatMoney(inv.grandTotal)}</strong>`;

      let dispatchBtnHtml = '';
      if (inv.partyType === 'customer') {
        dispatchBtnHtml = `
          <button class="btn-table-action" style="color: #06b6d4; border-color: rgba(6,182,212,0.3);" onclick="window.openDispatchModalForInvoice('${inv.invoiceNumber}')" title="إصدار أمر تشغيل">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        `;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="text-accent">${inv.invoiceNumber}</strong></td>
        <td>${typeBadge}</td>
        <td><strong>${inv.partyName}</strong></td>
        <td>${inv.partyPhone || '-'}</td>
        <td>${inv.date}</td>
        <td>${inv.paymentMethod}</td>
        <td>${colorBadge}</td>
        <td>${totalColContent}</td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="btn-table-action view" onclick="window.viewInvoiceDetail('${inv.invoiceNumber}')" title="عرض وطباعة الفاتورة">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn-table-action edit" onclick="window.editInvoice('${inv.invoiceNumber}')" title="تعديل بيانات وبنود الفاتورة" style="color: #f59e0b; border-color: rgba(245,158,11,0.3);">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            ${dispatchBtnHtml}
            <button class="btn-table-action whatsapp" onclick="window.sendInvoiceWhatsAppDirect('${inv.invoiceNumber}')" title="إرسال عبر واتساب">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
            <button class="btn-table-action delete" onclick="window.deleteInvoice('${inv.invoiceNumber}')" title="حذف الفاتورة">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      DOM.invoicesTableBody.appendChild(tr);
    });
  }

  function updateInvoicesBadge() {
    const count = AppStore.getInvoices().length;
    const badgeEl = (DOM && DOM.invoicesBadgeCount) || document.getElementById('invoicesBadgeCount');
    if (badgeEl) {
      badgeEl.textContent = count;
    }
  }

  // Global window bindings for table action buttons and dispatch
  window.openDispatchModalForInvoice = (invNum) => {
    const inv = AppStore.getInvoices().find(i => i.invoiceNumber === invNum);
    if (!inv) return;
    openDispatchModal('oven', inv);
  };

  window.viewInvoiceDetail = (invNum, partyTypeHint) => {
    const allInvoices = AppStore.getInvoices();
    let targetInv = null;
    const currentInv = (window.App && window.App.State && window.App.State.currentInvoice) || state.currentInvoice;
    if (partyTypeHint) {
      targetInv = allInvoices.find(i => (i.invoiceNumber === invNum || i.id === invNum) && i.partyType === partyTypeHint);
    }
    if (!targetInv && currentInv && currentInv.invoiceNumber === invNum) {
      targetInv = allInvoices.find(i => (i.invoiceNumber === invNum || i.id === invNum) && i !== currentInv);
    }
    if (!targetInv) {
      targetInv = allInvoices.find(i => i.invoiceNumber === invNum || i.id === invNum);
    }
    if (targetInv) {
      state.currentInvoice = targetInv;
      if (window.App && window.App.State) {
        window.App.State.currentInvoice = targetInv;
      }
      if (window.viewInvoiceModal) window.viewInvoiceModal(targetInv);
      else if (window.App && window.App.Print && window.App.Print.viewInvoiceModal) window.App.Print.viewInvoiceModal(targetInv);
      if (DOM.invoiceModal) DOM.invoiceModal.scrollTop = 0;
    } else {
      showToast(`لم يتم العثور على الفاتورة رقم ${invNum}`, 'danger');
    }
  };

  window.editInvoice = (invNum) => {
    if (window.App && window.App.POS && typeof window.App.POS.startEditInvoice === 'function') {
      window.App.POS.startEditInvoice(invNum);
    } else if (window.App && window.App.POS && typeof window.App.POS.editInvoice === 'function') {
      window.App.POS.editInvoice(invNum);
    }
  };

  window.cancelInvoiceEdit = () => {
    if (window.App && window.App.POS && typeof window.App.POS.cancelInvoiceEdit === 'function') {
      window.App.POS.cancelInvoiceEdit();
    } else if (window.App && window.App.POS && typeof window.App.POS.cancelEdit === 'function') {
      window.App.POS.cancelEdit();
    }
  };

  window.sendInvoiceWhatsAppDirect = (invNum) => {
    const targetInv = AppStore.getInvoices().find(i => i.invoiceNumber === invNum);
    if (targetInv) {
      if (window.shareInvoiceWhatsApp) window.shareInvoiceWhatsApp(targetInv);
    }
  };

  window.deleteInvoice = (invNum) => {
    if (confirm(`هل أنت متأكد من حذف الفاتورة رقم ${invNum} نهائياً؟`)) {
      const remaining = AppStore.getInvoices().filter(i => i.invoiceNumber !== invNum);
      AppStore.saveInvoices(remaining);
      if (state.editingInvoiceNumber === invNum) {
        window.cancelInvoiceEdit();
      }
      renderInvoicesTable();
      updateInvoicesBadge();
      showToast('تم حذف الفاتورة بنجاح');
    }
  };

  // Export to App.Invoices namespace
  window.App.Invoices = {
    sanitizeAndRepairInvoices,
    setDispatchTargetType,
    openDispatchModal,
    handleDispatchFormSubmit,
    renderInvoicesTable,
    renderTable: renderInvoicesTable,
    updateInvoicesBadge,
    updateBadge: updateInvoicesBadge
  };

  window.updateInvoicesBadge = updateInvoicesBadge;
  window.renderInvoicesTable = renderInvoicesTable;

})();
