import { User } from '../models/User.js';
import { Order, PAID_ORDER_STATUSES } from '../models/Order.js';
import { Address } from '../models/Address.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination, paginated } from '../utils/pagination.js';

export async function listCustomers(query) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const filter = { role: 'customer' };
  if (query.q) {
    filter.$or = [
      { name: new RegExp(query.q, 'i') },
      { email: new RegExp(query.q, 'i') },
      { phone: new RegExp(query.q, 'i') },
    ];
  }
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return paginated({ items, total, page, limit });
}

export async function getCustomer(id) {
  const user = await User.findById(id);
  if (!user || user.role !== 'customer') throw ApiError.notFound('Customer not found');
  const [orders, spendAgg, addresses] = await Promise.all([
    Order.find({ user: id }).sort({ createdAt: -1 }).limit(20).lean(),
    Order.aggregate([
      { $match: { user: user._id, status: { $in: PAID_ORDER_STATUSES } } },
      { $group: { _id: null, totalPaisa: { $sum: '$totalPaisa' }, count: { $sum: 1 } } },
    ]),
    Address.find({ user: id }).lean(),
  ]);
  return {
    user: user.toPublic(),
    spendPaisa: spendAgg[0]?.totalPaisa || 0,
    paidOrders: spendAgg[0]?.count || 0,
    orders,
    addresses,
  };
}

export async function updateCustomer(id, payload) {
  const user = await User.findById(id);
  if (!user || user.role !== 'customer') throw ApiError.notFound('Customer not found');
  if (payload.status) user.status = payload.status;
  if (payload.name) user.name = payload.name;
  if (payload.phone != null) user.phone = payload.phone;
  await user.save();
  return user.toPublic();
}
