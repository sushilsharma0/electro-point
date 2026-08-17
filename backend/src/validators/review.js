import { z } from 'zod';
import { body, objectId } from './common.js';

export const createReviewSchema = body({
  productId: objectId,
  orderId: objectId.optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(160).optional().default(''),
  body: z.string().trim().max(4000).optional().default(''),
});

export const adminReviewSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'hidden']).optional(),
    isFeatured: z.boolean().optional(),
  }),
  params: z.object({ id: objectId }),
  query: z.record(z.any()).optional().default({}),
});
