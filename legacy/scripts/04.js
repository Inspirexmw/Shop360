/* ---------- Accounts: where money is held ----------
 * An account is where money lands (Cash drawer, a bank, a mobile money wallet, other).
 * A payment method is how the customer paid. Each account lists the payment methods
 * that deposit into it. Balances are always derived from transactions in cashAll().
 * Every money record carries accountId; the method text stays on the record as history.
 */
const ACC_TYPES={bank:'Bank',cash:'Cash',mobile:'Mobile Money',other:'Other'};
const ACC_SEED=[{name:'Cash',type:'cash'},{name:'Bank Transfer',type:'bank'},{name:'Airtel Money',type:'mobile'},{name:'TNM Mpamba',type:'mobile'},{name:'POS / Card',type:'bank'}];

function accList(){if(!Array.isArray(state.accounts))state.accounts=[];return state.accounts}
// Lay-by is a payment flow, not a place money sits. Its payments post to the account they were paid into.
function accIsLayby(a){return !!a&&String(a.name||'').trim().toLowerCase()==='lay-by'}
function accVisible(){return accList().filter(a=>!accIsLayby(a))}
function accById(id){return id?accList().find(a=>a.id===id)||null:null}
function accName(id){return accById(id)?.name||''}
function accNextId(){return 'ACC-'+String(Math.max(0,...accList().map(a=>+String(a.id).replace(/\D/g,'')||0))+1).padStart(3,'0')}
function accsFor(m){return accVisible().filter(a=>a.active!==false&&(a.methods||[]).includes(m))}
function accOfMethod(m){if(m==='Lay-by')return null;const L=accVisible().filter(a=>(a.methods||[]).includes(m));return L.find(a=>a.active!==false)||L[0]||accVisible().find(a=>a.name===m)||null}
function accEnsure(m){const name=m||'Unassigned';let a=accList().find(x=>x.name===name);if(!a){a={id:accNextId(),name,type:'other',active:true,openingBalance:0,methods:m?[m]:[]};accList().push(a)}return a}
// Account for a payment method. A cashier's explicit pick wins when it is valid for that method.
// True when a method has accounts but every one of them is inactive.
function accBlocked(m){const L=accList().filter(a=>(a.methods||[]).includes(m));return L.length>0&&!L.some(a=>a.active!==false)}
function accBlockMsg(m){return `${m} has no active account. Activate an account for ${m} or choose another payment method.`}
// Returns null when no active account can take this money. Callers must stop the save.
function accFor(m,picked){if(m==='Lay-by')return null;if(picked&&accsFor(m).some(a=>a.id===picked))return picked;const L=accsFor(m);if(L[0])return L[0].id;if(accBlocked(m))return null;const a=accOfMethod(m)||accEnsure(m);return a.active===false?null:a.id}
// True when a cashbook row is a mirror of a record that the ledger already counts.
function cbMirrored(e){const c=String(e.customerCollectionId||'');if(!c)return false;
 if(c.startsWith('CC-SALE-')){const f=state.sales.find(x=>(x.transactionId||x.id)===c.slice(8));if(f&&f.paymentMethod==='Lay-by')return true;if(!f||f.paymentMethod==='Lay-by'||f.paymentMethod==='Customer store credit')return false;const a=Math.max(0,(f.cashReceived!=null?+f.cashReceived:(+f.paid||0)-(+f.storeCreditUsed||0))-(+f.exchangeOffset||0));return a>0}
 if(c.startsWith('CC-PAY-')){const pid=c.slice(7);return (state.payments||[]).some(p=>p.id===pid&&p.method!=='Customer store credit'&&!p.storeCreditUsed)}
 const m=c.match(/^CC-LAY-(.+)-(\d+)$/);if(m){const l=(state.layaways||[]).find(x=>x.id===m[1]);return !!l&&(l.payments||[]).some(p=>+p.amount===+e.amount&&p.method===e.method&&p.date===e.date)}
 return false}
