import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. User authentication is required.',
      });
    }

    // Admin has access to all routes by default
    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Forbidden. Your role (${req.user.role}) does not have permission to perform this action. Required: ${allowedRoles.join(', ')}`,
    });
  };
};
