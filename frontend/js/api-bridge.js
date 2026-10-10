/* FactoryTowA SQL API bridge. Keeps the existing synchronous UI model while syncing changes to SQL via ASP.NET API. */
(function () {
  'use strict';
  const API_BASE = window.FACTORY_API_URL || 'http://localhost:5080/api';
  const map = {
    settings: { key: 'twoA_settings', getter: 'getSettings', setter: 'saveSettings' },
    auth: { key: 'twoA_auth', getter: 'getAuth', setter: 'saveAuth' },
    users: { key: 'twoA_users', getter: 'getUsers', setter: 'saveUsers' },
    items: { key: 'twoA_items', getter: 'getItems', setter: 'saveItems' },
    customers: { key: 'twoA_customers', getter: 'getCustomers', setter: 'saveCustomers' },
    suppliers: { key: 'twoA_suppliers', getter: 'getSuppliers', setter: 'saveSuppliers' },
    ovens: { key: 'twoA_ovens', getter: 'getOvens', setter: 'saveOvens' },
    cutters: { key: 'twoA_cutters', getter: 'getCutters', setter: 'saveCutters' },
    invoices: { key: 'twoA_invoices', getter: 'getInvoices', setter: 'saveInvoices' }
  };
  let readyState = 'connecting';
  let pending = Promise.resolve();
  function localValue(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw == null ? fallback : JSON.parse(raw); }
    catch { return fallback; }
  }
  function writeLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  async function getResource(name) {
    const r = await fetch(`${API_BASE}/data/${encodeURIComponent(name)}`, { headers: { Accept: 'application/json' } });
    if (r.status === 404) return { found: false };
    if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
    return { found: true, data: await r.json() };
  }
  async function putResource(name, data) {
    const r = await fetch(`${API_BASE}/data/${encodeURIComponent(name)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(`${name}: HTTP ${r.status} ${await r.text()}`);
  }
  function scheduleSave(name, value) {
    // serialize writes so fast successive UI saves cannot arrive out of order
    pending = pending.then(() => putResource(name, value)).catch(err => {
      console.error('[FactoryTowA API] Save failed:', err);
      const el = document.getElementById('factoryApiStatus');
      if (el) { el.textContent = 'تعذر الحفظ على SQL Server'; el.style.background = '#b91c1c'; }
    });
  }
  function showStatus(text, color) {
    let el = document.getElementById('factoryApiStatus');
    if (!el) {
      el = document.createElement('div'); el.id = 'factoryApiStatus';
      Object.assign(el.style, { position: 'fixed', bottom: '10px', left: '10px', zIndex: '99999', padding: '7px 12px', borderRadius: '8px', color: '#fff', font: '12px Arial', boxShadow: '0 2px 8px #0003' });
      document.body.appendChild(el);
    }
    el.textContent = text; el.style.background = color;
  }
  window.FactoryApiBridge = {
    apiBase: API_BASE,
    get status() { return readyState; },
    ready: (async () => {
      try {
        const health = await fetch(`${API_BASE}/health`);
        if (!health.ok) throw new Error('API health check failed');
        // Pull server state first, so browser storage never overwrites an existing database on startup.
        for (const [name, cfg] of Object.entries(map)) {
          const remote = await getResource(name);
          if (remote.found) writeLocal(cfg.key, remote.data);
          else {
            const initial = localValue(cfg.key, name === 'settings' ? {} : []);
            await putResource(name, initial);
          }
        }
        readyState = 'connected';
        showStatus('متصل بقاعدة البيانات SQL Server', '#15803d');
      } catch (err) {
        readyState = 'offline';
        console.error('[FactoryTowA API] Startup sync failed:', err);
        showStatus('API غير متصل — البيانات المحلية فقط', '#b45309');
      }
      // Existing UI uses synchronous getters, so AppStore reads from its hydrated local cache.
      for (const [name, cfg] of Object.entries(map)) {
        const original = AppStore[cfg.setter].bind(AppStore);
        AppStore[cfg.setter] = function (value) {
          original(value);
          if (readyState === 'connected') scheduleSave(name, value);
        };
      }
      return readyState;
    })()
  };
})();
