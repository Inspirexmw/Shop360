const html = `
<div class="finance-hero">
<div class="finance-hero-copy"><div class="eyebrow">MONEY MANAGEMENT</div><h1>Finance</h1><p>See where your money comes from, where it goes, and whether your records match what you have.</p><div class="finance-hero-meta"><span><i></i> Business finances</span><span>·</span><span>MWK</span></div></div>
<div class="finance-hero-actions"><button class="btn finance-light-btn" onclick="openCashEntry('in')">＋ Money in</button><button class="btn finance-white-btn" onclick="openCashEntry('out')">＋ Record expense</button></div>
<div aria-hidden="true" class="finance-hero-art"><div class="finance-orbit orbit-one"></div><div class="finance-orbit orbit-two"></div><div class="finance-art-card"><span>AVAILABLE BALANCE</span><b>MWK</b><i>↗</i></div></div>
</div>
<div class="finance-toolbar"><label class="finance-link-order"><input id="linkOrd" onchange="setLinkOrders(this.checked)" type="checkbox"/><span><b>Link stock orders to Cashbook</b><small>Record supplier payments and order costs against your balances</small></span></label><span class="finance-section-hint">Select a section from the Finance menu</span></div>
<div id="finTabs" style="display:none"></div>
<div class="panel table-panel" id="finFilters" style="margin-bottom:12px"><div class="table-tools"><div class="tools-left" style="gap:10px;flex-wrap:wrap"><label class="muted">From <input class="filter" id="finFrom" onchange="renderFinance()" type="date"/></label><label class="muted">To <input class="filter" id="finTo" onchange="renderFinance()" type="date"/></label><select class="filter" id="finMethod" onchange="renderFinance()"><option value="">All methods</option></select></div></div></div>
<div class="cards" id="finCards"></div>
<div id="finBody"></div>
`;

export default function FinancePage() {
  return <section id="page-finance" className="page hidden" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
