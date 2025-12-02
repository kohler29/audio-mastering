import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';

// JWT Secret dari environment variable
// Pastikan untuk set JWT_SECRET yang kuat di production!
const JWT_SECRET_ENV = process.env.JWT_SECRET;

if (!JWT_SECRET_ENV) {
  throw new Error(
    'JWT_SECRET environment variable is required. Please set a strong, randomly generated secret (minimum 32 characters).'
  );
}

if (JWT_SECRET_ENV.length < 32) {
  console.warn(
    'WARNING: JWT_SECRET should be at least 32 characters long for security. Current length:',
    JWT_SECRET_ENV.length
  );
}

if (JWT_SECRET_ENV === 'your-secret-key-change-in-production') {
  throw new Error(
    'JWT_SECRET must be changed from the default value. Please set a strong, randomly generated secret.'
  );
}

// After validation, we know JWT_SECRET is a string
const JWT_SECRET: string = JWT_SECRET_ENV;
const JWT_EXPIRES_IN: SignOptions['expiresIn'] = (() => {
  const env = process.env.JWT_EXPIRES_IN;
  if (!env) return '7d' as unknown as SignOptions['expiresIn'];
  return /^\d+$/.test(env)
    ? Number(env)
    : (env as unknown as SignOptions['expiresIn']);
})();

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
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
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
    });

    // jwt.verify returns JwtPayload | string, we need to check it's an object
    if (typeof decoded === 'string' || !decoded) {
      return null;
    }

    // Type guard to ensure it has the required properties
    const payload = decoded as jwt.JwtPayload;
    if (!payload.userId || !payload.email || !payload.username) {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      username: payload.username as string,
    };
  } catch {
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
