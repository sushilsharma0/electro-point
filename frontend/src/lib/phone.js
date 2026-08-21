export const DEFAULT_COUNTRY_CODES = [{ dial: '977', label: 'Nepal', iso: 'NP' }];

export function phoneDigits(raw) {
  return String(raw || '').replace(/\D/g, '');
}

export function normalizeDial(raw) {
  return phoneDigits(raw).slice(0, 4);
}

export function formatDial(raw) {
  const dial = normalizeDial(raw);
  return dial ? `+${dial}` : '';
}

export function nationalNumber(raw, dial) {
  let digits = phoneDigits(raw);
  const code = normalizeDial(dial);
  if (code && digits.startsWith(code) && digits.length - code.length >= 7) {
    digits = digits.slice(code.length);
  }
  if (digits.startsWith('0') && digits.length >= 8) digits = digits.replace(/^0+/, '');
  return digits;
}

export function isNationalMobile(raw, dial) {
  const n = nationalNumber(raw, dial);
  return n.length >= 7 && n.length <= 15;
}

export function formatStoredPhone(user) {
  if (!user?.phone) return '';
  if (user.countryCode) return `${formatDial(user.countryCode)} ${user.phone}`;
  return user.phone;
}
