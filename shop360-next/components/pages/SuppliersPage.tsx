const html = `
<div class="page-head"><div><div class="eyebrow">PURCHASING</div><h1>Suppliers</h1><p>Manage supplier profiles, purchase history, outstanding balances, payments and available supplier credits.</p></div><button class="btn primary" onclick="openSupplier()">＋ Add supplier</button></div>
<div class="cards" id="supCards"></div>
<div class="panel table-panel"><div class="table-tools"><div class="tools-left"><input class="search" id="supSearch" oninput="renderSuppliers()" placeholder="Search supplier, country or contact"/></div></div><div class="table-wrap"><table><thead><tr><th>Supplier</th><th>Country · currency</th><th>Contact</th><th>Orders</th><th>Total ordered</th><th>Last order</th></tr></thead><tbody id="supBody"></tbody></table></div></div>
`;

export default function SuppliersPage() {
  return <section id="page-suppliers" className="page hidden" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
