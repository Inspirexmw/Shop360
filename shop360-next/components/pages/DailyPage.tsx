const html = `
<div class="page-head"><div><div class="eyebrow">END OF DAY</div><h1>Daily sales report</h1><p>Everything sold on a given day: payments, credit and receipts.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input class="filter" id="dailyDate" onchange="renderDaily()" type="date"/><button class="btn primary" onclick="printDaily()">🖨 Print report</button></div></div>
<div class="cards" id="dailyStats"></div>
<div class="panel" style="margin-bottom:18px"><div class="panel-head"><div><h3>Money received</h3><div class="panel-sub">By payment method</div></div></div><div id="dailyMethods"></div></div>
<div class="panel" style="margin-bottom:18px"><div class="panel-head"><div><h3>Cashbook for the day</h3><div class="panel-sub">Money in, money out and expenses</div></div><button class="btn secondary" onclick="finOpenDay()">Open in Finance</button></div><div id="dailyCash"></div></div>
<div class="panel table-panel"><div class="table-tools"><div><h3>Transactions</h3><div class="panel-sub" id="dailySub"></div></div></div><div class="table-wrap"><table><thead><tr><th>Time</th><th>Receipt</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Paid</th><th>Status</th><th></th></tr></thead><tbody id="dailyRows"></tbody></table></div></div>
`;

export default function DailyPage() {
  return <section id="page-daily" className="page hidden" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
