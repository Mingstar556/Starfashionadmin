import { z } from 'zod';

// ==========================================
// 1. ZOD SECURITY SCHEMAS (Strict Validation)
// ==========================================

export const orderItemSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  price: z.number().positive().max(1000000),
  qty: z.number().int().positive().max(1000),
  size: z.string().min(1).max(20),
  image: z.string().max(2000).optional(),
  stock: z.number().int().nonnegative().optional(),
}).passthrough();

export const createOrderSchema = z.object({
  telegram_name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^@?[a-zA-Z0-9_]{1,50}$/, 'Invalid Telegram username format (letters, numbers, underscore only)'),
  telegram_phone: z
    .string()
    .min(6)
    .max(30)
    .regex(/^[+]?[0-9\s()-]{6,30}$/, 'Invalid phone number format'),
  address: z.string().min(3).max(500),
  items: z.array(orderItemSchema).min(1).max(50),
  payment_method: z.enum(['COD', 'KHQR']),
}).strict();

export const adminLoginSchema = z.object({
  password: z.string().min(1).max(128),
}).strict();

export const updateSettingsSchema = z.object({
  announcement_text: z.string().max(500).optional(),
  is_store_open: z.boolean().optional(),
  banner_images: z.array(z.string().url()).max(10).optional(),
  admin_telegram_chat_id: z.string().max(50).optional(),
  telegram_bot_token: z.string().max(100).optional(),
}).strict();

// ==========================================
// 2. INPUT SANITIZATION & SECURITY HELPERS
// ==========================================

export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Escapes reserved Markdown formatting characters to prevent entity parse errors in Telegram
 */
export function escapeTelegramMarkdown(text: string): string {
  if (!text) return '';
  return text.replace(/([_*`\[\]])/g, '\\$1');
}

export function logSecurityEvent(event: string, details: Record<string, any>) {
  const timestamp = new Date().toISOString();
  console.warn(`[SECURITY AUDIT] [${timestamp}] ${event}:`, JSON.stringify(details));
}
