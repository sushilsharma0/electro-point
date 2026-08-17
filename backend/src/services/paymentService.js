import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Coupon } from '../models/Coupon.js';
import { Cart } from '../models/Cart.js';
import { ApiError } from '../utils/ApiError.js';
import { paisaToNprString } from '../utils/money.js';
import * as inventory from './inventoryService.js';
import * as esewa from './esewaService.js';
import * as khalti from './khaltiService.js';
import { getStoreSettings } from './pricingService.js';
import { notify } from './notificationService.js';

const OPEN_STATUSES = new Set(['pending', 'payment_pending']);

async function fulfillPaidOrder(order, payment, gatewayMeta = {}) {
  if (payment.status === 'completed' && (order.inventoryCommitted || ['paid', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status))) {
    return { order, payment, alreadyPaid: true };
  }

  if (!OPEN_STATUSES.has(order.status)) {
    throw ApiError.conflict(`Order cannot be paid from status ${order.status}`);
  }

  await inventory.commitForOrder(order);

  order.status = 'paid';
  order.payment = {
    ...(order.payment?.toObject?.() || order.payment || {}),
    method: payment.method,
    status: 'completed',
    gatewayIds: { ...(order.payment?.gatewayIds || {}), ...gatewayMeta },
  };
  order.timeline.push({ status: 'paid', at: new Date(), note: 'Payment verified with gateway' });

  const settings = await getStoreSettings();
  if (settings.order?.autoConfirmOnPaid !== false) {
    order.status = 'confirmed';
    order.timeline.push({ status: 'confirmed', at: new Date(), note: 'Order confirmed' });
  }

  payment.status = 'completed';
  payment.verifiedAt = new Date();
  payment.rawLookup = gatewayMeta.raw || payment.rawLookup;
  if (gatewayMeta.gatewayTxnId) payment.gatewayTxnId = gatewayMeta.gatewayTxnId;

  if (order.couponCode) {
    await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
  }
  await Cart.updateOne({ user: order.user }, { $set: { items: [], couponCode: '' } });

  await payment.save();
  await order.save();
  await notify({
    user: order.user,
    type: 'order_paid',
    title: 'Payment received',
    body: `Order ${order.orderNumber} is confirmed.`,
    link: `/account/orders/${order._id}`,
  });
  return { order, payment, alreadyPaid: false };
}

async function failOrder(order, payment, { status = 'failed', note } = {}) {
  if (OPEN_STATUSES.has(order.status) && !order.inventoryReleased) {
    await inventory.releaseForOrder(order, { reason: note || 'Payment failed' });
    order.status = 'payment_failed';
    order.timeline.push({ status: 'payment_failed', at: new Date(), note: note || 'Payment failed' });
    order.payment = {
      ...(order.payment?.toObject?.() || order.payment || {}),
      status: 'failed',
    };
    await order.save();
  }
  if (payment && payment.status !== 'completed') {
    payment.status = status;
    await payment.save();
  }
  return { order, payment };
}

export async function initiateEsewa({ order, user }) {
  const settings = await getStoreSettings();
  if (!settings.payments?.esewaEnabled) throw ApiError.unprocessable('eSewa is disabled');
  if (String(order.user) !== String(user._id) && user.role !== 'superadmin') {
    throw ApiError.forbidden();
  }
  if (!OPEN_STATUSES.has(order.status)) throw ApiError.conflict('Order is not awaiting payment');

  const transactionUuid = `${order.orderNumber}-${crypto.randomBytes(4).toString('hex')}`;
  const payment = await Payment.create({
    order: order._id,
    user: user._id,
    method: 'esewa',
    amountPaisa: order.totalPaisa,
    status: 'initiated',
    gateway: 'esewa-epay-v2',
    transactionUuid,
  });

  order.status = 'payment_pending';
  order.payment = {
    method: 'esewa',
    status: 'pending',
    gatewayIds: { transactionUuid, paymentId: String(payment._id) },
  };
  await order.save();

  const successUrl = `${env.BACKEND_URL}/api/v1/payments/esewa/return`;
  const failureUrl = `${env.BACKEND_URL}/api/v1/payments/esewa/return?failure=1&oid=${order._id}`;
  const fields = esewa.buildEsewaFormFields({
    amountPaisa: order.totalPaisa,
    transactionUuid,
    successUrl,
    failureUrl,
  });

  return {
    formUrl: esewa.esewaFormUrl(),
    fields,
    paymentId: String(payment._id),
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    amountPaisa: order.totalPaisa,
  };
}

