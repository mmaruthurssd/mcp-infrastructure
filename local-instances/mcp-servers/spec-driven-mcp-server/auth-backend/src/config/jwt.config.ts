// JWT Configuration for authentication system

export const jwtConfig = {
  // Access token configuration (short-lived)
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key-change-in-production',
    expiresIn: '1h', // 1 hour as per requirements
  },

  // Refresh token configuration (long-lived)
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
    expiresIn: '7d', // 7 days
  },

  // Bcrypt configuration
  bcrypt: {
    saltRounds: 10, // Cost factor as per requirements
  },
};

// Validate that environment variables are set in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets must be set in production environment');
  }
}
