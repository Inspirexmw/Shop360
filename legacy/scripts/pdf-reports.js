/* ---------- PDF reports: ledger style, A4, generated in the browser with jsPDF ---------- */
const PDFR={M:14,W:210,H:297,CW:182,LIMIT:275,LIB:'/vendor/jspdf.umd.min.js'};

function pdfLoadLib(){
  if(window.jspdf&&window.jspdf.jsPDF)return Promise.resolve(window.jspdf.jsPDF);
  return new Promise((res,rej)=>{const s=document.createElement('script');s.src=PDFR.LIB;s.onload=()=>window.jspdf&&window.jspdf.jsPDF?res(window.jspdf.jsPDF):rej(new Error('PDF library unavailable'));s.onerror=()=>rej(new Error('PDF library failed to load'));document.head.appendChild(s)});
}

// Converts the saved business logo to greyscale PNG so it prints cleanly in a ledger
function pdfLogo(src){
  return new Promise(res=>{
    if(!src)return res(null);
    const im=new Image();
    im.onload=()=>{try{
      const s=Math.min(1,800/Math.max(im.width,im.height));
      const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));
      const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);
      const d=g.getImageData(0,0,c.width,c.height),p=d.data;
      for(let i=0;i<p.length;i+=4){const v=0.299*p[i]+0.587*p[i+1]+0.114*p[i+2];p[i]=p[i+1]=p[i+2]=v}
      g.putImageData(d,0,0);
      res({url:c.toDataURL('image/png'),w:c.width,h:c.height});
    }catch(e){res(null)}};
    im.onerror=()=>res(null);
    im.src=src;
  });
}

function pdfNew(JsPDF,title,period){
  const doc=new JsPDF({unit:'mm',format:'a4',orientation:'portrait'});
  doc.setProperties({title:SHOP.name+' · '+title,subject:period,author:SHOP.name,creator:'Shop360'});
  return {doc,y:0,title,period,logo:null};
}

function pdfStamp(){const d=new Date();return fmtDate(todayKey())+' '+nowTime()}

function pdfHeaderFirst(c){
  const {doc,M,W}=Object.assign(c,{M:PDFR.M,W:PDFR.W});
  let tx=M;
  if(c.logo){const maxW=40,maxH=15;let w=maxW,h=w*c.logo.h/c.logo.w;if(h>maxH){h=maxH;w=h*c.logo.w/c.logo.h}doc.addImage(c.logo.url,'PNG',M,12,w,h);tx=M+w+5}
  doc.setTextColor(0);
  doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text(SHOP.name||'Business',tx,18);
  doc.setFont('helvetica','normal');doc.setFontSize(8.5);
  let ly=23;
  if(SHOP.address){doc.text(String(SHOP.address),tx,ly);ly+=4}
  const contact=[SHOP.phone,SHOP.vatOn&&SHOP.tin?'TIN '+SHOP.tin:''].filter(Boolean).join('  ·  ');
  if(contact){doc.text(contact,tx,ly);}
  doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text(c.title.toUpperCase(),W-M,18,{align:'right'});
  doc.setFont('helvetica','normal');doc.setFontSize(8.5);
  doc.text(c.period,W-M,23,{align:'right'});
  doc.text('Printed '+pdfStamp(),W-M,27.5,{align:'right'});
  doc.setLineWidth(0.7);doc.line(M,32,W-M,32);
  doc.setLineWidth(0.2);doc.line(M,33.4,W-M,33.4);
  c.y=41;
}

function pdfHeaderNext(c){
  const {doc,M,W}=Object.assign(c,{M:PDFR.M,W:PDFR.W});
  doc.setTextColor(0);doc.setFont('helvetica','bold');doc.setFontSize(8.5);
  doc.text((SHOP.name||'Business')+'  ·  '+c.title,M,11);
  doc.setFont('helvetica','normal');doc.text(c.period,W-M,11,{align:'right'});
  doc.setLineWidth(0.4);doc.line(M,13.5,W-M,13.5);
  c.y=21;
}

function pdfNewPage(c){c.doc.addPage();c.pageBreak=true;pdfHeaderNext(c)}

function pdfEnsure(c,h){if(c.y+h>PDFR.LIMIT)pdfNewPage(c)}

