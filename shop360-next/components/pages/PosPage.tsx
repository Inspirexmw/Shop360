const html = `
<div class="pos-hero">
<div class="pos-hero-copy">
<div class="eyebrow">SHOP360 · SALES TERMINAL</div>
<h1>Point of Sale</h1>
<p>A faster, clearer way to serve customers and complete every sale.</p>
<div class="pos-hero-meta"><span><i></i> Ready for checkout</span><span>Stock validated at sale</span><span>Multiple payment methods</span></div>
</div>
<div class="pos-hero-actions"><button class="btn secondary" onclick="navigate('daily')"><span>▤</span> Daily report</button><div class="pos-terminal-mark"><span>360</span><small>RETAIL TERMINAL</small></div></div>
</div>
<div class="pos-demo-note"><span>i</span><div><b>Demo environment</b><small>This is a blank local testing workspace. No live payment is processed or synced across devices.</small></div></div>
<div class="pos-layout">
<div class="panel pos-catalog">
<div class="pos-section-head"><div><div class="eyebrow">PRODUCTS</div><h2>Build your sale</h2><p>Search your catalogue, choose a variant and add it to the cart.</p></div><div class="pos-catalog-count" id="posResultCount">Products</div></div>
<div class="pos-search-wrap"><span>⌕</span><input autocomplete="off" class="search pos-search" id="posSearch" inputmode="search" oninput="renderPosProducts()" placeholder="Search product name, brand or SKU…"/><kbd>/</kbd></div>
<input id="posLocation" type="hidden" value="Shop"/>
<div class="pos-catalog-tools"><div class="pos-category-chips" id="posCategoryChips"></div></div>
<div class="pos-products" id="posProducts"></div>
</div>
<button aria-label="Close cart" class="pos-cart-backdrop" onclick="togglePosCart(false)" type="button"></button>
<div class="panel pos-cart" id="posCart">
<div class="pos-cart-heading"><div><div class="eyebrow">CHECKOUT</div><h2>Current sale</h2><div class="panel-sub" id="posCartCount">0 items</div></div><div class="pos-cart-heading-actions"><button class="tiny-btn pos-clear" onclick="clearPosCart()">Clear sale</button><button aria-label="Close cart" class="pos-cart-close" onclick="togglePosCart(false)" type="button">✕</button></div></div>
<div class="pos-cart-body" id="posCartLines"><div class="empty">Your sale is empty. Add products to get started.</div></div>
<div class="pos-summary"><div class="pos-total-row"><span>Subtotal</span><b id="posSubtotal">MWK 0</b></div><div class="pos-total-row"><span>Discount</span><span id="posDiscountShown">MWK 0</span></div><div class="pos-total-row pos-grand"><span>Total due</span><strong id="posTotal">MWK 0</strong></div></div>
<div class="pos-checkout-fields">
<div class="pos-field-title"><span>PAYMENT &amp; CUSTOMER</span><small>Complete the sale details</small></div>
<div class="field"><label>DISCOUNT (OPTIONAL)</label><div class="disc-row"><select id="posDiscType" onchange="renderPosCart()"><option value="amt">MWK</option><option value="pct">%</option></select><input id="posDiscValue" min="0" oninput="renderPosCart()" placeholder="Enter discount" type="number"/></div></div>
<div class="field"><label>PAYMENT METHOD</label><select id="posPayment" onchange="updatePayUI()"><option>Cash</option><option>Bank Transfer</option><option>Airtel Money</option><option>TNM Mpamba</option><option>POS / Card</option><option>Unpaid / credit</option><option>Lay-by</option></select></div>
<div id="posCreditTermsField" style="display:none;border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--surface2)"><div class="field"><label>CREDIT PAYMENT TERMS</label><select id="posCreditTerms" onchange="updateCreditDue()"><option value="7">Pay within 7 days</option><option value="14">Pay within 14 days</option><option value="30">Pay within 30 days</option><option value="60">Pay within 60 days</option><option value="custom">Custom due date</option></select><small class="muted" id="posCreditTermsHint">Customer preference can be adjusted for this sale. Confirm the terms with the customer.</small></div><div class="field" id="posCreditCustomDueField" style="display:none"><label>CUSTOM DUE DATE</label><input id="posCreditCustomDue" onchange="updateCreditDue()" type="date"/></div><div class="form-note" id="posCreditDueSummary">Due date will appear here.</div></div>
<div class="field" id="posTenderField"><label id="posTenderLabel">AMOUNT RECEIVED (MWK)</label><input id="posTendered" inputmode="numeric" min="0" oninput="updatePayUI()" onkeydown="if(event.key==='Enter')checkoutPos()" placeholder="Enter amount received" type="number"/><div class="quick-cash" id="posQuick"></div></div>
<div class="field" id="posDepositMethodField" style="display:none"><label>DEPOSIT PAYMENT METHOD</label><select id="posDepositMethod" onchange="updatePayUI()"><option>Cash</option><option>Bank Transfer</option><option>Airtel Money</option><option>TNM Mpamba</option><option>POS / Card</option></select></div>
<div class="change-box" id="posChangeBox"></div>
<div class="field"><label>SALE TYPE</label><select id="posChannel"><option>In-store</option><option>Online</option></select></div>
<div class="field"><label>CUSTOMER <span class="pos-optional">· REQUIRED FOR CREDIT / STORE CREDIT</span></label><input id="posCustomer" list="custList" oninput="updatePayUI()" placeholder="Search or enter customer name"/><button class="btn soft pos-new-customer" onclick="openCustomer('',true)" type="button">＋ Add new customer</button></div>
<div class="field" id="posStoreCreditField" style="display:none"><label>APPLY CUSTOMER STORE CREDIT (MWK)</label><input id="posStoreCredit" inputmode="numeric" min="0" oninput="updatePayUI()" placeholder="Enter amount to use" step="1" type="number"/><small class="muted" id="posStoreCreditHint">Available store credit: MWK 0. You can use part or all of this balance.</small></div>
</div>
<button class="btn primary pos-checkout" onclick="checkoutPos()"><span id="posCheckoutLabel">Complete sale</span><b id="posButtonTotal">MWK 0</b><i>→</i></button>
<div class="pos-safe-note"><span>✓</span> Stock is checked again before the sale is saved.</div>
</div>
</div>
<div class="pos-mobile-dock"><div><b id="posMobileCount">0 items</b><small id="posMobileTotal">MWK 0</small></div><button onclick="togglePosCart(true)" type="button">View cart &amp; checkout <span aria-hidden="true">→</span></button></div>
`;

export default function PosPage() {
  return <section id="page-pos" className="page hidden" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
