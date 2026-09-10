import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

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

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mini-erp-crm-backend',
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
