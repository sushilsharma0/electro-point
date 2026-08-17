import * as productService from '../services/productService.js';
import * as categoryService from '../services/categoryService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listProducts = asyncHandler(async (req, res) => {
  return ok(res, await productService.listPublic(req.query));
});

export const getProduct = asyncHandler(async (req, res) => {
  return ok(res, await productService.getBySlug(req.params.slug));
});

export const related = asyncHandler(async (req, res) => {
  return ok(res, await productService.related(req.params.id));
});

export const suggest = asyncHandler(async (req, res) => {
  return ok(res, await productService.suggest(req.query.q));
});

export const brands = asyncHandler(async (req, res) => {
  return ok(res, await productService.listBrands());
});

export const compare = asyncHandler(async (req, res) => {
  const ids = String(req.query.ids || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^[a-fA-F0-9]{24}$/.test(s));
  return ok(res, await productService.compare(ids));
});

export const listCategories = asyncHandler(async (req, res) => {
  return ok(res, await categoryService.tree({ activeOnly: true }));
});

export const getCategory = asyncHandler(async (req, res) => {
  return ok(res, await categoryService.getBySlug(req.params.slug));
});