function pdfSection(c,text){
  pdfEnsure(c,16);
  const {doc,M,W}=Object.assign(c,{M:PDFR.M,W:PDFR.W});
  c.y+=4;
  doc.setTextColor(0);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(text.toUpperCase(),M,c.y);
  c.y+=2;doc.setLineWidth(0.35);doc.line(M,c.y,W-M,c.y);
  c.y+=4.5;
}

// rows: [label, value, bold?]
function pdfLedger(c,rows){
  const {doc,M,W}=Object.assign(c,{M:PDFR.M,W:PDFR.W});
  rows.forEach(([l,v,b])=>{
    pdfEnsure(c,6);
    doc.setTextColor(0);doc.setFont('helvetica',b?'bold':'normal');doc.setFontSize(9);
    doc.text(String(l),M+1.5,c.y);
    doc.text(String(v),W-M-1.5,c.y,{align:'right'});
    c.y+=2.2;doc.setLineWidth(b?0.3:0.1);doc.setDrawColor(b?0:150);doc.line(M,c.y,W-M,c.y);doc.setDrawColor(0);
    c.y+=3.6;
  });
  c.y+=1;
}

// cols: [{h,w,a}], rows: array of string arrays, opts.total: last row bold
function pdfTable(c,cols,rows,opts){
  const {doc,M,W}=Object.assign(c,{M:PDFR.M,W:PDFR.W});
  opts=opts||{};
  const FS=8,LH=3.5;
  const drawHead=()=>{
    pdfEnsure(c,9);
    doc.setFont('helvetica','bold');doc.setFontSize(FS);doc.setTextColor(0);
    let x=M;cols.forEach(col=>{const tx=col.a==='r'?x+col.w-1.5:x+1.5;doc.text(col.h,tx,c.y+3,{align:col.a==='r'?'right':'left'});x+=col.w});
    c.y+=4.5;doc.setLineWidth(0.35);doc.line(M,c.y,W-M,c.y);c.y+=1.2;
  };
  drawHead();
  if(!rows.length){pdfEnsure(c,8);doc.setFont('helvetica','italic');doc.setFontSize(FS);doc.text(opts.empty||'No records for this period.',M+1.5,c.y+4);c.y+=8;doc.setFont('helvetica','normal');return}
  rows.forEach((row,ri)=>{
    doc.setFont('helvetica',(opts.total&&ri===rows.length-1)?'bold':'normal');doc.setFontSize(FS);
    const cells=cols.map((col,i)=>doc.splitTextToSize(String(row[i]??''),col.w-3));
    const lines=Math.max(1,...cells.map(x=>x.length));
    const h=lines*LH+2;
    if(c.y+h>PDFR.LIMIT){pdfNewPage(c);drawHead();doc.setFont('helvetica',(opts.total&&ri===rows.length-1)?'bold':'normal');doc.setFontSize(FS)}
    let x=M;
    cols.forEach((col,i)=>{
      const tx=col.a==='r'?x+col.w-1.5:x+1.5;
      cells[i].forEach((t,k)=>doc.text(t,tx,c.y+2.9+k*LH,{align:col.a==='r'?'right':'left'}));
      x+=col.w;
    });
    c.y+=h;
    doc.setLineWidth(0.1);doc.setDrawColor(150);doc.line(M,c.y,W-M,c.y);doc.setDrawColor(0);
  });
  c.y+=3;
}

function pdfNote(c,text){
  const {doc,M}=Object.assign(c,{M:PDFR.M});
  doc.setFont('helvetica','italic');doc.setFontSize(7.5);doc.setTextColor(0);
  const lines=doc.splitTextToSize(text,PDFR.CW);
  pdfEnsure(c,lines.length*3.4+2);
  doc.text(lines,M,c.y);c.y+=lines.length*3.4+3;
}

function pdfSignature(c){
  const {doc,M,W}=Object.assign(c,{M:PDFR.M,W:PDFR.W});
  pdfEnsure(c,40);
  c.y+=10;
  const boxes=[[M,'Prepared by'],[W-M-72,'Reviewed and approved by']];
  boxes.forEach(([x,label])=>{
    doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(0);
    doc.setLineWidth(0.3);doc.line(x,c.y+12,x+72,c.y+12);
    doc.text('Signature',x,c.y+16);
    doc.line(x,c.y+24,x+72,c.y+24);
    doc.text('Name',x,c.y+28);
    doc.text('Date',x+40,c.y+28);
    doc.setFont('helvetica','bold');doc.text(label,x,c.y+6);
  });
  c.y+=34;
}

