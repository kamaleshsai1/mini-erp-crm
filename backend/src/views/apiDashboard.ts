export function renderApiDashboard(): string {
  const timestamp = new Date().toISOString();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MetroOps API - Live Operations Server</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --surface: #111827;
      --surface-border: #1f2937;
      --card-bg: rgba(17, 24, 39, 0.7);
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --success: #10b981;
      --success-glow: rgba(16, 185, 129, 0.2);
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --accent: #8b5cf6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
      padding: 2.5rem 1.5rem;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(139, 92, 246, 0.12) 0%, transparent 40%);
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--surface-border);
      margin-bottom: 2.5rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .brand-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.35);
    }
    .brand-title h1 {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .brand-title p {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 9999px;
      color: #34d399;
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: 0 0 20px var(--success-glow);
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .hero-banner {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(124, 58, 237, 0.1));
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2.5rem;
      backdrop-filter: blur(10px);
    }
    .hero-banner h2 {
      font-size: 1.4rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }
    .hero-banner p {
      color: #cbd5e1;
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
      max-width: 750px;
    }
    .btn-group {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.4rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .btn-primary {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 25px rgba(37, 99, 235, 0.5);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text);
      border: 1px solid var(--surface-border);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--surface-border);
      border-radius: 14px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
    }
    .card-title {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 0.6rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.85rem;
    }
    .stat-row:last-child { border-bottom: none; }
    .stat-label { color: var(--text-muted); }
    .stat-value { font-weight: 600; font-family: 'JetBrains Mono', monospace; }
    .table-container {
      overflow-x: auto;
      background: var(--card-bg);
      border: 1px solid var(--surface-border);
      border-radius: 14px;
      margin-bottom: 2.5rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;
    }
    th {
      background: rgba(255, 255, 255, 0.03);
      padding: 0.9rem 1.2rem;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--surface-border);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }
    td {
      padding: 0.9rem 1.2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    tr:last-child td { border-bottom: none; }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }
    .badge-get { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .badge-post { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge-put { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-delete { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .code {
      font-family: 'JetBrains Mono', monospace;
      color: #93c5fd;
    }
    footer {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid var(--surface-border);
      color: var(--text-muted);
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-icon">⚡</div>
        <div class="brand-title">
          <h1>MetroOps API Server</h1>
          <p>Production Cloud Backend &bull; Node.js + Express + Prisma</p>
        </div>
      </div>
      <div class="status-badge">
        <span class="pulse-dot"></span>
        <span>SYSTEM OPERATIONAL</span>
      </div>
    </header>

    <div class="hero-banner">
      <h2>👋 Welcome to the MetroOps Operations Backend API</h2>
      <p>
        This server powers the <strong>Full Stack Mini ERP + CRM Portal</strong> for Wholesale & Distribution operations.
        It manages high-throughput inventory, sequential sales challans, atomic stock deductions, and customer interaction timelines.
      </p>
      <div class="btn-group">
        <a href="https://mini-erp-frontend-rqz6.onrender.com" target="_blank" class="btn btn-primary">
          🖥️ Launch Web Portal (Frontend UI)
        </a>
        <a href="/health" class="btn btn-secondary">
          ❤️ Health Check JSON
        </a>
        <a href="https://github.com/kamaleshsai1/mini-erp-crm" target="_blank" class="btn btn-secondary">
          📂 GitHub Repository
        </a>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">🚀 Server Infrastructure</div>
        <div class="stat-row">
          <span class="stat-label">Platform</span>
          <span class="stat-value">Render Cloud (Oregon)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Runtime</span>
          <span class="stat-value">Node.js 18 (TypeScript)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Database</span>
          <span class="stat-value" style="color: #34d399;">PostgreSQL 15 (Active)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Authentication</span>
          <span class="stat-value">JWT Bearer (7-day TTL)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Uptime Check</span>
          <span class="stat-value">${timestamp.substring(11, 19)} UTC</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🔐 Test Login Credentials</div>
        <div class="stat-row">
          <span class="stat-label">All Passwords</span>
          <span class="stat-value" style="color: #60a5fa;">Password123!</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Admin Role</span>
          <span class="stat-value">admin@erp.com</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Sales Role</span>
          <span class="stat-value">sales@erp.com</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Warehouse Role</span>
          <span class="stat-value">warehouse@erp.com</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Accounts Role</span>
          <span class="stat-value">accounts@erp.com</span>
        </div>
      </div>
    </div>

    <h3 style="font-size: 1.1rem; margin-bottom: 1rem; font-weight: 700;">📡 Core REST API Endpoints</h3>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Authorized Roles</th>
            <th>Function</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="badge badge-post">POST</span></td>
            <td class="code">/api/auth/login</td>
            <td>Public</td>
            <td>Sign in and obtain JWT authorization token</td>
          </tr>
          <tr>
            <td><span class="badge badge-get">GET</span></td>
            <td class="code">/api/customers</td>
            <td>Admin, Sales</td>
            <td>Query customer directory with status & tier filters</td>
          </tr>
          <tr>
            <td><span class="badge badge-post">POST</span></td>
            <td class="code">/api/customers</td>
            <td>Admin, Sales</td>
            <td>Create a customer with address, GST, and category</td>
          </tr>
          <tr>
            <td><span class="badge badge-get">GET</span></td>
            <td class="code">/api/products</td>
            <td>All Roles</td>
            <td>List products with live stock levels & alert flags</td>
          </tr>
          <tr>
            <td><span class="badge badge-post">POST</span></td>
            <td class="code">/api/products/adjust-stock</td>
            <td>Admin, Warehouse</td>
            <td>Log inward/outward inventory movement with audit log</td>
          </tr>
          <tr>
            <td><span class="badge badge-get">GET</span></td>
            <td class="code">/api/challans</td>
            <td>All Roles</td>
            <td>Retrieve sales challans and line items</td>
          </tr>
          <tr>
            <td><span class="badge badge-post">POST</span></td>
            <td class="code">/api/challans</td>
            <td>Admin, Sales</td>
            <td>Create Draft or Confirmed challan (atomic deduction)</td>
          </tr>
          <tr>
            <td><span class="badge badge-post">POST</span></td>
            <td class="code">/api/challans/:id/cancel</td>
            <td>Admin, Sales</td>
            <td>Cancel order and restore stock into inventory</td>
          </tr>
          <tr>
            <td><span class="badge badge-get">GET</span></td>
            <td class="code">/health</td>
            <td>Public</td>
            <td>Container liveness probe & health monitor</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer>
      MetroOps &bull; Built with Express, TypeScript & Prisma ORM &bull; Ready for Evaluation
    </footer>
  </div>
</body>
</html>`;
}
