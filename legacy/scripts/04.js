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
function accName(id){const a=accById(id);return a?accLabel(a):''}
// A bank can have channels (sub-accounts such as POS / Card and Bank Transfer). Channels roll up into the bank's balance.
function accLabel(a){if(!a)return '';const p=a.parentId?accById(a.parentId):null;return p?p.name+' · '+a.name:a.name}
function accActive(a){if(!a||a.active===false)return false;if(!a.parentId)return true;const p=accById(a.parentId);return !!p&&p.active!==false}
function accChildren(id){return accList().filter(a=>a.parentId===id)}
function accGroup(id){return [id,...accChildren(id).map(a=>a.id)]}
function accChannelsHTML(id){const k=id?accChildren(id):[];return k.length?`<span class="rec-system-hint">Channels: ${k.map(c=>`${esc(c.name)} ${money(accBalance(c.id))}`).join(' · ')}</span><br>`:''}
function accNextId(){return 'ACC-'+String(Math.max(0,...accList().map(a=>+String(a.id).replace(/\D/g,'')||0))+1).padStart(3,'0')}
function accsFor(m){return accVisible().filter(a=>accActive(a)&&(a.methods||[]).includes(m))}
function accOfMethod(m){if(m==='Lay-by')return null;const L=accVisible().filter(a=>(a.methods||[]).includes(m));return L.find(accActive)||L[0]||accVisible().find(a=>a.name===m)||null}
function accEnsure(m){const name=m||'Unassigned';let a=accList().find(x=>x.name===name);if(!a){a={id:accNextId(),name,type:'other',active:true,openingBalance:0,methods:m?[m]:[]};accList().push(a)}return a}
// Account for a payment method. A cashier's explicit pick wins when it is valid for that method.
// True when a method has accounts but every one of them is inactive.
function accBlocked(m){const L=accList().filter(a=>(a.methods||[]).includes(m));return L.length>0&&!L.some(accActive)}
function accBlockMsg(m){return `${m} has no active account. Activate an account for ${m} or choose another payment method.`}
// Returns null when no active account can take this money. Callers must stop the save.
function accFor(m,picked){if(m==='Lay-by')return null;if(picked&&accsFor(m).some(a=>a.id===picked))return picked;const L=accsFor(m);if(L[0])return L[0].id;if(accBlocked(m))return null;const a=accOfMethod(m);return a&&accActive(a)?a.id:null}
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
function accBalance(id){const G=accGroup(id);return cashAll().filter(x=>G.includes(x.aid)).reduce((s,x)=>s+x.in-x.out,0)}
function accInit(){
  accList();state.migrations=Array.isArray(state.migrations)?state.migrations:[];
  // One-time reset: start with no payment accounts and no account-linked money. Existing sales and payments are kept as history
  // but marked UNASSIGNED, so accTagAll() never attaches them to accounts that are added later.
  if(!state.migrations.includes('accounts-blank-reset-v1')){
    state.accounts=[];state.cashbook=[];state.accountTransfers=[];state.recons=[];
    const mark=t=>{if(t&&typeof t==='object')t.accountId='UNASSIGNED'};
    (state.sales||[]).forEach(mark);(state.payments||[]).forEach(mark);(state.refunds||[]).forEach(mark);
    (state.layaways||[]).forEach(l=>{(l.payments||[]).forEach(mark);mark(l.refund);(l.adjustments||[]).forEach(mark)});
    state.migrations.push('accounts-blank-reset-v1');
    persist();
  }
  // Every shop starts with a Cash account. New setups get it on first load; existing ones get it once if it is missing.
  if(!state.migrations.includes('cash-default-account-v1')){
    if(!accList().some(a=>a.name==='Cash'))accList().push({id:accNextId(),name:'Cash',type:'cash',active:true,openingBalance:0,methods:['Cash']});
    state.migrations.push('cash-default-account-v1');
    persist();
  }
  accTagAll();
}
// Account picked by the cashier, only when the picker is visible.
function posPickedAcc(){const f=document.getElementById('posAccountField');return f&&f.style.display!=='none'?document.getElementById('posAccount')?.value:undefined}

/* POS: account picker appears only when the effective payment method has more than one account */
function posAccountSync(){const el=id=>document.getElementById(id);const f=el('posAccountField');if(!f)return;const dep=el('posDepositMethodField'),m=dep&&dep.style.display!=='none'?el('posDepositMethod').value:(el('posPayment')?.value||'Cash');const L=accsFor(m),sel=el('posAccount');if(L.length>1){const cur=sel.value;sel.innerHTML=L.map(a=>`<option value="${a.id}">${esc(accLabel(a))}</option>`).join('');if(L.some(a=>a.id===cur))sel.value=cur;f.style.display=''}else{f.style.display='none';sel.innerHTML=''}}

