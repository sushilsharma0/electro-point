import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slug.js';

export async function tree({ activeOnly = true } = {}) {
  const filter = activeOnly ? { isActive: true } : {};
  const cats = await Category.find(filter).sort({ displayOrder: 1, name: 1 }).lean();
  const byParent = new Map();
  for (const c of cats) {
    const key = c.parent ? String(c.parent) : 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push({ ...c, children: [] });
  }
  const attach = (node) => {
    node.children = byParent.get(String(node._id)) || [];
    node.children.forEach(attach);
    return node;
  };
  return (byParent.get('root') || []).map(attach);
}

export async function getBySlug(slug) {
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) throw ApiError.notFound('Category not found');
  const children = await Category.find({ parent: category._id, isActive: true }).sort({ displayOrder: 1 }).lean();
  return { ...category, children };
}

export async function adminList() {
  return tree({ activeOnly: false });
}

export async function adminCreate(payload) {
  const slug = await uniqueSlug(Category, payload.slug || payload.name);
  return Category.create({ ...payload, slug });
}

export async function adminUpdate(id, payload) {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound('Category not found');
  if (payload.parent && String(payload.parent) === String(id)) {
    throw ApiError.badRequest('Category cannot be its own parent');
  }
  if (payload.slug && payload.slug !== category.slug) {
    payload.slug = await uniqueSlug(Category, payload.slug, category._id);
  }
  Object.assign(category, payload);
  await category.save();
  return category;
}

async function descendantIds(parentId) {
  const children = await Category.find({ parent: parentId }).select('_id').lean();
  const ids = children.map((c) => c._id);
  for (const child of children) {
    ids.push(...(await descendantIds(child._id)));
  }
  return ids;
}

export async function adminRemove(id) {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound('Category not found');
  const ids = [category._id, ...(await descendantIds(id))];
  const inUse = await Product.exists({ $or: [{ category: { $in: ids } }, { subcategory: { $in: ids } }] });
  if (inUse) throw ApiError.conflict('Category has products; reassign them first');
  await Category.deleteMany({ _id: { $in: ids } });
  return { deleted: true };
}

export async function reorder(items) {
  await Promise.all(items.map((row) => Category.updateOne({ _id: row.id }, { $set: { displayOrder: row.displayOrder } })));
  return tree({ activeOnly: false });
}
