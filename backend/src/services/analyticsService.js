import { Order, PAID_ORDER_STATUSES } from '../models/Order.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Payment } from '../models/Payment.js';
import { listLowStock } from './inventoryService.js';
import { productThumbUrl } from '../utils/productImage.js';

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

const paidMatch = { status: { $in: PAID_ORDER_STATUSES } };

export async function dashboard() {
  const now = new Date();
  const today = startOfDay(now);
  const week = daysAgo(7);
  const month = daysAgo(30);

  const [revenueAgg, todayAgg, weekAgg, monthAgg, orderCount, customerCount, productCount, statusSplit, methodSplit, recentOrders] =
    await Promise.all([
      Order.aggregate([{ $match: paidMatch }, { $group: { _id: null, revenue: { $sum: '$totalPaisa' }, orders: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { ...paidMatch, createdAt: { $gte: today } } }, { $group: { _id: null, revenue: { $sum: '$totalPaisa' }, orders: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { ...paidMatch, createdAt: { $gte: week } } }, { $group: { _id: null, revenue: { $sum: '$totalPaisa' }, orders: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { ...paidMatch, createdAt: { $gte: month } } }, { $group: { _id: null, revenue: { $sum: '$totalPaisa' }, orders: { $sum: 1 } } }]),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ status: { $ne: 'archived' } }),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: paidMatch },
        { $group: { _id: '$payment.method', count: { $sum: 1 }, revenuePaisa: { $sum: '$totalPaisa' } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(8).select('orderNumber totalPaisa status createdAt email').lean(),
    ]);

  const revenue = revenueAgg[0]?.revenue || 0;
  const paidOrders = revenueAgg[0]?.orders || 0;
  const aov = paidOrders ? Math.round(revenue / paidOrders) : 0;

  const [topProducts, topCategories, salesByDay, lowStock] = await Promise.all([
    Order.aggregate([
      { $match: paidMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          qty: { $sum: '$items.qty' },
          revenuePaisa: { $sum: '$items.lineTotalPaisa' },
        },
      },
      { $sort: { revenuePaisa: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([
      { $match: paidMatch },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$product.category',
          qty: { $sum: '$items.qty' },
          revenuePaisa: { $sum: '$items.lineTotalPaisa' },
        },
      },
      { $sort: { revenuePaisa: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, qty: 1, revenuePaisa: 1, name: '$category.name', slug: '$category.slug' } },
    ]),
    Order.aggregate([
      { $match: { ...paidMatch, createdAt: { $gte: daysAgo(30) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenuePaisa: { $sum: '$totalPaisa' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    listLowStock(),
  ]);

  const pick = (agg) => ({ revenuePaisa: agg[0]?.revenue || 0, orders: agg[0]?.orders || 0 });

  const productIds = topProducts.map((p) => p._id).filter(Boolean);
  const productDocs = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).select('thumbnail images slug').lean()
    : [];
  const thumbMap = new Map(productDocs.map((p) => [String(p._id), p]));
  const topProductsWithImages = topProducts.map((p) => {
    const doc = thumbMap.get(String(p._id));
    const image = productThumbUrl(doc);
    return { ...p, image, thumbnail: image, slug: doc?.slug || '' };
  });

  return {
    revenuePaisa: revenue,
    paidOrders,
    averageOrderValuePaisa: aov,
    orderCount,
    customerCount,
    productCount,
    today: pick(todayAgg),
    week: pick(weekAgg),
    month: pick(monthAgg),
    topProducts: topProductsWithImages,
    topCategories,
    paymentMethodSplit: methodSplit.map((m) => ({ method: m._id || 'unknown', count: m.count, revenuePaisa: m.revenuePaisa })),
    orderStatusSplit: statusSplit.map((s) => ({ status: s._id, count: s.count })),
    salesByDay: salesByDay.map((d) => ({ date: d._id, revenuePaisa: d.revenuePaisa, orders: d.orders })),
    lowStock,
    recentOrders,
  };
}

export async function paymentsList(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Number(query.limit) || 20);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.method) filter.method = query.method;
  const [items, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('order', 'orderNumber totalPaisa status').populate('user', 'name email').lean(),
    Payment.countDocuments(filter),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) || 0 };
}
