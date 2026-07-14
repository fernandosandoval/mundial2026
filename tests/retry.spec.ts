import { test, expect } from '@playwright/test';
import { withRetry } from '../src/retry';

test.describe('withRetry', () => {
  test('returns result on first success', async () => {
    let callCount = 0;
    const result = await withRetry(async () => {
      callCount++;
      return 'success';
    }, { maxRetries: 3, baseDelayMs: 10 });
    expect(result).toBe('success');
    expect(callCount).toBe(1);
  });

  test('retries on network error', async () => {
    let callCount = 0;
    const result = await withRetry(async () => {
      callCount++;
      if (callCount < 3) {
        throw new TypeError('fetch failed');
      }
      return 'success';
    }, { maxRetries: 3, baseDelayMs: 10 });
    expect(result).toBe('success');
    expect(callCount).toBe(3);
  });

  test('throws after max retries exceeded', async () => {
    let callCount = 0;
    await expect(
      withRetry(async () => {
        callCount++;
        throw new TypeError('fetch failed');
      }, { maxRetries: 2, baseDelayMs: 10 }),
    ).rejects.toThrow('fetch failed');
    expect(callCount).toBe(3);
  });

  test('does not retry on non-retryable errors', async () => {
    let callCount = 0;
    await expect(
      withRetry(async () => {
        callCount++;
        throw new Error('Some other error');
      }, { maxRetries: 3, baseDelayMs: 10 }),
    ).rejects.toThrow('Some other error');
    expect(callCount).toBe(1);
  });

  test('retries on rate limit error', async () => {
    let callCount = 0;
    const result = await withRetry(async () => {
      callCount++;
      if (callCount < 2) {
        throw new Error('Error 429: rate limit');
      }
      return 'success';
    }, { maxRetries: 3, baseDelayMs: 10 });
    expect(result).toBe('success');
    expect(callCount).toBe(2);
  });
});