export async function handleEsewaReturn({ data, failure, oid }) {
  const frontend = (path) => `${env.FRONTEND_URL}${path}`;

  if (failure) {
    if (oid) {
      const order = await Order.findById(oid);
      const payment = order
        ? await Payment.findOne({ order: order._id, method: 'esewa' }).sort({ createdAt: -1 })
        : null;
      if (order) await failOrder(order, payment, { status: 'cancelled', note: 'Customer cancelled eSewa payment' });
    }
    return { redirect: frontend('/payments/esewa/return?status=cancelled') };
  }

  const payload = esewa.decodeEsewaData(data);
  if (!esewa.verifyEsewaSignature(payload)) {
    return { redirect: frontend('/payments/esewa/return?status=failed&reason=signature') };
  }

  const payment = await Payment.findOne({ transactionUuid: payload.transaction_uuid }).sort({ createdAt: -1 });
  if (!payment) {
    return { redirect: frontend('/payments/esewa/return?status=failed&reason=unknown') };
  }
  const order = await Order.findById(payment.order);
  if (!order) {
    return { redirect: frontend('/payments/esewa/return?status=failed&reason=order') };
  }

  if (payment.status === 'completed') {
    return { redirect: frontend(`/payments/esewa/return?status=success&orderId=${order._id}`) };
  }

  let statusPayload;
  try {
    statusPayload = await esewa.fetchEsewaStatus({
      productCode: env.ESEWA_PRODUCT_CODE,
      totalAmount: paisaToNprString(order.totalPaisa),
      transactionUuid: payload.transaction_uuid,
    });
  } catch {
    return { redirect: frontend(`/payments/esewa/return?status=pending&orderId=${order._id}`) };
  }

  payment.rawLookup = statusPayload;

  const productCode = statusPayload.product_code || payload.product_code;
  const complete = esewa.esewaStatusIsComplete(statusPayload.status);
  const amountOk = esewa.esewaAmountMatches(statusPayload, order.totalPaisa);
  const codeOk = String(productCode) === String(env.ESEWA_PRODUCT_CODE);

  if (!complete || !amountOk || !codeOk) {
    await failOrder(order, payment, {
      status: 'failed',
      note: `eSewa verification failed (status=${statusPayload.status}, amountMatch=${amountOk}, codeMatch=${codeOk})`,
    });
    return { redirect: frontend(`/payments/esewa/return?status=failed&orderId=${order._id}`) };
  }

  await fulfillPaidOrder(order, payment, {
    gatewayTxnId: statusPayload.ref_id || statusPayload.transaction_code || payload.transaction_code,
    raw: statusPayload,
    transactionUuid: payload.transaction_uuid,
  });
  return { redirect: frontend(`/payments/esewa/return?status=success&orderId=${order._id}`) };
}

