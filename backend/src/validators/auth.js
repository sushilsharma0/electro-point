import { z } from 'zod';
import { body } from './common.js';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a number');

export const registerSchema = body({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  password,
  phone: z.string().trim().max(20).optional().default(''),
});

export const loginSchema = body({
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
