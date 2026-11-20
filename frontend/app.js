/* AEGIS client: dependency-free SPA served by the local AEGIS API. */
import { accountMenu, brand, closeAccountMenu, handleAccountKey, toggleAccountMenu, withWorkspaceLoader } from './workspace-ui.js';
const root = document.querySelector('#app');
const toastRegion = document.querySelector('#toast-region');

const state = {
  token: localStorage.getItem('aegis_token') || '',
  user: readJson('aegis_user'),
  routeVersion: 0,
  incidentTabs: new Map(),
  navOpen: false,
  cache: { categories: null, services: null, technicians: null },
};

const ICONS = {
  dashboard: '◫', incidents: '▤', plus: '+', bell: '◉', profile: '◌', work: '▧', users: '♙',
  services: '⌁', categories: '◇', policy: '◷', settings: '⚙', audit: '◴', reports: '▥',
  escalation: '⚠', pulse: '◎', email: '✉', close: '×', menu: '☰',
  search: '⌕', timeline: '◌', intelligence: '✦', check: '✓', info: 'i', shield: '⛨',
};

const ROLE_LABELS = { EMPLOYEE: 'Employee', TECHNICIAN: 'Technician', ADMINISTRATOR: 'Administrator', ADMIN: 'Administrator' };
const ROLE = () => String(state.user?.role || '').toUpperCase();
const isAdmin = () => ['ADMIN', 'ADMINISTRATOR'].includes(ROLE());
const isTech = () => ROLE() === 'TECHNICIAN';
const isEmployee = () => ROLE() === 'EMPLOYEE';

function readJson(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

function saveSession(session) {
  state.token = session?.token || '';
  state.user = session?.user || null;
  if (state.token) localStorage.setItem('aegis_token', state.token); else localStorage.removeItem('aegis_token');
  if (state.user) localStorage.setItem('aegis_user', JSON.stringify(state.user)); else localStorage.removeItem('aegis_user');
}

function clearSession() {
  saveSession(null);
  state.cache = { categories: null, services: null, technicians: null };
}

function route() {
  const raw = (location.hash || '').replace(/^#/, '') || '/dashboard';
  const [pathname, query = ''] = raw.split('?');
  return { path: pathname.startsWith('/') ? pathname : `/${pathname}`, query: new URLSearchParams(query) };
}

function go(path) { location.hash = `#${path.startsWith('/') ? path : `/${path}`}`; }

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.token) headers.set('Authorization', `Bearer ${state.token}`);
  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !headers.has('Content-Type') && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  let response;
  try {
    response = await fetch(`/api${path}`, { ...options, headers, credentials: 'same-origin', signal: options.signal ?? AbortSignal.timeout(12_000) });
  } catch (error) {
    const offline = new Error(error.name === 'TimeoutError' ? 'The request timed out. Try again.' : 'BITS IT Support is unreachable. Check the local server and try again.');
    offline.code = 'OFFLINE';
    throw offline;
  }
  const type = response.headers.get('content-type') || '';
  const payload = type.includes('application/json') ? await response.json().catch(() => ({})) : await response.text().catch(() => '');
  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.details = payload?.details;
    if (response.status === 401 && state.token) {
      clearSession();
      if (!route().path.startsWith('/login')) go('/login');
    }
    throw error;
  }
  return payload;
}

