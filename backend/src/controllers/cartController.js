import * as cartService from '../services/cartService.js';
import { COOKIE, setCartCookie } from '../utils/cookies.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function cartIdentity(req, res) {
  if (req.user) return { userId: req.user._id, guestId: null };
  let guestId = req.signedCookies?.[COOKIE.CART];
  if (!guestId) {
    guestId = cartService.newGuestId();
    setCartCookie(res, guestId);
  }
  return { userId: null, guestId };
}

export const getCart = asyncHandler(async (req, res) => {
  const id = cartIdentity(req, res);
  const cart = await cartService.getOrCreateCart(id);
  return ok(res, await cartService.presentCart(cart, id.userId));
});

export const replaceCart = asyncHandler(async (req, res) => {
  const id = cartIdentity(req, res);
  return ok(res, await cartService.replaceItems({ ...id, items: req.body.items }));
});

export const clearCart = asyncHandler(async (req, res) => {
  const id = cartIdentity(req, res);
  return ok(res, await cartService.clearCart(id));
});

export const addItem = asyncHandler(async (req, res) => {
  const id = cartIdentity(req, res);
  return ok(
    res,
    await cartService.addItem({
      ...id,
      productId: req.body.productId,
      variantId: req.body.variantId,
      qty: req.body.qty,
    }),
    201,
  );
});

export const updateItem = asyncHandler(async (req, res) => {
  const id = cartIdentity(req, res);
  return ok(res, await cartService.updateItem({ ...id, itemId: req.params.itemId, qty: req.body.qty }));
});

export const removeItem = asyncHandler(async (req, res) => {
  const id = cartIdentity(req, res);
  return ok(res, await cartService.removeItem({ ...id, itemId: req.params.itemId }));
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const id = cartIdentity(req, res);
  return ok(res, await cartService.applyCoupon({ ...id, code: req.body.code }));
});

export const removeCoupon = asyncHandler(async (req, res) => {
  const id = cartIdentity(req, res);
  return ok(res, await cartService.removeCoupon(id));
});
