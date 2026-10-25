import { describe, expect, it } from 'vitest';
import { financialOverview, orderFinances } from './financialOverview';
import { seedPrototype, today } from './model';

describe('financial meanings shown to mitra', () => {
  const month = today().slice(0, 7);
  it('separates received payments, outstanding invoices, cost and profit', () => {
    const data = seedPrototype(); const summary = financialOverview(data, month);
    expect(summary.received! + summary.outstanding!).toBe(summary.sales);
    expect(summary.net).toBe(summary.sales! - summary.cost! - summary.orderExpenses! - summary.generalExpenses + summary.otherIncome);
    expect(summary.received).not.toBe(summary.net);
  });
  it('recording a partial payment reduces the bill without changing sales, product cost or profit', () => {
    const data = seedPrototype(); const before = financialOverview(data, month);
    data.orders.find(order => order.id === 'ORD-1031')!.paid = 100000;
    const after = financialOverview(data, month);
    expect(after.received).toBe(before.received! + 100000);
    expect(after.outstanding).toBe(before.outstanding! - 100000);
    expect([after.sales, after.cost, after.net]).toEqual([before.sales, before.cost, before.net]);
  });
  it('full payment clears a bill and does not create a second sale', () => {
    const data = seedPrototype(); const order = data.orders.find(row => row.id === 'ORD-1031')!;
    order.paid = order.quote.revenue!;
    expect(orderFinances(order).outstanding).toBe(0);
    expect(financialOverview(data, month).sales).toBe(financialOverview(seedPrototype(), month).sales);
  });
  it('restocking is shown separately and is not deducted from product costs a second time', () => {
    const data = seedPrototype(); const before = financialOverview(data, month);
    data.purchases.push({ ...data.purchases[0], id: 'MORE', purchaseDate: today(), lines: [{ sku: 'BP', quantity: 10, unitCost: 225000 }] });
    const after = financialOverview(data, month);
    expect(after.purchaseValue).toBe(before.purchaseValue! + 2250000);
    expect([after.sales, after.cost, after.net, after.received]).toEqual([before.sales, before.cost, before.net, before.received]);
  });
  it('unknown historical costs never turn into zero or a misleading known profit', () => {
    const data = seedPrototype(); data.orders[0].quote.cost = null; data.orders[0].quote.profit = null;
    expect(financialOverview(data, month)).toMatchObject({ cost: null, net: null, sales: expect.any(Number) });
  });
  it('keeps old unpaid orders discoverable while financial cards retain the selected period', () => {
    const data = seedPrototype(); const old = structuredClone(data.orders.find(order => order.id === 'ORD-1031')!);
    old.id = 'OLDER'; old.date = '2020-01-01'; data.orders.push(old);
    const summary = financialOverview(data, month);
    expect(summary.allUnpaid.length).toBe(summary.periodUnpaid.length + 1);
    expect(summary.orders.some(order => order.id === 'OLDER')).toBe(false);
  });
  it('cancelled orders, drafts and plans are not sales or bills', () => {
    const data = seedPrototype(); const order = data.orders.find(row => row.id === 'ORD-1031')!;
    order.status = 'cancelled';
    expect(orderFinances(order).outstanding).toBe(0);
    expect(financialOverview(data, month).orders).toHaveLength(3);
    expect(financialOverview(seedPrototype(true), month)).toMatchObject({ sales: 0, received: 0, outstanding: 0, cost: 0, net: 0, purchaseValue: 0 });
  });
});
