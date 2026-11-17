const html = `
<div class="page-head"><div><div class="eyebrow">CUSTOMERS</div><h1>Customers</h1><p>Individuals and organizations you sell or supply to. Add them here or straight from the POS.</p></div><button class="btn primary" onclick="openCustomer()">＋ Add customer</button></div>
<div class="cards" id="custCards"></div>
<div class="grid2 cust-insights"><div class="panel cust-ranking-panel"><div class="panel-head"><div><h3>Top customers</h3><div class="panel-sub" id="custTopSub">Ranked by total spend</div></div><span class="cust-panel-mark">CUSTOMER VALUE</span></div><div class="cust-ranking-list" id="custTop"></div></div>
<div class="panel cust-attention-panel"><div class="panel-head"><div><h3>Needs attention</h3><div class="panel-sub">Accounts that may need a follow-up</div></div><span class="cust-attention-count" id="custAttentionCount">0</span></div><div class="alert-list" id="custAttn"></div></div></div>
<div class="panel table-panel cust-directory"><div class="table-tools"><div class="cust-directory-title"><h3>Customer directory</h3><div class="panel-sub" id="custDirectorySub">All registered and walk-in customers</div></div><div class="tools-left"><input class="search" id="custSearch" oninput="renderCustomers()" placeholder="Search name, phone or contact"/><select class="filter" id="custType" onchange="renderCustomers()"><option value="">All types</option><option>Individual</option><option>Organization</option></select><select class="filter" id="custTag" onchange="renderCustomers()"><option value="">All statuses</option><option>Consistent</option><option>Top spender</option><option>Owes money</option><option>Inactive 30d+</option><option>No purchases yet</option></select></div></div>
<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Visits</th><th>Total spent</th><th>Credit owed</th><th>Store credit</th><th>Last purchase</th><th>Status</th></tr></thead><tbody id="custBody"></tbody></table></div></div>
<datalist id="custList"></datalist>
`;

export default function CustomersPage() {
  return <section id="page-customers" className="page hidden" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
