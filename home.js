(() => {
  const CLIENT_ID = "1205185289627115670";
  const SUPPORT_CODE = "7RfWAKeAZZ";
  const SK_USER = "vx_user_v1";
  const SK_REV = "vx_reviews_v1";
  const $ = id => document.getElementById(id);
  const toast = m => { const t=$("toast"); t.textContent=m; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2600); };
  const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const avatar = n => { const c=["5B8CFF","38BDF8","818CF8","22C55E","F59E0B"][(n||"U").charCodeAt(0)%5]; return `https://ui-avatars.com/api/?name=${encodeURIComponent((n||"U")[0])}&background=${c}&color=fff&size=128&bold=true`; };

  // particles
  const p=$("particles");
  if(p) for(let i=0;i<22;i++){ const s=document.createElement("span"); s.style.left=Math.random()*100+"%"; s.style.animationDuration=(8+Math.random()*14)+"s"; s.style.animationDelay=Math.random()*8+"s"; s.style.width=s.style.height=(2+Math.random()*3)+"px"; p.appendChild(s); }

  // auth
  const getUser=()=>{ try{return JSON.parse(localStorage.getItem(SK_USER)||"null")}catch{return null} };
  const setUser=u=>{ if(u) localStorage.setItem(SK_USER,JSON.stringify(u)); else localStorage.removeItem(SK_USER); renderAuth(); };
  function renderAuth(){
    const u=getUser(), btn=$("btnLogin"), chip=$("userChip"), hint=$("loginHint");
    if(u){ btn.style.display="none"; chip.classList.add("show"); $("userName").textContent=u.name; $("userAvatar").src=u.avatar||avatar(u.name);
      if(hint) hint.innerHTML=`✅ Logged in as <strong>${esc(u.name)}</strong>`; }
    else { btn.style.display=""; chip.classList.remove("show"); if(hint) hint.innerHTML=`🔐 Login required to post a review.`; }
  }
  $("btnLogin")?.addEventListener("click",()=>$("loginModal").classList.add("open"));
  $("closeLogin")?.addEventListener("click",()=>$("loginModal").classList.remove("open"));
  $("loginModal")?.addEventListener("click",e=>{ if(e.target===$("loginModal")) $("loginModal").classList.remove("open"); });
  $("userChip")?.addEventListener("click",()=>{ const u=getUser(); $("accountSub").textContent=u?`${u.name} · ${u.provider||"guest"}`:""; $("accountModal").classList.add("open"); });
  $("closeAccount")?.addEventListener("click",()=>$("accountModal").classList.remove("open"));
  $("btnLogout")?.addEventListener("click",()=>{ setUser(null); $("accountModal").classList.remove("open"); toast("Logged out"); });
  $("btnGuestLogin")?.addEventListener("click",()=>{
    const name=($("guestName").value||"").trim();
    if(name.length<2) return toast("Name min 2 characters");
    setUser({name,avatar:avatar(name),provider:"guest",id:"g_"+Date.now()});
    $("loginModal").classList.remove("open"); toast("Welcome, "+name);
  });
  $("btnDiscordLogin")?.addEventListener("click",()=>{
    const redirect=encodeURIComponent(location.href.split("#")[0]);
    toast("Opening Discord…");
    setTimeout(()=>{ location.href=`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=token&scope=identify`; },350);
  });
  async function tryDiscordToken(){
    const hash=location.hash.replace(/^#/,"");
    if(!hash.includes("access_token")) return;
    const token=new URLSearchParams(hash).get("access_token");
    if(!token) return;
    try{
      const res=await fetch("https://discord.com/api/users/@me",{headers:{Authorization:`Bearer ${token}`}});
      if(!res.ok) throw new Error("fail");
      const me=await res.json();
      const av=me.avatar?`https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=128`:avatar(me.username);
      setUser({name:me.global_name||me.username,avatar:av,provider:"discord",id:me.id});
      history.replaceState(null,"",location.pathname+location.search);
      toast("Logged in with Discord");
    }catch{ toast("Discord login failed — use Guest"); }
  }

  // reviews
  let rating=5;
  const getReviews=()=>{ try{return JSON.parse(localStorage.getItem(SK_REV)||"[]")}catch{return[]} };
  const saveReviews=l=>localStorage.setItem(SK_REV,JSON.stringify(l));
  // Start with an empty review list; never display fabricated testimonials.
  if(!localStorage.getItem(SK_REV)) saveReviews([]);
  function paintRating(){
    $("starPick")?.querySelectorAll("button").forEach(b=>{
      const active=Number(b.dataset.v)<=rating;
      b.classList.toggle("on",active);
      b.setAttribute("aria-pressed",String(Number(b.dataset.v)===rating));
      b.setAttribute("aria-label",`${b.dataset.v} star${b.dataset.v=== "1" ? "" : "s"}`);
    });
  }
  $("starPick")?.querySelectorAll("button").forEach(b=>{
    b.addEventListener("click",()=>{ rating=Number(b.dataset.v); paintRating(); });
    b.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); rating=Number(b.dataset.v); paintRating(); }});
  });
  paintRating();
  const stars=n=>"★".repeat(n)+"☆".repeat(5-n);
  const ago=ts=>{ const s=Math.floor((Date.now()-ts)/1e3); if(s<60)return"just now"; if(s<3600)return Math.floor(s/60)+"m ago"; if(s<86400)return Math.floor(s/3600)+"h ago"; return Math.floor(s/86400)+"d ago"; };
  function renderReviews(){
    const list=getReviews().sort((a,b)=>b.at-a.at);
    const valid=list.filter(r=>Number.isInteger(Number(r.rating))&&Number(r.rating)>=1&&Number(r.rating)<=5);
    const n=valid.length, avg=n?valid.reduce((sum,r)=>sum+Number(r.rating),0)/n:0;
    $("rCount").textContent=String(n);
    $("statAvg").textContent=n?avg.toFixed(1):"—";
    $("avgNum").textContent=n?avg.toFixed(1):"—";
    $("avgStars").textContent=n?stars(Math.round(avg)):"☆☆☆☆☆";
    $("avgCount").textContent=String(n);
    $("reviewsBox").innerHTML=n?valid.sort((a,b)=>b.at-a.at).map(r=>`<article class="review"><div class="review-top"><img src="${esc(r.avatar||avatar(r.name))}" alt="${esc(r.name)} avatar" width="40" height="40" loading="lazy"/><div><strong>${esc(r.name)}</strong><span>${ago(r.at)}</span></div><div class="review-stars">${stars(r.rating)}</div></div><p>${esc(r.text)}</p></article>`).join(""):`<p style="color:var(--muted);text-align:center;padding:1.2rem">No reviews yet.</p>`;
  }
  $("btnSubmitReview")?.addEventListener("click",()=>{
    if(!Number.isInteger(rating)||rating<1||rating>5) return toast("Choose a star rating first");
    const u=getUser();
    if(!u){ $("loginModal").classList.add("open"); return toast("Login first"); }
    const text=($("revText").value||"").trim();
    if(text.length<8) return toast("Min 8 characters");
    const list=getReviews();
    const i=list.findIndex(r=>r.uid===u.id);
    const entry={id:"r_"+Date.now(),uid:u.id,name:u.name,avatar:u.avatar||avatar(u.name),rating,text:text.slice(0,400),at:Date.now()};
    if(i>=0) list[i]=entry; else list.unshift(entry);
    saveReviews(list.slice(0,100));
    $("revText").value=""; renderReviews();
    toast(i>=0?"Review updated":"Review posted!");
  });

  // filters + reveal
  document.getElementById("menu")?.addEventListener("click",()=>$("nav").classList.toggle("open"));
  document.querySelectorAll(".fbtn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".fbtn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const f=btn.dataset.filter;
      document.querySelectorAll(".cmd-cat").forEach(c=>c.classList.toggle("hide",f!=="all"&&c.dataset.cat!==f));
    });
  });
  const io=new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("show"); io.unobserve(e.target);} }); },{threshold:0.1});
  document.querySelectorAll(".reveal,.cmd-card,.fcard").forEach(el=>io.observe(el));

  // These are support-server counts only; no bot server count, online status, or latency is shown.
  fetch(`https://discord.com/api/v10/invites/${SUPPORT_CODE}?with_counts=true`).then(r=>r.json()).then(d=>{
    if(Number.isFinite(d.approximate_member_count)) $("mCount").textContent=d.approximate_member_count.toLocaleString();
    else $("mCount").textContent="Unavailable";
    if(Number.isFinite(d.approximate_presence_count)) $("oCount").textContent=d.approximate_presence_count.toLocaleString();
    else $("oCount").textContent="Unavailable";
  }).catch(()=>{ $("mCount").textContent="Unavailable"; $("oCount").textContent="Unavailable"; });

  renderAuth(); renderReviews(); tryDiscordToken();
})();
