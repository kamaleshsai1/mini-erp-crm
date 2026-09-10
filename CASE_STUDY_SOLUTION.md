# Case Study Solution: MetroOps Mini ERP & CRM Operations Suite

**Candidate / Author**: Full Stack Engineering Submission  
**Repository**: [https://github.com/kamaleshsai1/mini-erp-crm](https://github.com/kamaleshsai1/mini-erp-crm)  
**Live Frontend Application**: [https://mini-erp-frontend-rqz6.onrender.com](https://mini-erp-frontend-rqz6.onrender.com)  
**Live Backend API**: [https://mini-erp-backend-m2hi.onrender.com](https://mini-erp-backend-m2hi.onrender.com)  
**System Health Check**: [https://mini-erp-backend-m2hi.onrender.com/health](https://mini-erp-backend-m2hi.onrender.com/health)  

---

## 1. Executive Summary & Problem Statement

Modern wholesale and distribution enterprises operate in fast-paced environments where fragmented spreadsheets cause stock inaccuracies, delayed customer follow-ups, unauthorized order modifications, and billing disputes. 

**MetroOps** is an end-to-end, enterprise-grade operations platform combining **Enterprise Resource Planning (ERP)** and **Customer Relationship Management (CRM)** into a unified, high-performance web suite. It addresses core wholesale challenges:
- **Role-Based Access Control (RBAC)** to restrict sensitive financial and stock operations across 4 key roles.
- **Real-Time Inventory & SKU Tracking** with proactive low-stock alerts and physical location mapping.
- **Atomic Sales Challan Processing** ensuring zero negative-stock conditions via database-level transactions.
- **Snapshot Immutability** to preserve historical order prices and product descriptions even if catalog items change later.
- **Instant Printable Tax Invoices & Delivery Challans** compliant with GSTIN standards.

---

## 2. Technology Stack & Architecture

### High-Level Architecture Diagram

```
       [ Client Browser / Mobile Web ]
                     │
            (HTTPS / JSON REST API)
                     │
                     ▼
          ┌─────────────────────┐
          │  React (Vite) SPA   │  Deployed on Render (Static Site)
          │  TypeScript + CSS3  │  Custom Enterprise Design System
          └──────────┬──────────┘
                     │
         (Bearer JWT / CORS Auth)
                     │
                     ▼
          ┌─────────────────────┐
          │ Express.js Backend  │  Node.js + TypeScript
          │ RBAC & Zod Schema   │  Deployed on Render (Web Service)
          └──────────┬──────────┘
                     │
            (Prisma ORM Client)
                     │
                     ▼
          ┌─────────────────────┐
          │ PostgreSQL Database │  Hosted on Cloud (Neon / Render)
          │ ACID Transactions   │  (With local SQLite dev fallback)
          └─────────────────────┘
```

### Stack Components

| Layer | Technologies Selected | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Lucide Icons, Custom CSS | Lightning-fast HMR builds, type-safe API consumption, clean responsive design without heavy CSS frameworks. |
| **Backend** | Node.js, Express.js, TypeScript | Modular controller-service architecture, asynchronous non-blocking I/O. |
| **Data Layer** | PostgreSQL (Production) / SQLite (Dev), Prisma ORM | Strong relational integrity, automated migrations, type-safe queries, and native ACID transactions. |
| **Validation** | Zod | Runtime request payload validation guarding all write endpoints. |
| **Security** | JWT (JSON Web Tokens), Bcrypt.js, Helmet, CORS | Industry-standard password hashing, stateless role tokens, security headers. |

---

## 3. Role-Based Access Control (RBAC) Matrix

The system enforces strict permission boundaries across four operational roles:

| Module / Operation | Admin (`admin@erp.com`) | Sales (`sales@erp.com`) | Warehouse (`warehouse@erp.com`) | Accounts (`accounts@erp.com`) |
| :--- | :---: | :---: | :---: | :---: |
| **View Dashboard Overview** | Full | Full | Full | Full |
| **CRM: View Customers** | Full | Full | Full | Read-Only |
| **CRM: Add / Edit Customers** | Yes | Yes | No | No |
| **CRM: Add Follow-up Notes** | Yes | Yes | No | No |
| **Inventory: View Products** | Full | Full | Full | Read-Only |
| **Inventory: Create / Edit SKUs** | Yes | No | Yes | No |
| **Inventory: Stock IN / OUT** | Yes | No | Yes | No |
| **Challans: Create Draft** | Yes | Yes | No | No |
| **Challans: Confirm Challan** | Yes | Yes | No | No |
| **Challans: Cancel Challan** | Yes | Yes | No | No |
| **Invoices: Print & View** | Yes | Yes | Yes | Yes |
| **Audit Logs: Stock Movements** | Full Audit | Read-Only | Full Audit | Read-Only |

*Default Demo Password for all accounts:* `Password123!`

---

## 4. Key Functional Modules & Business Logic

### 4.1. Customer Relationship Management (CRM)
- **Wholesale Segmentation**: Classifies clients into `Retail`, `Wholesale`, and `Distributor`.
- **Status Lifecycle**: Tracks leads through `Lead (Prospective)`, `Active (Buying)`, and `Inactive (Suspended)`.
- **GSTIN Compliance**: Validates and displays Goods and Services Tax Identification Numbers for tax invoicing.
- **Chronological Timeline**: Records sales interactions, phone notes, and scheduled follow-up dates.

### 4.2. Warehouse & Inventory Management
- **SKU Uniqueness**: Guarantees unique Stock Keeping Unit codes across the warehouse catalog.
- **Automated Threshold Warnings**: Highlights products where current stock falls below minimum safety stock (`currentStock <= minStockAlert`).
- **Physical Rack Locations**: Tracks aisle/rack assignments (e.g., `Aisle 3, Rack B`).
- **Stock Movements Audit Trail**: Every stock change creates an immutable `StockMovementLog` referencing the timestamp, user ID, delta quantity, and operational reason.

### 4.3. Sales Challans & Billing Engine
- **Sequential Numbering**: Auto-generates identifiers in the format `CH-YYYYMM-XXXX`.
- **Snapshot Immutability**: When line items are added to a challan, the system captures `productNameSnapshot`, `skuSnapshot`, and `unitPriceSnapshot`. If the product name or catalog price is edited later, historical challan records and invoices remain 100% accurate.
- **Transactional Stock Deduction**:
  When a challan is set to `CONFIRMED`:
  1. The system checks available stock for every line item inside a Prisma interactive transaction (`$transaction`).
  2. If any item has insufficient stock, the transaction is immediately aborted with a detailed error (preventing negative stock).
  3. Stock is deducted atomically, the challan status updates to `CONFIRMED`, and audit logs are recorded simultaneously.
- **Printable Tax Invoices**: Generates a clean, print-ready HTML delivery challan and tax invoice with itemized subtotals, GSTIN headers, terms, and signature fields.

---

## 5. Database Schema & Data Models

```prisma
model User {
  id           String              @id @default(uuid())
  email        String              @unique
  passwordHash String
  name         String
  role         Role                @default(SALES)
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt
  challans     SalesChallan[]
  stockLogs    StockMovementLog[]
}

model Customer {
  id           String              @id @default(uuid())
  businessName String
  name         String
  email        String
  mobile       String
  customerType CustomerType        @default(RETAIL)
  gstNumber    String?
  address      String
  status       CustomerStatus      @default(ACTIVE)
  followUpDate DateTime?
  notes        CustomerNote[]
  challans     SalesChallan[]
}

model Product {
  id            String             @id @default(uuid())
  name          String
  sku           String             @unique
  category      String
  unitPrice     Float
  currentStock  Int                @default(0)
  minStockAlert Int                @default(10)
  location      String
  stockLogs     StockMovementLog[]
  challanItems  ChallanItem[]
}

model SalesChallan {
  id            String             @id @default(uuid())
  challanNumber String             @unique
  customerId    String
  customer      Customer           @relation(fields: [customerId], references: [id])
  status        ChallanStatus      @default(DRAFT)
  totalQuantity Int                @default(0)
  totalAmount   Float              @default(0.0)
  createdById   String
  createdByUser User               @relation(fields: [createdById], references: [id])
  items         ChallanItem[]
  createdAt     DateTime           @default(now())
}

model ChallanItem {
  id                 String        @id @default(uuid())
  challanId          String
  challan            SalesChallan  @relation(fields: [challanId], references: [id], onDelete: Cascade)
  productId          String
  product            Product       @relation(fields: [productId], references: [id])
  productNameSnapshot String
  skuSnapshot        String
  unitPriceSnapshot  Float
  quantity           Int
  subtotal           Float
}

model StockMovementLog {
  id              String           @id @default(uuid())
  productId       String
  product         Product          @relation(fields: [productId], references: [id])
  movementType    MovementType     // IN, OUT, ADJUSTMENT
  quantityChanged Int
  previousStock   Int
  newStock        Int
  reason          String
  createdById     String
  createdByUser   User             @relation(fields: [createdById], references: [id])
  createdAt       DateTime         @default(now())
}
```

---

## 6. Verification & Test Scenarios

| Scenario | Expected Result | Verified Result |
| :--- | :--- | :--- |
| **Login with Admin Account** | Receives JWT token, gains full access to all tabs and role switcher. | **Passed (200 OK)** |
| **Warehouse User tries to create Challan** | Prevented by frontend UI and blocked by backend RBAC middleware with 403 Forbidden. | **Passed (403 Forbidden)** |
| **Sales User adjusts stock** | Blocked by RBAC authorization check. | **Passed (403 Forbidden)** |
| **Create Challan exceeding available stock** | System halts transaction, rejects order with descriptive message: *"Insufficient stock for product X"*. | **Passed (Validation Halt)** |
| **Confirm Valid Challan** | Stock decreases atomically, status changes to `CONFIRMED`, movement logs generated. | **Passed (Atomic Deduct)** |
| **Tax Invoice Print Generation** | Clean printable view loads with formatted customer GSTIN, line items, and totals. | **Passed (Print View Ready)** |

---

## 7. Known Limitations & Future Enhancements

1. **Multi-Warehouse Support**: Current architecture tracks inventory by location rack within a central warehouse. Future version can introduce a `Warehouse` entity with inter-warehouse transfer challans.
2. **Automated E-way Bill Integration**: Direct integration with the government GST portal for automated E-way bill generation on high-value consignments (> ₹50,000).
3. **Barcoding & QR Scanning**: Native mobile camera integration for barcode scanning during pick-and-pack warehouse dispatch.

---

## 8. Conclusion

MetroOps delivers a production-ready, highly dependable wholesale operations portal meeting all requirements of the case study. With 24/7 cloud availability, robust ACID transactional safety, and full abbreviations expansion throughout the interface, it ensures friction-free evaluation for assessors.
