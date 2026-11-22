// ---- Header business name, header avatar, and the My Account page ----
// Account data comes from /api/account (cookie session). Nothing about the user is kept in browser storage.
let ACCOUNT=null;

function initialsOf(name){const p=String(name||'').trim().split(/\s+/).filter(Boolean);if(!p.length)return '··';return (p.length===1?p[0].slice(0,2):p[0][0]+p[p.length-1][0]).toUpperCase()}

function roleLabel(role){const labels=window.SHOP360_ROLE_LABELS||{};return labels[role]||String(role||'Member').replace(/^./,c=>c.toUpperCase())}

// Centre header text: the business name from Settings. Called from renderAll().
function renderHeaderBusiness(){const el=document.getElementById('headerBusiness');if(!el)return;const n=String((typeof dashBrand==='function'&&dashBrand())||'').trim()||'Shop360';el.textContent=n;el.title=n}

function renderHeaderAvatar(){const btn=document.getElementById('headerAvatar');if(!btn)return;const a=ACCOUNT;btn.innerHTML=a&&a.avatar?`<img alt="" src="${esc(a.avatar)}">`:`<span id="headerAvatarText">${esc(initialsOf(a?a.name:''))}</span>`;
  const n=document.getElementById('userName'),r=document.getElementById('userRole');if(a){if(n)n.textContent=a.name;if(r)r.textContent=roleLabel(a.role)}}

function renderGreeting(){const el=document.getElementById('dashGreeting');if(!el)return;const h=new Date().getHours();const part=h<12?'Good morning':h<17?'Good afternoon':'Good evening';const name=ACCOUNT&&String(ACCOUNT.username||ACCOUNT.name||'').trim();el.textContent=name?part+', '+name:part}
async function loadAccount(){
  try{const r=await fetch('/api/account',{cache:'no-store'});if(!r.ok)return;const j=await r.json();ACCOUNT=j.user;renderHeaderAvatar();renderHeaderBusiness();renderGreeting();
    const t=ACCOUNT.preferences&&ACCOUNT.preferences.theme;if(t&&window.shop360SetTheme)window.shop360SetTheme(t);
    renderAccountPage()}catch(e){}
}

// Called by the theme toggle in 01.js. Saves the choice to the user's account.
window.shop360ThemeChanged=async(t)=>{
  if(ACCOUNT)ACCOUNT.preferences={...(ACCOUNT.preferences||{}),theme:t};
  try{const r=await fetch('/api/account',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({preferences:{theme:t}})});if(!r.ok)throw new Error();renderAccountPage()}catch(e){toast('Could not save theme preference.')}
};

function openMyAccount(){navigate('account');if(!ACCOUNT)loadAccount();else renderAccountPage()}

function acctMsg(key,text,ok){const el=document.querySelector(`[data-acct-msg="${key}"]`);if(!el)return;el.textContent=text||'';el.className='acct-msg'+(text?(ok?' ok':' err'):'')}

async function acctRequest(url,method,body){
  const r=await fetch(url,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||'Something went wrong. Try again.');
  return j;
}

// Team & access: accounts are provisioned and managed by the owner only.
function roleModules(role){const p=window.SHOP360_RBAC||{};return (p.modules||[]).filter(m=>(m.access||[]).indexOf(role)!==-1).map(m=>m.label)}
function accessLabel(role){const m=roleModules(role);return m.length>4?m.slice(0,4).join(' · ')+' +'+(m.length-4)+' more':m.join(' · ')}
function teamRoles(){return (window.SHOP360_RBAC&&window.SHOP360_RBAC.roles)||['owner','manager','cashier','finance']}
function roleMsg(text,ok){const el=document.getElementById('roleMsg');if(!el)return;el.textContent=text||'';el.className='acct-msg'+(text?(ok?' ok':' err'):'')}

