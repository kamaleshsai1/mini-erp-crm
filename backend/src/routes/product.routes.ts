import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
} from '../controllers/product.controller';
import { authenticateJwt } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import {
  ProductCreateSchema,
  ProductUpdateSchema,
  StockAdjustSchema,
} from '../schemas/product.schema';

const router = Router();

router.use(authenticateJwt);

router.get('/', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProducts);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProductById);
router.post(
  '/',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateRequest({ body: ProductCreateSchema }),
  createProduct
);
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateRequest({ body: ProductUpdateSchema }),
  updateProduct
);
router.post(
  '/:id/adjust-stock',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateRequest({ body: StockAdjustSchema }),
  adjustStock
);

export default router;
