import { z } from 'zod';
import { body, objectId } from './common.js';

export const adminCategorySchema = body({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().max(80).optional(),
  parent: objectId.optional().nullable(),
  image: z.string().optional().default(''),
  icon: z.string().optional().default(''),
  banner: z.string().optional().default(''),
  description: z.string().max(4000).optional().default(''),
  seoTitle: z.string().max(160).optional().default(''),
  seoDescription: z.string().max(320).optional().default(''),
  displayOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  showOnHomepage: z.boolean().optional().default(false),
});

export const adminCategoryUpdateSchema = z.object({
  body: adminCategorySchema.shape.body.partial(),
  params: z.object({ id: objectId }),
  query: z.record(z.any()).optional().default({}),
});

export const reorderCategoriesSchema = body({
  items: z.array(z.object({ id: objectId, displayOrder: z.number().int() })).min(1),
});
