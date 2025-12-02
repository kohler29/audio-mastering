/**
 * CSRF protection utilities
 */

import { randomBytes, createHmac } from 'crypto';

const CSRF_SECRET_ENV = process.env.CSRF_SECRET || process.env.JWT_SECRET;

if (!CSRF_SECRET_ENV) {
  throw new Error('CSRF_SECRET or JWT_SECRET must be set for CSRF protection');
}

// After validation, we know CSRF_SECRET is a string
const CSRF_SECRET: string = CSRF_SECRET_ENV;

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  const token = randomBytes(32).toString('hex');
  return token;
}

/**
 * Create a signed CSRF token
 */
export function createSignedCSRFToken(token: string): string {
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(token);
  const signature = hmac.digest('hex');
  return `${token}.${signature}`;
}

/**
 * Verify a signed CSRF token
 */
export function verifyCSRFToken(signedToken: string): boolean {
  if (!signedToken || typeof signedToken !== 'string') {
    return false;
  }

  const parts = signedToken.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [token, signature] = parts;

  // Recreate signature
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(token);
  const expectedSignature = hmac.digest('hex');

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(signature, expectedSignature);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Get CSRF token from request headers
 */
export function getCSRFTokenFromRequest(request: Request): string | null {
  // Check X-CSRF-Token header first
  const headerToken = request.headers.get('x-csrf-token');
  if (headerToken) {
    return headerToken;
  }

  // Check X-XSRF-TOKEN header (common alternative)
  const xsrfToken = request.headers.get('x-xsrf-token');
  if (xsrfToken) {
    return xsrfToken;
  }

  return null;
}

/**
 * Generate and sign a CSRF token for response
 */
export function generateSignedCSRFToken(): string {
  const token = generateCSRFToken();
  return createSignedCSRFToken(token);
}