async function renderRoleRows(){
  const body=document.getElementById('roleRows');if(!body)return;
  if(window.SHOP360_ROLE!=='owner'){
    body.innerHTML='<tr><td colspan="4"><div class="empty">Only the business owner can manage access categories.</div></td></tr>';return;
  }
  body.innerHTML='<tr><td colspan="4"><div class="empty">Loading categories…</div></td></tr>';
  try{
    const j=await acctRequest('/api/admin/roles','GET'),rows=j.roles||[];
    window.__shop360RoleDefs=rows;
    const all=(window.SHOP360_RBAC&&window.SHOP360_RBAC.modules)||[];
    const nameOf=k=>{const m=all.find(x=>x.key===k);return m?m.label:k};
    body.innerHTML=rows.map(r=>{
      const mods=r.modules||[];
      const type=r.builtIn?'<span class="badge in-stock">Built-in</span>':'<span class="badge">Custom</span>';
      const actions=`<button type="button" class="tiny-btn" onclick="openRoleForm('${esc(r.key)}')">Edit</button> <button type="button" class="tiny-btn" onclick="deleteRole('${esc(r.key)}')">Delete</button>`;
      const moduleText=mods.map(nameOf).join(' · ')||'No modules';
      return `<tr><td><b>${esc(r.label)}</b>${r.description?`<div class="muted">${esc(r.description)}</div>`:''}</td><td class="role-modules"><span class="mod-badge">${mods.length} of ${all.length}</span><div class="role-mod-list">${esc(moduleText)}</div></td><td>${type}</td><td>${actions}</td></tr>`;
    }).join('')||'<tr><td colspan="4"><div class="empty">No categories yet.</div></td></tr>';
  }catch(err){body.innerHTML=`<tr><td colspan="4"><div class="empty">${esc(err.message||'Could not load categories.')}</div></td></tr>`}
}

function modGroup(title,items,checked){const on=items.filter(m=>checked.indexOf(m.key)!==-1).length;return `<fieldset class="mod-group"><legend>${esc(title)} <span class="mod-count">${on}/${items.length}</span></legend>${items.map(m=>`<label class="mod-opt"><input type="checkbox" name="modules" value="${esc(m.key)}" ${checked.indexOf(m.key)!==-1?'checked':''}><span>${esc(m.label)}</span></label>`).join('')}</fieldset>`}

function openRoleForm(key){
  const all=(window.SHOP360_RBAC&&window.SHOP360_RBAC.modules)||[];
  const current=key?(window.__shop360RoleDefs||[]).find(r=>r.key===key):null;
  if(key&&!current){toast('Category not found.');return}
  const checked=current?(current.modules||[]):[];
  const GROUPS=[['General',['dashboard','account']],['Sales',['pos','sales','daily','customers','layaway']],['Stock',['inventory','receiving','orders','suppliers']],['Finance',['finance','reports']],['Administration',['team','audit','settings']]];
  const byKey=Object.fromEntries(all.map(m=>[m.key,m]));const placed=new Set();
  const groupHTML=GROUPS.map(([title,keys])=>{const items=keys.map(k=>byKey[k]).filter(Boolean);items.forEach(m=>placed.add(m.key));return items.length?modGroup(title,items,checked):''}).join('');
  const rest=all.filter(m=>!placed.has(m.key));
  const boxes=groupHTML+(rest.length?modGroup('Other',rest,checked):'');
  showModal(current?'Edit category · '+current.label:'New access category',`<form class="acct-form" onsubmit="saveRole(event)">
    <input type="hidden" name="key" value="${esc(key||'')}">
    <div class="form-grid">
      <div class="field"><label>CATEGORY NAME</label><input name="name" required maxlength="60" value="${esc(current?current.label:'')}" autocomplete="off"></div>
      <div class="field"><label>DESCRIPTION</label><input name="description" maxlength="200" value="${esc(current?(current.description||''):'')}" placeholder="What is this category for?" autocomplete="off"></div>
    </div>
    <div class="field mod-field"><label>MODULES THIS CATEGORY CAN ACCESS</label><div class="mod-picker">${boxes}</div><small class="muted">Owner / Admin always has every module. Write actions follow the modules you select.</small></div>
    <div class="acct-row"><span class="acct-msg" id="roleMsg"></span><button class="btn primary">${current?'Save category':'Create category'}</button></div>
  </form>`);
}

async function saveRole(e){
  e.preventDefault();const f=e.currentTarget,d=new FormData(f),key=String(d.get('key')||'');
  const body={name:d.get('name'),description:d.get('description'),modules:d.getAll('modules').map(String)};
  roleMsg('Saving…',true);
  try{
    if(key)await acctRequest('/api/admin/roles','PATCH',{...body,id:key});
    else await acctRequest('/api/admin/roles','POST',body);
    closeModal();toast(key?'Category updated.':'Category created.');setTimeout(()=>location.reload(),800);
  }catch(err){roleMsg(err.message,false)}
}

