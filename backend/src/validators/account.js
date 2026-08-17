import { z } from 'zod';
import { body, objectId } from './common.js';

export const updateProfileSchema = body({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(20).optional(),
});

export const addressSchema = body({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().max(80).optional().default(''),
  postalCode: z.string().trim().max(20).optional().default(''),
  country: z.string().trim().max(80).optional().default('Nepal'),
  isDefault: z.boolean().optional().default(false),
});

export const addressUpdateSchema = z.object({
  body: addressSchema.shape.body.partial(),
  params: z.object({ id: objectId }),
  query: z.record(z.any()).optional().default({}),
});
