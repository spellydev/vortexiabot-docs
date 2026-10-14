(() => {
  const $ = id => document.getElementById(id);
  const p = $("particles");
  if (p) for (let i = 0; i < 18; i++) { const s = document.createElement("span"); s.style.left = Math.random()*100+"%"; s.style.animationDuration = (8+Math.random()*14)+"s"; s.style.animationDelay = Math.random()*8+"s"; s.style.width = s.style.height = (2+Math.random()*3)+"px"; p.appendChild(s); }
  $("menu")?.addEventListener("click", () => $("nav").classList.toggle("open"));
  document.querySelectorAll(".fbtn").forEach(btn => btn.addEventListener("click", () => {
    document.querySelectorAll(".fbtn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const f = btn.dataset.filter;
    document.querySelectorAll(".cmd-cat").forEach(c => c.classList.toggle("hide", f !== "all" && c.dataset.cat !== f));
  }));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("show"); io.unobserve(e.target); } }), {threshold: .1});
  document.querySelectorAll(".reveal,.cmd-card,.fcard").forEach(el => io.observe(el));
})();
