import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import { ConflictError, ForbiddenError, HistoricalFixMatcher } from '../src/domain.js';
import { createApplication } from '../src/server.js';

const matcher = new HistoricalFixMatcher();
const wifi = {
  title: 'Wi-Fi disconnects in the library',
  description: 'The wireless network drops whenever devices move between library access points.',
  category_id: 1, service_id: 6,
};
const history = {
  id: 10,
  title: 'Library wifi disconnection',
  description: 'Wireless network drops between library access points.',
  category_id: 1, service_id: 6,
  category_name: 'Network', service_name: 'Campus Network',
  resolution_description: 'Corrected the access point roaming settings and confirmed Wi-Fi connectivity in the library.',
};

test('Smart Fix matches Wi-Fi variants and treats capitalization and punctuation consistently', () => {
  const score = matcher.rank(wifi, [history])[0];
  const alternate = matcher.rank({ ...wifi, title: 'WI–FI disconnects, in the LIBRARY!!!' }, [history])[0];
  assert.equal(score.score, alternate.score);
  assert.equal(score.incident.title, history.title);
  assert.match(score.explanation, /Shared symptoms include.*wifi/);
  assert.match(score.explanation, /Matching phrases include.*network drops/);
});

test('Smart Fix recognizes equivalent sign-in and multi-factor authentication language', () => {
  const current = { title: 'Sign-in blocked by 2FA', description: 'The authentication service rejects the MFA approval after login.', category_id: 2, service_id: 2 };
  const past = { ...history, title: 'Login blocked by multi-factor authentication', description: 'The authentication service rejects the approval after login.',
    category_id: 2, service_id: 2, resolution_description: 'Restored the MFA approval flow and verified successful login.' };
  const [match] = matcher.rank(current, [past]);
  assert.match(match.explanation, /Shared symptoms include.*login.*mfa/);
  assert.match(match.explanation, /previous resolution mentions current symptoms/);
});

test('Smart Fix ranks contextual matches, then stable ties, and returns no more than four', () => {
  const overlap = { ...history, id: 20, service_id: 3, category_id: 3 };
  const sameService = { ...history, id: 21, category_id: 3 };
  const best = { ...history, id: 22, title: wifi.title, description: wifi.description };
  const tie = { ...best, id: 23 };
  const matches = matcher.rank(wifi, [overlap, sameService, best, tie, history]);
  assert.deepEqual(matches.map((match) => match.incident.id), [22, 23, 10, 21]);
  assert.match(matches[0].explanation, /Same affected IT service.*Same incident category/);
  assert.doesNotMatch(matches[3].explanation, /Same incident category/);
});

test('Smart Fix filters metadata-only matches, empty history, and missing or placeholder fixes', () => {
  const unrelated = { ...history, title: 'Shared mailbox full', description: 'Employees cannot send mail because the account storage quota is exceeded.' };
  assert.deepEqual(matcher.rank(wifi, [unrelated]), []);
  assert.deepEqual(matcher.rank(wifi, []), []);
  for (const resolution of [null, '   ', 'Fixed.', 'No resolution details', 'Pending']) {
    assert.deepEqual(matcher.rank(wifi, [{ ...history, resolution_description: resolution }]), []);
  }
});

const credentials = {
  employee: ['employee@aegis.local', 'Employee@12345'],
  admin: ['admin@aegis.local', 'Admin@12345'],
  network: ['alex.network@aegis.local', 'Technician@12345'],
  applications: ['jamie.apps@aegis.local', 'Technician@12345'],
};

