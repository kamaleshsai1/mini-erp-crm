import { prisma } from './db/prisma';

async function verifyAll() {
  console.log('--- RUNNING FULL SYSTEM AUTOMATED VERIFICATION ---');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Auth Test
  console.log('\n[1/6] Testing Authentication for all 4 roles...');
  const roles = ['admin@erp.com', 'sales@erp.com', 'warehouse@erp.com', 'accounts@erp.com'];
  const tokens: Record<string, string> = {};

  for (const email of roles) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!' }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(`Login failed for ${email}`);
    tokens[email] = json.data.token;
    console.log(`  ✓ Successfully logged in as ${json.data.user.role} (${json.data.user.name})`);
  }

  // 2. Customer CRM Test
  console.log('\n[2/6] Testing Customer CRM & Follow-Up Notes...');
  const custRes = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens['sales@erp.com']}`,
    },
    body: JSON.stringify({
      name: 'Test Customer Contact',
      mobile: '+91 99999 11111',
      email: 'test@verification.com',
      businessName: 'Verification Logistics Corp',
      customerType: 'WHOLESALE',
      address: 'Plot 777 Test Road, Mumbai',
      status: 'ACTIVE',
      notes: 'Customer created during automated verification run',
    }),
  });
  const custJson = await custRes.json();
  if (!custJson.success) throw new Error(`Customer creation failed: ${custJson.error}`);
  const testCustomer = custJson.data;
  console.log(`  ✓ Created customer: ${testCustomer.businessName} (ID: ${testCustomer.id})`);

  // Add follow-up note
  const noteRes = await fetch(`${BASE_URL}/customers/${testCustomer.id}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens['sales@erp.com']}`,
    },
    body: JSON.stringify({ note: 'Called client to discuss Q4 wholesale rates.' }),
  });
  const noteJson = await noteRes.json();
  if (!noteJson.success) throw new Error('Adding follow-up note failed');
  console.log(`  ✓ Appended follow-up note by Sales user`);

  // 3. Product & Stock Adjust Test
  console.log('\n[3/6] Testing Product Catalog & Warehouse Stock Adjustment...');
  const prodRes = await fetch(`${BASE_URL}/products?lowStock=false`, {
    headers: { Authorization: `Bearer ${tokens['warehouse@erp.com']}` },
  });
  const prodJson = await prodRes.json();
  const testProd = prodJson.data[0];
  const initialStock = testProd.currentStock;
  console.log(`  Target product: '${testProd.name}' (SKU: ${testProd.sku}), Stock: ${initialStock}`);

  // Warehouse Inward Adjustment (+15)
  const adjustRes = await fetch(`${BASE_URL}/products/${testProd.id}/adjust-stock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens['warehouse@erp.com']}`,
    },
    body: JSON.stringify({
      quantityChanged: 15,
      movementType: 'IN',
      reason: 'Automated verification test inward receipt',
    }),
  });
  const adjustJson = await adjustRes.json();
  if (!adjustJson.success) throw new Error('Stock adjustment failed');
  console.log(`  ✓ Stock inwarded +15 units. New stock: ${adjustJson.data.product.currentStock}`);

  // 4. Test Negative Stock Prevention
  console.log('\n[4/6] Testing Negative Stock Prevention Rule...');
  const badChallanRes = await fetch(`${BASE_URL}/challans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens['sales@erp.com']}`,
    },
    body: JSON.stringify({
      customerId: testCustomer.id,
      status: 'CONFIRMED',
      items: [{ productId: testProd.id, quantity: 999999 }], // Intentionally excessive quantity!
    }),
  });
  const badChallanJson = await badChallanRes.json();
  if (badChallanRes.status === 400 && !badChallanJson.success) {
    console.log(`  ✓ Negative stock correctly blocked with HTTP 400: "${badChallanJson.error}"`);
  } else {
    throw new Error('FAIL: Server did not reject order with insufficient stock!');
  }

  // 5. Test Confirmed Sales Challan & Atomic Stock Reduction
  console.log('\n[5/6] Testing Confirmed Challan & Automatic Stock Deduction...');
  const beforeStock = (await prisma.product.findUnique({ where: { id: testProd.id } }))!.currentStock;

  const validChallanRes = await fetch(`${BASE_URL}/challans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens['sales@erp.com']}`,
    },
    body: JSON.stringify({
      customerId: testCustomer.id,
      status: 'CONFIRMED',
      items: [{ productId: testProd.id, quantity: 3 }],
    }),
  });
  const validChallanJson = await validChallanRes.json();
  if (!validChallanJson.success) throw new Error(`Challan creation failed: ${validChallanJson.error}`);
  console.log(`  ✓ Created CONFIRMED challan: ${validChallanJson.data.challanNumber}`);

  const afterStock = (await prisma.product.findUnique({ where: { id: testProd.id } }))!.currentStock;
  if (beforeStock - afterStock === 3) {
    console.log(`  ✓ Product stock atomically reduced by 3 (from ${beforeStock} to ${afterStock})`);
  } else {
    throw new Error(`FAIL: Stock did not decrease by 3. Before: ${beforeStock}, After: ${afterStock}`);
  }

  // 6. Test Stock Restoral on Cancellation
  console.log('\n[6/6] Testing Challan Cancellation & Stock Restoral...');
  const cancelRes = await fetch(`${BASE_URL}/challans/${validChallanJson.data.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens['admin@erp.com']}`,
    },
    body: JSON.stringify({ status: 'CANCELLED' }),
  });
  const cancelJson = await cancelRes.json();
  if (!cancelJson.success) throw new Error('Challan cancel failed');

  const restoredStock = (await prisma.product.findUnique({ where: { id: testProd.id } }))!.currentStock;
  if (restoredStock === beforeStock) {
    console.log(`  ✓ Product stock restored back to ${restoredStock}`);
  } else {
    throw new Error('FAIL: Stock not restored upon cancellation');
  }

  console.log('\n🎉 ALL BUSINESS LOGIC & RBAC VERIFICATIONS PASSED SUCCESSFULLY! 🎉\n');
}

verifyAll()
  .catch((e) => {
    console.error('VERIFICATION ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
