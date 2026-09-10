import { Router } from 'express';
import { login, getCurrentUser, register } from '../controllers/auth.controller';
import { authenticateJwt } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import { LoginSchema, RegisterSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/login', validateRequest({ body: LoginSchema }), login);
router.get('/me', authenticateJwt, getCurrentUser);
router.post(
  '/register',
  authenticateJwt,
  authorizeRoles('ADMIN'),
  validateRequest({ body: RegisterSchema }),
  register
);

export default router;