async function deleteRole(key){
  if(!confirm('Delete this access category? Team members using it must be reassigned first.'))return;
  try{await acctRequest('/api/admin/roles','DELETE',{id:key});toast('Category deleted.');setTimeout(()=>location.reload(),800)}
  catch(err){toast(err.message)}
}

const AUDIT_ACTIONS=[
  ['auth.sign_in','Signed in','in-stock'],['auth.sign_out','Signed out',''],['auth.sign_in_failed','Failed sign-in','out'],['auth.password_changed','Password changed','low'],
  ['record.create','Record added','in-stock'],['record.update','Record updated',''],['record.delete','Record removed','out'],['settings.update','Settings changed','low'],
  ['state.initialised','Workspace created','in-stock'],['state.bulk_update','Bulk update','low'],['data.erase','Data erased','out'],
  ['users.create','Team member added','in-stock'],['users.role_changed','Role changed','low'],['users.status_changed','Access changed','low'],['users.updated','Team member updated',''],
  ['roles.create','Category created','in-stock'],['roles.update','Category updated','low'],['roles.delete','Category removed','out'],['account.updated','Account updated','low']
];
function auditMeta(a){const f=AUDIT_ACTIONS.find(x=>x[0]===a);return f?{label:f[1],tone:f[2]}:{label:String(a||'Activity').replace(/\./g,' ').replace(/^./,c=>c.toUpperCase()),tone:''}}
function auditDate(v){if(!v)return '—';const d=new Date(v);return isNaN(d.getTime())?esc(v):d.toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function auditSearchChanged(){clearTimeout(window.__auditTimer);window.__auditTimer=setTimeout(()=>renderAuditRows(),300)}
function auditQuery(offset){
  const q=new URLSearchParams();q.set('limit','50');q.set('offset',String(offset||0));
  const val=id=>{const el=document.getElementById(id);return el?String(el.value||'').trim():''};
  const s=val('auditSearch'),a=val('auditAction'),u=val('auditUser'),f=val('auditFrom'),t=val('auditTo');
  if(s)q.set('search',s);if(a)q.set('action',a);if(u)q.set('actorUsername',u);if(f)q.set('from',f);if(t)q.set('to',t);
  return q;
}
async function loadAuditUsers(){
  const sel=document.getElementById('auditUser');if(!sel)return;
  try{const j=await acctRequest('/api/admin/users','GET'),keep=sel.value;
    sel.innerHTML='<option value="">All users</option>'+(j.users||[]).map(u=>`<option value="${esc(u.username||u.id)}">${esc(u.username||u.email)} · ${esc(u.name||'')}</option>`).join('');
    sel.value=keep;
  }catch(e){}
}
async function renderAuditRows(reset){
  const body=document.getElementById('auditRows');if(!body)return;
  if(window.SHOP360_ROLE!=='owner'){
    body.innerHTML='<tr><td colspan="7"><div class="empty">Only the business owner can view the audit trail.</div></td></tr>';return;
  }
  const sel=document.getElementById('auditAction');
  if(sel&&sel.options.length<=1)sel.innerHTML='<option value="">All actions</option>'+AUDIT_ACTIONS.map(x=>`<option value="${esc(x[0])}">${esc(x[1])}</option>`).join('');
  if(reset!==false){window.__auditEntries=[];window.__auditOffset=0}
  const offset=window.__auditOffset||0;
  body.innerHTML='<tr><td colspan="7"><div class="empty">Loading audit trail…</div></td></tr>';
  try{
    const j=await acctRequest('/api/audit?'+auditQuery(offset).toString(),'GET'),rows=j.entries||[];
    window.__auditEntries=(window.__auditEntries||[]).concat(rows);
    window.__auditOffset=offset+rows.length;
    const total=Number(j.total)||0;
    const count=document.getElementById('auditCount');if(count)count.textContent=total?`${window.__auditEntries.length} of ${total} record${total===1?'':'s'}`:'No records';
    const more=document.getElementById('auditMore');if(more)more.innerHTML=window.__auditEntries.length<total?'<button type="button" class="btn secondary" onclick="renderAuditRows(false)">Load more</button>':'';
    body.innerHTML=(window.__auditEntries||[]).map((e,i)=>{
      const m=auditMeta(e.action);
      const user=e.actorUsername?`<b>${esc(e.actorUsername)}</b>${e.actorName&&e.actorName!==e.actorUsername?`<div class="muted">${esc(e.actorName)}</div>`:''}`:'<span class="muted">—</span>';
      const detail=esc(e.summary||'—')+(e.entityId?`<div class="muted">${esc(e.entityId)}</div>`:'');
      return `<tr><td class="muted">${auditDate(e.at)}</td><td>${user}</td><td><span class="badge ${m.tone}">${esc(m.label)}</span></td><td>${detail}</td><td class="muted">${esc(e.entityType||'—')}</td><td class="muted">${esc(e.intent||'—')}</td><td><button type="button" class="tiny-btn" onclick="viewAuditEntry(${i})">View</button></td></tr>`;
    }).join('')||'<tr><td colspan="7"><div class="empty">No activity recorded yet.</div></td></tr>';
    loadAuditUsers();
  }catch(err){body.innerHTML=`<tr><td colspan="7"><div class="empty">${esc(err.message||'Could not load the audit trail.')}</div></td></tr>`}
}
function viewAuditEntry(i){
  const e=(window.__auditEntries||[])[i];if(!e)return;
  const m=auditMeta(e.action),pretty=v=>{if(v==null)return '—';try{return JSON.stringify(v,null,2)}catch(_){return String(v)}};
  const box=(title,v)=>v==null?'':`<details style="margin-top:10px;border:1px solid var(--line);border-radius:8px"><summary style="cursor:pointer;padding:8px 10px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:#5e6a7b">${esc(title)} <span class="muted" style="font-weight:500;text-transform:none;letter-spacing:0">· click to expand</span></summary><pre style="white-space:pre-wrap;max-height:220px;overflow:auto;background:#f6f8fa;padding:10px;border-radius:0 0 8px 8px;font-size:11px;margin:0">${esc(pretty(v))}</pre></details>`;
  showModal('Audit entry · '+m.label,`<div class="form-note"><b>${esc(m.label)}</b> · ${esc(auditDate(e.at))}<br>User Id: <b>${esc(e.actorUsername||'—')}</b>${e.actorName?' · '+esc(e.actorName):''}<br>Email: ${esc(e.actorEmail||'—')}${e.actorRole?' · Role: '+esc(e.actorRole):''}</div>
  <p>${esc(e.summary||'—')}</p>
  <div class="muted" style="font-size:11px">Reference: ${esc(e.entityId||'—')} · Module: ${esc(e.entityType||'—')} · Intent: ${esc(e.intent||'—')}</div>
  ${box('Before',e.before)}${box('After',e.after)}
  <div class="form-actions"><button class="btn secondary" onclick="closeModal()">Close</button></div>`);
}

async function renderTeamRows(){
  const body=document.getElementById('teamRows');if(!body)return;
  if(window.SHOP360_ROLE!=='owner'){
    body.innerHTML='<tr><td colspan="5"><div class="empty">Only the business owner can manage team accounts. You can review your own details under My Account.</div></td></tr>';return;
  }
  body.innerHTML='<tr><td colspan="5"><div class="empty">Loading team accounts…</div></td></tr>';
  try{
    const r=await fetch('/api/admin/users',{cache:'no-store'}),j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||'Could not load team accounts.');
    const rows=j.users||[];
    body.innerHTML=rows.map(u=>{
      const isSelf=ACCOUNT&&u.id===ACCOUNT.id;
      const status=u.active?'<span class="badge in-stock">Active</span>':'<span class="badge out">Disabled</span>';
      const roleCell=isSelf?esc(roleLabel(u.role)):`<select class="tiny-btn" onchange="setTeamRole('${u.id}',this.value)" aria-label="Role for ${esc(u.name)}">${teamRoles().map(r=>`<option value="${esc(r)}" ${r===u.role?'selected':''}>${esc(roleLabel(r))}</option>`).join('')}</select>`;
      const actions=isSelf?'<span class="muted">Your account</span>':`<button type="button" class="tiny-btn" onclick="toggleTeamMember('${u.id}',${u.active?'false':'true'})">${u.active?'Disable':'Enable'}</button>`;
      return `<tr><td><div><b>${esc(u.name||'')}</b>${isSelf?' <span class="badge in-stock" style="margin-left:6px">You</span>':''}<div class="muted">${esc(u.email||'')}</div></div></td><td>${roleCell}</td><td class="muted">${esc(accessLabel(u.role))}</td><td>${status}</td><td>${actions}</td></tr>`;
    }).join('')||'<tr><td colspan="5"><div class="empty">No team accounts yet.</div></td></tr>';
  }catch(err){body.innerHTML=`<tr><td colspan="5"><div class="empty">${esc(err.message||'Could not load team accounts.')}</div></td></tr>`}
}

