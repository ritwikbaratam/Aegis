import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createApplication } from '../backend/src/server.js';

const { chromium } = await import(process.env.AEGIS_PLAYWRIGHT_MODULE ?? 'playwright-core');
let now = Date.now();
const app = createApplication({ databasePath: ':memory:', clock: () => new Date(now) });
const server = http.createServer(app.handler);
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const url = `http://127.0.0.1:${server.address().port}`;
const errors = [];
const screenshots = process.env.AEGIS_SCREENSHOTS_DIR;
let browser;

async function capture(page, filename) {
  if (!screenshots) return;
  await mkdir(screenshots, { recursive: true });
  await page.screenshot({ path: path.join(screenshots, filename), animations: 'disabled', style: '.toast-region { visibility: hidden }' });
}

async function signIn(page, email, password) {
  await page.goto(url + '/#/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in to AEGIS' }).click();
  await page.waitForURL('**/#/dashboard');
  await page.locator('.metric').first().waitFor();
}

async function perform(page, action, values = {}) {
  await page.locator(`[data-operation="${action}"]`).click();
  const dialog = page.getByRole('dialog');
  for (const [name, value] of Object.entries(values)) {
    const control = dialog.locator(`[name="${name}"]`);
    if (await control.evaluate((element) => element.tagName === 'SELECT')) await control.selectOption(value);
    else await control.fill(value);
  }
  await dialog.locator('button[type=submit]').click();
  await dialog.waitFor({ state: 'hidden' });
}

