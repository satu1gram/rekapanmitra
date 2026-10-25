import { describe, expect, it } from 'vitest';
import { businessSummary, inventory, seedPrototype, today } from './model';

describe('mobile prototype financial and stock consistency', () => {
  it('separates physical goods, reservations, and purchases in transit', () => {
    const data = seedPrototype();
    const stock = inventory(data, 'GREEN');
    expect(stock).toEqual({ onHand: 4, reserved: 1, available: 3, incoming: 5 });
  });
  it('does not put draft orders or planned purchases into stock allocation', () => {
    const data = seedPrototype();
    expect(inventory(data, 'BLUE').reserved).toBe(0);
    data.purchases.push({ ...data.purchases[2], id: 'plan', status: 'planned', quantity: 100 });
    expect(inventory(data, 'GREEN').incoming).toBe(5);
  });
  it('supports a distinct opening stock for each SKU', () => {
    const data = seedPrototype();
    data.openingBySku.GREEN = 12;
    expect(inventory(data, 'GREEN').onHand).toBe(10);
    expect(inventory(data, 'BLUE').onHand).toBe(6);
  });
  it('receiving goods changes physical stock exactly once, not revenue', () => {
    const data = seedPrototype(); const month = today().slice(0, 7);
    const revenue = businessSummary(data, month).revenue;
    data.purchases[2].receivedDate = today();
    expect(inventory(data, 'GREEN').onHand).toBe(9);
    expect(inventory(data, 'GREEN').incoming).toBe(0);
    expect(businessSummary(data, month).revenue).toBe(revenue);
  });
  it('releases reservations on cancellation without inventing physical returns', () => {
    const data = seedPrototype();
    data.orders.find(o => o.id === 'ORD-1031')!.status = 'cancelled';
    expect(inventory(data, 'GREEN').reserved).toBe(0);
    expect(inventory(data, 'GREEN').onHand).toBe(4);
    data.orders.find(o => o.id === 'ORD-1028')!.status = 'cancelled';
    expect(inventory(data, 'GREEN').onHand).toBe(4);
    data.orders.find(o => o.id === 'ORD-1028')!.returned = true;
    expect(inventory(data, 'GREEN').onHand).toBe(6);
  });
  it('keeps historical sales independent of a new profile level', () => {
    const data = seedPrototype(); const month = today().slice(0, 7); const original = businessSummary(data, month);
    data.profile.level = 'sap';
    expect(businessSummary(data, month)).toEqual(original);
    expect(original.net).toBe(original.margin - original.generalExpenses + original.otherIncome);
    expect(original.receivable).toBe(original.revenue - original.received);
  });
  it('starts a true empty scenario with zero stock and no finance', () => {
    const data = seedPrototype(true);
    expect(inventory(data, 'BP').onHand).toBe(0);
    expect(businessSummary(data, today().slice(0, 7)).revenue).toBe(0);
    expect(data.orders).toHaveLength(0);
  });
});
