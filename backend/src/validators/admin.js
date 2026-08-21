import { z } from 'zod';
import { body, objectId } from './common.js';

export const adminCouponSchema = body({
  code: z.string().trim().min(2).max(40),
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().min(0),
  minOrderPaisa: z.coerce.number().int().min(0).optional().default(0),
  maxDiscountPaisa: z.coerce.number().int().min(0).optional().nullable(),
  productIds: z.array(objectId).optional().default([]),
  categoryIds: z.array(objectId).optional().default([]),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  usageLimit: z.coerce.number().int().min(0).optional().nullable(),
  perCustomerLimit: z.coerce.number().int().min(0).optional().default(1),
  isActive: z.boolean().optional().default(true),
});

export const adminCouponUpdateSchema = z.object({
  body: adminCouponSchema.shape.body.partial(),
  params: z.object({ id: objectId }),
  query: z.record(z.any()).optional().default({}),
});

export const inventoryAdjustSchema = body({
  productId: objectId,
  variantId: objectId.optional().nullable(),
  qtyDelta: z.coerce.number().int().refine((n) => n !== 0, 'qtyDelta cannot be 0'),
  reason: z.string().trim().min(2).max(300),
  type: z.enum(['manual', 'restock', 'refund', 'correction', 'cancellation']).optional().default('manual'),
});

export const customerUpdateSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'suspended']).optional(),
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(20).optional(),
  }),
  params: z.object({ id: objectId }),
  query: z.record(z.any()).optional().default({}),
});

const contentFactSchema = z.object({
  title: z.string().trim().max(120).optional().default(''),
  body: z.string().trim().max(800).optional().default(''),
});

const contentSectionSchema = z.object({
  id: z.string().trim().max(80).optional().default(''),
  title: z.string().trim().max(160).optional().default(''),
  body: z.string().max(20000).optional().default(''),
});

const contentLinkSchema = z.object({
  label: z.string().trim().max(120).optional().default(''),
  href: z.string().trim().max(300).optional().default(''),
});

const contentPagesSchema = z.object({
  about: z
    .object({
      kicker: z.string().max(80).optional(),
      headline: z.string().max(200).optional(),
      intro: z.string().max(4000).optional(),
      bodyTitle: z.string().max(160).optional(),
      body: z.string().max(20000).optional(),
      shopLabel: z.string().max(80).optional(),
      shopHref: z.string().max(300).optional(),
      contactLabel: z.string().max(80).optional(),
      contactHref: z.string().max(300).optional(),
      storeCardTitle: z.string().max(80).optional(),
      paymentsText: z.string().max(200).optional(),
      factsTitle: z.string().max(160).optional(),
      facts: z.array(contentFactSchema).max(8).optional(),
      policiesTitle: z.string().max(160).optional(),
      policiesIntro: z.string().max(4000).optional(),
      policiesLinks: z.array(contentLinkSchema).max(12).optional(),
      seoTitle: z.string().max(160).optional(),
      seoDescription: z.string().max(320).optional(),
    })
    .optional(),
  terms: z
    .object({
      kicker: z.string().max(80).optional(),
      title: z.string().max(200).optional(),
      description: z.string().max(4000).optional(),
      updated: z.string().max(80).optional(),
      sections: z.array(contentSectionSchema).max(40).optional(),
      seoTitle: z.string().max(160).optional(),
      seoDescription: z.string().max(320).optional(),
    })
    .optional(),
  privacy: z
    .object({
      kicker: z.string().max(80).optional(),
      title: z.string().max(200).optional(),
      description: z.string().max(4000).optional(),
      updated: z.string().max(80).optional(),
      sections: z.array(contentSectionSchema).max(40).optional(),
      seoTitle: z.string().max(160).optional(),
      seoDescription: z.string().max(320).optional(),
    })
    .optional(),
  faq: z
    .object({
      title: z.string().max(200).optional(),
      items: z
        .array(
          z.object({
            q: z.string().trim().max(240).optional().default(''),
            a: z.string().max(8000).optional().default(''),
          }),
        )
        .max(40)
        .optional(),
      seoTitle: z.string().max(160).optional(),
      seoDescription: z.string().max(320).optional(),
    })
    .optional(),
  contact: z
    .object({
      kicker: z.string().max(80).optional(),
      headline: z.string().max(200).optional(),
      intro: z.string().max(4000).optional(),
      seoTitle: z.string().max(160).optional(),
      seoDescription: z.string().max(320).optional(),
    })
    .optional(),
});

