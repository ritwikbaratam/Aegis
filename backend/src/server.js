import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AegisDatabase } from './database.js';
import { ForbiddenError, Roles, UnauthorizedError, ValidationError } from './domain.js';
import { createServices, resetDemoData, safeError, seedDemoData } from './services.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const defaultDatabasePath = path.join(projectRoot, 'backend', 'data', 'aegis.db');
const frontendDirectory = path.join(projectRoot, 'frontend');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
};

const json = (response, status, payload) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
};

const text = (response, status, payload, contentType = 'text/plain; charset=utf-8') => {
  response.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  response.end(payload);
};

const cors = (request, response) => {
  const origin = request.headers.origin;
  if (origin && /^http:\/\/(localhost|127\.0\.0\.1):(5173|8080)$/.test(origin)) response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Vary', 'Origin');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  response.setHeader('Referrer-Policy', 'same-origin');
};

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new ValidationError('Request body must not exceed 1 MB');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new ValidationError('Request body must be valid JSON'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Request body must be a JSON object');
  return body;
}

const bearer = (request) => {
  const value = String(request.headers.authorization ?? '');
  return value.startsWith('Bearer ') ? value.slice(7).trim() : null;
};

const routeId = (parts, index) => decodeURIComponent(parts[index] ?? '');
const requireAdmin = (actor) => { if (actor.role !== Roles.ADMINISTRATOR) throw new ForbiddenError('Administrator access is required'); };

function listSlaPolicies(database) {
  return database.all(`SELECT * FROM sla_policies ORDER BY CASE priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 ELSE 4 END`)
    .map((policy) => ({ id: policy.id, priority: policy.priority, responseMinutes: policy.response_minutes, resolutionMinutes: policy.resolution_minutes, updatedAt: policy.updated_at }));
}

function meta(database) {
  return {
    services: database.all('SELECT * FROM it_services WHERE active=1 ORDER BY name').map((service) => ({ id: service.id, name: service.name, description: service.description, businessCriticality: service.business_criticality })),
    categories: database.all('SELECT * FROM categories WHERE active=1 ORDER BY name').map((category) => ({ id: category.id, name: category.name, keywords: JSON.parse(category.keywords || '[]') })),
    priorities: ['P1', 'P2', 'P3', 'P4'],
  };
}

