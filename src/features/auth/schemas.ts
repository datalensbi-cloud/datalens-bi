import { z } from 'zod';

export const passwordLoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});
export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;

export const magicLinkSchema = z.object({
  email: z.string().email('Enter a valid email'),
});
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Tell us your name'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include one uppercase letter')
    .regex(/[0-9]/, 'Include one number'),
});
export type SignupInput = z.infer<typeof signupSchema>;