function jsonBody(object) { return JSON.stringify(object); }
function listOf(value) { return Array.isArray(value) ? value : (value?.items || value?.content || value?.data || []); }
function objectOf(value) { return value?.data && !Array.isArray(value.data) ? value.data : value || {}; }
function first(...values) { return values.find((value) => value !== undefined && value !== null && value !== '') ?? '—'; }
function numeric(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function cap(value = '') { return String(value).replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function escapeHtml(value = '') { return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]); }
function escapeAttr(value = '') { return escapeHtml(value).replace(/`/g, '&#96;'); }
function initials(name = '') { return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'AG'; }
function textOrEmpty(value, message = 'Not available') { return value === null || value === undefined || value === '' ? `<span class="cell-sub">${escapeHtml(message)}</span>` : escapeHtml(value); }
function dateTime(value) { if (!value) return '—'; const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value) : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d); }
function dateOnly(value) { if (!value) return '—'; const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value) : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(d); }
function relativeTime(value) { if (!value) return '—'; const ms = new Date(value).getTime() - Date.now(); if (Number.isNaN(ms)) return dateTime(value); const abs = Math.abs(ms); const unit = abs < 3600000 ? 'minute' : abs < 86400000 ? 'hour' : 'day'; const amount = Math.round(ms / ({ minute: 60000, hour: 3600000, day: 86400000 }[unit])); return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(amount, unit); }
function bool(value) { return value === true || value === 1 || String(value).toLowerCase() === 'true'; }
function idOf(item) { return first(item?.id, item?.incidentId, item?.publicId, item?.code, ''); }
function nameOf(item) { return first(item?.name, item?.fullName, item?.title, item?.email, 'Unassigned'); }
function valueOf(item) { return item?.id ?? item?.code ?? item?.name ?? item?.value ?? ''; }
function labelOf(item) { return first(item?.name, item?.label, item?.title, item?.code, item?.id, '—'); }

function toast(message, kind = 'info') {
  const item = document.createElement('div');
  item.className = `toast ${kind}`;
  item.innerHTML = `<span aria-hidden="true">${kind === 'success' ? '✓' : kind === 'error' ? '!' : 'i'}</span><span>${escapeHtml(message)}</span>`;
  toastRegion.append(item);
  window.setTimeout(() => item.remove(), 4300);
}

function messagePanel(error, retry = true) {
  const message = error?.message || 'An unexpected response prevented this information from loading.';
  return `<div class="error-panel" role="alert"><strong>Could not load this data.</strong><br>${escapeHtml(message)}${retry ? ' <button class="button small" data-action="reload" type="button">Try again</button>' : ''}</div>`;
}

function emptyState(title, copy, actionLabel = '', action = '') {
  return `<div class="empty-state"><div><div class="empty-icon" aria-hidden="true">${ICONS.intelligence}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p>${actionLabel ? `<button class="button primary" data-action="${escapeAttr(action)}" type="button">${escapeHtml(actionLabel)}</button>` : ''}</div></div>`;
}

function loading() { return `<div class="loading"><span class="spinner" aria-hidden="true"></span> Loading…</div>`; }

function badge(value, type = '') {
  const raw = String(value || 'Unknown');
  const normalized = raw.toLowerCase().replace(/[ _]/g, '-');
  let flavour = type || normalized;
  if (/^p1|critical|breach|overdue/.test(normalized)) flavour = 'p1';
  else if (/^p2|high|warning|risk/.test(normalized)) flavour = 'p2';
  else if (/^p3|medium|info/.test(normalized)) flavour = 'p3';
  else if (/^p4|low|closed|verified|resolved|good|compliant/.test(normalized)) flavour = 'p4';
  else if (/new|assigned|acknowledged|progress|classified/.test(normalized)) flavour = 'new';
  else if (/unassigned|none/.test(normalized)) flavour = 'unassigned';
  return `<span class="badge ${escapeAttr(flavour)}">${escapeHtml(cap(raw))}</span>`;
}

function metric(label, value, note, tone = 'teal') {
  return `<section class="card metric ${tone}"><div class="metric-label">${escapeHtml(label)}</div><div class="metric-value">${escapeHtml(value ?? '—')}</div><div class="metric-note">${escapeHtml(note || 'Live system data')}</div></section>`;
}

function pageHeader(title, subtitle, actions = '', style = '') {
  return `<header class="page-header${style ? ` ${style}` : ''}"><div><h1>${escapeHtml(title)}</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</header>`;
}

function avatar(person = state.user, admin = false) { return `<span class="avatar ${admin ? 'avatar-admin' : ''}" aria-hidden="true">${escapeHtml(initials(nameOf(person)))}</span>`; }

function navGroups() {
  const common = [
    { label: 'Workspace', items: [
      ['Dashboard', '/dashboard', 'dashboard'],
      ['Incidents', '/incidents', 'incidents'],
      ['Notifications', '/notifications', 'bell'],
    ]},
  ];
  if (isEmployee()) common.push({ label: 'Support', items: [['Report an incident', '/incidents/new', 'plus'], ['My profile', '/profile', 'profile']] });
  if (isTech()) common.push({ label: 'Technician', items: [['My queue', '/incidents?scope=assigned', 'work'], ['Workload', '/workload', 'work'], ['My profile', '/profile', 'profile']] });
  if (isAdmin()) common.push(
    { label: 'Administration', items: [
      ['All users', '/admin/users', 'users'], ['Technicians', '/admin/technicians', 'work'], ['IT services', '/admin/services', 'services'], ['Categories', '/admin/categories', 'categories'], ['SLA policies', '/admin/sla', 'policy'], ['Assignment strategy', '/admin/assignment', 'settings'],
    ]},
    { label: 'Command center', items: [
      ['SLA monitor', '/sla-monitor', 'policy'], ['SLA Rescue', '/admin/sla-rescue', 'escalation'], ['Escalations', '/admin/escalations', 'escalation'], ['Service Pulse', '/admin/service-pulse', 'pulse'], ['Audit history', '/admin/audit', 'audit'], ['Email outbox', '/admin/email-outbox', 'email'], ['Reports', '/reports', 'reports'],
    ]},
  );
  return common;
}

function isActivePath(href) {
  const current = route().path;
  if (href.includes('?')) return location.hash.replace(/^#/, '') === href;
  if (href === '/dashboard') return current === '/dashboard';
  if (href === '/incidents' && (current === '/incidents/new' || route().query.get('scope') === 'assigned')) return false;
  return current === href || current.startsWith(`${href}/`);
}

function shell(content, title = 'Dashboard') {
  const navigation = navGroups().map((group) => `<section class="nav-group"><span class="nav-group-label">${escapeHtml(group.label)}</span>${group.items.map(([label, href, icon]) => `<a class="nav-link ${isActivePath(href) ? 'active' : ''}" data-nav href="#${href}"><span class="nav-icon" aria-hidden="true">${ICONS[icon] || '•'}</span><span>${escapeHtml(label)}</span>${label === 'Notifications' && state.user?.unreadNotificationCount ? `<span class="nav-badge">${escapeHtml(state.user.unreadNotificationCount)}</span>` : ''}</a>`).join('')}</section>`).join('');
  document.title = `${title} | BITS IT Support`;
  return `<div class="app-shell ${state.navOpen ? 'nav-open' : ''}" id="app-shell">
    <aside class="sidebar" id="workspace-sidebar" aria-label="Primary navigation">
      <div class="sidebar-header">${brand({ href: '#/dashboard', size: 'brand-sidebar' })}<button class="icon-button sidebar-close" type="button" data-action="close-nav" aria-label="Close navigation">${ICONS.close}</button></div>
      <nav class="nav-scroll" aria-label="Workspace">${navigation}</nav>
      <div class="sidebar-user">${avatar(state.user, isAdmin())}<div><div class="sidebar-user-name">${escapeHtml(nameOf(state.user))}</div><div class="sidebar-user-role">${escapeHtml(ROLE_LABELS[ROLE()] || cap(ROLE()))}</div></div></div>
    </aside>
    <div class="nav-scrim" data-action="close-nav" aria-hidden="true"></div>
    <div class="workspace">
      <header class="topbar">
        <div class="topbar-actions topbar-location">
          <button class="icon-button mobile-menu" type="button" data-action="toggle-nav" aria-expanded="${state.navOpen}" aria-controls="workspace-sidebar" aria-label="Open navigation">${ICONS.menu}</button>
          <div class="breadcrumbs"><span class="breadcrumb-brand">BITS IT Support</span><span class="breadcrumb-divider" aria-hidden="true">/</span><strong>${escapeHtml(title)}</strong></div>
        </div>
        <div class="topbar-actions">
          <a class="icon-button ${state.user?.unreadNotificationCount ? 'alert-dot' : ''}" data-nav href="#/notifications" aria-label="Open notifications">${ICONS.bell}</a>
          ${!isTech() ? `<a class="button small quick-report" data-nav href="#/incidents/new" aria-label="Report incident"><span aria-hidden="true">${ICONS.plus}</span><span>Report incident</span></a>` : ''}
          ${accountMenu()}
        </div>
      </header>
      <main class="content" id="main-content" tabindex="-1">${content}</main>
    </div>
  </div>`;
}

function authShell(mode = 'login') {
  const register = mode === 'register';
  document.title = `${register ? 'Create an account' : 'Sign in'} | BITS IT Support`;
  return `<div class="auth-shell">
    <section class="auth-intro">
      ${brand({ href: '#/login', size: 'brand-auth' })}
      <div class="auth-copy">
        <p class="eyebrow">BITS Pilani · Hyderabad Campus</p>
        <h1>Campus IT support</h1>
        <p>Report a technical issue, follow your request, and work with campus IT to get it resolved.</p>
      </div>
      <p class="auth-campus-note">CS F213 / MAC F212 project</p>
    </section>
    <main class="auth-card-wrap" id="main-content"><section class="auth-card" aria-labelledby="auth-title">
      <h2 id="auth-title">${register ? 'Create an employee account' : 'Sign in'}</h2>
      <p>${register ? 'Create an account to report and track campus IT incidents.' : 'Use your support account to continue.'}</p>
      ${register ? registerForm() : loginForm()}
    </section></main>
  </div>`;
}

function loginForm() {
  return `<form data-form="login" novalidate><div class="field"><label for="login-email">Email address</label><input id="login-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com"></div><div class="field" style="margin-top: .9rem"><label for="login-password">Password</label><input id="login-password" name="password" type="password" autocomplete="current-password" required placeholder="Enter your password"></div><div id="form-message" aria-live="polite" style="margin-top:.8rem"></div><button class="button primary wide" style="margin-top:1.15rem" type="submit">Sign in to BITS IT Support</button></form><p class="auth-footer">New to the employee portal? <a href="#/register">Create an account</a></p><div class="demo-hint"><strong>Demo accounts:</strong> See the README for development sign-in details.</div>`;
}

function registerForm() {
  return `<form data-form="register" novalidate><div class="field"><label for="register-name">Full name</label><input id="register-name" name="name" autocomplete="name" required placeholder="Your name"></div><div class="field" style="margin-top:.8rem"><label for="register-email">Email address</label><input id="register-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com"></div><div class="field" style="margin-top:.8rem"><label for="register-password">Password</label><input id="register-password" name="password" type="password" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters"><span class="field-help">Registration always creates an Employee role. Administrators create privileged accounts.</span></div><div id="form-message" aria-live="polite" style="margin-top:.8rem"></div><button class="button primary wide" style="margin-top:1.15rem" type="submit">Create employee account</button></form><p class="auth-footer">Already have access? <a href="#/login">Sign in</a></p>`;
}

async function loadMeta() {
  if (state.cache.categories && state.cache.services) return state.cache;
  const meta = objectOf(await api('/meta'));
  state.cache.categories = listOf(meta.categories);
  state.cache.services = listOf(meta.services);
  state.cache.technicians = isAdmin() ? listOf(await api('/admin/technicians').catch(() => [])) : [];
  return state.cache;
}

function optionList(items, selected = '', placeholder = 'Select an option') {
  return `<option value="">${escapeHtml(placeholder)}</option>${items.map((item) => `<option value="${escapeAttr(valueOf(item))}" ${String(valueOf(item)) === String(selected) ? 'selected' : ''}>${escapeHtml(labelOf(item))}</option>`).join('')}`;
}

async function renderDashboard(version) {
  const title = isEmployee() ? 'My support requests' : isTech() ? 'Technician workspace' : 'Command overview';
  const actions = isEmployee() ? '<a class="button primary" data-nav href="#/incidents/new">Report an incident</a>'
    : isTech() ? '<a class="button primary" data-nav href="#/workload">View workload</a>'
    : '<button class="button" type="button" data-action="reload">Refresh</button><a class="button primary" data-nav href="#/incidents">Open incident queue</a>';
  const heading = pageHeader(title, roleSubtitle(), actions, 'campus-dashboard');
  root.innerHTML = shell(heading + loading(), 'Dashboard');
  try {
    const [overviewRaw, workloadRaw, trendsRaw, incidentsRaw, notificationsRaw] = await Promise.all([
      api('/reports/overview'), isEmployee() ? [] : api('/reports/workload'), api('/reports/trends').catch(() => []), api('/incidents?pageSize=8').catch(() => ({ items: [] })), api('/notifications'),
    ]);
    if (version !== state.routeVersion) return;
    const overview = objectOf(overviewRaw);
    state.user.unreadNotificationCount = notificationsRaw.unreadCount;
    const workload = listOf(workloadRaw);
    const trends = listOf(trendsRaw);
    const incidents = listOf(incidentsRaw);
    const totals = {
      total: first(overview.totalIncidents, overview.total, overview.incidentCount, 0),
      active: first(overview.activeIncidents, overview.active, 0),
      critical: first(overview.criticalIncidents, overview.critical, overview.p1, 0),
      breached: first(overview.slaViolations, overview.breached, overview.breaches, 0),
      compliance: first(overview.slaComplianceRate, overview.complianceRate, overview.slaCompliance, '—'),
    };
    const recent = listOf(overview.recentActivity || overview.activity || []).slice(0, 6);
    if (!isAdmin()) {
      const metrics = isEmployee()
        ? [metric('Open requests', totals.active, 'Waiting for support'), metric('Awaiting verification', overview.byStatus?.find((row) => row.name === 'RESOLVED')?.value ?? 0, 'Ready for your review', 'amber'), metric('Closed requests', overview.closedIncidents, 'Completed requests', 'green')]
        : [metric('Assigned work', totals.active, 'Active incidents'), metric('Critical incidents', totals.critical, 'P1 incidents', 'red'), metric('Recorded SLA violations', totals.breached, 'Response or resolution targets missed', 'amber')];
      root.innerHTML = shell(heading + `
        <section class="metric-grid role-metrics">${metrics.join('')}</section>
        <section class="dashboard-grid"><section class="card"><div class="card-header"><h2>${isEmployee() ? 'My incidents' : 'My operational queue'}</h2></div>${incidentCompactList(incidents)}</section>
        <section class="card"><div class="card-header"><h2>${isEmployee() ? 'Recent activity' : 'My capacity'}</h2></div>${isEmployee() ? activityList(recent) : workloadList(workload.filter((row) => row.id === state.user.id))}</section></section>`, title);
      return;
    }
    root.innerHTML = shell(heading + `<section class="metric-grid">${metric('All incidents', totals.total, 'Persistent incident records', 'blue')}${metric('Active response', totals.active, 'Open lifecycle records', 'teal')}${metric('Critical priority', totals.critical, 'P1 incidents requiring attention', 'red')}${metric('SLA violations', totals.breached, 'Recorded, not projected', 'amber')}${metric('SLA compliance', percent(totals.compliance), 'Measured from live records', 'green')}</section><section class="dashboard-grid"><section class="card"><div class="card-header"><div><h2>Incident signal</h2><p>Recent incident distribution from the database</p></div><a data-nav href="#/reports" class="button small">View reports</a></div>${renderBars(trends, 'label', 'count')}</section><section class="card"><div class="card-header"><div><h2>Response health</h2><p>Live SLA compliance snapshot</p></div></div>${renderDonut(totals.compliance, overview)}</section></section><section class="dashboard-grid"><section class="card"><div class="card-header"><div><h2>${isTech() ? 'My operational queue' : isEmployee() ? 'Recent incidents' : 'Incident queue'}</h2><p>Current incident records</p></div><a data-nav href="#/incidents" class="button small">View all</a></div>${incidentCompactList(incidents)}</section><section class="card"><div class="card-header"><div><h2>${isAdmin() ? 'Technician workload' : 'Recent activity'}</h2><p>${isAdmin() ? 'Active workload by technician' : 'Changes recorded on your incidents'}</p></div></div>${isAdmin() ? workloadList(workload) : activityList(recent)}</section></section>`, 'Dashboard');
  } catch (error) {
    if (version !== state.routeVersion) return;
    root.innerHTML = shell(heading + messagePanel(error), 'Dashboard');
  }
}

function roleSubtitle() {
  if (isEmployee()) return 'Track your requests, respond to support, and verify completed resolutions.';
  if (isTech()) return 'Prioritise your assigned work, investigate incidents, and protect SLA commitments.';
  if (isAdmin()) return 'Monitor incident response, service health, escalations, and operational performance.';
  return 'Monitor incident response across the organisation.';
}

function percent(value) { const n = Number(value); return Number.isFinite(n) ? `${Math.round(n)}%` : String(value ?? '—'); }
function numberText(value) { return Number.isFinite(Number(value)) ? new Intl.NumberFormat().format(Number(value)) : String(value ?? '—'); }

function renderBars(items, labelKey = 'label', valueKey = 'count') {
  if (!items.length) return emptyState('No chart data yet', 'Create or update incidents to populate this live analytic.', 'View incidents', 'nav-incidents');
  const values = items.map((item) => numeric(item[valueKey] ?? item.value ?? item.total ?? item.incidents, 0));
  const max = Math.max(...values, 1);
  return `<div class="chart-placeholder"><div class="bar-chart">${items.slice(0, 10).map((item, index) => { const value = values[index]; const label = first(item[labelKey], item.name, item.status, item.date, item.category, '—'); const style = `height:${Math.max(4, Math.round((value / max) * 100))}%`; return `<div class="bar-slot" title="${escapeAttr(`${label}: ${value}`)}"><span class="bar ${index === 0 ? '' : index % 4 === 1 ? 'blue' : index % 4 === 2 ? 'warning' : index % 4 === 3 ? 'critical' : ''}" style="${style}"></span><span class="bar-label">${escapeHtml(label)}</span></div>`; }).join('')}</div></div>`;
}

function renderDonut(compliance, overview = {}) {
  const p = Number(compliance); const amount = Number.isFinite(p) ? Math.max(0, Math.min(100, p)) : 0;
  const bits = [
    ['Compliant', first(overview.compliantIncidents, overview.compliant, '—'), ''],
    ['At risk', first(overview.atRiskIncidents, overview.atRisk, '—'), 'warning'],
    ['Breached', first(overview.slaViolations, overview.breached, '—'), 'critical'],
  ];
  return `<div class="donut-wrap"><div class="donut" style="--fill:${amount}"><span>${Number.isFinite(p) ? `${Math.round(amount)}%` : '—'}<small>SLA compliance</small></span></div><div class="legend">${bits.map(([label, value, tone]) => `<div class="legend-row"><span><i class="legend-dot ${tone}"></i>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}</div></div>`;
}

function incidentCompactList(items) {
  if (!items.length) return emptyState('No incidents found', 'There are no visible incidents for this workspace.', isEmployee() ? 'Report an incident' : '', isEmployee() ? 'new-incident' : '');
  return `<div class="list incident-compact-list">${items.slice(0, 7).map(incident => `
    <a class="list-row incident-compact-row" data-nav href="#/incidents/${encodeURIComponent(idOf(incident))}">
      <span class="activity-icon ${priorityTone(incident.priority)}" aria-label="Priority ${escapeAttr(incident.priority ?? 'unknown')}">${escapeHtml(incident.priority ?? '—')}</span>
      <span class="list-row-content">
        <span class="list-row-title">${escapeHtml(first(incident.title, incident.summary, idOf(incident)))}</span>
        <span class="list-row-meta incident-row-meta">
          <span class="incident-row-code">${escapeHtml(incident.incidentCode || idOf(incident))}</span>
          <span class="incident-row-service">${escapeHtml(first(incident.service?.name, incident.serviceName, incident.category?.name, incident.categoryName, 'Service unspecified'))}</span>
        </span>
      </span>
      ${badge(incident.status || 'New')}
    </a>`).join('')}</div>`;
}

function activityList(events) {
  if (!events.length) return emptyState('No activity recorded', 'New incident actions will appear here with their real audit time.');
  return `<div class="list">${events.map((event) => `<div class="list-row"><span class="activity-icon ${eventTone(event)}">${eventTone(event) === 'critical' ? '!' : eventTone(event) === 'warn' ? '!' : '✓'}</span><span class="list-row-content"><span class="list-row-title">${escapeHtml(first(event.description, event.action, event.title, 'Incident activity'))}</span><span class="list-row-meta">${escapeHtml(first(event.actorName, event.userName, event.incidentId, 'System'))} · ${escapeHtml(relativeTime(first(event.timestamp, event.createdAt)))}</span></span></div>`).join('')}</div>`;
}

function workloadList(items) {
  if (!items.length) return emptyState('No workload data', 'Technician workload will appear after technicians receive assignments.');
  return `<div class="list">${items.slice(0, 7).map((row) => { const assigned = numeric(first(row.activeWorkload, row.activeWorkload, row.activeCount, row.workload, row.assigned, row.count), 0); const capacity = numeric(first(row.capacity, row.workloadCapacity), 0); return `<div class="list-row"><span>${avatar(row)}</span><span class="list-row-content"><span class="list-row-title">${escapeHtml(nameOf(row))}</span><span class="list-row-meta">${assigned}${capacity ? ` of ${capacity}` : ''} active assignments</span><div class="progress ${capacity && assigned >= capacity ? 'danger' : ''}"><span style="width:${capacity ? Math.min(100, assigned / capacity * 100) : 0}%"></span></div></span>${row.available === false ? badge('Unavailable', 'unassigned') : badge(`${assigned} active`, assigned >= capacity && capacity ? 'p2' : 'p3')}</div>`; }).join('')}</div>`;
}

function priorityTone(priority) { return /^P1|critical/i.test(priority || '') ? 'critical' : /^P2|high/i.test(priority || '') ? 'warn' : ''; }
function eventTone(event) { const text = JSON.stringify(event).toLowerCase(); return /breach|critical|escalat/.test(text) ? 'critical' : /warning|risk/.test(text) ? 'warn' : ''; }

async function renderIncidents(version) {
  const current = route();
  root.innerHTML = shell(`${pageHeader(isTech() && current.query.get('scope') === 'assigned' ? 'My assigned incidents' : 'Incident register', 'Search persistent incidents using multiple operational criteria.', `${isEmployee() ? '<a class="button primary" data-nav href="#/incidents/new">+ New incident</a>' : '<button class="button" data-action="reload">↻ Refresh</button>'}`)}${renderIncidentSearchForm(current.query, state.cache)}<section class="card table-card">${loading()}</section>`, 'Incidents');
  try {
    const qs = new URLSearchParams();
    ['q', 'id', 'status', 'priority', 'category', 'service', 'technician', 'reporter', 'slaStatus', 'page'].forEach((key) => { const value = current.query.get(key); if (value) qs.set(key, value); });
    if (current.query.get('scope') === 'assigned') qs.set('scope', 'assigned');
    qs.set('pageSize', '20');
    const [response, meta] = await Promise.all([api(`/incidents?${qs.toString()}`), loadMeta().catch(() => state.cache)]);
    if (version !== state.routeVersion) return;
    const items = listOf(response);
    const total = numeric(response?.total, items.length);
    root.innerHTML = shell(`${pageHeader(isTech() && current.query.get('scope') === 'assigned' ? 'My assigned incidents' : 'Incident register', 'Search persistent incidents using multiple operational criteria.', `${isEmployee() ? '<a class="button primary" data-nav href="#/incidents/new">+ New incident</a>' : '<button class="button" data-action="reload">↻ Refresh</button>'}`)}${renderIncidentSearchForm(current.query, meta)}<section class="card table-card">${incidentTable(items, total, current.query)}</section>`, 'Incidents');
  } catch (error) {
    if (version !== state.routeVersion) return;
    root.innerHTML = shell(`${pageHeader('Incident register', 'Search persistent incidents using multiple operational criteria.')}${renderIncidentSearchForm(current.query, state.cache)}<section class="card">${messagePanel(error)}</section>`, 'Incidents');
  }
}

function renderIncidentSearchForm(query, meta = {}) {
  const input = (name) => escapeAttr(query.get(name) || ''); const categories = meta?.categories || []; const services = meta?.services || []; const technicians = meta?.technicians || [];
  const slaStates = [
    { value: 'ON_TRACK', label: 'On track' },
    { value: 'MET', label: 'Met' },
    { value: 'AT_RISK', label: 'At risk' },
    { value: 'BREACHED', label: 'Breached' },
  ];
  return `<form class="card" data-form="incident-search"><div class="toolbar"><div class="field search-box"><label class="screen-reader-only" for="incident-search">Search</label><input id="incident-search" name="q" value="${input('q')}" placeholder="Search title, description, or incident ID…"></div><button class="button primary" type="submit">Search</button><button class="button filter-toggle" data-action="toggle-filters" type="button">⚙ Filters</button><button class="button ghost" data-action="clear-filters" type="button">Clear</button></div><div class="filters collapsed" id="incident-filters"><div class="field"><label for="filter-id">Incident ID</label><input id="filter-id" name="id" value="${input('id')}" placeholder="INC-…"></div><div class="field"><label for="filter-status">Status</label><select id="filter-status" name="status">${selectValues(['', 'NEW', 'CLASSIFIED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_FOR_INFORMATION', 'RESOLVED', 'VERIFIED', 'CLOSED'], query.get('status'), 'All statuses')}</select></div><div class="field"><label for="filter-priority">Priority</label><select id="filter-priority" name="priority">${selectValues(['', 'P1', 'P2', 'P3', 'P4'], query.get('priority'), 'All priorities')}</select></div><div class="field"><label for="filter-category">Category</label><select id="filter-category" name="category">${optionList(categories, query.get('category'), 'All categories')}</select></div><div class="field"><label for="filter-service">Service</label><select id="filter-service" name="service">${optionList(services, query.get('service'), 'All services')}</select></div><div class="field"><label for="filter-technician">Technician</label>${technicians.length ? `<select id="filter-technician" name="technician">${optionList(technicians, query.get('technician'), 'All technicians')}</select>` : `<input id="filter-technician" name="technician" value="${input('technician')}" inputmode="numeric" placeholder="Technician ID">`}</div><div class="field"><label for="filter-sla">SLA state</label><select id="filter-sla" name="slaStatus">${optionList(slaStates, query.get('slaStatus'), 'Any SLA status')}</select></div></div></form>`;
}

function selectValues(values, selected, firstLabel) {
  return values.map((value, index) => `<option value="${escapeAttr(value)}" ${String(value) === String(selected || '') ? 'selected' : ''}>${escapeHtml(index === 0 ? firstLabel : cap(value))}</option>`).join('');
}

function incidentTable(items, total, query) {
  if (!items.length) return emptyState('No incidents match these filters', 'Try broadening your search or report a new support issue.', isEmployee() ? 'Report an incident' : '', isEmployee() ? 'new-incident' : '');
  const page = Math.max(1, numeric(query.get('page'), 1));
  return `<div class="table-scroll"><table class="data-table"><caption class="screen-reader-only">Incident results</caption><thead><tr><th>ID</th><th>Incident</th><th>Priority</th><th>Status</th><th>Service / category</th><th>Assignment</th><th>SLA</th><th>Created</th></tr></thead><tbody>${items.map((incident) => `<tr class="clickable" data-incident-link="${escapeAttr(idOf(incident))}"><td><a class="id-link" data-nav href="#/incidents/${encodeURIComponent(idOf(incident))}">${escapeHtml(incident.incidentCode || idOf(incident))}</a></td><td><div class="table-title">${escapeHtml(first(incident.title, incident.summary, 'Untitled incident'))}</div><span class="cell-sub">${escapeHtml(first(incident.reporter?.name, incident.reporterName, '—'))}</span></td><td>${badge(first(incident.priority, '—'))}</td><td>${badge(first(incident.status, 'NEW'))}</td><td>${escapeHtml(first(incident.service?.name, incident.serviceName, '—'))}<span class="cell-sub">${escapeHtml(first(incident.category?.name, incident.categoryName, 'Uncategorised'))}</span></td><td>${escapeHtml(first(incident.assignee?.name, incident.assignedTechnician?.name, incident.assigneeName, incident.technicianName, 'Unassigned'))}</td><td>${slaBadge(incident)}</td><td>${escapeHtml(relativeTime(first(incident.createdAt, incident.createdOn)))}</td></tr>`).join('')}</tbody></table></div><div class="pagination"><span>Showing ${items.length} of ${numberText(total)} incidents</span><div><button class="button small" data-action="page-incidents" data-page="${Math.max(1, page - 1)}" ${page <= 1 ? 'disabled' : ''}>Previous</button><button class="button small" data-action="page-incidents" data-page="${page + 1}" ${items.length < 20 ? 'disabled' : ''}>Next</button></div></div>`;
}

function slaBadge(incident) {
  const status = first(incident.slaStatus, incident.sla?.status, incident.sla?.resolutionStatus, incident.slaBreached ? 'BREACHED' : 'COMPLIANT');
  return `${badge(status)}${incident.responseDeadline || incident.sla?.responseDeadline ? `<span class="cell-sub">${escapeHtml(relativeTime(first(incident.resolutionDeadline, incident.sla?.resolutionDeadline, incident.responseDeadline, incident.sla?.responseDeadline)))}</span>` : ''}`;
}

async function renderNewIncident(version) {
  root.innerHTML = shell(`${pageHeader('Report an incident', 'Tell us what is happening. After you submit, you’ll see the priority, SLA targets, and assignment.')}<section class="card form-card">${loading()}</section>`, 'Report an incident');
  try {
    const meta = await loadMeta();
    if (version !== state.routeVersion) return;
    root.innerHTML = shell(`${pageHeader('Report an incident', 'Tell us what is happening. After you submit, you’ll see the priority, SLA targets, and assignment.')}<form class="card form-card" data-form="new-incident" novalidate><section class="form-section"><h2>What needs attention?</h2><p>Use clear, factual language. The category suggestion is explainable and can always be overridden.</p><div class="form-grid"><div class="field span-2"><label for="incident-title">Short incident title</label><input id="incident-title" name="title" maxlength="160" required placeholder="Example: Payment application is unavailable"></div><div class="field span-2"><label for="incident-description">Detailed description</label><textarea id="incident-description" name="description" required placeholder="What happened, when did it start, what is affected, and what have you already tried?"></textarea></div></div><div class="suggestion" id="category-suggestion" hidden><span class="suggestion-icon">${ICONS.intelligence}</span><span><strong>Suggested category:</strong> <span data-suggestion-text></span></span></div><button class="button small" type="button" data-action="suggest-category">${ICONS.intelligence} Suggest category</button></section><section class="form-section"><h2>Impact assessment</h2><p>Priority is calculated from impact, urgency, the number of affected users, and service criticality.</p><div class="form-grid triple"><div class="field"><label for="incident-category">Category</label><select id="incident-category" name="categoryId" required>${optionList(meta.categories, '', 'Select a category')}</select></div><div class="field"><label for="incident-service">Affected IT service</label><select id="incident-service" name="serviceId" required>${optionList(meta.services, '', 'Select the affected service')}</select></div><div class="field"><label for="incident-users">Affected users</label><input id="incident-users" name="affectedUsers" type="number" min="1" value="1" required></div><div class="field"><label for="incident-impact">Impact</label><select id="incident-impact" name="impact" required>${selectValues(['', '1', '2', '3'], '', 'Select impact')}</select><span class="field-help">1 = limited, 3 = widespread</span></div><div class="field"><label for="incident-urgency">Urgency</label><select id="incident-urgency" name="urgency" required>${selectValues(['', '1', '2', '3'], '', 'Select urgency')}</select><span class="field-help">1 = can wait, 3 = immediate</span></div><div class="field"><span class="field-help">Business criticality comes from the selected service.</span></div></div></section><section class="form-section"><h2>Potentially related incidents</h2><p class="inline-note">When you submit, you can review and link any suggested matches.</p><div id="duplicate-preview"></div></section><footer class="form-footer"><a class="button" data-nav href="#/incidents">Cancel</a><button class="button primary" type="submit">Create incident &amp; calculate response</button></footer></form>`, 'Report an incident');
  } catch (error) {
    if (version !== state.routeVersion) return;
    root.innerHTML = shell(`${pageHeader('Report an incident', 'Tell us what is happening.')}${messagePanel(error)}`, 'Report an incident');
  }
}

async function renderIncidentDetail(id, version) {
  root.innerHTML = shell(`${pageHeader('Incident details', 'Loading the complete incident record…')}${loading()}`, 'Incident details');
  try {
    const endpoint = `/incidents/${encodeURIComponent(id)}`;
    const incidentRaw = await api(endpoint);
    const incident = objectOf(incidentRaw?.incident || incidentRaw);
    const clockReference = serverClockReference(incident.sla.evaluatedAt);
    const activeTab = state.incidentTabs.get(String(idOf(incident))) || 'overview';
    const [priorityRaw, assignmentRaw, relatedRaw, knowledge] = await Promise.all([
      api(`${endpoint}/priority-explanation`).catch(() => incident.priorityExplanation || null),
      api(`${endpoint}/assignment-explanation`).catch(() => incident.assignmentExplanation || null),
      api(`${endpoint}/related`).catch(() => incident.related || []),
      activeTab === 'related' && !isEmployee() ? api(`${endpoint}/recommendations`).catch((error) => ({ error })) : null,
    ]);
    if (version !== state.routeVersion) return;
    state.incidentClock = clockReference;
    root.innerHTML = shell(renderIncidentDetailMarkup(incident, {
      priority: objectOf(priorityRaw), assignment: objectOf(assignmentRaw),
      related: listOf(relatedRaw?.related || relatedRaw), knowledge, activeTab,
    }), 'Incident details');
    updateSlaClocks();
  } catch (error) {
    if (version !== state.routeVersion) return;
    root.innerHTML = shell(`${pageHeader('Incident details', `Incident ${id}`)}<section class="card">${messagePanel(error)}</section>`, 'Incident details');
  }
}

function renderIncidentDetailMarkup(incident, extra) {
  const id = idOf(incident);
  const status = first(incident.status, 'NEW');
  const actions = incidentActionButtons(incident);
  const notes = listOf(incident.notes || incident.investigationNotes);
  const comments = listOf(incident.comments || incident.conversation);
  const audits = listOf(incident.audit);
  const tab = extra.activeTab;
  return `${pageHeader('Incident details', 'Status, assignment and activity', `<a class="button" data-nav href="#/incidents">← Incident register</a>${actions}`)}<section class="card incident-hero"><div class="incident-hero-top"><div><div class="incident-id">${escapeHtml(incident.incidentCode || id)}</div><h1>${escapeHtml(first(incident.title, 'Untitled incident'))}</h1><p class="incident-summary">${escapeHtml(first(incident.description, incident.summary, 'No description available.'))}</p></div><div class="incident-hero-actions">${badge(first(incident.priority, '—'))}${badge(status)}</div></div><div class="metadata-grid"><div class="meta"><div class="meta-label">Reporter</div><div class="meta-value">${escapeHtml(first(incident.reporter?.name, incident.reporterName, '—'))}</div></div><div class="meta"><div class="meta-label">Affected service</div><div class="meta-value">${escapeHtml(first(incident.service?.name, incident.serviceName, '—'))}</div></div><div class="meta"><div class="meta-label">Category</div><div class="meta-value">${escapeHtml(first(incident.category?.name, incident.categoryName, 'Uncategorised'))}</div></div><div class="meta"><div class="meta-label">Assigned technician</div><div class="meta-value">${escapeHtml(first(incident.assignee?.name, incident.assignedTechnician?.name, incident.assigneeName, 'Unassigned'))}</div></div><div class="meta"><div class="meta-label">Opened</div><div class="meta-value">${escapeHtml(dateTime(first(incident.createdAt, incident.createdOn)))}</div></div></div></section><section class="details-layout"><section class="card"><div class="tab-list" role="tablist" aria-label="Incident details"><button class="tab-button" role="tab" aria-selected="${tab === 'overview'}" data-action="incident-tab" data-tab="overview" data-incident-id="${escapeAttr(id)}">Overview</button><button class="tab-button" role="tab" aria-selected="${tab === 'work'}" data-action="incident-tab" data-tab="work" data-incident-id="${escapeAttr(id)}">Investigation</button><button class="tab-button" role="tab" aria-selected="${tab === 'activity'}" data-action="incident-tab" data-tab="activity" data-incident-id="${escapeAttr(id)}">Activity timeline</button><button class="tab-button" role="tab" aria-selected="${tab === 'related'}" data-action="incident-tab" data-tab="related" data-incident-id="${escapeAttr(id)}">Related &amp; knowledge</button></div><div class="tab-panel">${tab === 'overview' ? detailOverview(incident, extra) : tab === 'work' ? detailWork(incident, notes, comments) : tab === 'activity' ? detailActivity(audits) : detailRelated(extra.related, extra.knowledge)}</div></section><aside class="card"><div class="card-header"><div><h2>SLA command</h2><p>Calendar time, server timestamps</p></div></div>${slaPanel(incident)}<div class="card-header"><div><h2>Assignment</h2><p>Strategy decision record</p></div></div>${assignmentPanel(incident, extra.assignment)}</aside></section>`;
}

function incidentActionButtons(incident) {
  const status = String(incident.status || '').toUpperCase(); const id = escapeAttr(idOf(incident));
  const isOriginalReporter = state.user?.id != null && Number(state.user.id) === Number(incident.reporter?.id);
  const buttons = [];
  if (isTech() && status === 'ASSIGNED') buttons.push(`<button class="button primary" data-action="incident-action" data-operation="acknowledge" data-incident-id="${id}">Acknowledge</button>`);
  if (isTech() && status === 'ACKNOWLEDGED') buttons.push(`<button class="button primary" data-action="incident-action" data-operation="start-investigation" data-incident-id="${id}">Start investigation</button>`);
  if (isTech() && ['ACKNOWLEDGED', 'IN_PROGRESS'].includes(status)) buttons.push(`<button class="button" data-action="incident-action" data-operation="request-information" data-incident-id="${id}">Request information</button>`);
  if (isTech() && status === 'IN_PROGRESS') buttons.push(`<button class="button primary" data-action="incident-action" data-operation="resolve" data-incident-id="${id}">Submit resolution</button>`);
  if (status === 'RESOLVED' && isOriginalReporter) {
    if (isEmployee()) buttons.push(`<button class="button" data-action="incident-action" data-operation="reject-resolution" data-incident-id="${id}">Reject resolution</button>`);
    if (isEmployee() || isAdmin()) buttons.push(`<button class="button primary" data-action="incident-action" data-operation="verify" data-incident-id="${id}">Verify resolution</button>`);
  }
  if ((isAdmin() || isEmployee()) && status === 'VERIFIED') buttons.push(`<button class="button primary" data-action="incident-action" data-operation="close" data-incident-id="${id}">Close incident</button>`);
  if (isEmployee() && status === 'CLOSED' && !incident.feedback) buttons.push(`<button class="button" data-action="incident-action" data-operation="feedback" data-incident-id="${id}">Leave feedback</button>`);
  if (isAdmin() && !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(status)) buttons.push(`<button class="button" data-action="incident-action" data-operation="assign" data-incident-id="${id}">Reassign</button><button class="button" data-action="incident-action" data-operation="priority" data-incident-id="${id}">Recalculate priority</button>`);
  return buttons.join('');
}

function detailOverview(incident, extra) {
  const priority = extra.priority || {}; const explanation = first(priority.explanation, priority.reason, incident.priorityExplanation, 'The persisted calculation explanation was not supplied by the service.');
  const impact = first(incident.impact, priority.impact, '—'); const urgency = first(incident.urgency, priority.urgency, '—'); const criticality = first(incident.businessCriticality, priority.businessCriticality, incident.service?.businessCriticality, '—'); const score = first(priority.score, incident.priorityScore, '—');
  return `<section class="detail-section"><h3>Incident record</h3><dl class="definition-list"><dt>Lifecycle state</dt><dd>${badge(first(incident.status, 'NEW'))}</dd><dt>Impact / urgency</dt><dd>${escapeHtml(`${impact} / ${urgency}`)}</dd><dt>Business criticality</dt><dd>${escapeHtml(criticality)}</dd><dt>Affected users</dt><dd>${escapeHtml(first(incident.affectedUsers, incident.affectedUserCount, '—'))}</dd><dt>Resolution</dt><dd>${escapeHtml(first(incident.resolutionDescription, incident.resolution?.description, 'Not yet resolved'))}</dd><dt>Verification</dt><dd>${escapeHtml(first(incident.verificationInfo, incident.verification?.note, 'Awaiting resolution'))}</dd></dl></section><section class="detail-section"><div class="explanation"><div class="explanation-title">${ICONS.intelligence} Why this priority?</div><p>${escapeHtml(explanation)}</p><div class="score-grid"><div class="score"><small>Impact</small><strong>${escapeHtml(impact)}</strong></div><div class="score"><small>Urgency</small><strong>${escapeHtml(urgency)}</strong></div><div class="score"><small>Criticality</small><strong>${escapeHtml(criticality)}</strong></div><div class="score"><small>Calculated score</small><strong>${escapeHtml(score)}</strong></div></div></div></section>`;
}

function detailWork(incident, notes, comments) {
  const id = escapeAttr(idOf(incident));
  const canReply = isEmployee() && incident.status === 'WAITING_FOR_INFORMATION';
  const canComment = incident.status !== 'CLOSED';
  const label = canReply ? 'Reply to information request' : 'Add a comment';
  return `<section class="detail-section"><h3>Investigation notes</h3>${notes.length ? `<div class="timeline">${notes.map((note) => `<article class="timeline-item"><div class="timeline-title">${escapeHtml(first(note.title, note.authorName, note.createdBy?.name, 'Investigation note'))}</div><div class="timeline-meta">${escapeHtml(dateTime(first(note.createdAt, note.timestamp)))}</div><p class="timeline-description">${escapeHtml(first(note.text, note.note, note.content, ''))}</p></article>`).join('')}</div>` : emptyState('No investigation notes yet', 'Technicians can record diagnosis steps, findings, and safe next actions.')}${isTech() && !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(incident.status) ? `<form data-form="add-note" data-incident-id="${id}" class="field" style="margin-top:1rem"><label for="note-body">Add investigation note</label><textarea id="note-body" name="note" required placeholder="Record a diagnosis step, finding, or action…"></textarea><button class="button primary" type="submit">Add note</button></form>` : ''}</section><section class="detail-section"><h3>Conversation</h3>${comments.length ? comments.map((comment) => `<article class="comment"><div class="comment-head"><strong>${escapeHtml(first(comment.author?.name, comment.authorName, comment.userName, 'Support user'))}</strong><time>${escapeHtml(dateTime(first(comment.createdAt, comment.timestamp)))}</time></div><p>${escapeHtml(first(comment.text, comment.message, comment.content, ''))}</p></article>`).join('') : '<p class="inline-note">No conversation messages have been added.</p>'}${canComment ? `<form data-form="add-comment" data-operation="${canReply ? 'reply' : 'comments'}" data-incident-id="${id}" class="inline-form"><label class="screen-reader-only" for="comment-body">${label}</label><input id="comment-body" name="message" required placeholder="Provide the requested additional information…"><button class="button" type="submit">${canReply ? 'Send reply' : 'Send comment'}</button></form>` : '<p class="inline-note">Conversation is read-only after closure.</p>'}</section>`;
}

function detailActivity(audits) {
  if (!audits.length) return `<section class="detail-section"><h3>Audit timeline</h3>${emptyState('No audit records were returned', 'Important lifecycle actions are written by the server and should appear here.')}</section>`;
  return `<section class="detail-section"><h3>Persistent audit timeline</h3><div class="timeline">${audits.map((event) => `<article class="timeline-item ${eventTone(event)}"><div class="timeline-title">${escapeHtml(first(event.description, event.actionType, event.action, 'Incident activity'))}</div><div class="timeline-meta">${escapeHtml(first(event.actorName, event.actor?.name, event.actorRole, 'System'))} · ${escapeHtml(dateTime(first(event.timestamp, event.createdAt)))}</div>${event.oldValue || event.newValue ? `<p class="timeline-description">${escapeHtml(`${first(event.oldValue, '—')} → ${first(event.newValue, '—')}`)}</p>` : ''}</article>`).join('')}</div></section>`;
}

function detailRelated(related, knowledge) {
  return `${knowledge ? smartFixes(knowledge) : ''}<section class="detail-section"><h3>Potentially related incidents</h3>${related.length ? `<div class="list">${related.map((item) => `<a class="list-row" data-nav href="#/incidents/${encodeURIComponent(idOf(item))}"><span class="activity-icon">⌁</span><span class="list-row-content"><span class="list-row-title">${escapeHtml(first(item.title, idOf(item)))}</span><span class="list-row-meta">${escapeHtml(first(item.similarityScore != null ? `Similarity ${item.similarityScore}%` : null, item.similarityExplanation, item.reason, item.similarity ? `Similarity ${Math.round(Number(item.similarity) * 100)}%` : 'Related incident'))}</span></span>${badge(first(item.priority, item.status, 'Related'))}</a>`).join('')}</div>` : emptyState('No linked incidents', 'Potential matches appear here after a duplicate check.')}</section>`;
}

function smartFixes({ recommendations = [], guidance, error }) {
  let content;
  if (error) content = messagePanel(error, false);
  else if (recommendations.length) {
    content = `<p class="inline-note">Advisory fixes from resolved incidents you can view. Scores measure similarity on a 0–100 scale.</p>
      <div class="fix-list">${recommendations.map(({ incident, resolution, score, explanation }) => `
        <article class="fix-card">
          <div class="fix-header"><h4><a class="support-link" data-nav href="#/incidents/${encodeURIComponent(incident.id)}">${escapeHtml(incident.title)}</a></h4>
            <span class="fix-score">Similarity ${escapeHtml(score)}/100</span></div>
          <p class="fix-context">${escapeHtml([incident.service, incident.category].filter(Boolean).join(' · '))}</p>
          <p class="fix-resolution">${escapeHtml(resolution)}</p>
          <p class="fix-explanation"><strong>Why this matched</strong> ${escapeHtml(explanation)}</p>
        </article>`).join('')}</div>`;
  } else if (guidance) {
    content = `<p class="inline-note">No sufficiently similar historical fixes were found.</p>
      <article class="fix-card"><p class="fix-context">Curated guidance</p><h4>${escapeHtml(guidance.title)}</h4>
        <ul>${guidance.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ul></article>`;
  } else content = emptyState('No matching historical resolutions', 'A recommendation appears when relevant resolved incidents are available.');
  return `<section class="detail-section smart-fixes"><h3>Smart Fix Suggestions</h3>${content}</section>`;
}

function slaPanel(incident) {
  const { sla } = incident;
  const breached = sla.responseBreached || sla.resolutionBreached;
  const warning = sla.status === 'AT_RISK';
  const end = Date.parse(sla.resolutionDeadline);
  const duration = sla.resolutionMinutes * 60_000;
  const resolvedAt = incident.resolution?.resolvedAt;
  const stopped = resolvedAt ? Date.parse(resolvedAt) : '';
  const clock = `<span data-sla-end="${end}" data-sla-duration="${duration}" data-sla-stop="${stopped}">${resolvedAt ? 'Resolved' : ''}</span>`;
  const tone = breached ? 'overdue' : warning ? 'urgent' : '';
  return `<div class="sla-card">
    <div class="sla-clock ${tone}">${clock}</div>
    <div class="progress ${breached ? 'danger' : warning ? 'warning' : ''}"><span></span></div>
    <div class="sla-list">
      <div class="sla-row"><span>Response deadline</span><strong>${escapeHtml(dateTime(sla.responseDeadline))}${sla.responseBreached ? ' · Breached' : ''}</strong></div>
      <div class="sla-row"><span>Resolution deadline</span><strong>${escapeHtml(dateTime(sla.resolutionDeadline))}${sla.resolutionBreached ? ' · Breached' : ''}</strong></div>
      <div class="sla-row"><span>Status</span>${badge(sla.status)}</div>
      <div class="sla-row"><span>Risk estimate</span>${badge(sla.risk?.level)}</div>
    </div><p class="inline-note">${escapeHtml(sla.risk?.explanation)}</p>
  </div>`;
}

const rescueRefreshInterval = 30_000;

function serverClockReference(evaluatedAt) {
  return { serverTime: Date.parse(evaluatedAt), received: performance.now() };
}

function updateSlaClocks() {
  for (const clock of document.querySelectorAll('[data-sla-end]')) {
    const end = Number(clock.dataset.slaEnd);
    const duration = Number(clock.dataset.slaDuration);
    const stopped = Number(clock.dataset.slaStop);
    const { serverTime, received } = state.incidentClock;
    const remaining = end - (stopped || (serverTime + performance.now() - received));
    const percent = Math.min(100, Math.max(0, (1 - remaining / duration) * 100));
    clock.closest('.sla-card').querySelector('.progress > span').style.width = `${percent}%`;
    if (!stopped) {
      const minutes = Math.floor(Math.abs(remaining) / 60_000);
      const seconds = Math.floor(Math.abs(remaining) / 1000) % 60;
      clock.textContent = `${minutes}m ${seconds}s ${remaining < 0 ? 'overdue' : 'left'}`;
    }
  }
  const results = document.querySelector('#rescue-results');
  if (results && state.rescueClock?.version === state.routeVersion) {
    const { serverTime, received, refreshAt, version } = state.rescueClock;
    const elapsed = performance.now() - received;
    const now = serverTime + elapsed;
    let crossedDeadline = false;
    for (const clock of results.querySelectorAll('[data-rescue-deadline]')) {
      const deadline = Number(clock.dataset.rescueDeadline);
      const remaining = deadline - now;
      crossedDeadline ||= deadline >= serverTime && remaining < 0;
      const seconds = Math.ceil(Math.abs(remaining) / 1000);
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor(seconds / 60) % 60;
      const duration = hours ? `${hours}h ${minutes}m` : `${minutes}m ${seconds % 60}s`;
      clock.textContent = `${duration} ${remaining < 0 ? 'overdue' : 'left'}`;
    }
    if ((elapsed >= refreshAt || (refreshAt === rescueRefreshInterval && crossedDeadline && elapsed >= 2_000))
      && !results.contains(document.activeElement) && !results.querySelector('button:disabled')) {
      state.rescueClock.refreshAt = Infinity;
      renderSlaRescue(version, { background: true });
    }
  }
}

async function renderNotifications(version) {
  root.innerHTML = shell(`${pageHeader('Notifications', 'Persistent in-app notifications generated by real incident events.', '<button class="button" data-action="reload">Refresh</button>')}<section class="card">${loading()}</section>`, 'Notifications');
  try {
    const response = await api('/notifications');
    state.user.unreadNotificationCount = response.unreadCount;
    if (version !== state.routeVersion) return;
    const items = listOf(response);
    root.innerHTML = shell(`${pageHeader('Notifications', 'Persistent in-app notifications generated by real incident events.', '<button class="button" data-action="reload">Refresh</button>')}<section class="card">${items.length ? `<div class="notification-list">${items.map((item) => `<button type="button" class="notification ${!(item.read || item.readAt) ? 'unread' : ''}" data-action="open-notification" data-notification-id="${escapeAttr(idOf(item))}" data-incident-id="${escapeAttr(item.incidentId ?? '')}"><span class="notification-icon">${notificationGlyph(item)}</span><div><div class="notification-title">${escapeHtml(first(item.subject, item.title, item.type, 'Support update'))}</div><div class="notification-text">${escapeHtml(first(item.message, item.body, item.description, ''))}</div></div><time>${escapeHtml(relativeTime(first(item.createdAt, item.timestamp)))}</time></button>`).join('')}</div>` : emptyState('All caught up', 'You have no notifications.')}</section>`, 'Notifications');
  } catch (error) { if (version === state.routeVersion) root.innerHTML = shell(`${pageHeader('Notifications', 'Persistent in-app notifications generated by real incident events.')}${messagePanel(error)}`, 'Notifications'); }
}

function notificationGlyph(item) { const text = JSON.stringify(item).toLowerCase(); return /breach|escalat/.test(text) ? '!' : /assign/.test(text) ? 'O' : /resolv|clos/.test(text) ? 'OK' : 'i'; }

async function renderProfile(version) {
  root.innerHTML = shell(`${pageHeader('My profile', 'Manage your incident work using this account.')}<section class="card">${loading()}</section>`, 'Profile');
  try {
    const meResponse = await api('/auth/me'); const user = objectOf(meResponse?.user || meResponse);
    if (version !== state.routeVersion) return;
    state.user = { ...state.user, ...user };
    localStorage.setItem('aegis_user', JSON.stringify(state.user));
    const header = pageHeader('My profile', 'Your campus support account.');
    const skills = user.role === 'TECHNICIAN' ? `<dt>Skills</dt><dd>${escapeHtml(user.skills.join(', ') || 'No skills configured')}</dd><dt>Available</dt><dd>${user.available ? 'Yes' : 'No'}</dd><dt>Capacity</dt><dd>${escapeHtml(user.capacity)}</dd>` : '';
    root.innerHTML = shell(header + `<section class="card form-section"><h2>Account details</h2>
      <dl class="definition-list"><dt>Name</dt><dd>${escapeHtml(user.name)}</dd><dt>Email</dt><dd>${escapeHtml(user.email)}</dd>
      <dt>Role</dt><dd>${escapeHtml(ROLE_LABELS[user.role])}</dd><dt>Status</dt><dd>${user.active ? 'Active' : 'Inactive'}</dd>${skills}</dl></section>`, 'Profile');
  } catch (error) { if (version === state.routeVersion) root.innerHTML = shell(`${pageHeader('My profile', 'Your campus support account.')}${messagePanel(error)}`, 'Profile'); }
}

async function renderWorkload(version) {
  root.innerHTML = shell(`${pageHeader('Technician workload', 'View active assignment capacity, deadlines, and operational balance.')}<section class="card">${loading()}</section>`, 'Workload');
  try {
    const [workloadRaw, incidentsRaw] = await Promise.all([api('/reports/workload'), api('/incidents?scope=assigned&pageSize=30')]);
    if (version !== state.routeVersion) return;
    const rows = listOf(workloadRaw); const assigned = listOf(incidentsRaw);
    root.innerHTML = shell(`${pageHeader('Technician workload', 'View active assignment capacity, deadlines, and operational balance.')}<section class="dashboard-grid equal"><section class="card"><div class="card-header"><div><h2>Workload balance</h2><p>Real active incident counts</p></div></div>${workloadList(rows)}</section><section class="card"><div class="card-header"><div><h2>My assigned incident queue</h2><p>Prioritise imminent SLA work</p></div></div>${incidentCompactList(assigned)}</section></section>`, 'Workload');
  } catch (error) { if (version === state.routeVersion) root.innerHTML = shell(`${pageHeader('Technician workload', 'View active assignment capacity.')}${messagePanel(error)}`, 'Workload'); }
}

const ADMIN_PAGES = {
  '/admin/users': { title: 'User management', subtitle: 'Create and manage local support accounts with enforced roles.', endpoint: '/admin/users', resource: 'users', columns: [['name', 'Name'], ['email', 'Email'], ['role', 'Role'], ['active', 'Status']] },
  '/admin/technicians': { title: 'Technician management', subtitle: 'Manage technician skills, availability and capacity.', endpoint: '/admin/technicians', resource: 'technicians', columns: [['name', 'Technician'], ['skills', 'Skills'], ['available', 'Availability'], ['capacity', 'Capacity'], ['activeWorkload', 'Active incidents']] },
  '/admin/services': { title: 'IT service management', subtitle: 'Maintain business criticality and service availability context.', endpoint: '/admin/services', resource: 'services', columns: [['name', 'Service'], ['description', 'Description'], ['businessCriticality', 'Criticality'], ['active', 'Status']] },
  '/admin/categories': { title: 'Category management', subtitle: 'Manage incident categories and transparent keyword mappings.', endpoint: '/admin/categories', resource: 'categories', columns: [['name', 'Category'], ['description', 'Description'], ['keywords', 'Keywords'], ['active', 'Status']] },
  '/admin/audit': { title: 'Audit history', subtitle: 'Immutable server-created records of important system actions.', endpoint: '/admin/audit', resource: 'audit', columns: [['createdAt', 'Timestamp'], ['actor', 'Actor'], ['incidentCode', 'Incident'], ['action', 'Action'], ['description', 'Description']] },
  '/admin/escalations': { title: 'Escalations', subtitle: 'Automatic escalation records requiring management attention.', endpoint: '/admin/escalations', resource: 'escalations', columns: [['incidentId', 'Incident'], ['level', 'Level'], ['reason', 'Reason'], ['createdAt', 'Created'], ['status', 'Status']] },
  '/admin/email-outbox': { title: 'Simulated email outbox', subtitle: 'Persistent local email simulations generated by actual notification events.', endpoint: '/admin/email-outbox', resource: 'outbox', columns: [['recipient', 'Recipient'], ['subject', 'Subject'], ['status', 'Delivery status'], ['incidentId', 'Incident'], ['createdAt', 'Generated']] },
};

async function renderAdminTable(config, version) {
  const { query } = route();
  const filters = config.resource === 'audit' ? `<form class="card form-section" data-form="audit-filters"><div class="form-grid">
    <label class="field">Incident database ID<input name="incidentId" type="number" min="1" value="${escapeAttr(query.get('incidentId') || '')}"></label>
    <label class="field">Action name<input name="action" placeholder="INCIDENT_CREATED" value="${escapeAttr(query.get('action') || '')}"></label>
  </div><footer class="form-footer"><a class="button" href="#/admin/audit">Clear</a><button type="submit" class="button primary">Apply filters</button></footer></form>` : '';
  const hasCreate = !config.readOnly && !['audit', 'escalations', 'outbox'].includes(config.resource);
  const actions = hasCreate ? `<button class="button primary" data-action="open-create-admin" data-resource="${config.resource}">+ Add ${config.resource.slice(0, -1)}</button>` : '<button class="button" data-action="reload">Refresh</button>';
  root.innerHTML = shell(`${pageHeader(config.title, config.subtitle, actions)}<section class="card table-card">${loading()}</section>`, config.title);
  try {
    const response = await api(config.endpoint + (query.size ? `?${query}` : '')); if (version !== state.routeVersion) return; const items = listOf(response);
    root.innerHTML = shell(`${pageHeader(config.title, config.subtitle, actions)}${filters}<section class="card table-card">${adminTable(items, config)}</section>`, config.title);
  } catch (error) { if (version === state.routeVersion) root.innerHTML = shell(`${pageHeader(config.title, config.subtitle)}${messagePanel(error)}`, config.title); }
}

function adminTable(items, config) {
  if (!items.length) return emptyState(`No ${config.resource} found`, 'No persistent records were returned by the backend.');
  return `<div class="table-scroll"><table class="data-table"><thead><tr>${config.columns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join('')}<th aria-label="Actions"></th></tr></thead><tbody>${items.map((item) => `<tr>${config.columns.map(([key]) => `<td>${renderAdminCell(item[key], key)}</td>`).join('')}<td><div class="table-actions">${config.resource === 'outbox' ? `<button class="button small" data-action="view-email" data-item='${escapeAttr(JSON.stringify(item))}'>View message</button>` : config.readOnly || ['audit', 'escalations'].includes(config.resource) ? '' : `<button class="button small" data-action="edit-admin" data-resource="${config.resource}" data-item='${escapeAttr(JSON.stringify(item))}'>Edit</button>`}</div></td></tr>`).join('')}</tbody></table></div>`;
}

function renderAdminCell(value, key) {
  if (value === undefined || value === null || value === '') return '<span class="cell-sub">—</span>';
  if (key === 'active' || key === 'available') return badge(bool(value) ? (key === 'available' ? 'Available' : 'Active') : (key === 'available' ? 'Unavailable' : 'Inactive'));
  if (/status|role|level/.test(key)) return badge(value);
  if (/timestamp|createdAt|updatedAt/.test(key)) return escapeHtml(dateTime(value));
  if (Array.isArray(value)) return escapeHtml(value.join(', '));
  if (typeof value === 'object') return escapeHtml(first(value.name, value.email, JSON.stringify(value)));
  return escapeHtml(String(value));
}

async function renderAssignment(version) {
  root.innerHTML = shell(`${pageHeader('Assignment strategy', 'Switch the persisted strategy used for future eligible incident assignments.')}<section class="card">${loading()}</section>`, 'Assignment strategy');
  try {
    const result = objectOf(await api('/admin/assignment-strategy')); if (version !== state.routeVersion) return;
    const selected = first(result.current, result.currentStrategy, result.strategy, result.selectedStrategy, 'SKILL_BASED'); const options = listOf(result.available || result.availableStrategies || result.strategies || ['SKILL_BASED', 'LEAST_LOADED']);
    root.innerHTML = shell(`${pageHeader('Assignment strategy', 'Switch the persisted strategy used for future eligible incident assignments.')}<section class="dashboard-grid equal"><form class="card form-card" data-form="assignment-settings"><section class="form-section"><h2>Current automatic assignment policy</h2><p>This selection is applied by the backend when a new incident has eligible technicians.</p><div class="field"><label for="assignment-strategy">Strategy</label><select id="assignment-strategy" name="strategy">${options.map((option) => { const val = typeof option === 'string' ? option : (option.key || valueOf(option)); const label = typeof option === 'string' ? cap(option) : labelOf(option); return `<option value="${escapeAttr(val)}" ${String(val) === String(selected) ? 'selected' : ''}>${escapeHtml(label)}</option>`; }).join('')}</select></div></section><footer class="form-footer"><button class="button primary" type="submit">Save strategy</button></footer></form><section class="card"><div class="card-header"><div><h2>How the strategies differ</h2><p>Interchangeable Strategy Pattern implementations</p></div></div><div class="card-body"><div class="detail-section"><h3>Skill-based intelligent assignment</h3><p class="inline-note">Scores category skills, availability, capacity, relevant experience, and deterministic tie-breaking.</p></div><div class="detail-section"><h3>Least-loaded assignment</h3><p class="inline-note">Selects an eligible available technician primarily by active workload, with a stable tie-break.</p></div><div class="suggestion"><span class="suggestion-icon">i</span><span>The active policy is persisted and affects subsequent automatic assignments; manual reassignment remains auditable.</span></div></div></section></section>`, 'Assignment strategy');
  } catch (error) { if (version === state.routeVersion) root.innerHTML = shell(`${pageHeader('Assignment strategy', 'Switch the persisted strategy used for future eligible assignments.')}${messagePanel(error)}`, 'Assignment strategy'); }
}

async function renderSlaPolicies(version) {
  const header = pageHeader('SLA policies', 'Targets are measured in calendar minutes and apply to newly reported incidents.');
  root.innerHTML = shell(header + loading(), 'SLA policies');
  try {
    const { policies } = await api('/admin/sla-policies');
    if (version !== state.routeVersion) return;
    root.innerHTML = shell(header + `<section class="settings-grid">${policies.map((policy) => `
      <form class="card form-section" data-form="sla-policy" data-priority="${escapeAttr(policy.priority)}">
        <h2>${escapeHtml(policy.priority)}</h2>
        <label class="field">Response minutes<input name="responseMinutes" type="number" min="1" required value="${policy.responseMinutes}"></label>
        <label class="field">Resolution minutes<input name="resolutionMinutes" type="number" min="1" required value="${policy.resolutionMinutes}"></label>
        <footer class="form-footer"><button class="button primary" type="submit">Save ${escapeHtml(policy.priority)}</button></footer>
      </form>`).join('')}</section>`, 'SLA policies');
  } catch (error) {
    if (version === state.routeVersion) root.innerHTML = shell(header + messagePanel(error), 'SLA policies');
  }
}

async function renderSlaMonitor(version) {
  root.innerHTML = shell(`${pageHeader('SLA monitor', 'Real-time deadline status, early warnings, and persisted breach records.', '<button class="button" data-action="run-sla-monitor">Run monitor</button>')}<section class="card">${loading()}</section>`, 'SLA monitor');
  try {
    const [monitorRaw, violationsRaw, policiesRaw] = await Promise.all([api('/sla/monitor'), api('/sla/violations'), api('/sla/policies')]);
    if (version !== state.routeVersion) return; const monitor = objectOf(monitorRaw); const violations = listOf(violationsRaw?.violations || violationsRaw); const policies = listOf(policiesRaw?.policies || policiesRaw);
    root.innerHTML = shell(`${pageHeader('SLA monitor', 'Real-time deadline status, early warnings, and persisted breach records.', '<button class="button" data-action="run-sla-monitor">Run monitor</button>')}<section class="metric-grid">${metric('Monitored active incidents', first(monitor.scanned, monitor.monitored, monitor.activeIncidents, 0), 'Latest server-side evaluation', 'blue')}${metric('Approaching deadline', first(monitor.warnings, monitor.warningCount, 0), 'Advance warning signals', 'amber')}${metric('Recorded breaches', first(monitor.breaches, monitor.breachCount, violations.length), 'No duplicate breach events', 'red')}${metric('Compliance', percent(first(monitor.complianceRate, monitor.compliance, '—')), 'Calculated from persisted state', 'green')}${metric('Policies', policies.length, 'Configurable priority targets', 'teal')}</section><section class="dashboard-grid equal"><section class="card"><div class="card-header"><div><h2>Priority policies</h2><p>Calendar time targets used in demo mode</p></div></div>${policies.length ? `<div class="list">${policies.map((policy) => `<div class="list-row"><span>${badge(first(policy.priority, policy.name, 'SLA'))}</span><span class="list-row-content"><span class="list-row-title">${escapeHtml(first(policy.name, `${policy.priority} response policy`))}</span><span class="list-row-meta">Response: ${escapeHtml(first(policy.responseTarget, policy.responseMinutes ? `${policy.responseMinutes} min` : '—'))} · Resolution: ${escapeHtml(first(policy.resolutionTarget, policy.resolutionMinutes ? `${policy.resolutionMinutes} min` : '—'))}</span></span></div>`).join('')}</div>` : emptyState('No policies found', 'An administrator must configure persisted SLA policies.')}</section><section class="card"><div class="card-header"><div><h2>SLA violation history</h2><p>Persisted violations only</p></div></div>${violations.length ? `<div class="list">${violations.map((violation) => `<div class="list-row"><span class="activity-icon critical">!</span><span class="list-row-content"><span class="list-row-title">${escapeHtml(first(violation.incidentCode, violation.incidentId, violation.incident?.id, 'Incident breach'))}</span><span class="list-row-meta">${escapeHtml(first(violation.type, violation.reason, 'SLA violation'))} · ${escapeHtml(dateTime(first(violation.detectedAt, violation.createdAt, violation.timestamp)))}</span></span></div>`).join('')}</div>` : emptyState('No violations returned', 'The monitor has not returned a persisted violation record.')}</section></section>`, 'SLA monitor');
  } catch (error) { if (version === state.routeVersion) root.innerHTML = shell(`${pageHeader('SLA monitor', 'Real-time deadline status and persisted breach records.')}${messagePanel(error)}`, 'SLA monitor'); }
}

const rescueLabels = {
  OVERDUE: ['Overdue', 'breached'], BREACHED: ['SLA breached', 'breached'], CRITICAL: ['P1 attention', 'critical'],
  APPROACHING: ['Approaching', 'warning'], UNASSIGNED: ['Needs assignment', 'warning'], ON_TRACK: ['On track', 'good'],
};

async function renderSlaRescue(version, { background = false } = {}) {
  const previousClock = state.rescueClock;
  const showAll = route().query.get('all') === '1';
  const header = pageHeader('SLA Rescue', 'Review open incidents before a missed target becomes an escalation.',
    '<button class="button" type="button" data-action="reload">Refresh risks</button><a class="button" data-nav href="#/sla-monitor">SLA monitor</a>');
  if (!background) root.innerHTML = shell(header + '<div id="rescue-results">' + loading() + '</div>', 'SLA Rescue');
  try {
    const { evaluatedAt, items } = await api('/sla/rescue');
    if (version !== state.routeVersion || (background && previousClock !== state.rescueClock)) return;
    const results = document.querySelector('#rescue-results');
    if (background && (results.contains(document.activeElement) || results.querySelector('button:disabled'))) {
      state.rescueClock.refreshAt = performance.now() - state.rescueClock.received + 5_000;
      return;
    }
    state.rescueClock = { ...serverClockReference(evaluatedAt), version, refreshAt: rescueRefreshInterval };
    const attention = items.filter((item) => item.risk !== 'ON_TRACK');
    const visible = showAll ? items : attention;
    const filters = `<nav class="rescue-filters" aria-label="Rescue queue filter">
      <a class="button small" data-nav href="#/admin/sla-rescue"${showAll ? '' : ' aria-current="page"'}>Needs attention (${attention.length})</a>
      <a class="button small" data-nav href="#/admin/sla-rescue?all=1"${showAll ? ' aria-current="page"' : ''}>All active (${items.length})</a>
    </nav>`;
    results.innerHTML = `<div class="rescue-toolbar">${filters}
      <p class="inline-note">Risks checked <time datetime="${escapeAttr(evaluatedAt)}">${escapeHtml(dateTime(evaluatedAt))}</time></p></div>
      ${visible.length ? `<div class="rescue-list">${visible.map(rescueCard).join('')}</div>`
        : `<section class="card">${showAll ? emptyState('No active incidents', 'The queue updates as new incidents are reported.')
          : emptyState('No incidents need rescue', 'See all active incidents to review on-track targets.')}</section>`}`;
    updateSlaClocks();
  } catch (error) {
    if (version !== state.routeVersion || (background && previousClock !== state.rescueClock)) return;
    if (background) state.rescueClock.refreshAt = performance.now() - state.rescueClock.received + rescueRefreshInterval;
    else document.querySelector('#rescue-results').innerHTML = messagePanel(error);
  }
}

function rescueCard(item) {
  const [label, tone] = rescueLabels[item.risk];
  const technician = item.assignedTechnician;
  return `<article class="card rescue-card" data-rescue-id="${escapeAttr(item.id)}">
    <div class="rescue-incident"><p class="incident-id">${escapeHtml(item.incidentCode)}</p>
      <h2><a class="support-link" data-nav href="#/incidents/${encodeURIComponent(item.id)}">${escapeHtml(item.title)}</a></h2>
      <p class="fix-context">${escapeHtml(technician?.name ?? 'Unassigned')}</p></div>
    <div class="rescue-deadline">
      <div class="rescue-badges">${badge(item.priority)}${badge(label, tone)}</div>
      <strong>${cap(item.deadlineKind)} deadline</strong>
      <time datetime="${escapeAttr(item.deadline)}">${escapeHtml(dateTime(item.deadline))}</time>
      <span class="rescue-countdown" data-rescue-deadline="${Date.parse(item.deadline)}"></span>
    </div>
    <div class="rescue-action"><p>${escapeHtml(item.reason)}</p>
      <p><strong>Next step</strong> ${escapeHtml(item.suggestedAction)}</p>
      ${item.canRemind ? `<button class="button small" type="button" data-action="rescue-reminder"
        data-incident-id="${escapeAttr(item.id)}" data-target="${escapeAttr(item.deadlineKind)}" data-technician-id="${escapeAttr(technician.id)}">Notify technician</button>`
        : item.reminderSent ? '<span class="reminder-state">Reminder sent</span>' : ''}
    </div></article>`;
}

async function sendRescueReminder(button) {
  const { incidentId, target, technicianId } = button.dataset;
  const clock = state.rescueClock;
  if (clock) state.rescueClock = { ...clock, refreshAt: performance.now() - clock.received + 5_000 };
  button.disabled = true;
  button.textContent = 'Sending…';
  try {
    const result = await api(`/sla/rescue/${encodeURIComponent(incidentId)}/remind`, {
      method: 'POST', body: jsonBody({ target, technicianId: Number(technicianId) }),
    });
    const status = document.createElement('span');
    status.className = 'reminder-state';
    status.textContent = 'Reminder sent';
    button.replaceWith(status);
    toast(result.sent ? 'The assigned technician was notified.' : 'A reminder was already sent for this target.', 'success');
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Notify technician';
    toast(error.message, 'error');
  }
}

function reportFilters(query, categories) {
  return `<form class="card form-section" data-form="report-filters">
    <div class="form-grid triple">
      <label class="field">From (UTC)<input name="from" type="date" value="${escapeAttr(query.get('from') || '')}"></label>
      <label class="field">To (UTC)<input name="to" type="date" value="${escapeAttr(query.get('to') || '')}"></label>
      <div class="field"><label for="report-category">Category</label><select id="report-category" name="category">${optionList(categories, query.get('category'), 'All categories')}</select></div>
    </div>
    <footer class="form-footer"><a class="button" href="#/reports">Clear</a><button type="submit" class="button primary">Apply filters</button></footer>
  </form>`;
}

async function renderReports(version) {
  const header = pageHeader('Reports & analytics', 'Incident metrics and technician workload.', '<button class="button" data-action="download-csv">Export incident CSV</button>');
  const { query } = route();
  root.innerHTML = shell(header + loading(), 'Reports');
  try {
    const [overview, workload, meta] = await Promise.all([
      api(`/reports/overview?${query}`), api('/reports/workload'), loadMeta(),
    ]);
    if (version !== state.routeVersion) return;
    const minutes = (value) => value === null ? '—' : `${value} min`;
    const chart = (title, entries) => `<section class="card"><div class="card-header"><h2>${title}</h2></div>${renderBars(entries)}</section>`;
    const cards = [
      metric('Total incidents', overview.totalIncidents, 'Selected reporting period'),
      metric('Resolved', overview.resolvedIncidents, 'Includes verified and closed incidents', 'green'),
      metric('Average response', minutes(overview.averageResponseMinutes), 'Time to acknowledgement', 'teal'),
      metric('Average resolution', minutes(overview.averageResolutionMinutes), 'Time to resolution', 'amber'),
      metric('SLA compliance', percent(overview.slaComplianceRate ?? '—'), 'Resolved incidents meeting both targets', 'green'),
    ];
    root.innerHTML = shell(header + reportFilters(query, meta.categories) + `
      <section class="metric-grid">${cards.join('')}</section>
      <section class="dashboard-grid equal">
        ${chart('Incident trend', overview.trend)}
        ${chart('Service analysis', overview.byService)}
        ${chart('By category', overview.byCategory)}
        ${chart('By priority', overview.byPriority)}
        ${chart('By status', overview.byStatus)}
        <section class="card"><div class="card-header"><h2>Current technician workload</h2></div>${workloadList(listOf(workload))}</section>
      </section>`, 'Reports');
  } catch (error) {
    if (version === state.routeVersion) root.innerHTML = shell(header + reportFilters(query, state.cache.categories || []) + messagePanel(error), 'Reports');
  }
}

async function renderServicePulse(version) {
  root.innerHTML = shell(`${pageHeader('Service Pulse', 'Dependency-aware, potential downstream impact intelligence.')}<section class="card">${loading()}</section>`, 'Service Pulse');
  try {
    const response = await api('/admin/service-pulse'); if (version !== state.routeVersion) return; const services = listOf(response.services);
    const dependencyForm = `<form class="card form-section" data-form="dependency"><h2>Add a service dependency</h2><div class="form-grid"><label class="field">Service<select name="serviceId" required>${optionList(services)}</select></label><label class="field">Depends on<select name="dependsOnServiceId" required>${optionList(services)}</select></label></div><footer class="form-footer"><button class="button primary" type="submit">Save dependency</button></footer></form>`;
    root.innerHTML = shell(`${pageHeader('Service Pulse', 'Dependency-aware, potential downstream impact intelligence.')}<section class="card"><div class="card-header"><div><h2>Service dependency map</h2><p>Open incidents and service dependencies can indicate which services may be affected.</p></div></div>${services.length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Service</th><th>Health signal</th><th>Active incidents</th><th>Critical incidents</th><th>Potential impact</th></tr></thead><tbody>${services.map((service) => `<tr><td><strong>${escapeHtml(first(service.name, service.serviceName, 'Service'))}</strong></td><td>${badge(numeric(service.criticalIncidents) > 0 ? 'At risk' : numeric(service.activeIncidents) > 0 ? 'Active' : 'Healthy')}</td><td>${escapeHtml(first(service.activeIncidents, service.activeIncidentCount, service.activeCount, 0))}</td><td>${escapeHtml(first(service.criticalIncidents, service.criticalIncidentCount, service.criticalCount, 0))}</td><td>${escapeHtml(listOf(service.potentialImpact).join(', ') || 'No related downstream services recorded.')}</td></tr>`).join('')}</tbody></table></div>` : emptyState('No service dependency records', 'Administrators can define dependencies to enable Service Pulse.')}</section>${dependencyForm}`, 'Service Pulse');
  } catch (error) { if (version === state.routeVersion) root.innerHTML = shell(`${pageHeader('Service Pulse', 'Dependency-aware potential impact intelligence.')}${messagePanel(error)}`, 'Service Pulse'); }
}

