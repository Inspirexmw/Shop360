// ---- Header business name, header avatar, and the My Account page ----
// Account data comes from /api/account (cookie session). Nothing about the user is kept in browser storage.
let ACCOUNT=null;

function initialsOf(name){const p=String(name||'').trim().split(/\s+/).filter(Boolean);if(!p.length)return '··';return (p.length===1?p[0].slice(0,2):p[0][0]+p[p.length-1][0]).toUpperCase()}

// Centre header text: the business name from Settings. Called from renderAll().
function renderHeaderBusiness(){const el=document.getElementById('headerBusiness');if(!el)return;const n=String((typeof SHOP!=='undefined'&&SHOP.name)||'').trim()||'Your business';el.textContent=n;el.title=n}

function renderHeaderAvatar(){const btn=document.getElementById('headerAvatar');if(!btn)return;const a=ACCOUNT;btn.innerHTML=a&&a.avatar?`<img alt="" src="${esc(a.avatar)}">`:`<span id="headerAvatarText">${esc(initialsOf(a?a.name:''))}</span>`;
  const n=document.getElementById('userName'),r=document.getElementById('userRole');if(a){if(n)n.textContent=a.name;if(r)r.textContent=a.role}}

function renderGreeting(){const el=document.getElementById('dashGreeting');if(!el)return;const h=new Date().getHours();const part=h<12?'Good morning':h<17?'Good afternoon':'Good evening';const name=ACCOUNT&&String(ACCOUNT.name||ACCOUNT.username||'').trim();el.textContent=name?part+', '+name:part}
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

// Team & access: lists the signed-in account only. Other members are not in the API yet.
function renderTeamRows(){
  const body=document.getElementById('teamRows');if(!body)return;
  if(!ACCOUNT){body.innerHTML='<tr><td colspan="4"><div class="empty">Loading your account…</div></td></tr>';return}
  const a=ACCOUNT,role=String(a.role||'');const label=role?role.charAt(0).toUpperCase()+role.slice(1):'Member';
  body.innerHTML=`<tr class="team-row-link" tabindex="0" role="button" aria-label="Open My Account" onclick="openMyAccount()" onkeydown="if(event.key==='Enter')openMyAccount()"><td><div><b>${esc(a.name||'Your account')}</b> <span class="badge in-stock" style="margin-left:6px">You</span><div class="muted">${esc(a.email||'')}</div></div></td><td>${esc(label)}</td><td>Your own account · profile, photo, password</td><td><span class="badge in-stock">Signed in</span></td></tr>`;
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
        <div class="field"><label>ROLE</label><input value="${esc(a.role==='owner'?'Owner':'Employee')}" disabled><small class="muted">Set by the business owner under Team &amp; access.</small></div>
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
