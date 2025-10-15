/**
 * Tests for lib/fetchJson.ts
 *
 * Utilities - safe JSON fetching
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchJsonSafe } from '@/lib/fetchJson';

global.fetch = vi.fn();

describe('fetchJsonSafe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and parse JSON successfully', async () => {
    const mockData = { success: true, data: 'test' };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await fetchJsonSafe<typeof mockData>('/api/test');

    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('/api/test', undefined);
  });

  it('should return null on fetch error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const result = await fetchJsonSafe('/api/test');

    expect(result).toBeNull();
  });

  it('should return null on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const result = await fetchJsonSafe('/api/test');

    expect(result).toBeNull();
  });

  it('should return null on JSON parse error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as unknown as Response);

    const result = await fetchJsonSafe('/api/test');

    expect(result).toBeNull();
  });

  it('should handle different HTTP methods', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    await fetchJsonSafe('/api/test', { method: 'POST' });

    expect(fetch).toHaveBeenCalledWith('/api/test', { method: 'POST' });
  });
});
