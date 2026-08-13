import { describe, it, expect } from 'vitest';
import { normalizePhone, normalizeCustomerName, resolveCustomerMatch } from '@/lib/customerDedup';

describe('customer deduplication', () => {
  it('should treat same customer with different prefixes as one person', () => {
    const customers = [
      { id: '1', name: 'Kak Isti', phone: '081234567890' },
      { id: '2', name: 'Isti', phone: '081234567890' },
      { id: '3', name: 'Bu Isti', phone: '081999999999' }
    ] as any[];

    expect(normalizeCustomerName('Kak Isti')).toBe('isti');
    expect(normalizePhone('0812-3456-7890')).toBe('081234567890');
    expect(resolveCustomerMatch(customers, { customerName: 'Kak Isti', customerPhone: '081234567890' })?.id).toBe('1');
    expect(resolveCustomerMatch(customers, { customerName: 'Bu Isti', customerPhone: '081999999999' })?.id).toBe('3');
  });

  it('should merge same customer even without phone by normalized name', () => {
    const customers = [
      { id: 'a', name: 'Kak Isti', phone: '' },
      { id: 'b', name: 'Isti', phone: '' }
    ] as any[];

    expect(resolveCustomerMatch(customers, { customerName: 'Isti', customerPhone: '' })?.id).toBe('a');
  });
});