function formValues(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  for (const [key, value] of Object.entries(values)) if (typeof value === 'string') values[key] = value.trim();
  return values;
}

function formError(form, message) {
  let region = form.querySelector('[data-form-error]') || form.querySelector('#form-message');
  if (!region) { region = document.createElement('div'); region.dataset.formError = 'true'; form.prepend(region); }
  region.innerHTML = `<div class="error-panel" role="alert">${escapeHtml(message)}</div>`;
}

function setFormBusy(form, busy) {
  for (const control of form.querySelectorAll('button, input, select, textarea')) control.disabled = busy;
  const submit = form.querySelector('button[type="submit"]');
  if (submit) { if (!submit.dataset.label) submit.dataset.label = submit.textContent; submit.textContent = busy ? 'Working…' : submit.dataset.label; }
}

function closeModal() { document.querySelector('.modal-backdrop')?.remove(); }
function showModal(title, content, footer = '') {
  closeModal();
  const dialog = document.createElement('div');
  dialog.className = 'modal-backdrop';
  dialog.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><h2 id="modal-title">${escapeHtml(title)}</h2><button class="icon-button" data-action="close-modal" aria-label="Close dialog">×</button></header><div class="modal-content">${content}</div>${footer ? `<footer class="modal-footer">${footer}</footer>` : ''}</section>`;
  document.body.append(dialog);
  dialog.querySelector('input, textarea, select, button')?.focus();
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeModal(); });
  return dialog;
}

function adminForm(resource, item = {}) {
  const edit = Boolean(item.id);
  const heading = edit ? `Edit ${resource.slice(0, -1)}` : `Add ${resource.slice(0, -1)}`;
  const fields = {
    users: `<div class="form-grid"><div class="field"><label>Name</label><input name="name" required value="${escapeAttr(item.name || '')}"></div><div class="field"><label>Email</label><input type="email" ${edit ? 'readonly' : 'name="email" required'} value="${escapeAttr(item.email || '')}"></div><div class="field"><label>Role</label>${edit ? `<input readonly value="${escapeAttr(ROLE_LABELS[item.role] ?? item.role)}">` : `<select name="role">${selectValues(['EMPLOYEE', 'TECHNICIAN', 'ADMINISTRATOR'], 'EMPLOYEE', 'Employee')}</select>`}</div>${edit ? `<div class="field"><label>Active</label><select name="active"><option value="true" ${item.active ? 'selected' : ''}>Active</option><option value="false" ${item.active ? '' : 'selected'}>Inactive</option></select></div>` : '<div class="field"><label>Password</label><input name="password" type="password" required minlength="8" placeholder="Development password"></div>'}</div>`,
    technicians: `<div class="form-grid"><div class="field"><label>Name</label><input name="name" required value="${escapeAttr(item.name || '')}"></div><div class="field"><label>Email</label><input name="email" type="email" required ${edit ? 'readonly' : ''} value="${escapeAttr(item.email || '')}">${edit ? '' : '<label>Password</label><input name="password" type="password" required minlength="8">'}</div><div class="field"><label>Skill tags</label><input name="skills" value="${escapeAttr(Array.isArray(item.skills) ? item.skills.join(', ') : item.skills || '')}" placeholder="Network, Security, Database"></div><div class="field"><label>Workload capacity</label><input name="capacity" type="number" min="0" max="99" required value="${escapeAttr(item.capacity ?? 6)}"></div><div class="field"><label>Availability</label><select name="available"><option value="true" ${item.available !== false ? 'selected' : ''}>Available</option><option value="false" ${item.available === false ? 'selected' : ''}>Unavailable</option></select></div></div>`,
    services: `<div class="form-grid"><div class="field"><label>Service name</label><input name="name" required value="${escapeAttr(item.name || '')}"></div><div class="field"><label>Business criticality</label><select name="businessCriticality">${selectValues(['1', '2', '3'], String(item.businessCriticality || '2'), 'Low')}</select></div><div class="field span-2"><label>Description</label><textarea name="description">${escapeHtml(item.description || '')}</textarea></div><div class="field"><label>Active</label><select name="active"><option value="true" ${item.active !== false ? 'selected' : ''}>Active</option><option value="false" ${item.active === false ? 'selected' : ''}>Inactive</option></select></div></div>`,
    categories: `<div class="form-grid"><div class="field"><label>Category name</label><input name="name" required value="${escapeAttr(item.name || '')}"></div><div class="field"><label>Keyword mappings</label><input name="keywords" value="${escapeAttr(Array.isArray(item.keywords) ? item.keywords.join(', ') : item.keywords || '')}" placeholder="wifi, router, vpn"></div><div class="field"><label>Active</label><select name="active"><option value="true" ${item.active !== false ? 'selected' : ''}>Active</option><option value="false" ${item.active === false ? 'selected' : ''}>Inactive</option></select></div></div>`,
  };
  showModal(heading, `<form data-form="admin-resource" data-resource="${escapeAttr(resource)}" data-item-id="${escapeAttr(item.id || '')}">${fields[resource] || '<p>Unsupported record type.</p>'}<div data-form-error style="margin-top:.8rem"></div><footer class="modal-footer"><button class="button" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">${edit ? 'Save changes' : 'Create record'}</button></footer></form>`);
}

