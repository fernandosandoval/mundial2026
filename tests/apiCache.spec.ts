import { test, expect } from '@playwright/test';
import { ApiCache } from '../src/apiCache';

test.describe('ApiCache', () => {
  test('stores and retrieves values', () => {
    const cache = new ApiCache<string>();
    cache.set('key1', 'value1', 1000);
    expect(cache.get('key1')).toBe('value1');
  });

  test('returns null for missing keys', () => {
    const cache = new ApiCache<string>();
    expect(cache.get('missing')).toBeNull();
  });

  test('returns null for expired entries', async () => {
    const cache = new ApiCache<string>();
    cache.set('key1', 'value1', 50);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(cache.get('key1')).toBeNull();
  });

  test('clear removes all entries', () => {
    const cache = new ApiCache<string>();
    cache.set('key1', 'value1', 1000);
    cache.set('key2', 'value2', 1000);
    cache.clear();
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  test('has returns true for existing entries', () => {
    const cache = new ApiCache<string>();
    cache.set('key1', 'value1', 1000);
    expect(cache.has('key1')).toBe(true);
  });

  test('has returns false for missing entries', () => {
    const cache = new ApiCache<string>();
    expect(cache.has('key1')).toBe(false);
  });

  test('delete removes a specific entry', () => {
    const cache = new ApiCache<string>();
    cache.set('key1', 'value1', 1000);
    cache.set('key2', 'value2', 1000);
    cache.delete('key1');
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
  });

  test('cleanup removes expired entries', async () => {
    const cache = new ApiCache<string>();
    cache.set('key1', 'value1', 50);
    cache.set('key2', 'value2', 10000);
    await new Promise((resolve) => setTimeout(resolve, 100));
    cache.cleanup();
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
  });
});