function teamMsg(text,ok){const el=document.getElementById('teamMsg');if(!el)return;el.textContent=text||'';el.className='acct-msg'+(text?(ok?' ok':' err'):'')}

function openTeamMemberForm(){
  showModal('Add team member',`<form class="acct-form" onsubmit="saveTeamMember(event)">
    <div class="form-grid">
      <div class="field"><label>FULL NAME</label><input name="name" required maxlength="80" autocomplete="off"></div>
      <div class="field"><label>EMAIL</label><input name="email" type="email" required maxlength="254" autocomplete="off"></div>
      <div class="field"><label>PASSWORD</label><input name="password" type="password" required minlength="6" autocomplete="new-password"></div>
      <div class="field"><label>ROLE</label><select name="role">${teamRoles().map(r=>`<option value="${esc(r)}">${esc(roleLabel(r))}</option>`).join('')}</select><small class="muted">${esc(accessLabel('cashier'))}</small></div>
    </div>
    <div class="acct-row"><span class="acct-msg" id="teamMsg"></span><button class="btn primary">Create account</button></div>
  </form>`);
}

async function saveTeamMember(e){
  e.preventDefault();const f=e.currentTarget,d=new FormData(f);teamMsg('Creating…',true);
  try{
    const j=await acctRequest('/api/admin/users','POST',{name:d.get('name'),email:d.get('email'),password:d.get('password'),role:d.get('role')});
    const note=j.email&&!j.email.sent?(j.email.status==='not_configured'?' Email service is not configured yet — share the credentials manually.':' Welcome email could not be sent — share the credentials manually.'):' A welcome email was sent.';
    closeModal();toast(j.user.name+' can now sign in.'+note);renderTeamRows();
  }catch(err){teamMsg(err.message,false)}
}

