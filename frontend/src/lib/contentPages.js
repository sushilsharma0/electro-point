export const DEFAULT_CONTENT_PAGES = {
  about: {
    kicker: 'About',
    headline: 'Built for people who read the spec sheet',
    intro:
      '{{storeName}} is a professional electronics store in Nepal. We sell authentic consumer devices with official warranty, prices in NPR, and checkout through eSewa, Khalti, or cash on delivery.',
    bodyTitle: 'What we sell',
    body: `Smartphones, laptops, desktops, monitors, audio, cameras, and accessories — specified clearly so you can compare before you buy. Categories, product photography, and homepage merchandising are controlled by the store admin. We do not invent stock, reviews, or analytics. If a number appears in the dashboard, it comes from the database.

Browse without an account. Sign in to check out, save a wishlist, write a review, or track an order. Compare up to four devices side by side using catalog specs: processor, memory, panel, battery, warranty.`,
    shopLabel: 'Shop devices',
    shopHref: '/shop',
    contactLabel: 'Contact',
    contactHref: '/contact',
    storeCardTitle: 'Store',
    paymentsText: 'eSewa · Khalti · Cash on delivery · Amounts in NPR',
    factsTitle: 'How we operate',
    facts: [
      { title: 'Official warranty', body: 'Every device is sold with manufacturer warranty. Serial numbers are recorded on paid orders.' },
      { title: 'Authentic stock', body: 'Sourced through authorized channels. Specs on the product page come from the catalog, not slogans.' },
      { title: 'Tracked delivery', body: 'Kathmandu express and nationwide standard. Rates and ETAs come from store settings.' },
      { title: 'Clear orders', body: 'Totals are calculated on the server. Tracking is written by staff when the parcel actually moves.' },
    ],
    policiesTitle: 'Policies',
    policiesIntro:
      'Sales are governed by our terms. Personal data is described in the privacy notice. Both apply when you create an account or place an order.',
    policiesLinks: [
      { label: 'Terms of sale', href: '/terms' },
      { label: 'Privacy notice', href: '/privacy' },
      { label: 'FAQ', href: '/faq' },
    ],
    seoTitle: 'About',
    seoDescription:
      '{{storeName}} is a professional electronics retailer in Nepal. Authentic devices, NPR pricing, eSewa, Khalti, and cash on delivery.',
  },
  terms: {
    kicker: 'Legal',
    title: 'Terms of sale',
    description:
      'Terms that apply when you buy from {{storeName}}: orders, NPR pricing, eSewa, Khalti, COD, warranty, and delivery.',
    updated: '20 August 2026',
    seoTitle: 'Terms of sale',
    seoDescription:
      'Terms that apply when you buy from {{storeName}}: orders, NPR pricing, eSewa, Khalti, COD, warranty, and delivery.',
    sections: [
      {
        id: 'agreement',
        title: '1. Agreement',
        body: `These terms govern browsing, accounts, and purchases on the {{storeName}} website. By placing an order you offer to buy the listed goods at the total quoted by our server at checkout. We accept that offer when the order is confirmed (paid online after gateway verification, or confirmed for cash on delivery).

Related rules are in the [privacy notice](/privacy). If you do not agree, do not create an account or complete checkout.`,
      },
      {
        id: 'catalog',
        title: '2. Catalog and pricing',
        body: `Product names, specifications, images, and stock come from the live catalog. Prices are in Nepalese rupees (NPR). The payable amount is calculated on the server from catalog prices, sale prices, shipping, tax, and any coupon. The browser cannot set the total.

We may correct obvious errors, withdraw an offer, or refuse an order if stock, price, or payment cannot be fulfilled. Coupons apply only to eligible items and may have minimums, dates, and usage limits.`,
      },
      {
        id: 'orders',
        title: '3. Orders',
        body: `You must provide accurate contact and delivery details. We may cancel an order that cannot be verified, that appears fraudulent, or that we cannot ship. Unpaid online orders may expire after the payment window set by the store.

You can follow status from Account → Orders or the public [track order](/track) page using the order number and the email used at checkout. Courier name and tracking number appear when staff record a shipment — they are not simulated.`,
      },
      {
        id: 'payment',
        title: '4. Payment',
        body: `We accept:

- eSewa, when enabled by the store
- Khalti, when enabled by the store
- Cash on delivery, when enabled by the store, collected when the order is delivered

Card and wallet credentials are processed by eSewa or Khalti. {{storeName}} does not store payment card numbers. Online orders are marked paid only after the official gateway status API confirms the charge. COD orders are confirmed immediately and remain payable on delivery.`,
      },
      {
        id: 'delivery',
        title: '5. Delivery and title',
        body: `Shipping methods, prices, and estimates are those published in store settings at checkout. Delivery times are estimates, not guarantees. Risk and title in the goods pass to you on delivery to the address on the order, unless we agree otherwise in writing.

You must inspect the parcel on arrival and report transit damage promptly through support.`,
      },
      {
        id: 'warranty',
        title: '6. Warranty and returns',
        body: `Manufacturer warranty applies as stated on the product and in the box. {{storeName}} records serial numbers on paid orders to support warranty claims. Warranty does not cover misuse, unauthorized repair, or consumable wear unless the manufacturer says otherwise.

Dead-on-arrival and eligible returns are handled through support. Keep the original packaging, accessories, and proof of purchase. Refunds, if approved, follow the original payment method where the gateway allows.`,
      },
      {
        id: 'accounts',
        title: '7. Accounts',
        body: 'You are responsible for the email and password on your account. We may suspend an account that abuses the site, posts false reviews, or is used for fraud. Reviews should reflect a genuine purchase where the store requires verified buyers.',
      },
      {
        id: 'liability',
        title: '8. Liability',
        body: `To the extent permitted by Nepal law, {{storeName}} is not liable for indirect or consequential loss, lost profits, or data loss arising from use of the site or delay in delivery. Nothing in these terms limits liability for fraud, personal injury caused by our negligence, or rights that cannot be excluded under consumer law.

Our total liability for a given order is limited to the amount you paid for that order.`,
      },
      {
        id: 'law',
        title: '9. Governing law',
        body: 'These terms are governed by the laws of Nepal. Courts in Kathmandu have jurisdiction, without limiting any mandatory consumer protections that apply to you.',
      },
      {
        id: 'contact',
        title: '10. Contact',
        body: `Questions about an order or these terms: [{{email}}](mailto:{{email}}) · [{{phone}}](tel:{{phone}})

{{address}}

See also [Contact](/contact) and [FAQ](/faq).`,
      },
    ],
  },
  privacy: {
    kicker: 'Legal',
    title: 'Privacy notice',
    description: 'How {{storeName}} collects and uses account, order, and technical data. We do not store payment cards.',
    updated: '20 August 2026',
    seoTitle: 'Privacy notice',
    seoDescription: 'How {{storeName}} collects and uses account, order, and technical data. We do not store payment cards.',
    sections: [
      {
        id: 'collect',
        title: '1. What we collect',
        body: `Depending on how you use the site, we may process:

- Account details: name, email, phone, password hash
- Delivery addresses and order history
- Wishlist, compare selections stored in your browser, and recently viewed products
- Reviews you submit, including rating and text
- Support messages you send through the contact form
- Technical logs needed to run the site (for example IP address on a request, session identifiers)

We do not require an account to browse the catalog.`,
      },
      {
        id: 'use',
        title: '2. How we use data',
        body: `We use personal data to:

- Create and secure your account
- Quote checkout totals, place orders, and record payments
- Ship goods and show order status and tracking written by staff
- Handle warranty, DOA, and support
- Show your wishlist, reviews, and order list when you are signed in
- Prevent fraud and keep the store running

We do not sell your personal data. We do not build advertising profiles from your orders.`,
      },
      {
        id: 'cookies',
        title: '3. Cookies and sessions',
        body: `Authentication uses HTTP-only cookies so scripts in the page cannot read the session token. We also use a CSRF cookie on state-changing requests. You can block cookies in the browser; checkout and account pages will not work without a session cookie.

Recently viewed products and compare lists may be stored in local browser storage on your device.`,
      },
      {
        id: 'payments',
        title: '4. Payments',
        body: `eSewa and Khalti process online payments. {{storeName}} does not store card numbers, wallet PINs, or gateway secrets in the storefront. We store order identifiers and payment status returned by those services so we can mark an order paid only after official confirmation.

Cash on delivery does not send card data. Amount due is the server-quoted total shown at checkout.`,
      },
      {
        id: 'share',
        title: '5. Sharing',
        body: `We share data only as needed to run the store:

- Payment gateways (eSewa, Khalti) to complete a charge you start
- Couriers, when we hand over a parcel and record a tracking number
- Authorities, if required by Nepal law

Staff with admin access can see orders and customer records required to fulfill and support those orders.`,
      },
      {
        id: 'keep',
        title: '6. Retention',
        body: 'We keep account and order records for as long as needed to fulfill purchases, warranty, accounting, and legal duties. You may ask us to close an account; we may retain invoices and order rows that we must keep by law.',
      },
      {
        id: 'rights',
        title: '7. Your rights',
        body: 'You may request access to the personal data we hold about you, correction of inaccurate details, or deletion where we are not required to keep it. Sign in to update profile and addresses, or email us. We may need to verify that the request comes from the account holder.',
      },
      {
        id: 'security',
        title: '8. Security',
        body: 'Passwords are stored as hashes, not plain text. Admin and customer sessions are separated. Payment secrets stay in server environment variables, not in the public settings form. No method of transmission over the internet is perfectly secure; we work to reduce risk, not to claim zero risk.',
      },
      {
        id: 'children',
        title: '9. Children',
        body: 'The store is intended for adults who can enter a purchase contract. We do not knowingly collect personal data from children. If you believe we have, contact us and we will delete it where the law allows.',
      },
      {
        id: 'contact',
        title: '10. Contact',
        body: `Privacy questions: [{{email}}](mailto:{{email}}) · [{{phone}}](tel:{{phone}})

{{address}}

See [Terms of sale](/terms) for how orders work, and [Contact](/contact) for general support.`,
      },
    ],
  },
  faq: {
    title: 'FAQ',
    seoTitle: 'FAQ',
    seoDescription: 'Accounts, pricing, payments, and order tracking for {{storeName}}.',
    items: [
      { q: 'Do I need an account to browse?', a: 'No. Login is required for checkout, orders, wishlist, and reviews.' },
      { q: 'How are prices calculated?', a: 'The server computes totals from catalog prices, shipping, tax, and coupons. The browser never sets the payable amount.' },
      { q: 'Which payments are supported?', a: 'eSewa, Khalti, and cash on delivery. Online payments are verified with the official status APIs before an order is marked paid. COD is confirmed immediately and collected when the order is delivered.' },
      { q: 'Is every product 3D?', a: 'No. The admin sets visual mode per product: images, 360 spin, or a GLB/GLTF model.' },
      { q: 'How do I track an order?', a: 'Open Track order in the footer, or Account → Orders. Enter the order number and the email used at checkout. Status, courier, and tracking number are written by staff when the parcel moves — they are not simulated.' },
    ],
  },
  contact: {
    kicker: '',
    headline: 'Contact',
    intro: '',
    seoTitle: 'Contact',
    seoDescription: 'Contact {{storeName}} in Nepal.',
  },
};

