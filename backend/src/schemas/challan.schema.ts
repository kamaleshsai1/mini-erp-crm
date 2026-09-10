import { z } from 'zod';

export const ChallanItemInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const ChallanCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
  items: z.array(ChallanItemInputSchema).min(1, 'At least one product item is required'),
});

export const ChallanStatusUpdateSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']),
});
