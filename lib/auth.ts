import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT Secret dari environment variable
// Pastikan untuk set JWT_SECRET yang kuat di production!
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash password menggunakan bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password dengan hash yang tersimpan
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate JWT token untuk user
 */
export function generateToken(payload: TokenPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any,
    issuer: 'master-pro',
    audience: 'master-pro-users',
  };

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
    },
    JWT_SECRET,
    options
  );
}

/**
 * Verify dan decode JWT token
 * Returns null jika token tidak valid atau expired
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'master-pro',
      audience: 'master-pro-users',
    }) as TokenPayload;

    return {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };
  } catch (error) {
    // Token invalid, expired, atau tidak sesuai
    return null;
  }
}

/**
 * Decode token tanpa verifikasi (untuk debugging)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

