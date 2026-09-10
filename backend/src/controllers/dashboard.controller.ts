import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../types';

export const getDashboardStats = async (_req: AuthenticatedRequest, res: Response) => {
  const [
    totalCustomers,
    activeCustomers,
    leadCustomers,
    allProducts,
    totalChallans,
    confirmedChallans,
    draftChallans,
    recentChallans,
    recentMovements,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { status: 'ACTIVE' } }),
    prisma.customer.count({ where: { status: 'LEAD' } }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        minStockAlert: true,
        category: true,
        unitPrice: true,
      },
    }),
    prisma.salesChallan.count(),
    prisma.salesChallan.findMany({
      where: { status: 'CONFIRMED' },
      select: { totalAmount: true },
    }),
    prisma.salesChallan.count({ where: { status: 'DRAFT' } }),
    prisma.salesChallan.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, businessName: true } },
      },
    }),
    prisma.stockMovementLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        createdByUser: { select: { name: true, role: true } },
      },
    }),
  ]);

  const totalRevenue = confirmedChallans.reduce((sum, c) => sum + c.totalAmount, 0);
  const lowStockProducts = allProducts.filter((p) => p.currentStock <= p.minStockAlert);

  return res.json({
    success: true,
    data: {
      metrics: {
        totalRevenue,
        totalCustomers,
        activeCustomers,
        leadCustomers,
        totalProducts: allProducts.length,
        lowStockCount: lowStockProducts.length,
        totalChallans,
        confirmedChallansCount: confirmedChallans.length,
        draftChallansCount: draftChallans,
      },
      lowStockAlerts: lowStockProducts.slice(0, 5),
      recentChallans,
      recentMovements,
    },
  });
};
