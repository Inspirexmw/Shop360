const html = `
<div class="page-head"><div><div class="eyebrow">INBOUND INVENTORY</div><h1>Stock log</h1><p>Every delivery received directly into shop stock, plus manual adjustments such as returns and count corrections.</p></div><button class="btn primary" onclick="openModal('receive')">＋ Stock adjustment</button></div>
<div class="form-note">Record each model, color, size, quantity and unit purchase cost. Manual stock adjustments are separate from supplier purchase orders. Supplier deliveries should be received against their purchase order.</div>
<div class="panel table-panel"><div class="table-tools"><div><h3>Receiving history</h3><div class="panel-sub">Sample inbound stock records</div></div><span class="location-chip">MWK · Cost per pair</span></div><div class="table-wrap"><table><thead><tr><th>Reference</th><th>Product</th><th>Variant</th><th>Source</th><th>Supplier / discrepancy note</th><th>Pairs</th><th>Unit cost</th><th>Date</th></tr></thead><tbody id="receivingRows"></tbody></table></div></div>
`;

export default function ReceivingPage() {
  return <section id="page-receiving" className="page hidden" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
