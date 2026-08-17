import * as orderService from '../services/orderService.js';
import * as paymentService from '../services/paymentService.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const quote = asyncHandler(async (req, res) => {
  return ok(
    res,
    await orderService.quoteCheckout({
      user: req.user,
      shippingMethod: req.body.shippingMethod,
      couponCode: req.body.couponCode,
      addressId: req.body.addressId,
    }),
  );
});

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrderFromCart({
    user: req.user,
    addressId: req.body.addressId,
    shippingMethod: req.body.shippingMethod,
    paymentMethod: req.body.paymentMethod,
    phone: req.body.phone,
    email: req.body.email,
  });
  return ok(res, order, 201);
});

export const listOrders = asyncHandler(async (req, res) => {
  return ok(res, await orderService.listMine(req.user, req.query));
});

export const getOrder = asyncHandler(async (req, res) => {
  return ok(res, await orderService.getMine(req.user, req.params.id));
});

export const initiateEsewa = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.body.orderId);
  if (!order) throw ApiError.notFound('Order not found');
  return ok(res, await paymentService.initiateEsewa({ order, user: req.user }));
});

export const esewaReturn = asyncHandler(async (req, res) => {
  const { redirect } = await paymentService.handleEsewaReturn({
    data: req.query.data,
    failure: req.query.failure,
    oid: req.query.oid,
  });
  return res.redirect(302, redirect);
});

export const initiateKhalti = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.body.orderId);
  if (!order) throw ApiError.notFound('Order not found');
  return ok(res, await paymentService.initiateKhalti({ order, user: req.user }));
});

export const khaltiReturn = asyncHandler(async (req, res) => {
  const { redirect } = await paymentService.handleKhaltiReturn(req.query);
  return res.redirect(302, redirect);
});