async function toggleTeamMember(id,active){
  try{const j=await acctRequest('/api/admin/users','PATCH',{id,active:active===true||active==='true'});toast(j.user.name+(j.user.active?' enabled.':' disabled.'));renderTeamRows()}
  catch(err){toast(err.message)}
}

async function setTeamRole(id,role){
  try{const j=await acctRequest('/api/admin/users','PATCH',{id,role});toast(j.user.name+' is now '+roleLabel(j.user.role)+'.');renderTeamRows()}
  catch(err){toast(err.message);renderTeamRows()}
}

function renderAccountPage(){
  const root=document.getElementById('accountRoot');if(!root||!ACCOUNT)return;
  renderTeamRows();
  const a=ACCOUNT;
  const photo=a.avatar?`<img alt="" src="${esc(a.avatar)}">`:`<span>${esc(initialsOf(a.name))}</span>`;
  root.innerHTML=`
  <section class="acct-card acct-wide">
    <div class="acct-card-head"><div><h3>Personal information</h3><div class="panel-sub">Shown on your account. Changing your email changes the address you sign in with.</div></div></div>
    <form class="acct-form" onsubmit="saveAccountInfo(event)">
      <div class="form-grid">
        <div class="field"><label>FULL NAME</label><input name="name" required maxlength="80" value="${esc(a.name)}"></div>
        <div class="field"><label>USERNAME</label><input name="username" required minlength="3" maxlength="30" pattern="[A-Za-z0-9._\\-]{3,30}" value="${esc(a.username)}"></div>
        <div class="field"><label>EMAIL</label><input name="email" type="email" required maxlength="254" value="${esc(a.email)}"></div>
        <div class="field"><label>PHONE</label><input name="phone" type="tel" maxlength="30" value="${esc(a.phone)}" placeholder="+265 000 000 000"></div>
        <div class="field"><label>ROLE</label><input value="${esc(roleLabel(a.role))}" disabled><small class="muted">Set by the business owner under Team &amp; access.</small></div>
      </div>
      <div class="acct-row"><span class="acct-msg" data-acct-msg="info"></span><button class="btn primary">Save personal information</button></div>
    </form>
  </section>
  <div class="acct-stack">
  <section class="acct-card acct-photo-card">
    <div class="acct-card-head"><div><h3>Profile photograph</h3><div class="panel-sub">JPEG, PNG or WebP. Cropped to a square and saved at 256 px.</div></div></div>
    <div class="acct-photo">
      <div class="acct-photo-preview avatar">${photo}</div>
      <div class="acct-photo-actions">
        <input type="file" id="acctPhotoInput" accept="image/jpeg,image/png,image/webp" hidden onchange="onAvatarPicked(event)">
        <button type="button" class="btn secondary" onclick="document.getElementById('acctPhotoInput').click()">${a.avatar?'Change photo':'Upload photo'}</button>
        ${a.avatar?`<button type="button" class="btn secondary" onclick="removeAvatar()">Remove photo</button>`:''}
      </div>
    </div>
    <div class="acct-row"><span class="acct-msg" data-acct-msg="photo"></span></div>
  </section>
  <section class="acct-card">
    <div class="acct-card-head"><div><h3>Account actions</h3><div class="panel-sub">Sign out of Shop360 on this device.</div></div></div>
    <button type="button" class="btn secondary" onclick="accountSignOut()">Sign out</button>
  </section>
  </div>
  <section class="acct-card">
    <div class="acct-card-head"><div><h3>Account &amp; security</h3><div class="panel-sub">Changing your password signs you out on your other devices.</div></div></div>
    <form class="acct-form" onsubmit="changeAccountPassword(event)" autocomplete="off">
      <div class="field"><label>CURRENT PASSWORD</label><input name="currentPassword" type="password" required autocomplete="current-password"></div>
      <div class="field"><label>NEW PASSWORD</label><input name="newPassword" type="password" required minlength="6" autocomplete="new-password"></div>
      <div class="field"><label>CONFIRM NEW PASSWORD</label><input name="confirmPassword" type="password" required minlength="6" autocomplete="new-password"></div>
      <div class="acct-row"><span class="acct-msg" data-acct-msg="password"></span><button class="btn primary">Change password</button></div>
    </form>
  </section>
`;
}

