/**
 * مصنع تو-A (Factory 2-A)
 * Entities CRUD Module: Items, Customers, Suppliers, Ovens, Cutters (Clean Architecture)
 */

window.App = window.App || {};

(function (App) {
  'use strict';

  function refreshPOS() {
    if (App.POS && typeof App.POS.refreshDropdowns === 'function') {
      App.POS.refreshDropdowns();
    }
  }

  // ================= 1. ITEMS CRUD =================
  function renderItemsTable() {
    const DOM = App.DOM;
    if (!DOM || !DOM.itemsTableBody) return;
    const items = AppStore.getItems();
    const query = (DOM.searchItemsInput ? DOM.searchItemsInput.value : '').trim().toLowerCase();
    const activeFilterBtn = DOM.itemsCategoryFilter ? DOM.itemsCategoryFilter.querySelector('.pill.active') : null;
    const categoryFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';

    DOM.itemsTableBody.innerHTML = '';

    const filtered = items.filter(item => {
      const matchQuery = !query || item.name.toLowerCase().includes(query);
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchQuery && matchCategory;
    });

    if (filtered.length === 0) {
      DOM.itemsTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted p-4">لا توجد أصناف مطابقة للبحث</td></tr>`;
      return;
    }

    filtered.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="text-accent">${item.id}</strong></td>
        <td><strong>${item.name}</strong></td>
        <td><span class="badge-status">${item.category}</span></td>
        <td>${item.createdAt || '-'}</td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="btn-table-action" onclick="window.editItem('${item.id}')" title="تعديل الصنف">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-table-action delete" onclick="window.deleteItem('${item.id}')" title="حذف الصنف">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      DOM.itemsTableBody.appendChild(tr);
    });
  }

  function openItemModal(itemId = null) {
    const DOM = App.DOM;
    if (!DOM) return;
    if (itemId) {
      const item = AppStore.getItems().find(i => i.id === itemId);
      if (!item) return;
      DOM.itemModalTitle.textContent = 'تعديل الصنف';
      DOM.itemFormId.value = item.id;
      DOM.itemFormName.value = item.name;
      DOM.itemFormCategory.value = item.category;
    } else {
      DOM.itemModalTitle.textContent = 'إضافة صنف جديد';
      DOM.itemForm.reset();
      DOM.itemFormId.value = '';
    }
    DOM.itemModal.classList.add('open');
  }

  function saveItemForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const DOM = App.DOM;
    if (!DOM) return;
    const id = DOM.itemFormId.value;
    const name = DOM.itemFormName.value.trim();
    const category = DOM.itemFormCategory.value;

    let items = AppStore.getItems();

    if (id) {
      items = items.map(itm => {
        if (itm.id === id) {
          return { ...itm, name, category };
        }
        return itm;
      });
      App.Utils.showToast('تم تحديث بيانات الصنف بنجاح');
    } else {
      const newId = 'ITM-' + String(items.length + 1).padStart(2, '0');
      items.push({
        id: newId,
        name,
        category,
        createdAt: new Date().toISOString().split('T')[0]
      });
      App.Utils.showToast('تمت إضافة الصنف الجديد بنجاح');
    }

    AppStore.saveItems(items);
    DOM.itemModal.classList.remove('open');
    renderItemsTable();
    refreshPOS();
  }

  window.editItem = (id) => openItemModal(id);
  window.deleteItem = (id) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف من المخزن؟')) {
      const itemsList = AppStore.getItems().filter(i => i.id !== id);
      AppStore.saveItems(itemsList);
      renderItemsTable();
      refreshPOS();
      App.Utils.showToast('تم حذف الصنف بنجاح');
    }
  };

  // ================= 2. CUSTOMERS CRUD =================
  function renderCustomersTable() {
    const DOM = App.DOM;
    if (!DOM || !DOM.customersTableBody) return;
    const customers = AppStore.getCustomers();
    const invoices = AppStore.getInvoices();
    const query = (DOM.searchCustomersInput ? DOM.searchCustomersInput.value : '').trim().toLowerCase();

    DOM.customersTableBody.innerHTML = '';

    const filtered = customers.filter(c => {
      return !query || 
        c.name.toLowerCase().includes(query) || 
        (c.phone && c.phone.includes(query)) ||
        (c.code && c.code.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      DOM.customersTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted p-4">لا يوجد عملاء مطابقين للبحث</td></tr>`;
      return;
    }

    filtered.forEach(c => {
      const customerInvoicesCount = invoices.filter(inv => inv.partyId === c.id || inv.partyName === c.name).length;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="text-accent">${c.code || c.id}</strong></td>
        <td><strong>${c.name}</strong></td>
        <td><i class="fa-solid fa-phone text-muted" style="margin-left: 6px;"></i>${c.phone}</td>
        <td>${c.address || '-'}</td>
        <td><span class="badge-status">${customerInvoicesCount} فاتورة</span></td>
        <td>${c.notes || '-'}</td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="btn-table-action statement" onclick="window.viewAccountStatement('customer', '${c.id}')" title="كشف حساب العميل">
              <i class="fa-solid fa-file-invoice-dollar"></i>
            </button>
            <button class="btn-table-action" onclick="window.editCustomer('${c.id}')" title="تعديل العميل">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-table-action whatsapp" onclick="window.sendStatementWhatsAppDirect('customer', '${c.id}')" title="إرسال كشف الحساب عبر واتساب">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
            <button class="btn-table-action delete" onclick="window.deleteCustomer('${c.id}')" title="حذف العميل">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      DOM.customersTableBody.appendChild(tr);
    });
  }

  function openCustomerModal(customerId = null) {
    const DOM = App.DOM;
    if (!DOM) return;
    if (customerId) {
      const customer = AppStore.getCustomers().find(c => c.id === customerId);
      if (!customer) return;
      DOM.customerModalTitle.textContent = 'تعديل بيانات العميل';
      DOM.customerFormId.value = customer.id;
      DOM.customerFormName.value = customer.name;
      DOM.customerFormCode.value = customer.code || '';
      DOM.customerFormPhone.value = customer.phone;
      DOM.customerFormAddress.value = customer.address || '';
      DOM.customerFormNotes.value = customer.notes || '';
    } else {
      DOM.customerModalTitle.textContent = 'إضافة عميل جديد';
      DOM.customerForm.reset();
      DOM.customerFormId.value = '';
      DOM.customerFormCode.value = 'CUS-' + (AppStore.getCustomers().length + 101);
    }
    DOM.customerModal.classList.add('open');
  }

  function saveCustomerForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const DOM = App.DOM;
    if (!DOM) return;
    const id = DOM.customerFormId.value;
    const name = DOM.customerFormName.value.trim();
    const code = DOM.customerFormCode.value.trim();
    const phone = DOM.customerFormPhone.value.trim();
    const address = DOM.customerFormAddress.value.trim();
    const notes = DOM.customerFormNotes.value.trim();

    let customers = AppStore.getCustomers();

    if (id) {
      customers = customers.map(c => {
        if (c.id === id) {
          return { ...c, name, code, phone, address, notes };
        }
        return c;
      });
      App.Utils.showToast('تم تحديث بيانات العميل بنجاح');
    } else {
      const newId = 'CUS-' + Date.now();
      customers.push({
        id: newId,
        name,
        code: code || 'CUS-' + (customers.length + 101),
        phone,
        address,
        notes,
        createdAt: new Date().toISOString().split('T')[0]
      });
      App.Utils.showToast('تمت إضافة العميل الجديد بنجاح');
    }

    AppStore.saveCustomers(customers);
    DOM.customerModal.classList.remove('open');
    renderCustomersTable();
    refreshPOS();
  }

  window.editCustomer = (id) => openCustomerModal(id);
  window.chatWhatsApp = (phone) => {
    const clean = App.Utils.cleanPhoneForWhatsApp(phone);
    window.open(`https://wa.me/${clean}`, '_blank');
  };
  window.deleteCustomer = (id) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      const list = AppStore.getCustomers().filter(c => c.id !== id);
      AppStore.saveCustomers(list);
      renderCustomersTable();
      refreshPOS();
      App.Utils.showToast('تم حذف العميل بنجاح');
    }
  };

  // ================= 3. SUPPLIERS CRUD =================
  function renderSuppliersTable() {
    const DOM = App.DOM;
    if (!DOM || !DOM.suppliersTableBody) return;
    const suppliers = AppStore.getSuppliers();
    const query = (DOM.searchSuppliersInput ? DOM.searchSuppliersInput.value : '').trim().toLowerCase();

    DOM.suppliersTableBody.innerHTML = '';

    const filtered = suppliers.filter(s => {
      return !query || 
        s.name.toLowerCase().includes(query) || 
        (s.phone && s.phone.includes(query)) ||
        (s.supplies && s.supplies.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      DOM.suppliersTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted p-4">لا يوجد موردين مطابقين للبحث</td></tr>`;
      return;
    }

    filtered.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="text-accent">${s.code || s.id}</strong></td>
        <td><strong>${s.name}</strong></td>
        <td><i class="fa-solid fa-phone text-muted" style="margin-left: 6px;"></i>${s.phone}</td>
        <td>${s.address || '-'}</td>
        <td><span class="badge-status">${s.supplies || 'خامات عامة'}</span></td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="btn-table-action statement" onclick="window.viewAccountStatement('supplier', '${s.id}')" title="كشف حساب المورد">
              <i class="fa-solid fa-file-invoice-dollar"></i>
            </button>
            <button class="btn-table-action" onclick="window.editSupplier('${s.id}')" title="تعديل المورد">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-table-action whatsapp" onclick="window.sendStatementWhatsAppDirect('supplier', '${s.id}')" title="إرسال كشف الحساب عبر واتساب">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
            <button class="btn-table-action delete" onclick="window.deleteSupplier('${s.id}')" title="حذف المورد">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      DOM.suppliersTableBody.appendChild(tr);
    });
  }

  function openSupplierModal(supplierId = null) {
    const DOM = App.DOM;
    if (!DOM) return;
    if (supplierId) {
      const supplier = AppStore.getSuppliers().find(s => s.id === supplierId);
      if (!supplier) return;
      DOM.supplierModalTitle.textContent = 'تعديل بيانات المورد';
      DOM.supplierFormId.value = supplier.id;
      DOM.supplierFormName.value = supplier.name;
      DOM.supplierFormCode.value = supplier.code || '';
      DOM.supplierFormPhone.value = supplier.phone;
      DOM.supplierFormAddress.value = supplier.address || '';
      DOM.supplierFormSupplies.value = supplier.supplies || '';
    } else {
      DOM.supplierModalTitle.textContent = 'إضافة مورد جديد';
      DOM.supplierForm.reset();
      DOM.supplierFormId.value = '';
      DOM.supplierFormCode.value = 'SUP-' + (AppStore.getSuppliers().length + 201);
    }
    DOM.supplierModal.classList.add('open');
  }

  function saveSupplierForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const DOM = App.DOM;
    if (!DOM) return;
    const id = DOM.supplierFormId.value;
    const name = DOM.supplierFormName.value.trim();
    const code = DOM.supplierFormCode.value.trim();
    const phone = DOM.supplierFormPhone.value.trim();
    const address = DOM.supplierFormAddress.value.trim();
    const supplies = DOM.supplierFormSupplies.value.trim();

    let suppliers = AppStore.getSuppliers();

    if (id) {
      suppliers = suppliers.map(s => {
        if (s.id === id) {
          return { ...s, name, code, phone, address, supplies };
        }
        return s;
      });
      App.Utils.showToast('تم تحديث بيانات المورد بنجاح');
    } else {
      const newId = 'SUP-' + Date.now();
      suppliers.push({
        id: newId,
        name,
        code: code || 'SUP-' + (suppliers.length + 201),
        phone,
        address,
        supplies,
        createdAt: new Date().toISOString().split('T')[0]
      });
      App.Utils.showToast('تمت إضافة المورد الجديد بنجاح');
    }

    AppStore.saveSuppliers(suppliers);
    DOM.supplierModal.classList.remove('open');
    renderSuppliersTable();
    refreshPOS();
  }

  window.editSupplier = (id) => openSupplierModal(id);
  window.deleteSupplier = (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      const list = AppStore.getSuppliers().filter(s => s.id !== id);
      AppStore.saveSuppliers(list);
      renderSuppliersTable();
      refreshPOS();
      App.Utils.showToast('تم حذف المورد بنجاح');
    }
  };

  // ================= 4. OVENS CRUD =================
  function renderOvensTable() {
    const DOM = App.DOM;
    if (!DOM || !DOM.ovensTableBody) return;
    const ovens = AppStore.getOvens();
    const invoices = AppStore.getInvoices();
    const query = (DOM.searchOvensInput ? DOM.searchOvensInput.value : '').trim().toLowerCase();

    DOM.ovensTableBody.innerHTML = '';

    const filtered = ovens.filter(o => {
      return !query || 
        o.name.toLowerCase().includes(query) || 
        (o.phone && o.phone.includes(query)) ||
        (o.address && o.address.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      DOM.ovensTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted p-4">لا توجد أفران مطابقة للبحث</td></tr>`;
      return;
    }

    filtered.forEach(o => {
      const ordersCount = invoices.filter(inv => inv.partyId === o.id || inv.partyName === o.name).length;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="text-accent">${o.code || o.id}</strong></td>
        <td><strong>${o.name}</strong></td>
        <td><i class="fa-solid fa-phone text-muted" style="margin-left: 6px;"></i>${o.phone}</td>
        <td>${o.address}</td>
        <td><span class="badge-status" style="color: #f87171; border-color: rgba(248,113,113,0.3);"><i class="fa-solid fa-fire"></i> ${ordersCount} أمر تشغيل</span></td>
        <td>${o.notes || 'تشغيل وصهر معادن'}</td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="btn-table-action statement" onclick="window.viewAccountStatement('oven', '${o.id}')" title="كشف حساب وأوامر الفرن">
              <i class="fa-solid fa-file-invoice-dollar"></i>
            </button>
            <button class="btn-table-action" onclick="window.editOven('${o.id}')" title="تعديل بيانات الفرن">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-table-action whatsapp" onclick="window.sendStatementWhatsAppDirect('oven', '${o.id}')" title="إرسال كشف الحساب عبر واتساب">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
            <button class="btn-table-action delete" onclick="window.deleteOven('${o.id}')" title="حذف الفرن">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      DOM.ovensTableBody.appendChild(tr);
    });
  }

  function openOvenModal(ovenId = null) {
    const DOM = App.DOM;
    if (!DOM) return;
    if (ovenId) {
      const oven = AppStore.getOvens().find(o => o.id === ovenId);
      if (!oven) return;
      DOM.ovenModalTitle.textContent = 'تعديل بيانات الفرن';
      DOM.ovenFormId.value = oven.id;
      DOM.ovenFormName.value = oven.name;
      DOM.ovenFormCode.value = oven.code || '';
      DOM.ovenFormPhone.value = oven.phone;
      DOM.ovenFormAddress.value = oven.address;
      DOM.ovenFormNotes.value = oven.notes || '';
    } else {
      DOM.ovenModalTitle.textContent = 'إضافة فرن جديد';
      DOM.ovenForm.reset();
      DOM.ovenFormId.value = '';
      DOM.ovenFormCode.value = 'OVN-' + (AppStore.getOvens().length + 301);
    }
    DOM.ovenModal.classList.add('open');
  }

  function saveOvenForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const DOM = App.DOM;
    if (!DOM) return;
    const id = DOM.ovenFormId.value;
    const name = DOM.ovenFormName.value.trim();
    const code = DOM.ovenFormCode.value.trim();
    const phone = DOM.ovenFormPhone.value.trim();
    const address = DOM.ovenFormAddress.value.trim();
    const notes = DOM.ovenFormNotes.value.trim();

    let ovens = AppStore.getOvens();

    if (id) {
      ovens = ovens.map(o => {
        if (o.id === id) {
          return { ...o, name, code, phone, address, notes };
        }
        return o;
      });
      App.Utils.showToast('تم تحديث بيانات الفرن بنجاح');
    } else {
      const newId = 'OVN-' + Date.now();
      ovens.push({
        id: newId,
        name,
        code: code || 'OVN-' + (ovens.length + 301),
        phone,
        address,
        notes,
        createdAt: new Date().toISOString().split('T')[0]
      });
      App.Utils.showToast('تمت إضافة الفرن الجديد بنجاح');
    }

    AppStore.saveOvens(ovens);
    DOM.ovenModal.classList.remove('open');
    renderOvensTable();
    refreshPOS();
  }

  window.editOven = (id) => openOvenModal(id);
  window.deleteOven = (id) => {
    if (confirm('هل أنت متأكد من حذف بيانات هذا الفرن؟')) {
      const list = AppStore.getOvens().filter(o => o.id !== id);
      AppStore.saveOvens(list);
      renderOvensTable();
      refreshPOS();
      App.Utils.showToast('تم حذف الفرن بنجاح');
    }
  };

  // ================= 5. CUTTERS CRUD =================
  function renderCuttersTable() {
    const DOM = App.DOM;
    if (!DOM || !DOM.cuttersTableBody) return;
    const cutters = AppStore.getCutters();
    const invoices = AppStore.getInvoices();
    const query = (DOM.searchCuttersInput ? DOM.searchCuttersInput.value : '').trim().toLowerCase();

    DOM.cuttersTableBody.innerHTML = '';

    const filtered = cutters.filter(c => {
      return !query || 
        c.name.toLowerCase().includes(query) || 
        (c.phone && c.phone.includes(query)) ||
        (c.address && c.address.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      DOM.cuttersTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted p-4">لا توجد مقصات مطابقة للبحث</td></tr>`;
      return;
    }

    filtered.forEach(c => {
      const ordersCount = invoices.filter(inv => inv.partyId === c.id || inv.partyName === c.name).length;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="text-accent">${c.code || c.id}</strong></td>
        <td><strong>${c.name}</strong></td>
        <td><i class="fa-solid fa-phone text-muted" style="margin-left: 6px;"></i>${c.phone || '-'}</td>
        <td>${c.address || '-'}</td>
        <td><span class="badge-status" style="color: #a855f7; border-color: rgba(168,85,247,0.3);"><i class="fa-solid fa-scissors"></i> ${ordersCount} أمر قص</span></td>
        <td>${c.notes || 'تشغيل وقص مقصات'}</td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="btn-table-action statement" onclick="window.viewAccountStatement('cutter', '${c.id}')" title="كشف أوامر المقص">
              <i class="fa-solid fa-file-invoice-dollar"></i>
            </button>
            <button class="btn-table-action" onclick="window.editCutter('${c.id}')" title="تعديل بيانات المقص">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-table-action whatsapp" onclick="window.sendStatementWhatsAppDirect('cutter', '${c.id}')" title="إرسال كشف الأوامر عبر واتساب">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
            <button class="btn-table-action delete" onclick="window.deleteCutter('${c.id}')" title="حذف المقص">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      DOM.cuttersTableBody.appendChild(tr);
    });
  }

  function openCutterModal(cutterId = null) {
    const DOM = App.DOM;
    if (!DOM) return;
    if (cutterId) {
      const cutter = AppStore.getCutters().find(c => c.id === cutterId);
      if (!cutter) return;
      DOM.cutterModalTitle.textContent = 'تعديل بيانات المقص';
      DOM.cutterFormId.value = cutter.id;
      DOM.cutterFormName.value = cutter.name;
      DOM.cutterFormCode.value = cutter.code || '';
      DOM.cutterFormPhone.value = cutter.phone || '';
      DOM.cutterFormAddress.value = cutter.address || '';
      DOM.cutterFormNotes.value = cutter.notes || '';
    } else {
      DOM.cutterModalTitle.textContent = 'إضافة مقص جديد';
      DOM.cutterForm.reset();
      DOM.cutterFormId.value = '';
      DOM.cutterFormCode.value = 'CUT-' + (AppStore.getCutters().length + 401);
    }
    DOM.cutterModal.classList.add('open');
  }

  function saveCutterForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const DOM = App.DOM;
    if (!DOM) return;
    const id = DOM.cutterFormId.value;
    const name = DOM.cutterFormName.value.trim();
    const code = DOM.cutterFormCode.value.trim();
    const phone = DOM.cutterFormPhone.value.trim();
    const address = DOM.cutterFormAddress.value.trim();
    const notes = DOM.cutterFormNotes.value.trim();

    let cutters = AppStore.getCutters();

    if (id) {
      cutters = cutters.map(c => {
        if (c.id === id) {
          return { ...c, name, code, phone, address, notes };
        }
        return c;
      });
      App.Utils.showToast('تم تحديث بيانات المقص بنجاح');
    } else {
      const newId = 'CUT-' + Date.now();
      cutters.push({
        id: newId,
        name,
        code: code || 'CUT-' + (cutters.length + 401),
        phone,
        address,
        notes,
        createdAt: new Date().toISOString().split('T')[0]
      });
      App.Utils.showToast('تمت إضافة المقص الجديد بنجاح');
    }

    AppStore.saveCutters(cutters);
    DOM.cutterModal.classList.remove('open');
    renderCuttersTable();
    refreshPOS();
  }

  window.editCutter = (id) => openCutterModal(id);
  window.deleteCutter = (id) => {
    if (confirm('هل أنت متأكد من حذف بيانات هذا المقص؟')) {
      const list = AppStore.getCutters().filter(c => c.id !== id);
      AppStore.saveCutters(list);
      renderCuttersTable();
      refreshPOS();
      App.Utils.showToast('تم حذف المقص بنجاح');
    }
  };

  App.Entities = {
    renderItems: renderItemsTable,
    renderItemsTable: renderItemsTable,
    openItemModal,
    saveItem: saveItemForm,
    saveItemForm: saveItemForm,
    renderCustomers: renderCustomersTable,
    renderCustomersTable: renderCustomersTable,
    openCustomerModal,
    saveCustomer: saveCustomerForm,
    saveCustomerForm: saveCustomerForm,
    renderSuppliers: renderSuppliersTable,
    renderSuppliersTable: renderSuppliersTable,
    openSupplierModal,
    saveSupplier: saveSupplierForm,
    saveSupplierForm: saveSupplierForm,
    renderOvens: renderOvensTable,
    renderOvensTable: renderOvensTable,
    openOvenModal,
    saveOven: saveOvenForm,
    saveOvenForm: saveOvenForm,
    renderCutters: renderCuttersTable,
    renderCuttersTable: renderCuttersTable,
    openCutterModal,
    saveCutter: saveCutterForm,
    saveCutterForm: saveCutterForm,
    renderAllTables: function () {
      renderItemsTable();
      renderCustomersTable();
      renderSuppliersTable();
      renderOvensTable();
      renderCuttersTable();
    }
  };

})(window.App);
