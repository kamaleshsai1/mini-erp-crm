import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../types';

export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  const search = (req.query.search as string)?.trim();
  const category = req.query.category as string;
  const lowStockOnly = req.query.lowStock === 'true';

  const where: any = {};

  if (category && category !== 'ALL') {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { category: { contains: search } },
      { location: { contains: search } },
    ];
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
  ]);

  // If low stock requested, filter in memory or via SQL (SQLite currentStock <= minStockAlert)
  const filteredProducts = lowStockOnly
    ? products.filter((p) => p.currentStock <= p.minStockAlert)
    : products;

  // Augment with isLowStock boolean flag for frontend convenience
  const formatted = filteredProducts.map((p) => ({
    ...p,
    isLowStock: p.currentStock <= p.minStockAlert,
  }));

  return res.json({
    success: true,
    data: formatted,
    pagination: {
      total: lowStockOnly ? formatted.length : total,
      page,
      limit,
      totalPages: Math.ceil((lowStockOnly ? formatted.length : total) / limit),
    },
  });
};

export const getProductById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          createdByUser: {
            select: { id: true, name: true, role: true },
          },
        },
      },
    },
  });

  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  return res.json({
    success: true,
    data: {
      ...product,
      isLowStock: product.currentStock <= product.minStockAlert,
    },
  });
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = req.body;

  const existing = await prisma.product.findUnique({
    where: { sku: sku.toUpperCase().trim() },
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      error: `A product with SKU '${sku}' already exists. SKU must be unique.`,
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name,
        sku: sku.toUpperCase().trim(),
        category,
        unitPrice,
        currentStock: currentStock || 0,
        minStockAlert: minStockAlert !== undefined ? minStockAlert : 10,
        location,
      },
    });

    if (currentStock && currentStock > 0) {
      await tx.stockMovementLog.create({
        data: {
          productId: product.id,
          quantityChanged: currentStock,
          movementType: 'IN',
          reason: 'Initial Opening Inventory',
          createdByUserId: req.user?.userId || null,
        },
      });
    }

    return product;
  });

  return res.status(201).json({
    success: true,
    data: result,
  });
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, sku, category, unitPrice, minStockAlert, location } = req.body;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  if (sku && sku.toUpperCase().trim() !== existing.sku) {
    const duplicate = await prisma.product.findUnique({
      where: { sku: sku.toUpperCase().trim() },
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: `Another product with SKU '${sku}' already exists.`,
      });
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(sku && { sku: sku.toUpperCase().trim() }),
      ...(category && { category }),
      ...(unitPrice !== undefined && { unitPrice }),
      ...(minStockAlert !== undefined && { minStockAlert }),
      ...(location && { location }),
    },
  });

  return res.json({
    success: true,
    data: updated,
  });
};

export const adjustStock = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { quantityChanged, movementType, reason } = req.body;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  if (movementType === 'OUT' && product.currentStock < quantityChanged) {
    return res.status(400).json({
      success: false,
      error: `Insufficient stock! Cannot deduct ${quantityChanged} units. Current stock is only ${product.currentStock}. Negative stock is prohibited.`,
    });
  }

  const updatedStock =
    movementType === 'IN'
      ? product.currentStock + quantityChanged
      : product.currentStock - quantityChanged;

  const [updatedProduct, log] = await prisma.$transaction([
    prisma.product.update({
      where: { id },
      data: { currentStock: updatedStock },
    }),
    prisma.stockMovementLog.create({
      data: {
        productId: id,
        quantityChanged,
        movementType,
        reason,
        createdByUserId: req.user?.userId || null,
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, role: true },
        },
      },
    }),
  ]);

  return res.json({
    success: true,
    data: {
      product: {
        ...updatedProduct,
        isLowStock: updatedProduct.currentStock <= updatedProduct.minStockAlert,
      },
      movementLog: log,
    },
  });
};