function pdfFooters(c){
  const {doc,M,W}=Object.assign(c,{M:PDFR.M,W:PDFR.W});
  const n=doc.getNumberOfPages();
  for(let i=1;i<=n;i++){
    doc.setPage(i);
    doc.setDrawColor(0);doc.setLineWidth(0.2);doc.line(M,286,W-M,286);
    doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(0);
    doc.text('Generated from Shop360 records. Amounts in K.',M,290);
    doc.text('Page '+i+' of '+n,W-M,290,{align:'right'});
  }
}

function pdfSlug(s){return String(s||'shop').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'shop'}

async function pdfRun(build,mode){
  try{
    document.body.style.cursor='progress';
    const JsPDF=await pdfLoadLib();
    const logo=await pdfLogo(SHOP.theme&&SHOP.theme.logo);
    const out=build(JsPDF,logo);
    if(!out)return;
    if(mode==='download'){out.doc.save(out.filename);return}
    const url=URL.createObjectURL(out.doc.output('blob'));
    const f=document.createElement('iframe');
    f.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';
    f.onload=()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){window.open(url,'_blank')}};
    f.src=url;document.body.appendChild(f);
    setTimeout(()=>{f.remove();URL.revokeObjectURL(url)},120000);
  }catch(err){
    console.error(err);
    alert('Could not create the PDF: '+(err&&err.message?err.message:err));
  }finally{document.body.style.cursor=''}
}

/* ----- Daily sales report ----- */
function pdfDailyRun(mode){
  const date=document.getElementById('dailyDate').value||todayKey();
  return pdfRun((JsPDF,logo)=>{
    const d=dayStats(date);
    const c=pdfNew(JsPDF,'Daily sales report',fmtDate(d.date));c.logo=logo;
    pdfHeaderFirst(c);
    pdfSection(c,'Summary for the day');
    pdfLedger(c,[
      ['Net sales',money(d.net)],['Refunds',money(d.refVal)],['Money received',money(d.received)],
      ['Credit owed (all customers, current)',money(d.owed)],['Discounts given',money(d.disc)],['Pairs sold',String(d.pairs)],
      ...(SHOP.vatOn?[['VAT included',money(d.vat)]]:[]),
      ['Estimated profit',money(d.profit),true]
    ]);
    pdfSection(c,'Money received by method');
    const methods=Object.entries(d.m).map(([k,v])=>[k+' ('+v.n+')',money(v.amt)]);
    pdfLedger(c,methods.length?[...methods,['Total money received',money(d.received),true]]:[['No money received',money(0)]]);
    pdfSection(c,'Sales');
    const rows=d.list.map(t=>[t.time||'',t.id,t.lines.map(l=>(productById(l.productId)?.name||'Item')+' × '+l.qty).join(', '),t.method||'',money(t.net),money(t.paid)]);
    const tot=d.list.reduce((a,t)=>({n:a.n+t.net,p:a.p+t.paid}),{n:0,p:0});
    if(rows.length)rows.push(['','','Total ('+d.list.length+' sales)','',money(tot.n),money(tot.p)]);
    pdfTable(c,[{h:'Time',w:16,a:'l'},{h:'Receipt',w:28,a:'l'},{h:'Items',w:72,a:'l'},{h:'Payment',w:26,a:'l'},{h:'Total',w:20,a:'r'},{h:'Paid',w:20,a:'r'}],rows,{total:true,empty:'No sales recorded for this day.'});
    pdfNote(c,'Credit owed is the current outstanding balance across all customers, not only sales made on this day. Estimated profit uses the item costs recorded at the time of sale.');
    pdfSignature(c);
    pdfFooters(c);
    return {doc:c.doc,filename:pdfSlug(SHOP.name)+'-daily-sales-'+date+'.pdf'};
  },mode);
}

