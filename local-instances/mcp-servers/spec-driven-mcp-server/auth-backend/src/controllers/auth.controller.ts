// Authentication Controller
// Handles HTTP requests for authentication endpoints

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  LogoutInput,
} from '../validators/auth.validators';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user account
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const input: RegisterInput = req.body;

      const result = await authService.register(input);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Registration error:', error);

      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Registration failed',
      });
    }
  }

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const input: LoginInput = req.body;

      const result = await authService.login(input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Login error:', error);

      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('Invalid email or password') ||
            error.message.includes('Account is deactivated')) {
          res.status(401).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Login failed',
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const input: RefreshTokenInput = req.body;

      const result = await authService.refresh(input.refreshToken);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Refresh token error:', error);

      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('Invalid') ||
            error.message.includes('revoked') ||
            error.message.includes('expired') ||
            error.message.includes('deactivated')) {
          res.status(401).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Token refresh failed',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout by invalidating refresh token
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const input: LogoutInput = req.body;

      const result = await authService.logout(input.refreshToken);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Logout error:', error);

      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('Invalid')) {
          res.status(401).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }
}
