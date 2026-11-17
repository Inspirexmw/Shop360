const html = `
<div class="page-head"><div><div class="eyebrow">PLANNING</div><h1>Stock orders</h1><p>Manage supplier orders, partial deliveries, landed costs and outstanding quantities. All received goods go directly into shop stock.</p></div><button class="btn primary" onclick="openOrder()">＋ New stock order</button></div>
<div class="cards" id="ordCards"></div>
<div class="panel table-panel" style="margin-bottom:18px"><div class="table-tools"><div><h3 style="margin:0">Projected profit by category</h3><div class="panel-sub">Draft and ordered stock, after landed costs</div></div></div><div class="table-wrap" id="ordCat"></div></div>
<div class="panel table-panel"><div class="table-tools"><h3 style="margin:0">All orders</h3></div><div class="table-wrap"><table><thead><tr><th>Ref</th><th>Supplier</th><th>Status</th><th>Pairs</th><th>Total cost</th><th>Projected revenue</th><th>Projected profit</th><th>Margin</th><th>Sold so far</th><th></th></tr></thead><tbody id="ordBody"></tbody></table></div></div>
`;

export default function OrdersPage() {
  return <section id="page-orders" className="page hidden" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
