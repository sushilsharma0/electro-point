import { getStoreSettings } from './pricingService.js';

export async function publicSettings() {
  const s = await getStoreSettings();
  return {
    storeName: s.storeName,
    logo: s.logo,
    favicon: s.favicon,
    contact: s.contact,
    social: s.social,
    currency: s.currency,
    shipping: s.shipping,
    taxPercent: s.taxPercent,
    payments: {
      esewaEnabled: s.payments?.esewaEnabled !== false,
      khaltiEnabled: s.payments?.khaltiEnabled !== false,
      codEnabled: s.payments?.codEnabled !== false,
    },
    seo: s.seo,
    homepage: s.homepage,
    footer: s.footer,
    announcementBar: s.announcementBar,
    maintenanceMode: s.maintenanceMode,
  };
}

export async function adminGet() {
  const s = await getStoreSettings();
  const json = s.toObject();
  return json;
}

export async function adminUpdate(payload) {
  const s = await getStoreSettings();
  const forbidden = ['ESEWA_SECRET', 'KHALTI_SECRET_KEY', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  for (const key of forbidden) {
    if (key in (payload || {}) || key in (payload?.payments || {})) {
      delete payload[key];
      if (payload.payments) delete payload.payments[key];
    }
  }
  if (payload.payments) {
    const { esewaEnabled, khaltiEnabled, codEnabled, esewaProductCode } = payload.payments;
    payload.payments = {
      ...s.payments.toObject?.() || s.payments,
      ...(esewaEnabled != null ? { esewaEnabled } : {}),
      ...(khaltiEnabled != null ? { khaltiEnabled } : {}),
      ...(codEnabled != null ? { codEnabled } : {}),
      ...(esewaProductCode != null ? { esewaProductCode } : {}),
    };
  }
  Object.assign(s, payload);
  await s.save();
  return adminGet();
}
