/** Admin-managed dial codes. Login matches the national number only. */

export const DEFAULT_COUNTRY_CODES = [{ dial: '977', label: 'Nepal', iso: 'NP' }];

export function phoneDigits(raw) {
  return String(raw || '').replace(/\D/g, '');
}

export function normalizeDial(raw) {
  return phoneDigits(raw).slice(0, 4);
}

export function sanitizeCountryCodes(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows || []) {
    const dial = normalizeDial(row.dial || row.code);
    if (dial.length < 1 || seen.has(dial)) continue;
    seen.add(dial);
    const iso = String(row.iso || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 2);
    out.push({
      dial,
      label: String(row.label || row.name || '').trim().slice(0, 80) || `+${dial}`,
      iso,
    });
    if (out.length >= 20) break;
  }
  return out;
}

export function countryCodesOrDefault(rows) {
  const list = sanitizeCountryCodes(rows);
  return list.length ? list : DEFAULT_COUNTRY_CODES.map((row) => ({ ...row }));
}

export function dialList(rows) {
  return countryCodesOrDefault(rows).map((row) => row.dial);
}

export function nationalNumber(raw, dialOrDials) {
  let digits = phoneDigits(raw);
  const dials = (Array.isArray(dialOrDials) ? dialOrDials : [dialOrDials])
    .map(normalizeDial)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  for (const dial of dials) {
    if (digits.startsWith(dial) && digits.length - dial.length >= 7) {
      digits = digits.slice(dial.length);
      break;
    }
  }
  if (digits.startsWith('0') && digits.length >= 8) digits = digits.replace(/^0+/, '');
  return digits;
}

export function localPhoneDigits(raw, dials) {
  return nationalNumber(raw, dials && dials.length ? dials : ['977']);
}

export function isNationalMobile(raw, dial) {
  const n = nationalNumber(raw, dial);
  return n.length >= 7 && n.length <= 15;
}

export function isNepalMobile(raw) {
  return isNationalMobile(raw, '977');
}

export function normalizePhone(raw, dial) {
  const n = nationalNumber(raw, dial);
  if (n.length >= 7 && n.length <= 15) return n;
  return String(raw || '').trim();
}

export function phoneLookupVariants(raw, dials = ['977']) {
  const trimmed = String(raw || '').trim();
  const digits = phoneDigits(raw);
  const local = nationalNumber(raw, dials);
  const set = new Set();
  if (trimmed) set.add(trimmed);
  if (digits) set.add(digits);
  if (local) {
    set.add(local);
    for (const dial of (dials || []).map(normalizeDial).filter(Boolean)) {
      set.add(`${dial}${local}`);
      set.add(`+${dial}${local}`);
      set.add(`+${dial}-${local}`);
      set.add(`+${dial} ${local}`);
    }
  }
  return [...set];
}
