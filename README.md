# Mini ERP (Enterprise Resource Planning) + CRM (Customer Relationship Management) Operations Portal

> **Full Stack Developer Case Study**: Wholesale & Distribution Operations Suite  
> Built with Node.js, Express, TypeScript, PostgreSQL (Prisma ORM - Object-Relational Mapping), React (Vite), and RBAC (Role-Based Access Control).  
> 
> **Live 24/7 Production Deployment**:
> - **Frontend Portal (UI - User Interface)**: [https://mini-erp-frontend-rqz6.onrender.com](https://mini-erp-frontend-rqz6.onrender.com)
> - **Backend API (Application Programming Interface)**: [https://mini-erp-backend-m2hi.onrender.com](https://mini-erp-backend-m2hi.onrender.com)
> - **Backend Health Check**: [https://mini-erp-backend-m2hi.onrender.com/health](https://mini-erp-backend-m2hi.onrender.com/health)
> - **GitHub Repository**: [https://github.com/kamaleshsai1/mini-erp-crm](https://github.com/kamaleshsai1/mini-erp-crm)

---

## Executive Summary & Key Highlights

This application is designed specifically for wholesale and distribution businesses managing high-throughput inventory, tiered customer relationships, warehouse fulfillment, and sales challans.

- **RBAC (Role-Based Access Control)**: 4 tailored roles (**Admin**, **Sales**, **Warehouse**, **Accounts**).
- **Interactive Role Switcher**: 1-Click quick role switcher bar at the top of the app header for seamless evaluator testing.
- **Customer CRM (Customer Relationship Management)**: Multi-tier categorization (`Retail`, `Wholesale`, `Distributor`), status tracking (`Lead`, `Active`, `Inactive`), GST (Goods and Services Tax) registration numbers, follow-up date scheduling, and chronological interaction timeline.
- **Inventory & Warehouse**: Real-time SKU (Stock Keeping Unit) catalog, low-stock threshold alert system, and manual inward/outward adjustments with mandatory audit trails.
- **Sales Challan Business Logic**:
  - Auto-generated sequential identifiers (`CH-YYYYMM-XXXX`).
  - Immutability: Product snapshot caching (name, SKU - Stock Keeping Unit, unit price at time of order).
  - Atomic stock deductions upon confirmation using ACID (Atomicity, Consistency, Isolation, Durability) database transactions.
  - Negative-stock prevention with clear, descriptive API (Application Programming Interface) error diagnostics.
  - Instant print & exportable Tax Invoice / Delivery Challan in PDF (Portable Document Format).
- **Dual Database Portability**: Runs with zero-config out-of-the-box on SQLite (`dev.db`), and includes production PostgreSQL schema and Docker Compose ready for cloud deployment (Neon, Supabase, Render, AWS RDS).

---

## Test Login Credentials (All 4 Roles)

All demo accounts share the password: **`Password123!`**

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@erp.com` | `Password123!` | Unrestricted full access across all CRM, Products, Logs, Challans, and Users |
| **Sales** | `sales@erp.com` | `Password123!` | Manage Customers, schedule follow-ups, create Sales Challans (Draft/Confirmed) |
| **Warehouse** | `warehouse@erp.com` | `Password123!` | Manage Product SKUs, execute Stock IN/OUT adjustments, monitor low stock |
| **Accounts** | `accounts@erp.com` | `Password123!` | Inspect Challan financial totals, export/print Tax Invoices, verify billing |

> **Evaluator Tip**: In the top header bar, click on any role pill (**Admin**, **Sales**, **Warehouse**, **Accounts**) to instantly switch session context without manual re-typing!

---

## Architecture & Database Design

```
mini-erp-crm/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment configuration
│   │   ├── controllers/        # Auth, Customers, Products, Challans, Inventory, Dashboard
│   │   ├── middleware/         # JWT Auth, RBAC, Zod Validation, Central Error Handler
│   │   ├── routes/             # REST Route mappings
│   │   ├── schemas/            # Zod validation schemas
│   │   └── index.ts            # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma       # Active schema (SQLite zero-friction local mode)
│   │   ├── schema.postgresql.prisma # Production PostgreSQL schema (Docker / Cloud)
│   │   └── seed.ts             # Realistic wholesale seed dataset
│   ├── Dockerfile
│   ├── nginx.conf              # Production Nginx reverse proxy configuration
│   ├── ecosystem.config.js     # Production PM2 process manager config
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/layout/  # Sidebar, Header with RoleSwitcher
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── pages/              # Dashboard, Customers, Products, StockLogs, Challans, Login
│   │   ├── services/api.ts     # Typed fetch client with JWT interceptor
│   │   ├── types.ts            # Data models matching backend DTOs
│   │   └── index.css           # Modern, enterprise CSS design system
│   ├── Dockerfile
│   └── package.json
├── .github/workflows/ci.yml    # GitHub Actions automated build & CI pipeline
├── docker-compose.yml          # PostgreSQL 15 + Backend + Frontend
├── mini-erp-crm.postman_collection.json # Complete API collection
└── README.md
```

### Data Models & Relationships

```mermaid
erDiagram
    User ||--o{ CustomerFollowUpNote : "creates"
    User ||--o{ StockMovementLog : "logs"
    User ||--o{ SalesChallan : "creates"
    Customer ||--o{ CustomerFollowUpNote : "has"
    Customer ||--o{ SalesChallan : "places"
    SalesChallan ||--|{ SalesChallanItem : "contains"
    Product ||--o{ StockMovementLog : "tracks"
    Product ||--o{ SalesChallanItem : "references"
```

---

## Quick Start Guide (Local Development)

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Setup Backend
```bash
cd backend
npm install

# Push database schema & seed demo wholesale data
npm run prisma:push
npm run prisma:seed

# Start backend dev server (Runs on http://localhost:5000)
npm run dev
```

### 2. Setup Frontend
```bash
cd ../frontend
npm install

# Start frontend dev server (Runs on http://localhost:5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser and log in with any demo role button!

---

## Deployment & DevOps (Development Operations) Guide

### 1. AWS (Amazon Web Services) Deployment Options

#### Option A: AWS EC2 (Elastic Compute Cloud - Single-Instance with Docker Compose)
1. **Launch EC2 Instance**: Launch an AWS EC2 `t3.small` or `t3.medium` instance running Ubuntu 22.04 LTS (Long Term Support).
2. **Configure Security Group**: Open inbound ports `22` (SSH - Secure Shell), `80` (HTTP - Hypertext Transfer Protocol), and `443` (HTTPS - Secure HTTP).
3. **Install Docker & Docker Compose**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose
   sudo systemctl enable docker
   ```
4. **Deploy Application**:
   ```bash
   git clone https://github.com/kamaleshsai1/mini-erp-crm.git
   cd mini-erp-crm
   docker-compose up -d --build
   ```

#### Option B: AWS ECS (Elastic Container Service - Fargate) + AWS RDS (Relational Database Service) PostgreSQL
- **Database**: AWS RDS PostgreSQL instance (`db.t4g.micro` for cost-efficiency).
- **Backend Container**: Built from `backend/Dockerfile` and deployed to an ECS Fargate Service behind an ALB (Application Load Balancer).
- **Frontend Container**: Built from `frontend/Dockerfile` (Nginx serving React SPA - Single Page Application) or hosted via AWS S3 (Simple Storage Service) + CloudFront CDN (Content Delivery Network).

---

### 2. Server Setup Documentation (Bare-Metal / VPS - Virtual Private Server / Ubuntu)

For production deployment directly on an Ubuntu/Debian Linux server without Docker:

```bash
# 1. Update OS packages and install Node.js 18
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx

# 2. Install PM2 process manager globally
sudo npm install -g pm2

# 3. Clone and build the application
cd /var/www
sudo git clone https://github.com/kamaleshsai1/mini-erp-crm.git
cd mini-erp-crm

# Backend build
cd backend
npm ci
cp .env.example .env # edit environment variables
npx prisma generate
npm run build
npx prisma db push
npm run prisma:seed

# Start backend with PM2 cluster mode
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Frontend build
cd ../frontend
npm ci
npm run build

# 4. Configure Nginx Reverse Proxy
sudo cp ../backend/nginx.conf /etc/nginx/sites-available/mini-erp
sudo ln -s /etc/nginx/sites-available/mini-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 5. Setup Free SSL via Let's Encrypt Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d erp.yourdomain.com
```

---

### 3. Environment Variables Management

Environment variables are isolated through `.env` files and never committed to version control (`.gitignore` protects secrets).

| Variable | Description | Example (Development) | Example (Production / AWS) |
| :--- | :--- | :--- | :--- |
| `PORT` | HTTP port for Node.js Express server | `5000` | `5000` |
| `NODE_ENV` | Application environment state | `development` | `production` |
| `DATABASE_URL` | Prisma connection string | `file:./dev.db` (SQLite) | `postgresql://user:pass@rds-host:5432/erp?schema=public` |
| `JWT_SECRET` | Secret key used for signing JWT auth tokens | `super-secret-jwt-token-2026` | `generate-random-high-entropy-secret` |
| `JWT_EXPIRES_IN` | Token time-to-live | `7d` | `7d` |
| `CORS_ORIGIN` | Permitted browser origins | `http://localhost:5173` | `https://erp.yourcompany.com` |

---

### 4. Free Cloud Hosting Deployment Guide

As requested in the case study guidelines (Page 4):

1. **Database**: Free cloud PostgreSQL on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
   - Copy the PostgreSQL connection string (`postgresql://...`).
2. **Backend**: Free deployment on [Render.com](https://render.com) or [Railway.app](https://railway.app).
   - Root directory: `backend`
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npm run start`
   - Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`.
3. **Frontend**: Free deployment on [Vercel](https://vercel.com) or [Render Static Site](https://render.com).
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Set API proxy or backend URL in `vite.config.ts`.

---

## Docker Deployment (Bonus)

To spin up the entire multi-container stack (PostgreSQL + Express Backend + Nginx/React Frontend):

```bash
docker compose up --build -d
```

- **Frontend**: `http://localhost:80`
- **Backend API**: `http://localhost:5000/api`
- **PostgreSQL**: `localhost:5432` (`mini_erp_db`)

---

## 📡 REST API Reference Summary

### Authentication
- `POST /api/auth/login` — Authenticate and receive JWT token.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
- `POST /api/auth/register` — Register internal user (Admin only).

### Customers (CRM)
- `GET /api/customers` — Search and filter customers (`?search=&status=&customerType=&page=`).
- `POST /api/customers` — Create customer.
- `GET /api/customers/:id` — View customer detail, order history, and follow-up timeline.
- `PUT /api/customers/:id` — Update customer information.
- `DELETE /api/customers/:id` — Delete customer (Admin only; blocked if orders exist).
- `POST /api/customers/:id/notes` — Append a follow-up interaction note to customer profile.

### Products & Inventory
- `GET /api/products` — Catalog list with search, category filter, and low-stock filter (`?lowStock=true`).
- `POST /api/products` — Add product SKU (Admin & Warehouse).
- `GET /api/products/:id` — Product detail with movement history.
- `PUT /api/products/:id` — Update product price, min stock threshold, or location.
- `POST /api/products/:id/adjust-stock` — Adjust stock IN or OUT with mandatory reason.

### Stock Movement Audit Trail
- `GET /api/inventory/logs` — Immutable audit log of all inward/outward movements (`?movementType=IN|OUT`).

### Sales Challans
- `GET /api/challans` — List challans with search and status filters.
- `POST /api/challans` — Create Challan (`DRAFT` or `CONFIRMED`). If `CONFIRMED`, automatically validates available stock, deducts inventory, and logs outward movements atomically.
- `GET /api/challans/:id` — View full snapshot line items and customer info.
- `PATCH /api/challans/:id/status` — Transition from `DRAFT` to `CONFIRMED` (with stock deduction check) or to `CANCELLED` (with automatic inventory restock).
- `GET /api/challans/:id/invoice-html` — Printable/exportable branded Tax Invoice and Delivery Challan.

### Dashboard
- `GET /api/dashboard/stats` — Real-time KPIs (Total Revenue, Active Accounts, Low Stock Count, Pending Challans, and recent feeds).

---

## Postman Collection

Import `mini-erp-crm.postman_collection.json` directly into Postman.  
- Includes pre-configured environment variables (`baseUrl`, `adminToken`, `salesToken`, `warehouseToken`, `accountsToken`).
- Pre-scripted login requests that automatically save the JWT token to collection variables.

---

## Important Assumptions & Architectural Decisions

1. **Snapshot Immutability**:
   When a sales challan is created, the item names, SKUs, and unit prices are stored directly as snapshot fields on `SalesChallanItem`. This guarantees that subsequent product price updates or renamings never corrupt historical orders or invoices.
2. **Negative Stock Guard**:
   Stock cannot go below zero under any condition. If a user tries to confirm a challan where requested quantity exceeds current stock, the transaction rejects immediately with a clear error payload (`Insufficient stock for product...`).
3. **Draft vs Confirmed Flow**:
   Draft challans do not hold or deduct stock, allowing sales reps to draft quotations. The moment a challan is set to `CONFIRMED`, stock is deducted in an atomic transaction. If a confirmed challan is cancelled, items are automatically restocked with an inward audit log entry.
