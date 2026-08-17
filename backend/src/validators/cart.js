import { z } from 'zod';
import { body, objectId, params } from './common.js';

export const addCartItemSchema = body({
  productId: objectId,
  variantId: objectId.optional().nullable(),
  qty: z.coerce.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    qty: z.coerce.number().int().min(0).max(99),
  }),
  params: z.object({ itemId: objectId }),
  query: z.record(z.any()).optional().default({}),
});

export const cartItemParamsSchema = params({ itemId: objectId });

export const replaceCartSchema = body({
  items: z
    .array(
      z.object({
        productId: objectId,
        variantId: objectId.optional().nullable(),
        qty: z.coerce.number().int().min(1).max(99),
      }),
    )
    .max(50),
});

export const applyCouponSchema = body({
  code: z.string().trim().min(2).max(40),
});

export const wishlistSchema = body({
  productId: objectId,
});