export function createApplication({ databasePath = process.env.AEGIS_DATABASE_PATH || defaultDatabasePath, seed = process.env.NODE_ENV !== 'production', clock = () => new Date() } = {}) {
  const database = new AegisDatabase(databasePath);
  const services = createServices({ database, clock });
  if (seed) seedDemoData({ database, services, clock });

  const handler = async (request, response) => {
    cors(request, response);
    if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
    const url = new URL(request.url, 'http://localhost');
    try {
      const pathname = decodeURIComponent(url.pathname);
      if (!pathname.startsWith('/api/')) return serveStatic(pathname, response);
      const parts = pathname.split('/').filter(Boolean);
      const method = request.method ?? 'GET';
      const query = Object.fromEntries(url.searchParams.entries());
      const isPublic = (method === 'GET' && pathname === '/api/health') || (method === 'POST' && ['/api/auth/login', '/api/auth/register'].includes(pathname));
      const actor = isPublic ? null : services.auth.actorForToken(bearer(request));
      const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readBody(request) : {};

      if (method === 'GET' && pathname === '/api/health') {
        return json(response, 200, { status: 'ok', service: 'AEGIS API', time: clock().toISOString(), database: 'SQLite persistent storage' });
      }
      if (method === 'POST' && pathname === '/api/auth/register') return json(response, 201, { user: services.auth.createUser(body) });
      if (method === 'POST' && pathname === '/api/auth/login') return json(response, 200, services.auth.login(body.email, body.password));
      if (method === 'POST' && pathname === '/api/auth/logout') { services.auth.logout(bearer(request)); return json(response, 200, { message: 'Logged out' }); }
      if (method === 'GET' && pathname === '/api/auth/me') return json(response, 200, { user: actor });

      if (method === 'GET' && pathname === '/api/meta') return json(response, 200, meta(database));
      if (method === 'GET' && pathname === '/api/meta/services') return json(response, 200, meta(database).services);
      if (method === 'GET' && pathname === '/api/meta/categories') return json(response, 200, meta(database).categories);
      // Employee-safe aliases allow forms to obtain active configuration without admin access.
      if (method === 'GET' && pathname === '/api/services') return json(response, 200, { items: meta(database).services });
      if (method === 'GET' && pathname === '/api/categories') return json(response, 200, { items: meta(database).categories });
      if (method === 'GET' && pathname === '/api/technicians') return json(response, 200, { items: services.users.technicians().filter((tech) => tech.active).map((tech) => ({ id: tech.id, name: tech.name, skills: JSON.parse(tech.skills || '[]'), available: Boolean(tech.available), capacity: tech.capacity, activeWorkload: Number(tech.active_workload) })) });

      if (method === 'GET' && pathname === '/api/incidents') return json(response, 200, services.incidentService.list(actor, query));
      if (method === 'POST' && pathname === '/api/incidents') return json(response, 201, services.incidentService.create(actor, body));
      if (parts[1] === 'incidents' && parts[2]) {
        const id = routeId(parts, 2);
        const action = parts[3];
        if (method === 'GET' && !action) return json(response, 200, { incident: services.incidentService.get(actor, id) });
        if (method === 'PATCH' && !action) return json(response, 200, { incident: services.incidentService.patch(actor, id, body) });
        if (method === 'POST' && action === 'assign') return json(response, 200, { incident: services.incidentService.assign(actor, id, body) });
        if (method === 'POST' && action === 'acknowledge') return json(response, 200, { incident: services.incidentService.acknowledge(actor, id) });
        if (method === 'POST' && action === 'start-investigation') return json(response, 200, { incident: services.incidentService.startInvestigation(actor, id) });
        if (method === 'POST' && action === 'notes') return json(response, 201, { incident: services.incidentService.addNote(actor, id, body) });
        if (method === 'POST' && action === 'request-information') return json(response, 200, { incident: services.incidentService.requestInformation(actor, id, body) });
        if (method === 'POST' && action === 'reply') return json(response, 200, { incident: services.incidentService.reply(actor, id, body) });
        if (method === 'POST' && action === 'comments') return json(response, 201, { incident: services.incidentService.comment(actor, id, body) });
        if (method === 'POST' && action === 'resolve') return json(response, 200, { incident: services.incidentService.resolve(actor, id, body) });
        if (method === 'POST' && action === 'verify') return json(response, 200, { incident: services.incidentService.verify(actor, id, body) });
        if (method === 'POST' && action === 'reject-resolution') return json(response, 200, { incident: services.incidentService.rejectResolution(actor, id, body) });
        if (method === 'POST' && action === 'close') return json(response, 200, { incident: services.incidentService.close(actor, id) });
        if (method === 'POST' && action === 'feedback') return json(response, 201, { incident: services.incidentService.feedback(actor, id, body) });
        if (method === 'GET' && action === 'priority-explanation') {
          const incident = services.incidentService.get(actor, id); return json(response, 200, incident.priorityExplanation);
        }
        if (method === 'GET' && action === 'assignment-explanation') {
          const incident = services.incidentService.get(actor, id); return json(response, 200, { explanation: incident.assignmentExplanation, assignments: incident.assignments });
        }
        if (method === 'GET' && action === 'related') {
          const incident = services.incidentService.get(actor, id); return json(response, 200, { related: incident.related });
        }
        if (method === 'GET' && action === 'recommendations') return json(response, 200, services.incidentService.recommendations(actor, id));
      }

      if (method === 'POST' && pathname === '/api/intelligence/suggest-category') return json(response, 200, services.incidentService.categorySuggestion(body.description ?? '', body.title ?? ''));
      if (method === 'POST' && pathname === '/api/intelligence/check-duplicates') return json(response, 200, { candidates: services.incidentService.duplicates(body, actor) });

      if (method === 'GET' && pathname === '/api/notifications') {
        const items = database.all(`SELECT n.*,i.incident_code FROM notifications n LEFT JOIN incidents i ON i.id=n.incident_id WHERE n.recipient_id=:recipientId ORDER BY n.created_at DESC LIMIT 200`, { recipientId: actor.id })
          .map((note) => ({ id: note.id, incidentId: note.incident_id, incidentCode: note.incident_code, type: note.type, subject: note.subject, message: note.message, readAt: note.read_at, createdAt: note.created_at }));
        return json(response, 200, { items, unreadCount: items.filter((item) => !item.readAt).length });
      }
      if (parts[1] === 'notifications' && parts[2] && method === 'PATCH' && parts[3] === 'read') {
        const result = database.run('UPDATE notifications SET read_at=:now WHERE id=:id AND recipient_id=:recipientId AND read_at IS NULL', { id: Number(routeId(parts, 2)), recipientId: actor.id, now: clock().toISOString() });
        return json(response, 200, { updated: Number(result.changes) });
      }

      if (method === 'GET' && pathname === '/api/sla/policies') return json(response, 200, { policies: listSlaPolicies(database) });
      if ((method === 'GET' || method === 'POST') && pathname === '/api/sla/monitor') { requireAdmin(actor); return json(response, 200, services.incidentService.monitorSla()); }
      if (method === 'GET' && pathname === '/api/sla/violations') {
        requireAdmin(actor);
        const violations = database.all(`SELECT b.*,i.incident_code,i.title FROM sla_breaches b JOIN incidents i ON i.id=b.incident_id ORDER BY b.detected_at DESC`).map((row) => ({ id: row.id, incidentId: row.incident_id, incidentCode: row.incident_code, title: row.title, type: row.breach_type, detectedAt: row.detected_at }));
        return json(response, 200, { violations });
      }

      if (method === 'GET' && pathname === '/api/reports/overview') return json(response, 200, services.reports.overview(actor, query));
      if (method === 'GET' && pathname === '/api/reports/workload') return json(response, 200, { items: services.reports.workload(actor) });
      if (method === 'GET' && pathname === '/api/reports/services') return json(response, 200, { items: services.reports.services(actor) });
      if (method === 'GET' && pathname === '/api/reports/trends') return json(response, 200, { items: services.reports.trends(actor) });
      if (method === 'GET' && pathname === '/api/reports/export.csv') return text(response, 200, services.reports.csv(actor), 'text/csv; charset=utf-8');

      if (pathname.startsWith('/api/admin/')) {
        requireAdmin(actor);
        const resource = parts[2]; const id = parts[3];
        if (resource === 'users' && method === 'GET' && !id) return json(response, 200, { items: services.admin.usersList(actor) });
        if (resource === 'users' && method === 'POST' && !id) return json(response, 201, { user: services.admin.createUser(actor, body) });
        if (resource === 'users' && method === 'PATCH' && id) return json(response, 200, { user: services.admin.updateUser(actor, id, body) });
        if (resource === 'technicians' && method === 'GET') return json(response, 200, { items: services.admin.technicians(actor) });
        if (resource === 'technicians' && method === 'POST') return json(response, 201, { user: services.admin.createUser(actor, { ...body, role: Roles.TECHNICIAN }) });
        if (resource === 'technicians' && method === 'PATCH' && id) return json(response, 200, { user: services.admin.updateUser(actor, id, body) });
        if (resource === 'services' && method === 'GET' && !id) return json(response, 200, { items: services.admin.services(actor) });
        if (resource === 'services' && method === 'POST' && !id) return json(response, 201, { service: services.admin.upsertService(actor, null, body) });
        if (resource === 'services' && method === 'PATCH' && id) return json(response, 200, { service: services.admin.upsertService(actor, id, body) });
        if (resource === 'categories' && method === 'GET' && !id) return json(response, 200, { items: services.admin.categories(actor) });
        if (resource === 'categories' && method === 'POST' && !id) return json(response, 201, { category: services.admin.upsertCategory(actor, null, body) });
        if (resource === 'categories' && method === 'PATCH' && id) return json(response, 200, { category: services.admin.upsertCategory(actor, id, body) });
        if (resource === 'sla-policies' && method === 'GET') return json(response, 200, { policies: services.admin.slaPolicies(actor) });
        if (resource === 'sla-policies' && method === 'PATCH' && id) return json(response, 200, { policy: services.admin.updatePolicy(actor, id, body) });
        if (resource === 'assignment-strategy' && method === 'GET') return json(response, 200, services.admin.assignmentStrategy(actor));
        if (resource === 'assignment-strategy' && (method === 'PATCH' || method === 'PUT')) return json(response, 200, services.admin.updateAssignmentStrategy(actor, body));
        if (resource === 'audit' && method === 'GET') return json(response, 200, { items: services.admin.auditEvents(actor, query) });
        if (resource === 'escalations' && method === 'GET') return json(response, 200, { items: services.admin.escalations(actor) });
        if (resource === 'email-outbox' && method === 'GET') return json(response, 200, { items: services.admin.emailOutbox(actor) });
        if (resource === 'dependencies' && method === 'GET') return json(response, 200, { items: services.admin.dependencies(actor) });
        if (resource === 'dependencies' && method === 'POST') return json(response, 201, { dependency: services.admin.addDependency(actor, body) });
        if (resource === 'service-pulse' && method === 'GET') return json(response, 200, services.admin.servicePulse(actor));
        if (resource === 'run-sla-monitor' && method === 'POST') return json(response, 200, services.incidentService.monitorSla());
        if (resource === 'demo-reset' && method === 'POST') {
          if (process.env.NODE_ENV === 'production' || process.env.AEGIS_ENABLE_DEMO_RESET !== '1') throw new ForbiddenError('Demo reset requires explicit local opt-in');
          return json(response, 200, { reset: resetDemoData({ database, services, clock }) });
        }
      }
      return json(response, 404, { error: 'NOT_FOUND', message: 'No API route matches this request' });
    } catch (error) {
      const known = safeError(error);
      if (known.status >= 500) console.error(error);
      return json(response, known.status, { error: known.code, message: known.message, ...(known.details ? { details: known.details } : {}) });
    }
  };
  return { database, services, handler, close: () => database.close() };
}