async function openIncidentAction(id, operation) {
  const actionTitle = cap(operation);
  if (operation === 'assign') {
    let people = [];
    try { people = listOf(await api('/admin/technicians')); } catch (error) { toast(error.message, 'error'); return; }
    showModal('Manual reassignment', `<form data-form="incident-action" data-operation="assign" data-incident-id="${escapeAttr(id)}"><div class="field"><label for="assign-technician">Technician</label><select id="assign-technician" name="technicianId" required>${optionList(people, '', 'Select technician')}</select></div><div class="field" style="margin-top:.8rem"><label for="assign-reason">Reason</label><textarea id="assign-reason" name="reason" required placeholder="Record why an authorised reassignment is needed."></textarea></div><div data-form-error style="margin-top:.8rem"></div><footer class="modal-footer"><button class="button" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">Reassign incident</button></footer></form>`);
    return;
  }
  const content = ['request-information', 'reject-resolution'].includes(operation) ? `<label class="field">${operation === 'reject-resolution' ? 'Why is the issue still open?' : 'Question for the reporter'}<textarea name="message" required></textarea></label>` : operation === 'priority' ? `<div class="form-grid"><label class="field">Impact<input name="impact" type="number" min="1" max="3" required></label><label class="field">Urgency<input name="urgency" type="number" min="1" max="3" required></label></div>` : operation === 'resolve' ? `<div class="field"><label for="resolution-description">Resolution details</label><textarea id="resolution-description" name="resolution" required placeholder="Describe the investigation outcome and resolution applied."></textarea></div>` : operation === 'verify' ? `<div class="field"><label for="verify-note">Verification note</label><textarea id="verify-note" name="note" required placeholder="Confirm that the resolution restored normal service."></textarea></div>` : operation === 'feedback' ? `<div class="field"><label for="feedback-rating">Rating</label><select id="feedback-rating" name="rating">${selectValues(['1','2','3','4','5'], '5', '1')}</select></div><div class="field" style="margin-top:.8rem"><label for="feedback-comment">Feedback</label><textarea id="feedback-comment" name="comment" required placeholder="Share feedback about the resolution."></textarea></div>` : `<p class="confirm-copy">This will request the controlled <strong>${escapeHtml(actionTitle)}</strong> transition. The server will enforce lifecycle permissions and preconditions.</p>`;
  showModal(actionTitle, `<form data-form="incident-action" data-operation="${escapeAttr(operation)}" data-incident-id="${escapeAttr(id)}">${content}<div data-form-error style="margin-top:.8rem"></div><footer class="modal-footer"><button class="button" type="button" data-action="close-modal">Cancel</button><button class="button ${operation === 'close' ? 'danger' : 'primary'}" type="submit">Confirm ${escapeHtml(actionTitle)}</button></footer></form>`);
}

