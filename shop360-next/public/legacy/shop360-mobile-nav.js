(function(){
  if (window.__shop360MobileNavReady) return;
  window.__shop360MobileNavReady = true;
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  const nav = document.createElement('nav');
  nav.className = 'mobile-bottom-nav';
  nav.id = 'shop360-mobile-bottom-nav';
  nav.setAttribute('aria-label','Main navigation');
  const items = [
    ['dashboard','Dashboard'],['pos','POS'],['inventory','Inventory'],['sales','Sales'],
    ['daily','Daily'],['receiving','Stock log'],['orders','Orders'],['suppliers','Suppliers'],
    ['customers','Customers'],['layaway','Lay-by'],['finance:cash','Cashbook'],
    ['finance:exp','Expenses'],['finance:rec','Reconcile'],['finance:xfer','Transfers'],
    ['reports','Reports'],['team','Team'],['settings','Settings'],['backup','Backup']
  ];
  function sourceFor(key){
    if(key==='settings') return sidebar.querySelector('.side-bottom button[onclick*="openSettings"]');
    if(key==='backup') return sidebar.querySelector('#backupBtn');
    if(key.startsWith('finance:')) return sidebar.querySelector('[data-page="finance"][data-fin-tab="'+key.split(':')[1]+'"]');
    return sidebar.querySelector('.nav button[data-page="'+key+'"]:not([data-fin-tab])');
  }
  items.forEach(([key,label])=>{
    const source=sourceFor(key); if(!source) return;
    const button=document.createElement('button');
    button.type='button'; button.className='mobile-nav-item';
    button.dataset.mobileKey=key; button.setAttribute('aria-label',label); button.title=label;
    const iconSource=source.querySelector('.ico');
    const icon=source.querySelector('.ico svg') || source.querySelector('svg');
    const iconWrap=document.createElement('span'); iconWrap.className='mobile-nav-icon';
    if(iconSource){const iconStyle=getComputedStyle(iconSource);iconWrap.style.color=iconStyle.color;iconWrap.style.backgroundColor=iconStyle.backgroundColor;}
    if(icon) iconWrap.innerHTML=icon.outerHTML;
    else iconWrap.innerHTML='<span class="mobile-nav-dot"></span>';
    const text=document.createElement('span'); text.className='mobile-nav-label'; text.textContent=label;
    button.append(iconWrap,text);
    button.addEventListener('click',()=>{
      source.click();
      nav.querySelectorAll('.mobile-nav-item').forEach(b=>b.classList.toggle('active',b===button));
      if(key.startsWith('finance:')){
        const group=document.getElementById('financeNavGroup');
        if(group) group.classList.add('is-open');
      }
    });
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
  const observer=new MutationObserver(syncActive);
  observer.observe(sidebar,{subtree:true,attributes:true,attributeFilter:['class','aria-current','style']});
  syncActive();
  window.addEventListener('resize',()=>{ if(window.innerWidth>720) nav.scrollLeft=0; });
})();
