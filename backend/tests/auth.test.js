import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { startApp, stopApp, client, createProduct } from './helpers.js';

let app;
let mongod;

describe('auth and admin authorization', { timeout: 120_000 }, () => {
  before(async () => {
    ({ app, mongod } = await startApp());
  });
  after(async () => {
    await stopApp(mongod);
  });

  it('registers and logs in a customer', async () => {
    const api = client(app);
    await api.initCsrf();
    const email = `user${Date.now()}@example.com`;
    const register = await api.post('/api/v1/auth/register').send({
      name: 'Test User',
      email,
      password: 'Customer#12345',
      phone: '9800000000',
    });
    assert.equal(register.status, 201);
    assert.equal(register.body.success, true);
    assert.equal(register.body.data.user.role, 'customer');
    assert.ok(register.headers['set-cookie'].some((c) => c.startsWith('ep_access=')));

    const me = await api.get('/api/v1/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, email);

    const api2 = client(app);
    await api2.initCsrf();
    const login = await api2.post('/api/v1/auth/login').send({ email, password: 'Customer#12345' });
    assert.equal(login.status, 200);
    assert.equal(login.body.data.user.email, email);
  });

  it('forbids customer from admin APIs', async () => {
    const api = client(app);
    await api.initCsrf();
    const email = `cust${Date.now()}@example.com`;
    await api.post('/api/v1/auth/register').send({
      name: 'Customer',
      email,
      password: 'Customer#12345',
    });
    const res = await api.get('/api/v1/admin/analytics');
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN');
  });

  it('allows superadmin into admin analytics', async () => {
    const { User } = await import('../src/models/User.js');
    const { env } = await import('../src/config/env.js');
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    await User.create({
      name: 'Admin',
      email: `admin${Date.now()}@electropoint.com`,
      passwordHash,
      role: 'superadmin',
      status: 'active',
    });
    const api = client(app);
    await api.initCsrf();
    const login = await api.post('/api/v1/auth/login').send({
      email: (await User.findOne({ role: 'superadmin' })).email,
      password: env.ADMIN_PASSWORD,
    });
    assert.equal(login.status, 200);
    assert.equal(login.body.data.user.role, 'superadmin');
    const analytics = await api.get('/api/v1/admin/analytics');
    assert.equal(analytics.status, 200);
    assert.equal(typeof analytics.body.data.revenuePaisa, 'number');
    assert.ok(Array.isArray(analytics.body.data.topProducts));
  });
});
