import { describe, expect, it } from 'vitest';
import { validateParseResult } from '@/lib/parseResultValidation';

const order = { intent: 'order', pelanggan: 'Bu Ani', items: [{ nama: 'British Propolis', qty: 3 }] };

describe('AI parser response boundary', () => {
  it('accepts a valid order and strips prices invented by a model', () => {
    const result = validateParseResult({ ...order, totalPrice: 1, items: [{ ...order.items[0], price: 1 }] });
    expect(result.intent).toBe('order');
    expect(result).not.toHaveProperty('totalPrice');
    expect(result).toHaveProperty('items', [{ nama: 'British Propolis', qty: 3 }]);
  });
  it.each([0, -2, 1.5, '3', null, 100001])('rejects an unsafe quantity: %s', qty => {
    expect(() => validateParseResult({ ...order, items: [{ nama: 'British Propolis', qty }] })).toThrow();
  });
  it('rejects empty products and impossible dates', () => {
    expect(() => validateParseResult({ ...order, items: [] })).toThrow();
    expect(() => validateParseResult({ ...order, tanggal: '2026-02-30' })).toThrow();
    expect(() => validateParseResult({ ...order, tanggal: '2026-10-24' })).not.toThrow();
  });
  it('supports restock and out of scope without turning them into orders', () => {
    expect(validateParseResult({ intent: 'restok', items: order.items }).intent).toBe('restok');
    expect(validateParseResult({ intent: 'out_of_scope', message: 'Perjelas pesan.' }).intent).toBe('out_of_scope');
    expect(() => validateParseResult({ intent: 'delete_all' })).toThrow();
  });
});