async function submitForm(form) {
  const kind = form.dataset.form;
  const values = formValues(form);
  const relatedIncidentIds = kind === 'new-incident' ? new FormData(form).getAll('relatedIncidentId') : [];
  form.querySelector('[data-form-error]')?.replaceChildren();
  setFormBusy(form, true);
  try {
    if (kind === 'login') {
      const session = objectOf(await api('/auth/login', { method: 'POST', body: jsonBody(values) }));
      saveSession(session);
      history.replaceState(null, '', '#/dashboard');
      await runWorkspaceLoad('Preparing your dashboard', renderRoute, 1600);
      toast('Signed in.', 'success');
      return;
    }
    if (kind === 'register') {
      const response = objectOf(await api('/auth/register', { method: 'POST', body: jsonBody(values) }));
      if (response.token && response.user) { saveSession(response); toast('Employee account created.', 'success'); go('/dashboard'); } else { toast('Account created. Please sign in.', 'success'); go('/login'); }
      return;
    }
    if (['report-filters', 'audit-filters'].includes(kind)) {
      const params = new URLSearchParams(Object.entries(values).filter(([, value]) => value));
      go(`${kind === 'audit-filters' ? '/admin/audit' : '/reports'}?${params}`);
      return;
    }
    if (kind === 'incident-search') {
      const params = new URLSearchParams(); for (const [key, value] of Object.entries(values)) if (value) params.set(key, value); const scope = route().query.get('scope'); if (scope) params.set('scope', scope); go(`/incidents?${params}`); return;
    }
    if (kind === 'new-incident') {
      values.impact = Number(values.impact); values.urgency = Number(values.urgency); values.relatedIncidentIds = relatedIncidentIds; values.affectedUsers = Number(values.affectedUsers);
      const response = objectOf(await api('/incidents', { method: 'POST', body: jsonBody(values) })); const incident = objectOf(response.incident || response);
      const duplicates = listOf(response.duplicates || response.potentialDuplicates);
      toast(duplicates.length ? `Incident created; ${duplicates.length} potential related incident(s) were found.` : 'Incident created with priority, SLA, and assignment calculation.', 'success');
      go(`/incidents/${encodeURIComponent(idOf(incident))}`); return;
    }
    if (kind === 'add-note') {
      await api(`/incidents/${encodeURIComponent(form.dataset.incidentId)}/notes`, { method: 'POST', body: jsonBody({ note: values.note, content: values.note }) }); toast('Investigation note added.', 'success'); await renderRoute(); return;
    }
    if (kind === 'add-comment') {
      await api(`/incidents/${encodeURIComponent(form.dataset.incidentId)}/${form.dataset.operation}`, { method: 'POST', body: jsonBody({ message: values.message, content: values.message }) }); toast('Message added to the incident conversation.', 'success'); await renderRoute(); return;
    }
    if (kind === 'dependency') {
      await api('/admin/dependencies', { method: 'POST', body: jsonBody(values) });
      toast('Service dependency saved.', 'success'); await renderRoute(); return;
    }
    if (kind === 'sla-policy') {
      await api(`/admin/sla-policies/${encodeURIComponent(form.dataset.priority)}`, { method: 'PATCH', body: jsonBody(values) });
      toast('SLA policy saved.', 'success'); await renderRoute(); return;
    }
    if (kind === 'assignment-settings') {
      try { await api('/admin/assignment-strategy', { method: 'PATCH', body: jsonBody(values) }); } catch (error) { await api('/admin/assignment-strategy', { method: 'PUT', body: jsonBody(values) }); }
      toast('Assignment strategy saved.', 'success'); await renderRoute(); return;
    }
    if (kind === 'incident-action') {
      const id = form.dataset.incidentId; const operation = form.dataset.operation;
      if (operation === 'resolve' && values.resolutionDescription) values.resolution = values.resolutionDescription;
      if (operation === 'verify' && values.comment) values.note = values.comment;
      const suffix = operation === 'priority' ? '' : `/${operation}`;
      await api(`/incidents/${encodeURIComponent(id)}${suffix}`, { method: operation === 'priority' ? 'PATCH' : 'POST', body: jsonBody(values) }); closeModal(); toast(`${cap(operation)} action completed.`, 'success'); await renderRoute(); return;
    }
    if (kind === 'admin-resource') {
      const { resource, itemId } = form.dataset;
      if (resource === 'users' && itemId && form.elements.active.selectedOptions[0]?.defaultSelected) delete values.active;
      if ('skills' in values) values.skills = values.skills.split(',').map((s) => s.trim()).filter(Boolean);
      if ('keywords' in values) values.keywords = values.keywords.split(',').map((s) => s.trim()).filter(Boolean);
      if ('active' in values) values.active = values.active === 'true';
      if ('available' in values) values.available = values.available === 'true';
      if ('capacity' in values) values.capacity = Number(values.capacity);
      if ('businessCriticality' in values) values.businessCriticality = Number(values.businessCriticality);
      await api(`/admin/${resource}${itemId ? `/${encodeURIComponent(itemId)}` : ''}`, { method: itemId ? 'PATCH' : 'POST', body: jsonBody(values) }); closeModal(); toast(`${cap(resource.slice(0, -1))} ${itemId ? 'updated' : 'created'}.`, 'success'); await renderRoute(); return;
    }
  } catch (error) { formError(form, error.message); } finally { setFormBusy(form, false); }
}

