/** All money is integer paisa. 1 NPR = 100 paisa. Never use floats for totals. */

export function paisaToNprString(paisa) {
  const n = Number(paisa) || 0;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const rupees = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}${rupees}.${String(remainder).padStart(2, '0')}`;
}

export function nprStringToPaisa(value) {
  const str = String(value).trim();
  const match = str.match(/^(-)?(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) {
    const num = Number(str);
    if (!Number.isFinite(num)) return 0;
    return Math.round(num * 100);
  }
  const sign = match[1] ? -1 : 1;
  const rupees = Number(match[2]);
  const fraction = (match[3] || '00').padEnd(2, '0');
  return sign * (rupees * 100 + Number(fraction));
}

export function parsePaisaAmount(value) {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  return nprStringToPaisa(value);
}

export function amountsMatchPaisa(gatewayAmount, orderPaisa) {
  const gatewayPaisa =
    typeof gatewayAmount === 'number' && Number.isInteger(gatewayAmount) && gatewayAmount > 99
      ? gatewayAmount
      : parsePaisaAmount(gatewayAmount);
  return gatewayPaisa === Number(orderPaisa);
}

export default { paisaToNprString, nprStringToPaisa, parsePaisaAmount, amountsMatchPaisa };
