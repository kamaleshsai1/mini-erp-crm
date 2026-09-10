import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addFollowUpNote,
} from '../controllers/customer.controller';
import { authenticateJwt } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import {
  CustomerCreateSchema,
  CustomerUpdateSchema,
  FollowUpNoteSchema,
} from '../schemas/customer.schema';

const router = Router();

router.use(authenticateJwt);

router.get('/', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'), getCustomers);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'), getCustomerById);
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  validateRequest({ body: CustomerCreateSchema }),
  createCustomer
);
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'SALES'),
  validateRequest({ body: CustomerUpdateSchema }),
  updateCustomer
);
router.delete('/:id', authorizeRoles('ADMIN'), deleteCustomer);

router.post(
  '/:id/notes',
  authorizeRoles('ADMIN', 'SALES'),
  validateRequest({ body: FollowUpNoteSchema }),
  addFollowUpNote
);

export default router;
