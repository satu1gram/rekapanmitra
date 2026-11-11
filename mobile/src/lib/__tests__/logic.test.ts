import { describe, expect, it } from 'vitest';
import type { CatalogProduct } from '@/lib/catalogPricing';

import { summarizeMonth, targetProgress } from '../dashboard';
import { businessDateToISO, isInMonth, shiftMonth } from '../dates';
import { formatRupiah, formatRupiahShort, parseRupiahInput } from '../money';
import { buyPricePerBottle, computeOrderTotals, priceItems, productCategories, productDisplayName, toCatalog } from '../orderMath';

const row = (category: string, package_type: string, qty: number, price: number): CatalogProduct => ({
  id: `${category}-${package_type}`,
  name: `${category} ${package_type}`,
  category,
  package_type,
  quantity_per_package: qty,
  price,
  is_active: true,
});

// September 2026 catalog (supabase/migrations/20260912010000_update_katalog_harga_september_2026.sql)
const catalog: CatalogProduct[] = [
  row('BP', 'satuan', 1, 265000), row('BP', '3_botol', 3, 720000), row('BP', '5_botol', 5, 1125000),
  row('BLUE', 'satuan', 1, 285000), row('BLUE', '3_botol', 3, 780000), row('BLUE', '5_botol', 5, 1225000),
];

const item = (productName: string, quantity: number) => ({ productName, quantity, pricePerBottle: 0, subtotal: 0 });

describe('order pricing (shared web resolver)', () => {
  it('prices single bottles at the satuan price', () => {
    const { items, activeTier } = priceItems([item('BP', 1), item('BLUE', 1)], 'satuan', catalog);
    expect(activeTier).toBe('satuan');
    expect(items.map(i => i.subtotal)).toEqual([265000, 285000]);
  });

  it('moves to the package price when the total quantity reaches it', () => {
    const { items, activeTier } = priceItems([item('BP', 2), item('BLUE', 1)], 'satuan', catalog);
    expect(activeTier).toBe('reseller');
    expect(items[0].pricePerBottle).toBe(240000);
    expect(items[1].pricePerBottle).toBe(260000);
  });

  it('keeps a better customer tier even for a small order', () => {
    const { items } = priceItems([item('BP', 1)], 'agen', catalog);
    expect(items[0].pricePerBottle).toBe(225000);
  });

  it('shows friendly product names', () => {
    expect(productDisplayName('KID')).toBe('BP Green');
    expect(productDisplayName('UNKNOWN')).toBe('UNKNOWN');
  });

  it('lists one product per catalog category', () => {
    expect(productCategories(catalog)).toEqual(['BP', 'BLUE']);
  });

  it('maps master_products rows', () => {
    expect(toCatalog([{ id: 'x', name: 'BP Satuan', category: null, package_type: 'satuan', quantity_per_package: 1, price: '265000', is_active: true }])[0])
      .toMatchObject({ category: 'BP Satuan', price: 265000 });
  });
});

describe('order totals (same as useOrdersDb.addOrder)', () => {
  it('margin = omzet − modal − biaya order', () => {
    const items = [{ productName: 'BP', quantity: 3, pricePerBottle: 240000, subtotal: 720000 }];
    const totals = computeOrderTotals(items, [{ name: 'Ongkir', amount: 12000 }, { name: 'Infaq', amount: 5000 }], 225000);
    expect(totals).toEqual({ totalQuantity: 3, totalPrice: 720000, buyPrice: 675000, totalExpenses: 17000, margin: 28000, avgPricePerBottle: 240000 });
  });

  it('keeps a loss negative and ignores zero-quantity lines', () => {
    const totals = computeOrderTotals(
      [{ productName: 'BP', quantity: 1, pricePerBottle: 195000, subtotal: 195000 }, { productName: 'BLUE', quantity: 0, pricePerBottle: 285000, subtotal: 0 }],
      [{ name: 'Ongkir', amount: 15000 }],
      195000,
    );
    expect(totals.totalQuantity).toBe(1);
    expect(totals.margin).toBe(-15000);
  });

  it('cost per bottle comes from the level, or the custom price', () => {
    expect(buyPricePerBottle('agen', null)).toBe(225000);
    expect(buyPricePerBottle('custom', 200000)).toBe(200000);
    expect(buyPricePerBottle('custom', null)).toBe(0);
  });
});

describe('month summary (same as the web dashboard)', () => {
  const month = { year: 2026, month: 10 };
  const inMonth = new Date(2026, 10, 5, 10).toISOString();
  const lastMonth = new Date(2026, 9, 31, 22).toISOString();
  const orders = [
    { created_at: inMonth, total_price: 720000, buy_price: 675000, margin: 28000, quantity: 3 },
    { created_at: inMonth, total_price: 265000, buy_price: 225000, margin: 40000, quantity: 1 },
    { created_at: lastMonth, total_price: 999999, buy_price: 0, margin: 999999, quantity: 9 },
  ];

  it('separates gross profit, order costs, general costs and other income', () => {
    const s = summarizeMonth(month, orders, [{ amount: 50000, date: '2026-11-03' }], [{ amount: 20000, date: '2026-11-04' }], [
      { type: 'in', quantity: 10, created_at: inMonth },
      { type: 'out', quantity: 2, created_at: inMonth },
    ]);
    expect(s).toEqual({
      orderCount: 2,
      quantity: 4,
      revenue: 985000,
      grossProfit: 85000,
      orderExpenses: 17000,
      generalExpenses: 50000,
      otherIncome: 20000,
      netProfit: 38000,
      restockQuantity: 10,
    });
  });

  it('target progress caps at 100% and uses the selected profit mode', () => {
    const s = summarizeMonth(month, orders, [], [], []);
    const p = targetProgress(s, { targetProfit: 50000, targetQty: 8, targetStock: 0 }, false)!;
    expect(p.profit.pct).toBe(100);
    expect(p.qty.pct).toBe(50);
    expect(p.stock.pct).toBe(0);
    expect(targetProgress(s, null, false)).toBeNull();
  });
});

describe('formatting and dates', () => {
  it('formats rupiah without relying on Intl', () => {
    expect(formatRupiah(1165000)).toBe('Rp1.165.000');
    expect(formatRupiah(-17000)).toBe('-Rp17.000');
    expect(formatRupiahShort(26600000)).toBe('Rp26,6jt');
    expect(formatRupiahShort(850000)).toBe('Rp850rb');
  });

  it('parses typed amounts', () => {
    expect(parseRupiahInput('Rp 25.000')).toBe(25000);
    expect(parseRupiahInput('')).toBeNull();
  });

  it('shifts months across years', () => {
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
  });

  it('a back-dated business date stays on that local day', () => {
    const now = new Date(2026, 10, 11, 23, 30);
    const iso = businessDateToISO(new Date(2026, 9, 31), now);
    expect(isInMonth(iso, { year: 2026, month: 9 })).toBe(true);
    expect(new Date(iso).getDate()).toBe(31);
    expect(businessDateToISO(new Date(2026, 10, 11, 8), now)).toBe(now.toISOString());
  });
});