function setup(t) {
  const start = Date.parse('2026-11-20T06:00:00Z');
  let time = start;
  const app = createApplication({ databasePath: ':memory:', seed: true, clock: () => new Date(time) });
  t.after(app.close);
  const { incidentService, auth } = app.services;
  const login = (role) => auth.login(...credentials[role]);
  const employee = login('employee').user;
  const admin = login('admin').user;
  const create = (title, input = {}) => incidentService.create(employee, {
    title, description: 'Wi-Fi disconnects between access points in the campus library.', serviceId: 6,
    categoryId: 1, impact: 2, urgency: 2, affectedUsers: 10, ...input,
  }).incident;
  const assigned = (incident) => auth.login(incident.assignedTechnician.email, 'Technician@12345').user;
  const resolve = (incident, technician, resolution = history.resolution_description) => {
    incidentService.acknowledge(technician, incident.id);
    incidentService.startInvestigation(technician, incident.id);
    return incidentService.resolve(technician, incident.id, { resolution });
  };
  const rescue = (incident) => incidentService.rescueQueue(admin).items.find((item) => item.id === incident.id);
  return { app, incidentService, login, employee, admin, create, assigned, resolve, rescue, start, setNow: (now) => { time = now; } };
}

test('Smart Fix provides labelled fallback for staff when no usable history exists', (t) => {
  const { app, incidentService, create, assigned, employee } = setup(t);
  // Only the isolated fixture is changed. An unresolved incident with stale resolution text is ineligible.
  app.database.run("UPDATE incidents SET resolution_description='Stale diagnosis in an open incident' WHERE status='IN_PROGRESS'");
  const incident = create('Library Wi-Fi keeps dropping');
  const result = incidentService.recommendations(assigned(incident), incident.id);
  assert.deepEqual(result.recommendations, []);
  assert.equal(result.guidance.title, 'Network troubleshooting');
  assert.match(result.guidance.steps[0], /multiple users/);
  assert.equal(incidentService.recommendations(employee, incident.id).guidance, null);
});

test('Smart Fix enforces both incident scopes and returns an allowlisted, redacted summary', (t) => {
  const { app, incidentService, login, admin, create, employee, assigned } = setup(t);
  const past = create('Library Wi-Fi disconnects, reporter@example.com');
  const technician = assigned(past);
  incidentService.acknowledge(technician, past.id);
  incidentService.startInvestigation(technician, past.id);
  incidentService.addNote(technician, past.id, { note: 'Private technician note for this fixture.' });
  incidentService.resolve(technician, past.id, {
    resolution: 'Fixed Wi-Fi roaming at library access points. password: secret-value token=token-value reporter@example.com',
  });
  const current = create('Library Wi-Fi disconnects');
  const known = incidentService.recommendations(assigned(current), current.id);
  const [match] = known.recommendations;
  assert.equal(match.incident.id, past.id);
  assert.deepEqual(Object.keys(match.incident).sort(), ['category', 'id', 'service', 'title']);
  assert.match(match.resolution, /\[redacted\]/);
  assert.doesNotMatch(JSON.stringify(known), /secret-value|token-value|reporter@example\.com|Private technician note/);
  const otherTech = login('applications').user;
  assert.throws(() => incidentService.recommendations(otherTech, current.id), ForbiddenError);
  incidentService.assign(admin, current.id, { technicianId: otherTech.id, reason: 'Test permitted viewer scope.' });
  assert.deepEqual(incidentService.recommendations(otherTech, current.id).recommendations, []);
  assert.equal(incidentService.recommendations(admin, current.id).recommendations[0].incident.id, past.id);
  assert.deepEqual(incidentService.recommendations(employee, current.id).recommendations, []);
  assert.equal(app.database.value('SELECT COUNT(*) FROM investigation_notes WHERE incident_id=:id', { id: past.id }), 1);
});

