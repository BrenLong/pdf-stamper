import { z } from 'zod';

export const stampRequestSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  order_number: z.string().min(1, 'Order number is required'),
  licensed_quantity: z.coerce.number().int().positive('Licensed quantity must be a positive integer'),
  organization: z.string().optional().transform(val => val === '' ? undefined : val),
  license_id: z.string().optional().transform(val => val === '' ? undefined : val),
  date: z.string().optional().transform(val => val === '' ? undefined : val),
  footer_position: z.enum(['bottom', 'diagonal']).default('bottom'),
});

export type StampRequest = z.infer<typeof stampRequestSchema>;

export const stampOptionsSchema = z.object({
  customerName: z.string(),
  orderNumber: z.string(),
  licensedQuantity: z.number(),
  organization: z.string().optional(),
  licenseId: z.string(),
  dateISO: z.string(),
  footerPosition: z.enum(['bottom', 'diagonal']),
});

export type StampOptions = z.infer<typeof stampOptionsSchema>; 