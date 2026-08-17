import * as reviewService from '../services/reviewService.js';
import * as wishlistService from '../services/wishlistService.js';
import * as settingsService from '../services/settingsService.js';
import * as notificationService from '../services/notificationService.js';
import { Address } from '../models/Address.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listProductReviews = asyncHandler(async (req, res) => {
  return ok(res, await reviewService.listForProduct(req.params.productId, req.query));
});

export const createReview = asyncHandler(async (req, res) => {
  return ok(res, await reviewService.createReview(req.user, req.body), 201);
});

export const getWishlist = asyncHandler(async (req, res) => {
  return ok(res, await wishlistService.getWishlist(req.user._id));
});

export const addWishlist = asyncHandler(async (req, res) => {
  return ok(res, await wishlistService.addToWishlist(req.user._id, req.body.productId), 201);
});

export const removeWishlist = asyncHandler(async (req, res) => {
  const productId = req.body.productId || req.params.productId;
  return ok(res, await wishlistService.removeFromWishlist(req.user._id, productId));
});

export const getProfile = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user.toPublic() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  if (req.body.name) req.user.name = req.body.name;
  if (req.body.phone != null) req.user.phone = req.body.phone;
  await req.user.save();
  return ok(res, { user: req.user.toPublic() });
});

export const listAddresses = asyncHandler(async (req, res) => {
  const items = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  return ok(res, items);
});

export const createAddress = asyncHandler(async (req, res) => {
  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
  }
  const address = await Address.create({ ...req.body, user: req.user._id });
  return ok(res, address, 201);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw ApiError.notFound('Address not found');
  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
  }
  Object.assign(address, req.body);
  await address.save();
  return ok(res, address);
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) throw ApiError.notFound('Address not found');
  return ok(res, { deleted: true });
});

export const getSettings = asyncHandler(async (req, res) => {
  return ok(res, await settingsService.publicSettings());
});

export const listNotifications = asyncHandler(async (req, res) => {
  return ok(res, await notificationService.listForUser(req.user._id));
});

export const readNotification = asyncHandler(async (req, res) => {
  return ok(res, await notificationService.markRead(req.user._id, req.params.id));
});

export const csrfToken = asyncHandler(async (req, res) => {
  return ok(res, { csrfToken: req.csrfToken });
});