async function suggestCategory() {
  const form = document.querySelector('form[data-form="new-incident"]'); if (!form) return;
  const values = formValues(form); if (!values.title && !values.description) { toast('Add an incident title or description before requesting a category suggestion.', 'error'); return; }
  try {
    const result = objectOf(await api('/intelligence/suggest-category', { method: 'POST', body: jsonBody({ title: values.title, description: values.description }) }));
    const category = first(result.category?.name, result.suggestedCategory?.name, result.suggestedCategory, result.name, 'No confident suggestion'); const explanation = first(result.explanation, result.reason, result.matchedKeywords?.length ? `Matched: ${result.matchedKeywords.join(', ')}` : 'No configured keyword match.');
    const panel = document.querySelector('#category-suggestion'); panel.hidden = false; panel.querySelector('[data-suggestion-text]').textContent = `${category}. ${explanation}`;
    const select = form.querySelector('[name="categoryId"]'); const candidate = [...select.options].find((option) => option.textContent.trim().toLowerCase() === String(category).trim().toLowerCase() || option.value === String(result.category?.id || result.categoryId || result.suggestedCategory?.id || '')); if (candidate) select.value = candidate.value;
  } catch (error) { toast(error.message, 'error'); }
}

async function checkDuplicatesPreview() {
  const form = document.querySelector('form[data-form="new-incident"]'); if (!form) return;
  const values = formValues(form); if (!values.title && !values.description) return;
  try {
    const response = await api('/intelligence/check-duplicates', { method: 'POST', body: jsonBody({ title: values.title, description: values.description, categoryId: values.categoryId, serviceId: values.serviceId }) });
    const items = listOf(response?.candidates || response?.duplicates || response?.items || response);
    if (!form.isConnected) return;
    const target = form.querySelector('#duplicate-preview');
    target.innerHTML = items.length ? `<div class="suggestion"><span class="suggestion-icon">!</span><span><strong>${items.length} potential related incident${items.length === 1 ? '' : 's'} found.</strong> ${items.map(({ incident, score, explanation }) => `<label class="switch-row"><span><a href="#/incidents/${encodeURIComponent(idOf(incident))}" target="_blank" rel="noopener">${escapeHtml(incident.incidentCode)} · ${escapeHtml(incident.title)}</a><small class="cell-sub">${escapeHtml(score)}% · ${escapeHtml(explanation)}</small></span><input type="checkbox" name="relatedIncidentId" value="${escapeAttr(idOf(incident))}" aria-label="Link ${escapeAttr(incident.incidentCode)}"></label>`).join('')}</span></div>` : '';
  } catch { /* Duplicate checks are advisory; creation remains available. */ }
}

