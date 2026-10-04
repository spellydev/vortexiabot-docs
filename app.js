document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const commands = Array.isArray(window.VORTEXIA_COMMANDS) ? window.VORTEXIA_COMMANDS : [];
  const sections = [...document.querySelectorAll('.section')];
  const nav = [...document.querySelectorAll('[data-section]')];
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('navBackdrop');
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');
  const tabs = document.getElementById('tabs');
  const grid = document.getElementById('commandGrid');
  const search = document.getElementById('cmdSearch');
  const sideSearch = document.getElementById('search');
  const noResults = document.getElementById('noResults');
  const crumb = document.getElementById('crumb');
  const main = document.getElementById('mainContent');
  const openNav = document.getElementById('openNav');
  const closeNav = document.getElementById('closeNav');

  if (!sidebar || !modal || !modalBody || !tabs || !grid || !search) return;

  let activeCategory = 'All';
  let lastFocused = null;

  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[m]));

  const commandByName = new Map(commands.map((command) => [command.name, command]));
  const categories = ['All', ...new Set(commands.map((c) => c.category).filter(Boolean))];

  const permissionNames = [
    [0x0000000000000008n, 'Administrator'],
    [0x0000000000000004n, 'Ban Members'],
    [0x0000000000000002n, 'Kick Members'],
    [0x0000000000000020n, 'Manage Server'],
    [0x0000000000000010n, 'Manage Channels'],
    [0x0000000000000800n, 'Manage Messages'],
    [0x0000000000000040n, 'Manage Roles'],
    [0x0000010000000000n, 'Moderate Members']
  ];

  function permissionLabel(value) {
    if (!value) return 'No special permission listed';
    try {
      const bits = BigInt(value);
      const names = permissionNames.filter(([bit]) => (bits & bit) === bit).map(([, name]) => name);
      return names.length ? names.join(' · ') : `Permission bit: ${value}`;
    } catch {
      return `Permission: ${value}`;
    }
  }

  function setDrawer(open) {
    sidebar.classList.toggle('open', open);
    backdrop?.classList.toggle('visible', open);
    backdrop?.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('drawer-open', open);
    openNav?.setAttribute('aria-expanded', String(open));
    if (!open) openNav?.focus({ preventScroll: true });
  }

  function show(id, updateHash = true) {
    const target = sections.find((section) => section.id === id) ? id : 'home';
    sections.forEach((section) => section.classList.toggle('active', section.id === target));
    nav.forEach((button) => button.classList.toggle('active', button.dataset.section === target));
    const activeButton = nav.find((button) => button.dataset.section === target);
    if (crumb) crumb.textContent = activeButton ? activeButton.textContent.trim() : target;
    setDrawer(false);
    if (updateHash) history.replaceState(null, '', `#${target}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    main?.focus({ preventScroll: true });
  }

  function renderTabs() {
    tabs.innerHTML = categories.map((category) => `
      <button type="button" class="tab ${category === activeCategory ? 'active' : ''}" data-cat="${esc(category)}">
        ${esc(category)}${category === 'All' ? ` <span>${commands.length}</span>` : ''}
      </button>`).join('');
  }

  function matches(command, query) {
    const options = (command.options || []).flatMap((option) => [
      option.name, option.description,
      ...(option.choices || []).flatMap((choice) => [choice.name, choice.value])
    ]).join(' ');
    const guide = (command.guide || []).join(' ');
    return `${command.name} ${command.description} ${command.category} ${options} ${guide}`.toLowerCase().includes(query);
  }

  function render() {
    const query = String(search.value || '').trim().toLowerCase();
    const list = commands.filter((command) =>
      (activeCategory === 'All' || command.category === activeCategory) &&
      (!query || matches(command, query))
    );

    grid.innerHTML = list.map((command) => {
      const options = command.options || [];
      const optionText = options.length
        ? options.map((option) => `${option.name}${option.required ? ' *' : ''}`).join(' · ')
        : 'No options — run directly';
      return `<article class="command" tabindex="0" role="button" aria-label="Open documentation for /${esc(command.name)}" data-name="${esc(command.name)}">
        <div class="command-head"><code>/${esc(command.name)}</code><span class="badge">${esc(command.category || 'General')}</span></div>
        <p>${esc(command.description || 'No description available.')}</p>
        <small>${esc(optionText)}</small>
      </article>`;
    }).join('');

    if (noResults) noResults.hidden = list.length !== 0;

    grid.querySelectorAll('.command').forEach((card) => {
      const open = () => openCommand(commandByName.get(card.dataset.name));
      card.addEventListener('click', open);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });
    });
  }

  function openCommand(command) {
    if (!command) return;
    lastFocused = document.activeElement;

    const options = (command.options || []).map((option) => {
      const range = [option.min_value != null ? `min ${option.min_value}` : '', option.max_value != null ? `max ${option.max_value}` : ''].filter(Boolean).join(' · ');
      const choices = (option.choices || []).map((choice) => choice.name).join(', ');
      return `<div class="opt">
        <code>${esc(option.name)}</code>
        <span>${esc(option.description || 'No option description.')}${range ? ` · ${esc(range)}` : ''}${choices ? ` · choices: ${esc(choices)}` : ''}</span>
        <b class="${option.required ? 'req' : 'optmark'}">${option.required ? 'required' : 'optional'}</b>
      </div>`;
    }).join('');

    const usage = command.examples?.[0] || `/${command.name}`;
    const guide = command.guide?.length ? command.guide : [
      `Run \`/${command.name}\` in Discord.`,
      'Complete the options shown by Discord.',
      'Review the values before submitting.',
      'Check the Vortexia response and verify the result.'
    ];

    modalBody.innerHTML = `
      <span class="tag">${esc(command.category || 'General')}</span>
      <h2 id="modalTitle">/${esc(command.name)}</h2>
      <p>${esc(command.description || 'No description available.')}</p>
      <div class="permission-line"><b>Permissions:</b> ${esc(permissionLabel(command.default_member_permissions))}</div>
      <div class="detail-block"><h4>Usage</h4><div class="copy-row"><code>${esc(usage)}</code><button type="button" class="copy-btn" id="copyCmd">Copy</button></div></div>
      ${options ? `<div class="detail-block"><h4>Options</h4>${options || '<p>No options. Run the command directly.</p>'}</div>` : ''}
      <div class="detail-block"><h4>How to use</h4><ol>${guide.map((step) => `<li>${esc(step)}</li>`).join('')}</ol></div>
      ${(command.notes || []).length ? `<div class="detail-block"><h4>Important</h4>${command.notes.map((note) => `<p>${esc(note)}</p>`).join('')}</div>` : ''}
      <div class="detail-block"><h4>Example</h4><code class="example-code">${esc(usage)}</code></div>`;

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modalClose?.focus({ preventScroll: true });

    document.getElementById('copyCmd')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      try {
        await navigator.clipboard.writeText(usage);
        button.textContent = 'Copied ✓';
      } catch {
        button.textContent = 'Copy unavailable';
      }
    });
  }

  function closeModal() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({ preventScroll: true });
  }

  nav.forEach((button) => button.addEventListener('click', () => show(button.dataset.section)));
  document.querySelectorAll('[data-jump]').forEach((button) => button.addEventListener('click', () => show(button.dataset.jump)));
  openNav?.addEventListener('click', () => setDrawer(true));
  closeNav?.addEventListener('click', () => setDrawer(false));
  backdrop?.addEventListener('click', () => setDrawer(false));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!modal.hidden) closeModal();
      else if (sidebar.classList.contains('open')) setDrawer(false);
    }
  });

  modalClose?.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });

  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cat]');
    if (!button) return;
    activeCategory = button.dataset.cat;
    renderTabs();
    render();
  });

  search.addEventListener('input', render);
  sideSearch?.addEventListener('input', () => {
    search.value = sideSearch.value;
    activeCategory = 'All';
    renderTabs();
    render();
    show('commands');
    requestAnimationFrame(() => search.focus({ preventScroll: true }));
  });

  document.querySelectorAll('.feature[data-system], .system-card[data-system]').forEach((card) => {
    card.addEventListener('click', () => {
      const category = card.dataset.system;
      activeCategory = categories.includes(category) ? category : 'All';
      renderTabs();
      render();
      show('commands');
    });
  });

  // Support direct links such as #commands and #command/music.
  function routeFromHash() {
    const hash = location.hash.replace(/^#/, '');
    if (hash.startsWith('command/')) {
      show('commands', false);
      openCommand(commandByName.get(decodeURIComponent(hash.slice(8))));
      return;
    }
    show(categories.includes(hash) ? 'commands' : (sections.some((s) => s.id === hash) ? hash : 'home'), false);
  }

  window.addEventListener('hashchange', routeFromHash);
  renderTabs();
  render();
  routeFromHash();
});