async function saveAccountInfo(e){
  e.preventDefault();const f=new FormData(e.target);
  const body={name:f.get('name'),username:f.get('username'),email:f.get('email'),phone:f.get('phone')};
  acctMsg('info','Saving…',true);
  try{const j=await acctRequest('/api/account','PATCH',body);ACCOUNT=j.user;renderHeaderAvatar();renderAccountPage();acctMsg('info','Saved.',true);toast('Personal information saved.')}
  catch(err){acctMsg('info',err.message,false)}
}

// Square crop of the photo. zoom 1 = largest square that fits; px/py in [-1,1] slide the crop window.
// Slider right (px/py = 1) moves the photo right/down, so the crop window moves left/up.
function avatarCrop(img,zoom,px,py,size){
  const w=img.naturalWidth,h=img.naturalHeight,side=Math.min(w,h)/zoom;
  const sx=(w-side)/2*(1-px),sy=(h-side)/2*(1-py);
  const c=document.createElement('canvas');c.width=size;c.height=size;const g=c.getContext('2d');
  g.fillStyle='#ffffff';g.fillRect(0,0,size,size);g.imageSmoothingQuality='high';
  g.drawImage(img,sx,sy,side,side,0,0,size,size);return c;
}
function loadAvatarImage(url){
  return new Promise((resolve,reject)=>{const img=new Image();
    img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('That file could not be read as an image.'));img.src=url;});
}