export const CONTENT_FORMAT_HINT =
  'Blank line starts a new paragraph. Start a line with - for a list. Links: [Privacy](/privacy). Tokens filled from Settings: {{storeName}} {{email}} {{phone}} {{address}}.';

export function mergeContentPages(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    about: mergeRecord(DEFAULT_CONTENT_PAGES.about, src.about, ['facts', 'policiesLinks']),
    terms: mergeRecord(DEFAULT_CONTENT_PAGES.terms, src.terms, ['sections']),
    privacy: mergeRecord(DEFAULT_CONTENT_PAGES.privacy, src.privacy, ['sections']),
    faq: mergeRecord(DEFAULT_CONTENT_PAGES.faq, src.faq, ['items']),
    contact: mergeRecord(DEFAULT_CONTENT_PAGES.contact, src.contact, []),
  };
}

function mergeRecord(defaults, raw, arrayKeys) {
  const next = { ...defaults, ...(raw && typeof raw === 'object' ? raw : {}) };
  for (const key of arrayKeys) {
    next[key] = Array.isArray(raw?.[key]) ? raw[key] : defaults[key];
  }
  return next;
}

export function contentVars(settings) {
  const contact = settings?.contact || {};
  return {
    storeName: settings?.storeName || 'ElectroPoint',
    email: contact.email || '',
    phone: contact.phone || '',
    address: contact.address || '',
  };
}

export function interpolate(text, vars) {
  if (!text) return '';
  return String(text).replace(/\{\{(storeName|email|phone|address)\}\}/g, (_, key) => vars?.[key] || '');
}

export function sectionAnchor(section, index) {
  const raw = String(section?.id || section?.title || `section-${index + 1}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return raw || `section-${index + 1}`;
}

export function isSafeHref(href) {
  if (!href) return false;
  if (href.startsWith('/') && !href.startsWith('//')) return true;
  if (href.startsWith('#')) return true;
  return /^(https?:|mailto:|tel:)/i.test(href);
}
