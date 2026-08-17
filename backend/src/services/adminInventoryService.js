import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { Product } from '../models/Product.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { listLowStock, adjustStock } from './inventoryService.js';

export async function overview() {
  const products = await Product.find({ status: { $ne: 'archived' } })
    .select('name sku stock reservedStock lowStockThreshold variants thumbnail brand slug')
    .lean();
  const rows = products.map((p) => {
    if (p.variants?.length) {
      return {
        ...p,
        variants: p.variants.map((v) => ({
          ...v,
          available: (v.stock || 0) - (v.reservedStock || 0),
        })),
        available: p.variants.reduce((s, v) => s + Math.max(0, (v.stock || 0) - (v.reservedStock || 0)), 0),
      };
    }
    return { ...p, available: (p.stock || 0) - (p.reservedStock || 0) };
  });
  return { items: rows, lowStock: await listLowStock() };
}

export async function transactions(query) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 30 });
  const filter = {};
  if (query.productId) filter.product = query.productId;
  if (query.type) filter.type = query.type;
  const [items, total] = await Promise.all([
    InventoryTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name sku')
      .populate('admin', 'name email')
      .populate('order', 'orderNumber')
      .lean(),
    InventoryTransaction.countDocuments(filter),
  ]);
  return paginated({ items, total, page, limit });
}

export { adjustStock, listLowStock };
