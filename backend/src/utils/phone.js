/** Nepal-first phone matching: 10-digit local, +977, punctuation. */

export function phoneDigits(raw) {
  return String(raw || '').replace(/\D/g, '');
}

export function localPhoneDigits(raw) {
  let digits = phoneDigits(raw);
  if (digits.startsWith('977') && digits.length >= 13) digits = digits.slice(-10);
  return digits;
}

export function normalizePhone(raw) {
  const local = localPhoneDigits(raw);
  if (local.length === 10) return local;
  return String(raw || '').trim();
}

export function isNepalMobile(raw) {
  return localPhoneDigits(raw).length === 10;
}

export function phoneLookupVariants(raw) {
  const trimmed = String(raw || '').trim();
  const digits = phoneDigits(raw);
  const local = localPhoneDigits(raw);
  const set = new Set();
  if (trimmed) set.add(trimmed);
  if (digits) set.add(digits);
  if (local) {
    set.add(local);
    set.add(`+977${local}`);
    set.add(`+977-${local}`);
    set.add(`+977 ${local}`);
  }
  return [...set];
}
