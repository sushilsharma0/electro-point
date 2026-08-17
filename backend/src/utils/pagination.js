export function parsePagination(query, { defaultLimit = 24, maxLimit = 100 } = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginated({ items, total, page, limit }) {
  return {
    items,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 0,
  };
}
