// Authentication Routes
// Defines all authentication API endpoints

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from '../validators/auth.validators';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/auth/register
 * Register a new user
 *
 * Request body:
 * {
 *   email: string,
 *   password: string,
 *   firstName: string,
 *   lastName: string,
 *   role: "admin" | "provider" | "staff" | "patient"
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     user: { id, email, firstName, lastName, role, isActive, createdAt },
 *     accessToken: string,
 *     refreshToken: string
 *   }
 * }
 */
router.post('/register', validate(registerSchema), (req, res) => {
  authController.register(req, res);
});

/**
 * POST /api/auth/login
 * Login with email and password
 *
 * Request body:
 * {
 *   email: string,
 *   password: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     user: { id, email, firstName, lastName, role, isActive, createdAt },
 *     accessToken: string,
 *     refreshToken: string
 *   }
 * }
 */
router.post('/login', validate(loginSchema), (req, res) => {
  authController.login(req, res);
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 *
 * Request body:
 * {
 *   refreshToken: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     accessToken: string
 *   }
 * }
 */
router.post('/refresh', validate(refreshTokenSchema), (req, res) => {
  authController.refresh(req, res);
});

/**
 * POST /api/auth/logout
 * Logout and invalidate refresh token
 *
 * Request body:
 * {
 *   refreshToken: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     success: true,
 *     message: "Logged out successfully"
 *   }
 * }
 */
router.post('/logout', validate(logoutSchema), (req, res) => {
  authController.logout(req, res);
});

export default router;
