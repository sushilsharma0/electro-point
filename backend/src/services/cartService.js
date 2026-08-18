import crypto from 'node:crypto';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { quoteFromLines, validateCouponForCart } from './pricingService.js';
import { assertAvailable } from './inventoryService.js';

export function newGuestId() {
  return crypto.randomUUID();
}

export async function getOrCreateCart({ userId, guestId }) {
  if (userId) {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = await Cart.create({ user: userId, items: [] });
    return cart;
  }
  if (!guestId) return null;
  let cart = await Cart.findOne({ guestId });
  if (!cart) cart = await Cart.create({ guestId, items: [] });
  return cart;
}

async function linesFromCart(cart) {
  const ids = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids }, status: 'published' });
  const map = new Map(products.map((p) => [String(p._id), p]));
  const lines = [];
  for (const item of cart.items) {
    const product = map.get(String(item.product));
    if (!product) continue;
    lines.push({
      product,
      variantId: item.variantId,
      qty: item.qty,
      itemId: item._id,
    });
  }
  return lines;
}

export async function presentCart(cart, userId) {
  if (!cart) {
    return {
      items: [],
      couponCode: '',
      subtotalPaisa: 0,
      discountPaisa: 0,
      shippingPaisa: 0,
      taxPaisa: 0,
      totalPaisa: 0,
      currency: 'NPR',
    };
  }
  const lines = await linesFromCart(cart);
  const quote = await quoteFromLines({
    lines,
    couponCode: cart.couponCode,
    userId,
    includeShipping: false,
  });
  const items = quote.items.map((item, idx) => ({
    id: String(lines[idx].itemId),
    productId: String(item.product._id),
    variantId: item.variantId ? String(item.variantId) : null,
    name: item.name,
    sku: item.sku,
    options: item.options,
    qty: item.qty,
    unitPricePaisa: item.unitPricePaisa,
    lineTotalPaisa: item.lineTotalPaisa,
    thumbnail: item.image || item.thumbnail,
    image: item.image || item.thumbnail,
    brand: item.brand,
    slug: item.slug || item.product.slug,
    available: item.product.availableStock(item.variantId),
  }));
  return {
    id: String(cart._id),
    items,
    couponCode: quote.couponCode,
    couponError: quote.couponError,
    subtotalPaisa: quote.subtotalPaisa,
    discountPaisa: quote.discountPaisa,
    taxPaisa: quote.taxPaisa,
    taxPercent: quote.taxPercent,
    shippingPaisa: quote.shippingPaisa,
    totalPaisa: items.reduce((s, i) => s + i.lineTotalPaisa, 0) - quote.discountPaisa + quote.taxPaisa,
    currency: 'NPR',
  };
}

export async function addItem({ userId, guestId, productId, variantId, qty }) {
  const { product } = await assertAvailable(productId, variantId, qty);
  if (product.status !== 'published') throw ApiError.unprocessable('Product is not available');
  const unit = product.unitPricePaisa(variantId);
  if (unit == null) throw ApiError.badRequest('Invalid variant');
  const cart = await getOrCreateCart({ userId, guestId });
  const existing = cart.items.find(
    (i) => String(i.product) === String(productId) && String(i.variantId || '') === String(variantId || ''),
  );
  const nextQty = (existing?.qty || 0) + qty;
  await assertAvailable(productId, variantId, nextQty);
  if (existing) {
    existing.qty = nextQty;
    existing.priceSnapshotPaisa = unit;
  } else {
    cart.items.push({
      product: productId,
      variantId: variantId || null,
      qty,
      priceSnapshotPaisa: unit,
    });
  }
  await cart.save();
  return presentCart(cart, userId);
}

export async function updateItem({ userId, guestId, itemId, qty }) {
  const cart = await getOrCreateCart({ userId, guestId });
  if (!cart) throw ApiError.notFound('Cart not found');
  const item = cart.items.id(itemId);
  if (!item) throw ApiError.notFound('Cart item not found');
  if (qty === 0) {
    item.deleteOne();
  } else {
    await assertAvailable(item.product, item.variantId, qty);
    item.qty = qty;
  }
  await cart.save();
  return presentCart(cart, userId);
}

export async function removeItem({ userId, guestId, itemId }) {
  return updateItem({ userId, guestId, itemId, qty: 0 });
}

export async function replaceItems({ userId, guestId, items }) {
  const cart = await getOrCreateCart({ userId, guestId });
  cart.items = [];
  for (const row of items) {
    const { product } = await assertAvailable(row.productId, row.variantId, row.qty);
    cart.items.push({
      product: row.productId,
      variantId: row.variantId || null,
      qty: row.qty,
      priceSnapshotPaisa: product.unitPricePaisa(row.variantId),
    });
  }
  await cart.save();
  return presentCart(cart, userId);
}

export async function clearCart({ userId, guestId }) {
  const cart = await getOrCreateCart({ userId, guestId });
  if (cart) {
    cart.items = [];
    cart.couponCode = '';
    await cart.save();
  }
  return presentCart(cart, userId);
}

export async function applyCoupon({ userId, guestId, code }) {
  const cart = await getOrCreateCart({ userId, guestId });
  if (!cart || !cart.items.length) throw ApiError.unprocessable('Cart is empty');
  const lines = await linesFromCart(cart);
  await validateCouponForCart(code, lines, userId);
  cart.couponCode = String(code).trim().toUpperCase();
  await cart.save();
  return presentCart(cart, userId);
}

export async function removeCoupon({ userId, guestId }) {
  const cart = await getOrCreateCart({ userId, guestId });
  if (cart) {
    cart.couponCode = '';
    await cart.save();
  }
  return presentCart(cart, userId);
}

export async function mergeGuestCart(userId, guestId) {
  if (!guestId || !userId) return;
  const guest = await Cart.findOne({ guestId });
  if (!guest) return;
  if (!guest.items.length) {
    await guest.deleteOne();
    return;
  }

  const userCart = await Cart.findOne({ user: userId });
  if (!userCart) {
    await Cart.updateOne(
      { _id: guest._id },
      { $set: { user: userId }, $unset: { guestId: 1 } },
    );
    return;
  }

  for (const item of guest.items) {
    const existing = userCart.items.find(
      (i) => String(i.product) === String(item.product) && String(i.variantId || '') === String(item.variantId || ''),
    );
    if (existing) existing.qty = Math.min(99, existing.qty + item.qty);
    else userCart.items.push(item.toObject());
  }
  if (guest.couponCode && !userCart.couponCode) userCart.couponCode = guest.couponCode;
  await userCart.save();
  await guest.deleteOne();
}

export async function cartLinesForCheckout({ userId }) {
  const cart = await getOrCreateCart({ userId });
  if (!cart || !cart.items.length) throw ApiError.unprocessable('Cart is empty');
  const lines = await linesFromCart(cart);
  if (!lines.length) throw ApiError.unprocessable('Cart items are no longer available');
  return { cart, lines };
}