test('SLA Rescue distinguishes on-track, approaching response, exactly due, and overdue timestamps', (t) => {
  const { app, incidentService, create, rescue, setNow } = setup(t);
  const incident = create('Timed response fixture');
  const responseEnd = Date.parse(incident.sla.responseDeadline);
  assert.equal(rescue(incident).risk, 'ON_TRACK');
  assert.match(rescue(incident).reason, /acknowledgement is pending/);
  assert.equal(rescue(incident).deadline, incident.sla.responseDeadline);
  setNow(responseEnd - incident.sla.responseMinutes * 60_000 * .2);
  assert.equal(rescue(incident).risk, 'APPROACHING');
  assert.match(rescue(incident).reason, /Response is in the final 20%/);
  setNow(responseEnd);
  assert.equal(rescue(incident).risk, 'APPROACHING');
  assert.match(rescue(incident).reason, /Response is due now/);
  incidentService.monitorSla();
  assert.equal(app.database.value('SELECT COUNT(*) FROM sla_breaches WHERE incident_id=:id', { id: incident.id }), 0);
  setNow(responseEnd + 1);
  assert.equal(rescue(incident).risk, 'OVERDUE');
  assert.equal(rescue(incident).deadlineKind, 'response');
});

test('SLA Rescue tracks resolution after acknowledgement and excludes resolved, verified, and closed incidents', (t) => {
  const { incidentService, create, assigned, employee, rescue, setNow } = setup(t);
  const incident = create('Timed resolution fixture');
  const technician = assigned(incident);
  incidentService.acknowledge(technician, incident.id);
  incidentService.startInvestigation(technician, incident.id);
  const resolutionEnd = Date.parse(incident.sla.resolutionDeadline);
  setNow(resolutionEnd - 60_000);
  assert.equal(rescue(incident).risk, 'APPROACHING');
  assert.equal(rescue(incident).deadline, incident.sla.resolutionDeadline);
  assert.equal(rescue(incident).deadlineKind, 'resolution');
  assert.match(rescue(incident).reason, /Resolution is in the final 20%/);
  setNow(resolutionEnd);
  assert.match(rescue(incident).reason, /Resolution is due now/);
  setNow(resolutionEnd + 1);
  assert.equal(rescue(incident).risk, 'OVERDUE');
  incidentService.resolve(technician, incident.id, { resolution: 'Resolved the timed test incident successfully.' });
  assert.equal(rescue(incident), undefined);
  incidentService.verify(employee, incident.id, { note: 'Verified the solution.' });
  assert.equal(rescue(incident), undefined);
  incidentService.close(employee, incident.id);
  assert.equal(rescue(incident), undefined);
});

test('SLA Rescue is read-only and explains late acknowledgement without duplicating warnings or breaches', (t) => {
  const { app, incidentService, create, assigned, rescue, setNow } = setup(t);
  const incident = create('Late response fixture');
  const end = Date.parse(incident.sla.responseDeadline);
  const params = { id: incident.id };
  const warningCount = () => app.database.value("SELECT COUNT(*) FROM audit_events WHERE incident_id=:id AND action_type='SLA_WARNING_GENERATED'", params);
  const breaches = () => app.database.all('SELECT * FROM sla_breaches WHERE incident_id=:id ORDER BY id', params);
  setNow(end - 10);
  rescue(incident);
  assert.equal(warningCount(), 0);
  incidentService.monitorSla();
  incidentService.monitorSla();
  assert.equal(warningCount(), 1);
  setNow(end + 1);
  incidentService.acknowledge(assigned(incident), incident.id);
  const original = breaches();
  assert.equal(original.length, 1);
  assert.equal(rescue(incident).risk, 'BREACHED');
  assert.equal(rescue(incident).deadlineKind, 'resolution');
  assert.match(rescue(incident).reason, /Acknowledgement occurred after the response deadline/);
  incidentService.monitorSla();
  rescue(incident);
  assert.deepEqual(breaches(), original);
  assert.equal(warningCount(), 1);
});

