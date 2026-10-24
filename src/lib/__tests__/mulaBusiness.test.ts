import { describe, expect, it } from 'vitest';
import { quoteMulaOrder, equivalentHalfUnits, evaluateMulaMonth, extractMulaDemoText, reportMulaOrders, type MulaOrder } from '@/lib/mulaBusiness';

describe('MULA PRD proposed pricebook (isolated from production)', () => {
  it('Green Agent example: 285000 - 245000 - 12000 - 5000 = 23000', () => {
    const quote = quoteMulaOrder([{ sku: 'GREEN', quantity: 1 }], 'unit', 'agent', [
      { name: 'Ongkir', amount: 12000, payer: 'seller' }, { name: 'Infaq', amount: 5000, payer: 'seller' },
    ]);
    expect(quote.profit).toBe(23000);
    expect(quote.canConfirm).toBe(true);
  });
  it('Belgie Agent Plus example: 585000 - 540000 - 20000 = 25000', () => {
    const quote = quoteMulaOrder([{ sku: 'FW', quantity: 3 }], 'unit', 'agent_plus', [
      { name: 'Ongkir', amount: 12000, payer: 'seller' }, { name: 'Infaq', amount: 5000, payer: 'seller' }, { name: 'Kemasan', amount: 3000, payer: 'seller' },
    ]);
    expect(quote.revenue).toBe(585000);
    expect(quote.profit).toBe(25000);
  });
  it('prices 3 normal + 2 premium as one Agent bundle', () => {
    expect(quoteMulaOrder([{ sku: 'BP', quantity: 3 }, { sku: 'GREEN', quantity: 2 }], 'bundle', 'agent', []).revenue).toBe(1165000);
    expect(quoteMulaOrder([{ sku: 'BP', quantity: 3 }, { sku: 'GREEN', quantity: 2 }], 'unit', 'agent', []).profit).toBe(200000);
  });
  it('treats Steffi as normal BP, not Belgie', () => {
    const quote = quoteMulaOrder([{ sku: 'STEFFI', quantity: 1 }], 'unit', 'agent', []);
    expect(quote.revenue).toBe(265000);
    expect(quote.cost).toBe(225000);
  });
  it.each(['sap', 'se', 'reset'] as const)('does not invent Belgie costs for %s', level => {
    const quote = quoteMulaOrder([{ sku: 'FW', quantity: 1 }], 'unit', level, []);
    expect(quote.cost).toBeNull();
    expect(quote.profit).toBeNull();
    expect(quote.canConfirm).toBe(false);
  });
  it('blocks undefined bundles and mixed BP/Belgie bundle rules', () => {
    for (const quantity of [2, 4, 6, 7, 200]) {
      expect(quoteMulaOrder([{ sku: 'BP', quantity }], 'bundle', 'agent', []).canConfirm).toBe(false);
    }
    expect(quoteMulaOrder([{ sku: 'BP', quantity: 3 }, { sku: 'FW', quantity: 4 }], 'bundle', 'agent', []).revenue).toBeNull();
  });
  it.each([0, -1, 1.5, NaN])('rejects invalid bottle quantities: %s', quantity => {
    expect(quoteMulaOrder([{ sku: 'BP', quantity }], 'unit', 'agent', []).canConfirm).toBe(false);
  });
  it('blocks unknown SKU instead of filling a default price', () => {
    const quote = quoteMulaOrder([{ sku: 'SKU13', quantity: 1 }], 'unit', 'agent', []);
    expect(quote.revenue).toBeNull();
    expect(quote.canConfirm).toBe(false);
  });
  it('only subtracts seller-paid expenses', () => {
    expect(quoteMulaOrder([{ sku: 'GREEN', quantity: 1 }], 'unit', 'agent', [{ name: 'Ongkir langsung', amount: 12000, payer: 'buyer' }]).profit).toBe(40000);
    expect(quoteMulaOrder([{ sku: 'GREEN', quantity: 1 }], 'unit', 'agent', [{ name: 'Biaya', amount: -1, payer: 'seller' }]).canConfirm).toBe(false);
  });
});

describe('supplier purchases and monthly levels', () => {
  it('keeps 3 BP + 4 Belgie as 5 equivalents, not 7', () => {
    expect(equivalentHalfUnits([{ sku: 'BP', quantity: 3 }, { sku: 'FW', quantity: 4 }])).toBe(10);
    expect(equivalentHalfUnits([{ sku: 'FW', quantity: 1 }, { sku: 'FW', quantity: 1 }])).toBe(2);
  });
  it('applies an Agent upgrade only next month and ignores adjacent months', () => {
    const result = evaluateMulaMonth('agent', '2026-11', [
      { id: '1', date: '2026-11-30', sku: 'BP', quantity: 4, unitCost: 225000 },
      { id: '2', date: '2026-11-30', sku: 'FW', quantity: 12, unitCost: 195000 },
      { id: '3', date: '2026-12-01', sku: 'BP', quantity: 40, unitCost: 225000 },
    ]);
    expect(result.equivalent).toBe(10);
    expect(result.nextLevel).toBe('agent_plus');
    expect(result.nextMonth).toBe('2026-12');
  });
  it('resets after failing the target and correctly crosses the year boundary', () => {
    const result = evaluateMulaMonth('agent_plus', '2026-12', [{ id: '1', date: '2026-12-20', sku: 'BP', quantity: 2, unitCost: 210000 }]);
    expect(result.nextLevel).toBe('reset');
    expect(result.nextMonth).toBe('2027-01');
  });
});

describe('capture and reporting boundaries', () => {
  it('does not turn inquiries or claims of transfer into orders', () => {
    expect(extractMulaDemoText('Ready BP Green?').intent).toBe('inquiry');
    expect(extractMulaDemoText('Sudah TF ya').intent).toBe('payment_claim');
    expect(extractMulaDemoText('Batal pesanannya').intent).toBe('change');
    expect(extractMulaDemoText('restok 10 reguler ke pusat').intent).toBe('purchase');
    expect(extractMulaDemoText('3 reguler + 2 green').lines).toEqual([{ sku: 'BP', quantity: 3 }, { sku: 'GREEN', quantity: 2 }]);
  });
  it('counts confirmed snapshots only; draft/cancelled/order-month changes do not inflate totals', () => {
    const quote = quoteMulaOrder([{ sku: 'GREEN', quantity: 1 }], 'unit', 'agent', []);
    const base: MulaOrder = { id: '1', buyer: 'contoh', date: '2026-10-24', lines: [{ sku: 'GREEN', quantity: 1 }], level: 'agent', mode: 'unit', expenses: [], quote, raw: '', events: [], status: 'confirmed' };
    const orders = [base, { ...base, id: '2', status: 'draft' as const }, { ...base, id: '3', status: 'cancelled' as const }, { ...base, id: '4', date: '2026-11-01' }];
    expect(reportMulaOrders(orders, '2026-10').revenue).toBe(285000);
    expect(reportMulaOrders(orders, '2026-10').count).toBe(1);
    expect(reportMulaOrders([{ ...base, quote: { ...quote, cost: null, profit: null } }], '2026-10').profit).toBeNull();
  });
});
