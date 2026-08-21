import mongoose from 'mongoose';
import { getStoreSettings } from './pricingService.js';
import { Product } from '../models/Product.js';

const HERO_SELECT = 'name slug brand shortDescription pricePaisa salePricePaisa images thumbnail specGroups';

async function hydrateHeroProducts(ids) {
  const ordered = [...new Set((ids || []).map(String).filter((id) => mongoose.isValidObjectId(id)))].slice(0, 8);
  if (!ordered.length) return [];
  const products = await Product.find({ _id: { $in: ordered }, status: 'published' })
    .select(HERO_SELECT)
    .lean();
  const map = new Map(products.map((p) => [String(p._id), p]));
  return ordered.map((id) => map.get(id)).filter(Boolean);
}

export async function publicSettings() {
  const s = await getStoreSettings();
  const homepage = s.homepage?.toObject?.() || s.homepage || {};
  const heroProducts = await hydrateHeroProducts(homepage.heroProductIds);
  return {
    storeName: s.storeName,
    logo: s.logo,
    favicon: s.favicon,
    contact: s.contact,
    social: s.social,
    currency: s.currency,
    shipping: s.shipping,
    taxPercent: s.taxPercent,
    payments: {
      esewaEnabled: s.payments?.esewaEnabled !== false,
      khaltiEnabled: s.payments?.khaltiEnabled !== false,
      codEnabled: s.payments?.codEnabled !== false,
    },
    seo: s.seo,
    homepage: {
      hero: homepage.hero !== false,
      featuredCategories: homepage.featuredCategories !== false,
      bestSellers: homepage.bestSellers !== false,
      newArrivals: homepage.newArrivals !== false,
      showcase3d: homepage.showcase3d !== false,
      specialOffers: homepage.specialOffers !== false,
      brands: homepage.brands !== false,
      reviews: homepage.reviews !== false,
      heroAutoplayMs: homepage.heroAutoplayMs || 6000,
    },
    heroProducts,
    footer: s.footer,
    announcementBar: s.announcementBar,
    contentPages: s.contentPages || {},
    maintenanceMode: s.maintenanceMode,
  };
}

export async function adminGet() {
  const s = await getStoreSettings();
  const json = s.toObject();
  if (json.homepage?.heroProductIds) {
    json.homepage.heroProductIds = json.homepage.heroProductIds.map(String);
  } else if (json.homepage) {
    json.homepage.heroProductIds = [];
  }
  json.heroProducts = await hydrateHeroProducts(json.homepage?.heroProductIds);
  return json;
}

export async function adminUpdate(payload) {
  const s = await getStoreSettings();
  const forbidden = ['ESEWA_SECRET', 'KHALTI_SECRET_KEY', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  for (const key of forbidden) {
    if (key in (payload || {}) || key in (payload?.payments || {})) {
      delete payload[key];
      if (payload.payments) delete payload.payments[key];
    }
  }
  if (payload.payments) {
    const { esewaEnabled, khaltiEnabled, codEnabled, esewaProductCode } = payload.payments;
    payload.payments = {
      ...s.payments.toObject?.() || s.payments,
      ...(esewaEnabled != null ? { esewaEnabled } : {}),
      ...(khaltiEnabled != null ? { khaltiEnabled } : {}),
      ...(codEnabled != null ? { codEnabled } : {}),
      ...(esewaProductCode != null ? { esewaProductCode } : {}),
    };
  }
  if (payload.homepage) {
    const current = s.homepage?.toObject?.() || s.homepage || {};
    const next = { ...current, ...payload.homepage };
    if (Array.isArray(next.heroProductIds)) {
      next.heroProductIds = [...new Set(next.heroProductIds.map(String))].slice(0, 8);
    }
    payload.homepage = next;
  }
  delete payload.heroProducts;
  if (Array.isArray(payload.shipping)) {
    payload.shipping = payload.shipping.map((row) => ({
      code: String(row.code || '').trim(),
      name: String(row.name || '').trim(),
      pricePaisa: Math.max(0, Math.round(Number(row.pricePaisa) || 0)),
      eta: String(row.eta || '').trim(),
    }));
  }
  if (payload.contentPages && typeof payload.contentPages === 'object') {
    const current = s.contentPages && typeof s.contentPages === 'object' ? s.contentPages : {};
    payload.contentPages = { ...current, ...payload.contentPages };
  }
  Object.assign(s, payload);
  if (payload.homepage) s.markModified('homepage');
  if (payload.shipping) s.markModified('shipping');
  if (payload.contentPages) s.markModified('contentPages');
  await s.save();
  return adminGet();
}
