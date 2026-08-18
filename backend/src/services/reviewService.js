import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { getStoreSettings } from './pricingService.js';
import { parsePagination, paginated } from '../utils/pagination.js';

async function recalcProductRating(productId) {
  const agg = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = agg[0]?.avg || 0;
  const count = agg[0]?.count || 0;
  await Product.updateOne(
    { _id: productId },
    { $set: { ratingAvg: Math.round(avg * 10) / 10, ratingCount: count } },
  );
}

export async function listForProduct(productId, query) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 10 });
  const filter = { product: productId, status: 'approved' };
  const [items, total] = await Promise.all([
    Review.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name').lean(),
    Review.countDocuments(filter),
  ]);
  return paginated({ items, total, page, limit });
}

export async function createReview(user, { productId, orderId, rating, title, body }) {
  const settings = await getStoreSettings();
  const existing = await Review.findOne({ user: user._id, product: productId });
  if (existing) throw ApiError.conflict('You have already reviewed this product');

  let verifiedPurchase = false;
  let order = null;
  if (orderId) {
    order = await Order.findOne({ _id: orderId, user: user._id });
  } else {
    order = await Order.findOne({
      user: user._id,
      'items.product': productId,
      status: { $in: ['delivered', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'paid'] },
    });
  }
  if (order && order.items.some((i) => String(i.product) === String(productId))) {
    verifiedPurchase = true;
  }
  if (settings.review?.requireVerifiedPurchase && !verifiedPurchase) {
    throw ApiError.forbidden('Only verified purchases can leave a review');
  }

  const status = settings.review?.autoApprove ? 'approved' : 'pending';
  const review = await Review.create({
    user: user._id,
    product: productId,
    order: order?._id || null,
    rating,
    title,
    body,
    status,
    verifiedPurchase,
  });
  if (status === 'approved') await recalcProductRating(review.product);
  return review;
}

export async function adminList(query) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const filter = {};
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email').populate('product', 'name slug thumbnail images').lean(),
    Review.countDocuments(filter),
  ]);
  return paginated({ items, total, page, limit });
}

export async function adminUpdate(id, payload) {
  const review = await Review.findById(id);
  if (!review) throw ApiError.notFound('Review not found');
  Object.assign(review, payload);
  await review.save();
  await recalcProductRating(review.product);
  return review;
}

export async function adminRemove(id) {
  const review = await Review.findById(id);
  if (!review) throw ApiError.notFound('Review not found');
  const productId = review.product;
  await review.deleteOne();
  await recalcProductRating(productId);
  return { deleted: true };
}