test('SLA Rescue sorts overdue and P1 work before approaching, unassigned, and on-track rows', (t) => {
  const { app, incidentService, admin, create, assigned, start, setNow } = setup(t);
  const ordinary = create('On-track fixture');
  const unassigned = create('Unassigned fixture');
  const approaching = create('Approaching fixture');
  const critical = create('P1 fixture', { impact: 3, urgency: 3, affectedUsers: 650 });
  const overdue = create('Overdue fixture');
  const moreUrgent = create('Earlier overdue fixture');
  const soon = new Date(start + 10_000).toISOString();
  app.database.run('UPDATE incidents SET assigned_technician_id=NULL WHERE id=:id', { id: unassigned.id });
  app.database.run('UPDATE incidents SET response_deadline=:soon WHERE id=:id', { soon, id: approaching.id });
  app.database.run('UPDATE incidents SET response_deadline=:soon WHERE id=:id', { soon: new Date(start - 60_000).toISOString(), id: overdue.id });
  app.database.run('UPDATE incidents SET response_deadline=:soon WHERE id=:id', { soon: new Date(start - 120_000).toISOString(), id: moreUrgent.id });
  setNow(start);
  const fixtures = [moreUrgent, overdue, critical, approaching, unassigned, ordinary];
  const ids = new Set(fixtures.map(({ id }) => id));
  const rows = incidentService.rescueQueue(admin).items.filter(({ id }) => ids.has(id));
  assert.deepEqual(rows.map(({ id }) => id), fixtures.map(({ id }) => id));
  assert.deepEqual(rows.map(({ risk }) => risk), ['OVERDUE', 'OVERDUE', 'CRITICAL', 'APPROACHING', 'UNASSIGNED', 'ON_TRACK']);
  assert.equal(rows[4].canRemind, false);
  assert.match(rows[4].suggestedAction, /assign a qualified technician/);
  assert.throws(() => incidentService.remindForRescue(admin, ordinary.id, { target: 'response', technicianId: assigned(ordinary).id }), ConflictError);
});

test('SLA Rescue reminder requires admin, checks stale inputs, and persists one audit and both notification channels', async (t) => {
  const { app, incidentService, login, admin, create, rescue, setNow, assigned, resolve } = setup(t);
  const incident = create('Reminder fixture');
  const technician = assigned(incident);
  const server = http.createServer(app.handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((done) => server.close(done)));
  const base = `http://127.0.0.1:${server.address().port}/api/sla/rescue`;
  const action = `${base}/${incident.id}/remind`;
  const input = { target: 'response', technicianId: technician.id };
  const request = (url, role, body) => fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${login(role).token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  setNow(Date.parse(incident.sla.responseDeadline) - 1000);
  assert.equal((await fetch(base)).status, 401);
  for (const role of ['employee', 'network']) {
    assert.equal((await request(base, role)).status, 403);
    assert.equal((await request(action, role, input)).status, 403);
  }
  assert.equal((await request(action, 'admin', { ...input, technicianId: -1 })).status, 409);
  assert.equal((await request(action, 'admin', { ...input, target: 'resolution' })).status, 409);
  assert.equal(rescue(incident).canRemind, true);
  assert.deepEqual(await (await request(action, 'admin', input)).json(), { sent: true });
  assert.deepEqual(incidentService.remindForRescue(admin, incident.id, input), { sent: false });
  assert.equal(rescue(incident).canRemind, false);
  assert.equal(rescue(incident).reminderSent, true);
  for (const query of [
    "SELECT COUNT(*) FROM audit_events WHERE incident_id=:id AND action_type='SLA_RESCUE_REMINDER'",
    "SELECT COUNT(*) FROM notifications WHERE incident_id=:id AND type='SLA_RESCUE_REMINDER'",
    "SELECT COUNT(*) FROM simulated_emails WHERE incident_id=:id AND subject LIKE '%needs an SLA update'",
  ]) assert.equal(app.database.value(query, { id: incident.id }), 1);
  assert.equal(app.database.value('SELECT COUNT(*) FROM escalations WHERE incident_id=:id', { id: incident.id }), 0);
  resolve(incident, technician);
  assert.equal((await request(action, 'admin', input)).status, 409);
});
