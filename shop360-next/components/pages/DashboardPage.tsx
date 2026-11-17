const html = `
<div class="page-head dashboard-head"><div><div class="eyebrow">BUSINESS OVERVIEW <span class="dash-demo-tag">DEMO DATA</span></div><h1>Good afternoon</h1><p>Here's what's happening across your business today.</p></div><div class="dash-actions"><button class="btn secondary" onclick="openModal('product')">＋ Add product &amp; stock</button><button class="btn primary" onclick="navigate('pos')"><svg aria-hidden="true" class="ui-icon" fill="none" focusable="false" height="17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewbox="0 0 24 24" width="17"><path d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 7H6"></path><circle cx="10" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle></svg> New sale</button></div></div>
<div class="cards" id="dashboardStats"></div>
<div aria-live="polite" class="dashboard-insight-rail" id="dashboardInsightRail"></div>
<div class="grid2">
<div class="panel dashboard-panel sales-panel"><div class="panel-head"><div><h3>Sales overview</h3><div class="panel-sub">Sales for the last 7 days · MWK</div></div><div class="legend"><span><i style="background:#c9e8d9"></i>Previous days</span><span><i style="background:var(--brand)"></i>Today</span></div></div><div class="bars" id="salesBars"></div></div>
<div class="panel dashboard-panel stock-panel"><div class="panel-head"><div><h3>Stock health</h3><div class="panel-sub">Items that may need attention</div></div><button class="btn secondary" onclick="navigate('inventory')">View stock</button></div><div class="alert-list" id="alerts"></div></div>
</div>
<div class="panel table-panel dashboard-activity"><div class="table-tools"><div><h3>Recent activity</h3><div class="panel-sub">Latest demo transactions and stock movements</div></div><button class="btn secondary" onclick="navigate('reports')">View reports →</button></div><div class="table-wrap"><table><thead><tr><th>Activity</th><th>Reference</th><th>Location</th><th>Quantity</th><th>When</th><th>Status</th></tr></thead><tbody id="activityRows"></tbody></table></div></div>
`;

export default function DashboardPage() {
  return <section id="page-dashboard" className="page" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
