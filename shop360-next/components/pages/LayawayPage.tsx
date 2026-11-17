const html = `
<div class="page-head"><div><div class="eyebrow">PAY AS YOU GO</div><h1>Lay-by</h1><p>Customer pays in instalments within an agreed period. Stock is reserved until the final payment.</p></div><button class="btn primary" onclick="openLayaway()">＋ New lay-by</button></div>
<div class="cards" id="layCards"></div>
<div class="panel table-panel"><div class="table-wrap"><table><thead><tr><th>Ref</th><th>Customer</th><th>Item</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due date</th><th>Status</th><th></th></tr></thead><tbody id="layBody"></tbody></table></div></div>
`;

export default function LayawayPage() {
  return <section id="page-layaway" className="page hidden" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
