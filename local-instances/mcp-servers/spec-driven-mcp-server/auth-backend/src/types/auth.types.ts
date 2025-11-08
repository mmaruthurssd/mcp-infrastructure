// Type definitions for authentication system

export enum UserRole {
  ADMIN = 'admin',
  PROVIDER = 'provider',
  STAFF = 'staff',
  PATIENT = 'patient',
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

// Express Request extension for authenticated requests
export interface AuthenticatedRequest extends Express.Request {
  user?: TokenPayload;
}
