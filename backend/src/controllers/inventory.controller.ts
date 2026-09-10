import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../types';

export const getStockLogs = async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;
  const skip = (page - 1) * limit;

  const movementType = req.query.movementType as string;
  const productId = req.query.productId as string;
  const search = (req.query.search as string)?.trim();

  const where: any = {};

  if (movementType && movementType !== 'ALL') {
    where.movementType = movementType;
  }

  if (productId) {
    where.productId = productId;
  }

  if (search) {
    where.OR = [
      { reason: { contains: search } },
      { product: { name: { contains: search } } },
      { product: { sku: { contains: search } } },
    ];
  }

  const [total, logs] = await Promise.all([
    prisma.stockMovementLog.count({ where }),
    prisma.stockMovementLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, sku: true, category: true, location: true },
        },
        createdByUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
  ]);

  return res.json({
    success: true,
    data: logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};
