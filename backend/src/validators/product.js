import { z } from 'zod';
import { body, objectId, paginationQuery, params, query } from './common.js';

export const productListSchema = query({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  brand: z.string().trim().max(80).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  inStock: z.enum(['true', 'false', '1', '0']).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'rating', 'name', 'featured', 'bestseller']).optional(),
  page: paginationQuery.page,
  limit: paginationQuery.limit,
  featured: z.enum(['true', 'false']).optional(),
  bestSeller: z.enum(['true', 'false']).optional(),
  newArrival: z.enum(['true', 'false']).optional(),
  onSale: z.enum(['true', 'false']).optional(),
  filters: z.record(z.string()).optional(),
});

export const slugParamsSchema = params({ slug: z.string().trim().min(1).max(120) });
export const idParamsSchema = params({ id: objectId });
export const productIdParamsSchema = params({ productId: objectId });

export const suggestSchema = query({
  q: z.string().trim().min(1).max(80),
});

export const compareSchema = query({
  ids: z.string().min(1).max(200),
});

export const adminProductCreateSchema = body({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().max(80).optional(),
  brand: z.string().trim().min(1).max(80),
  sku: z.string().trim().min(1).max(80),
  category: objectId,
  subcategory: objectId.optional().nullable(),
  description: z.string().max(20000).optional().default(''),
  shortDescription: z.string().max(500).optional().default(''),
  pricePaisa: z.coerce.number().int().min(0),
  salePricePaisa: z.coerce.number().int().min(0).optional().nullable(),
  costPricePaisa: z.coerce.number().int().min(0).optional().default(0),
  stock: z.coerce.number().int().min(0).optional().default(0),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(5),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        alt: z.string().optional().default(''),
        isPrimary: z.boolean().optional().default(false),
        sort: z.number().optional().default(0),
      }),
    )
    .optional()
    .default([]),
  thumbnail: z.string().optional().default(''),
  visualMode: z.enum(['images', 'spin360', 'model3d']).optional().default('images'),
  spinImages: z.array(z.string()).optional().default([]),
  model3d: z
    .object({
      url: z.string().optional().default(''),
      format: z.enum(['glb', 'gltf', '']).optional().default(''),
    })
    .optional(),
  specGroups: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        sort: z.number().optional().default(0),
        fields: z.array(
          z.object({
            key: z.string().trim().min(1),
            label: z.string().trim().min(1),
            value: z.string().trim().min(1),
            filterable: z.boolean().optional().default(false),
          }),
        ),
      }),
    )
    .optional()
    .default([]),
  features: z.array(z.string()).optional().default([]),
  variants: z
    .array(
      z.object({
        sku: z.string().trim().min(1),
        name: z.string().trim().min(1),
        options: z.record(z.any()).optional().default({}),
        pricePaisa: z.coerce.number().int().min(0),
        salePricePaisa: z.coerce.number().int().min(0).optional().nullable(),
        stock: z.coerce.number().int().min(0).optional().default(0),
        images: z.array(z.any()).optional().default([]),
        specs: z.record(z.any()).optional().default({}),
      }),
    )
    .optional()
    .default([]),
  warranty: z.string().optional().default(''),
  manufacturer: z.string().optional().default(''),
  countryOfOrigin: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  seoTitle: z.string().max(160).optional().default(''),
  seoDescription: z.string().max(320).optional().default(''),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
  flags: z
    .object({
      isFeatured: z.boolean().optional(),
      isBestSeller: z.boolean().optional(),
      isNewArrival: z.boolean().optional(),
      isOnSale: z.boolean().optional(),
    })
    .optional(),
});

export const adminProductUpdateSchema = z.object({
  body: adminProductCreateSchema.shape.body.partial(),
  params: z.object({ id: objectId }),
  query: z.record(z.any()).optional().default({}),
});

export const adminBulkSchema = body({
  ids: z.array(objectId).min(1).max(100),
  action: z.enum(['publish', 'unpublish', 'archive', 'delete']),
});
