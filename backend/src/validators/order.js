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
  paymentMethod: z.enum(['esewa', 'khalti']),
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

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
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
    ]),
    note: z.string().max(500).optional().default(''),
  }),
  params: z.object({ id: objectId }),
  query: z.record(z.any()).optional().default({}),
});

export const idParamSchema = params({ id: objectId });
