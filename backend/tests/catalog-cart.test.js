import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, stopApp, client, createProduct, createCoupon } from './helpers.js';

let app;
let mongod;
let product;

describe('catalog, cart, coupon', { timeout: 120_000 }, () => {
  before(async () => {
    ({ app, mongod } = await startApp());
    product = await createProduct({ pricePaisa: 1000000, stock: 10, name: 'Catalog Phone' });
    await createCoupon();
  });
  after(async () => {
    await stopApp(mongod);
  });

  it('lists published products', async () => {
    const api = client(app);
    const res = await api.get('/api/v1/products');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.items.length >= 1);
    assert.ok(res.body.data.items.every((p) => p.status === 'published'));
  });

  it('adds an item to the cart using server price', async () => {
    const api = client(app);
    await api.initCsrf();
    const res = await api.post('/api/v1/cart/items').send({
      productId: String(product._id),
      qty: 2,
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.items.length, 1);
    assert.equal(res.body.data.items[0].qty, 2);
    assert.equal(res.body.data.items[0].unitPricePaisa, 1000000);
    assert.equal(res.body.data.subtotalPaisa, 2000000);
  });

  it('validates SAVE10 coupon server-side', async () => {
    const api = client(app);
    await api.initCsrf();
    await api.post('/api/v1/cart/items').send({ productId: String(product._id), qty: 1 });
    const res = await api.post('/api/v1/cart/coupon').send({ code: 'save10' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.couponCode, 'SAVE10');
    assert.equal(res.body.data.discountPaisa, 100000);
  });
});
