'use strict';
/**
 * End-to-end smoke test that boots all services in-process and exercises
 * every activity: registration, login, RBAC, extinguisher CRUD, maintenance,
 * inspection scheduling + notification, and reporting.
 */
process.env.USER_PORT = '6001';
process.env.EXT_PORT = '6002';
process.env.INSP_PORT = '6003';
process.env.REPORT_PORT = '6004';
process.env.EXT_URL = 'http://localhost:6002';
process.env.INSP_URL = 'http://localhost:6003';

const userApp = require('../services/user-service/server');
const extApp = require('../services/extinguisher-service/server');
const inspApp = require('../services/inspection-service/server');
const reportApp = require('../services/reporting-service/server');

const BASE = {
  user: 'http://localhost:6001',
  ext: 'http://localhost:6002',
  insp: 'http://localhost:6003',
  report: 'http://localhost:6004',
};

let passed = 0; let failed = 0;
function assert(cond, label) {
  if (cond) { passed++; console.log(`  PASS  ${label}`); }
  else { failed++; console.error(`  FAIL  ${label}`); }
}

async function call(url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let body = null;
  try { body = await r.json(); } catch { /* no body */ }
  return { status: r.status, body };
}

async function run() {
  const servers = [
    (await userApp.bootstrap()).listen(6001), 
    (await extApp.bootstrap()).listen(6002),
    (await inspApp.bootstrap()).listen(6003), 
    (await reportApp.bootstrap()).listen(6004),
  ];
  await new Promise((r) => setTimeout(r, 1000)); // Give Mongoose time to connect


  console.log('\n=== Activity 2: User Management ===');
  // Register a new user
  const reg = await call(`${BASE.user}/api/auth/register`, {
    method: 'POST',
    body: { firstName: 'Jane', lastName: 'Doe', email: `jane${Date.now()}@tzw.rw`, password: 'Passw0rd1' },
  });
  assert(reg.status === 201, 'register new user -> 201');

  // Bad registration
  const badReg = await call(`${BASE.user}/api/auth/register`, {
    method: 'POST', body: { firstName: 'X', email: 'bad', password: '123' },
  });
  assert(badReg.status === 400, 'invalid registration -> 400');

  // Login as seeded admin
  const login = await call(`${BASE.user}/api/auth/login`, {
    method: 'POST', body: { email: 'admin@tzw.rw', password: 'Admin@123' },
  });
  assert(login.status === 200 && login.body.token, 'admin login -> token issued');
  const adminToken = login.body.token;
  const authH = { Authorization: `Bearer ${adminToken}` };

  // Profile
  const me = await call(`${BASE.user}/api/users/me`, { headers: authH });
  assert(me.status === 200 && me.body.user.role === 'Admin', 'get own profile (Admin)');

  // Create an Inspector via admin
  const inspEmail = `insp${Date.now()}@tzw.rw`;
  const mkInsp = await call(`${BASE.user}/api/users`, {
    method: 'POST', headers: authH,
    body: { firstName: 'Ian', lastName: 'Spector', email: inspEmail, password: 'Inspect1', role: 'Inspector' },
  });
  assert(mkInsp.status === 201 && mkInsp.body.user.role === 'Inspector', 'admin creates Inspector');

  const inspLogin = await call(`${BASE.user}/api/auth/login`, {
    method: 'POST', body: { email: inspEmail, password: 'Inspect1' },
  });
  const inspToken = inspLogin.body.token;
  const inspH = { Authorization: `Bearer ${inspToken}` };

  // RBAC: inspector cannot list users
  const forbidden = await call(`${BASE.user}/api/users`, { headers: inspH });
  assert(forbidden.status === 403, 'RBAC: Inspector blocked from admin route -> 403');

  console.log('\n=== Activity 3: Extinguisher Management ===');
  const serial = `EXT-${Date.now()}`;
  const create = await call(`${BASE.ext}/api/extinguishers`, {
    method: 'POST', headers: inspH,
    body: { serialNumber: serial, location: 'Building A', type: 'CO2', size: '5 lbs', installationDate: '2025-01-15', expiryDate: '2030-01-15' },
  });
  assert(create.status === 201, 'register extinguisher -> 201');
  const extId = create.body.extinguisher.id;

  const list = await call(`${BASE.ext}/api/extinguishers`, { headers: inspH });
  assert(list.status === 200 && list.body.count >= 1, 'list extinguishers');

  const view = await call(`${BASE.ext}/api/extinguishers/${extId}`, { headers: inspH });
  assert(view.status === 200 && view.body.extinguisher.serial_number === serial, 'view extinguisher by id');

  const upd = await call(`${BASE.ext}/api/extinguishers/${extId}`, {
    method: 'PUT', headers: inspH, body: { status: 'Needs Maintenance' },
  });
  assert(upd.status === 200 && upd.body.extinguisher.status === 'Needs Maintenance', 'update extinguisher');

  const maint = await call(`${BASE.ext}/api/extinguishers/${extId}/maintenance`, {
    method: 'POST', headers: inspH,
    body: { actionTaken: 'Refilled', actionDate: '2026-06-01', conditionsNoted: 'OK' },
  });
  assert(maint.status === 201, 'log maintenance -> 201');

  console.log('\n=== Activity 3f: Inspection Scheduling ===');
  const sched = await call(`${BASE.insp}/api/inspections`, {
    method: 'POST', headers: inspH,
    body: { extinguisherId: extId, scheduledAt: '2026-07-01T09:00:00Z', assignedTo: inspEmail },
  });
  assert(sched.status === 201 && sched.body.notification, 'schedule inspection + notify personnel');

  const inspList = await call(`${BASE.insp}/api/inspections`, { headers: inspH });
  assert(inspList.status === 200 && inspList.body.count >= 1, 'list inspections');

  console.log('\n=== Activity 4: Reporting ===');
  const daily = await call(`${BASE.report}/api/reports/daily`, { headers: authH });
  assert(daily.status === 200 && daily.body.extinguishers.totalInStock >= 1, 'daily report w/ stock count');
  assert(Array.isArray(daily.body.inspections.byStatus), 'report includes inspection status');

  const badPeriod = await call(`${BASE.report}/api/reports/weekly`, { headers: authH });
  assert(badPeriod.status === 400, 'invalid report period -> 400');

  // delete (admin)
  const del = await call(`${BASE.ext}/api/extinguishers/${extId}`, { method: 'DELETE', headers: authH });
  assert(del.status === 200, 'remove extinguisher (Admin)');

  console.log(`\n==== RESULTS: ${passed} passed, ${failed} failed ====\n`);
  servers.forEach((s) => s.close());
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((e) => { console.error(e); process.exit(1); });