export const settingsUpdateSchema = body({
  storeName: z.string().trim().max(80).optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  contact: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  social: z.record(z.string()).optional(),
  currency: z.literal('NPR').optional(),
  shipping: z
    .array(
      z.object({
        code: z.string().trim().min(1).max(40),
        name: z.string().trim().min(1).max(80),
        pricePaisa: z.coerce.number().int().min(0),
        eta: z.string().trim().max(80).optional().default(''),
      }),
    )
    .min(1)
    .max(12)
    .optional(),
  countryCodes: z
    .array(
      z.object({
        dial: z.string().trim().min(1).max(4),
        label: z.string().trim().min(1).max(80),
        iso: z.string().trim().max(2).optional().default(''),
      }),
    )
    .min(1)
    .max(20)
    .optional(),
  taxPercent: z.coerce.number().min(0).max(100).optional(),
  payments: z
    .object({
      esewaEnabled: z.boolean().optional(),
      khaltiEnabled: z.boolean().optional(),
      codEnabled: z.boolean().optional(),
      esewaProductCode: z.string().max(80).optional(),
    })
    .optional(),
  order: z
    .object({
      paymentTimeoutMinutes: z.coerce.number().int().min(5).max(1440).optional(),
      autoConfirmOnPaid: z.boolean().optional(),
    })
    .optional(),
  inventory: z
    .object({
      lowStockThresholdDefault: z.coerce.number().int().min(0).optional(),
      allowBackorder: z.boolean().optional(),
    })
    .optional(),
  review: z
    .object({
      autoApprove: z.boolean().optional(),
      requireVerifiedPurchase: z.boolean().optional(),
    })
    .optional(),
  seo: z
    .object({
      title: z.string().max(160).optional(),
      description: z.string().max(320).optional(),
      ogImage: z.string().optional(),
    })
    .optional(),
  homepage: z
    .object({
      hero: z.boolean().optional(),
      featuredCategories: z.boolean().optional(),
      bestSellers: z.boolean().optional(),
      newArrivals: z.boolean().optional(),
      showcase3d: z.boolean().optional(),
      specialOffers: z.boolean().optional(),
      brands: z.boolean().optional(),
      reviews: z.boolean().optional(),
      heroProductIds: z.array(objectId).max(8).optional(),
      heroAutoplayMs: z.coerce.number().int().min(2500).max(30000).optional(),
    })
    .optional(),
  footer: z
    .object({
      html: z.string().max(20000).optional(),
      text: z.string().max(2000).optional(),
    })
    .optional(),
  announcementBar: z
    .object({
      enabled: z.boolean().optional(),
      text: z.string().max(300).optional(),
      link: z.string().max(300).optional(),
    })
    .optional(),
  homepagePopups: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(40),
        enabled: z.boolean().optional(),
        kicker: z.string().max(80).optional().default(''),
        title: z.string().max(120).optional().default(''),
        body: z.string().max(2000).optional().default(''),
        images: z.array(z.string().trim().max(500)).max(8).optional().default([]),
        ctaLabel: z.string().max(40).optional().default(''),
        ctaHref: z.string().max(300).optional().default(''),
        includeSaleProducts: z.boolean().optional(),
        productIds: z.array(objectId).max(8).optional().default([]),
        couponCodes: z.array(z.string().trim().max(40)).max(8).optional().default([]),
        delayMs: z.coerce.number().int().min(0).max(15000).optional(),
        frequency: z.enum(['once', 'daily', 'always']).optional(),
        sort: z.coerce.number().int().optional(),
      }),
    )
    .max(8)
    .optional(),
  contentPages: contentPagesSchema.optional(),
  maintenanceMode: z.boolean().optional(),
});
