import mongoose from 'mongoose';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-32chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-32chars!';
process.env.COOKIE_SECRET = 'test-cookie-secret-key-32chars!!';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.BACKEND_URL = 'http://localhost:5000';
process.env.ESEWA_PRODUCT_CODE = 'EPAYTEST';
process.env.ESEWA_SECRET = '8gBm/:&EnhH.1/q';
process.env.ESEWA_ENV = 'uat';
process.env.KHALTI_SECRET_KEY = 'test_khalti_secret';
process.env.KHALTI_ENV = 'sandbox';
process.env.ADMIN_EMAIL = 'ivan.p@example.net';
process.env.ADMIN_PASSWORD = 'ElectroPoint#Admin1';
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = `mongodb://127.0.0.1:27017/electropoint_test_${process.pid}`;
}

function mergeCookies(existing, setCookie) {
  const map = new Map();
  for (const c of existing) {
    const name = c.split('=')[0];
    map.set(name, c.split(';')[0]);
  }
  for (const header of setCookie || []) {
    const pair = header.split(';')[0];
    map.set(pair.split('=')[0], pair);
  }
  return [...map.values()];
}

export async function startApp() {
  let mongod;
  if (process.env.MONGO_MEMORY === '1') {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();
  }
  const { connectDb } = await import('../src/config/db.js');
  const { createApp } = await import('../src/app.js');
  const { StoreSettings } = await import('../src/models/StoreSettings.js');
  await connectDb();
  if (!String(mongoose.connection.name || '').startsWith('electropoint_test')) {
    throw new Error(`Refusing to run tests against database "${mongoose.connection.name}"`);
  }
  await mongoose.connection.dropDatabase();
  await StoreSettings.findOneAndUpdate(
    { key: 'store' },
    {
      key: 'store',
      storeName: 'ElectroPoint',
      shipping: [
        { code: 'standard', name: 'Standard delivery', pricePaisa: 15000, eta: '3–5 days' },
        { code: 'express', name: 'Express', pricePaisa: 35000, eta: '1–2 days' },
      ],
      countryCodes: [{ dial: '977', label: 'Nepal', iso: 'NP' }],
      taxPercent: 0,
      payments: { esewaEnabled: true, khaltiEnabled: true, esewaProductCode: 'EPAYTEST' },
    },
    { upsert: true, new: true },
  );
  return { app: createApp(), mongod };
}

export async function stopApp(mongod) {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

export function client(app) {
  let cookies = [];
  let csrf = '';

  const wrap = (method, url) => {
    const req = request(app)[method](url);
    if (cookies.length) req.set('Cookie', cookies.join('; '));
    if (csrf && ['post', 'put', 'patch', 'delete'].includes(method)) {
      req.set('X-CSRF-Token', csrf);
    }
    const origThen = req.then.bind(req);
    req.then = (resolve, reject) =>
      origThen.call(req, (res) => {
        cookies = mergeCookies(cookies, res.headers['set-cookie']);
        if (res.body?.data?.csrfToken) csrf = res.body.data.csrfToken;
        return resolve(res);
      }, reject);
    return req;
  };

  return {
    get: (url) => wrap('get', url),
    post: (url) => wrap('post', url),
    put: (url) => wrap('put', url),
    patch: (url) => wrap('patch', url),
    delete: (url) => wrap('delete', url),
    async initCsrf() {
      const res = await wrap('get', '/api/v1/csrf');
      csrf = res.body.data.csrfToken;
      return csrf;
    },
    getCsrf: () => csrf,
  };
}

export async function createCategory() {
  const { Category } = await import('../src/models/Category.js');
  return Category.create({
    name: 'Smartphones',
    slug: `smartphones-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    isActive: true,
    displayOrder: 1,
  });
}

export async function createProduct(overrides = {}) {
  const { Product } = await import('../src/models/Product.js');
  const category = overrides.category || (await createCategory())._id;
  return Product.create({
    name: 'Test Phone',
    slug: `test-phone-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    brand: 'Apex',
    sku: `SKU-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    category,
    shortDescription: 'Test phone',
    description: 'A test product',
    pricePaisa: 1000000,
    salePricePaisa: null,
    stock: 10,
    reservedStock: 0,
    lowStockThreshold: 2,
    thumbnail: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
    images: [{ url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9', alt: 'phone', isPrimary: true, sort: 0 }],
    status: 'published',
    flags: { isFeatured: true, isBestSeller: false, isNewArrival: false, isOnSale: false },
    ...overrides,
    category,
  });
}

export async function createCoupon() {
  const { Coupon } = await import('../src/models/Coupon.js');
  return Coupon.create({
    code: 'SAVE10',
    type: 'percent',
    value: 10,
    minOrderPaisa: 500000,
    isActive: true,
    startsAt: new Date(Date.now() - 1000),
    expiresAt: new Date(Date.now() + 86400000 * 30),
  });
}
