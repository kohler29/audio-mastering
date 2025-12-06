/**
 * API client utility with CSRF token support and retry logic
 */

import { fetchWithRetry } from './utils/retry';

let csrfTokenCache: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

/**
 * Get CSRF token (with caching)
 */
async function getCSRFToken(): Promise<string | null> {
  // Return cached token if available
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  // If already fetching, return the existing promise
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  // Fetch new token dengan retry logic
  csrfTokenPromise = (async () => {
    try {
      const res = await fetchWithRetry('/api/csrf-token', {
        method: 'GET',
      }, {
        maxRetries: 2,
        initialDelay: 500,
        maxDelay: 2000,
      });
      if (!res.ok) {
        console.warn('Failed to get CSRF token');
        return null;
      }
      const data = await res.json();
      csrfTokenCache = data.token;
      return data.token;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      return null;
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
}

/**
 * Clear CSRF token cache (call after logout or token refresh)
 */
export function clearCSRFTokenCache(): void {
  csrfTokenCache = null;
  csrfTokenPromise = null;
}

/**
 * Fetch with CSRF token support and retry logic
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {},
  retryOptions?: { maxRetries?: number; initialDelay?: number; maxDelay?: number }
): Promise<Response> {
  // Only add CSRF token for state-changing methods
  const method = options.method?.toUpperCase();
  const needsCSRF = method && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);

  if (needsCSRF) {
    const token = await getCSRFToken();
    if (token) {
      // Add CSRF token to headers
      const headers = new Headers(options.headers);
      headers.set('X-CSRF-Token', token);
      options.headers = headers;
    }
  }

  // Gunakan retry logic untuk request yang penting
  // Default: retry untuk POST, PATCH, PUT, DELETE (state-changing operations)
  const shouldRetry = needsCSRF || retryOptions !== undefined;
  
  if (shouldRetry) {
    return fetchWithRetry(url, options, {
      maxRetries: retryOptions?.maxRetries ?? 3,
      initialDelay: retryOptions?.initialDelay ?? 1000,
      maxDelay: retryOptions?.maxDelay ?? 10000,
    });
  }

  return fetch(url, options);
}

