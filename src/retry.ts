export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('etimedout')
    );
  }
  return false;
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('429') || error.message.includes('rate limit');
  }
  return false;
}

function calculateDelay(attempt: number, options: Required<RetryOptions>, retryAfterMs?: number): number {
  if (retryAfterMs && retryAfterMs > 0) {
    return Math.min(retryAfterMs, options.maxDelayMs);
  }

  const exponentialDelay = options.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * options.baseDelayMs;
  return Math.min(exponentialDelay + jitter, options.maxDelayMs);
}

function parseRetryAfter(error: unknown): number | undefined {
  if (error instanceof Error && 'response' in error) {
    const response = (error as { response: { headers?: Record<string, string> } }).response;
    const retryAfter = response?.headers?.['retry-after'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }
    }
  }
  return undefined;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === opts.maxRetries) {
        break;
      }

      if (isRateLimitError(error)) {
        const retryAfterMs = parseRetryAfter(error);
        const delay = calculateDelay(attempt, opts, retryAfterMs);
        console.log(`[retry] Rate limit detectado, esperando ${Math.round(delay)}ms antes del reintento ${attempt + 1}/${opts.maxRetries}`);
        await sleep(delay);
        continue;
      }

      if (isRetryableError(error)) {
        const delay = calculateDelay(attempt, opts);
        console.log(`[retry] Error de red, esperando ${Math.round(delay)}ms antes del reintento ${attempt + 1}/${opts.maxRetries}`);
        await sleep(delay);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
