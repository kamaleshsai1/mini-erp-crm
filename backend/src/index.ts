import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { renderApiDashboard } from './views/apiDashboard';

const app = express();

// Middleware setup
app.use(
  cors({
    origin: '*', // Allow all during dev/testing, configurable via CORS_ORIGIN
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(morgan('dev'));

// Root status and welcoming endpoint
app.get('/', (req, res) => {
  // If requested by a browser, return the rich interactive API dashboard
  if (req.accepts('html') || req.headers.accept?.includes('text/html')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(renderApiDashboard());
  }

  // Otherwise return standard JSON for curl/postman/code
  return res.json({
    name: 'MetroOps - Mini ERP + CRM Backend API',
    version: '1.0.0',
    status: 'online',
    description: 'Operations Portal Backend with RBAC, CRM, Inventory & Sales Challans',
    health: '/health',
    apiBase: '/api',
    frontend: 'https://mini-erp-frontend-rqz6.onrender.com',
    documentation: 'https://github.com/kamaleshsai1/mini-erp-crm#readme'
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mini-erp-crm-backend',
    database: 'connected'
  });
});

// API Routes
app.use('/api', routes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 Mini ERP + CRM Backend running on port ${config.port}`);
  console.log(`👉 Environment: ${config.nodeEnv}`);
  console.log(`👉 Health check: http://localhost:${config.port}/health`);
  console.log(`👉 API Base: http://localhost:${config.port}/api`);
  console.log(`====================================================`);
});

export default app;
