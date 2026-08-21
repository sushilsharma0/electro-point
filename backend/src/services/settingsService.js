import mongoose from 'mongoose';
import { getStoreSettings, couponEligibilityError } from './pricingService.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { paisaToNprString } from '../utils/money.js';

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
    homepagePopups: await publicHomepagePopups(s.homepagePopups),
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
  json.homepagePopups = await Promise.all(
    (json.homepagePopups || []).map(async (row) => {
      const productIds = (row.productIds || []).map(String);
      return {
        ...row,
        id: row.id,
        productIds,
        products: await hydrateHeroProducts(productIds),
      };
    }),
  );
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
  if (Array.isArray(payload.homepagePopups)) {
    payload.homepagePopups = sanitizeHomepagePopups(payload.homepagePopups);
  }
  if (payload.contentPages && typeof payload.contentPages === 'object') {
    const current = s.contentPages && typeof s.contentPages === 'object' ? s.contentPages : {};
    payload.contentPages = { ...current, ...payload.contentPages };
  }
  Object.assign(s, payload);
  if (payload.homepage) s.markModified('homepage');
  if (payload.shipping) s.markModified('shipping');
  if (payload.homepagePopups) s.markModified('homepagePopups');
  if (payload.contentPages) s.markModified('contentPages');
  await s.save();
  return adminGet();
}

function safeMediaUrl(url) {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('/uploads/')) return u.slice(0, 500);
  if (u.startsWith('https://')) return u.slice(0, 500);
  return '';
}

function safeHref(href) {
  const u = String(href || '').trim();
  if (!u) return '';
  if (u.startsWith('/')) return u.slice(0, 300);
  if (u.startsWith('https://')) return u.slice(0, 300);
  return '';
}

function sanitizeHomepagePopups(rows) {
  const seen = new Set();
  return (rows || []).slice(0, 8).map((row, index) => {
    let id = String(row.id || `p_${index + 1}`).trim().slice(0, 40);
    if (!id || seen.has(id)) id = `p_${Date.now().toString(36)}_${index}`;
    seen.add(id);
    const codes = [...new Set((row.couponCodes || []).map((c) => String(c).trim().toUpperCase()).filter(Boolean))].slice(0, 8);
    const productIds = [...new Set((row.productIds || []).map(String).filter((id) => mongoose.isValidObjectId(id)))].slice(0, 8);
    return {
      id,
      enabled: row.enabled !== false,
      kicker: String(row.kicker || '').trim().slice(0, 80),
      title: String(row.title || '').trim().slice(0, 120),
      body: String(row.body || '').trim().slice(0, 2000),
      images: (row.images || []).map(safeMediaUrl).filter(Boolean).slice(0, 8),
      ctaLabel: String(row.ctaLabel || '').trim().slice(0, 40),
      ctaHref: safeHref(row.ctaHref),
      productIds,
      couponCodes: codes,
      delayMs: Math.min(15000, Math.max(0, Math.round(Number(row.delayMs) || 600))),
      frequency: ['once', 'daily', 'always'].includes(row.frequency) ? row.frequency : 'once',
      sort: Number.isFinite(Number(row.sort)) ? Number(row.sort) : index * 10,
    };
  });
}

function couponPublicLabel(coupon) {
  if (coupon.type === 'percent') return `${coupon.value}% off`;
  return `NPR ${paisaToNprString(coupon.value)} off`;
}

async function publicHomepagePopups(raw) {
  const list = sanitizeHomepagePopups(raw);
  const enabled = list.filter((p) => p.enabled).sort((a, b) => a.sort - b.sort);
  const codes = [...new Set(enabled.flatMap((p) => p.couponCodes))];
  const found = codes.length ? await Coupon.find({ code: { $in: codes } }).lean() : [];
  const now = new Date();
  const byCode = new Map();
  for (const coupon of found) {
    if (couponEligibilityError(coupon, { now })) continue;
    byCode.set(coupon.code, { code: coupon.code, label: couponPublicLabel(coupon) });
  }
  const withProducts = await Promise.all(
    enabled.map(async (p) => {
      const products = await hydrateHeroProducts(p.productIds);
      return {
        id: p.id,
        kicker: p.kicker,
        title: p.title,
        body: p.body,
        images: p.images,
        ctaLabel: p.ctaLabel,
        ctaHref: p.ctaHref,
        products,
        coupons: p.couponCodes.map((code) => byCode.get(code)).filter(Boolean),
        delayMs: p.delayMs,
        frequency: p.frequency,
      };
    }),
  );
  return withProducts.filter((p) => p.title || p.body || p.images.length || p.products.length || p.coupons.length);
}