async function exportCsv() {
  try {
    const { query } = route();
    const items = [];
    for (let page = 1; ; page += 1) {
      query.set('pageSize', '100');
      query.set('page', String(page));
      const result = await api(`/incidents?${query}`);
      items.push(...result.items);
      if (items.length >= result.total || result.items.length === 0) break;
    }
    const escapeCell = (cell) => {
      const text = String(cell ?? '');
      const safe = /^[\s]*[=+@-]/.test(text) || /^[\t\r]/.test(text) ? "'" + text : text;
      return '"' + safe.replaceAll('"', '""') + '"';
    };
    const columns = ['id', 'title', 'priority', 'status', 'service', 'category', 'assignee', 'createdAt'];
    const rows = items.map((item) => [item.incidentCode, item.title, item.priority, item.status, item.service?.name, item.category?.name, item.assignedTechnician?.name, item.createdAt]);
    const csv = [columns, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `aegis-incidents-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    toast(`Exported ${items.length} incidents.`, 'success');
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function renderRoute() {
  const version = ++state.routeVersion; let { path } = route();
  if (state.token && !state.user) { try { const response = await api('/auth/me'); saveSession({ token: state.token, user: objectOf(response?.user || response) }); } catch { clearSession(); } }
  const publicRoute = path === '/login' || path === '/register';
  if (!state.user && !publicRoute) { go('/login'); return; }
  if (state.user && publicRoute) { go('/dashboard'); return; }
  state.navOpen = false;
  if (path === '/login') { root.innerHTML = authShell('login'); return; }
  if (path === '/register') { root.innerHTML = authShell('register'); return; }
  if (path.startsWith('/admin/') && !isAdmin()) { renderUnauthorized(version); return; }
  if (path === '/sla-monitor' && !isAdmin()) { renderUnauthorized(version); return; }
  if (path === '/dashboard') return renderDashboard(version);
  if (path === '/incidents') return renderIncidents(version);
  if (path === '/incidents/new') return isTech() ? renderUnauthorized(version) : renderNewIncident(version);
  if (/^\/incidents\/[^/]+$/.test(path)) return renderIncidentDetail(decodeURIComponent(path.split('/').pop()), version);
  if (path === '/notifications') return renderNotifications(version);
  if (path === '/profile') return renderProfile(version);
  if (path === '/help' || path === '/about') return renderSupportPage(path);
  if (path === '/workload') return renderWorkload(version);
  if (path === '/admin/assignment') return renderAssignment(version);
  if (path === '/admin/sla') return renderSlaPolicies(version);
  if (path === '/sla-monitor') return renderSlaMonitor(version);
  if (path === '/admin/sla-rescue') return renderSlaRescue(version);
  if (path === '/reports') return isAdmin() ? renderReports(version) : renderUnauthorized(version);
  if (path === '/admin/service-pulse') return renderServicePulse(version);
  if (ADMIN_PAGES[path]) return renderAdminTable(ADMIN_PAGES[path], version);
  renderNotFound(version);
}

function renderSupportPage(path) {
  if (path === '/about') {
    root.innerHTML = shell(pageHeader('About BITS IT Support') + `
      <section class="card form-section support-page">
        ${brand({ size: 'brand-about' })}
        <h2>BITS Pilani, Hyderabad Campus</h2>
        <p>BITS IT Support is the campus-facing workspace for reporting and resolving IT incidents. It was developed as AEGIS for the CS F213 / MAC F212 Object-Oriented Programming course.</p>
        <a class="button" data-nav href="#/help">Open the user guide</a>
      </section>`, 'About');
    return;
  }
  const steps = isEmployee() ? [
    ['Report an incident', 'Choose the affected service, describe what happened, and submit the request.', '/incidents/new'],
    ['Track your requests', 'Open an incident to read updates, respond to a technician, or verify a resolution.', '/incidents'],
  ] : isTech() ? [
    ['Review your queue', 'Open an assigned incident. Acknowledge it, start investigation, and record your findings and resolution.', '/incidents?scope=assigned'],
    ['Check your workload', 'Review your capacity and open assignments.', '/workload'],
  ] : [
    ['Review SLA Rescue', 'Triage deadline risks and contact assigned technicians.', '/admin/sla-rescue'],
    ['Review reports', 'Filter incident activity and export the results.', '/reports'],
  ];
  steps.push(['Check notifications', 'Open an update to read it and follow its incident.', '/notifications']);
  root.innerHTML = shell(pageHeader('User guide', 'Common tasks for your role.') + `<div class="support-guide">${steps.map(([title, description, link]) =>
    `<section class="card form-section"><h2><a class="support-link" data-nav href="#${link}">${title}</a></h2><p>${description}</p></section>`
  ).join('')}</div>`, 'User guide');
}

function setSidebar(open, restoreFocus = false) {
  state.navOpen = open;
  document.querySelector('#app-shell')?.classList.toggle('nav-open', open);
  const trigger = document.querySelector('.mobile-menu');
  trigger?.setAttribute('aria-expanded', String(open));
  if (open) document.querySelector('.sidebar-close')?.focus();
  else if (restoreFocus) trigger?.focus();
}

function requestSignOut() {
  closeAccountMenu({ focus: true });
  if (document.querySelector('.logout-dialog')) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'modal logout-dialog';
  dialog.setAttribute('aria-labelledby', 'logout-title');
  dialog.innerHTML = `<form method="dialog">
    <div class="modal-header"><h2 id="logout-title">Sign out?</h2></div>
    <p class="confirm-copy">You’ll need to sign in again to access the workspace.</p>
    <div class="modal-footer">
      <button type="submit" class="button" value="cancel" autofocus>Cancel</button>
      <button type="submit" class="button danger" value="confirm">Sign out</button>
    </div>
  </form>`;
  let pending = false;
  dialog.addEventListener('cancel', event => { if (pending) event.preventDefault(); });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.addEventListener('submit', async (event) => {
    if (event.submitter.value !== 'confirm') return;
    event.preventDefault();
    pending = true;
    for (const button of dialog.querySelectorAll('button')) button.disabled = true;
    event.submitter.textContent = 'Signing out…';
    let revoked = true;
    try { await api('/auth/logout', { method: 'POST' }); } catch (error) { revoked = error.status === 401; }
    clearSession();
    dialog.close();
    history.replaceState(null, '', '#/login');
    await renderRoute();
    toast(revoked ? 'Signed out.' : 'Signed out of this browser. The server could not confirm the request.');
  });
  document.body.append(dialog);
  dialog.showModal();
}

async function initializeWorkspace() {
  if (!state.token && state.user) clearSession();
  if (state.token) {
    const token = state.token;
    try {
      const response = await api('/auth/me');
      if (state.token === token) saveSession({ token, user: response.user });
    } catch (error) {
      if (error.status !== 401) throw error;
    }
  }
  if (!location.hash) history.replaceState(null, '', state.user ? '#/dashboard' : '#/login');
  await renderRoute();
}

function runWorkspaceLoad(message, task, minimum = 0) {
  return withWorkspaceLoader(message, async () => {
    try {
      await task();
    } catch (error) {
      root.innerHTML = `<main class="startup-recovery" id="main-content">
        ${brand({ size: 'brand-about' })}
        <h1>Could not load the workspace</h1><p role="alert">${escapeHtml(error.message)}</p>
        <div class="page-actions"><button class="button primary" type="button" data-action="retry-workspace">Try again</button>
        ${state.token ? '<button class="button" type="button" data-action="request-logout">Sign out</button>' : ''}</div>
      </main>`;
    }
  }, { minimum });
}

function renderUnauthorized(version) {
  if (version !== state.routeVersion) return;
  root.innerHTML = shell(`${pageHeader('Access restricted', 'Your current role is not authorised to open this operational view.')}<section class="card">${emptyState('Authorisation required', 'Your account does not have access to this workspace.', 'Return to dashboard', 'nav-dashboard')}</section>`, 'Unauthorised');
}

function renderNotFound(version) {
  if (version !== state.routeVersion) return;
  root.innerHTML = shell(`${pageHeader('Page not found', 'The requested support page could not be found.')}<section class="card">${emptyState('This route is unavailable', 'Use the primary navigation to return to an workspace.', 'Return to dashboard', 'nav-dashboard')}</section>`, 'Not found');
}

document.addEventListener('click', async (event) => {
  const appearanceChoice = event.target.closest('[data-theme-choice], [data-accent-choice]');
  if (appearanceChoice) {
    const { themeChoice, accentChoice } = appearanceChoice.dataset;
    window.bitsAppearance.set(themeChoice ? { theme: themeChoice } : { accent: accentChoice });
    closeAccountMenu({ focus: true });
    return;
  }
  if (!event.target.closest('.account-control')) closeAccountMenu();
  const nav = event.target.closest('[data-nav]'); if (nav) { closeAccountMenu(); setSidebar(false); return; }
  const incidentRow = event.target.closest('[data-incident-link]'); if (incidentRow && !event.target.closest('a,button')) { go(`/incidents/${encodeURIComponent(incidentRow.dataset.incidentLink)}`); return; }
  const target = event.target.closest('[data-action]'); if (!target) return;
  const action = target.dataset.action;
  if (action === 'retry-workspace') return runWorkspaceLoad('Loading workspace', initializeWorkspace);
  if (action === 'reload') return route().path === '/dashboard' ? runWorkspaceLoad('Updating your dashboard', renderRoute) : renderRoute();
  if (action === 'toggle-account') return toggleAccountMenu();
  if (action === 'toggle-motion' || action === 'reset-appearance') {
    if (action === 'toggle-motion') window.bitsAppearance.set({ reducedMotion: !window.bitsAppearance.get().reducedMotion });
    else window.bitsAppearance.reset();
    closeAccountMenu({ focus: true });
    return;
  }
  if (action === 'toggle-nav') return setSidebar(!state.navOpen);
  if (action === 'close-nav') return setSidebar(false, true);
  if (action === 'close-modal') return closeModal();
  if (action === 'request-logout') return requestSignOut();
  if (action === 'new-incident') return go('/incidents/new');
  if (action === 'nav-incidents') return go('/incidents');
  if (action === 'nav-dashboard') return go('/dashboard');
  if (action === 'toggle-filters') { document.querySelector('#incident-filters')?.classList.toggle('collapsed'); return; }
  if (action === 'clear-filters') { go('/incidents'); return; }
  if (action === 'page-incidents') { const params = route().query; params.set('page', target.dataset.page); go(`/incidents?${params}`); return; }
  if (action === 'suggest-category') return suggestCategory();
  if (action === 'incident-tab') { state.incidentTabs.set(String(target.dataset.incidentId), target.dataset.tab); return renderIncidentDetail(target.dataset.incidentId, ++state.routeVersion); }
  if (action === 'incident-action') return openIncidentAction(target.dataset.incidentId, target.dataset.operation);
  if (action === 'open-notification') { const id = target.dataset.notificationId; const incidentId = target.dataset.incidentId; try { const result = await api(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }); if (result.updated) state.user.unreadNotificationCount = Math.max(0, (state.user.unreadNotificationCount || 0) - 1); } catch { /* navigation is still useful */ } if (incidentId) go(`/incidents/${encodeURIComponent(incidentId)}`); else renderRoute(); return; }
  if (action === 'open-create-admin') return adminForm(target.dataset.resource);
  if (action === 'view-email') {
    const email = JSON.parse(target.dataset.item);
    return showModal(email.subject, `<p class="inline-note">To ${escapeHtml(email.recipient)}</p><p class="description">${escapeHtml(email.body)}</p>`);
  }
  if (action === 'edit-admin') { try { adminForm(target.dataset.resource, JSON.parse(target.dataset.item)); } catch { toast('Could not open this editor record.', 'error'); } return; }
  if (action === 'run-sla-monitor') { try { await api('/sla/monitor', { method: 'POST' }); toast('SLA monitor completed.', 'success'); } catch (error) { toast(error.message, 'error'); } return renderRoute(); }
  if (action === 'rescue-reminder') return sendRescueReminder(target);
  if (action === 'download-csv') return exportCsv();
});

document.addEventListener('submit', (event) => { const form = event.target.closest('form[data-form]'); if (!form) return; event.preventDefault(); submitForm(form); });
document.addEventListener('change', (event) => { if (event.target.closest('form[data-form="new-incident"]') && ['title', 'description', 'categoryId', 'serviceId'].includes(event.target.name)) { window.clearTimeout(state.duplicateTimer); state.duplicateTimer = window.setTimeout(checkDuplicatesPreview, 500); } });
document.querySelector('.skip-link')?.addEventListener('click', (event) => {
  const main = document.querySelector('main');
  if (main) { event.preventDefault(); main.tabIndex = -1; main.focus(); }
});
document.addEventListener('keydown', (event) => {
  handleAccountKey(event);
  if (event.key === 'Escape' && state.navOpen && !event.defaultPrevented) setSidebar(false, true);
});
document.addEventListener('focusin', (event) => {
  if (!event.target.closest('.account-control')) closeAccountMenu();
});
window.addEventListener('hashchange', () => {
  window.scrollTo(0, 0);
  renderRoute();
});
window.setInterval(updateSlaClocks, 1000);
window.addEventListener('online', () => toast('Connection restored.'));
window.addEventListener('offline', () => toast('Connection lost. Reconnect to continue using IT Support.', 'error'));
runWorkspaceLoad('Initializing workspace', initializeWorkspace, 1600);

function assignmentPanel(incident, assignment = {}) {
  const explanation = first(assignment.explanation, assignment.reason, incident.assignmentExplanation, 'No assignment explanation was returned for this incident.');
  return `<div class="assignment-card"><div class="list-row" style="padding-top:0"><span>${avatar(first(incident.assignee, incident.assignedTechnician, { name: 'Unassigned' }))}</span><span class="list-row-content"><span class="list-row-title">${escapeHtml(first(incident.assignee?.name, incident.assignedTechnician?.name, incident.assigneeName, 'Unassigned'))}</span><span class="list-row-meta">${escapeHtml(first(assignment.strategy, incident.assignmentStrategy, 'Assignment decision'))}</span></span></div><p class="inline-note" style="margin-bottom:0">${escapeHtml(explanation)}</p></div>`;
}
