
(()=>{
  const root=document.documentElement,body=document.body,sidebar=document.querySelector('.sidebar'),topbar=document.querySelector('.topbar'),actions=document.querySelector('.top-actions'),brand=document.querySelector('.sidebar .brand');
  const icon=(kind)=>kind==='sun'?'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>':'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z"/></svg>';
  let theme='light';
  const apply=()=>{root.dataset.theme=theme;const dark=theme==='dark';toggle.innerHTML=icon(dark?'sun':'moon');toggle.title=dark?'Switch to light theme':'Switch to dark theme';toggle.setAttribute('aria-label',toggle.title);toggle.setAttribute('aria-pressed',String(dark));};
  const toggle=document.createElement('button');toggle.type='button';toggle.className='theme-switch';toggle.addEventListener('click',()=>{theme=theme==='dark'?'light':'dark';apply()});
  if(actions)actions.prepend(toggle);apply();
  if(brand&&!brand.querySelector('.brand-copy')){const copy=brand.querySelector('.brand-copy')||brand.querySelector('div:not(.logo)');if(copy)copy.classList.add('brand-copy')}
  if(brand&&!brand.querySelector('.sidebar-collapse')){const b=document.createElement('button');b.type='button';b.className='sidebar-collapse';b.title='Collapse sidebar';b.setAttribute('aria-label','Collapse sidebar');b.innerHTML='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m5-8 3-3m-3 3 3 3"/></svg>';brand.append(b);b.addEventListener('click',()=>{if(matchMedia('(max-width:760px)').matches){closeMobile();return}const collapsed=!body.classList.contains('sidebar-collapsed');body.classList.toggle('sidebar-collapsed',collapsed);b.title=collapsed?'Expand sidebar':'Collapse sidebar';b.setAttribute('aria-label',b.title)})}
  const mobileBtn=document.createElement('button');mobileBtn.type='button';mobileBtn.className='btn secondary mobile-menu ui-control';mobileBtn.setAttribute('aria-label','Open navigation');mobileBtn.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  const crumb=topbar?.querySelector('.crumb');if(topbar&&crumb){const left=crumb.parentElement;if(left&&!left.querySelector('.mobile-menu'))left.prepend(mobileBtn)}
  const scrim=document.createElement('div');scrim.className='mobile-scrim';scrim.setAttribute('aria-hidden','true');body.append(scrim);
  function closeMobile(){body.classList.remove('mobile-nav-open');}
  function openMobile(){body.classList.add('mobile-nav-open')}
  mobileBtn.addEventListener('click',openMobile);window.toggleMobileNav=()=>{body.classList.toggle('mobile-nav-open')};scrim.addEventListener('click',closeMobile);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobile()});
  document.querySelectorAll('.sidebar .nav button').forEach(b=>b.addEventListener('click',closeMobile));
})();