/* Modals: forms marked data-acc-pick get an account picker next to their payment method */
// POS and reconciliation payment lists come from active accounts only. Lay-by and Unpaid / credit are fixed POS flows.
function posMethodOptions(){const s=[];accVisible().filter(accActive).forEach(a=>(a.methods||[]).forEach(m=>{if(m&&!s.includes(m)&&m!=='Lay-by'&&m!=='Unpaid / credit')s.push(m)}));return s}
function syncPosMethods(){
  // Keeps the current choice when it is still valid; otherwise defaults to Cash when offered.
  const fill=(sel,list,dflt)=>{if(!sel)return;const cur=sel.value;sel.innerHTML=list.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('');sel.value=list.includes(cur)?cur:(list.includes(dflt)?dflt:(list[0]||''))};
  const M=posMethodOptions();
  fill(document.getElementById('posPayment'),[...M,'Unpaid / credit','Lay-by'],'Cash');
  fill(document.getElementById('posDepositMethod'),M,'Cash');
}
// From POS, jump to Settings → Accounts management to add an account.
function openAccountsFromPos(){navigate('settings');openAccounts()}
function accPickerSync(form){const sel=form.querySelector('select[name="method"]');if(!sel)return;let slot=form.querySelector('.acc-pick-slot');if(!slot){slot=document.createElement('div');slot.className='acc-pick-slot';sel.closest('.field').insertAdjacentElement('afterend',slot)}const L=accsFor(sel.value);slot.innerHTML=L.length>1?`<div class="field"><label>${esc(form.dataset.accLabel||'ACCOUNT')}</label><select name="accountId">${L.map(a=>`<option value="${a.id}">${esc(accLabel(a))}</option>`).join('')}</select></div>`:''}
function accEnhanceForms(){document.querySelectorAll('#modalBody form[data-acc-pick]').forEach(f=>{accPickerSync(f);if(!f.dataset.accBound){f.dataset.accBound='1';f.addEventListener('change',e=>{if(e.target.name==='method')accPickerSync(f)})}})}

