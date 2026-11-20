const LOGO = '/assets/bits-logo.jpeg';
const THEMES = [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']];
const ACCENTS = ['Blue', 'Purple', 'Green', 'Orange', 'Pink'];

const icons = {
  more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
  account: '<circle cx="12" cy="8" r="3"/><path d="M5 20v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  exit: '<path d="M10 4H5v16h5m4-12 4 4-4 4m-5-4h9"/>',
  reset: '<path d="M4 11a8 8 0 1 1 1 6M4 5v6h6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19m0-14-1.4 1.4M6.4 17.6 5 19"/>',
  moon: '<path d="M20.5 15.5A9 9 0 0 1 8.5 3.5a9 9 0 1 0 12 12Z"/>',
  screen: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
};

function icon(name) {
  return `<svg class="menu-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}

export function wordmark() {
  return `<span class="bits-wordmark" role="img" aria-label="BITS"><span aria-hidden="true">B</span><span class="emphasis" aria-hidden="true">I</span><span class="emphasis" aria-hidden="true">T</span><span aria-hidden="true">S</span></span>`;
}

function logo() {
  return `<img class="bits-logo" src="${LOGO}" width="64" height="64" alt="BITS Pilani emblem">`;
}

export function brand({ href, size = '', withLogo = true } = {}) {
  const content = `${withLogo ? logo() : ''}<span class="brand-text">${wordmark()}<span class="brand-subtitle">IT Support</span></span>`;
  return href
    ? `<a class="brand ${size}" href="${href}" aria-label="BITS IT Support">${content}</a>`
    : `<div class="brand ${size}">${content}</div>`;
}

export function accountMenu() {
  return `<div class="account-control">
    <button class="icon-button account-trigger" id="account-trigger" type="button" data-action="toggle-account" aria-label="Account and settings" aria-expanded="false" aria-controls="account-menu">${icon('more')}</button>
    <section class="account-menu" id="account-menu" aria-label="Account and settings" inert>
      <div class="account-section"><h2>Account</h2><a class="account-link" href="#/profile" data-nav>${icon('account')} My profile</a></div>
      <div class="account-section"><h2>Appearance</h2>
        <div class="theme-options" role="group" aria-label="Theme">${THEMES.map(([value, label], index) => `<button type="button" data-theme-choice="${value}" aria-pressed="false">${icon(['sun', 'moon', 'screen'][index])}${label}</button>`).join('')}</div>
        <div class="accent-row"><span>Accent color</span><div class="accent-options" role="group" aria-label="Accent color">${ACCENTS.map(label => `<button type="button" class="accent-choice" data-accent-choice="${label.toLowerCase()}" aria-label="${label}" title="${label}" aria-pressed="false"><span></span></button>`).join('')}</div></div>
        <button class="account-link motion-choice" type="button" data-action="toggle-motion" aria-pressed="false">Reduced animations<span class="motion-switch" aria-hidden="true"></span></button>
        <button class="account-link" type="button" data-action="reset-appearance">${icon('reset')} Reset appearance</button>
      </div>
      <div class="account-section"><h2>Help</h2><a class="account-link" href="#/help" data-nav>${icon('help')} User guide</a><a class="account-link" href="#/about" data-nav>${icon('info')} About BITS IT Support</a></div>
      <div class="account-section"><button class="account-link account-signout" type="button" data-action="request-logout">${icon('exit')} Sign out</button></div>
    </section>
  </div>`;
}

function syncAppearanceControls() {
  const { theme, accent, reducedMotion } = window.bitsAppearance.get();
  for (const item of document.querySelectorAll('[data-theme-choice], [data-accent-choice], [data-action="toggle-motion"]')) {
    const active = item.dataset.themeChoice ? theme === item.dataset.themeChoice
      : item.dataset.accentChoice ? accent === item.dataset.accentChoice : reducedMotion;
    item.setAttribute('aria-pressed', String(active));
  }
}

const accountElements = () => ({
  trigger: document.querySelector('#account-trigger'),
  panel: document.querySelector('#account-menu'),
});

export function closeAccountMenu({ focus = false } = {}) {
  const { trigger, panel } = accountElements();
  if (!panel || panel.inert) return;
  trigger.setAttribute('aria-expanded', 'false');
  if (focus) trigger.focus();
  panel.inert = true;
  panel.classList.remove('is-open');
}

function menuItems(panel) { return [...panel.querySelectorAll('a[href], button:not(:disabled)')]; }

export function toggleAccountMenu({ last = false } = {}) {
  const { trigger, panel } = accountElements();
  if (!panel) return;
  if (!panel.inert) { closeAccountMenu({ focus: true }); return; }
  syncAppearanceControls();
  trigger.setAttribute('aria-expanded', 'true');
  panel.inert = false;
  panel.classList.add('is-open');
  menuItems(panel).at(last ? -1 : 0)?.focus();
}

export function handleAccountKey(event) {
  const { trigger, panel } = accountElements();
  if (!panel) return;
  const { key, target } = event;
  if (key === 'Escape' && !panel.inert) {
    event.preventDefault();
    closeAccountMenu({ focus: true });
  } else if (['ArrowDown', 'ArrowUp'].includes(key) && target === trigger && panel.inert) {
    event.preventDefault();
    toggleAccountMenu({ last: key === 'ArrowUp' });
  } else if (!panel.inert && panel.contains(target) && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
    event.preventDefault();
    const items = menuItems(panel);
    const current = items.indexOf(target);
    const next = key === 'Home' ? 0 : key === 'End' ? items.length - 1
      : (current + (key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  }
}

let loadingOperation;
export function withWorkspaceLoader(message, task, { minimum = 0 } = {}) {
  if (loadingOperation) return loadingOperation;
  const mount = document.querySelector('#workspace-loader');
  const app = document.querySelector('#app');
  const start = performance.now();
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  mount.innerHTML = `<div class="workspace-overlay" role="status" aria-live="polite">
    <div class="orbital-halo">
      <svg viewBox="0 0 160 160" width="160" height="160" aria-hidden="true">
        <circle class="halo-track" cx="80" cy="80" r="76" />
        <g class="halo-primary"><circle cx="80" cy="80" r="76" pathLength="100" stroke-dasharray="30 70"/><circle class="halo-dot" cx="56.5" cy="152.3" r="3.5"/></g>
        <circle class="halo-secondary" cx="80" cy="80" r="62" pathLength="100" stroke-dasharray="22 78"/>
      </svg>
      ${logo()}
    </div>
    <div class="brand brand-loader">${wordmark()}<span class="brand-subtitle">IT Support</span></div>
    <p>${message}</p>
  </div>`;
  app.inert = true;
  app.setAttribute('aria-busy', 'true');
  document.body.classList.add('workspace-loading');
  loadingOperation = Promise.resolve().then(task).finally(async () => {
    const reduced = window.bitsAppearance.isReduced();
    if (!reduced && minimum) await wait(Math.max(0, minimum - (performance.now() - start)));
    mount.firstElementChild?.classList.add('is-leaving');
    if (!reduced) await wait(340);
    mount.replaceChildren();
    app.inert = false;
    app.removeAttribute('aria-busy');
    document.body.classList.remove('workspace-loading');
    loadingOperation = null;
  });
  return loadingOperation;
}
