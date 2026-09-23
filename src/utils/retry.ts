export interface RetryOptions {
  retries?: number;
  interval?: number;
  backoff?: number;
  onRetry?: (error: any, attempt: number) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retries = options.retries ?? 3;
  let interval = options.interval ?? 2000;
  const backoff = options.backoff ?? 1.5;

  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (attempt === retries) {
        break;
      }
      if (options.onRetry) {
        options.onRetry(err, attempt);
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
      interval = Math.round(interval * backoff);
    }
  }

  throw lastError;
}