try {
  browser = await chromium.launch({
    ...(process.env.AEGIS_BROWSER_PATH ? { executablePath: process.env.AEGIS_BROWSER_PATH } : { channel: 'msedge' }),
  });
  const newPage = async (options) => {
    const page = await (await browser.newContext(options)).newPage();
    page.setDefaultTimeout(12_000);
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`);
    });
    return page;
  };

  const employee = await newPage();
  await signIn(employee, 'employee@aegis.local', 'Employee@12345');
  await employee.goto(url + '/#/incidents/new');
  await employee.getByLabel('Short incident title').fill('Payment application unavailable');
  await employee.getByLabel('Detailed description').fill('Payment transactions are failing for students and staff. The payment application is unavailable.');
  await employee.getByRole('button', { name: 'Suggest category' }).click();
  await employee.locator('#category-suggestion').getByText(/Software\/Application/).waitFor();
  await employee.getByLabel('Affected IT service').selectOption({ label: 'Payment Application' });
  await employee.getByLabel('Impact', { exact: true }).selectOption('3');
  await employee.getByLabel('Urgency', { exact: true }).selectOption('3');
  await employee.getByLabel('Affected users').fill('650');
  await employee.locator('[name=relatedIncidentId]').first().check();
  await employee.getByRole('button', { name: /Create incident/ }).click();
  await employee.waitForURL(/#\/incidents\/\d+$/);
  const detail = employee.url();
  await employee.getByText('Why this priority?').waitFor();
  await employee.locator('.incident-hero').getByText('P1', { exact: true }).waitFor();
  await capture(employee, 'incident-detail.png');
  await employee.getByRole('tab', { name: 'Related & knowledge' }).click();
  await employee.getByText(/Similarity \d+%/).waitFor();
  await employee.getByRole('tab', { name: 'Activity timeline' }).click();
  await employee.getByText('Reporter linked a potential duplicate.').waitFor();
  const createdIncidentCode = await employee.locator('.incident-id').textContent();
  await employee.goto(url + '/#/notifications');
  const createdNotice = employee.getByRole('button', { name: new RegExp(`${createdIncidentCode} was created`) });
  await createdNotice.click();
  await employee.waitForURL(detail);
  console.log('PASS browser workflow 1: critical report, category, duplicate link, assignment and audit');

  const tech = await newPage();
  await signIn(tech, 'jamie.apps@aegis.local', 'Technician@12345');
  await tech.goto(detail);
  await perform(tech, 'acknowledge');
  await perform(tech, 'start-investigation');
  await tech.getByRole('tab', { name: 'Investigation' }).click();
  await tech.getByLabel('Add investigation note').fill('Confirmed a simulated payment worker outage.');
  await tech.getByRole('button', { name: 'Add note' }).click();
  await tech.getByText('Confirmed a simulated payment worker outage.', { exact: true }).waitFor();
  await perform(tech, 'request-information', { message: 'When did you first notice the outage?' });
  await employee.reload();
  await employee.getByRole('tab', { name: 'Investigation' }).click();
  await employee.getByLabel('Reply to information request').fill('We first noticed it at 9 AM.');
  await employee.getByRole('button', { name: 'Send reply' }).click();
  await employee.getByText('We first noticed it at 9 AM.', { exact: true }).waitFor();
  await tech.reload();
  await perform(tech, 'resolve', { resolution: 'Restored the payment worker and verified a successful transaction.' });
  await employee.reload();
  await perform(employee, 'verify', { note: 'Payments are working again.' });
  await perform(employee, 'close');
  await perform(employee, 'feedback', { rating: '5', comment: 'Quick response and clear communication.' });
  await employee.locator('.incident-hero').getByText('CLOSED', { exact: true }).waitFor();
  console.log('PASS browser workflow 2: acknowledgement, investigation, information request, reply, resolution, verification, closure and feedback');

  const admin = await newPage();
  await signIn(admin, 'admin@aegis.local', 'Admin@12345');
  await capture(admin, 'admin-dashboard.png');
  await admin.goto(url + '/#/admin/sla');
  const p1 = admin.locator('[data-priority="P1"]');
  await p1.getByLabel('Response minutes').fill('6');
  await p1.getByRole('button', { name: 'Save P1' }).click();
  await admin.getByText('SLA policy saved.', { exact: true }).waitFor();
  await admin.goto(url + '/#/admin/technicians');
  const jamie = admin.getByRole('row', { name: /Jamie Chen/ });
  await jamie.getByRole('button', { name: 'Edit' }).click();
  await admin.getByRole('dialog').locator('[name=capacity]').fill('7');
  await admin.getByRole('button', { name: 'Save changes' }).click();
  await admin.getByRole('row', { name: /Jamie Chen.*7/ }).waitFor();
  await admin.goto(url + '/#/admin/assignment');
  await admin.getByLabel('Strategy', { exact: true }).selectOption('LEAST_LOADED');
  await admin.getByRole('button', { name: 'Save strategy' }).click();
  await admin.getByText('Assignment strategy saved.', { exact: true }).waitFor();
  await admin.goto(url + '/#/admin/escalations');
  await admin.locator('tbody tr').first().waitFor();
  await admin.goto(url + '/#/admin/email-outbox');
  await admin.locator('tbody tr').first().waitFor();
  await admin.getByRole('button', { name: 'View message' }).first().click();
  await admin.getByRole('dialog').getByText(/^To /).waitFor();
  await admin.getByRole('button', { name: 'Close dialog' }).click();
  await admin.goto(url + '/#/reports');
  await admin.getByRole('heading', { name: 'Service analysis' }).waitFor();
  await admin.getByLabel('Category', { exact: true }).selectOption({ label: 'Software/Application' });
  await admin.getByRole('button', { name: 'Apply filters' }).click();
  await admin.waitForURL(/category=4/);
  await admin.locator('.metric-value').first().getByText('2', { exact: true }).waitFor();
  const download = admin.waitForEvent('download');
  await admin.getByRole('button', { name: /Export incident CSV/ }).click();
  assert.match((await download).suggestedFilename(), /^aegis-incidents-.*\.csv$/);
  console.log('PASS browser workflow 3: SLA policy, technician settings, strategy, escalations, email, reports and CSV');

  const { auth, incidentService } = app.services;
  const reporter = auth.login('admin@aegis.local', 'Admin@12345').user;
  const createPaymentIncident = (title) => incidentService.create(reporter, {
    title, description: 'Payment application is not processing test transactions.',
    serviceId: 1, categoryId: 4, impact: 3, urgency: 3, affectedUsers: 650,
  }).incident;
  const owned = createPaymentIncident('Administrator verification fixture');
  const assignee = auth.login(owned.assignedTechnician.email, 'Technician@12345').user;
  incidentService.acknowledge(assignee, owned.id);
  incidentService.startInvestigation(assignee, owned.id);
  incidentService.resolve(assignee, owned.id, { resolution: 'Restored the test payment application.' });
  await admin.goto(`${url}/#/incidents/${owned.id}`);
  await perform(admin, 'verify', { note: 'Confirmed as the reporter.' });
  await perform(admin, 'close');
  await admin.locator('.incident-hero').getByText('CLOSED', { exact: true }).waitFor();
  console.log('PASS browser regression: original administrator reporter can verify and close');

  const atRisk = createPaymentIncident('SLA at-risk filter fixture');
  now = Date.parse(atRisk.sla.responseDeadline) - 1000;
  createPaymentIncident('SLA on-track filter fixture');
  await admin.goto(url + '/#/incidents');
  await admin.locator('tr[data-incident-link]').first().waitFor();
  const slaFilter = admin.locator('#filter-sla');
  const search = admin.getByRole('button', { name: 'Search', exact: true });
  for (const [value, label] of [
    ['ON_TRACK', 'On track'], ['MET', 'Met'], ['AT_RISK', 'At risk'],
    ['BREACHED', 'Breached'], ['', 'Any SLA status'],
  ]) {
    const expected = incidentService.list(reporter, { slaStatus: value }).items.map(({ id }) => id);
    assert.ok(expected.length > 0, `expected seeded results for ${label}`);
    assert.deepEqual(await slaFilter.selectOption({ label }), [value]);
    await search.click();
    await admin.waitForURL((current) => (new URLSearchParams(current.hash.split('?')[1]).get('slaStatus') ?? '') === value);
    await admin.waitForFunction((ids) => {
      const actual = [...document.querySelectorAll('tr[data-incident-link]')].map((row) => Number(row.dataset.incidentLink));
      return JSON.stringify(actual) === JSON.stringify(ids);
    }, expected);
    assert.equal(await slaFilter.inputValue(), value);
  }
  await slaFilter.selectOption('AT_RISK');
  await admin.locator('#incident-search').fill('no incident has this Phase 2 test title');
  await search.click();
  await admin.getByRole('heading', { name: 'No incidents match these filters' }).waitFor();
  console.log('PASS browser regression: all four SLA states, unfiltered results and empty results');

  const mobile = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await signIn(mobile, 'employee@aegis.local', 'Employee@12345');
  await mobile.getByRole('button', { name: 'Open navigation' }).click();
  await mobile.locator('.sidebar').getByRole('link', { name: 'Incidents', exact: true }).click();
  await mobile.getByRole('heading', { name: 'Incident register' }).waitFor();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'mobile register should not overflow the viewport');
  assert.deepEqual(errors, []);
  console.log('PASS mobile navigation and browser error checks');
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  app.close();
}
