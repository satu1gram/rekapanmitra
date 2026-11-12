import { describe, expect, it } from 'vitest';
import type { CatalogProduct } from '@/lib/catalogPricing';

import { priceOptions, selectedOption } from '../priceOptions';

const row = (category: string, package_type: string, qty: number, price: number): CatalogProduct => ({
  id: `${category}-${package_type}`, name: category, category, package_type, quantity_per_package: qty, price, is_active: true,
});
const catalog = [
  row('BP', 'satuan', 1, 265000), row('BP', '3_botol', 3, 720000), row('BP', '5_botol', 5, 1125000), row('BP', '10_botol', 10, 2100000),
  row('BLUE', 'satuan', 1, 285000), row('BLUE', '3_botol', 3, 780000), row('BLUE', '5_botol', 5, 1225000), row('BLUE', '10_botol', 10, 2250000),
];
const item = (productName: string, quantity: number) => ({ productName, quantity, pricePerBottle: 0, subtotal: 0 });

describe('price options', () => {
  it('starts at the price the quantity earns and lists better customer tiers', () => {
    const options = priceOptions([item('BP', 2), item('BLUE', 1)], catalog);
    expect(options.map(o => [o.tier, o.total, o.byQuantity])).toEqual([
      ['reseller', 740000, true],
      ['agen', 695000, false],
      ['agen_plus', 645000, false],
    ]);
  });

  it('is empty without products', () => {
    expect(priceOptions([item('BP', 0)], catalog)).toEqual([]);
  });

  it('a lower stored tier maps to the quantity tier', () => {
    expect(selectedOption('satuan', [item('BP', 3)])).toBe('reseller');
    expect(selectedOption('agen', [item('BP', 3)])).toBe('agen');
  });
});
