import { z } from 'zod';

export const ProductCreateSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU / Code is required'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
  currentStock: z.number().int().nonnegative('Current stock cannot be negative').default(0),
  minStockAlert: z.number().int().nonnegative('Minimum stock alert must be at least 0').default(10),
  location: z.string().min(2, 'Warehouse location is required'),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const StockAdjustSchema = z.object({
  quantityChanged: z.number().int().positive('Quantity changed must be a positive integer'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(3, 'Detailed reason is required for stock adjustment'),
});
