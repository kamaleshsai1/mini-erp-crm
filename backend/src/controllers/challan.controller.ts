import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../types';

/**
 * Generate sequential challan number like CH-202609-0004
 */
async function generateChallanNumber(): Promise<string> {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `CH-${yearMonth}-`;

  const lastChallan = await prisma.salesChallan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: 'desc' },
  });

  let nextSeq = 1;
  if (lastChallan) {
    const parts = lastChallan.challanNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

export const getChallans = async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const status = req.query.status as string;
  const customerId = req.query.customerId as string;
  const search = (req.query.search as string)?.trim();

  const where: any = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (search) {
    where.OR = [
      { challanNumber: { contains: search } },
      { customer: { name: { contains: search } } },
      { customer: { businessName: { contains: search } } },
    ];
  }

  const [total, challans] = await Promise.all([
    prisma.salesChallan.count({ where }),
    prisma.salesChallan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, businessName: true, email: true, mobile: true, gstNumber: true },
        },
        createdByUser: {
          select: { id: true, name: true, role: true },
        },
        items: true,
      },
    }),
  ]);

  return res.json({
    success: true,
    data: challans,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getChallanById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    include: {
      customer: true,
      createdByUser: {
        select: { id: true, name: true, email: true, role: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, sku: true, currentStock: true, location: true },
          },
        },
      },
    },
  });

  if (!challan) {
    return res.status(404).json({ success: false, error: 'Sales Challan not found' });
  }

  return res.json({
    success: true,
    data: challan,
  });
};

