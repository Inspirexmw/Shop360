// ---- Role-based access control for the legacy UI ----
// The server enforces roles on /api/state and /api/admin/users; this script only
// hides modules and blocks actions the signed-in role is not allowed to use.
(function () {
  const policy = window.SHOP360_RBAC;
  const role = window.SHOP360_ROLE;
  if (!policy || !role) return;

  const labels = policy.labels || {};
  const label = labels[role] || role;
  const pageAccess = {};
  (policy.modules || []).forEach(function (m) { pageAccess[m.key] = m.access || []; });

  function allowedPage(key) {
    const list = pageAccess[key];
    return !!list && list.indexOf(role) !== -1;
  }
  function allowedIntent(intent) {
    const list = (policy.intents && (policy.intents[intent] || policy.intents.general)) || [];
    return list.indexOf(role) !== -1;
  }
  function deny() {
    const msg = 'Your role (' + label + ') does not have access to this action.';
    if (typeof toast === 'function') toast(msg);
    else window.alert(msg);
  }
  function defaultIntent() {
    const page = window.SHOP360_PAGE || 'dashboard';
    if (page === 'finance') return 'finance';
    if (page === 'team') return 'users';
    if (page === 'settings') return 'settings';
    if (page === 'account') return 'general';
    if (page === 'inventory' || page === 'receiving' || page === 'orders' || page === 'suppliers') return 'inventory';
    if (page === 'sales' || page === 'pos' || page === 'customers' || page === 'layaway' || page === 'daily') return 'sales';
    return 'general';
  }
  function intentFor(handler) {
    const names = String(handler || '').match(/[A-Za-z_$][\w$]*(?=\s*\()/g) || [];
    for (let i = 0; i < names.length; i++) {
      if (policy.actions && policy.actions[names[i]]) return policy.actions[names[i]];
    }
    return null;
  }

  if (typeof navigate === 'function') {
    const originalNavigate = navigate;
    window.navigate = function (page) {
      if (!allowedPage(page)) { deny(); return; }
      window.SHOP360_PAGE = page;
      window.SHOP360_INTENT = defaultIntent();
      const result = originalNavigate.apply(this, arguments);
      if (page === 'team' && typeof renderTeamRows === 'function') renderTeamRows();
      return result;
    };
  }

  document.querySelectorAll('[data-page]').forEach(function (el) {
    if (!allowedPage(el.dataset.page)) el.style.display = 'none';
  });
  document.querySelectorAll('[data-mobile-key]').forEach(function (el) {
    const key = String(el.dataset.mobileKey || '').split(':')[0];
    if (!allowedPage(key)) el.style.display = 'none';
  });
  const financeGroup = document.getElementById('financeNavGroup');
  if (financeGroup && !allowedPage('finance')) financeGroup.style.display = 'none';
  document.querySelectorAll('.settings-card').forEach(function (el) {
    const m = /navigate\('([^']+)'\)/.exec(el.getAttribute('onclick') || '');
    if (m && !allowedPage(m[1])) el.style.display = 'none';
  });
  document.querySelectorAll('[onclick]').forEach(function (el) {
    const handler = el.getAttribute('onclick') || '';
    if (/^\s*navigate\(/.test(handler)) return;
    const intent = intentFor(handler);
    if (intent && !allowedIntent(intent)) el.style.display = 'none';
  });

  function guard(event) {
    window.SHOP360_INTENT = defaultIntent();
    const target = event.target;
    if (!target || !target.closest) return;
    const host = target.closest('[onclick],[onsubmit]');
    if (!host) return;
    const intent = intentFor(host.getAttribute('onclick') || host.getAttribute('onsubmit'));
    if (!intent) return;
    window.SHOP360_INTENT = intent;
    if (!allowedIntent(intent)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      deny();
    }
  }
  document.addEventListener('click', guard, true);
  document.addEventListener('submit', guard, true);
})();
