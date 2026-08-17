import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function khaltiBaseUrl() {
  return env.KHALTI_ENV === 'production' ? 'https://khalti.com' : 'https://dev.khalti.com';
}

function authHeaders() {
  if (!env.KHALTI_SECRET_KEY) {
    throw ApiError.unavailable('Khalti is not configured');
  }
  return {
    Authorization: `Key ${env.KHALTI_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function initiateKhaltiPayment(payload) {
  const res = await fetch(`${khaltiBaseUrl()}/api/v2/epayment/initiate/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw ApiError.unprocessable(data.detail || data.error_key || 'Khalti initiate failed');
  }
  return data;
}

export async function lookupKhaltiPayment(pidx) {
  const res = await fetch(`${khaltiBaseUrl()}/api/v2/epayment/lookup/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ pidx }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw ApiError.unprocessable(data.detail || 'Khalti lookup failed');
  }
  return data;
}

export function khaltiIsCompleted(lookup) {
  return String(lookup?.status || '') === 'Completed';
}

export function khaltiAmountMatches(lookup, orderPaisa) {
  return Number(lookup?.total_amount) === Number(orderPaisa);
}
