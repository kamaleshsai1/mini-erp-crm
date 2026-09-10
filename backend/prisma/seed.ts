import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Mini ERP + CRM database...');

  // Clean existing records in cascade order
  await prisma.salesChallanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovementLog.deleteMany();
  await prisma.customerFollowUpNote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users (Admin, Sales, Warehouse, Accounts)
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Supervisor',
      email: 'admin@erp.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'sales@erp.com',
      passwordHash,
      role: 'SALES',
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Vikram Singh',
      email: 'warehouse@erp.com',
      passwordHash,
      role: 'WAREHOUSE',
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'accounts@erp.com',
      passwordHash,
      role: 'ACCOUNTS',
    },
  });

  console.log('Seeded 4 users (Admin, Sales, Warehouse, Accounts) with password: Password123!');

  // 2. Seed Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Rajesh Gupta',
      mobile: '+91 98201 12345',
      email: 'rajesh@apexretail.in',
      businessName: 'Apex Retail Stores Pvt Ltd',
      gstNumber: '27AABCA1234F1Z1',
      customerType: 'RETAIL',
      address: 'Shop 12-14, Phoenix Commercial Center, Lower Parel, Mumbai - 400013',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Leading electronics & hardware chain. Requires delivery within 48 hours.',
      followUpNotes: {
        create: [
          {
            note: 'Initial contract signed for Q3 wholesale supplies.',
            createdByUserId: salesUser.id,
          },
          {
            note: 'Followed up regarding pending challan for bar-code scanners.',
            createdByUserId: salesUser.id,
          },
        ],
      },
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Vikrant Khanna',
      mobile: '+91 98110 98765',
      email: 'orders@zenithdist.com',
      businessName: 'Zenith Distributors Ltd',
      gstNumber: '07AAACZ4321A1Z9',
      customerType: 'DISTRIBUTOR',
      address: 'Plot 88, Okhla Phase III, Industrial Area, New Delhi - 110020',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Tier 1 Northern region distributor. 30-day credit period approved.',
      followUpNotes: {
        create: [
          {
            note: 'Discussed volume rebate for orders exceeding 500 units.',
            createdByUserId: salesUser.id,
          },
        ],
      },
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Sunil Rao',
      mobile: '+91 99000 45678',
      email: 'procurement@metrowholesale.in',
      businessName: 'Metro Wholesale Supermarts',
      gstNumber: '29BBBCM5678B1Z4',
      customerType: 'WHOLESALE',
      address: '4th Cross, Industrial Suburb, Yeshwanthpur, Bangalore - 560022',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: 'South zone distributor. High volume thermal printer buyer.',
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: 'Manoj Mehta',
      mobile: '+91 98250 33445',
      email: 'manoj@sunrisehardware.com',
      businessName: 'Sunrise Hardware Mart',
      customerType: 'RETAIL',
      address: 'Station Road, near Old Market, Surat, Gujarat - 395003',
      status: 'LEAD',
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Potential client for warehouse packaging materials & fasteners.',
      followUpNotes: {
        create: [
          {
            note: 'Sent product catalog and sample quotation.',
            createdByUserId: salesUser.id,
          },
        ],
      },
    },
  });

  const customer5 = await prisma.customer.create({
    data: {
      name: 'Kavita Iyer',
      mobile: '+91 97412 88990',
      email: 'accounts@bharattraders.co',
      businessName: 'Bharat Logistics & Traders',
      gstNumber: '33CCCBT9012C1Z7',
      customerType: 'WHOLESALE',
      address: '22 Harbour Road, George Town, Chennai - 600001',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      notes: 'Regular purchaser of hydraulic pallet jacks and industrial safety gloves.',
    },
  });

  const customer6 = await prisma.customer.create({
    data: {
      name: 'Anil Deshmukh',
      mobile: '+91 98220 11223',
      email: 'anil@globaltechsupplies.com',
      businessName: 'Global Tech Supplies LLP',
      customerType: 'DISTRIBUTOR',
      address: 'Block C, MIDC Bhosari, Pune - 411026',
      status: 'INACTIVE',
      notes: 'Account suspended due to delayed reconciliation. Revisit in Q4.',
    },
  });

  console.log('Seeded 6 customers across Retail, Wholesale, and Distributor types.');

  // 3. Seed Products & Initial Stock
  const products = [
    {
      name: 'Wireless Barcode Scanner 2D (Industrial)',
      sku: 'PROD-ELEC-001',
      category: 'Electronics',
      unitPrice: 2450.0,
      currentStock: 85,
      minStockAlert: 15,
      location: 'Warehouse A - Bay 01, Rack 3',
    },
    {
      name: 'Thermal Receipt & Label Printer 80mm',
      sku: 'PROD-ELEC-002',
      category: 'Electronics',
      unitPrice: 3800.0,
      currentStock: 40,
      minStockAlert: 10,
      location: 'Warehouse A - Bay 02, Rack 1',
    },
    {
      name: 'Industrial Rugged Mobile Computer Terminal',
      sku: 'PROD-ELEC-003',
      category: 'Electronics',
      unitPrice: 12500.0,
      currentStock: 6, // Below min stock alert!
      minStockAlert: 12,
      location: 'Warehouse A - Bay 04, Secure Cage',
    },
    {
      name: 'Heavy Duty 5-Ply Corrugated Box (Pack of 50)',
      sku: 'PROD-PACK-101',
      category: 'Packaging',
      unitPrice: 1250.0,
      currentStock: 450,
      minStockAlert: 100,
      location: 'Warehouse B - Pallet Zone 12',
    },
    {
      name: 'Stretch Film Wrap Roll 500m (23 Micron)',
      sku: 'PROD-PACK-102',
      category: 'Packaging',
      unitPrice: 380.0,
      currentStock: 160,
      minStockAlert: 40,
      location: 'Warehouse B - Pallet Zone 14',
    },
    {
      name: 'Reinforced Security Packing Tape (Box of 24)',
      sku: 'PROD-PACK-103',
      category: 'Packaging',
      unitPrice: 420.0,
      currentStock: 8, // Below min stock alert!
      minStockAlert: 20,
      location: 'Warehouse B - Shelf 08',
    },
    {
      name: 'Stainless Steel Industrial Fastener Kit M8',
      sku: 'PROD-HARD-201',
      category: 'Hardware',
      unitPrice: 680.0,
      currentStock: 95,
      minStockAlert: 25,
      location: 'Warehouse C - Bin 11',
    },
    {
      name: 'Hydraulic Pallet Truck 2500kg Capacity',
      sku: 'PROD-HARD-202',
      category: 'Hardware',
      unitPrice: 19500.0,
      currentStock: 3, // Below min stock alert!
      minStockAlert: 5,
      location: 'Warehouse C - Heavy Equipment Floor',
    },
    {
      name: 'Industrial Heavy Degreaser Liquid 20L Canister',
      sku: 'PROD-CHEM-301',
      category: 'Chemicals',
      unitPrice: 1650.0,
      currentStock: 55,
      minStockAlert: 15,
      location: 'Warehouse D - HazMat Zone 2',
    },
    {
      name: 'Nitrile Heavy-Duty Work Gloves (Box of 100)',
      sku: 'PROD-SAFE-401',
      category: 'Safety',
      unitPrice: 520.0,
      currentStock: 240,
      minStockAlert: 50,
      location: 'Warehouse D - Safety Gear Bay',
    },
  ];

  const createdProducts = [];
  for (const p of products) {
    const prod = await prisma.product.create({ data: p });
    createdProducts.push(prod);

    // Create initial stock movement log for each product
    await prisma.stockMovementLog.create({
      data: {
        productId: prod.id,
        quantityChanged: prod.currentStock,
        movementType: 'IN',
        reason: 'Initial Warehouse Inward / Opening Inventory',
        createdByUserId: warehouseUser.id,
      },
    });
  }

  console.log(`Seeded ${createdProducts.length} products with initial stock movement logs.`);

  // 4. Seed Confirmed Challan (with snapshot items and stock deduction log)
  const p1 = createdProducts[0]; // Barcode Scanner
  const p2 = createdProducts[1]; // Thermal Printer
  const p4 = createdProducts[3]; // Corrugated Box

  const challan1 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-202609-0001',
      customerId: customer2.id, // Zenith Distributors
      totalQuantity: 15,
      totalAmount: 5 * p1.unitPrice + 10 * p4.unitPrice,
      status: 'CONFIRMED',
      createdByUserId: salesUser.id,
      items: {
        create: [
          {
            productId: p1.id,
            productNameSnapshot: p1.name,
            skuSnapshot: p1.sku,
            unitPriceSnapshot: p1.unitPrice,
            quantity: 5,
            subtotal: 5 * p1.unitPrice,
          },
          {
            productId: p4.id,
            productNameSnapshot: p4.name,
            skuSnapshot: p4.sku,
            unitPriceSnapshot: p4.unitPrice,
            quantity: 10,
            subtotal: 10 * p4.unitPrice,
          },
        ],
      },
    },
  });

  // Log stock reduction for confirmed challan
  await prisma.stockMovementLog.create({
    data: {
      productId: p1.id,
      quantityChanged: 5,
      movementType: 'OUT',
      reason: `Dispatched via Sales Challan ${challan1.challanNumber}`,
      createdByUserId: salesUser.id,
    },
  });

  await prisma.stockMovementLog.create({
    data: {
      productId: p4.id,
      quantityChanged: 10,
      movementType: 'OUT',
      reason: `Dispatched via Sales Challan ${challan1.challanNumber}`,
      createdByUserId: salesUser.id,
    },
  });

  // 5. Seed Draft Challan
  await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-202609-0002',
      customerId: customer1.id, // Apex Retail
      totalQuantity: 2,
      totalAmount: 2 * p2.unitPrice,
      status: 'DRAFT',
      createdByUserId: salesUser.id,
      items: {
        create: [
          {
            productId: p2.id,
            productNameSnapshot: p2.name,
            skuSnapshot: p2.sku,
            unitPriceSnapshot: p2.unitPrice,
            quantity: 2,
            subtotal: 2 * p2.unitPrice,
          },
        ],
      },
    },
  });

  console.log('Seeded initial sales challans (Confirmed and Draft).');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
