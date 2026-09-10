import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../types';

export const getCustomers = async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const search = (req.query.search as string)?.trim();
  const status = req.query.status as string;
  const customerType = req.query.customerType as string;

  const where: any = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (customerType && customerType !== 'ALL') {
    where.customerType = customerType;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { businessName: { contains: search } },
      { email: { contains: search } },
      { mobile: { contains: search } },
      { gstNumber: { contains: search } },
    ];
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { challans: true, followUpNotes: true },
        },
      },
    }),
  ]);

  return res.json({
    success: true,
    data: customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getCustomerById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      followUpNotes: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdByUser: {
            select: { id: true, name: true, role: true },
          },
        },
      },
      challans: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          items: true,
        },
      },
    },
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found',
    });
  }

  return res.json({
    success: true,
    data: customer,
  });
};

export const createCustomer = async (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;

  const customer = await prisma.customer.create({
    data: {
      ...data,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      notes: data.notes || '',
    },
  });

  return res.status(201).json({
    success: true,
    data: customer,
  });
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      ...data,
      ...(data.followUpDate !== undefined && {
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      }),
    },
  });

  return res.json({
    success: true,
    data: updated,
  });
};

export const deleteCustomer = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  // Check if customer has associated sales challans
  const challanCount = await prisma.salesChallan.count({
    where: { customerId: id },
  });

  if (challanCount > 0) {
    return res.status(400).json({
      success: false,
      error: `Cannot delete customer. There are ${challanCount} existing sales challans linked to this customer. Change status to INACTIVE instead.`,
    });
  }

  await prisma.customer.delete({ where: { id } });

  return res.json({
    success: true,
    message: 'Customer deleted successfully',
  });
};

export const addFollowUpNote = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  const followUp = await prisma.customerFollowUpNote.create({
    data: {
      customerId: id,
      note,
      createdByUserId: req.user?.userId || null,
    },
    include: {
      createdByUser: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  return res.status(201).json({
    success: true,
    data: followUp,
  });
};
