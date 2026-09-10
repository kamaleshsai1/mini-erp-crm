import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
  getChallanInvoiceHtml,
} from '../controllers/challan.controller';
import { authenticateJwt } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import {
  ChallanCreateSchema,
  ChallanStatusUpdateSchema,
} from '../schemas/challan.schema';

const router = Router();

// Allow public token-in-query or auth header for printable invoice
router.get('/:id/invoice-html', authenticateJwt, getChallanInvoiceHtml);

router.use(authenticateJwt);

router.get('/', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getChallans);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getChallanById);
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  validateRequest({ body: ChallanCreateSchema }),
  createChallan
);
router.patch(
  '/:id/status',
  authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  validateRequest({ body: ChallanStatusUpdateSchema }),
  updateChallanStatus
);

export default router;