function entryAid(e){return e.accountId||accOfMethod(e.method)?.id||null}
function accOpeningRows(){return accList().filter(a=>Math.round(+a.openingBalance||0)!==0).map(a=>{const v=Math.round(+a.openingBalance);return {d:a.openingDate||'0000-00-00',tm:'',desc:'Opening balance · '+a.name,cat:'Opening balance',pm:'',tgt:null,aid:a.id,m:a.name,in:v>0?v:0,out:v<0?-v:0,auto:1,ref:a.id}})}
// Stamp accountId on every ledger record that does not have one yet. History is never re-pointed.
function accTagAll(){if(!Array.isArray(state.accounts))return;cashAll().forEach(x=>{const t=x.tgt;if(t&&!t.accountId){const aid=accFor(x.pm);if(aid)t.accountId=aid}})}
function accBalance(id){return cashAll().filter(x=>x.aid===id).reduce((s,x)=>s+x.in-x.out,0)}
function accInit(){
  accList();state.migrations=Array.isArray(state.migrations)?state.migrations:[];
  if(!state.migrations.includes('accounts-v1')){
    if(!accList().length)ACC_SEED.forEach(s=>accList().push({id:accNextId(),name:s.name,type:s.type,active:true,openingBalance:0,methods:[s.name]}));
    state.migrations.push('accounts-v1');
    persist();
  }
  // Lay-by is a payment method, not an account. Remove the pseudo-account and the cashbook rows it received.
  if(!state.migrations.includes('layby-not-account-v1')){
    const lb=accList().filter(accIsLayby).map(a=>a.id);
    if(lb.length&&Array.isArray(state.cashbook)){state.cashbook=state.cashbook.filter(e=>!(lb.includes(e.accountId)||e.method==='Lay-by'))}
    state.accounts=accList().filter(a=>!accIsLayby(a));
    state.migrations.push('layby-not-account-v1');
    persist();
  }
  accTagAll();
}
// Account picked by the cashier, only when the picker is visible.
function posPickedAcc(){const f=document.getElementById('posAccountField');return f&&f.style.display!=='none'?document.getElementById('posAccount')?.value:undefined}

/* POS: account picker appears only when the effective payment method has more than one account */
function posAccountSync(){const el=id=>document.getElementById(id);const f=el('posAccountField');if(!f)return;const dep=el('posDepositMethodField'),m=dep&&dep.style.display!=='none'?el('posDepositMethod').value:(el('posPayment')?.value||'Cash');const L=accsFor(m),sel=el('posAccount');if(L.length>1){const cur=sel.value;sel.innerHTML=L.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('');if(L.some(a=>a.id===cur))sel.value=cur;f.style.display=''}else{f.style.display='none';sel.innerHTML=''}}

/* Modals: forms marked data-acc-pick get an account picker next to their payment method */
function accPickerSync(form){const sel=form.querySelector('select[name="method"]');if(!sel)return;let slot=form.querySelector('.acc-pick-slot');if(!slot){slot=document.createElement('div');slot.className='acc-pick-slot';sel.closest('.field').insertAdjacentElement('afterend',slot)}const L=accsFor(sel.value);slot.innerHTML=L.length>1?`<div class="field"><label>${esc(form.dataset.accLabel||'ACCOUNT')}</label><select name="accountId">${L.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></div>`:''}
function accEnhanceForms(){document.querySelectorAll('#modalBody form[data-acc-pick]').forEach(f=>{accPickerSync(f);if(!f.dataset.accBound){f.dataset.accBound='1';f.addEventListener('change',e=>{if(e.target.name==='method')accPickerSync(f)})}})}

