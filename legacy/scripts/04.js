/* Adaptive tables for mobile and tablets.
   This file only annotates the DOM: column labels, column roles and a "Details" toggle.
   Layout is decided in CSS (app/globals.css, "Adaptive tables"). Desktop CSS does not
   read these attributes, so desktop tables keep their current presentation.
   Rows, cells, buttons and event handlers are left untouched, so sorting, filters,
   editing, deleting, selection and bulk actions keep working. */
(function () {
  const SKIP = '.receipt,.rep,[data-rt-off]';
  const text = (el) => (el ? el.textContent : '').replace(/\s+/g, ' ').trim();

  // Column roles: 'select' (checkbox), 'act' (buttons), 'data'.
  function columnRoles(table, headerCells, bodyRows) {
    return headerCells.map((th, i) => {
      const cells = bodyRows.map((r) => r.cells[i]).filter(Boolean);
      const hasBox = cells.length && cells.every((c) => c.querySelector('input[type=checkbox]'));
      if (hasBox) return 'select';
      const hasButton = cells.some((c) => c.querySelector('button,a.btn,a[role=button]'));
      const label = text(th);
      if (hasButton && (!label || /action|manage|option|more|view|edit|delete|remove|pay|receipt/i.test(label))) return 'act';
      return 'data';
    });
  }

  function annotate(table) {
    if (table.closest(SKIP)) return;
    const thead = table.tHead;
    if (!thead || !thead.rows.length) {
      // Header-less tables (label/value pairs such as report detail rows) fit as simple tables.
      if ([...table.tBodies].some((tb) => tb.rows.length)) table.dataset.rt = 'simple';
      return;
    }
    const headerCells = [...thead.rows[thead.rows.length - 1].cells];
    const bodyRows = [...table.tBodies].flatMap((tb) => [...tb.rows]);
    if (!headerCells.length) return;

    const n = headerCells.length;
    if (!bodyRows.length) {
      // Empty tables have no rows to card up. Keep the header visible and let it fit as a simple table.
      table.dataset.rt = 'simple';
      table.dataset.rtCols = String(n);
      return;
    }
    const labels = headerCells.map(text);
    const roles = columnRoles(table, headerCells, bodyRows);
    const dataIdx = roles.map((r, i) => (r === 'data' ? i : -1)).filter((i) => i >= 0);
    const titleIdx = dataIdx[0];
    const mainIdx = dataIdx.slice(1, 3);
    // Only fold columns away when a card would otherwise be long.
    const fold = dataIdx.length > 3 ? dataIdx.slice(3) : [];

    table.dataset.rt = n <= 4 ? 'simple' : 'card';
    table.dataset.rtCols = String(n);

    bodyRows.forEach((tr) => {
      let hasSecondary = false;
      [...tr.cells].forEach((td, i) => {
        const role = roles[i];
        td.classList.remove('rt-title', 'rt-main', 'rt-sec', 'rt-act', 'rt-select', 'rt-full');
        if (td.colSpan > 1 || n === 1) { td.classList.add('rt-full'); td.removeAttribute('data-label'); return; }
        if (labels[i]) td.dataset.label = labels[i]; else td.removeAttribute('data-label');
        if (role === 'select') td.classList.add('rt-select');
        else if (role === 'act') td.classList.add('rt-act');
        else if (i === titleIdx) td.classList.add('rt-title');
        else if (mainIdx.includes(i)) td.classList.add('rt-main');
        else if (fold.includes(i)) { td.classList.add('rt-sec'); hasSecondary = true; }
        else td.classList.add('rt-main');
      });
      // Expand/collapse for the folded columns. The button lives inside the title cell,
      // so no cell is added to the row and desktop column structure does not change.
      const titleCell = tr.querySelector('td.rt-title');
      const existing = tr.querySelector('.rt-toggle');
      if (hasSecondary && titleCell) {
        if (!existing) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'rt-toggle';
          b.setAttribute('aria-expanded', 'false');
          b.setAttribute('aria-label', 'Show more details');
          titleCell.appendChild(b);
        }
      } else if (existing) {
        existing.remove();
        tr.classList.remove('rt-open');
      }
    });
  }

  function runAll() {
    document.querySelectorAll('table').forEach(annotate);
  }

  // Capture phase, so row click handlers do not fire when the toggle is pressed.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.rt-toggle');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const tr = btn.closest('tr');
    if (!tr) return;
    const open = tr.classList.toggle('rt-open');
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Hide details' : 'Show more details');
  }, true);

  let timer = 0;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(runAll, 40); };

  // Re-annotate whenever the app re-renders a table. Ignore changes that this file makes itself.
  const observer = new MutationObserver((records) => {
    const relevant = records.some((m) =>
      [...m.addedNodes, ...m.removedNodes].some((n) => !(n.nodeType === 1 && n.classList && n.classList.contains('rt-toggle')))
    );
    if (relevant) schedule();
  });

  function start() {
    runAll();
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
