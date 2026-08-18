export class ApiError extends Error {
  constructor(message, { status = 500, code = 'ERROR', details = [], payload } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.payload = payload;
  }
}

export function getCookie(name) {
  if (typeof document === 'undefined') return '';
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

function toQuery(params) {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '' || value === false) return;
    if (Array.isArray(value)) {
      value.forEach((v) => sp.append(key, String(v)));
      return;
    }
    if (typeof value === 'object') {
      Object.entries(value).forEach(([k, v]) => {
        if (v != null && v !== '') sp.append(`${key}[${k}]`, String(v));
      });
      return;
    }
    sp.set(key, String(value));
  });
  const q = sp.toString();
  return q ? `?${q}` : '';
}

function unwrap(json) {
  if (json && typeof json === 'object' && 'data' in json) return json.data;
  return json;
}

let storefrontRefreshPromise = null;
let adminRefreshPromise = null;

function shouldAttemptRefresh(path) {
  if (path.includes('/refresh') || path.includes('/login') || path.includes('/logout') || path.includes('/register')) {
    return false;
  }
  if (path === '/auth/me' || path === '/auth/admin/me') return false;
  return true;
}

async function tryRefresh(audience = 'storefront') {
  const isAdmin = audience === 'admin';
  const bucket = isAdmin ? 'admin' : 'storefront';
  const url = isAdmin ? '/api/v1/auth/admin/refresh' : '/api/v1/auth/refresh';
  if (bucket === 'admin' && !adminRefreshPromise) {
    adminRefreshPromise = fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) throw new ApiError('Session expired', { status: res.status, code: 'UNAUTHORIZED' });
        return res;
      })
      .finally(() => {
        adminRefreshPromise = null;
      });
  }
  if (bucket === 'storefront' && !storefrontRefreshPromise) {
    storefrontRefreshPromise = fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) throw new ApiError('Session expired', { status: res.status, code: 'UNAUTHORIZED' });
        return res;
      })
      .finally(() => {
        storefrontRefreshPromise = null;
      });
  }
  return isAdmin ? adminRefreshPromise : storefrontRefreshPromise;
}

export async function api(path, { method = 'GET', body, params, headers = {}, signal, retry = true } = {}) {
  const url = `/api/v1${path}${toQuery(params)}`;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const verb = method.toUpperCase();
  const nextHeaders = { ...headers };

  if (!isForm && body != null && !nextHeaders['Content-Type']) {
    nextHeaders['Content-Type'] = 'application/json';
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(verb)) {
    const csrf = getCookie('ep_csrf');
    if (csrf) nextHeaders['X-CSRF-Token'] = csrf;
  }

  const res = await fetch(url, {
    method: verb,
    credentials: 'include',
    headers: nextHeaders,
    signal,
    body: body == null ? undefined : isForm ? body : JSON.stringify(body),
  });

  if (res.status === 401 && retry && shouldAttemptRefresh(path)) {
    try {
      await tryRefresh(path.startsWith('/admin') || path.startsWith('/auth/admin') ? 'admin' : 'storefront');
      return api(path, { method, body, params, headers, signal, retry: false });
    } catch {
      /* fall through */
    }
  }

  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { success: false, error: { message: text } };
    }
  }

  if (!res.ok || json?.success === false) {
    const err = json?.error || {};
    throw new ApiError(err.message || res.statusText || 'Request failed', {
      status: res.status,
      code: err.code || (res.status === 401 ? 'UNAUTHORIZED' : res.status === 403 ? 'FORBIDDEN' : 'ERROR'),
      details: err.details || [],
      payload: json,
    });
  }

  return unwrap(json);
}

