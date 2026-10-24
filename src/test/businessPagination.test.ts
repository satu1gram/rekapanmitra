import { describe, expect, it } from 'vitest';
import { readAllPages } from '@/hooks/useBusinessOverview';

describe('business data completeness', () => {
  it('reads beyond the default Supabase row limit', async () => {
    const records = Array.from({ length: 1005 }, (_, id) => ({ id }));
    const result = await readAllPages(async (from, to) => ({ data: records.slice(from, to + 1), error: null }));
    expect(result).toHaveLength(1005);
    expect(result[1004].id).toBe(1004);
  });
  it('rejects a failed later page rather than reporting an incomplete total', async () => {
    await expect(readAllPages(async from => from === 0
      ? { data: Array(1000).fill({ id: 1 }), error: null }
      : { data: null, error: { message: 'Tidak ada koneksi' } })).rejects.toThrow('Tidak ada koneksi');
  });
});
