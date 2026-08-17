import * as productService from '../services/productService.js';
import * as categoryService from '../services/categoryService.js';
import * as orderService from '../services/orderService.js';
import * as customerService from '../services/customerService.js';
import * as couponService from '../services/couponService.js';
import * as reviewService from '../services/reviewService.js';
import * as analyticsService from '../services/analyticsService.js';
import * as settingsService from '../services/settingsService.js';
import * as uploadService from '../services/uploadService.js';
import * as adminInventory from '../services/adminInventoryService.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listProducts = asyncHandler(async (req, res) => ok(res, await productService.adminList(req.query)));
export const getProduct = asyncHandler(async (req, res) => ok(res, await productService.adminGet(req.params.id)));
export const createProduct = asyncHandler(async (req, res) => ok(res, await productService.adminCreate(req.body), 201));
export const updateProduct = asyncHandler(async (req, res) => ok(res, await productService.adminUpdate(req.params.id, req.body)));
export const deleteProduct = asyncHandler(async (req, res) => ok(res, await productService.adminRemove(req.params.id)));
export const bulkProducts = asyncHandler(async (req, res) => ok(res, await productService.adminBulk(req.body)));

export const listCategories = asyncHandler(async (req, res) => ok(res, await categoryService.adminList()));
export const createCategory = asyncHandler(async (req, res) => ok(res, await categoryService.adminCreate(req.body), 201));
export const updateCategory = asyncHandler(async (req, res) => ok(res, await categoryService.adminUpdate(req.params.id, req.body)));
export const deleteCategory = asyncHandler(async (req, res) => ok(res, await categoryService.adminRemove(req.params.id)));
export const reorderCategories = asyncHandler(async (req, res) => ok(res, await categoryService.reorder(req.body.items)));

export const listOrders = asyncHandler(async (req, res) => ok(res, await orderService.adminList(req.query)));
export const getOrder = asyncHandler(async (req, res) => ok(res, await orderService.adminGet(req.params.id)));
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.adminGet(req.params.id);
  return ok(res, await orderService.updateStatus(order, req.body.status, req.body.note, req.user));
});
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.adminGet(req.params.id);
  return ok(res, await orderService.updateStatus(order, 'cancelled', req.body?.note || 'Cancelled by admin', req.user));
});
export const refundOrder = asyncHandler(async (req, res) => {
  const order = await orderService.adminGet(req.params.id);
  return ok(res, await orderService.updateStatus(order, 'refunded', req.body?.note || 'Refunded by admin', req.user));
});

export const listCustomers = asyncHandler(async (req, res) => ok(res, await customerService.listCustomers(req.query)));
export const getCustomer = asyncHandler(async (req, res) => ok(res, await customerService.getCustomer(req.params.id)));
export const updateCustomer = asyncHandler(async (req, res) => ok(res, await customerService.updateCustomer(req.params.id, req.body)));

export const inventoryOverview = asyncHandler(async (req, res) => ok(res, await adminInventory.overview()));
export const inventoryTransactions = asyncHandler(async (req, res) => ok(res, await adminInventory.transactions(req.query)));
export const inventoryAdjust = asyncHandler(async (req, res) => {
  const product = await adminInventory.adjustStock({
    productId: req.body.productId,
    variantId: req.body.variantId,
    qtyDelta: req.body.qtyDelta,
    reason: req.body.reason,
    admin: req.user._id,
    type: req.body.type || 'manual',
  });
  return ok(res, product);
});

export const listCoupons = asyncHandler(async (req, res) => ok(res, await couponService.adminList(req.query)));
export const createCoupon = asyncHandler(async (req, res) => ok(res, await couponService.adminCreate(req.body), 201));
export const updateCoupon = asyncHandler(async (req, res) => ok(res, await couponService.adminUpdate(req.params.id, req.body)));
export const deleteCoupon = asyncHandler(async (req, res) => ok(res, await couponService.adminRemove(req.params.id)));

export const listReviews = asyncHandler(async (req, res) => ok(res, await reviewService.adminList(req.query)));
export const updateReview = asyncHandler(async (req, res) => ok(res, await reviewService.adminUpdate(req.params.id, req.body)));
export const deleteReview = asyncHandler(async (req, res) => ok(res, await reviewService.adminRemove(req.params.id)));

export const listPayments = asyncHandler(async (req, res) => ok(res, await analyticsService.paymentsList(req.query)));
export const analytics = asyncHandler(async (req, res) => ok(res, await analyticsService.dashboard()));

export const getSettings = asyncHandler(async (req, res) => ok(res, await settingsService.adminGet()));
export const updateSettings = asyncHandler(async (req, res) => ok(res, await settingsService.adminUpdate(req.body)));

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  return ok(res, await uploadService.processImage(req.file), 201);
});

export const uploadModel = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  return ok(res, await uploadService.processModel3d(req.file), 201);
});