/* Settings → Accounts management */
function openAccounts(){
  const all=cashAll();
  const rows=accVisible().map(a=>{const bal=all.filter(x=>x.aid===a.id).reduce((s,x)=>s+x.in-x.out,0),methods=(a.methods||[]).join(', ')||'None';return `<tr><td><b>${esc(a.name)}</b></td><td>${esc(ACC_TYPES[a.type]||'Other')}</td><td>${money(+a.openingBalance||0)}</td><td><b>${money(bal)}</b></td><td>${esc(methods)}</td><td>${a.active===false?'<span class="badge">Inactive</span>':'<span class="badge in-stock">Active</span>'}</td><td style="white-space:nowrap"><button class="tiny-btn" onclick="openAccountForm('${a.id}')">Edit</button> <button class="tiny-btn" onclick="accToggle('${a.id}')">${a.active===false?'Activate':'Deactivate'}</button></td></tr>`}).join('');
  showModal('Accounts management',`<div class="form-note">Accounts are where money is held. Payment methods are how customers paid. Balances are calculated from transactions: opening balance + money in − money out ± transfers.</div><div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Account</th><th>Type</th><th>Opening</th><th>Current balance</th><th>Payment methods</th><th>Status</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="7" class="empty">No accounts yet.</td></tr>'}</tbody></table></div><div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">Close</button><button type="button" class="btn primary" onclick="openAccountForm()">＋ Add account</button></div>`)
}
function openAccountForm(id){
  const a=id?accById(id):null;if(id&&!a)return;
  showModal(a?'Edit account':'New account',`<form data-acc-form onsubmit="saveAccount(event,'${a?a.id:''}')"><div class="form-grid"><div class="field"><label>ACCOUNT NAME</label><input name="name" required maxlength="60" value="${esc(a?a.name:'')}" placeholder="e.g. National Bank"></div><div class="field"><label>TYPE</label><select name="type">${Object.entries(ACC_TYPES).map(([k,l])=>`<option value="${k}"${(a?a.type:'bank')===k?' selected':''}>${l}</option>`).join('')}</select></div><div class="field"><label>OPENING BALANCE (K)</label><input name="openingBalance" type="number" step="1" value="${a?Math.round(+a.openingBalance||0):0}"></div><div class="field"><label>STATUS</label><select name="status"><option value="active"${!a||a.active!==false?' selected':''}>Active</option><option value="inactive"${a&&a.active===false?' selected':''}>Inactive</option></select></div></div><div class="field"><label>PAYMENT METHODS THAT DEPOSIT INTO THIS ACCOUNT</label><div class="acc-method-grid">${FIN_METHODS.map(m=>`<label class="acc-check"><input type="checkbox" name="methods" value="${esc(m)}"${a&&(a.methods||[]).includes(m)?' checked':''}> ${esc(m)}</label>`).join('')}</div><small class="muted">For POS / Card, tick the account that receives card settlements from the POS terminal. If a method has several accounts, the cashier picks one at the point of sale.</small></div><div class="form-note">Opening balance is what the account held before any transaction recorded in Shop360. Inactive accounts keep their history but cannot receive new transactions.</div><div class="form-actions"><button type="button" class="btn secondary" onclick="openAccounts()">Back</button><button class="btn primary">Save account</button></div></form>`)
}
function saveAccount(e,id){
  e.preventDefault();const f=e.currentTarget,d=formData(e),methods=[...f.querySelectorAll('input[name=methods]:checked')].map(x=>x.value),name=(d.name||'').trim();
  if(!name){toast('Enter an account name.');return}
  if(accList().some(a=>a.id!==id&&a.name.toLowerCase()===name.toLowerCase())){toast('An account with this name already exists.');return}
  const type=ACC_TYPES[d.type]?d.type:'other',openingBalance=Math.round(+d.openingBalance||0),active=d.status!=='inactive';
  const a=id?accById(id):null;if(id&&!a){toast('This account no longer exists.');return}
  if(a)Object.assign(a,{name,type,openingBalance,active,methods});else accList().push({id:accNextId(),name,type,active,openingBalance,methods});
  activity(a?'Account updated':'Account added',name,'Shop',ACC_TYPES[type]);
  persist();closeModal();renderAll();toast('Account saved.');openAccounts();
}
function accToggle(id){const a=accById(id);if(!a)return;a.active=a.active===false;activity(a.active?'Account activated':'Account deactivated',a.name,'Shop','');persist();renderAll();toast(a.active?'Account activated.':'Account deactivated. Its history is kept.');openAccounts()}

/* Wrap the existing save and modal hooks so every write is tagged and pickers are wired */
(function(){
  const _persist=persist;
  persist=function(){try{accTagAll()}catch(err){console.warn('accTagAll',err)}return _persist.apply(this,arguments)};
  const _showModal=showModal;
  showModal=function(){_showModal.apply(this,arguments);accEnhanceForms()};
  const _updatePayUI=updatePayUI;
  updatePayUI=function(){_updatePayUI.apply(this,arguments);posAccountSync()};
})();
