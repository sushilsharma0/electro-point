import { Product } from '../models/Product.js';

function variantFromProduct(product, variantId) {
  if (!product || !variantId) return null;
  const variants = product.variants;
  if (variants && typeof variants.id === 'function') return variants.id(variantId);
  if (Array.isArray(variants)) {
    return variants.find((v) => String(v._id) === String(variantId)) || null;
  }
  return null;
}

function firstImageUrl(images) {
  const first = Array.isArray(images) ? images[0] : null;
  if (!first) return '';
  if (typeof first === 'string') return first;
  return first.url || '';
}

export function productThumbUrl(product, variantId) {
  if (!product) return '';
  const variant = variantFromProduct(product, variantId);
  const fromVariant = firstImageUrl(variant?.images);
  if (fromVariant) return fromVariant;
  if (product.thumbnail) return product.thumbnail;
  return firstImageUrl(product.images);
}

export async function hydrateOrderItemImages(input) {
  const single = !Array.isArray(input);
  const orders = (single ? [input] : input).filter(Boolean);
  const missingIds = [];
  for (const order of orders) {
    for (const item of order.items || []) {
      if (item.image || item.thumbnail) {
        if (!item.image && item.thumbnail) item.image = item.thumbnail;
        continue;
      }
      const pid = item.product?._id || item.product;
      if (pid) missingIds.push(pid);
    }
  }
  if (missingIds.length) {
    const products = await Product.find({ _id: { $in: missingIds } })
      .select('thumbnail images slug brand variants.images')
      .lean();
    const map = new Map(products.map((p) => [String(p._id), p]));
    for (const order of orders) {
      for (const item of order.items || []) {
        if (item.image || item.thumbnail) {
          if (!item.image && item.thumbnail) item.image = item.thumbnail;
          continue;
        }
        const product = map.get(String(item.product?._id || item.product || ''));
        if (!product) continue;
        item.image = productThumbUrl(product, item.variantId);
        if (!item.slug) item.slug = product.slug;
        if (!item.brand) item.brand = product.brand;
      }
    }
  }
  return single ? orders[0] : orders;
}
