import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { uniqueSlug } from '../utils/slug.js';
import { isSafeKey } from '../utils/sanitize.js';

const PUBLIC_SELECT = '-costPricePaisa -__v';

function flagOn(value) {
  return value === true || value === 'true' || value === '1';
}

async function categoryIdsFromSlug(slug) {
  const cat = await Category.findOne({ slug, isActive: true });
  if (!cat) return [];
  const children = await Category.find({ parent: cat._id, isActive: true }).select('_id');
  return [cat._id, ...children.map((c) => c._id)];
}

async function publicFacets() {
  const base = { status: 'published' };
  const [brands, price, categories] = await Promise.all([
    Product.distinct('brand', base),
    Product.aggregate([{ $match: base }, { $group: { _id: null, min: { $min: '$pricePaisa' }, max: { $max: '$pricePaisa' } } }]),
    Category.find({ isActive: true, parent: null }).select('name slug').sort({ displayOrder: 1, name: 1 }).lean(),
  ]);
  return {
    brands: brands.filter(Boolean).sort((a, b) => a.localeCompare(b)),
    price: { min: price[0]?.min ?? 0, max: price[0]?.max ?? 0 },
    categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
  };
}

export async function listPublic(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { status: 'published' };
  const and = [];

  if (query.q) {
    filter.$text = { $search: query.q };
  }
  if (query.category) {
    if (mongoose.isValidObjectId(query.category)) {
      const children = await Category.find({ parent: query.category, isActive: true }).select('_id');
      and.push({ category: { $in: [query.category, ...children.map((c) => c._id)] } });
    } else {
      const ids = await categoryIdsFromSlug(query.category);
      if (!ids.length) {
        const empty = paginated({ items: [], total: 0, page, limit });
        if (flagOn(query.facets)) empty.availableFilters = await publicFacets();
        return empty;
      }
      and.push({ $or: [{ category: { $in: ids } }, { subcategory: { $in: ids } }] });
    }
  }
  if (query.brand) {
    const brands = String(query.brand)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (brands.length === 1) and.push({ brand: brands[0] });
    else if (brands.length > 1) and.push({ brand: { $in: brands } });
  }
  const price = {};
  if (query.minPrice != null && query.minPrice !== '') price.$gte = Number(query.minPrice);
  if (query.maxPrice != null && query.maxPrice !== '') price.$lte = Number(query.maxPrice);
  if (Object.keys(price).length) and.push({ pricePaisa: price });
  if (flagOn(query.inStock)) {
    and.push({ $expr: { $gt: [{ $subtract: ['$stock', '$reservedStock'] }, 0] } });
  }
  if (flagOn(query.featured)) and.push({ 'flags.isFeatured': true });
  if (flagOn(query.bestSeller)) and.push({ 'flags.isBestSeller': true });
  if (flagOn(query.newArrival)) and.push({ 'flags.isNewArrival': true });
  if (flagOn(query.onSale)) {
    and.push({
      $or: [
        { 'flags.isOnSale': true },
        {
          $expr: {
            $and: [{ $gt: [{ $ifNull: ['$salePricePaisa', 0] }, 0] }, { $lt: ['$salePricePaisa', '$pricePaisa'] }],
          },
        },
      ],
    });
  }
  if (query.rating != null && query.rating !== '') {
    const min = Number(query.rating);
    if (Number.isFinite(min)) and.push({ ratingAvg: { $gte: min } });
  }
  if (query.filters && typeof query.filters === 'object') {
    for (const [key, value] of Object.entries(query.filters)) {
      if (!isSafeKey(key) || value == null || value === '') continue;
      and.push({
        $or: [
          { specGroups: { $elemMatch: { fields: { $elemMatch: { key, value: String(value), filterable: true } } } } },
          { [`variants.options.${key}`]: String(value) },
        ],
      });
    }
  }
  if (and.length) filter.$and = and;

  let sort = { createdAt: -1 };
  switch (query.sort) {
    case 'price_asc':
      sort = { pricePaisa: 1 };
      break;
    case 'price_desc':
      sort = { pricePaisa: -1 };
      break;
    case 'rating':
      sort = { ratingAvg: -1, ratingCount: -1 };
      break;
    case 'name':
      sort = { name: 1 };
      break;
    case 'featured':
      sort = { 'flags.isFeatured': -1, createdAt: -1 };
      break;
    case 'bestseller':
      sort = { 'flags.isBestSeller': -1, ratingCount: -1 };
      break;
    default:
      sort = { createdAt: -1 };
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select(PUBLIC_SELECT)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  const result = paginated({ items, total, page, limit });
  if (flagOn(query.facets)) result.availableFilters = await publicFacets();
  return result;
}

export async function getBySlug(slug) {
  const product = await Product.findOne({ slug, status: 'published' })
    .select(PUBLIC_SELECT)
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug');
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

export async function related(id) {
  const product = await Product.findById(id).select('category tags');
  if (!product) throw ApiError.notFound('Product not found');
  return Product.find({
    _id: { $ne: product._id },
    status: 'published',
    $or: [{ category: product.category }, { tags: { $in: product.tags || [] } }],
  })
    .select('name slug brand thumbnail pricePaisa salePricePaisa flags ratingAvg ratingCount images')
    .limit(8)
    .lean();
}

export async function suggest(q) {
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const products = await Product.find({
    status: 'published',
    $or: [{ name: rx }, { brand: rx }, { sku: rx }, { tags: rx }],
  })
    .select('name slug brand thumbnail pricePaisa salePricePaisa images')
    .limit(8)
    .lean();
  const brands = await Product.distinct('brand', { status: 'published', brand: rx });
  return { products, brands: brands.slice(0, 6) };
}

export async function listBrands() {
  const brands = await Product.distinct('brand', { status: 'published' });
  return brands.filter(Boolean).sort();
}

export async function compare(ids) {
  const unique = [...new Set(ids)].slice(0, 4);
  return Product.find({ _id: { $in: unique }, status: 'published' })
    .select(PUBLIC_SELECT)
    .populate('category', 'name slug')
    .lean();
}

export async function adminList(query) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const filter = {};
  const and = [];

  if (query.status) filter.status = query.status;
  if (query.q) {
    and.push({
      $or: [
        { name: new RegExp(query.q, 'i') },
        { sku: new RegExp(query.q, 'i') },
        { brand: new RegExp(query.q, 'i') },
      ],
    });
  }
  if (query.category) {
    and.push({ $or: [{ category: query.category }, { subcategory: query.category }] });
  }
  if (query.stock === 'out') {
    filter.$expr = { $lte: [{ $subtract: ['$stock', { $ifNull: ['$reservedStock', 0] }] }, 0] };
  } else if (query.stock === 'low') {
    filter.$expr = {
      $and: [
        { $gt: [{ $subtract: ['$stock', { $ifNull: ['$reservedStock', 0] }] }, 0] },
        { $lte: [{ $subtract: ['$stock', { $ifNull: ['$reservedStock', 0] }] }, { $ifNull: ['$lowStockThreshold', 5] }] },
      ],
    };
  } else if (query.stock === 'in') {
    filter.$expr = { $gt: [{ $subtract: ['$stock', { $ifNull: ['$reservedStock', 0] }] }, 0] };
  }
  if (and.length) filter.$and = and;

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).populate('category', 'name slug').lean(),
    Product.countDocuments(filter),
  ]);
  return paginated({ items, total, page, limit });
}

export async function adminGet(id) {
  const product = await Product.findById(id).populate('category').populate('subcategory');
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

export async function adminCreate(payload) {
  const slug = await uniqueSlug(Product, payload.slug || payload.name);
  return Product.create({ ...payload, slug });
}

export async function adminUpdate(id, payload) {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  if (payload.slug && payload.slug !== product.slug) {
    payload.slug = await uniqueSlug(Product, payload.slug, product._id);
  }
  if (payload.name && !payload.slug && !product.slug) {
    payload.slug = await uniqueSlug(Product, payload.name, product._id);
  }
  Object.assign(product, payload);
  await product.save();
  return product;
}

export async function adminRemove(id) {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  product.status = 'archived';
  await product.save();
  return product;
}

export async function adminBulk({ ids, action }) {
  if (action === 'delete') {
    await Product.updateMany({ _id: { $in: ids } }, { $set: { status: 'archived' } });
    return { updated: ids.length, action: 'archived' };
  }
  const status = action === 'publish' ? 'published' : action === 'unpublish' ? 'draft' : 'archived';
  await Product.updateMany({ _id: { $in: ids } }, { $set: { status } });
  return { updated: ids.length, action: status };
}
