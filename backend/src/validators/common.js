import { z } from 'zod';

export const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const empty = z.object({
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export function body(shape) {
  return z.object({
    body: z.object(shape),
    query: z.record(z.any()).optional().default({}),
    params: z.record(z.any()).optional().default({}),
  });
}

export function params(shape) {
  return z.object({
    body: z.any().optional(),
    query: z.record(z.any()).optional().default({}),
    params: z.object(shape),
  });
}

export function query(shape) {
  return z.object({
    body: z.any().optional(),
    query: z.object(shape),
    params: z.record(z.any()).optional().default({}),
  });
}

export const paginationQuery = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
};
