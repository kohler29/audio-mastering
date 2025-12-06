/**
 * Retry utility dengan exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 detik
  maxDelay: 10000, // 10 detik
  backoffMultiplier: 2,
  retryableStatuses: [429, 500, 502, 503, 504], // Too Many Requests, Server Errors
  retryableErrors: ['NetworkError', 'Failed to fetch', 'Network request failed'],
};

/**
 * Menghitung delay untuk retry dengan exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Mengecek apakah error dapat di-retry
 */
function isRetryable(error: unknown, options: Required<RetryOptions>, response?: Response): boolean {
  // Cek status code
  if (response) {
    if (options.retryableStatuses.includes(response.status)) {
      return true;
    }
    // 429 (Too Many Requests) selalu retryable
    if (response.status === 429) {
      return true;
    }
  }

  // Cek error message
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    return options.retryableErrors.some(retryableError =>
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  // Network errors biasanya retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  return false;
}

/**
 * Retry function dengan exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error: unknown) {
      lastError = error;

      // Jika ini adalah Response error, simpan response-nya
      if (error instanceof Response) {
        lastResponse = error;
      } else if (error && typeof error === 'object' && 'response' in error) {
        lastResponse = (error as { response: Response }).response;
      }

      // Jika sudah mencapai max retries, throw error
      if (attempt >= opts.maxRetries) {
        break;
      }

      // Cek apakah error dapat di-retry
      if (!isRetryable(error, opts, lastResponse)) {
        throw error;
      }

      // Hitung delay untuk retry berikutnya
      const delay = calculateDelay(attempt, opts);

      // Jika 429, gunakan Retry-After header jika ada
      if (lastResponse?.status === 429) {
        const retryAfter = lastResponse.headers.get('Retry-After');
        if (retryAfter) {
          const retryAfterSeconds = parseInt(retryAfter, 10);
          if (!isNaN(retryAfterSeconds)) {
            await new Promise(resolve => setTimeout(resolve, retryAfterSeconds * 1000));
            continue;
          }
        }
      }

      // Tunggu sebelum retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Jika semua retry gagal, throw error terakhir
  throw lastError;
}

/**
 * Wrapper untuk fetch dengan retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, options);
    
    // Jika response tidak OK dan retryable, throw response untuk di-retry
    if (!response.ok && isRetryable(null, { ...DEFAULT_OPTIONS, ...retryOptions }, response)) {
      throw response;
    }
    
    return response;
  }, retryOptions);
}
