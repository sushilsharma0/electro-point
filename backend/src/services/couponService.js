import { Coupon } from '../models/Coupon.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination, paginated } from '../utils/pagination.js';

export async function adminList(query) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const filter = {};
  if (query.q) filter.code = new RegExp(query.q, 'i');
  const [items, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Coupon.countDocuments(filter),
  ]);
  return paginated({ items, total, page, limit });
}

export async function adminCreate(payload) {
  payload.code = String(payload.code).trim().toUpperCase();
  const exists = await Coupon.findOne({ code: payload.code });
  if (exists) throw ApiError.conflict('Coupon code already exists');
  return Coupon.create(payload);
}

export async function adminUpdate(id, payload) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  if (payload.code) payload.code = String(payload.code).trim().toUpperCase();
  Object.assign(coupon, payload);
  await coupon.save();
  return coupon;
}

export async function adminRemove(id) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  await coupon.deleteOne();
  return { deleted: true };
}
