import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { startApp, stopApp, client, createProduct } from './helpers.js';
import { signEsewaPayload } from '../src/services/esewaService.js';

let app;
let mongod;

async function checkoutReady(api, product) {
  await api.initCsrf();
  const email = `buyer${Date.now()}${Math.random().toString(16).slice(2)}@example.com`;
  await api.post('/api/v1/auth/register').send({
    name: 'Buyer',
    email,
    password: 'Customer#12345',
    phone: '9801111111',
  });
  const addr = await api.post('/api/v1/account/addresses').send({
    fullName: 'Buyer',
    phone: '9801111111',
    line1: 'Test Street 1',
    city: 'Kathmandu',
    country: 'Nepal',
    isDefault: true,
  });
  await api.post('/api/v1/cart/items').send({ productId: String(product._id), qty: 1 });
  return { addressId: addr.body.data._id, email };
}

describe('orders, inventory, payments', { timeout: 120_000 }, () => {
  before(async () => {
    ({ app, mongod } = await startApp());
  });
  after(async () => {
    await stopApp(mongod);
  });

  it('computes order total from DB prices and ignores client total', async () => {
    const product = await createProduct({ pricePaisa: 1000000, stock: 8 });
    const api = client(app);
    const { addressId } = await checkoutReady(api, product);
    const res = await api.post('/api/v1/orders').send({
      addressId,
      shippingMethod: 'standard',
      paymentMethod: 'esewa',
      totalPaisa: 1,
      items: [{ productId: String(product._id), qty: 1, unitPricePaisa: 1 }],
      status: 'paid',
    });
    assert.equal(res.status, 201);
    const order = res.body.data;
    assert.equal(order.subtotalPaisa, 1000000);
    assert.equal(order.shippingPaisa, 15000);
    assert.equal(order.totalPaisa, 1015000);
    assert.notEqual(order.totalPaisa, 1);
    assert.equal(order.status, 'payment_pending');
    assert.notEqual(order.status, 'paid');
  });

  it('reserves inventory on order create', async () => {
    const product = await createProduct({ pricePaisa: 800000, stock: 5, reservedStock: 0 });
    const api = client(app);
    const { addressId } = await checkoutReady(api, product);
    const res = await api.post('/api/v1/orders').send({
      addressId,
      shippingMethod: 'standard',
      paymentMethod: 'esewa',
    });
    assert.equal(res.status, 201);
    const { Product } = await import('../src/models/Product.js');
    const fresh = await Product.findById(product._id);
    assert.equal(fresh.stock, 5);
    assert.equal(fresh.reservedStock, 1);
  });

  it('rejects eSewa verification when gateway amount does not match order', async () => {
    const product = await createProduct({ pricePaisa: 2000000, stock: 4 });
    const api = client(app);
    const { addressId } = await checkoutReady(api, product);
    const created = await api.post('/api/v1/orders').send({
      addressId,
      shippingMethod: 'standard',
      paymentMethod: 'esewa',
    });
    assert.equal(created.status, 201);
    const orderId = created.body.data._id;
    const initiated = await api.post('/api/v1/payments/esewa/initiate').send({ orderId });
    assert.equal(initiated.status, 200);
    const uuid = initiated.body.data.fields.transaction_uuid;
    const payload = {
      transaction_code: '000TEST',
      status: 'COMPLETE',
      total_amount: initiated.body.data.fields.total_amount,
      transaction_uuid: uuid,
      product_code: 'EPAYTEST',
      signed_field_names: 'total_amount,transaction_uuid,product_code',
    };
    payload.signature = signEsewaPayload({
      totalAmount: payload.total_amount,
      transactionUuid: payload.transaction_uuid,
      productCode: payload.product_code,
    });
    const data = Buffer.from(JSON.stringify(payload)).toString('base64');

    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        status: 'COMPLETE',
        total_amount: '1.00',
        product_code: 'EPAYTEST',
        transaction_uuid: uuid,
        ref_id: 'MISMATCH',
      }),
    });
    try {
      const ret = await api.get(`/api/v1/payments/esewa/return?data=${encodeURIComponent(data)}`).redirects(0);
      assert.equal(ret.status, 302);
      assert.match(ret.headers.location, /status=failed/);
    } finally {
      global.fetch = originalFetch;
    }
    const { Order } = await import('../src/models/Order.js');
    const order = await Order.findById(orderId);
    assert.notEqual(order.status, 'paid');
    assert.notEqual(order.status, 'confirmed');
    assert.equal(order.status, 'payment_failed');
  });

  it('places a cash-on-delivery order without a gateway', async () => {
    const product = await createProduct({ pricePaisa: 900000, stock: 6, reservedStock: 0 });
    const api = client(app);
    const { addressId } = await checkoutReady(api, product);
    const res = await api.post('/api/v1/orders').send({
      addressId,
      shippingMethod: 'standard',
      paymentMethod: 'cod',
    });
    assert.equal(res.status, 201, res.body?.error?.message);
    const order = res.body.data;
    assert.equal(order.status, 'confirmed');
    assert.equal(order.payment.method, 'cod');
    assert.equal(order.payment.status, 'pending');
    assert.notEqual(order.status, 'payment_pending');

    const cart = await api.get('/api/v1/cart');
    assert.equal(cart.status, 200);
    assert.equal((cart.body.data.items || []).length, 0);

    const { Product } = await import('../src/models/Product.js');
    const fresh = await Product.findById(product._id);
    assert.equal(fresh.stock, 5);
    assert.equal(fresh.reservedStock, 0);
  });

  it('lets admin attach shipment tracking that customers and guests can read', async () => {
    const { User } = await import('../src/models/User.js');
    const { env } = await import('../src/config/env.js');
    const product = await createProduct({ pricePaisa: 800000, stock: 4, reservedStock: 0 });
    const buyer = client(app);
    const { addressId, email } = await checkoutReady(buyer, product);
    const placed = await buyer.post('/api/v1/orders').send({
      addressId,
      shippingMethod: 'standard',
      paymentMethod: 'cod',
    });
    assert.equal(placed.status, 201, placed.body?.error?.message);
    const orderId = placed.body.data._id;
    const orderNumber = placed.body.data.orderNumber;

    const adminEmail = `shipadmin${Date.now()}@electropoint.com`;
    await User.create({
      name: 'Ship Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 12),
      role: 'superadmin',
      status: 'active',
    });
    const admin = client(app);
    await admin.initCsrf();
    const login = await admin.post('/api/v1/auth/admin/login').send({
      email: adminEmail,
      password: env.ADMIN_PASSWORD,
    });
    assert.equal(login.status, 200, login.body?.error?.message);

    const eta = '2026-08-22';
    const patched = await admin.patch(`/api/v1/admin/orders/${orderId}/status`).send({
      status: 'shipped',
      note: 'Handed to Pathao from Kathmandu hub',
      tracking: {
        carrier: 'Pathao',
        trackingNumber: 'PTH-88221',
        trackingUrl: 'https://pathao.com/track/PTH-88221',
        estimatedDelivery: eta,
        lastLocation: 'Kathmandu hub',
      },
    });
    assert.equal(patched.status, 200, patched.body?.error?.message);
    assert.equal(patched.body.data.status, 'shipped');
    assert.equal(patched.body.data.tracking.trackingNumber, 'PTH-88221');
    assert.equal(patched.body.data.tracking.carrier, 'Pathao');

    const mine = await buyer.get(`/api/v1/orders/${orderId}`);
    assert.equal(mine.status, 200);
    assert.equal(mine.body.data.status, 'shipped');
    assert.equal(mine.body.data.tracking.trackingNumber, 'PTH-88221');
    assert.ok((mine.body.data.timeline || []).some((t) => t.note === 'Handed to Pathao from Kathmandu hub'));

    const guest = client(app);
    await guest.initCsrf();
    const tracked = await guest.post('/api/v1/orders/track').send({ orderNumber, email });
    assert.equal(tracked.status, 200, tracked.body?.error?.message);
    assert.equal(tracked.body.data.orderNumber, orderNumber);
    assert.equal(tracked.body.data.tracking.carrier, 'Pathao');
    assert.equal(tracked.body.data.payment.method, 'cod');
    assert.equal(tracked.body.data.user, undefined);

    const miss = await guest.post('/api/v1/orders/track').send({ orderNumber, email: 'other@example.com' });
    assert.equal(miss.status, 404);
  });
});
