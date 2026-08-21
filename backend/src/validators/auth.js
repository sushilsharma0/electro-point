import { z } from 'zod';
import { body } from './common.js';
import { isNepalMobile } from '../utils/phone.js';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a number');

export const registerSchema = body({
  name: z.string().trim().min(2, 'Name is required').max(120),
  email: z.string().trim().min(1, 'Email is required').email().toLowerCase(),
  password,
  phone: z
    .string({ required_error: 'Mobile number is required' })
    .trim()
    .min(1, 'Mobile number is required')
    .max(20)
    .refine(isNepalMobile, 'Enter a 10-digit mobile number'),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().trim().optional(),
      phone: z.string().trim().optional(),
      identifier: z.string().trim().optional(),
      password: z.string().min(1).max(128),
    })
    .superRefine((data, ctx) => {
      const id = (data.identifier || data.email || data.phone || '').trim();
      if (!id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter your email or mobile number',
          path: ['identifier'],
        });
      }
    }),
  query: z.record(z.any()).optional().default({}),
  params: z.record(z.any()).optional().default({}),
});

export const adminLoginSchema = body({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = body({
  email: z.string().trim().email().toLowerCase(),
});

export const resetPasswordSchema = body({
  token: z.string().min(16).max(256),
  password,
});
