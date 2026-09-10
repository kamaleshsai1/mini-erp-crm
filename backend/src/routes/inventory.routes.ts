import { Router } from 'express';
import { getStockLogs } from '../controllers/inventory.controller';
import { authenticateJwt } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticateJwt);

router.get(
  '/logs',
  authorizeRoles('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'),
  getStockLogs
);

export default router;
