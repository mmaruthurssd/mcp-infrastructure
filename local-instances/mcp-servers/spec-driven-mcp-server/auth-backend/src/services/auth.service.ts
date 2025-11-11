// Authentication Service - Business logic layer
// Handles password hashing, JWT generation, token management

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { jwtConfig } from '../config/jwt.config';
import {
  RegisterInput,
  LoginInput,
  UserResponse,
  AuthResponse,
  TokenPayload,
  RefreshResponse,
  LogoutResponse,
} from '../types/auth.types';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Register a new user
   * - Validates email uniqueness
   * - Hashes password with bcrypt
   * - Creates user in database
   * - Generates JWT tokens
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password with bcrypt (cost factor 10)
    const hashedPassword = await bcrypt.hash(input.password, jwtConfig.bcrypt.saltRounds);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role.toUpperCase() as any, // Convert to enum format
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.toLowerCase() as any,
    });

    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login existing user
   * - Validates credentials
   * - Compares password hash
   * - Generates new JWT tokens
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.toLowerCase() as any,
    });

    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   * - Validates refresh token from database
   * - Checks expiry and revocation status
   * - Generates new access token
   */
  async refresh(refreshTokenString: string): Promise<RefreshResponse> {
    // Find refresh token in database
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
      include: { user: true },
    });

    if (!refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Check if token is revoked
    if (refreshToken.isRevoked) {
      throw new Error('Refresh token has been revoked');
    }

    // Check if token is expired
    if (new Date() > refreshToken.expiresAt) {
      throw new Error('Refresh token has expired');
    }

    // Check if user is still active
    if (!refreshToken.user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Generate new access token
    const accessToken = this.generateAccessToken({
      userId: refreshToken.user.id,
      email: refreshToken.user.email,
      role: refreshToken.user.role.toLowerCase() as any,
    });

    return { accessToken };
  }

  /**
   * Logout user by invalidating refresh token
   * - Marks refresh token as revoked in database
   */
  async logout(refreshTokenString: string): Promise<LogoutResponse> {
    // Find and revoke refresh token
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
    });

    if (!refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Mark token as revoked
    await prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { isRevoked: true },
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * Generate JWT access token (short-lived, 1 hour)
   */
  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, jwtConfig.accessToken.secret, {
      expiresIn: jwtConfig.accessToken.expiresIn,
    });
  }

  /**
   * Generate refresh token and store in database
   */
  private async generateRefreshToken(userId: string): Promise<string> {
    // Generate token string
    const tokenString = jwt.sign({ userId }, jwtConfig.refreshToken.secret, {
      expiresIn: jwtConfig.refreshToken.expiresIn,
    });

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store in database
    await prisma.refreshToken.create({
      data: {
        token: tokenString,
        userId,
        expiresAt,
      },
    });

    return tokenString;
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.toLowerCase(),
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  /**
   * Verify JWT access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, jwtConfig.accessToken.secret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }
}
