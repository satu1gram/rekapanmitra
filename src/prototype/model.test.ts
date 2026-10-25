import { describe, expect, it } from 'vitest';
import { businessSummary, inventory, seedPrototype, today, purchaseTotals, purchasesForLevel, mergeOrderLines } from './model';
import { evaluateMulaMonth, quoteMulaOrder } from '@/lib/mulaBusiness';

describe('mobile prototype financial and stock consistency', () => {
  it('separates physical goods, reservations, and purchases in transit', () => {
    const data = seedPrototype();
    const stock = inventory(data, 'GREEN');
    expect(stock).toEqual({ onHand: 4, reserved: 1, available: 3, incoming: 5 });
  });
  it('does not put draft orders or planned purchases into stock allocation', () => {
    const data = seedPrototype();
    expect(inventory(data, 'BLUE').reserved).toBe(0);
    data.purchases.push({ ...data.purchases[2], id: 'plan', status: 'planned', lines: [{ sku: 'GREEN', quantity: 100, unitCost: 245000 }] });
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

describe('one activity with many product lines', () => {
  const lines = [{ sku: 'BP', quantity: 2, unitCost: 225000 }, { sku: 'BLUE', quantity: 1, unitCost: 245000 }, { sku: 'FW', quantity: 4, unitCost: 195000 }];
  it('keeps physical quantity, equivalents and money separate', () => {
    expect(purchaseTotals(lines)).toMatchObject({ quantity: 7, equivalent: 5, total: 1475000, valid: true });
  });
  it('receives every SKU through a single purchase without creating extra revenue', () => {
    const data = seedPrototype(true); const month = today().slice(0, 7);
    data.purchases.push({ id: 'BATCH', lines, supplier: 'contoh', notes: '', status: 'planned', purchaseDate: today(), receivedDate: null });
    expect(purchasesForLevel(data.purchases)).toHaveLength(0);
    expect(inventory(data, 'BP').incoming).toBe(0);
    data.purchases[0].status = 'ordered';
    expect(inventory(data, 'BP').incoming).toBe(2);
    expect(inventory(data, 'BLUE').incoming).toBe(1);
    expect(inventory(data, 'FW').incoming).toBe(4);
    expect(evaluateMulaMonth('agent', month, purchasesForLevel(data.purchases)).equivalent).toBe(5);
    data.purchases[0].receivedDate = today();
    for (const line of lines) expect(inventory(data, line.sku)).toMatchObject({ onHand: line.quantity, incoming: 0 });
    expect(businessSummary(data, month).revenue).toBe(0);
    data.purchases[0].receivedDate = today();
    expect(inventory(data, 'FW').onHand).toBe(4);
  });
  it('cancels the whole supplier activity including every incoming line and equivalent', () => {
    const data = seedPrototype(true);
    data.purchases.push({ id: 'BATCH', lines, supplier: 'contoh', notes: '', status: 'cancelled', purchaseDate: today(), receivedDate: null });
    for (const line of lines) expect(inventory(data, line.sku).incoming).toBe(0);
    expect(purchasesForLevel(data.purchases)).toHaveLength(0);
  });
  it('rejects empty, repeated, unknown, fractional and unpriced product rows', () => {
    expect(purchaseTotals([]).valid).toBe(false);
    expect(purchaseTotals([...lines, lines[0]]).valid).toBe(false);
    expect(purchaseTotals([{ sku: 'UNKNOWN', quantity: 1, unitCost: 1 }]).valid).toBe(false);
    expect(purchaseTotals([{ ...lines[0], quantity: 1.5 }]).valid).toBe(false);
    expect(purchaseTotals([{ ...lines[0], unitCost: 0 }]).total).toBeNull();
  });
  it('groups repeated valid order SKUs but preserves invalid inputs for quote rejection', () => {
    expect(mergeOrderLines([{ sku: 'GREEN', quantity: 1 }, { sku: 'BP', quantity: 2 }, { sku: 'GREEN', quantity: 2 }])).toEqual([{ sku: 'GREEN', quantity: 3 }, { sku: 'BP', quantity: 2 }]);
    const invalid = mergeOrderLines([{ sku: 'GREEN', quantity: -1 }, { sku: 'GREEN', quantity: 2 }]);
    expect(quoteMulaOrder(invalid, 'unit', 'agent', []).canConfirm).toBe(false);
  });
  it('creates one mixed-product quote with per-product costs and one expense total', () => {
    const quote = quoteMulaOrder([{ sku: 'BP', quantity: 2 }, { sku: 'BLUE', quantity: 1 }, { sku: 'FW', quantity: 4 }], 'unit', 'agent', [{ name: 'Ongkir satu aktivitas', amount: 20000, payer: 'seller' }]);
    expect(quote.revenue).toBe(1595000);
    expect(quote.cost).toBe(1475000);
    expect(quote.profit).toBe(100000);
  });
});
