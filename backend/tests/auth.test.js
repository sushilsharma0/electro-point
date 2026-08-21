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

  it('registers a new email while merging a guest cart', async () => {
    const product = await createProduct({ pricePaisa: 1000000, stock: 5, name: 'Register Cart Phone' });
    const api = client(app);
    await api.initCsrf();
    const added = await api.post('/api/v1/cart/items').send({
      productId: String(product._id),
      qty: 1,
    });
    assert.equal(added.status, 201);
    assert.equal(added.body.data.items.length, 1);

    const email = `guestcart${Date.now()}@example.com`;
    const register = await api.post('/api/v1/auth/register').send({
      name: 'Guest Cart User',
      email,
      password: 'Customer#12345',
      phone: '9800000001',
    });
    assert.equal(register.status, 201, register.body?.error?.message);
    assert.equal(register.body.data.user.email, email);

    const cart = await api.get('/api/v1/cart');
    assert.equal(cart.status, 200);
    assert.equal(cart.body.data.items.length, 1);
    assert.equal(String(cart.body.data.items[0].productId || cart.body.data.items[0].product), String(product._id));
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
    assert.equal(register.body.data.user.phone, '9800000000');
    assert.equal(register.body.data.user.countryCode, '977');
    assert.ok(register.headers['set-cookie'].some((c) => c.startsWith('ep_access=')));

    const me = await api.get('/api/v1/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, email);

    const api2 = client(app);
    await api2.initCsrf();
    const login = await api2.post('/api/v1/auth/login').send({ email, password: 'Customer#12345' });
    assert.equal(login.status, 200);
    assert.equal(login.body.data.user.email, email);

    const api3 = client(app);
    await api3.initCsrf();
    const phoneLogin = await api3.post('/api/v1/auth/login').send({
      identifier: '+977 9800000000',
      password: 'Customer#12345',
    });
    assert.equal(phoneLogin.status, 200, phoneLogin.body?.error?.message);
    assert.equal(phoneLogin.body.data.user.email, email);

    const api4 = client(app);
    await api4.initCsrf();
    const localLogin = await api4.post('/api/v1/auth/login').send({
      identifier: '9800000000',
      password: 'Customer#12345',
    });
    assert.equal(localLogin.status, 200, localLogin.body?.error?.message);
    assert.equal(localLogin.body.data.user.email, email);
  });

  it('rejects a country code that is not enabled', async () => {
    const api = client(app);
    await api.initCsrf();
    const res = await api.post('/api/v1/auth/register').send({
      name: 'Other Code',
      email: `other${Date.now()}@example.com`,
      password: 'Customer#12345',
      phone: '9800000099',
      countryCode: '91',
    });
    assert.equal(res.status, 400);
  });

  it('requires name, email, mobile number, and password to register', async () => {
    const api = client(app);
    await api.initCsrf();
    const res = await api.post('/api/v1/auth/register').send({
      name: 'No Phone',
      email: `nophone${Date.now()}@example.com`,
      password: 'Customer#12345',
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('forbids customer from admin APIs', async () => {
    const api = client(app);
    await api.initCsrf();
    const email = `cust${Date.now()}@example.com`;
    await api.post('/api/v1/auth/register').send({
      name: 'Customer',
      email,
      password: 'Customer#12345',
      phone: '9800000002',
    });
    const res = await api.get('/api/v1/admin/analytics');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('keeps admin login off the customer storefront session', async () => {
    const { User } = await import('../src/models/User.js');
    const { env } = await import('../src/config/env.js');
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    const email = `admin${Date.now()}@electropoint.com`;
    await User.create({
      name: 'Admin',
      email,
      passwordHash,
      role: 'superadmin',
      status: 'active',
    });

    const store = client(app);
    await store.initCsrf();
    const customerLogin = await store.post('/api/v1/auth/login').send({
      email,
      password: env.ADMIN_PASSWORD,
    });
    assert.equal(customerLogin.status, 403);
    assert.equal(customerLogin.body.error.code, 'FORBIDDEN');

    const admin = client(app);
    await admin.initCsrf();
    const login = await admin.post('/api/v1/auth/admin/login').send({
      email,
      password: env.ADMIN_PASSWORD,
    });
    assert.equal(login.status, 200);
    assert.equal(login.body.data.user.role, 'superadmin');
    const cookies = login.headers['set-cookie'] || [];
    assert.ok(cookies.some((c) => c.startsWith('ep_admin_access=')));
    assert.equal(cookies.some((c) => c.startsWith('ep_access=')), false);

    const storefrontMe = await admin.get('/api/v1/auth/me');
    assert.equal(storefrontMe.status, 200);
    assert.equal(storefrontMe.body.data.user, null);

    const adminMe = await admin.get('/api/v1/auth/admin/me');
    assert.equal(adminMe.status, 200);
    assert.equal(adminMe.body.data.user.email, email);

    const analytics = await admin.get('/api/v1/admin/analytics');
    assert.equal(analytics.status, 200);
    assert.equal(typeof analytics.body.data.revenuePaisa, 'number');
    assert.ok(Array.isArray(analytics.body.data.topProducts));
  });

  it('rejects forgot-password when SMTP is not configured', async () => {
    const api = client(app);
    await api.initCsrf();
    const res = await api.post('/api/v1/auth/forgot-password').send({ email: 'anyone@example.com' });
    assert.equal(res.status, 503);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAVAILABLE');
    assert.match(res.body.error.message, /SMTP/i);
  });
});
