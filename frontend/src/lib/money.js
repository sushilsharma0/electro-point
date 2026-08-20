const NPR = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NPR_COMPACT = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Integer paisa → NPR rupees number */
export function paisaToNpr(paisa) {
  const n = Number(paisa);
  if (!Number.isFinite(n)) return 0;
  return n / 100;
}

/** NPR rupees → integer paisa */
export function nprToPaisa(npr) {
  const n = Number(npr);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Display NPR from paisa, e.g. NPR 149,999.00 */
export function formatNpr(paisa, { compact = false } = {}) {
  const rupees = paisaToNpr(paisa);
  return compact ? NPR_COMPACT.format(rupees) : NPR.format(rupees);
}

export function formatNprNumber(paisa) {
  return paisaToNpr(paisa).toLocaleString('en-NP', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function discountPercent(pricePaisa, salePricePaisa) {
  const price = Number(pricePaisa);
  const sale = Number(salePricePaisa);
  if (!price || !sale || sale >= price) return 0;
  return Math.round(((price - sale) / price) * 100);
}

export function effectivePrice(product, variant) {
  const src = variant || product || {};
  const sale = src.salePricePaisa;
  const price = src.pricePaisa ?? product?.pricePaisa;
  if (sale != null && sale > 0 && sale < price) return sale;
  return price ?? 0;
}

export function listPrice(product, variant) {
  const src = variant || product || {};
  return src.pricePaisa ?? product?.pricePaisa ?? 0;
}
