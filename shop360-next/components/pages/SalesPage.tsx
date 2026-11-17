const html = `
<div class="page-head"><div><div class="eyebrow">RETAIL &amp; ONLINE</div><h1>Sales &amp; orders</h1><p>Record transactions and keep inventory quantities in sync.</p></div></div>
<div class="form-note">All sales are made at the Point of Sale. Use Pay to collect a credit balance and Refund to process a return. No real payment is processed.</div>
<div class="cards" id="salesStats"></div>
<div class="panel table-panel"><div class="table-tools"><div><h3>Transactions</h3><div class="panel-sub">Recent sales</div></div><select class="filter" id="salesChannel" onchange="renderSales()"><option value="all">All channels</option><option>In-store</option><option>Online</option></select></div><div class="table-wrap"><table><thead><tr><th>Sale ref</th><th>Item</th><th>Variant</th><th>Channel</th><th>Location</th><th>Total</th><th>Payment</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody id="salesRows"></tbody></table></div></div>
`;

export default function SalesPage() {
  return <section id="page-sales" className="page hidden" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
