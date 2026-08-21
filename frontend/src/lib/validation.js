/** Matches backend/src/validators/auth.js password rules. */
export const PASSWORD_HINT = 'At least 8 characters, with uppercase, lowercase, and a number.';

export function nepalMobileDigits(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('977') && digits.length >= 13) digits = digits.slice(-10);
  return digits;
}

export function nepalMobileSchema(z, message = 'Enter a 10-digit mobile number') {
  return z
    .string({ required_error: 'Mobile number is required' })
    .trim()
    .min(1, 'Mobile number is required')
    .max(20)
    .refine((value) => nepalMobileDigits(value).length === 10, message);
}

export function passwordSchema(z) {
  return z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[0-9]/, 'Password must include a number');
}

/** Map API `details[].path` (e.g. body.password) onto react-hook-form fields. */
export function applyApiFieldErrors(setError, err) {
  const details = Array.isArray(err?.details) ? err.details : [];
  let mapped = false;
  details.forEach((item) => {
    const path = String(item.path || '').replace(/^body\./, '').split('.')[0];
    if (!path || !item.message) return;
    setError(path, { type: 'server', message: item.message });
    mapped = true;
  });
  return mapped;
}

export function apiErrorMessage(err, fallback = 'Request failed') {
  const first = err?.details?.find((d) => d?.message)?.message;
  if (first && err?.message === 'Invalid request') return first;
  return err?.message || fallback;
}
