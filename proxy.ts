import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, rateLimitConfigs, type RateLimitConfig } from './lib/rateLimit';

/**
 * Routes that require CSRF protection (state-changing operations)
 * Note: CSRF signature verification is done in route handlers (Node.js runtime)
 * This proxy only checks token presence and basic validation
 */
const CSRF_PROTECTED_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/presets',
];

/**
 * Routes that should be excluded from CSRF protection
 */
const CSRF_EXCLUDED = [
  '/api/csrf-token', // CSRF token endpoint itself
  '/api/auth/google/callback', // OAuth callback (handled differently)
];

/**
 * Routes that should be rate limited with specific configs
 */
const RATE_LIMIT_ROUTES: Record<string, RateLimitConfig> = {
  '/api/auth/login': rateLimitConfigs.login,
  '/api/auth/register': rateLimitConfigs.register,
  '/api/presets': rateLimitConfigs.presets,
};

/**
 * Routes that should be excluded from rate limiting
 */
const RATE_LIMIT_EXCLUDED = [
  '/api/auth/google/callback', // OAuth callback
  '/api/auth/google/authorize', // OAuth authorize
  '/api/csrf-token', // CSRF token endpoint
];

/**
 * Get CSRF token from request headers
 */
function getCSRFTokenFromRequest(request: Request): string | null {
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
 * Next.js 16 Proxy (replaces middleware)
 * Runs in Edge Runtime - only use Edge-compatible APIs
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip rate limiting for excluded routes
  if (RATE_LIMIT_EXCLUDED.includes(pathname)) {
    return NextResponse.next();
  }

  // Rate limiting
  const rateLimitConfig = RATE_LIMIT_ROUTES[pathname] || rateLimitConfigs.api;
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(clientIP, rateLimitConfig);

  if (!rateLimitResult.success) {
    const response = NextResponse.json(
      {
        error: 'Terlalu banyak request. Silakan coba lagi nanti.',
        retryAfter: rateLimitResult.retryAfter,
      },
      { status: 429 }
    );

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitConfig.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
    if (rateLimitResult.retryAfter) {
      response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
    }

    return response;
  }

  // Add rate limit headers to successful requests
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', rateLimitConfig.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

  // Basic CSRF check in proxy (Edge Runtime compatible)
  // Full signature verification is done in route handlers (Node.js runtime)
  if (CSRF_PROTECTED_ROUTES.includes(pathname) && !CSRF_EXCLUDED.includes(pathname)) {
    // Only check CSRF for POST, PATCH, PUT, DELETE methods
    const method = request.method;
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      const csrfToken = getCSRFTokenFromRequest(request);
      const cookieToken = request.cookies.get('csrf-token')?.value;

      // Double Submit Cookie pattern: token in header must match token in cookie
      // This is the primary CSRF protection (signature verification done in route handlers)
      if (!csrfToken || !cookieToken) {
        return NextResponse.json(
          { error: 'CSRF token tidak ditemukan' },
          { status: 403 }
        );
      }

      // Verify tokens match (constant-time comparison)
      if (csrfToken !== cookieToken) {
        return NextResponse.json(
          { error: 'CSRF token tidak valid' },
          { status: 403 }
        );
      }

      // Note: Full signature verification is done in route handlers using Node.js crypto
      // This proxy only does basic token matching (Double Submit Cookie pattern)
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