/* Settings → Accounts management */
function openAccounts(){
  const all=cashAll();
  const row=(a,child)=>{const kids=accChildren(a.id),bal=accBalance(a.id);
    const methods=!child&&kids.length?'Through channels: '+kids.map(k=>k.name).join(', '):((a.methods||[]).join(', ')||'None');
    const st=a.active===false?'<span class="badge">Inactive</span>':(accActive(a)?'<span class="badge in-stock">Active</span>':'<span class="badge">Bank inactive</span>');
    return `<tr${child?' class="acc-child"':''}><td>${child?'<span class="muted">↳ </span>':''}<b>${esc(a.name)}</b></td><td>${esc(ACC_TYPES[a.type]||'Other')}</td><td>${child?'':money(+a.openingBalance||0)}</td><td><b>${money(bal)}</b></td><td>${esc(methods)}</td><td>${st}</td><td style="white-space:nowrap"><button class="tiny-btn" onclick="openAccountForm('${a.id}')">Edit</button> <button class="tiny-btn" onclick="accToggle('${a.id}')">${a.active===false?'Activate':'Deactivate'}</button>${child?'':` <button class="tiny-btn" onclick="openAccountForm(null,'${a.id}')">＋ Channel</button>`}</td></tr>`};
  const rows=accVisible().filter(a=>!a.parentId||!accById(a.parentId)).map(a=>row(a,false)+accChildren(a.id).map(k=>row(k,true)).join('')).join('');
  showModal('Accounts management',`<div class="form-note">Accounts are where money is held. A bank can have channels, such as POS / Card and Bank Transfer under it. Channels roll up into the bank's balance, and the bank is what you reconcile. Payment methods are how customers paid.</div><div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Account</th><th>Type</th><th>Opening</th><th>Current balance</th><th>Payment methods</th><th>Status</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="7" class="empty">No accounts yet.</td></tr>'}</tbody></table></div><div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">Close</button><button type="button" class="btn primary" onclick="openAccountForm()">＋ Add account</button></div>`)
}
// Choosing a bank makes this a channel: its opening balance is fixed at 0 so the bank's balance is not counted twice.
function accParentChanged(sel){const f=sel.form;if(!f)return;const ob=f.elements.openingBalance,c=!!sel.value;if(ob){ob.readOnly=c;if(c)ob.value=0}}
function openAccountForm(id,parentPreset){
  const a=id?accById(id):null;if(id&&!a)return;
  const pid=a?(a.parentId||''):(parentPreset||'');
  const hasKids=!!a&&accChildren(a.id).length>0,isChild=!!pid;
  const tops=accVisible().filter(x=>!x.parentId&&(!a||x.id!==a.id));
  const parentField=hasKids?'':`<div class="field"><label>BELONGS TO BANK ACCOUNT</label><select name="parentId" onchange="accParentChanged(this)"><option value="">None: this is a bank or account</option>${tops.map(x=>`<option value="${x.id}"${pid===x.id?' selected':''}>${esc(x.name)}</option>`).join('')}</select><small class="muted">Pick a bank to make this a channel of it. Channels share the bank's reconciliation.</small></div>`;
  showModal(a?'Edit account':'New account',`<form data-acc-form onsubmit="saveAccount(event,'${a?a.id:''}')"><div class="form-grid"><div class="field"><label>ACCOUNT NAME</label><input name="name" required maxlength="60" value="${esc(a?a.name:'')}" placeholder="e.g. National Bank, or POS / Card"></div><div class="field"><label>TYPE</label><select name="type">${Object.entries(ACC_TYPES).map(([k,l])=>`<option value="${k}"${(a?a.type:'bank')===k?' selected':''}>${l}</option>`).join('')}</select></div><div class="field"><label>OPENING BALANCE (K)</label><input name="openingBalance" type="number" step="1" value="${isChild?0:Math.round(+(a&&a.openingBalance)||0)}"${isChild?' readonly':''}></div><div class="field"><label>STATUS</label><select name="status"><option value="active"${!a||a.active!==false?' selected':''}>Active</option><option value="inactive"${a&&a.active===false?' selected':''}>Inactive</option></select></div>${parentField}</div><div class="field"><label>PAYMENT METHODS THAT DEPOSIT INTO THIS ACCOUNT</label><div class="acc-method-grid">${FIN_METHODS.map(m=>`<label class="acc-check"><input type="checkbox" name="methods" value="${esc(m)}"${a&&(a.methods||[]).includes(m)?' checked':''}> ${esc(m)}</label>`).join('')}</div><small class="muted">For a bank with channels, put the methods on its channels instead. For POS / Card, tick the account that receives card settlements. If a method has several accounts, the cashier picks one at the point of sale.</small></div><div class="field"><label>OTHER PAYMENT METHODS (COMMA SEPARATED)</label><input name="extraMethods" maxlength="200" placeholder="e.g. Ecocash, Visa terminal 2" value="${esc(a?(a.methods||[]).filter(m=>!FIN_METHODS.includes(m)).join(', '):'')}"><small class="muted">Added methods appear in the POS payment list while this account is active.</small></div><div class="form-note">Opening balance is what the account held before any transaction recorded in Shop360. Channels have no opening balance; the bank holds it. Inactive accounts keep their history but cannot receive new transactions.</div><div class="form-actions"><button type="button" class="btn secondary" onclick="openAccounts()">Back</button><button class="btn primary">Save account</button></div></form>`)
}
function saveAccount(e,id){
  e.preventDefault();const f=e.currentTarget,d=formData(e),name=(d.name||'').trim();
  let methods=[...new Set([...f.querySelectorAll('input[name=methods]:checked')].map(x=>x.value).concat(String(d.extraMethods||'').split(',').map(x=>x.trim()).filter(x=>x&&!['Lay-by','Unpaid / credit','Customer store credit'].includes(x))))];
  if(!name){toast('Enter an account name.');return}
  if(accList().some(a=>a.id!==id&&a.name.toLowerCase()===name.toLowerCase())){toast('An account with this name already exists.');return}
  const a=id?accById(id):null;if(id&&!a){toast('This account no longer exists.');return}
  const parentId=d.parentId||null,parent=parentId?accById(parentId):null;
  if(parentId){
    if(!parent||parent.parentId){toast('Choose a bank account to belong to.');return}
    if(parentId===id){toast('An account cannot belong to itself.');return}
    if(id&&accChildren(id).length){toast('This account has channels, so it cannot belong to another account.');return}
    // The bank's own payment methods move onto this channel, so the bank is left with channels only.
    const moved=(parent.methods||[]);if(moved.length){methods=[...new Set([...methods,...moved])];parent.methods=[];toast(`Moved ${moved.join(', ')} from ${parent.name} onto this channel.`)}
    if(!methods.length){toast('A channel needs at least one payment method.');return}
  }
  if(id&&accChildren(id).length&&methods.length){toast(`${a.name} has channels. Put payment methods on its channels, not on the bank itself.`);return}
  const type=parent?parent.type:(ACC_TYPES[d.type]?d.type:'other'),openingBalance=parent?0:Math.round(+d.openingBalance||0),active=d.status!=='inactive';
  if(a)Object.assign(a,{name,type,openingBalance,active,methods,parentId});else accList().push({id:accNextId(),name,type,active,openingBalance,methods,parentId});
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
