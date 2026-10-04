
document.addEventListener('DOMContentLoaded',()=>{
 const commands=Array.isArray(window.VORTEXIA_COMMANDS)?window.VORTEXIA_COMMANDS:[];
 const sections=[...document.querySelectorAll('.section')];
 const nav=[...document.querySelectorAll('[data-section]')];
 const sidebar=document.getElementById('sidebar');
 const modal=document.getElementById('modal');
 const modalBody=document.getElementById('modalBody');
 const tabs=document.getElementById('tabs');
 const grid=document.getElementById('commandGrid');
 const search=document.getElementById('cmdSearch');
 const sideSearch=document.getElementById('search');
 const noResults=document.getElementById('noResults');
 let active='All';
 const esc=s=>String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
 const cats=['All',...new Set(commands.map(c=>c.category))];
 tabs.innerHTML=cats.map(c=>`<button class="tab ${c==='All'?'active':''}" data-cat="${esc(c)}">${esc(c)}${c==='All'?` <span>${commands.length}</span>`:''}</button>`).join('');
 function show(id){sections.forEach(s=>s.classList.toggle('active',s.id===id));nav.forEach(b=>b.classList.toggle('active',b.dataset.section===id));const btn=nav.find(b=>b.dataset.section===id);document.getElementById('crumb').textContent=btn?btn.textContent.trim():id;sidebar.classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});}
 nav.forEach(b=>b.addEventListener('click',()=>show(b.dataset.section)));
 document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.jump)));
 document.getElementById('openNav').addEventListener('click',()=>sidebar.classList.add('open'));
 document.getElementById('closeNav').addEventListener('click',()=>sidebar.classList.remove('open'));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){modal.hidden=true;modal.setAttribute('aria-hidden','true');sidebar.classList.remove('open')}});
 function matches(c,q){return `${c.name} ${c.description} ${c.category} ${(c.options||[]).map(o=>o.name+' '+(o.description||'')).join(' ')}`.toLowerCase().includes(q)}
 function render(){const q=(search?.value||'').trim().toLowerCase();const list=commands.filter(c=>(active==='All'||c.category===active)&&(!q||matches(c,q)));grid.innerHTML=list.map((c,i)=>`<article class="command" tabindex="0" data-name="${esc(c.name)}"><div class="command-head"><code>/${esc(c.name)}</code><span class="badge">${esc(c.category)}</span></div><p>${esc(c.description)}</p><small>${(c.options||[]).length?esc((c.options||[]).map(o=>o.name).join(' · ')):'No options — run directly'}</small></article>`).join('');noResults.hidden=list.length!==0;grid.querySelectorAll('.command').forEach(el=>{const fn=()=>openCommand(commands.find(c=>c.name===el.dataset.name));el.addEventListener('click',fn);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn()}})});}
 function openCommand(c){if(!c)return;const options=(c.options||[]).map(o=>`<div class="opt"><code>${esc(o.name)}</code> <span>${esc(o.description||'')}</span> ${o.required?'<b class="req">required</b>':'<b class="optmark">optional</b>'}</div>`).join('');const usage=c.examples?.[0]||`/${c.name}`;modalBody.innerHTML=`<span class="tag">${esc(c.category)}</span><h2 id="modalTitle">/${esc(c.name)}</h2><p>${esc(c.description)}</p><div class="detail-block"><h4>Usage</h4><div class="copy-row"><code>${esc(usage)}</code><button class="copy-btn" id="copyCmd">Copy</button></div></div>${options?`<div class="detail-block"><h4>Options</h4>${options}</div>`:''}<div class="detail-block"><h4>How to use</h4><ol>${(c.guide||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>${(c.notes||[]).length?`<div class="detail-block"><h4>Important</h4>${c.notes.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}<div class="detail-block"><h4>Example</h4><code>${esc(usage)}</code></div>`;modal.hidden=false;modal.setAttribute('aria-hidden','false');document.getElementById('copyCmd')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(usage);document.getElementById('copyCmd').textContent='Copied ✓'}catch{document.getElementById('copyCmd').textContent='Select & copy'}});}
 document.getElementById('modalClose').addEventListener('click',()=>{modal.hidden=true;modal.setAttribute('aria-hidden','true')});modal.addEventListener('click',e=>{if(e.target===modal){modal.hidden=true;modal.setAttribute('aria-hidden','true')}});
 tabs.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;active=b.dataset.cat;tabs.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));render()});search.addEventListener('input',render);sideSearch.addEventListener('input',()=>{search.value=sideSearch.value;show('commands');render()});
 const systemGrid=document.getElementById('systemGrid');
 const systemInfo={Moderation:['🛡️','Protect and manage your server',['/ban','/kick','/timeout','/warn','/purge']],Security:['🔒','Automod and safety controls',['/automod','/banword','/automod-strikes','/cmdlog']],Tickets:['🎫','Support ticket workflow',['/ticket','/delivery']],Invites:['📨','Invite attribution and panels',['/invites','/invite-panel','/invitestats-setup']],Welcome:['👋','Onboarding and autoroles',['/welcome','/autorole']],Economy:['🪙','Coins and rewards',['/balance','/daily','/work','/pay']],Leveling:['⭐','XP and rankings',['/rank','/level-leaderboard','/level-setup']],Builders:['🧩','Embeds and Components V2',['/embed','/editembed','/v2builder','/v2edit']],Music:['🎵','Voice music player',['/music']],Minecraft:['⛏️','Minecraft utilities',['/mc-profile','/mcstatus']],Automation:['⚙️','Automatic responses',['/response','/response-list','/response-remove']],Dashboard:['◈','Visual control center',['/dashboard']],Community:['💬','Community interactions',['/poll','/suggest','/report','/giveaway']],Utility:['🔧','Everyday utilities',['/ping','/serverinfo','/userinfo','/avatar']],Admin:['👑','Administrative tools',['/email','/servers','/statsboard']],Fun:['🎲','Entertainment commands',['/joke','/coinflip','/dice']],AI:['✦','AI chat tools',['/chatgpt'] ]};
 const systems=[...new Set(commands.map(c=>c.category))].filter(x=>systemInfo[x]);
 systemGrid.innerHTML=systems.map(k=>{const v=systemInfo[k];return `<article class="system-card" data-system="${esc(k)}"><div class="mini">${v[0]} ${esc(k.toUpperCase())}</div><h3>${esc(v[1])}</h3><p>Open the system guide and jump to related commands.</p><ul>${v[2].map(x=>`<li><code>${esc(x)}</code></li>`).join('')}</ul></article>`}).join('');
 document.querySelectorAll('.feature[data-system],.system-card[data-system]').forEach(el=>el.addEventListener('click',()=>{const s=el.dataset.system;show('commands');active=s;tabs.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.cat===s));render()}));
 render();
});
