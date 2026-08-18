import { z } from 'zod';
import { body, objectId, paginationQuery, params } from './common.js';

export const checkoutQuoteSchema = body({
  shippingMethod: z.string().trim().max(40).optional(),
  couponCode: z.string().trim().max(40).optional(),
  addressId: objectId.optional(),
});

export const createOrderSchema = body({
  addressId: objectId,
  shippingMethod: z.string().trim().min(1).max(40),
  paymentMethod: z.enum(['esewa', 'khalti', 'cod']),
  phone: z.string().trim().min(7).max(20).optional(),
  email: z.string().trim().email().optional(),
  totalPaisa: z.any().optional(),
  items: z.any().optional(),
  status: z.any().optional(),
});

export const initiatePaymentSchema = body({
  orderId: objectId,
});

export const orderListQuerySchema = z.object({
  body: z.any().optional(),
  query: z.object({
    status: z.string().optional(),
    q: z.string().optional(),
    page: paginationQuery.page,
    limit: paginationQuery.limit,
  }),
  params: z.record(z.any()).optional().default({}),
});

const trackingPayload = z
  .object({
    carrier: z.string().trim().max(80).optional(),
    trackingNumber: z.string().trim().max(80).optional(),
    trackingUrl: z
      .string()
      .trim()
      .max(500)
      .optional()
      .refine((s) => !s || /^https?:\/\//i.test(s), 'Tracking URL must start with http:// or https://'),
    estimatedDelivery: z.preprocess(
      (v) => (v === '' || v == null ? null : v),
      z.coerce.date().nullable().optional(),
    ),
    lastLocation: z.string().trim().max(200).optional(),
  })
  .optional();

export const updateOrderStatusSchema = z.object({
  body: z
    .object({
      status: z
        .enum([
          'pending',
          'payment_pending',
          'paid',
          'confirmed',
          'processing',
          'packed',
          'shipped',
          'out_for_delivery',
          'delivered',
          'cancelled',
          'payment_failed',
          'refunded',
        ])
        .optional(),
      note: z.string().max(500).optional().default(''),
      tracking: trackingPayload,
    })
    .refine((payload) => Boolean(payload.status || payload.tracking || payload.note), {
      message: 'Provide a status, tracking details, or a note',
    }),
  params: z.object({ id: objectId }),
  query: z.record(z.any()).optional().default({}),
});

export const trackOrderSchema = body({
  orderNumber: z.string().trim().min(6).max(40),
  email: z.string().trim().email(),
});

export const idParamSchema = params({ id: objectId });
