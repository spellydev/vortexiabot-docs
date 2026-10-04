document.addEventListener('DOMContentLoaded', () => {
  const commands = Array.isArray(window.VORTEXIA_COMMANDS) ? window.VORTEXIA_COMMANDS : [];
  const $ = id => document.getElementById(id);
  const sections = [...document.querySelectorAll('.section')];
  const sidebar = $('sidebar');
  const search = $('search');
  const grid = $('commandGrid');
  const tabs = $('tabs');
  const modal = $('modal');
  const modalBody = $('modalBody');
  const noResults = $('noResults');
  const crumb = $('crumb');
  let activeCat = 'All';

  const categories = ['All', ...new Set(commands.map(c => c.cat || 'Other'))];
  tabs.innerHTML = categories.map(cat => `<button type="button" data-cat="${escapeHtml(cat)}" class="${cat === 'All' ? 'active' : ''}">${escapeHtml(cat)}</button>`).join('');

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function showSection(id) {
    if (!document.getElementById(id)) id = 'home';
    sections.forEach(s => s.classList.toggle('active', s.id === id));
    document.querySelectorAll('[data-section]').forEach(b => b.classList.toggle('active', b.dataset.section === id));
    const button = document.querySelector(`[data-section="${CSS.escape(id)}"]`);
    if (crumb) crumb.textContent = button?.querySelector('span')?.textContent || id;
    sidebar?.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-section]').forEach(button => {
    button.addEventListener('click', () => showSection(button.dataset.section));
  });

  $('openNav')?.addEventListener('click', () => sidebar?.classList.add('open'));
  $('closeNav')?.addEventListener('click', () => sidebar?.classList.remove('open'));

  function render() {
    if (!grid) return;
    const q = (search?.value || '').trim().toLowerCase();
    const list = commands.filter(c => {
      const haystack = [c.name,c.desc,c.cat,c.syntax,c.opts,c.note].join(' ').toLowerCase();
      return (activeCat === 'All' || c.cat === activeCat) && (!q || haystack.includes(q));
    });
    grid.innerHTML = list.map((c, i) => `
      <article class="command" data-index="${commands.indexOf(c)}" tabindex="0" role="button">
        <div class="command-head"><code>/${escapeHtml(c.name)}</code><span class="badge">${escapeHtml(c.cat || 'Other')}</span></div>
        <p>${escapeHtml(c.desc)}</p><small>${escapeHtml(c.syntax || `/${c.name}`)}</small>
      </article>`).join('');
    noResults.hidden = list.length > 0;
    grid.querySelectorAll('.command').forEach(card => {
      const open = () => openCommand(commands[Number(card.dataset.index)]);
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  function openCommand(c) {
    if (!c || !modal || !modalBody) return;
    modalBody.innerHTML = `
      <span class="tag">${escapeHtml(c.cat || 'Other')}</span>
      <h2>/${escapeHtml(c.name)}</h2>
      <p>${escapeHtml(c.desc)}</p>
      <div class="syntax"><b>Usage</b><br><code>${escapeHtml(c.syntax || `/${c.name}`)}</code></div>
      ${c.opts ? `<p><b>Options</b><br>${escapeHtml(c.opts)}</p>` : ''}
      ${c.note ? `<div class="callout">${escapeHtml(c.note)}</div>` : ''}`;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    $('modalClose')?.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  tabs.addEventListener('click', e => {
    const button = e.target.closest('button[data-cat]');
    if (!button) return;
    activeCat = button.dataset.cat;
    tabs.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === button));
    render();
  });
  search?.addEventListener('input', render);
  $('modalClose')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); sidebar?.classList.remove('open'); } });

  showSection('home');
  render();
});
