import crypto from 'node:crypto';
import { Order } from '../models/Order.js';
import { Address } from '../models/Address.js';
import { ApiError } from '../utils/ApiError.js';
import { quoteFromLines, getStoreSettings } from './pricingService.js';
import { cartLinesForCheckout } from './cartService.js';
import * as inventory from './inventoryService.js';
import { notify } from './notificationService.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { Coupon } from '../models/Coupon.js';
import { Cart } from '../models/Cart.js';

function ymd(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

async function nextOrderNumber() {
  for (let i = 0; i < 8; i += 1) {
    const orderNumber = `EP-${ymd()}-${crypto.randomInt(1000, 10000)}`;
    const exists = await Order.exists({ orderNumber });
    if (!exists) return orderNumber;
  }
  return `EP-${ymd()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export async function quoteCheckout({ user, shippingMethod, couponCode, addressId }) {
  const { cart, lines } = await cartLinesForCheckout({ userId: user._id });
  const quote = await quoteFromLines({
    lines,
    shippingMethod,
    couponCode: couponCode || cart.couponCode,
    userId: user._id,
  });
  let address = null;
  if (addressId) {
    address = await Address.findOne({ _id: addressId, user: user._id }).lean();
  }
  return { ...quote, address };
}

export async function createOrderFromCart({ user, addressId, shippingMethod, paymentMethod, phone, email }) {
  const settings = await getStoreSettings();
  const payments = settings.payments || {};
  if (paymentMethod === 'esewa' && payments.esewaEnabled === false) {
    throw ApiError.unprocessable('eSewa is disabled');
  }
  if (paymentMethod === 'khalti' && payments.khaltiEnabled === false) {
    throw ApiError.unprocessable('Khalti is disabled');
  }
  if (paymentMethod === 'cod' && payments.codEnabled === false) {
    throw ApiError.unprocessable('Cash on delivery is disabled');
  }

  const address = await Address.findOne({ _id: addressId, user: user._id });
  if (!address) throw ApiError.badRequest('Address not found');
  const { cart, lines } = await cartLinesForCheckout({ userId: user._id });
  const quote = await quoteFromLines({
    lines,
    shippingMethod,
    couponCode: cart.couponCode,
    userId: user._id,
  });
  if (quote.couponError) throw ApiError.unprocessable(quote.couponError);

  for (const line of lines) {
    await inventory.assertAvailable(line.product._id, line.variantId, line.qty);
  }

  const isCod = paymentMethod === 'cod';
  const order = await Order.create({
    orderNumber: await nextOrderNumber(),
    user: user._id,
    email: email || user.email,
    phone: phone || address.phone || user.phone,
    items: quote.items.map((item) => ({
      product: item.product._id,
      variantId: item.variantId,
      name: item.name,
      sku: item.sku,
      options: item.options,
      qty: item.qty,
      unitPricePaisa: item.unitPricePaisa,
      lineTotalPaisa: item.lineTotalPaisa,
    })),
    address: {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },
    subtotalPaisa: quote.subtotalPaisa,
    discountPaisa: quote.discountPaisa,
    shippingPaisa: quote.shippingPaisa,
    taxPaisa: quote.taxPaisa,
    totalPaisa: quote.totalPaisa,
    couponCode: quote.couponCode,
    status: isCod ? 'confirmed' : 'payment_pending',
    timeline: [
      {
        status: isCod ? 'confirmed' : 'payment_pending',
        at: new Date(),
        note: isCod ? 'Order placed. Pay cash on delivery.' : 'Order created, awaiting payment',
      },
    ],
    shippingMethod: quote.shippingMethod,
    payment: { method: paymentMethod, status: 'pending', gatewayIds: {} },
  });

  try {
    await inventory.reserveForOrder(order);
  } catch (err) {
    order.status = 'cancelled';
    order.timeline.push({ status: 'cancelled', at: new Date(), note: 'Insufficient stock at reservation' });
    order.inventoryReleased = true;
    await order.save();
    throw err;
  }

  if (isCod) {
    await inventory.commitForOrder(order);
    if (order.couponCode) {
      await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
    }
    await Cart.updateOne({ user: order.user }, { $set: { items: [], couponCode: '' } });
    await order.save();
  }

  await notify({
    user: user._id,
    type: 'order_created',
    title: 'Order placed',
    body: isCod
      ? `${order.orderNumber} is confirmed. Pay cash on delivery.`
      : `${order.orderNumber} is awaiting payment.`,
    link: `/account/orders/${order._id}`,
  });

  return order;
}

export async function listMine(user, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { user: user._id };
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  return paginated({ items, total, page, limit });
}

export async function getMine(user, id) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');
  if (String(order.user) !== String(user._id) && user.role !== 'superadmin') {
    throw ApiError.forbidden();
  }
  return order;
}

export async function adminList(query) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.q) {
    filter.$or = [
      { orderNumber: new RegExp(query.q, 'i') },
      { email: new RegExp(query.q, 'i') },
      { phone: new RegExp(query.q, 'i') },
    ];
  }
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email').lean(),
    Order.countDocuments(filter),
  ]);
  return paginated({ items, total, page, limit });
}

export async function adminGet(id) {
  const order = await Order.findById(id).populate('user', 'name email phone status');
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

function applyTracking(order, tracking = {}) {
  const current = order.tracking?.toObject?.() || order.tracking || {};
  const next = {
    carrier: current.carrier || '',
    trackingNumber: current.trackingNumber || '',
    trackingUrl: current.trackingUrl || '',
    estimatedDelivery: current.estimatedDelivery || null,
    lastLocation: current.lastLocation || '',
  };
  if (tracking.carrier !== undefined) next.carrier = String(tracking.carrier || '').trim();
  if (tracking.trackingNumber !== undefined) next.trackingNumber = String(tracking.trackingNumber || '').trim();
  if (tracking.trackingUrl !== undefined) next.trackingUrl = String(tracking.trackingUrl || '').trim();
  if (tracking.lastLocation !== undefined) next.lastLocation = String(tracking.lastLocation || '').trim();
  if (tracking.estimatedDelivery !== undefined) {
    next.estimatedDelivery = tracking.estimatedDelivery || null;
  }
  order.tracking = next;
}

export function publicTrackingView(order) {
  const tracking = order.tracking?.toObject?.() || order.tracking || {};
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    shippingMethod: order.shippingMethod,
    items: (order.items || []).map((item) => ({
      name: item.name,
      qty: item.qty,
      sku: item.sku,
    })),
    totalPaisa: order.totalPaisa,
    timeline: order.timeline || [],
    tracking: {
      carrier: tracking.carrier || '',
      trackingNumber: tracking.trackingNumber || '',
      trackingUrl: tracking.trackingUrl || '',
      estimatedDelivery: tracking.estimatedDelivery || null,
      lastLocation: tracking.lastLocation || '',
    },
    payment: {
      method: order.payment?.method || '',
      status: order.payment?.status || '',
    },
    address: {
      city: order.address?.city || '',
      state: order.address?.state || '',
      country: order.address?.country || '',
    },
  };
}

export async function trackByNumber({ orderNumber, email }) {
  const number = String(orderNumber || '').trim();
  const mail = String(email || '').trim().toLowerCase();
  if (!number || !mail) throw ApiError.badRequest('Order number and email are required');
  const order = await Order.findOne({ orderNumber: number }).select(
    'orderNumber email status createdAt shippingMethod items.name items.qty items.sku totalPaisa timeline tracking payment.method payment.status address.city address.state address.country',
  );
  if (!order || String(order.email || '').toLowerCase() !== mail) {
    throw ApiError.notFound('Order not found');
  }
  return publicTrackingView(order);
}

export async function updateStatus(order, status, note = '', adminUser, tracking) {
  const current = order.status;
  const nextStatus = status || current;
  const statusChanged = Boolean(status) && status !== current;
  const trackingProvided = tracking && typeof tracking === 'object' && Object.keys(tracking).length > 0;
  if (!statusChanged && !trackingProvided && !note) return order;

  if (statusChanged && nextStatus === 'cancelled' && !['cancelled', 'refunded', 'delivered'].includes(current)) {
    await inventory.releaseForOrder(order, { type: 'cancellation', reason: note || 'Admin cancelled' });
  }
  if (statusChanged && nextStatus === 'refunded') {
    await inventory.releaseForOrder(order, { type: 'refund', reason: note || 'Refunded' });
    order.payment = { ...(order.payment?.toObject?.() || order.payment || {}), status: 'refunded' };
  }
  const pay = order.payment?.toObject?.() || order.payment || {};
  if (
    statusChanged &&
    pay.method === 'cod' &&
    pay.status === 'pending' &&
    (nextStatus === 'delivered' || nextStatus === 'paid')
  ) {
    order.payment = { ...pay, status: 'completed' };
  }
  if (trackingProvided) applyTracking(order, tracking);
  order.status = nextStatus;
  const timelineNote =
    note ||
    (statusChanged ? (adminUser ? 'Updated by admin' : '') : trackingProvided ? 'Shipment tracking updated' : '');
  order.timeline.push({
    status: nextStatus,
    at: new Date(),
    note: timelineNote,
  });
  await order.save();
  await notify({
    user: order.user,
    type: 'order_status',
    title: `Order ${order.orderNumber}`,
    body: statusChanged
      ? `Status updated to ${nextStatus.replaceAll('_', ' ')}.`
      : 'Shipment tracking was updated.',
    link: `/account/orders/${order._id}`,
  });
  return order;
}
