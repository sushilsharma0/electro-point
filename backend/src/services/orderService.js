import crypto from 'node:crypto';
import { Order } from '../models/Order.js';
import { Address } from '../models/Address.js';
import { ApiError } from '../utils/ApiError.js';
import { quoteFromLines } from './pricingService.js';
import { cartLinesForCheckout } from './cartService.js';
import * as inventory from './inventoryService.js';
import { notify } from './notificationService.js';
import { parsePagination, paginated } from '../utils/pagination.js';

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
    status: 'payment_pending',
    timeline: [{ status: 'payment_pending', at: new Date(), note: 'Order created, awaiting payment' }],
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

  await notify({
    user: user._id,
    type: 'order_created',
    title: 'Order placed',
    body: `${order.orderNumber} is awaiting payment.`,
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

export async function updateStatus(order, status, note = '', adminUser) {
  const current = order.status;
  if (current === status) return order;
  if (status === 'cancelled' && !['cancelled', 'refunded', 'delivered'].includes(current)) {
    await inventory.releaseForOrder(order, { type: 'cancellation', reason: note || 'Admin cancelled' });
  }
  if (status === 'refunded') {
    await inventory.releaseForOrder(order, { type: 'refund', reason: note || 'Refunded' });
    order.payment = { ...(order.payment?.toObject?.() || order.payment || {}), status: 'refunded' };
  }
  order.status = status;
  order.timeline.push({
    status,
    at: new Date(),
    note: note || (adminUser ? `Updated by admin` : ''),
  });
  await order.save();
  await notify({
    user: order.user,
    type: 'order_status',
    title: `Order ${order.orderNumber}`,
    body: `Status updated to ${status.replaceAll('_', ' ')}.`,
    link: `/account/orders/${order._id}`,
  });
  return order;
}
