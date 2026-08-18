export const PLACEHOLDER_IMAGES = {
  laptop: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=80',
  phone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
  headphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
  watch: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
  camera: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
  monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1600&q=80',
  tablet: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80',
  earbuds: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=80',
  keyboard: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
  generic: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1600&q=80',
};

export function productImage(product, index = 0) {
  const images = product?.images;
  if (Array.isArray(images) && images[index]) {
    return images[index].url || images[index];
  }
  if (product?.thumbnail) return product.thumbnail;
  if (product?.image) return product.image;
  return PLACEHOLDER_IMAGES.generic;
}

export function productHoverImage(product) {
  const images = product?.images;
  if (Array.isArray(images) && images[1]) return images[1].url || images[1];
  return null;
}

export function availableStock(item) {
  const stock = Number(item?.stock ?? 0);
  const reserved = Number(item?.reservedStock ?? 0);
  return Math.max(0, stock - reserved);
}

export function stockLabel(item) {
  const avail = availableStock(item);
  const threshold = Number(item?.lowStockThreshold ?? 5);
  if (avail <= 0) return { text: 'Out of stock', tone: 'danger' };
  if (avail <= threshold) return { text: `Low stock — ${avail} left`, tone: 'warning' };
  return { text: 'In stock', tone: 'success' };
}

export function productBadge(product) {
  if (!product) return null;
  if (availableStock(product) > 0 && availableStock(product) <= (product.lowStockThreshold ?? 5)) {
    return { label: 'Low stock', tone: 'warning' };
  }
  if (product.flags?.isOnSale || (product.salePricePaisa && product.salePricePaisa < product.pricePaisa)) {
    return { label: 'Sale', tone: 'danger' };
  }
  if (product.visualMode === 'model3d') return { label: '3D', tone: 'accent' };
  if (product.flags?.isNewArrival) return { label: 'New', tone: 'accent' };
  if (product.flags?.isBestSeller) return { label: 'Best seller', tone: 'muted' };
  return null;
}

export function flattenCategories(tree, acc = []) {
  (tree || []).forEach((c) => {
    acc.push(c);
    if (c.children?.length) flattenCategories(c.children, acc);
  });
  return acc;
}

export function idOf(doc) {
  return doc?._id || doc?.id || '';
}

export function variantLabel(variant) {
  if (!variant) return '';
  if (variant.name) return variant.name;
  const opts = variant.options || {};
  return Object.values(opts).filter(Boolean).join(' · ');
}

export const DEFAULT_SETTINGS = {
  storeName: 'ElectroPoint',
  logo: '',
  announcementBar: {
    enabled: true,
    text: 'Official warranty on every device. Pay with eSewa or Khalti.',
  },
  contact: {
    email: 'xavier.y@example.org',
    phone: '+977-1-5900000',
    address: 'Durbar Marg, Kathmandu, Nepal',
  },
  social: {},
  currency: 'NPR',
  shipping: [
    { code: 'standard', name: 'Standard delivery', pricePaisa: 0, eta: '2–4 days inside Kathmandu' },
    { code: 'express', name: 'Express', pricePaisa: 25000, eta: 'Next day in ring road' },
  ],
  payments: { esewaEnabled: true, khaltiEnabled: true, codEnabled: true },
  seo: {
    title: 'ElectroPoint — Precision electronics',
    description: 'Professional electronics retailer in Nepal. Authentic devices, clear specs, eSewa and Khalti.',
  },
  footer: {},
  homepage: {
    hero: true,
    heroAutoplayMs: 6000,
  },
  heroProducts: [],
};
