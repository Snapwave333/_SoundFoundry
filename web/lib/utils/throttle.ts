/**
 * Creates a throttled function that only invokes the provided function
 * at most once per every `wait` milliseconds.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastRun = 0;

  return function (...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastRun >= wait) {
      func(...args);
      lastRun = now;
    } else if (!timeout) {
      timeout = setTimeout(() => {
        func(...args);
        lastRun = Date.now();
        timeout = null;
      }, wait - (now - lastRun));
    }
  };
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after `wait` milliseconds have elapsed since the last time it was invoked.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Creates a function that will only be called once.
 */
export function once<T extends (...args: unknown[]) => unknown>(
  func: T
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let called = false;
  let result: ReturnType<T> | undefined;

  return function (...args: Parameters<T>) {
    if (!called) {
      called = true;
      result = func(...args) as ReturnType<T>;
    }
    return result;
  };
}
