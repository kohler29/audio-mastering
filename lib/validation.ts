/**
 * Input validation utilities for security
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Additional checks
  if (email.length > 254) {
    return false; // RFC 5321 limit
  }
  
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return false;
  }
  
  if (localPart.length > 64) {
    return false; // RFC 5321 limit
  }
  
  return true;
}

/**
 * Validate username format
 * Rules: 3-30 characters, alphanumeric and underscore only
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  // Length check
  if (username.length < 3 || username.length > 30) {
    return false;
  }
  
  // Only alphanumeric and underscore
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return false;
  }
  
  // Cannot start or end with underscore
  if (username.startsWith('_') || username.endsWith('_')) {
    return false;
  }
  
  // Cannot be all numbers
  if (/^\d+$/.test(username)) {
    return false;
  }
  
  return true;
}

/**
 * Validate password strength
 * Rules: minimum 8 characters, must contain uppercase, lowercase, and number
 */
export function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password harus diisi' };
  }
  
  // Length check
  if (password.length < 8) {
    return { valid: false, error: 'Password minimal 8 karakter' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password maksimal 128 karakter' };
  }
  
  // Complexity requirements
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return {
      valid: false,
      error: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
    };
  }
  
  return { valid: true };
}

/**
 * Sanitize string input
 * Removes leading/trailing whitespace and limits length
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.trim().slice(0, maxLength);
}

/**
 * Sanitize preset name
 * Allows alphanumeric, spaces, hyphens, underscores, and common punctuation
 */
export function sanitizePresetName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  // Remove leading/trailing whitespace
  let sanitized = name.trim();
  
  // Limit length
  sanitized = sanitized.slice(0, 100);
  
  // Remove any null bytes or control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Sanitize folder name
 * Similar to preset name but more restrictive
 */
export function sanitizeFolderName(folder: string | null | undefined): string | null {
  if (!folder || typeof folder !== 'string') {
    return null;
  }
  
  let sanitized = folder.trim();
  
  // Limit length
  sanitized = sanitized.slice(0, 50);
  
  // Remove any null bytes or control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove any path traversal attempts
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  return sanitized || null;
}

/**
 * Sanitize genre name
 * Similar to folder name sanitization
 */
export function sanitizeGenreName(genre: string | null | undefined): string | null {
  if (!genre || typeof genre !== 'string') {
    return null;
  }
  
  let sanitized = genre.trim();
  
  // Limit length
  sanitized = sanitized.slice(0, 50);
  
  // Remove any null bytes or control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove any path traversal attempts
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  return sanitized || null;
}

/**
 * Generate safe username from email or name
 */
export function generateSafeUsername(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Convert to lowercase
  let username = input.toLowerCase();
  
  // Replace spaces and special characters with underscore
  username = username.replace(/[^a-z0-9_]/g, '_');
  
  // Remove consecutive underscores
  username = username.replace(/_+/g, '_');
  
  // Remove leading/trailing underscores
  username = username.replace(/^_+|_+$/g, '');
  
  // Limit length
  username = username.slice(0, 30);
  
  // Ensure it doesn't start with a number
  if (/^\d/.test(username)) {
    username = 'u_' + username;
  }
  
  // Ensure minimum length
  if (username.length < 3) {
    username = username + '_' + Math.random().toString(36).substring(2, 5);
  }
  
  return username;
}