function serveStatic(pathname, response) {
  const requestPath = pathname === '/' ? '/index.html' : pathname;
  const filename = path.resolve(frontendDirectory, `.${requestPath}`);
  if (filename !== frontendDirectory && !filename.startsWith(`${frontendDirectory}${path.sep}`)) return text(response, 403, 'Forbidden');
  let target = filename;
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) target = path.join(frontendDirectory, 'index.html');
  if (!fs.existsSync(target)) return text(response, 503, 'AEGIS frontend is being prepared.');
  const extension = path.extname(target).toLowerCase();
  response.writeHead(200, { 'Content-Type': MIME[extension] ?? 'application/octet-stream', 'Cache-Control': extension === '.html' ? 'no-store' : 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' });
  fs.createReadStream(target).pipe(response);
}

export function startServer(options = {}) {
  const application = createApplication(options);
  const port = Number(process.env.PORT ?? options.port ?? 8080);
  const server = http.createServer(application.handler);
  const monitor = setInterval(() => {
    try { application.services.incidentService.monitorSla(); } catch (error) { console.error('SLA monitor error', error); }
  }, 60_000);
  monitor.unref();
  server.listen(port, '127.0.0.1', () => console.log(`AEGIS API and frontend available at http://localhost:${port}`));
  const shutdown = () => { clearInterval(monitor); server.close(() => application.close()); };
  process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
  return { ...application, server };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) startServer();