export async function initiateKhalti({ order, user }) {
  const settings = await getStoreSettings();
  if (!settings.payments?.khaltiEnabled) throw ApiError.unprocessable('Khalti is disabled');
  if (String(order.user) !== String(user._id) && user.role !== 'superadmin') {
    throw ApiError.forbidden();
  }
  if (!OPEN_STATUSES.has(order.status)) throw ApiError.conflict('Order is not awaiting payment');

  const returnUrl = `${env.BACKEND_URL}/api/v1/payments/khalti/return`;
  const initiated = await khalti.initiateKhaltiPayment({
    return_url: returnUrl,
    website_url: env.FRONTEND_URL,
    amount: order.totalPaisa,
    purchase_order_id: String(order._id),
    purchase_order_name: `ElectroPoint ${order.orderNumber}`,
    customer_info: {
      name: user.name,
      email: order.email,
      phone: order.phone,
    },
  });

  const payment = await Payment.create({
    order: order._id,
    user: user._id,
    method: 'khalti',
    amountPaisa: order.totalPaisa,
    status: 'initiated',
    gateway: 'khalti-kpg-2',
    pidx: initiated.pidx,
    rawLookup: { initiate: { pidx: initiated.pidx } },
  });

  order.status = 'payment_pending';
  order.payment = {
    method: 'khalti',
    status: 'pending',
    gatewayIds: { pidx: initiated.pidx, paymentId: String(payment._id) },
  };
  await order.save();

  return {
    paymentUrl: initiated.payment_url,
    pidx: initiated.pidx,
    paymentId: String(payment._id),
    orderId: String(order._id),
    amountPaisa: order.totalPaisa,
  };
}

export async function handleKhaltiReturn(query) {
  const frontend = (path) => `${env.FRONTEND_URL}${path}`;
  const pidx = query.pidx;
  if (!pidx) {
    return { redirect: frontend('/payments/khalti/return?status=failed&reason=missing_pidx') };
  }

  const payment = await Payment.findOne({ pidx }).sort({ createdAt: -1 });
  if (!payment) {
    return { redirect: frontend('/payments/khalti/return?status=failed&reason=unknown') };
  }
  const order = await Order.findById(payment.order);
  if (!order) {
    return { redirect: frontend('/payments/khalti/return?status=failed&reason=order') };
  }

  if (payment.status === 'completed') {
    return { redirect: frontend(`/payments/khalti/return?status=success&orderId=${order._id}`) };
  }

  let lookup;
  try {
    lookup = await khalti.lookupKhaltiPayment(pidx);
  } catch {
    return { redirect: frontend(`/payments/khalti/return?status=pending&orderId=${order._id}`) };
  }

  payment.rawLookup = lookup;

  if (khalti.khaltiIsCompleted(lookup) && khalti.khaltiAmountMatches(lookup, order.totalPaisa)) {
    await fulfillPaidOrder(order, payment, {
      gatewayTxnId: lookup.transaction_id,
      raw: lookup,
      pidx,
    });
    return { redirect: frontend(`/payments/khalti/return?status=success&orderId=${order._id}`) };
  }

  const status = String(lookup.status || '');
  if (['User canceled', 'Expired', 'Refunded', 'Failed'].includes(status) || status.toLowerCase().includes('cancel')) {
    await failOrder(order, payment, {
      status: status === 'Expired' ? 'expired' : 'cancelled',
      note: `Khalti lookup status: ${status}`,
    });
    return { redirect: frontend(`/payments/khalti/return?status=cancelled&orderId=${order._id}`) };
  }

  await failOrder(order, payment, {
    status: 'failed',
    note: `Khalti verification failed (status=${status}, amountMatch=${khalti.khaltiAmountMatches(lookup, order.totalPaisa)})`,
  });
  return { redirect: frontend(`/payments/khalti/return?status=failed&orderId=${order._id}`) };
}

/** Used by tests: verify a gateway payload without trusting client status/amount. */
export async function verifyGatewayAmount({ orderPaisa, gatewayAmountPaisa, gatewayStatus, expectedStatus }) {
  const amountOk = Number(gatewayAmountPaisa) === Number(orderPaisa);
  const statusOk = String(gatewayStatus) === String(expectedStatus);
  return { amountOk, statusOk, accepted: amountOk && statusOk };
}

export { fulfillPaidOrder, failOrder };
