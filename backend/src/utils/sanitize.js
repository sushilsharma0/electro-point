const DANGEROUS_KEY = /^\$/;
const DOT_KEY = /\./;

export function isSafeKey(key) {
  if (typeof key !== 'string' || !key) return false;
  if (DANGEROUS_KEY.test(key) || DOT_KEY.test(key) || key === '__proto__' || key === 'prototype' || key === 'constructor') {
    return false;
  }
  return true;
}

export function sanitizeKeys(value, depth = 0) {
  if (depth > 12 || value == null) return value;
  if (Array.isArray(value)) return value.map((v) => sanitizeKeys(v, depth + 1));
  if (typeof value !== 'object') return value;
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (!isSafeKey(key)) continue;
    out[key] = sanitizeKeys(val, depth + 1);
  }
  return out;
}

export function stripMongoOperators(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = sanitizeKeys(req.body);
  if (req.query && typeof req.query === 'object') req.query = sanitizeKeys(req.query);
  if (req.params && typeof req.params === 'object') req.params = sanitizeKeys(req.params);
  next();
}
