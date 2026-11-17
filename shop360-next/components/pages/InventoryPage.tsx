const html = `
<div class="inventory-hero">
<div class="inventory-hero-copy"><div class="eyebrow">INVENTORY WORKSPACE</div><h1>Know your stock. Stay in control.</h1><p>Manage every product, variant and location from one clear workspace.</p><div class="inventory-hero-actions"><button class="btn primary" onclick="openModal('product')">＋ Add product</button><button class="btn secondary" onclick="openModal('receive')">＋ Stock adjustments</button><button class="btn secondary" onclick="openStocktake()">Start stocktake</button></div></div>
<div class="inventory-hero-art"><div class="inventory-art-orbit orbit-one"></div><div class="inventory-art-orbit orbit-two"></div><div class="inventory-art-box">▧</div><span class="art-tag tag-a">PRODUCTS</span><span class="art-tag tag-b">STOCK HEALTH</span><span class="art-tag tag-c">LOCATIONS</span></div>
</div>
<div class="inventory-stats" id="inventoryStats"></div>
<div class="inventory-insight-grid" id="inventoryInsights"></div>
<div class="inventory-catalogue-head"><div><div class="eyebrow">YOUR ASSORTMENT</div><h2>Product catalogue</h2><p id="inventoryCount">Browse and manage your products.</p></div><div class="inventory-head-actions"><button class="btn secondary" onclick="openImport()">⇪ Import products</button><button class="btn secondary" onclick="exportCSV()">↓ Export</button></div></div>
<div class="inventory-catalogue-tools"><div class="inventory-search-wrap"><span>⌕</span><input class="search" id="inventorySearch" oninput="renderInventory()" placeholder="Search by product, brand or SKU…"/></div><select class="filter" id="inventoryCategory" onchange="renderInventory()"><option value="all">All categories</option></select><select class="filter" id="inventoryStock" onchange="renderInventory()"><option value="all">Any stock status</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></div>
<div class="inventory-category-chips" id="inventoryCategoryChips"></div>
<div class="inventory-product-grid" id="inventoryProductGrid"></div>
`;

export default function InventoryPage() {
  return <section id="page-inventory" className="page hidden" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
