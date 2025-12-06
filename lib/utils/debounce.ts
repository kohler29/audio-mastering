/**
 * Debounce utility untuk mengurangi jumlah function calls
 */

/**
 * Debounce function - menunda eksekusi function sampai setelah delay tertentu
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Debounce dengan immediate option - eksekusi langsung pada call pertama
 */
export function debounceImmediate<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const callNow = immediate && !timeout;

    const later = () => {
      timeout = null;
      if (!immediate) {
        func(...args);
      }
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);

    if (callNow) {
      func(...args);
    }
  };
}

