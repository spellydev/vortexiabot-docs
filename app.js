document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const typeNames = {3:'Text',4:'Integer',5:'Number',6:'User',7:'Channel',8:'Role',9:'Mentionable',10:'Number',11:'Attachment'};

  const sections = $$('.section');
  const nav = $$('[data-section]');
  const sidebar = $('#sidebar');
  const backdrop = $('#navBackdrop');
  const grid = $('#commandGrid');
  const tabs = $('#tabs');
  const search = $('#cmdSearch');
  const sideSearch = $('#search');
  const noResults = $('#noResults');
  const crumb = $('#crumb');
  const main = $('#mainContent');
  const openNav = $('#openNav');
  const closeNav = $('#closeNav');
  const modal = $('#docsModal');
  const docsBody = $('#docsBody');
  const docsTitle = $('#docsTitle');
  const docsCategory = $('#docsCategory');
  const docsClose = $('#docsClose');

  let commands = [];
  let commandMap = new Map();
  let categories = ['All'];
  let activeCategory = 'All';
  let lastFocus = null;

  const permissionNames = [
    [8n,'Administrator'],[4n,'Ban Members'],[2n,'Kick Members'],[32n,'Manage Server'],
    [16n,'Manage Channels'],[2048n,'Manage Messages'],[64n,'Manage Roles'],[1099511627776n,'Moderate Members']
  ];
  function permissionLabel(value){
    if (!value) return 'No special permission listed';
    try { const bits=BigInt(value); const names=permissionNames.filter(([b])=>(bits&b)===b).map(([,n])=>n); return names.length?names.join(' · '):`Permission bit: ${value}`; }
    catch { return `Permission: ${value}`; }
  }

  function setDrawer(open){
    sidebar?.classList.toggle('open',open);
    backdrop?.classList.toggle('visible',open);
    document.body.classList.toggle('drawer-open',open);
    openNav?.setAttribute('aria-expanded',String(open));
  }
  function showSection(id, updateHash=true){
    const target=sections.some(s=>s.id===id)?id:'home';
    sections.forEach(s=>s.classList.toggle('active',s.id===target));
    nav.forEach(b=>b.classList.toggle('active',b.dataset.section===target));
    const active=nav.find(b=>b.dataset.section===target);
    if(crumb) crumb.textContent=active?.textContent.trim()||target;
    setDrawer(false);
    if(updateHash && !location.hash.startsWith('#command/')) history.replaceState(null,'',`#${target}`);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderTabs(){
    tabs.innerHTML=categories.map(cat=>`<button type="button" class="tab ${cat===activeCategory?'active':''}" data-cat="${esc(cat)}">${esc(cat)}${cat==='All'?` <span>${commands.length}</span>`:''}</button>`).join('');
  }
  function matches(c,q){
    const opts=(c.options||[]).flatMap(o=>[o.name,o.description,...(o.choices||[]).flatMap(x=>[x.name,x.value])]).join(' ');
    const guide=(c.guide||[]).join(' '), notes=(c.notes||[]).join(' ');
    return `${c.name} ${c.description} ${c.category} ${opts} ${guide} ${notes}`.toLowerCase().includes(q);
  }

  function render(){
    const q=String(search?.value||'').trim().toLowerCase();
    const list=commands.filter(c=>(activeCategory==='All'||c.category===activeCategory)&&(!q||matches(c,q)));
    grid.innerHTML=list.map(c=>{
      const opts=c.options||[];
      const summary=opts.length?opts.map(o=>`${o.name}${o.required?' *':''}`).join(' · '):'No options — run directly';
      return `<article class="command" tabindex="0" role="button" data-command="${esc(c.name)}" aria-label="Open documentation for /${esc(c.name)}">
        <div class="command-head"><code>/${esc(c.name)}</code><span class="badge">${esc(c.category||'General')}</span></div>
        <p>${esc(c.description||'No description available.')}</p>
        <small>${esc(summary)}</small>
        <button type="button" class="command-open" data-command="${esc(c.name)}">View documentation <span>→</span></button>
      </article>`;
    }).join('');
    if(noResults) noResults.hidden=list.length!==0;
  }

  function openDocs(name, updateHash=true){
    const c=commandMap.get(name);
    if(!c || !modal || !docsBody) return;
    lastFocus=document.activeElement;
    docsCategory.textContent=c.category||'COMMAND';
    docsTitle.textContent=`/${c.name}`;
    const opts=c.options||[];
    const guide=c.guide?.length?c.guide:[`Run /${c.name} in Discord.`,`Complete the required options shown by Discord.`,`Review the values and submit the command.`,`Check Vortexia's response to confirm the result.`];
    const optionHtml=opts.length?opts.map(o=>{
      const choices=(o.choices||[]).map(x=>x.name).join(', ');
      const limits=[o.min_value!=null?`min ${o.min_value}`:'',o.max_value!=null?`max ${o.max_value}`:''].filter(Boolean).join(' · ');
      return `<div class="doc-option"><div><code>${esc(o.name)}</code><span class="type-pill">${esc(typeNames[o.type]||`Type ${o.type||'?'}`)}</span></div><p>${esc(o.description||'No option description.')}</p>${choices?`<small>Choices: ${esc(choices)}</small>`:''}${limits?`<small>${esc(limits)}</small>`:''}<b class="${o.required?'required':'optional'}">${o.required?'Required':'Optional'}</b></div>`;
    }).join(''):'<div class="doc-empty">This command has no options. Run it directly.</div>';
    const usage=c.examples?.[0]||`/${c.name}`;
    const notes=(c.notes||[]);
    docsBody.innerHTML=`
      <div class="doc-hero"><div><p class="doc-description">${esc(c.description||'No description available.')}</p><div class="doc-meta"><span>Permissions: <b>${esc(permissionLabel(c.default_member_permissions))}</b></span><span>Category: <b>${esc(c.category||'General')}</b></span></div></div></div>
      <div class="doc-section"><div class="doc-section-title"><span>01</span><div><h3>Usage</h3><p>Use this exact command format in Discord.</p></div></div><div class="usage-box"><code>${esc(usage)}</code><button type="button" class="copy-doc" data-copy="${esc(usage)}">Copy</button></div></div>
      <div class="doc-section"><div class="doc-section-title"><span>02</span><div><h3>Options</h3><p>Every argument Discord may ask you to provide.</p></div></div><div class="doc-options">${optionHtml}</div></div>
      <div class="doc-section"><div class="doc-section-title"><span>03</span><div><h3>How to use — step by step</h3><p>Follow these steps from start to finish.</p></div></div><ol class="doc-steps">${guide.map((s,i)=>`<li><span>${i+1}</span><div>${esc(s)}</div></li>`).join('')}</ol></div>
      <div class="doc-section"><div class="doc-section-title"><span>04</span><div><h3>Example</h3><p>A ready-to-follow example for this command.</p></div></div><div class="example-box"><code>${esc(usage)}</code></div></div>
      ${notes.length?`<div class="doc-section"><div class="doc-section-title"><span>05</span><div><h3>Important notes</h3></div></div><ul class="doc-notes">${notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></div>`:''}`;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    if(updateHash) history.replaceState(null,'',`#command/${encodeURIComponent(c.name)}`);
    docsClose?.focus({preventScroll:true});
  }
  function closeDocs(updateHash=true){
    if(!modal) return;
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open');
    if(updateHash && location.hash.startsWith('#command/')) history.replaceState(null,'','#commands');
    if(lastFocus?.focus) lastFocus.focus({preventScroll:true});
  }

  // Delegated click handler: works for every current and future command card/button.
  grid?.addEventListener('click',e=>{
    const target=e.target.closest('[data-command]');
    if(!target || !grid.contains(target)) return;
    e.preventDefault(); e.stopPropagation();
    openDocs(target.dataset.command);
  });
  grid?.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ') && e.target.closest('.command')){ e.preventDefault(); openDocs(e.target.closest('.command').dataset.command); }
  });
  docsBody?.addEventListener('click',async e=>{
    const b=e.target.closest('[data-copy]'); if(!b) return;
    const text=b.dataset.copy||'';
    try{await navigator.clipboard.writeText(text); b.textContent='Copied ✓'; setTimeout(()=>b.textContent='Copy',1200);}catch{ b.textContent='Copy unavailable'; }
  });
  docsClose?.addEventListener('click',()=>closeDocs());
  modal?.addEventListener('click',e=>{if(e.target.matches('[data-close-docs]')) closeDocs();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(modal?.classList.contains('is-open')) closeDocs(); else if(sidebar?.classList.contains('open')) setDrawer(false);}});

  nav.forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.section)));
  $$('[data-jump]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.jump)));
  openNav?.addEventListener('click',()=>setDrawer(true)); closeNav?.addEventListener('click',()=>setDrawer(false)); backdrop?.addEventListener('click',()=>setDrawer(false));
  tabs?.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;activeCategory=b.dataset.cat;renderTabs();render();});
  search?.addEventListener('input',render);
  sideSearch?.addEventListener('input',()=>{search.value=sideSearch.value;activeCategory='All';renderTabs();render();showSection('commands');});
  $$('.feature[data-system], .system-card[data-system]').forEach(card=>card.addEventListener('click',()=>{activeCategory=categories.includes(card.dataset.system)?card.dataset.system:'All';renderTabs();render();showSection('commands');}));

  function route(){
    const h=decodeURIComponent(location.hash.replace(/^#/,'')||'');
    if(h.startsWith('command/')){showSection('commands',false);openDocs(h.slice(8),false);return;}
    showSection(sections.some(s=>s.id===h)?h:'home',false);
  }
  window.addEventListener('hashchange',route);

  async function boot(){
    try{
      const response=await fetch('commands.json',{cache:'no-store'});
      if(!response.ok) throw new Error(`commands.json HTTP ${response.status}`);
      const data=await response.json();
      if(!Array.isArray(data) || data.length!==97) throw new Error(`Expected 97 commands, got ${Array.isArray(data)?data.length:0}`);
      commands=data; commandMap=new Map(commands.map(c=>[c.name,c])); categories=['All',...new Set(commands.map(c=>c.category).filter(Boolean))];
    }catch(error){
      console.error('Vortexia docs command catalog failed:',error);
      // Fallback to inline data if a static host blocks fetch for any reason.
      const fallback=Array.isArray(window.VORTEXIA_COMMANDS)?window.VORTEXIA_COMMANDS:[];
      commands=fallback; commandMap=new Map(commands.map(c=>[c.name,c])); categories=['All',...new Set(commands.map(c=>c.category).filter(Boolean))];
    }
    renderTabs(); render(); route();
  }
  boot();
});
