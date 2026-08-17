const KEY = 'ep_recently_viewed';
const MAX = 12;

export function getRecentlyViewed() {
  try {
    const raw = localStorage.getItem(KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(id) {
  if (!id) return getRecentlyViewed();
  const next = [String(id), ...getRecentlyViewed().filter((x) => String(x) !== String(id))].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}

const SEARCH_KEY = 'ep_recent_searches';

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(SEARCH_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(q) {
  const term = String(q || '').trim();
  if (!term) return getRecentSearches();
  const next = [term, ...getRecentSearches().filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, 8);
  try {
    localStorage.setItem(SEARCH_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}

const COMPARE_KEY = 'ep_compare';

export function getCompareIds() {
  try {
    const raw = localStorage.getItem(COMPARE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function setCompareIds(ids) {
  const next = [...new Set(ids.map(String))].slice(0, 4);
  try {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}
