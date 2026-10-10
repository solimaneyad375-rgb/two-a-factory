/**
 * TOW_A FACTORY SYSTEM - PRINT & EXPORT MODULE
 * Handles invoice printing, canvas rendering, WhatsApp sharing, general reports, and account statements.
 */

(function () {
  'use strict';

  window.App = window.App || {};
  const state = window.App.State = window.App.State || {};
  const DOM = window.App.DOM = window.App.DOM || {};

  let returnToStatementAfterInvoice = false;

  // ================= INVOICE VIEW & PRINT =================

  /**
   * Populates all data fields of printable invoice sheet
   */
  function populateInvoiceSheet(invoice) {
    if (!invoice) return;
    state.currentInvoice = invoice;
    if (window.App && window.App.State) {
      window.App.State.currentInvoice = invoice;
    }
    const settings = AppStore.getSettings();

    // Populate Sheet Header
    if (DOM.invSheetFactoryName) DOM.invSheetFactoryName.textContent = settings.factoryName || 'مصنع (tow_a)';
    if (DOM.invSheetSub) DOM.invSheetSub.textContent = settings.subTitle || 'لتصنيع الارفف والاستندات بتقنية الفايبر ليزر';
    
    const phone1 = settings.phone || '01007585897';
    const phone2 = settings.phone2 || '01102620836';
    if (DOM.invSheetFactoryPhone) DOM.invSheetFactoryPhone.textContent = phone1;
    if (DOM.invSheetFactoryPhone2) {
      if (phone2 && phone2 !== phone1) {
        DOM.invSheetFactoryPhone2.textContent = phone2;
        DOM.invSheetFactoryPhone2.style.display = 'inline';
        if (DOM.invSheetPhoneSeparator) DOM.invSheetPhoneSeparator.style.display = 'inline';
      } else {
        DOM.invSheetFactoryPhone2.style.display = 'none';
        if (DOM.invSheetPhoneSeparator) DOM.invSheetPhoneSeparator.style.display = 'none';
      }
    }
    if (DOM.invSheetFactoryAddress) DOM.invSheetFactoryAddress.textContent = settings.address || 'عزبة عبدالله باشا الجديدة طريق النخل';
    if (DOM.invSheetLogoImg) {
      DOM.invSheetLogoImg.src = (typeof DEFAULT_LOGO_BASE64 !== 'undefined') ? DEFAULT_LOGO_BASE64 : (settings.logoUrl || 'assets/logo.jpg');
    }

    // Invoice Meta
    if (DOM.invSheetInvoiceNumber) DOM.invSheetInvoiceNumber.textContent = invoice.invoiceNumber;
    if (DOM.invSheetInvoiceDate) DOM.invSheetInvoiceDate.textContent = invoice.date;
    if (DOM.invSheetPaymentMethod) DOM.invSheetPaymentMethod.textContent = invoice.paymentMethod;

    if (DOM.invSheetColorMetaItem) {
      DOM.invSheetColorMetaItem.style.display = 'none';
    }

    let typeText = 'فاتورة مبيعات عميل';
    let entityTitle = 'فاتورة صادرة إلى السيد / السادة (العميل):';
    if (invoice.partyType === 'supplier') {
      typeText = 'فاتورة مشتريات مورد';
      entityTitle = 'فاتورة واردة من السادة (المورد):';
    } else if (invoice.partyType === 'oven') {
      typeText = 'أمر تشغيل وصهر أفران';
      entityTitle = 'أمر تشغيل صادر إلى (فرن التشغيل):';
    } else if (invoice.partyType === 'cutter') {
      typeText = 'أمر تشغيل وقص مقصات';
      entityTitle = 'أمر تشغيل صادر إلى (مقص التشغيل):';
    }

    if (DOM.invSheetInvoiceType) DOM.invSheetInvoiceType.textContent = typeText;
    if (DOM.invSheetEntityTitle) DOM.invSheetEntityTitle.textContent = entityTitle;
    if (DOM.invSheetPartyName) DOM.invSheetPartyName.textContent = invoice.partyName;
    if (DOM.invSheetPartyPhone) DOM.invSheetPartyPhone.textContent = invoice.partyPhone || 'غير مسجل';
    if (DOM.invSheetPartyAddress) DOM.invSheetPartyAddress.textContent = invoice.partyAddress || '-';

    // Linked Invoices Banner
    if (DOM.invSheetLinkedBanner && DOM.invSheetLinkedContent) {
      let linkedBadges = '';
      if (invoice.partyType === 'customer') {
        if (invoice.linkedOvenInvoiceNumber) {
          linkedBadges += `<span class="linked-inv-badge badge-oven" onclick="window.viewInvoiceDetail('${invoice.linkedOvenInvoiceNumber}', 'oven')" title="عرض أمر الفرن"><i class="fa-solid fa-fire-burner"></i> أمر الفرن: ${invoice.linkedOvenInvoiceNumber}</span>`;
        }
        if (invoice.linkedCutterInvoiceNumber) {
          linkedBadges += `<span class="linked-inv-badge badge-cutter" onclick="window.viewInvoiceDetail('${invoice.linkedCutterInvoiceNumber}', 'cutter')" title="عرض أمر المقص"><i class="fa-solid fa-scissors"></i> أمر المقص: ${invoice.linkedCutterInvoiceNumber}</span>`;
        }
      } else if (invoice.linkedClientInvoiceNumber) {
        linkedBadges += `<span class="linked-inv-badge badge-client" onclick="window.viewInvoiceDetail('${invoice.linkedClientInvoiceNumber}', 'customer')" title="عرض فاتورة العميل الأصلية"><i class="fa-solid fa-user-check"></i> مرتبط بفاتورة العميل: ${invoice.linkedClientInvoiceNumber}</span>`;
      }

      if (linkedBadges) {
        DOM.invSheetLinkedContent.innerHTML = linkedBadges;
        DOM.invSheetLinkedBanner.style.display = 'block';
      } else {
        DOM.invSheetLinkedBanner.style.display = 'none';
      }
    }

    // Modal Dispatch Action Buttons (Customer invoices can be sent to Oven & Cutter)
    if (DOM.btnModalDispatchOven) {
      if (invoice.partyType === 'customer') {
        DOM.btnModalDispatchOven.style.display = 'inline-flex';
        DOM.btnModalDispatchOven.innerHTML = invoice.linkedOvenInvoiceNumber 
          ? `<i class="fa-solid fa-fire-burner"></i> أمر الفرن (${invoice.linkedOvenInvoiceNumber})` 
          : `<i class="fa-solid fa-paper-plane"></i> إرسال إلى الفرن`;
        DOM.btnModalDispatchOven.title = invoice.linkedOvenInvoiceNumber 
          ? `عرض أمر تشغيل الفرن (${invoice.linkedOvenInvoiceNumber})`
          : `إرسال أمر تشغيل جديد للفرن`;
      } else {
        DOM.btnModalDispatchOven.style.display = 'none';
      }
    }

    if (DOM.btnModalDispatchCutter) {
      if (invoice.partyType === 'customer') {
        DOM.btnModalDispatchCutter.style.display = 'inline-flex';
        DOM.btnModalDispatchCutter.innerHTML = invoice.linkedCutterInvoiceNumber 
          ? `<i class="fa-solid fa-scissors"></i> أمر المقص (${invoice.linkedCutterInvoiceNumber})` 
          : `<i class="fa-solid fa-scissors"></i> إرسال إلى المقص`;
        DOM.btnModalDispatchCutter.title = invoice.linkedCutterInvoiceNumber 
          ? `عرض أمر تفصيل المقص (${invoice.linkedCutterInvoiceNumber})`
          : `إرسال أمر تفصيل جديد للمقص (+8 سم عرض / +4 سم طول)`;
      } else {
        DOM.btnModalDispatchCutter.style.display = 'none';
      }
    }

    // Operational Order vs Financial Invoice Display
    const isOperational = (invoice.partyType === 'oven' || invoice.partyType === 'cutter');
    const isSupplier = (invoice.partyType === 'supplier');

    if (DOM.thSheetPrice) DOM.thSheetPrice.style.display = isOperational ? 'none' : '';
    if (DOM.thSheetTotal) DOM.thSheetTotal.style.display = isOperational ? 'none' : '';

    // Dynamic column width allocation based on invoice type
    if (isOperational) {
      if (DOM.thSheetItemNum) DOM.thSheetItemNum.style.width = '5%';
      if (DOM.thSheetItemName) DOM.thSheetItemName.style.width = '31%';
      if (DOM.thSheetItemColor) DOM.thSheetItemColor.style.width = '10%';
      if (DOM.thSheetItemDims) DOM.thSheetItemDims.style.width = '20%';
      if (DOM.thSheetItemThickness) DOM.thSheetItemThickness.style.width = '12%';
      if (DOM.thSheetItemSupports) DOM.thSheetItemSupports.style.width = '11%';
      if (DOM.thSheetItemQty) DOM.thSheetItemQty.style.width = '11%';
    } else if (isSupplier) {
      if (DOM.thSheetItemNum) DOM.thSheetItemNum.style.width = '4%';
      if (DOM.thSheetItemName) DOM.thSheetItemName.style.width = '22%';
      if (DOM.thSheetItemColor) DOM.thSheetItemColor.style.width = '8%';
      if (DOM.thSheetItemDims) DOM.thSheetItemDims.style.width = '14%';
      if (DOM.thSheetItemThickness) DOM.thSheetItemThickness.style.width = '8%';
      if (DOM.thSheetItemSupports) DOM.thSheetItemSupports.style.width = '7%';
      if (DOM.thSheetItemQty) DOM.thSheetItemQty.style.width = '7%';
      if (DOM.thSheetWeight) DOM.thSheetWeight.style.width = '9%';
      if (DOM.thSheetPrice) DOM.thSheetPrice.style.width = '9%';
      if (DOM.thSheetTotal) DOM.thSheetTotal.style.width = '12%';
    } else {
      if (DOM.thSheetItemNum) DOM.thSheetItemNum.style.width = '4%';
      if (DOM.thSheetItemName) DOM.thSheetItemName.style.width = '25%';
      if (DOM.thSheetItemColor) DOM.thSheetItemColor.style.width = '8%';
      if (DOM.thSheetItemDims) DOM.thSheetItemDims.style.width = '15%';
      if (DOM.thSheetItemThickness) DOM.thSheetItemThickness.style.width = '9%';
      if (DOM.thSheetItemSupports) DOM.thSheetItemSupports.style.width = '8%';
      if (DOM.thSheetItemQty) DOM.thSheetItemQty.style.width = '8%';
      if (DOM.thSheetPrice) DOM.thSheetPrice.style.width = '10%';
      if (DOM.thSheetTotal) DOM.thSheetTotal.style.width = '13%';
    }

    if (isOperational) {
      if (DOM.invSheetOperationalNotice) DOM.invSheetOperationalNotice.style.display = 'block';
      if (DOM.invSheetTotalsBox) DOM.invSheetTotalsBox.style.display = 'none';
    } else {
      if (DOM.invSheetOperationalNotice) DOM.invSheetOperationalNotice.style.display = 'none';
      if (DOM.invSheetTotalsBox) DOM.invSheetTotalsBox.style.display = 'block';
    }

    // Supplier Total Weight Display
    const totalTon = (invoice.items || []).reduce((s, it) => s + (parseFloat(it.weightTon) || 0), 0) || (parseFloat(invoice.totalWeightTon) || 0);
    const formattedWeight = `${totalTon > 0 ? (Math.round(totalTon * 1000) / 1000) : 0} طن`;

    if (isSupplier) {
      if (DOM.thSheetWeight) DOM.thSheetWeight.style.display = '';
      if (DOM.invSheetWeightMetaItem && DOM.invSheetMetaWeight) {
        DOM.invSheetWeightMetaItem.style.display = 'block';
        DOM.invSheetMetaWeight.textContent = formattedWeight;
      }
      if (DOM.invSheetWeightRow && DOM.invSheetTotalWeight) {
        DOM.invSheetWeightRow.style.display = 'flex';
        DOM.invSheetTotalWeight.textContent = formattedWeight;
      }
    } else {
      if (DOM.thSheetWeight) DOM.thSheetWeight.style.display = 'none';
      if (DOM.invSheetWeightMetaItem) DOM.invSheetWeightMetaItem.style.display = 'none';
      if (DOM.invSheetWeightRow) DOM.invSheetWeightRow.style.display = 'none';
    }

    // Populate Sheet Items
    let rowsHtml = '';
    (invoice.items || []).forEach((item, index) => {
      let colorBadge = '<span style="color: #64748b;">-</span>';
      if (item.color) {
        const c = String(item.color).trim();
        if (c === 'اسود') {
          colorBadge = '<span class="badge-color-black" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#0f172a; font-size:0.6em;"></i> اسود</span>';
        } else if (c === 'بيج') {
          colorBadge = '<span class="badge-color-beige" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#d8b88c; font-size:0.6em;"></i> بيج</span>';
        } else if (c === 'رصاصي') {
          colorBadge = '<span class="badge-color-lead" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#475569; font-size:0.6em;"></i> رصاصي</span>';
        } else if (c === 'رمادي') {
          colorBadge = '<span class="badge-color-gray" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#94a3b8; font-size:0.6em;"></i> رمادي</span>';
        } else if (c === 'برتقالي') {
          colorBadge = '<span class="badge-color-orange" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#ea580c; font-size:0.6em;"></i> برتقالي</span>';
        } else if (c === 'فضي') {
          colorBadge = '<span class="badge-color-silver" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#94a3b8; font-size:0.6em;"></i> فضي</span>';
        } else if (c === 'دهبي') {
          colorBadge = '<span class="badge-color-gold" style="font-size: 0.78rem; padding: 2px 6px;"><i class="fa-solid fa-circle" style="color:#f59e0b; font-size:0.6em;"></i> دهبي</span>';
        } else {
          colorBadge = `<span class="badge-color-custom" style="font-size: 0.78rem; padding: 2px 6px;">${c}</span>`;
        }
      }

      // Dimension formatting (BiDi-safe isolated badge)
      let dimHtml = '<span style="color: #94a3b8;">-</span>';
      const hasWidth = item.width && item.width !== '-' && String(item.width).trim() !== '';
      const hasLength = item.length && item.length !== '-' && String(item.length).trim() !== '';

      if (hasWidth && hasLength) {
        dimHtml = `
          <div class="sheet-dim-badge" title="العرض: ${item.width} | الطول: ${item.length}">
            <span class="dim-val"><bdi dir="rtl">${item.width}</bdi></span>
            <span class="dim-sep">×</span>
            <span class="dim-val"><bdi dir="rtl">${item.length}</bdi></span>
          </div>
        `;
      } else if (hasWidth) {
        dimHtml = `
          <div class="sheet-dim-badge" title="العرض: ${item.width}">
            <span class="dim-val"><bdi dir="rtl">${item.width}</bdi></span>
          </div>
        `;
      } else if (hasLength) {
        dimHtml = `
          <div class="sheet-dim-badge" title="الطول: ${item.length}">
            <span class="dim-val"><bdi dir="rtl">${item.length}</bdi></span>
          </div>
        `;
      }

      // Thickness formatting
      let thicknessHtml = '<span style="color: #94a3b8;">-</span>';
      if (item.thickness && String(item.thickness).trim() !== '' && item.thickness !== '-') {
        const tStr = String(item.thickness).trim();
        const displayVal = tStr.includes('سم') ? tStr : `${tStr} سم`;
        thicknessHtml = `<span class="sheet-thickness-badge" title="السُمك: ${displayVal}"><bdi>${displayVal}</bdi></span>`;
      }

      // Supports count formatting
      let supportsHtml = '<span style="color: #94a3b8;">-</span>';
      if (item.supports && String(item.supports).trim() !== '' && item.supports !== '-') {
        supportsHtml = `<span class="sheet-supports-badge" title="عدد الدعامات: ${item.supports}"><bdi>${item.supports}</bdi></span>`;
      }

      const weightCell = isSupplier
        ? `<td style="text-align: center;"><span class="badge-status" style="color: #0284c7; border-color: rgba(2,132,199,0.3); font-weight: 700;">${(item.weightTon && parseFloat(item.weightTon) > 0) ? (Math.round(parseFloat(item.weightTon) * 1000) / 1000 + ' طن') : (totalTon > 0 && (invoice.items || []).length === 1 ? formattedWeight : '-')}</span></td>`
        : '';

      const priceCell = isOperational ? '' : `<td style="text-align: center;">${formatMoney(item.price)}</td>`;
      const totalCell = isOperational ? '' : `<td style="text-align: center;"><strong>${formatMoney(item.total)}</strong></td>`;

      const isCutter = (invoice.partyType === 'cutter');
      const cutterBoxesHtml = isCutter
        ? `<div class="cutter-check-boxes">
             <span class="cutter-box"></span>
             <span class="cutter-box"></span>
           </div>`
        : '';

      const qtyCell = `
        <td style="text-align: center;">
          <div style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
            <span class="sheet-qty-badge">${item.qty}</span>
            ${cutterBoxesHtml}
          </div>
        </td>
      `;

      rowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: 700; color: #64748b;">${index + 1}</td>
          <td><strong>${item.name}</strong></td>
          <td style="text-align: center;">${colorBadge}</td>
          <td style="text-align: center;">${dimHtml}</td>
          <td style="text-align: center;">${thicknessHtml}</td>
          <td style="text-align: center;">${supportsHtml}</td>
          ${qtyCell}
          ${weightCell}
          ${priceCell}
          ${totalCell}
        </tr>
      `;
    });
    if (DOM.invSheetTableBody) DOM.invSheetTableBody.innerHTML = rowsHtml;

    if (DOM.invSheetNotesText) DOM.invSheetNotesText.textContent = invoice.notes || 'لا توجد ملاحظات إضافية.';
    if (DOM.invSheetSubtotal) DOM.invSheetSubtotal.textContent = formatMoney(invoice.subtotal, true);

    const discountVal = parseFloat(invoice.discount) || 0;
    if (DOM.invSheetDiscountRow) {
      if (discountVal > 0) {
        if (DOM.invSheetDiscount) DOM.invSheetDiscount.textContent = formatMoney(discountVal, true);
        DOM.invSheetDiscountRow.style.display = 'flex';
      } else {
        DOM.invSheetDiscountRow.style.display = 'none';
      }
    }

    if (DOM.invSheetGrandTotal) DOM.invSheetGrandTotal.textContent = formatMoney(invoice.grandTotal, true);
    if (DOM.invSheetFooterText) DOM.invSheetFooterText.textContent = settings.footerMsg || 'شكراً لتعاملكم مع مصنع tow_a لتصنيع الأرفف والاستندات بتقنية الفايبر ليزر';
  }

  function viewInvoiceModal(invoice) {
    if (!invoice) return;
    state.currentInvoice = invoice;
    if (window.App && window.App.State) {
      window.App.State.currentInvoice = invoice;
    }
    populateInvoiceSheet(invoice);
    if (DOM.statementModal && DOM.statementModal.classList.contains('open')) {
      DOM.statementModal.classList.remove('open');
      returnToStatementAfterInvoice = true;
    }
    if (DOM.invoiceModal) DOM.invoiceModal.classList.add('open');
  }

  function closeInvoiceModal() {
    if (DOM.invoiceModal) DOM.invoiceModal.classList.remove('open');
    if (returnToStatementAfterInvoice && DOM.statementModal) {
      DOM.statementModal.classList.add('open');
      returnToStatementAfterInvoice = false;
    }
  }

  // RENDER INVOICE SHEET TO CANVAS & BLOB
  async function renderInvoiceToCanvas(invoice) {
    if (typeof html2canvas === 'undefined') {
      throw new Error('مكتبة html2canvas غير متوفرة');
    }

    populateInvoiceSheet(invoice);

    const sheet = DOM.printableInvoiceSheet;
    if (!sheet) {
      throw new Error('لم يتم العثور على قالب الفاتورة');
    }

    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        console.warn('Font loading wait skipped:', e);
      }
    }

    const sandbox = document.createElement('div');
    sandbox.id = 'invoice-render-offscreen-sandbox';
    sandbox.style.position = 'fixed';
    sandbox.style.top = '0';
    sandbox.style.left = '0';
    sandbox.style.width = '820px';
    sandbox.style.zIndex = '-99999';
    sandbox.style.opacity = '1';
    sandbox.style.visibility = 'visible';
    sandbox.style.pointerEvents = 'none';
    sandbox.style.background = '#ffffff';
    sandbox.style.margin = '0';
    sandbox.style.padding = '0';
    sandbox.style.overflow = 'visible';

    const clone = sheet.cloneNode(true);
    clone.id = 'printableInvoiceSheet_clone';
    clone.style.margin = '0';
    clone.style.maxWidth = '820px';
    clone.style.width = '820px';
    clone.style.boxSizing = 'border-box';
    clone.style.position = 'relative';
    clone.style.transform = 'none';
    clone.style.visibility = 'visible';
    clone.style.display = 'block';

    const cloneLogo = clone.querySelector('#invSheetLogoImg') || clone.querySelector('.invoice-sheet-logo');
    if (cloneLogo && typeof DEFAULT_LOGO_BASE64 !== 'undefined') {
      cloneLogo.src = DEFAULT_LOGO_BASE64;
    }

    sandbox.appendChild(clone);
    document.body.appendChild(sandbox);

    await new Promise(r => setTimeout(r, 80));

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 820,
        windowWidth: 820,
        scrollX: 0,
        scrollY: 0
      });

      return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (!blob) {
            return reject(new Error('فشل إنشاء ملف الصورة من الفاتورة'));
          }
          try {
            const dataURL = canvas.toDataURL('image/png');
            resolve({ canvas, blob, dataURL });
          } catch (e) {
            reject(e);
          }
        }, 'image/png');
      });
    } finally {
      if (sandbox && sandbox.parentNode) {
        sandbox.parentNode.removeChild(sandbox);
      }
    }
  }

  // DOWNLOAD INVOICE AS IMAGE
  async function downloadInvoiceAsImage(inv = null) {
    const targetInvoice = inv || state.currentInvoice;
    if (!targetInvoice) {
      showToast('الرجاء اختيار الفاتورة أولاً', 'danger');
      return null;
    }
    
    showToast('جاري استخراج صورة الفاتورة عالية الدقة...', 'info');

    try {
      const { canvas, blob, dataURL } = await renderInvoiceToCanvas(targetInvoice);
      const invNum = targetInvoice.invoiceNumber || 'INV';
      const party = (targetInvoice.partyName || 'عميل').replace(/[\s\/\\:*?"<>|]+/g, '_');
      const filename = `فاتورة_${invNum}_${party}.png`;

      const downloadLink = document.createElement('a');
      downloadLink.href = dataURL;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast(`تم تنزيل الفاتورة كصورة بنجاح: ${filename}`, 'success');
      return { canvas, blob, dataURL, filename };
    } catch (err) {
      console.error('Image capture error:', err);
      showToast('تعذر استخراج صورة الفاتورة: ' + (err.message || ''), 'danger');
      return null;
    }
  }

  function formatWhatsAppPhone(phone) {
    let clean = (phone || '').replace(/\D/g, '');
    if (!clean) return '';
    if (clean.startsWith('01')) clean = '2' + clean;
    if (clean.startsWith('00')) clean = clean.substring(2);
    return clean;
  }

  function updateWhatsAppModalLinks(phone) {
    const clean = formatWhatsAppPhone(phone);
    const webUrl = clean 
      ? `https://web.whatsapp.com/send?phone=${clean}` 
      : `https://web.whatsapp.com`;
    const appUrl = clean 
      ? `https://api.whatsapp.com/send?phone=${clean}` 
      : `https://api.whatsapp.com`;

    if (DOM.btnOpenWhatsAppWeb) DOM.btnOpenWhatsAppWeb.href = webUrl;
    if (DOM.btnOpenWhatsAppApp) DOM.btnOpenWhatsAppApp.href = appUrl;
    return { webUrl, appUrl };
  }

  // SHARE INVOICE VIA WHATSAPP
  async function shareInvoiceWhatsApp(inv = null) {
    const targetInvoice = inv || state.currentInvoice;
    if (!targetInvoice) {
      showToast('الرجاء تحديد الفاتورة أولاً', 'danger');
      return;
    }

    const chosenPhone = (targetInvoice.partyPhone || '').trim();
    showToast('جاري استخراج صورة الفاتورة وفتح الواتساب فوراً...', 'info');

    try {
      const { canvas, blob, dataURL } = await renderInvoiceToCanvas(targetInvoice);
      const invNum = targetInvoice.invoiceNumber || 'INV';
      const party = (targetInvoice.partyName || 'عميل').replace(/[\s\/\\:*?"<>|]+/g, '_');
      const filename = `فاتورة_${invNum}_${party}.png`;

      // 1. Auto download image file
      const downloadLink = document.createElement('a');
      downloadLink.href = dataURL;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // 2. Web Share API if supported
      const imageFile = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        try {
          await navigator.share({
            files: [imageFile],
            title: `فاتورة ${invNum}`,
            text: `فاتورة رقم ${invNum} - ${targetInvoice.partyName}`
          });
          showToast('تمت مشاركة صورة الفاتورة بنجاح عبر التطبيق!', 'success');
          return;
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            console.warn('Native share failed, proceeding with WhatsApp Web + Clipboard:', shareErr);
          }
        }
      }

      // 3. System clipboard
      let copiedToClipboard = false;
      if (blob && navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          copiedToClipboard = true;
        } catch (clipErr) {
          console.warn('Clipboard write prevented by browser:', clipErr);
        }
      }

      state.lastGeneratedImageBlob = blob;
      state.lastGeneratedImageUrl = dataURL;

      // 4. Update WhatsApp links
      const { webUrl } = updateWhatsAppModalLinks(chosenPhone);

      // 5. Open WhatsApp Web
      window.open(webUrl, '_blank');

      // 6. Open WhatsApp Modal
      if (DOM.whatsappModal) {
        if (DOM.whatsappModalSubtitle) {
          DOM.whatsappModalSubtitle.textContent = `فاتورة رقم ${invNum} - ${targetInvoice.partyName}`;
        }
        if (DOM.whatsappPreviewImg) {
          DOM.whatsappPreviewImg.src = dataURL;
        }
        if (DOM.whatsappTargetPhoneInput) {
          DOM.whatsappTargetPhoneInput.value = chosenPhone;
        }
        DOM.whatsappModal.classList.add('open');
      }

      if (copiedToClipboard) {
        showToast('تم نسخ صورة الفاتورة إلى الحافظة! اضغط (Ctrl + V) في الواتساب لإرسالها.', 'success');
      } else {
        showToast('تم تنزيل صورة الفاتورة وفتح محادثة الواتساب بنجاح!', 'success');
      }

    } catch (err) {
      console.error('WhatsApp image share error:', err);
      showToast('تعذر استخراج صورة الفاتورة: ' + (err.message || ''), 'danger');
    }
  }

  // PRINT INVOICE
  function printInvoice() {
    document.body.classList.remove('printing-statement-mode', 'printing-report-mode');
    document.body.classList.add('printing-invoice-mode');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-invoice-mode');
    }, 1500);
  }

  // ================= GENERAL REPORT PRINT HELPER =================
  function printGeneralReport(title, subtitle, tableHeaders, rowsData, summaryStats = []) {
    const settings = AppStore.getSettings();
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG') + ' ' + now.toLocaleTimeString('ar-EG');

    let summaryHtml = '';
    if (summaryStats.length > 0) {
      summaryHtml = `
        <div style="display: flex; gap: 14px; margin-bottom: 20px; flex-wrap: wrap;">
          ${summaryStats.map(s => `
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 16px; min-width: 140px; text-align: center;">
              <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 4px;">${s.label}</div>
              <div style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">${s.value}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    let headersHtml = tableHeaders.map(h => `<th style="border: 1px solid #cbd5e1; padding: 8px 10px; background: #f1f5f9; color: #0f172a; text-align: center; font-size: 0.86rem;">${h}</th>`).join('');
    
    let rowsHtml = '';
    if (rowsData.length === 0) {
      rowsHtml = `<tr><td colspan="${tableHeaders.length}" style="text-align: center; padding: 20px; color: #64748b;">لا توجد بيانات مسجلة في هذا التقرير</td></tr>`;
    } else {
      rowsHtml = rowsData.map((row) => {
        const cells = row.map(c => `<td style="border: 1px solid #e2e8f0; padding: 8px 10px; font-size: 0.85rem; text-align: center;">${c}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
    }

    const reportHtml = `
      <div style="font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; color: #000; width: 100%;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px;">
          <div>
            <h1 style="margin: 0 0 4px 0; font-size: 1.6rem; color: #0f172a;">${settings.factoryName || 'مصنع (tow_a)'}</h1>
            <p style="margin: 0 0 6px 0; font-size: 0.9rem; color: #475569;">${settings.subTitle || 'لتصنيع الأرفف والاستاندات بتقنية الفايبر ليزر'}</p>
            <div style="font-size: 0.82rem; color: #334155;">
              <span>هاتف: <b>${settings.phone}</b></span> | 
              <span>العنوان: ${settings.address}</span>
            </div>
          </div>
          <div style="text-align: center; border: 2px solid #0f172a; border-radius: 8px; padding: 8px 16px;">
            <div style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">tow_a</div>
            <div style="font-size: 0.75rem; color: #64748b;">تقرير إلكتروني معتمد</div>
          </div>
        </div>

        <!-- Title Banner -->
        <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h2 style="margin: 0; font-size: 1.25rem; color: #0f172a;">${title}</h2>
            ${subtitle ? `<small style="color: #64748b;">${subtitle}</small>` : ''}
          </div>
          <div style="font-size: 0.82rem; color: #334155;">
            تاريخ الطباعة: <b>${dateStr}</b>
          </div>
        </div>

        <!-- Summary -->
        ${summaryHtml}

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead><tr>${headersHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>

        <!-- Signatures & Footer -->
        <div style="display: flex; justify-content: space-between; margin-top: 36px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
          <div style="text-align: center; width: 30%;">
            <span>إعداد ومراجعة الحسابات</span><br><br>
            <span>____________________</span>
          </div>
          <div style="text-align: center; width: 30%;">
            <span>مسؤول إدارة النظام</span><br><br>
            <span>____________________</span>
          </div>
          <div style="text-align: center; width: 30%;">
            <span>اعتماد وختم المصنع</span><br><br>
            <span>____________________</span>
          </div>
        </div>
      </div>
    `;

    if (DOM.printableReportContainer) {
      DOM.printableReportContainer.innerHTML = reportHtml;
    }
    document.body.classList.remove('printing-invoice-mode', 'printing-statement-mode');
    document.body.classList.add('printing-report-mode');

    window.print();

    setTimeout(() => {
      document.body.classList.remove('printing-report-mode');
      if (DOM.printableReportContainer) {
        DOM.printableReportContainer.innerHTML = '';
      }
    }, 1500);
  }

  function printCustomersReport() {
    const customers = AppStore.getCustomers();
    const invoices = AppStore.getInvoices();

    let totalSales = 0;
    let totalInvsCount = 0;

    const rows = customers.map((c, idx) => {
      const custInvoices = invoices.filter(inv => inv.partyId === c.id || inv.partyName === c.name);
      const custTotal = custInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
      totalSales += custTotal;
      totalInvsCount += custInvoices.length;

      return [
        idx + 1,
        `<b>${c.code || c.id}</b>`,
        c.name,
        c.phone || '-',
        c.address || '-',
        `${custInvoices.length} فاتورة`,
        `<b>${formatMoney(custTotal, true)}</b>`,
        c.notes || '-'
      ];
    });

    const headers = ['#', 'كود العميل', 'اسم العميل', 'رقم الهاتف', 'العنوان', 'عدد الفواتير', 'إجمالي المسحوبات', 'ملاحظات'];
    const summary = [
      { label: 'إجمالي عدد العملاء', value: customers.length },
      { label: 'إجمالي الفواتير الصادرة', value: totalInvsCount },
      { label: 'إجمالي قيمة المبيعات', value: formatMoney(totalSales, true) }
    ];

    printGeneralReport('تقرير دليل العملاء والمسحوبات المالية', 'بيانات العملاء الرسمية وحركات الفواتير الإجمالية', headers, rows, summary);
  }

  function printSuppliersReport() {
    const suppliers = AppStore.getSuppliers();
    const invoices = AppStore.getInvoices();

    let totalPurchases = 0;
    let totalInvsCount = 0;

    const rows = suppliers.map((s, idx) => {
      const suppInvoices = invoices.filter(inv => inv.partyId === s.id || inv.partyName === s.name);
      const suppTotal = suppInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      totalPurchases += suppTotal;
      totalInvsCount += suppInvoices.length;

      return [
        idx + 1,
        `<b>${s.code || s.id}</b>`,
        s.name,
        s.phone || '-',
        s.address || '-',
        s.supplies || 'خامات عامة',
        `${suppInvoices.length} فاتورة`,
        `<b>${formatMoney(suppTotal, true)}</b>`
      ];
    });

    const headers = ['#', 'كود المورد', 'اسم المورد', 'رقم الهاتف', 'العنوان', 'نوع التوريدات', 'عدد الفواتير', 'إجمالي المشتريات'];
    const summary = [
      { label: 'إجمالي عدد الموردين', value: suppliers.length },
      { label: 'إجمالي فواتير التوريد', value: totalInvsCount },
      { label: 'إجمالي المبالغ والمشتريات', value: formatMoney(totalPurchases, true) }
    ];

    printGeneralReport('تقرير دليل الموردين والمشتريات', 'بيانات الموردين المعتمدين وإجمالي التوريدات المالية', headers, rows, summary);
  }

  function printOvensReport() {
    const ovens = AppStore.getOvens();
    const invoices = AppStore.getInvoices();

    let totalOvensAmount = 0;
    let totalInvsCount = 0;

    const rows = ovens.map((o, idx) => {
      const ovenInvoices = invoices.filter(inv => inv.partyId === o.id || inv.partyName === o.name);
      const ovenTotal = ovenInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      totalOvensAmount += ovenTotal;
      totalInvsCount += ovenInvoices.length;

      return [
        idx + 1,
        `<b>${o.code || o.id}</b>`,
        o.name,
        o.phone || '-',
        o.address || '-',
        o.notes || 'تشغيل وصهر',
        `${ovenInvoices.length} فاتورة`,
        `<b>${formatMoney(ovenTotal, true)}</b>`
      ];
    });

    const headers = ['#', 'كود الفرن', 'اسم الفرن', 'رقم الهاتف', 'العنوان', 'طاقة التشغيل / ملاحظات', 'عدد الفواتير', 'إجمالي تشغيل الأفران'];
    const summary = [
      { label: 'إجمالي عدد الأفران', value: ovens.length },
      { label: 'إجمالي أوامر التشغيل', value: totalInvsCount },
      { label: 'إجمالي تكلفة التشغيل والصهر', value: formatMoney(totalOvensAmount, true) }
    ];

    printGeneralReport('تقرير أفران الصهر والتشغيل الحراري', 'سجل أفران الصهر والتشغيل وتكاليف العمليات', headers, rows, summary);
  }

  function printCuttersReport() {
    const cutters = AppStore.getCutters();
    const invoices = AppStore.getInvoices();

    let totalCuttersInvs = 0;

    const rows = cutters.map((c, idx) => {
      const cutterInvoices = invoices.filter(inv => inv.partyId === c.id || inv.partyName === c.name);
      totalCuttersInvs += cutterInvoices.length;

      return [
        idx + 1,
        `<b>${c.code || c.id}</b>`,
        c.name,
        c.phone || '-',
        c.address || '-',
        c.notes || 'تشغيل وقص مقصات',
        `${cutterInvoices.length} أمر تشغيل`,
        `<span class="badge-status">أمر تشغيل</span>`
      ];
    });

    const headers = ['#', 'كود المقص', 'اسم المقص / الورشة', 'رقم الهاتف', 'العنوان', 'ملاحظات التشغيل', 'عدد أوامر التشغيل', 'نوع النشاط'];
    const summary = [
      { label: 'إجمالي عدد المقصات', value: cutters.length },
      { label: 'إجمالي أوامر تشغيل المقصات', value: totalCuttersInvs }
    ];

    printGeneralReport('تقرير مقصات وورش التشغيل', 'سجل مقصات التقطيع والتشغيل وأوامر العمل الصادرة', headers, rows, summary);
  }

  function printInvoicesLog() {
    const invoices = AppStore.getInvoices();
    const activeFilterBtn = DOM.invoicesTypeFilter ? DOM.invoicesTypeFilter.querySelector('.pill.active') : null;
    const typeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
    const query = DOM.searchInvoicesInput ? (DOM.searchInvoicesInput.value || '').trim().toLowerCase() : '';

    const filtered = invoices.filter(inv => {
      const matchType = typeFilter === 'all' || inv.partyType === typeFilter;
      const matchQuery = !query || 
        inv.invoiceNumber.toLowerCase().includes(query) ||
        (inv.partyName && inv.partyName.toLowerCase().includes(query)) ||
        (inv.date && inv.date.includes(query));
      return matchType && matchQuery;
    });

    if (filtered.length === 0) {
      showToast('لا توجد فواتير مطابقة للطباعة في السجل', 'info');
      return;
    }

    let filterTitle = 'جميع الفواتير';
    if (typeFilter === 'customer') filterTitle = 'فواتير العملاء (المبيعات)';
    if (typeFilter === 'supplier') filterTitle = 'فواتير الموردين (المشتريات)';
    if (typeFilter === 'oven') filterTitle = 'فواتير الأفران (التشغيل)';
    if (typeFilter === 'cutter') filterTitle = 'فواتير المقصات (التشغيل والقص)';

    let totalSum = 0;
    const rows = filtered.map((inv, idx) => {
      totalSum += (inv.grandTotal || 0);
      let pType = 'عميل';
      if (inv.partyType === 'supplier') pType = 'مورد';
      if (inv.partyType === 'oven') pType = 'فرن';
      if (inv.partyType === 'cutter') pType = 'مقص';

      const amountDisplay = (inv.partyType === 'oven' || inv.partyType === 'cutter')
        ? '<span class="text-muted">بدون سعر (تشغيل)</span>'
        : `<b>${formatMoney(inv.grandTotal, true)}</b>`;

      return [
        idx + 1,
        `<b>${inv.invoiceNumber}</b>`,
        pType,
        inv.partyName,
        inv.partyPhone || '-',
        inv.date,
        inv.paymentMethod,
        amountDisplay
      ];
    });

    const headers = ['#', 'رقم الفاتورة', 'النوع', 'الجهة المستفيدة', 'رقم الهاتف', 'التاريخ', 'طريقة السداد', 'الصافي المستحق'];
    const summary = [
      { label: 'القسم المطبوع', value: filterTitle },
      { label: 'عدد الفواتير', value: filtered.length },
      { label: 'إجمالي المبالغ المستحقة', value: formatMoney(totalSum, true) }
    ];

    printGeneralReport(`سجل الفواتير الرسمي - ${filterTitle}`, 'بيانات الفواتير المسجلة بالنظام ومبالغ السداد', headers, rows, summary);
  }

  // ================= ACCOUNT STATEMENT MODAL & PRINT =================
  function viewAccountStatement(partyType, partyId) {
    let party = null;
    let typeLabel = 'عميل';

    if (partyType === 'customer') {
      party = AppStore.getCustomers().find(c => c.id === partyId);
      typeLabel = 'عميل';
    } else if (partyType === 'supplier') {
      party = AppStore.getSuppliers().find(s => s.id === partyId);
      typeLabel = 'مورد';
    } else if (partyType === 'oven') {
      party = AppStore.getOvens().find(o => o.id === partyId);
      typeLabel = 'فرن تشغيل';
    } else if (partyType === 'cutter') {
      party = AppStore.getCutters().find(c => c.id === partyId);
      typeLabel = 'مقص تشغيل';
    }

    if (!party) {
      showToast('تعذر العثور على بيانات الحساب', 'danger');
      return;
    }

    state.currentStatementParty = { party, partyType };
    const settings = AppStore.getSettings();
    const invoices = AppStore.getInvoices();

    // Find all invoices for this party
    const partyInvoices = invoices.filter(inv => inv.partyId === party.id || inv.partyName === party.name);

    // Populate Statement Header & Entity Info
    if (DOM.stmtFactoryName) DOM.stmtFactoryName.textContent = settings.factoryName || 'مصنع (tow_a)';
    if (DOM.stmtFactorySub) DOM.stmtFactorySub.textContent = settings.subTitle || 'لتصنيع الارفف والاستندات بتقنية الفايبر ليزر';
    const phone1 = settings.phone || '01007585897';
    const phone2 = settings.phone2 || '01102620836';
    if (DOM.stmtFactoryPhone) {
      DOM.stmtFactoryPhone.textContent = (phone2 && phone2 !== phone1) ? `${phone1} - ${phone2}` : phone1;
    }
    if (DOM.stmtFactoryAddress) DOM.stmtFactoryAddress.textContent = settings.address || 'عزبة عبدالله باشا الجديدة طريق النخل';
    
    if (DOM.stmtPrintDate) DOM.stmtPrintDate.textContent = new Date().toISOString().split('T')[0];
    if (DOM.statementPartyTypeTag) DOM.statementPartyTypeTag.textContent = `كشف حساب ${typeLabel}`;
    if (DOM.stmtPartyTypeBadge) DOM.stmtPartyTypeBadge.textContent = typeLabel;

    if (DOM.stmtPartyCode) DOM.stmtPartyCode.textContent = party.code || party.id;
    if (DOM.stmtPartyName) DOM.stmtPartyName.textContent = party.name;
    if (DOM.stmtPartyPhone) DOM.stmtPartyPhone.textContent = party.phone || 'غير مسجل';
    if (DOM.stmtPartyAddress) DOM.stmtPartyAddress.textContent = party.address || '-';

    // Calculate Financial Metrics
    const isOperational = (partyType === 'oven' || partyType === 'cutter');
    const totalAmount = partyInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    if (DOM.stmtCountVal) DOM.stmtCountVal.textContent = partyInvoices.length;
    if (DOM.stmtTotalVal) DOM.stmtTotalVal.textContent = isOperational ? `${partyInvoices.length} أمر تشغيل` : formatMoney(totalAmount, true);
    if (DOM.stmtFooterGrandTotal) DOM.stmtFooterGrandTotal.textContent = isOperational ? `${partyInvoices.length} أمر تشغيل (تشغيل خارجي)` : formatMoney(totalAmount, true);

    if (partyInvoices.length > 0) {
      const dates = partyInvoices.map(i => i.date).filter(Boolean).sort();
      if (DOM.stmtFirstDateVal) DOM.stmtFirstDateVal.textContent = dates[0] || '-';
      if (DOM.stmtLastDateVal) DOM.stmtLastDateVal.textContent = dates[dates.length - 1] || '-';
    } else {
      if (DOM.stmtFirstDateVal) DOM.stmtFirstDateVal.textContent = '-';
      if (DOM.stmtLastDateVal) DOM.stmtLastDateVal.textContent = '-';
    }

    // Populate Invoices Statement Table
    if (DOM.stmtInvoicesBody) {
      DOM.stmtInvoicesBody.innerHTML = '';
      if (partyInvoices.length === 0) {
        DOM.stmtInvoicesBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted p-4">لا توجد حركات أو أوامر مسجلة لهذا الحساب حتى الآن</td></tr>`;
      } else {
        partyInvoices.forEach((inv, idx) => {
          let itemsSummary = '';
          if (inv.items && inv.items.length > 0) {
            itemsSummary = inv.items.map(it => `${it.name} (${it.qty})`).join('، ');
          } else {
            itemsSummary = 'بنود متعددة';
          }

          const amountCell = isOperational
            ? '<span class="badge-status" style="color: #a855f7; border-color: rgba(168,85,247,0.3); font-size: 0.78rem;"><i class="fa-solid fa-clipboard-check"></i> أمر تشغيل</span>'
            : `<strong>${formatMoney(inv.grandTotal, true)}</strong>`;

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="text-center">${idx + 1}</td>
            <td class="text-center"><a href="javascript:void(0)" onclick="window.viewInvoiceDetail('${inv.invoiceNumber}')" title="عرض أمر التشغيل" style="text-decoration:none;"><strong class="text-accent" style="cursor:pointer;"><i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75em; margin-left:3px;"></i>${inv.invoiceNumber}</strong></a></td>
            <td class="text-center">${inv.date}</td>
            <td class="text-center">${inv.paymentMethod}</td>
            <td><small>${itemsSummary}</small></td>
            <td class="text-center">${amountCell}</td>
          `;
          DOM.stmtInvoicesBody.appendChild(tr);
        });
      }
    }

    if (DOM.statementModal) DOM.statementModal.classList.add('open');
  }

  function printAccountStatement() {
    document.body.classList.remove('printing-invoice-mode', 'printing-report-mode');
    document.body.classList.add('printing-statement-mode');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-statement-mode');
    }, 1500);
  }

  // RENDER STATEMENT TO CANVAS
  async function renderStatementToCanvas() {
    if (typeof html2canvas === 'undefined') {
      throw new Error('مكتبة تحويل الصور html2canvas غير متوفرة');
    }

    const sheet = DOM.printableStatementSheet;
    if (!sheet) {
      throw new Error('تعذر العثور على قالب كشف الحساب');
    }

    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        console.warn('Font loading wait skipped:', e);
      }
    }

    const sandbox = document.createElement('div');
    sandbox.id = 'statement-render-offscreen-sandbox';
    sandbox.style.position = 'fixed';
    sandbox.style.top = '0';
    sandbox.style.left = '0';
    sandbox.style.width = '820px';
    sandbox.style.zIndex = '-99999';
    sandbox.style.opacity = '1';
    sandbox.style.visibility = 'visible';
    sandbox.style.pointerEvents = 'none';
    sandbox.style.background = '#ffffff';
    sandbox.style.margin = '0';
    sandbox.style.padding = '0';
    sandbox.style.overflow = 'visible';

    const clone = sheet.cloneNode(true);
    clone.id = 'printableStatementSheet_clone';
    clone.style.margin = '0';
    clone.style.maxWidth = '820px';
    clone.style.width = '820px';
    clone.style.boxSizing = 'border-box';
    clone.style.position = 'relative';
    clone.style.transform = 'none';
    clone.style.visibility = 'visible';
    clone.style.display = 'block';

    const cloneLogo = clone.querySelector('#stmtSheetLogoImg') || clone.querySelector('.invoice-sheet-logo');
    if (cloneLogo && typeof DEFAULT_LOGO_BASE64 !== 'undefined') {
      cloneLogo.src = DEFAULT_LOGO_BASE64;
    }

    sandbox.appendChild(clone);
    document.body.appendChild(sandbox);

    await new Promise(r => setTimeout(r, 80));

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 820,
        windowWidth: 820,
        scrollX: 0,
        scrollY: 0
      });

      return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (!blob) {
            return reject(new Error('فشل إنشاء ملف الصورة من كشف الحساب'));
          }
          try {
            const dataURL = canvas.toDataURL('image/png');
            resolve({ canvas, blob, dataURL });
          } catch (e) {
            reject(e);
          }
        }, 'image/png');
      });
    } finally {
      if (sandbox && sandbox.parentNode) {
        sandbox.parentNode.removeChild(sandbox);
      }
    }
  }

  // DOWNLOAD STATEMENT AS IMAGE
  async function downloadStatementAsImage(partyType = null, partyId = null) {
    if (partyType && partyId) {
      viewAccountStatement(partyType, partyId);
    }
    const current = state.currentStatementParty;
    if (!current || !current.party) {
      showToast('الرجاء فتح أو اختيار كشف الحساب أولاً', 'danger');
      return null;
    }

    const party = current.party;
    showToast('جاري استخراج صورة كشف الحساب عالية الدقة...', 'info');

    try {
      const { canvas, blob, dataURL } = await renderStatementToCanvas();
      const code = party.code || party.id || 'ACC';
      const safeName = (party.name || 'حساب').replace(/[\s\/\\:*?"<>|]+/g, '_');
      const filename = `كشف_حساب_${code}_${safeName}.png`;

      const downloadLink = document.createElement('a');
      downloadLink.href = dataURL;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast(`تم تنزيل كشف الحساب كصورة بنجاح: ${filename}`, 'success');
      return { canvas, blob, dataURL, filename };
    } catch (err) {
      console.error('Statement image capture error:', err);
      showToast('تعذر استخراج صورة كشف الحساب: ' + (err.message || ''), 'danger');
      return null;
    }
  }

  // SHARE STATEMENT VIA WHATSAPP
  async function shareStatementWhatsApp(partyType = null, partyId = null) {
    if (partyType && partyId) {
      viewAccountStatement(partyType, partyId);
    }
    const current = state.currentStatementParty;
    if (!current || !current.party) {
      showToast('الرجاء اختيار كشف الحساب أولاً', 'danger');
      return;
    }

    const party = current.party;
    const chosenPhone = (party.phone || '').trim();
    showToast('جاري استخراج صورة كشف الحساب وفتح الواتساب فوراً...', 'info');

    try {
      const { canvas, blob, dataURL } = await renderStatementToCanvas();
      const code = party.code || party.id || 'ACC';
      const safeName = (party.name || 'حساب').replace(/[\s\/\\:*?"<>|]+/g, '_');
      const filename = `كشف_حساب_${code}_${safeName}.png`;

      // 1. Auto download image file
      const downloadLink = document.createElement('a');
      downloadLink.href = dataURL;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // 2. Web Share API if supported
      const imageFile = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        try {
          await navigator.share({
            files: [imageFile],
            title: `كشف حساب ${party.name}`,
            text: `كشف حساب مالي - ${party.name} (${code})`
          });
          showToast('تمت مشاركة كشف الحساب بنجاح عبر التطبيق!', 'success');
          return;
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            console.warn('Native share failed, proceeding with WhatsApp Web + Clipboard:', shareErr);
          }
        }
      }

      // 3. System clipboard
      let copiedToClipboard = false;
      if (blob && navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          copiedToClipboard = true;
        } catch (clipErr) {
          console.warn('Clipboard write prevented by browser:', clipErr);
        }
      }

      state.lastGeneratedImageBlob = blob;
      state.lastGeneratedImageUrl = dataURL;

      // 4. Update WhatsApp links
      const { webUrl } = updateWhatsAppModalLinks(chosenPhone);

      // 5. Open WhatsApp Web
      window.open(webUrl, '_blank');

      // 6. Open WhatsApp Modal
      if (DOM.whatsappModal) {
        if (DOM.whatsappModalSubtitle) {
          DOM.whatsappModalSubtitle.textContent = `كشف حساب: ${party.name} (${code})`;
        }
        if (DOM.whatsappPreviewImg) {
          DOM.whatsappPreviewImg.src = dataURL;
        }
        if (DOM.whatsappTargetPhoneInput) {
          DOM.whatsappTargetPhoneInput.value = chosenPhone;
        }
        DOM.whatsappModal.classList.add('open');
      }

      if (copiedToClipboard) {
        showToast('تم نسخ صورة كشف الحساب إلى الحافظة! اضغط (Ctrl + V) في الواتساب لإرسالها.', 'success');
      } else {
        showToast('تم تنزيل صورة كشف الحساب وفتح محادثة الواتساب بنجاح!', 'success');
      }

    } catch (err) {
      console.error('WhatsApp statement share error:', err);
      showToast('تعذر استخراج صورة كشف الحساب: ' + (err.message || ''), 'danger');
    }
  }

  // Export functions to App.Print namespace
  window.App.Print = {
    populateInvoiceSheet,
    viewInvoiceModal,
    viewModal: viewInvoiceModal,
    closeInvoiceModal,
    renderInvoiceToCanvas,
    downloadInvoiceAsImage,
    shareInvoiceWhatsApp,
    printInvoice,
    printGeneralReport,
    printCustomersReport,
    printSuppliersReport,
    printOvensReport,
    printCuttersReport,
    printInvoicesLog,
    viewAccountStatement,
    printAccountStatement,
    renderStatementToCanvas,
    downloadStatementAsImage,
    shareStatementWhatsApp
  };

  // Global window bindings for HTML onclick attributes
  window.viewAccountStatement = viewAccountStatement;
  window.printAccountStatement = printAccountStatement;
  window.downloadStatementAsImage = downloadStatementAsImage;
  window.shareStatementWhatsApp = shareStatementWhatsApp;
  window.sendStatementWhatsAppDirect = (partyType, partyId) => {
    shareStatementWhatsApp(partyType, partyId);
  };
  window.viewInvoiceModal = viewInvoiceModal;
  window.closeInvoiceModal = closeInvoiceModal;
  window.downloadInvoiceAsImage = downloadInvoiceAsImage;
  window.shareInvoiceWhatsApp = shareInvoiceWhatsApp;
  window.printInvoice = printInvoice;
  window.printCustomersReport = printCustomersReport;
  window.printSuppliersReport = printSuppliersReport;
  window.printOvensReport = printOvensReport;
  window.printCuttersReport = printCuttersReport;
  window.printInvoicesLog = printInvoicesLog;

})();