let AVA_ADJ=null;
function openAvatarAdjuster(img){
  AVA_ADJ={img,zoom:1,px:0,py:0};
  showModal('Adjust profile photo',`
  <div class="ava-adj">
    <div class="ava-adj-preview"><canvas id="avaAdjCanvas" width="200" height="200" aria-label="Preview of your profile photo"></canvas></div>
    <div class="ava-adj-controls">
      <div class="ava-adj-row"><label for="avaZoom">Zoom</label><output id="avaZoomOut">1.00×</output></div>
      <input id="avaZoom" type="range" min="1" max="3" step="0.01" value="1" oninput="avaAdjSet('zoom',this.value)">
      <div class="ava-adj-row"><label for="avaPx">Left / right</label></div>
      <input id="avaPx" type="range" min="-1" max="1" step="0.01" value="0" oninput="avaAdjSet('px',this.value)">
      <div class="ava-adj-scale"><span>← Left</span><span>Right →</span></div>
      <div class="ava-adj-row"><label for="avaPy">Up / down</label></div>
      <input id="avaPy" type="range" min="-1" max="1" step="0.01" value="0" oninput="avaAdjSet('py',this.value)">
      <div class="ava-adj-scale"><span>↑ Up</span><span>Down ↓</span></div>
      <button type="button" class="tiny-btn" onclick="avaAdjReset()">Reset</button>
      <p class="ava-adj-hint">The circle shows exactly what will be saved.</p>
    </div>
    <div id="avaAdjMsg" class="ava-adj-msg" role="status"></div>
    <div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancel</button><button type="button" class="btn primary" id="avaAdjSave" onclick="saveAdjustedAvatar()">Save photo</button></div>
  </div>`);
  avaAdjDraw();
}
function avaAdjDraw(){
  const a=AVA_ADJ,cv=document.getElementById('avaAdjCanvas');if(!a||!cv)return;
  const g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);
  g.drawImage(avatarCrop(a.img,a.zoom,a.px,a.py,256),0,0,cv.width,cv.height);
  const out=document.getElementById('avaZoomOut');if(out)out.textContent=a.zoom.toFixed(2)+'×';
}
function avaAdjSet(k,v){if(!AVA_ADJ)return;AVA_ADJ[k]=Number(v);avaAdjDraw()}
function avaAdjReset(){
  if(!AVA_ADJ)return;AVA_ADJ.zoom=1;AVA_ADJ.px=0;AVA_ADJ.py=0;
  ['avaZoom','avaPx','avaPy'].forEach((id,i)=>{const el=document.getElementById(id);if(el)el.value=[1,0,0][i]});
  avaAdjDraw();
}
function avaAdjMsg(text,ok){const m=document.getElementById('avaAdjMsg');if(!m)return;m.textContent=text;m.className='ava-adj-msg'+(ok===false?' is-error':'')}

async function onAvatarPicked(e){
  const file=e.target.files&&e.target.files[0];e.target.value='';if(!file)return;
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)){acctMsg('photo','Choose a JPEG, PNG or WebP image.',false);return}
  if(file.size>15*1024*1024){acctMsg('photo','That photo is over 15 MB. Choose a smaller one.',false);return}
  try{const img=await loadAvatarImage(URL.createObjectURL(file));openAvatarAdjuster(img)}
  catch(err){acctMsg('photo',err.message,false)}
}

async function saveAdjustedAvatar(){
  const a=AVA_ADJ;if(!a)return;
  const btn=document.getElementById('avaAdjSave');if(btn)btn.disabled=true;
  avaAdjMsg('Uploading…',true);
  try{
    const image=avatarCrop(a.img,a.zoom,a.px,a.py,256).toDataURL('image/jpeg',0.86);
    const j=await acctRequest('/api/account/avatar','POST',{image});
    AVA_ADJ=null;closeModal();ACCOUNT=j.user;renderHeaderAvatar();renderAccountPage();toast('Profile photo updated.');
  }catch(err){if(btn)btn.disabled=false;avaAdjMsg(err.message,false)}
}

async function removeAvatar(){
  acctMsg('photo','Removing…',true);
  try{const j=await acctRequest('/api/account/avatar','DELETE');ACCOUNT=j.user;renderHeaderAvatar();renderAccountPage();toast('Profile photo removed.')}
  catch(err){acctMsg('photo',err.message,false)}
}

async function changeAccountPassword(e){
  e.preventDefault();const f=new FormData(e.target);
  if(f.get('newPassword')!==f.get('confirmPassword')){acctMsg('password','The new passwords do not match.',false);return}
  acctMsg('password','Updating…',true);
  try{await acctRequest('/api/account/password','POST',{currentPassword:f.get('currentPassword'),newPassword:f.get('newPassword')});e.target.reset();acctMsg('password','Password changed. Other devices have been signed out.',true)}
  catch(err){acctMsg('password',err.message,false)}
}

async function accountSignOut(){
  try{await fetch('/api/auth/signout',{method:'POST'})}catch(e){}
  location.reload();
}

renderHeaderAvatar();
loadAccount();