export const authApi = {
  me: () => api('/auth/me'),
  login: (body) => api('/auth/login', { method: 'POST', body }),
  register: (body) => api('/auth/register', { method: 'POST', body }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  forgotPassword: (body) => api('/auth/forgot-password', { method: 'POST', body }),
  resetPassword: (body) => api('/auth/reset-password', { method: 'POST', body }),
  adminMe: () => api('/auth/admin/me'),
  adminLogin: (body) => api('/auth/admin/login', { method: 'POST', body }),
  adminLogout: () => api('/auth/admin/logout', { method: 'POST' }),
};

export const catalogApi = {
  products: (params) => api('/products', { params }),
  product: (slug) => api(`/products/${slug}`),
  related: (id) => api(`/products/${id}/related`),
  categories: () => api('/categories'),
  category: (slug) => api(`/categories/${slug}`),
  brands: () => api('/brands'),
  suggest: (q) => api('/search/suggest', { params: { q } }),
  compare: (ids) => api('/compare', { params: { ids: Array.isArray(ids) ? ids.join(',') : ids } }),
  settings: () => api('/settings'),
  reviews: (productId, params) => api(`/reviews/product/${productId}`, { params }),
  createReview: (body) => api('/reviews', { method: 'POST', body }),
};

export const cartApi = {
  get: () => api('/cart'),
  add: (body) => api('/cart/items', { method: 'POST', body }),
  updateItem: (itemId, body) => api(`/cart/items/${itemId}`, { method: 'PATCH', body }),
  removeItem: (itemId) => api(`/cart/items/${itemId}`, { method: 'DELETE' }),
  clear: () => api('/cart', { method: 'DELETE' }),
  applyCoupon: (code) => api('/cart/coupon', { method: 'POST', body: { code } }),
  removeCoupon: () => api('/cart/coupon', { method: 'DELETE' }),
};

export const wishlistApi = {
  get: () => api('/wishlist'),
  add: (productId) => api('/wishlist', { method: 'POST', body: { productId } }),
  remove: (productId) => api(`/wishlist/${productId}`, { method: 'DELETE' }),
  removeAlt: (productId) => api('/wishlist', { method: 'DELETE', body: { productId } }),
};

export const checkoutApi = {
  quote: (body) => api('/checkout/quote', { method: 'POST', body: body || {} }),
  createOrder: (body) => api('/orders', { method: 'POST', body }),
  myOrders: (params) => api('/orders', { params }),
  order: (id) => api(`/orders/${id}`),
  trackOrder: (body) => api('/orders/track', { method: 'POST', body }),
  initiateEsewa: (orderId) => api('/payments/esewa/initiate', { method: 'POST', body: { orderId } }),
  initiateKhalti: (orderId) => api('/payments/khalti/initiate', { method: 'POST', body: { orderId } }),
};

export const accountApi = {
  profile: () => api('/account/profile'),
  updateProfile: (body) => api('/account/profile', { method: 'PUT', body }),
  addresses: () => api('/account/addresses'),
  createAddress: (body) => api('/account/addresses', { method: 'POST', body }),
  updateAddress: (id, body) => api(`/account/addresses/${id}`, { method: 'PUT', body }),
  deleteAddress: (id) => api(`/account/addresses/${id}`, { method: 'DELETE' }),
  reviews: () => api('/account/reviews'),
};

export const adminApi = {
  analytics: (params) => api('/admin/analytics', { params }),
  products: (params) => api('/admin/products', { params }),
  product: (id) => api(`/admin/products/${id}`),
  createProduct: (body) => api('/admin/products', { method: 'POST', body }),
  updateProduct: (id, body) => api(`/admin/products/${id}`, { method: 'PATCH', body }),
  deleteProduct: (id) => api(`/admin/products/${id}`, { method: 'DELETE' }),
  categories: (params) => api('/admin/categories', { params }),
  createCategory: (body) => api('/admin/categories', { method: 'POST', body }),
  updateCategory: (id, body) => api(`/admin/categories/${id}`, { method: 'PATCH', body }),
  deleteCategory: (id) => api(`/admin/categories/${id}`, { method: 'DELETE' }),
  orders: (params) => api('/admin/orders', { params }),
  order: (id) => api(`/admin/orders/${id}`),
  updateOrder: (id, body) => api(`/admin/orders/${id}/status`, { method: 'PATCH', body }),
  customers: (params) => api('/admin/customers', { params }),
  customer: (id) => api(`/admin/customers/${id}`),
  updateCustomer: (id, body) => api(`/admin/customers/${id}`, { method: 'PATCH', body }),
  inventory: (params) => api('/admin/inventory', { params }),
  adjustInventory: (body) => api('/admin/inventory/adjust', { method: 'POST', body }),
  coupons: (params) => api('/admin/coupons', { params }),
  createCoupon: (body) => api('/admin/coupons', { method: 'POST', body }),
  updateCoupon: (id, body) => api(`/admin/coupons/${id}`, { method: 'PATCH', body }),
  deleteCoupon: (id) => api(`/admin/coupons/${id}`, { method: 'DELETE' }),
  reviews: (params) => api('/admin/reviews', { params }),
  updateReview: (id, body) => api(`/admin/reviews/${id}`, { method: 'PATCH', body }),
  payments: (params) => api('/admin/payments', { params }),
  settings: () => api('/admin/settings'),
  updateSettings: (body) => api('/admin/settings', { method: 'PUT', body }),
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api('/admin/uploads/image', { method: 'POST', body: fd });
  },
  uploadModel: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api('/admin/uploads/model3d', { method: 'POST', body: fd });
  },
};

export function listFrom(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.products)) return payload.products;
  if (Array.isArray(payload.categories)) return payload.categories;
  if (Array.isArray(payload.orders)) return payload.orders;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

export function metaFrom(payload, fallback = {}) {
  if (!payload || Array.isArray(payload)) {
    return { page: 1, limit: fallback.limit || 24, total: Array.isArray(payload) ? payload.length : 0, pages: 1 };
  }
  return {
    page: payload.page ?? payload.meta?.page ?? 1,
    limit: payload.limit ?? payload.meta?.limit ?? fallback.limit ?? 24,
    total: payload.total ?? payload.meta?.total ?? listFrom(payload).length,
    pages: payload.pages ?? payload.meta?.pages ?? payload.totalPages ?? 1,
    filters: payload.filters ?? payload.availableFilters ?? {},
  };
}
