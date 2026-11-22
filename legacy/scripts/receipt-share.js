/* ---------- Share receipts as PDF: native share sheet, or download where sharing is not supported ----------
   Builds a narrow receipt-width PDF from the receipt already shown in the modal, so every receipt
   that has a Print button can also be shared. Uses the same jsPDF library as the reports (pdfLoadLib). */
const RCPT={W:80,PAD:4,FS:9,LH:4.3,CW:(9*0.6)/72*25.4};
RCPT.MAX=Math.floor((RCPT.W-2*RCPT.PAD)/RCPT.CW);

function rcptClean(s){return String(s).replace(/[−–—]/g,'-').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[^\x00-\xff]/g,'?')}

function rcptWrap(text,max){
  const out=[];String(text).split(/\n/).forEach(para=>{
    let line='';
    String(para).split(/\s+/).filter(Boolean).forEach(word=>{
      while(word.length>max){if(line){out.push(line);line=''}out.push(word.slice(0,max));word=word.slice(max)}
      if(!line)line=word;else if((line+' '+word).length<=max)line+=' '+word;else{out.push(line);line=word}
    });
    out.push(line);
  });
  return out.length?out:[''];
}

// Reads the receipt's DOM (divs, tables, rules, logo) into simple layout operations.
function rcptSegments(el,align){
  const out=[];let cur={s:'',b:false};
  const flush=()=>{if(cur.s.trim())out.push({t:cur.s.replace(/\s+/g,' ').trim(),bold:cur.b,align});cur={s:'',b:false}};
  const walk=n=>{
    if(n.nodeType===3){cur.s+=n.textContent;return}
    if(n.nodeType!==1)return;
    if(n.tagName==='BR'){flush();return}
    if(n.tagName==='IMG'){flush();out.push({img:n.getAttribute('src')});return}
    if(n.tagName==='B'||n.tagName==='STRONG'){if(n.textContent.trim())cur.b=true}
    [...n.childNodes].forEach(walk);
  };
  walk(el);flush();
  return out;
}

function rcptOps(root){
  const ops=[];
  const visit=el=>{
    [...el.children].forEach(n=>{
      const tag=n.tagName;
      if(tag==='HR'){ops.push({hr:true});return}
      if(tag==='TABLE'){
        [...n.rows].forEach(tr=>{
          const cells=[...tr.cells];const bold=tr.classList.contains('big')||!!tr.querySelector('b');
          if(cells.length>=2){
            ops.push({lr:[cells[0].textContent.replace(/\s+/g,' ').trim(),cells.slice(1).map(c=>c.textContent.replace(/\s+/g,' ').trim()).join(' ')],bold});
          }else if(cells.length===1){
            const txt=cells[0].textContent.replace(/\s+/g,' ').trim();
            if(txt)ops.push({segs:[{t:txt,bold:!!cells[0].querySelector('b'),align:'left'}]});
          }
        });
        return;
      }
      if(n.querySelector('table')){visit(n);return}
      const segs=rcptSegments(n,n.classList.contains('c')?'center':'left');
      if(segs.length)ops.push({segs});
    });
  };
  visit(root);
  return ops;
}

function rcptLoadImage(src){
  return new Promise(res=>{
    const im=new Image();
    im.onload=()=>{try{
      const c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;
      c.getContext('2d').drawImage(im,0,0);res({url:c.toDataURL('image/png'),w:c.width,h:c.height});
    }catch(e){res(null)}};
    im.onerror=()=>res(null);im.src=src;
  });
}

// Turns ops into wrapped lines with heights (mm). Images are loaded first so their size is known.
async function rcptLayout(ops){
  const M=RCPT.MAX,items=[];
  for(const op of ops){
    if(op.hr){items.push({k:'hr',h:3});continue}
    if(op.lr){
      const label=rcptClean(op.lr[0]),value=rcptClean(op.lr[1]);
      if(label.length+1+value.length<=M){items.push({k:'lr',label,value,bold:op.bold,h:RCPT.LH});continue}
      rcptWrap(label,M).forEach(l=>items.push({k:'text',t:l,align:'left',bold:op.bold,h:RCPT.LH}));
      items.push({k:'text',t:value,align:'right',bold:op.bold,h:RCPT.LH});
      continue;
    }
    for(const s of op.segs||[]){
      if(s.img){
        const im=await rcptLoadImage(s.img);
        if(im){const h=Math.min(12,36*im.h/im.w),w=h*im.w/im.h;items.push({k:'img',url:im.url,w,h,h2:h+1})}
        continue;
      }
      rcptWrap(rcptClean(s.t),M).forEach(l=>items.push({k:'text',t:l,align:s.align,bold:s.bold,h:RCPT.LH}));
    }
  }
  return items;
}

async function rcptBuild(root,title){
  const JsPDF=await pdfLoadLib();
  const items=await rcptLayout(rcptOps(root));
  const H=RCPT.PAD*2+4+items.reduce((a,i)=>a+(i.h2||i.h),0);
  const doc=new JsPDF({unit:'mm',format:[RCPT.W,H],orientation:'portrait'});
  doc.setProperties({title:rcptClean(title),subject:rcptClean(title),author:SHOP.name,creator:'Shop360'});
  let y=RCPT.PAD+4;
  const X=RCPT.PAD,R=RCPT.W-RCPT.PAD,C=RCPT.W/2;
  items.forEach(it=>{
    if(it.k==='hr'){doc.setLineDashPattern([0.8,0.8],0);doc.setDrawColor(120);doc.line(X,y-1.2,R,y-1.2);doc.setLineDashPattern([],0);y+=it.h;return}
    if(it.k==='img'){doc.addImage(it.url,'PNG',(RCPT.W-it.w)/2,y,it.w,it.h);y+=it.h2;return}
    doc.setFont('courier',it.bold?'bold':'normal');doc.setFontSize(RCPT.FS);doc.setTextColor(0);
    if(it.k==='lr'){doc.text(it.label,X,y);doc.text(it.value,R,y,{align:'right'});y+=it.h;return}
    const x=it.align==='center'?C:it.align==='right'?R:X;
    doc.text(it.t,x,y,{align:it.align==='center'?'center':it.align==='right'?'right':'left'});
    y+=it.h;
  });
  return {doc,blob:doc.output('blob'),fname:rcptFileName(title)};
}

function rcptFileName(title){return (String(title||'Receipt').replace(/[^A-Za-z0-9-]+/g,'-').replace(/^-+|-+$/g,'')||'Receipt')+'.pdf'}

// Share button handler: used by every receipt modal.
async function shareReceiptModal(){
  const root=document.querySelector('#modalBody .receipt');
  if(!root){toast('Nothing to share here.');return}
  const title=(document.getElementById('modalTitle').textContent||'Receipt').trim();
  let r;
  try{r=await rcptBuild(root,title)}catch(e){toast('Could not create the PDF. Please try again.');return}
  window._rcptShare={blob:r.blob,fname:r.fname,title};
  const file=new File([r.blob],r.fname,{type:'application/pdf'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:title,text:title+' from '+SHOP.name});return}
    catch(e){if(e&&e.name==='AbortError')return}
  }
  rcptDownload();
  toast('PDF downloaded. Attach it to your email or WhatsApp message.');
}

function rcptDownload(){
  const s=window._rcptShare;if(!s){toast('Create the receipt PDF first.');return}
  const url=URL.createObjectURL(s.blob);const a=document.createElement('a');
  a.href=url;a.download=s.fname;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
}
