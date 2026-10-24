import { describe, expect, it } from 'vitest';
import { businessDate, estimateRestock, summarizeBusiness, type OverviewData } from '@/lib/businessOverview';

const now = new Date('2026-10-24T10:00:00+07:00');
const data: OverviewData = {
  currentStock: 3,
  orders: [
    { created_at: '2026-10-23T17:00:00Z', quantity: 3, total_price: 650000, margin: 110000, status: 'pending' },
    { created_at: '2026-10-23T16:59:59Z', quantity: 30, total_price: 5400000, margin: 900000, status: 'selesai' },
    { created_at: '2026-10-24T17:00:00Z', quantity: 100, total_price: 1, margin: 1, status: 'selesai' },
    { created_at: '2026-09-23T10:00:00+07:00', quantity: 100, total_price: 1, margin: 1, status: 'selesai' },
  ],
  expenses: [{ date: '2026-10-24', amount: 25000 }, { date: '2026-10-23', amount: 50000 }],
  income: [{ date: '2026-10-24', amount: 10000 }],
};

describe('business recap', () => {
  it('uses Jakarta midnight boundaries and excludes future orders', () => {
    expect(businessDate('2026-10-23T17:00:00Z')).toBe('2026-10-24');
    const recap = summarizeBusiness(data, 1, now);
    expect(recap.orderCount).toBe(1);
    expect(recap.revenue).toBe(650000);
    expect(recap.pendingCount).toBe(1);
    expect(recap.estimatedNetProfit).toBe(95000);
  });
  it('includes the exact start of a seven day period and subtracts general expenses only once', () => {
    const recap = summarizeBusiness(data, 7, now);
    expect(recap.start).toBe('2026-10-18');
    expect(recap.quantity).toBe(33);
    expect(recap.estimatedNetProfit).toBe(945000);
  });
  it('does not disguise negative margins as zero profit', () => {
    const recap = summarizeBusiness({ ...data, orders: [{ ...data.orders[0], margin: -5000 }] }, 1, now);
    expect(recap.estimatedNetProfit).toBe(-20000);
  });
});

describe('restock planning', () => {
  it('uses only completed demand from the prior 30 full days', () => {
    const result = estimateRestock(data, 3, 2, now);
    expect(result.dailyDemand).toBe(1);
    expect(result.targetStock).toBe(5);
    expect(result.suggestedQuantity).toBe(2);
    expect(result.coverageDays).toBe(3);
  });
  it('does not invent a restock quantity without a known stock balance or sales history', () => {
    expect(estimateRestock({ ...data, currentStock: null }, 3, 2, now).suggestedQuantity).toBeNull();
    expect(estimateRestock({ ...data, orders: [] }, 3, 2, now).suggestedQuantity).toBeNull();
  });
  it('never suggests negative purchases when stock covers the target', () => {
    expect(estimateRestock({ ...data, currentStock: 100 }, 3, 2, now).suggestedQuantity).toBe(0);
  });
  it('rejects negative and fractional lead times', () => {
    expect(() => estimateRestock(data, -1, 2, now)).toThrow();
    expect(() => estimateRestock(data, 1.5, 2, now)).toThrow();
  });
});