export const createChallan = async (req: AuthenticatedRequest, res: Response) => {
  const { customerId, status, items } = req.body;

  // 1. Verify customer exists
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  // 2. Fetch and validate all products
  const productIds = items.map((i: any) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Check if all requested products exist
  for (const item of items) {
    if (!productMap.has(item.productId)) {
      return res.status(404).json({
        success: false,
        error: `Product with ID '${item.productId}' not found.`,
      });
    }
  }

  // 3. If status is CONFIRMED, check stock availability beforehand
  if (status === 'CONFIRMED') {
    for (const item of items) {
      const prod = productMap.get(item.productId)!;
      if (prod.currentStock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for product '${prod.name}' (SKU: ${prod.sku}). Available stock is ${prod.currentStock}, but requested quantity is ${item.quantity}. Stock cannot go negative.`,
        });
      }
    }
  }

  // 4. Calculate snapshots, totals, and generate sequential challan number
  const challanNumber = await generateChallanNumber();

  let totalQuantity = 0;
  let totalAmount = 0;

  const snapshotItems = items.map((item: any) => {
    const prod = productMap.get(item.productId)!;
    const subtotal = prod.unitPrice * item.quantity;
    totalQuantity += item.quantity;
    totalAmount += subtotal;

    return {
      productId: prod.id,
      productNameSnapshot: prod.name,
      skuSnapshot: prod.sku,
      unitPriceSnapshot: prod.unitPrice,
      quantity: item.quantity,
      subtotal,
    };
  });

  // 5. Execute creation within atomic transaction
  try {
    const newChallan = await prisma.$transaction(async (tx) => {
      // Create Challan record
      const createdChallan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          totalAmount,
          status: status || 'DRAFT',
          createdByUserId: req.user?.userId || null,
          items: {
            create: snapshotItems,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      // If CONFIRMED, reduce stock and record stock movement logs
      if (status === 'CONFIRMED') {
        for (const item of items) {
          const prod = productMap.get(item.productId)!;

          // Double check in transaction to prevent race conditions
          const currentProd = await tx.product.findUnique({
            where: { id: prod.id },
          });

          if (!currentProd || currentProd.currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for '${prod.name}' (SKU: ${prod.sku}). Available: ${currentProd?.currentStock ?? 0}, Requested: ${item.quantity}`
            );
          }

          // Decrement stock
          await tx.product.update({
            where: { id: prod.id },
            data: { currentStock: { decrement: item.quantity } },
          });

          // Create stock movement log
          await tx.stockMovementLog.create({
            data: {
              productId: prod.id,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Dispatched via Sales Challan ${challanNumber}`,
              createdByUserId: req.user?.userId || null,
            },
          });
        }
      }

      return createdChallan;
    });

    return res.status(201).json({
      success: true,
      data: newChallan,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to create sales challan',
    });
  }
};

export const updateChallanStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status: targetStatus } = req.body;

  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
      },
      customer: true,
    },
  });

  if (!challan) {
    return res.status(404).json({ success: false, error: 'Sales Challan not found' });
  }

  if (challan.status === targetStatus) {
    return res.status(400).json({
      success: false,
      error: `Challan is already in '${targetStatus}' status.`,
    });
  }

  // Cannot reactivate a CANCELLED challan
  if (challan.status === 'CANCELLED') {
    return res.status(400).json({
      success: false,
      error: 'Cannot update status of a cancelled challan.',
    });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Transition DRAFT -> CONFIRMED
      if (challan.status === 'DRAFT' && targetStatus === 'CONFIRMED') {
        // Validate stock for all items
        for (const item of challan.items) {
          if (!item.productId) continue;

          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (!prod || prod.currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for '${item.productNameSnapshot}' (SKU: ${item.skuSnapshot}). Available: ${prod?.currentStock || 0}, Requested: ${item.quantity}. Stock cannot go negative.`
            );
          }

          // Decrement stock
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          // Log movement
          await tx.stockMovementLog.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Dispatched via Sales Challan ${challan.challanNumber}`,
              createdByUserId: req.user?.userId || null,
            },
          });
        }
      }

      // 2. Transition CONFIRMED -> CANCELLED (Restock items)
      if (challan.status === 'CONFIRMED' && targetStatus === 'CANCELLED') {
        for (const item of challan.items) {
          if (!item.productId) continue;

          // Increment stock back
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          // Log movement IN
          await tx.stockMovementLog.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'IN',
              reason: `Restocked from Cancelled Sales Challan ${challan.challanNumber}`,
              createdByUserId: req.user?.userId || null,
            },
          });
        }
      }

      // Update status
      return await tx.salesChallan.update({
        where: { id },
        data: { status: targetStatus },
        include: {
          customer: true,
          items: true,
        },
      });
    });

    return res.json({
      success: true,
      data: updated,
      message: `Challan successfully updated to ${targetStatus}`,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to update challan status',
    });
  }
};

export const getChallanInvoiceHtml = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    include: {
      customer: true,
      createdByUser: true,
      items: true,
    },
  });

  if (!challan) {
    return res.status(404).json({ success: false, error: 'Challan not found' });
  }

  // Generate clean, printable Tax Invoice / Delivery Challan HTML
  const itemsHtml = challan.items
    .map(
      (item, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
        <strong>${item.productNameSnapshot}</strong>
        <div style="font-size: 11px; color: #64748b;">SKU (Stock Keeping Unit): ${item.skuSnapshot}</div>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${item.unitPriceSnapshot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">₹${item.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
  `
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Sales Challan - ${challan.challanNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #fff; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 24px; }
    .company h1 { margin: 0; color: #1e3a8a; font-size: 24px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; background: ${challan.status === 'CONFIRMED' ? '#dcfce7; color: #166534;' : challan.status === 'DRAFT' ? '#fef9c3; color: #854d0e;' : '#fee2e2; color: #991b1b;'} }
    .section-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; margin-bottom: 6px; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f8fafc; padding: 12px 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 2px solid #cbd5e1; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
    .totals-box { width: 300px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .grand-total { font-size: 18px; font-weight: 700; color: #1e3a8a; border-top: 2px solid #cbd5e1; padding-top: 10px; margin-top: 6px; }
    .footer { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
    .sign-box { width: 200px; text-align: center; border-top: 1px dashed #94a3b8; padding-top: 8px; margin-top: 50px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 10px 20px; font-size: 14px; border-radius: 6px; cursor: pointer; font-weight: 600;">🖨️ Print / Save as PDF</button>
  </div>

  <div class="header">
    <div class="company">
      <h1>METRO WHOLESALE & DISTRIBUTION CORP</h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Industrial Hub, Warehouse 4B, Sector 62 • GSTIN (Goods & Services Tax ID): 27AABCM9876Q1Z2</p>
      <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">Phone: +91 22 2890 0000 • Email: dispatch@metrowholesale.corp</p>
    </div>
    <div style="text-align: right;">
      <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">TAX INVOICE / DELIVERY CHALLAN</h2>
      <div style="font-size: 16px; font-weight: 700; color: #2563eb; margin-bottom: 6px;">${challan.challanNumber}</div>
      <div><span class="badge">${challan.status}</span></div>
    </div>
  </div>

  <div class="details-grid">
    <div>
      <div class="section-title">Billed & Delivered To:</div>
      <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${challan.customer.businessName}</div>
      <div style="font-size: 14px; color: #334155; margin-top: 2px;">Attn: ${challan.customer.name}</div>
      <div style="font-size: 13px; color: #64748b; margin-top: 4px; max-width: 320px;">${challan.customer.address}</div>
      <div style="font-size: 13px; color: #334155; margin-top: 4px;">Phone: ${challan.customer.mobile}</div>
      ${challan.customer.gstNumber ? `<div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px;">GSTIN (Goods & Services Tax ID): ${challan.customer.gstNumber}</div>` : ''}
    </div>
    <div style="text-align: right;">
      <div class="section-title">Order Information:</div>
      <div style="font-size: 13px; color: #334155; margin-bottom: 4px;">Date: <strong>${new Date(challan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
      <div style="font-size: 13px; color: #334155; margin-bottom: 4px;">Customer Type: <strong>${challan.customer.customerType}</strong></div>
      <div style="font-size: 13px; color: #334155;">Generated By: <strong>${challan.createdByUser?.name || 'Authorized Staff'} (${challan.createdByUser?.role || 'SYSTEM'})</strong></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">#</th>
        <th style="text-align: left;">Item Description & SKU (Stock Keeping Unit)</th>
        <th style="width: 90px; text-align: right;">Qty</th>
        <th style="width: 120px; text-align: right;">Unit Price</th>
        <th style="width: 130px; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row">
        <span>Total Items:</span>
        <strong>${challan.items.length} line item(s)</strong>
      </div>
      <div class="totals-row">
        <span>Total Quantity:</span>
        <strong>${challan.totalQuantity} units</strong>
      </div>
      <div class="totals-row grand-total">
        <span>Grand Total:</span>
        <span>₹${challan.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <div>
      <p style="margin: 0; font-weight: 600;">Terms & Conditions:</p>
      <p style="margin: 2px 0 0 0;">1. Goods once sold will not be taken back unless damaged prior to delivery.</p>
      <p style="margin: 2px 0 0 0;">2. Subject to local jurisdiction only.</p>
    </div>
    <div class="sign-box">
      Authorized Signatory
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
};
