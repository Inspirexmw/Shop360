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
    if (page === 'audit') return 'audit';
    if (page === 'settings') return 'settings';
    if (page === 'account') return 'general';
    if (page === 'inventory' || page === 'receiving') return 'inventory';
    if (page === 'orders' || page === 'suppliers') return 'orders';
    if (page === 'daily' || page === 'reports') return 'reports';
    if (page === 'sales' || page === 'pos' || page === 'customers' || page === 'layaway') return 'sales';
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
      if (page === 'team') {
        if (typeof renderRoleRows === 'function') renderRoleRows();
        if (typeof renderTeamRows === 'function') renderTeamRows();
      }
      if (page === 'audit' && typeof renderAuditRows === 'function') renderAuditRows();
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


  // Adapt the top navigation to the signed-in user's actual module permissions.
  // A group with one available destination becomes a direct navigation item.
  function compactPermittedNavigation() {
    const nav = document.querySelector('.shop360-header .main-nav');
    if (!nav) return;
    nav.querySelectorAll('.nav-group').forEach(function (group) {
      const submenu = group.querySelector('.nav-subnav');
      if (!submenu) return;
      const children = Array.from(submenu.querySelectorAll('button[data-page]'))
        .filter(function (button) { return allowedPage(button.dataset.page); });
      if (!children.length) {
        group.style.display = 'none';
        return;
      }
      group.style.display = '';
      if (children.length === 1) {
        const direct = children[0].cloneNode(true);
        direct.classList.remove('active');
        direct.removeAttribute('aria-current');
        direct.style.display = '';
        group.replaceWith(direct);
      }
    });
    // Centre the remaining items naturally; don't preserve empty group slots.
    nav.style.justifyContent = 'center';
    nav.style.width = 'max-content';
    nav.style.minWidth = '0';
  }
  compactPermittedNavigation();

  // Global header search: searchable records are limited to modules the role can access.
  (function initHeaderGlobalSearch() {
    const input = document.getElementById('headerGlobalSearch');
    const panel = document.getElementById('headerGlobalSearchResults');
    if (!input || !panel) return;
    const clean = function (value) { return String(value == null ? '' : value).toLowerCase(); };
    function addResult(list, title, detail, page, haystack) {
      if (list.length >= 12 || !clean(haystack).includes(clean(input.value).trim())) return;
      list.push({ title: title, detail: detail, page: page });
    }
    function search() {
      const query = clean(input.value).trim();
      panel.innerHTML = '';
      if (query.length < 2) { panel.classList.remove('is-open'); return; }
      const results = [];
      if (allowedPage('inventory') && typeof state !== 'undefined') {
        (state.products || []).forEach(function (p) {
          const title = (typeof productTitle === 'function' ? productTitle(p) : (p.name || 'Product'));
          const skus = (p.variants || []).map(function (v) { return v.sku || ''; }).join(' ');
          addResult(results, title, 'Product · ' + ((p.variants || []).length ? (p.variants.length + ' variants') : 'Catalogue item'), 'inventory', [title,p.brand,p.model,p.name,skus].join(' '));
        });
      }
      if (allowedPage('customers') && typeof state !== 'undefined') {
        (state.customers || []).forEach(function (c) {
          addResult(results, c.name || 'Customer', 'Customer · ' + (c.phone || c.email || 'Customer record'), 'customers', [c.name,c.phone,c.email].join(' '));
        });
      }
      if (allowedPage('sales') && typeof state !== 'undefined') {
        (state.sales || []).forEach(function (s) {
          const ref = s.id || s.ref || s.transactionId || 'Sale';
          addResult(results, String(ref), 'Sale · ' + (s.customer || 'Walk-in customer') + (s.date ? ' · ' + s.date : ''), 'sales', [ref,s.customer,s.date,s.paymentMethod,s.method].join(' '));
        });
      }
      if (!results.length) {
        panel.innerHTML = '<div class="global-search-empty">No matching records found.</div>';
      } else {
        results.forEach(function (item) {
          const button = document.createElement('button');
          button.type = 'button'; button.className = 'global-search-result'; button.setAttribute('role','option');
          const title = document.createElement('strong'); title.textContent = item.title;
          const detail = document.createElement('small'); detail.textContent = item.detail;
          button.append(title, detail);
          button.addEventListener('click', function () {
            panel.classList.remove('is-open'); input.value = '';
            if (typeof navigate === 'function') navigate(item.page);
          });
          panel.appendChild(button);
        });
      }
      panel.classList.add('is-open');
    }
    input.addEventListener('input', search);
    input.addEventListener('focus', search);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { panel.classList.remove('is-open'); input.blur(); }
      if (event.key === 'Enter') {
        const first = panel.querySelector('.global-search-result');
        if (first) first.click();
      }
    });
    document.addEventListener('click', function (event) {
      if (!event.target.closest('.header-global-search')) panel.classList.remove('is-open');
    });
  })();
