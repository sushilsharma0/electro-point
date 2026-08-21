import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { StoreSettings } from '../models/StoreSettings.js';
import { ApiError } from '../utils/ApiError.js';
import { productThumbUrl } from '../utils/productImage.js';

export async function getStoreSettings() {
  let settings = await StoreSettings.findOne({ key: 'store' });
  if (!settings) {
    settings = await StoreSettings.create({
      key: 'store',
      shipping: [
        { code: 'standard', name: 'Standard delivery', pricePaisa: 15000, eta: '3–5 days' },
        { code: 'express', name: 'Express delivery', pricePaisa: 35000, eta: '1–2 days' },
      ],
      countryCodes: [{ dial: '977', label: 'Nepal', iso: 'NP' }],
    });
  }
  return settings;
}

export function unitPriceFromProduct(product, variantId) {
  return product.unitPricePaisa(variantId);
}

export async function loadCoupon(code) {
  if (!code) return null;
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  return coupon;
}

export function couponEligibilityError(coupon, { subtotalPaisa, now = new Date() } = {}) {
  if (!coupon || !coupon.isActive) return 'Invalid coupon';
  if (coupon.startsAt && now < coupon.startsAt) return 'Coupon is not active yet';
  if (coupon.expiresAt && now > coupon.expiresAt) return 'Coupon has expired';
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return 'Coupon usage limit reached';
  if (subtotalPaisa != null && subtotalPaisa < (coupon.minOrderPaisa || 0)) {
    return 'Order does not meet the coupon minimum';
  }
  return null;
}

export async function assertCustomerCouponLimit(coupon, userId) {
  if (!coupon || !userId || !coupon.perCustomerLimit) return;
  const used = await Order.countDocuments({
    user: userId,
    couponCode: coupon.code,
    status: { $nin: ['cancelled', 'payment_failed'] },
  });
  if (used >= coupon.perCustomerLimit) {
    throw ApiError.unprocessable('You have already used this coupon');
  }
}

export function eligibleSubtotal(items, coupon) {
  if (!coupon) return items.reduce((s, i) => s + i.lineTotalPaisa, 0);
  const productIds = (coupon.productIds || []).map(String);
  const categoryIds = (coupon.categoryIds || []).map(String);
  if (!productIds.length && !categoryIds.length) {
    return items.reduce((s, i) => s + i.lineTotalPaisa, 0);
  }
  return items.reduce((sum, item) => {
    const pid = String(item.product._id || item.product);
    const cat = String(item.product.category || item.category || '');
    const sub = String(item.product.subcategory || item.subcategory || '');
    const matchProduct = productIds.includes(pid);
    const matchCat = categoryIds.includes(cat) || categoryIds.includes(sub);
    if (matchProduct || matchCat) return sum + item.lineTotalPaisa;
    return sum;
  }, 0);
}

export function computeDiscountPaisa(coupon, eligiblePaisa) {
  if (!coupon || eligiblePaisa <= 0) return 0;
  let discount =
    coupon.type === 'percent'
      ? Math.floor((eligiblePaisa * Number(coupon.value)) / 100)
      : Number(coupon.value);
  if (coupon.maxDiscountPaisa != null) {
    discount = Math.min(discount, coupon.maxDiscountPaisa);
  }
  return Math.max(0, Math.min(discount, eligiblePaisa));
}

export function computeTaxPaisa(taxablePaisa, taxPercent) {
  if (!taxPercent) return 0;
  return Math.round((taxablePaisa * Number(taxPercent)) / 100);
}

/**
 * Server-side quote. Client prices, totals, and tax are ignored.
 */
export async function quoteFromLines({ lines, shippingMethod, couponCode, userId, includeShipping = true }) {
  const settings = await getStoreSettings();
  const items = lines.map((line) => {
    const unitPricePaisa = unitPriceFromProduct(line.product, line.variantId);
    if (unitPricePaisa == null) throw ApiError.badRequest('Invalid variant');
    const qty = line.qty;
    const variant = line.variantId ? line.product.variants.id(line.variantId) : null;
    const image = productThumbUrl(line.product, line.variantId);
    return {
      product: line.product,
      variantId: line.variantId || null,
      name: line.product.name,
      sku: variant?.sku || line.product.sku,
      options: variant?.options || {},
      qty,
      unitPricePaisa,
      lineTotalPaisa: unitPricePaisa * qty,
      category: line.product.category,
      subcategory: line.product.subcategory,
      thumbnail: image,
      image,
      brand: line.product.brand,
      slug: line.product.slug,
    };
  });

  const subtotalPaisa = items.reduce((s, i) => s + i.lineTotalPaisa, 0);

  let coupon = null;
  let discountPaisa = 0;
  let couponError = null;
  if (couponCode) {
    coupon = await loadCoupon(couponCode);
    couponError = couponEligibilityError(coupon, { subtotalPaisa });
    if (!couponError && userId) {
      try {
        await assertCustomerCouponLimit(coupon, userId);
      } catch (err) {
        couponError = err.message;
      }
    }
    if (!couponError) {
      discountPaisa = computeDiscountPaisa(coupon, eligibleSubtotal(items, coupon));
    }
  }

  const shippingOptions = settings.shipping || [];
  const shipping = includeShipping
    ? shippingOptions.find((s) => s.code === shippingMethod) || shippingOptions[0] || { code: 'standard', name: 'Standard', pricePaisa: 0, eta: '' }
    : { code: '', name: '', pricePaisa: 0, eta: '' };
  const shippingPaisa = includeShipping ? shipping.pricePaisa || 0 : 0;
  const taxPaisa = computeTaxPaisa(Math.max(0, subtotalPaisa - discountPaisa), settings.taxPercent || 0);
  const totalPaisa = Math.max(0, subtotalPaisa - discountPaisa + shippingPaisa + taxPaisa);

  return {
    items,
    subtotalPaisa,
    discountPaisa,
    shippingPaisa,
    taxPaisa,
    totalPaisa,
    taxPercent: settings.taxPercent || 0,
    shippingMethod: shipping.code,
    shippingName: shipping.name,
    shippingEta: shipping.eta,
    couponCode: coupon && !couponError ? coupon.code : '',
    couponError,
    currency: 'NPR',
  };
}

export async function validateCouponForCart(code, lines, userId) {
  const quote = await quoteFromLines({ lines, couponCode: code, userId });
  if (quote.couponError) throw ApiError.unprocessable(quote.couponError);
  return quote;
}