/* ----- Weekly, monthly, quarterly and yearly period report ----- */
function pdfPeriodRun(st,r,mode){
  const tl={week:'Weekly',month:'Monthly',quarter:'Quarterly',year:'Yearly'}[r.type]||'Period';
  return pdfRun((JsPDF,logo)=>{
    const period=r.x.label+' ('+fmtDate(r.x.from)+' to '+fmtDate(r.to)+')'+(r.open?' · in progress':'');
    const c=pdfNew(JsPDF,tl+' report',period);c.logo=logo;
    pdfHeaderFirst(c);
    pdfSection(c,'Sales');
    pdfLedger(c,[
      ['Gross sales',money(st.gross)],['Refunds',money(st.refVal)],['Net sales',money(st.net),true],
      ['Transactions',String(st.n)],['Items sold',String(st.units)],
      ['Average gross sale',money(st.n?st.gross/st.n:0)],['Average net sale',money(st.n?st.net/st.n:0)],
      ['Discounts given',money(st.disc)]
    ]);
    pdfSection(c,'Profit and expenses');
    pdfLedger(c,[
      ['Original cost of items sold in this period',money(st.cogs+st.refundCostReversal)],
      ['Returned stock cost recovered',money(st.refundCostReversal)],
      ['Net cost of goods sold (after returned stock)',money(st.cogs)],
      ['Estimated gross profit',money(st.profit)+(st.net>0?' ('+Math.round(st.profit/st.net*100)+'% of net sales)':''),true],
      ['Operating expenses',money(st.exp)],
      ...(FEATURES.expiry?[['Expired stock write-offs',money(st.stockWriteOffs)]]:[]),
      ['Estimated net profit',money(st.netProfit),true]
    ]);
    pdfSection(c,'Customer payments and cash');
    pdfLedger(c,[
      ['Customer payments received',money(st.received)],
      ['Payment-method total',money(st.collectionMethodTotal)],
      ['Collection reconciliation',st.collectionReconciled?'Reconciled':'Difference: '+money(st.collectionReconciliation)],
      ['Cash refunds paid',money(st.customerRefunds)],
      ['Customer store credit issued',money(st.customerCreditIssued)],
      ['Customer store credit restored on refunds',money(st.customerCreditRestored)],
      ['Customer store credit redeemed',money(st.storeCreditRedeemed)],
      ['Outstanding customer store credit',money(st.customerCreditOutstanding)],
      ['Wallet top-ups received',money(st.walletTopUps)],
      ['Wallet withdrawals paid',money(st.walletWithdrawals)],
      ['Net wallet funding (top-ups less withdrawals)',money(st.netWalletFunding)],
      ['Current outstanding wallet balance',money(st.walletOutstanding)],
      ['Net customer cash retained',money(st.netCustomerCash),true]
    ]);
    pdfSection(c,'Credit and balances');
    pdfLedger(c,[
      ['Original credit-sale value',money(st.creditOriginal)],
      ['Current outstanding credit on these sales',money(st.creditCurrent)],
      ['Current unpaid credit sales (all customers)',money(st.creditOwed)],
      ['Current active lay-by balances',money(st.layOwed)],
      ['Total customer balances outstanding',money(st.receivables),true]
    ]);
    pdfSection(c,'Cashbook');
    pdfLedger(c,[
      ['Stock purchases (items)',money(st.sb)],['Order extra costs',money(st.ox)],["Owner's drawings",money(st.dr)],
      ['Money in (Cashbook)',money(st.cin)],['Money out (Cashbook)',money(st.cout)]
    ]);
    pdfSection(c,'Sales by payment method (amounts collected)');
    pdfTable(c,[{h:'Method',w:142,a:'l'},{h:'Amount',w:40,a:'r'}],Object.entries(st.byM).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,money(v)]),{empty:'No collections recorded for this period.'});
    pdfSection(c,'Sales by category');
    pdfTable(c,[{h:'Category',w:142,a:'l'},{h:'Amount',w:40,a:'r'}],Object.entries(st.byC).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,money(v)]),{empty:'No category sales for this period.'});
    pdfSection(c,'Top items');
    pdfTable(c,[{h:'Product',w:112,a:'l'},{h:'Units',w:30,a:'r'},{h:'Value',w:40,a:'r'}],Object.entries(st.byI).sort((a,b)=>b[1].v-a[1].v).slice(0,8).map(([k,v])=>[k,String(v.q),money(v.v)]),{empty:'No items sold in this period.'});
    pdfSection(c,'Top customers');
    pdfTable(c,[{h:'Customer',w:142,a:'l'},{h:'Purchases',w:40,a:'r'}],Object.entries(st.byCu).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>[k,money(v)]),{empty:'No customer activity in this period.'});
    pdfSection(c,'Expenses by category');
    pdfTable(c,[{h:'Category',w:142,a:'l'},{h:'Amount',w:40,a:'r'}],Object.entries(st.expBy).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,money(v)]),{empty:'No expenses recorded for this period.'});
    pdfSection(c,'Stock now (current, not period-bound)');
    pdfLedger(c,[
      ['Items on hand',String(allPairs())],['Stock value at cost',money(allValue())],
      ['Low-stock variants',String(state.products.reduce((a,p)=>a+p.variants.filter(v=>(+v.shop||0)<=2).length,0))]
    ]);
    pdfNote(c,'Estimated profit uses the item costs recorded at the time of sale. Returned items that are restored to saleable stock reverse their original recorded cost in the return period, even when the original sale was in an earlier period; this can make net cost of goods sold negative for a period with no new sales. Damaged returns do not recover stock cost. Order extra costs are already inside item costs, so they are not subtracted again. Net profit is gross profit minus business expenses. This is an estimate, not a full accounting report.');
    pdfSignature(c);
    pdfFooters(c);
    return {doc:c.doc,filename:pdfSlug(SHOP.name)+'-'+r.type+'-report-'+r.to+'.pdf'};
  },mode);
}

