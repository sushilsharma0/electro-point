import { Product } from '../models/Product.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { ApiError } from '../utils/ApiError.js';

function stockTarget(product, variantId) {
  if (variantId) {
    const variant = product.variants.id(variantId);
    if (!variant) throw ApiError.badRequest('Variant not found');
    return variant;
  }
  return product;
}

async function saveWithRetry(product, mutate, retries = 6) {
  let lastErr;
  const id = product._id || product;
  for (let i = 0; i < retries; i += 1) {
    const doc = await Product.findById(id);
    if (!doc) throw ApiError.notFound('Product not found');
    const result = await mutate(doc);
    try {
      await doc.save();
      return { product: doc, result };
    } catch (err) {
      lastErr = err;
      if (err.name === 'VersionError' || err.name === 'ParallelSaveError') continue;
      throw err;
    }
  }
  throw lastErr || ApiError.conflict('Inventory update conflict, retry');
}

async function record({ product, variantId, type, qtyDelta, reason, order, admin, target }) {
  await InventoryTransaction.create({
    product: product._id,
    variantId: variantId || null,
    type,
    qtyDelta,
    reason: reason || '',
    order: order || null,
    admin: admin || null,
    stockAfter: target.stock,
    reservedAfter: target.reservedStock,
  });
}

export async function availableOf(productId, variantId) {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  const target = stockTarget(product, variantId);
  return {
    product,
    target,
    available: Math.max(0, target.stock - target.reservedStock),
  };
}

export async function assertAvailable(productId, variantId, qty) {
  const { product, target, available } = await availableOf(productId, variantId);
  if (available < qty) {
    throw ApiError.unprocessable('Insufficient stock', [
      { productId: String(productId), available, requested: qty },
    ]);
  }
  return { product, target, available };
}

export async function reserveForOrder(order) {
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product) throw ApiError.unprocessable('Product no longer available');
    const { product: saved, result } = await saveWithRetry(product, async (doc) => {
      const target = stockTarget(doc, item.variantId);
      const available = target.stock - target.reservedStock;
      if (available < item.qty) {
        throw ApiError.unprocessable(`Insufficient stock for ${item.name}`, [
          { sku: item.sku, available, requested: item.qty },
        ]);
      }
      target.reservedStock += item.qty;
      return { target };
    });
    await record({
      product: saved,
      variantId: item.variantId,
      type: 'reserve',
      qtyDelta: 0,
      reason: `Reserved for ${order.orderNumber}`,
      order: order._id,
      target: result.target,
    });
  }
}

export async function commitForOrder(order) {
  if (order.inventoryCommitted) return;
  const existing = await InventoryTransaction.findOne({ order: order._id, type: 'order' });
  if (existing) {
    order.inventoryCommitted = true;
    return;
  }
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product) continue;
    const { product: saved, result } = await saveWithRetry(product, async (doc) => {
      const target = stockTarget(doc, item.variantId);
      const reserved = Math.min(target.reservedStock, item.qty);
      target.reservedStock = Math.max(0, target.reservedStock - reserved);
      target.stock = Math.max(0, target.stock - item.qty);
      return { target };
    });
    await record({
      product: saved,
      variantId: item.variantId,
      type: 'order',
      qtyDelta: -item.qty,
      reason: `Sold ${order.orderNumber}`,
      order: order._id,
      target: result.target,
    });
  }
  order.inventoryCommitted = true;
}

export async function releaseForOrder(order, { type = 'release', reason } = {}) {
  if (order.inventoryReleased) return;
  if (order.inventoryCommitted) {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;
      const { product: saved, result } = await saveWithRetry(product, async (doc) => {
        const target = stockTarget(doc, item.variantId);
        target.stock += item.qty;
        return { target };
      });
      await record({
        product: saved,
        variantId: item.variantId,
        type: type === 'refund' ? 'refund' : 'cancellation',
        qtyDelta: item.qty,
        reason: reason || `Restock ${order.orderNumber}`,
        order: order._id,
        target: result.target,
      });
    }
  } else {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;
      const { product: saved, result } = await saveWithRetry(product, async (doc) => {
        const target = stockTarget(doc, item.variantId);
        target.reservedStock = Math.max(0, target.reservedStock - item.qty);
        return { target };
      });
      await record({
        product: saved,
        variantId: item.variantId,
        type: 'release',
        qtyDelta: 0,
        reason: reason || `Released ${order.orderNumber}`,
        order: order._id,
        target: result.target,
      });
    }
  }
  order.inventoryReleased = true;
}

export async function adjustStock({ productId, variantId, qtyDelta, reason, admin, type = 'manual' }) {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  const { product: saved, result } = await saveWithRetry(product, async (doc) => {
    const target = stockTarget(doc, variantId);
    const next = target.stock + qtyDelta;
    if (next < 0) throw ApiError.unprocessable('Stock cannot go below zero');
    if (target.reservedStock > next) {
      throw ApiError.unprocessable('Stock cannot be lower than reserved quantity');
    }
    target.stock = next;
    return { target };
  });
  await record({
    product: saved,
    variantId,
    type,
    qtyDelta,
    reason,
    admin,
    target: result.target,
  });
  return saved;
}

export async function listLowStock() {
  const products = await Product.find({ status: { $ne: 'archived' } })
    .select('name sku slug stock reservedStock lowStockThreshold variants thumbnail brand')
    .lean();
  const rows = [];
  for (const p of products) {
    if (p.variants?.length) {
      for (const v of p.variants) {
        const available = (v.stock || 0) - (v.reservedStock || 0);
        if (available <= (p.lowStockThreshold || 0)) {
          rows.push({
            productId: String(p._id),
            name: p.name,
            sku: v.sku,
            variantId: String(v._id),
            variantName: v.name,
            stock: v.stock,
            reservedStock: v.reservedStock,
            available,
            lowStockThreshold: p.lowStockThreshold,
            thumbnail: p.thumbnail,
            brand: p.brand,
          });
        }
      }
    } else {
      const available = (p.stock || 0) - (p.reservedStock || 0);
      if (available <= (p.lowStockThreshold || 0)) {
        rows.push({
          productId: String(p._id),
          name: p.name,
          sku: p.sku,
          variantId: null,
          stock: p.stock,
          reservedStock: p.reservedStock,
          available,
          lowStockThreshold: p.lowStockThreshold,
          thumbnail: p.thumbnail,
          brand: p.brand,
        });
      }
    }
  }
  return rows;
}
