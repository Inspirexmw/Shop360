(function(){
  if (window.__shop360MobileNavReady) return;
  window.__shop360MobileNavReady = true;
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const items = [
    ['dashboard','Dashboard'],['pos','POS'],['inventory','Inventory'],['sales','Sales'],
    ['daily','Daily'],['receiving','Stock log'],['orders','Orders'],['suppliers','Suppliers'],
    ['customers','Customers'],['layaway','Lay-by'],['finance:cash','Cashbook'],
    ['finance:exp','Expenses'],['finance:rec','Reconcile'],['finance:xfer','Transfers'],
    ['reports','Reports'],['team','Team'],['audit','Audit'],['settings','Settings'],['account','My Account']
  ];

  function sourceFor(key){
    if(key==='settings') return sidebar.querySelector('.side-bottom button[onclick*="openSettings"]');
    if(key==='account') return document.getElementById('headerAvatar');
    if(key.startsWith('finance:')) return sidebar.querySelector('[data-page="finance"][data-fin-tab="'+key.split(':')[1]+'"]');
    return sidebar.querySelector('.nav button[data-page="'+key+'"]:not([data-fin-tab])');
  }

  function isFormOpen(){
    const b=document.getElementById('modalBackdrop');
    return !!b && b.classList.contains('show');
  }

  // A form is dirty when any field differs from the value it was rendered with.
  function isFormDirty(){
    const body=document.getElementById('modalBody');
    if(!body) return false;
    return [...body.querySelectorAll('input,select,textarea')].some(el=>{
      if(el.disabled || el.type==='hidden' || el.type==='button' || el.type==='submit' || el.type==='file') return false;
      if(el.type==='checkbox' || el.type==='radio') return el.checked!==el.defaultChecked;
      if(el.tagName==='SELECT') return [...el.options].some(o=>o.selected!==o.defaultSelected);
      return el.value!==el.defaultValue;
    });
  }

  function activate(key){
    const source=sourceFor(key); if(!source) return;
    source.click();
    if(key.startsWith('finance:')){
      const group=document.getElementById('financeNavGroup');
      if(group) group.classList.add('is-open');
    }
  }

  // "Discard changes?" prompt.
  let discardCallback=null;
  const confirmBox=document.createElement('div');
  confirmBox.id='m-discard'; confirmBox.className='m-confirm';
  confirmBox.innerHTML='<div class="m-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="m-discard-title"><h3 id="m-discard-title">Discard changes?</h3><p>This form has unsaved changes.</p><div class="m-confirm-actions"><button type="button" class="btn secondary" data-keep>Keep editing</button><button type="button" class="btn primary" data-discard>Discard</button></div></div>';
  document.body.appendChild(confirmBox);
  function hideConfirm(){ confirmBox.classList.remove('show'); discardCallback=null; }
  confirmBox.addEventListener('click',e=>{
    if(e.target.closest('[data-discard]')){
      const cb=discardCallback; hideConfirm(); if(cb) cb();
    } else if(e.target.closest('[data-keep]') || e.target===confirmBox){
      hideConfirm();
    }
  });
  function askDiscard(onDiscard){
    discardCallback=onDiscard;
    confirmBox.classList.add('show');
  }

  // Every tab goes through here. A dirty form asks before it is discarded.
  function requestNavigate(key){
    if(!isFormOpen()){ activate(key); return; }
    if(!isFormDirty()){ closeModal(); activate(key); return; }
    askDiscard(()=>{ closeModal(); activate(key); });
  }

  const nav=document.createElement('nav');
  nav.className='mobile-bottom-nav';
  nav.id='shop360-mobile-bottom-nav';
  nav.setAttribute('aria-label','Main navigation');

  items.forEach(([key,label])=>{
    const source=sourceFor(key); if(!source) return;
    const button=document.createElement('button');
    button.type='button'; button.className='mobile-nav-item';
    button.dataset.mobileKey=key; button.setAttribute('aria-label',label); button.title=label;
    const iconSource=source.querySelector('.ico');
    const icon=source.querySelector('.ico svg') || source.querySelector('svg');
    const iconWrap=document.createElement('span'); iconWrap.className='mobile-nav-icon';
    if(iconSource){const s=getComputedStyle(iconSource);iconWrap.style.color=s.color;iconWrap.style.backgroundColor=s.backgroundColor;}
    if(icon) iconWrap.innerHTML=icon.outerHTML;
    else iconWrap.innerHTML='<span class="mobile-nav-dot"></span>';
    const text=document.createElement('span'); text.className='mobile-nav-label'; text.textContent=label;
    button.append(iconWrap,text);
    button.addEventListener('click',()=>requestNavigate(key));
    nav.appendChild(button);
  });
  document.body.appendChild(nav);

  function syncActive(){
    const active=sidebar.querySelector('.nav button.active[data-page]');
    const financeActive=sidebar.querySelector('.nav-subnav button.active, .nav-subnav button.on, .nav-subnav button[aria-current="page"]');
    let key=active ? active.dataset.page : 'dashboard';
    if(key==='finance'){
      const selected=financeActive || sidebar.querySelector('.nav-subnav button[style*="font-weight"]');
      if(selected && selected.dataset.finTab) key='finance:'+selected.dataset.finTab;
      else key='finance:cash';
    }
    nav.querySelectorAll('.mobile-nav-item').forEach(b=>b.classList.toggle('active',b.dataset.mobileKey===key));
  }
  new MutationObserver(syncActive).observe(sidebar,{subtree:true,attributes:true,attributeFilter:['class','aria-current','style']});
  syncActive();

  // Closing a dirty form with Cancel, the X or the backdrop asks first.
  // Capture phase, so the inline onclick handlers wait for the user's decision.
  document.addEventListener('click',e=>{
    if(!isFormOpen() || !isFormDirty()) return;
    const t=e.target;
    if(!(t instanceof Element)) return;
    const backdropEl=document.getElementById('modalBackdrop');
    const btn=t.closest('button');
    const isX=!!t.closest('#modalBackdrop .modal-head .close');
    const isCancel=!!(btn && btn.closest('#modalBackdrop #modalBody .form-actions') && /^\s*cancel\s*$/i.test(btn.textContent));
    const isBackdrop=t===backdropEl;
    if(!(isX||isCancel||isBackdrop)) return;
    e.stopImmediatePropagation(); e.preventDefault();
    askDiscard(()=>closeModal());
  },true);

  // Top bar hides while a form is open (CSS). Nothing else to sync.
  const backdrop=document.getElementById('modalBackdrop');
  function syncForm(){ document.body.classList.toggle('m-form-open',isFormOpen()); }
  if(backdrop) new MutationObserver(syncForm).observe(backdrop,{attributes:true,attributeFilter:['class']});
  syncForm();

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && confirmBox.classList.contains('show')) hideConfirm();
  });
})();
