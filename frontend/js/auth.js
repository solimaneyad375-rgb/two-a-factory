/**
 * مصنع تو-A (Factory 2-A)
 * Authentication, Users & Permissions Module (Clean Architecture)
 */

window.App = window.App || {};

(function (App) {
  'use strict';

  function loadAuthIntoUI() {
    const DOM = App.DOM;
    if (!DOM) return;
    const user = AppStore.getCurrentUser();
    if (user && DOM.currentUsernameDisplay) {
      DOM.currentUsernameDisplay.textContent = user.name || user.username;
    }
  }

  function applyCurrentUserPermissions() {
    const DOM = App.DOM;
    if (!DOM) return;
    const user = AppStore.getCurrentUser();
    if (!user) return;

    const displayName = user.name || user.username;
    const displayRole = user.role || (user.username === 'admin' ? 'مدير النظام' : 'مستخدم مصرح');

    if (DOM.currentUsernameDisplay) DOM.currentUsernameDisplay.textContent = displayName;
    if (DOM.currentUserRoleDisplay) DOM.currentUserRoleDisplay.textContent = displayRole;
    if (DOM.headerAuthUsername) DOM.headerAuthUsername.textContent = displayName;
    if (DOM.dropUserName) DOM.dropUserName.textContent = displayName;
    if (DOM.dropUserRole) DOM.dropUserRole.textContent = displayRole;

    if (DOM.settingCurrentUsernameLabel) {
      DOM.settingCurrentUsernameLabel.textContent = `${displayName} (${user.username})`;
    }

    // Control visibility of sidebar tabs
    if (DOM.navItems) {
      DOM.navItems.forEach(item => {
        const tab = item.dataset.tab;
        if (user.permissions && user.permissions[tab] === false) {
          item.style.display = 'none';
        } else {
          item.style.display = 'flex';
        }
      });
    }

    // If currently on an unauthorized tab, switch to first allowed tab
    const state = App.State;
    if (state && user.permissions && user.permissions[state.currentTab] === false) {
      const allowedTab = Object.keys(user.permissions).find(k => user.permissions[k] === true) || 'pos';
      if (typeof App.switchTab === 'function') {
        App.switchTab(allowedTab);
      }
    }
  }

  function renderUsersTable() {
    const DOM = App.DOM;
    if (!DOM || !DOM.usersTableBody) return;
    const users = AppStore.getUsers();
    DOM.usersTableBody.innerHTML = '';

    const permLabels = {
      pos: 'نقطة البيع',
      invoices: 'سجل الفواتير',
      items: 'الأصناف',
      customers: 'العملاء',
      suppliers: 'الموردين',
      ovens: 'الأفران',
      cutters: 'المقصات',
      settings: 'الإعدادات'
    };

    users.forEach((u) => {
      const tr = document.createElement('tr');
      const isMainAdmin = u.username === 'admin' || u.role === 'مدير عام' || u.id === 'USR-01';
      
      let permsHtml = '';
      if (isMainAdmin) {
        permsHtml = '<span class="badge-status" style="color: #10b981; border-color: rgba(16,185,129,0.3);"><i class="fa-solid fa-crown text-accent"></i> كافة الصلاحيات (مدير النظام)</span>';
      } else {
        const activePerms = [];
        if (u.permissions) {
          Object.keys(u.permissions).forEach(k => {
            if (u.permissions[k] && permLabels[k]) activePerms.push(permLabels[k]);
          });
        }
        permsHtml = activePerms.length > 0 
          ? activePerms.map(p => `<span class="badge-status" style="margin-left: 4px; margin-bottom: 4px;">${p}</span>`).join(' ')
          : '<span class="text-muted">بدون صلاحيات</span>';
      }

      tr.innerHTML = `
        <td><strong>${u.name}</strong></td>
        <td><strong class="text-accent">${u.username}</strong></td>
        <td><div style="display: flex; flex-wrap: wrap; gap: 4px;">${permsHtml}</div></td>
        <td>${u.createdAt || '-'}</td>
        <td class="text-center">
          <div style="display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            <button class="btn-table-action edit" onclick="window.editSystemUser('${u.id}')" title="تعديل بيانات الحساب وكلمة المرور">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            ${isMainAdmin 
              ? '<span class="badge-status" style="font-size: 0.72rem; color: #10b981; border-color: rgba(16,185,129,0.3); padding: 4px 7px;" title="حساب رئيسي محمي لا يمكن حذفه"><i class="fa-solid fa-shield"></i> محمي</span>'
              : `<button class="btn-table-action delete" onclick="window.deleteSystemUser('${u.id}')" title="حذف الحساب">
                   <i class="fa-solid fa-trash-can"></i>
                 </button>`
            }
          </div>
        </td>
      `;
      DOM.usersTableBody.appendChild(tr);
    });
  }

  function handleAddUserForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const DOM = App.DOM;
    if (!DOM) return;

    const name = DOM.newUserName.value.trim();
    const username = DOM.newUserLogin.value.trim().toLowerCase();
    const password = DOM.newUserPassword.value.trim();

    if (!name || !username || !password) {
      App.Utils.showToast('الرجاء تعبئة كافة بيانات الحساب المطلوبة', 'danger');
      return;
    }

    const users = AppStore.getUsers();
    if (users.some(u => u.username.toLowerCase() === username)) {
      App.Utils.showToast('اسم تسجيل الدخول هذا مسجل بالفعل لمستخدم آخر', 'danger');
      DOM.newUserLogin.focus();
      return;
    }

    const permissions = {
      pos: DOM.perm_pos.checked,
      invoices: DOM.perm_invoices.checked,
      items: DOM.perm_items.checked,
      customers: DOM.perm_customers.checked,
      suppliers: DOM.perm_suppliers.checked,
      ovens: DOM.perm_ovens.checked,
      cutters: DOM.perm_cutters.checked,
      settings: DOM.perm_settings.checked
    };

    const newUser = {
      id: 'USR-' + Date.now(),
      name,
      username,
      password,
      role: 'مخصص',
      permissions,
      createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    AppStore.saveUsers(users);

    DOM.addUserForm.reset();
    DOM.perm_pos.checked = true;
    DOM.perm_invoices.checked = true;
    DOM.perm_items.checked = true;
    DOM.perm_customers.checked = true;
    DOM.perm_suppliers.checked = true;
    DOM.perm_ovens.checked = true;
    DOM.perm_cutters.checked = true;
    DOM.perm_settings.checked = false;

    renderUsersTable();
    populateLockUserSelect();
    App.Utils.showToast('تمت إضافة حساب المستخدم بالصلاحيات المحددة بنجاح');
  }

  function handleEditUserForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const DOM = App.DOM;
    if (!DOM) return;

    const userId = DOM.editUserId.value;
    const name = DOM.editUserName.value.trim();
    const username = DOM.editUserLogin.value.trim().toLowerCase();
    const password = DOM.editUserPassword.value.trim();

    if (!name || !username || !password) {
      App.Utils.showToast('الرجاء إدخال اسم المستخدم واسم الدخول وكلمة المرور', 'danger');
      return;
    }

    let users = AppStore.getUsers();
    const targetIndex = users.findIndex(u => u.id === userId);
    if (targetIndex === -1) {
      App.Utils.showToast('لم يتم العثور على الحساب', 'danger');
      return;
    }

    const duplicate = users.find(u => u.id !== userId && u.username.toLowerCase() === username);
    if (duplicate) {
      App.Utils.showToast('اسم تسجيل الدخول هذا مستخدم بالفعل لحساب آخر', 'danger');
      DOM.editUserLogin.focus();
      return;
    }

    const targetUser = users[targetIndex];
    const isMainAdmin = targetUser.username === 'admin' || targetUser.role === 'مدير عام' || targetUser.id === 'USR-01';

    let updatedPermissions;
    if (isMainAdmin) {
      updatedPermissions = {
        pos: true,
        invoices: true,
        items: true,
        customers: true,
        suppliers: true,
        ovens: true,
        cutters: true,
        settings: true
      };
    } else {
      updatedPermissions = {
        pos: DOM.edit_perm_pos.checked,
        invoices: DOM.edit_perm_invoices.checked,
        items: DOM.edit_perm_items.checked,
        customers: DOM.edit_perm_customers.checked,
        suppliers: DOM.edit_perm_suppliers.checked,
        ovens: DOM.edit_perm_ovens.checked,
        cutters: DOM.edit_perm_cutters ? DOM.edit_perm_cutters.checked : true,
        settings: DOM.edit_perm_settings.checked
      };
    }

    const updatedUser = {
      ...targetUser,
      name,
      username,
      password,
      permissions: updatedPermissions
    };

    users[targetIndex] = updatedUser;
    AppStore.saveUsers(users);

    const currentUser = AppStore.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      AppStore.setCurrentUser(updatedUser);
      applyCurrentUserPermissions();
      if (DOM.currentUsernameDisplay) {
        DOM.currentUsernameDisplay.textContent = updatedUser.name || updatedUser.username;
      }
    }

    DOM.editUserModal.classList.remove('open');
    renderUsersTable();
    populateLockUserSelect();
    App.Utils.showToast('تم حفظ تعديلات الحساب بنجاح');
  }

  function populateLockUserSelect() {
    const DOM = App.DOM;
    if (!DOM || !DOM.lockUserSelect) return;
    const users = AppStore.getUsers();
    const currentUser = AppStore.getCurrentUser();
    DOM.lockUserSelect.innerHTML = '';
    users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.username;
      const roleText = u.role === 'admin' || u.username === 'admin' ? 'مدير النظام' : 'مستخدم مصرح';
      opt.textContent = `${u.name} (@${u.username}) - ${roleText}`;
      if (currentUser && currentUser.username === u.username) {
        opt.selected = true;
      }
      DOM.lockUserSelect.appendChild(opt);
    });
  }

  function triggerLockScreen(isLogout = false) {
    const DOM = App.DOM;
    if (!DOM) return;
    populateLockUserSelect();
    DOM.lockModal.style.display = 'flex';
    DOM.lockPasswordInput.value = '';
    DOM.lockErrorMsg.style.display = 'none';
    if (DOM.headerAuthDropdown) {
      DOM.headerAuthDropdown.classList.remove('open');
    }
    setTimeout(() => {
      DOM.lockPasswordInput.focus();
    }, 100);
    if (isLogout) {
      App.Utils.showToast('تم تسجيل الخروج بنجاح. اختر حساباً للدخول.', 'info');
    }
  }

  function unlockScreen(e) {
    if (e && e.preventDefault) e.preventDefault();
    const DOM = App.DOM;
    if (!DOM) return;
    const users = AppStore.getUsers();
    const selectedUsername = DOM.lockUserSelect ? DOM.lockUserSelect.value : (AppStore.getCurrentUser() ? AppStore.getCurrentUser().username : 'admin');
    const inputPass = DOM.lockPasswordInput.value;

    const matchingUser = users.find(u => u.username === selectedUsername && u.password === inputPass);

    if (matchingUser) {
      AppStore.setCurrentUser(matchingUser);
      loadAuthIntoUI();
      applyCurrentUserPermissions();
      DOM.lockModal.style.display = 'none';
      DOM.lockErrorMsg.style.display = 'none';
      DOM.lockPasswordInput.value = '';
      App.Utils.showToast(`مرحباً بك مجدداً، ${matchingUser.name}`);
    } else {
      DOM.lockErrorMsg.style.display = 'block';
      DOM.lockPasswordInput.focus();
    }
  }

  // Global window functions for table action buttons
  window.editSystemUser = function (userId) {
    const DOM = App.DOM;
    if (!DOM) return;
    const usersList = AppStore.getUsers();
    const user = usersList.find(u => u.id === userId);
    if (!user) return;

    DOM.editUserId.value = user.id;
    DOM.editUserName.value = user.name || '';
    DOM.editUserLogin.value = user.username || '';
    DOM.editUserPassword.value = user.password || '';
    DOM.editUserPassword.type = 'password';
    if (DOM.toggleEditPasswordIcon) {
      DOM.toggleEditPasswordIcon.className = 'fa-solid fa-eye';
    }

    const isMainAdmin = user.username === 'admin' || user.role === 'مدير عام' || user.id === 'USR-01';
    const perms = user.permissions || {};

    DOM.edit_perm_pos.checked = isMainAdmin || perms.pos === true;
    DOM.edit_perm_invoices.checked = isMainAdmin || perms.invoices === true;
    DOM.edit_perm_items.checked = isMainAdmin || perms.items === true;
    DOM.edit_perm_customers.checked = isMainAdmin || perms.customers === true;
    DOM.edit_perm_suppliers.checked = isMainAdmin || perms.suppliers === true;
    DOM.edit_perm_ovens.checked = isMainAdmin || perms.ovens === true;
    DOM.edit_perm_cutters.checked = isMainAdmin || perms.cutters === true;
    DOM.edit_perm_settings.checked = isMainAdmin || perms.settings === true;

    const permCheckboxes = [
      DOM.edit_perm_pos, DOM.edit_perm_invoices, DOM.edit_perm_items,
      DOM.edit_perm_customers, DOM.edit_perm_suppliers, DOM.edit_perm_ovens, DOM.edit_perm_cutters, DOM.edit_perm_settings
    ];

    if (isMainAdmin) {
      permCheckboxes.forEach(cb => { cb.disabled = true; });
      if (DOM.editAdminPermNotice) DOM.editAdminPermNotice.style.display = 'block';
    } else {
      permCheckboxes.forEach(cb => { cb.disabled = false; });
      if (DOM.editAdminPermNotice) DOM.editAdminPermNotice.style.display = 'none';
    }

    DOM.editUserModal.classList.add('open');
  };

  window.deleteSystemUser = function (userId) {
    const usersList = AppStore.getUsers();
    const target = usersList.find(u => u.id === userId);
    if (!target) return;
    if (target.username === 'admin' || target.role === 'مدير عام' || target.id === 'USR-01') {
      App.Utils.showToast('لا يمكن حذف حساب مدير النظام الرئيسي', 'danger');
      return;
    }
    const currentUser = AppStore.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      App.Utils.showToast('لا يمكنك حذف الحساب المسجل به حالياً', 'danger');
      return;
    }
    if (confirm(`هل أنت متأكد من حذف الحساب "${target.name}" (${target.username})؟`)) {
      const remaining = usersList.filter(u => u.id !== userId);
      AppStore.saveUsers(remaining);
      renderUsersTable();
      populateLockUserSelect();
      App.Utils.showToast('تم حذف الحساب بنجاح');
    }
  };

  App.Auth = {
    load: loadAuthIntoUI,
    loadAuthIntoUI: loadAuthIntoUI,
    applyPermissions: applyCurrentUserPermissions,
    applyCurrentUserPermissions: applyCurrentUserPermissions,
    renderUsers: renderUsersTable,
    renderUsersTable: renderUsersTable,
    handleAddUser: handleAddUserForm,
    handleAddUserForm: handleAddUserForm,
    handleEditUser: handleEditUserForm,
    handleEditUserForm: handleEditUserForm,
    populateLockSelect: populateLockUserSelect,
    triggerLock: triggerLockScreen,
    triggerLockScreen: triggerLockScreen,
    unlock: unlockScreen,
    unlockScreen: unlockScreen
  };

})(window.App);
