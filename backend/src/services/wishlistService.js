import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { addItem } from './cartService.js';

export async function getWishlist(userId) {
  const doc = await Wishlist.findOne({ user: userId }).populate({
    path: 'products',
    select: 'name slug brand thumbnail pricePaisa salePricePaisa flags ratingAvg ratingCount status images',
    match: { status: 'published' },
  });
  return doc?.products || [];
}

export async function addToWishlist(userId, productId) {
  const product = await Product.findById(productId);
  if (!product || product.status !== 'published') throw ApiError.notFound('Product not found');
  await Wishlist.findOneAndUpdate(
    { user: userId },
    { $addToSet: { products: productId } },
    { upsert: true, new: true },
  );
  return getWishlist(userId);
}

export async function removeFromWishlist(userId, productId) {
  await Wishlist.findOneAndUpdate({ user: userId }, { $pull: { products: productId } });
  return getWishlist(userId);
}

export async function moveToCart({ userId, productId, variantId, qty = 1 }) {
  await addItem({ userId, productId, variantId, qty });
  await removeFromWishlist(userId, productId);
  return getWishlist(userId);
}
