import { z } from 'zod';

export const CustomerCreateSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  mobile: z.string().min(7, 'Valid mobile number is required'),
  email: z.string().email('Valid email address is required'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional().nullable(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).default('RETAIL'),
  address: z.string().min(5, 'Address is required'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const CustomerUpdateSchema = CustomerCreateSchema.partial();

export const FollowUpNoteSchema = z.object({
  note: z.string().min(3, 'Note must contain at least 3 characters'),
});