/* ----- Inventory movement history and stocktake audit ----- */
function pdfInventoryRun(mode){
  return pdfRun((JsPDF,logo)=>{
    const rows=inventoryMovementRows();
    const c=pdfNew(JsPDF,'Inventory movement history',fmtDate(todayKey()));c.logo=logo;
    pdfHeaderFirst(c);
    const netQty=rows.reduce((a,r)=>a+(+r.qty||0),0);
    pdfSection(c,'Summary');
    pdfLedger(c,[
      ['Movements recorded',String(rows.length)],
      ['Net quantity change (all movements)',(netQty>0?'+':'')+netQty],
      ['Items on hand',String(allPairs())],
      ['Stock value at cost',money(allValue())]
    ]);
    pdfSection(c,'Movement history');
    pdfTable(c,[{h:'Date',w:23,a:'l'},{h:'Reference',w:22,a:'l'},{h:'Product',w:34,a:'l'},{h:'Variant',w:26,a:'l'},{h:'Type',w:26,a:'l'},{h:'Qty',w:12,a:'r'},{h:'Unit cost',w:18,a:'r'},{h:'User',w:21,a:'l'}],
      rows.map(r=>[fmtDate(r.date),r.ref,r.product,r.variant,r.type,(r.qty>0?'+':'')+r.qty,money(r.cost),r.user]),{empty:'No stock movements recorded.'});
    pdfSection(c,'Stocktake and adjustment audit');
    const audit=(state.stocktakes||[]).flatMap(st=>(st.auditLines||[]).map(x=>{const p=productById(x.productId),v=variantBySku(p,x.sku);return [fmtDate(x.date||st.posted||st.date),p?.name||'Unknown',v?v.color+' · '+v.size:x.sku,String(x.previous),String(x.counted),(x.difference>0?'+':'')+x.difference,money(x.value),x.reason||'',x.user||'-']}));
    pdfTable(c,[{h:'Date',w:22,a:'l'},{h:'Product',w:34,a:'l'},{h:'Variant',w:26,a:'l'},{h:'Before',w:14,a:'r'},{h:'Counted',w:16,a:'r'},{h:'Diff',w:12,a:'r'},{h:'Value',w:20,a:'r'},{h:'Reason',w:22,a:'l'},{h:'User',w:20,a:'l'}],audit,{empty:'No posted stocktake adjustments recorded yet.'});
    pdfNote(c,'This report reconstructs movements from saved receipts, sales, returns and adjustments. Historical user identity and batch references are only available where the transaction stored them. Potential gross profit is before operating expenses and assumes all current stock sells at the listed retail price.');
    pdfSignature(c);
    pdfFooters(c);
    return {doc:c.doc,filename:pdfSlug(SHOP.name)+'-inventory-movements-'+todayKey()+'.pdf'};
  },mode);
}
