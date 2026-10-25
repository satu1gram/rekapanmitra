import { describe, it, expect, vi } from 'vitest';
import { resolveCatalogPricing, type CatalogProduct } from '../catalogPricing';
import { PRICE_TABLE } from '../pricing';
import { MITRA_LEVELS } from '@/types';

const catalog: CatalogProduct[] = [
  { id: 'bp-1', name: 'BP Satuan', category: 'BP', package_type: 'satuan', quantity_per_package: 1, price: 265000, is_active: true },
  { id: 'bp-3', name: 'Paket BP 3 Botol', category: 'BP', package_type: '3_botol', quantity_per_package: 3, price: 720000, is_active: true },
  { id: 'bp-5', name: 'Paket BP 5 Botol', category: 'BP', package_type: '5_botol', quantity_per_package: 5, price: 1125000, is_active: true },
  { id: 'bp-10', name: 'Paket BP 10 Botol', category: 'BP', package_type: '10_botol', quantity_per_package: 10, price: 2100000, is_active: true },
  { id: 'bp-40', name: 'Paket BP 40 Botol', category: 'BP', package_type: '40_botol', quantity_per_package: 40, price: 7800000, is_active: true },
  { id: 'bp-200', name: 'Paket BP 200 Botol', category: 'BP', package_type: '200_botol', quantity_per_package: 200, price: 35000000, is_active: true },
  { id: 'kid-1', name: 'Green Satuan', category: 'KID', package_type: 'satuan', quantity_per_package: 1, price: 285000, is_active: true },
  { id: 'kid-3', name: 'Paket Green 3 Botol', category: 'KID', package_type: '3_botol', quantity_per_package: 3, price: 780000, is_active: true },
  { id: 'kid-5', name: 'Paket Green 5 Botol', category: 'KID', package_type: '5_botol', quantity_per_package: 5, price: 1225000, is_active: true },
  { id: 'kid-10', name: 'Paket Green 10 Botol', category: 'KID', package_type: '10_botol', quantity_per_package: 10, price: 2250000, is_active: true },
  { id: 'kid-40', name: 'Paket Green 40 Botol', category: 'KID', package_type: '40_botol', quantity_per_package: 40, price: 8400000, is_active: true },
  { id: 'kid-200', name: 'Paket Green 200 Botol', category: 'KID', package_type: '200_botol', quantity_per_package: 200, price: 35000000, is_active: true },
  { id: 'blue-1', name: 'Blue Satuan', category: 'BLUE', package_type: 'satuan', quantity_per_package: 1, price: 285000, is_active: true },
  { id: 'blue-3', name: 'Paket Blue 3 Botol', category: 'BLUE', package_type: '3_botol', quantity_per_package: 3, price: 780000, is_active: true },
  { id: 'blue-5', name: 'Paket Blue 5 Botol', category: 'BLUE', package_type: '5_botol', quantity_per_package: 5, price: 1225000, is_active: true },
  { id: 'blue-10', name: 'Paket Blue 10 Botol', category: 'BLUE', package_type: '10_botol', quantity_per_package: 10, price: 2250000, is_active: true },
  { id: 'blue-40', name: 'Paket Blue 40 Botol', category: 'BLUE', package_type: '40_botol', quantity_per_package: 40, price: 8400000, is_active: true },
  { id: 'blue-200', name: 'Paket Blue 200 Botol', category: 'BLUE', package_type: '200_botol', quantity_per_package: 200, price: 35000000, is_active: true },
  // BELGIE — harga satuan 195rb flat di semua tier
  { id: 'blg-1', name: 'Belgie Day Cream', category: 'BELGIE_DC', package_type: 'satuan', quantity_per_package: 1, price: 195000, is_active: true },
  { id: 'blg-3', name: 'Belgie Day Cream', category: 'BELGIE_DC', package_type: '3_botol', quantity_per_package: 3, price: 585000, is_active: true },
  { id: 'blg-10', name: 'Belgie Day Cream', category: 'BELGIE_DC', package_type: '10_botol', quantity_per_package: 10, price: 1800000, is_active: true },
];

function priceBp(qty: number, catalogList: CatalogProduct[] = catalog) {
  const result = resolveCatalogPricing([{ productName: 'BP', quantity: qty }], 'satuan', catalogList);
  return result.priced[0];
}

describe('resolveCatalogPricing — tier dari total quantity', () => {
  it.each([
    ['reseller', 240000],
    ['agen', 225000],
    ['agen_plus', 210000],
    ['sap', 195000],
    ['se', 175000],
  ] as const)('modal standar %s mengikuti harga efektif paket', (level, unitPrice) => {
    expect(MITRA_LEVELS[level].buyPricePerBottle).toBe(unitPrice);
    expect(PRICE_TABLE[level].bp).toBe(unitPrice);
  });

  it.each([
    [1, 'satuan', 265000, 'bp-1'],
    [3, 'reseller', Math.round(720000 / 3), 'bp-3'],
    [5, 'agen', Math.round(1125000 / 5), 'bp-5'],
    [10, 'agen_plus', Math.round(2100000 / 10), 'bp-10'],
    [40, 'sap', Math.round(7800000 / 40), 'bp-40'],
    [200, 'se', Math.round(35000000 / 200), 'bp-200'],
  ])('qty %i memakai tier %s dengan harga unit dari katalog', (qty, tier, unit, productId) => {
    const priced = priceBp(qty);
    expect(priced.sourceTier).toBe(tier);
    expect(priced.pricePerBottle).toBe(unit);
    expect(priced.productId).toBe(productId);
    expect(priced.priceSource).toBe('catalog');
    expect(priced.subtotal).toBe(unit * qty);
  });

  it.each([
    ['British Propolis Green', 1, 'kid-1', 285000],
    ['bp green', 3, 'kid-3', 260000],
    ['kids', 5, 'kid-5', 245000],
    ['green', 10, 'kid-10', 225000],
      ['kids', 40, 'kid-40', 210000],
      ['British Propolis Green', 200, 'kid-200', 175000],
    ['British Propolis Blue', 1, 'blue-1', 285000],
    ['bp blue', 3, 'blue-3', 260000],
    ['blue', 5, 'blue-5', 245000],
    ['British Propolis Blue', 10, 'blue-10', 225000],
    ['bp blue', 40, 'blue-40', 210000],
    ['blue', 200, 'blue-200', 175000],
  ])('resolves %s quantity %i from category catalog', (productName, quantity, productId, unitPrice) => {
    const result = resolveCatalogPricing([{ productName, quantity }], 'satuan', catalog);
    expect(result.priced[0].productId).toBe(productId);
    expect(result.priced[0].pricePerBottle).toBe(unitPrice);
    expect(result.priceSource).toBe('catalog');
  });

  it('tier pelanggan lebih tinggi daripada tier kuantitas tetap dipakai', () => {
    const result = resolveCatalogPricing([{ productName: 'BP', quantity: 1 }], 'agen', catalog);
    expect(result.sourceTier).toBe('agen');
    expect(result.priced[0].pricePerBottle).toBe(Math.round(1125000 / 5));
  });

  it('mencocokkan nama produk lengkap, bukan hanya kategori', () => {
    const result = resolveCatalogPricing(
      [{ productName: 'Belgie Day Cream', quantity: 10 }],
      'satuan',
      catalog,
    );
    expect(result.priced[0].productId).toBe('blg-10');
    expect(result.priced[0].pricePerBottle).toBe(180000);
  });

  it('multi-produk memakai tier yang sama untuk semua item', () => {
    const result = resolveCatalogPricing(
      [
        { productName: 'BP', quantity: 2 },
        { productName: 'Belgie Day Cream', quantity: 1 },
      ],
      'satuan',
      catalog,
    );
    expect(result.sourceTier).toBe('reseller');
    expect(result.priced[0].pricePerBottle).toBe(Math.round(720000 / 3));
    expect(result.priced[1].pricePerBottle).toBe(Math.round(585000 / 3));
    expect(result.priceSource).toBe('catalog');
  });

  it('produk nonaktif tidak dipakai dan jatuh ke fallback dengan logging', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const inactive: CatalogProduct[] = catalog.map(p =>
      p.id === 'bp-1' ? { ...p, is_active: false } : p,
    );
    const priced = priceBp(1, inactive);
    expect(priced.productId).toBeNull();
    expect(priced.priceSource).toBe('fallback');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('produk yang tidak ada di katalog dilaporkan di missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = resolveCatalogPricing(
      [{ productName: 'PRODUK BARU X', quantity: 1 }],
      'satuan',
      catalog,
    );
    expect(result.priceSource).toBe('fallback');
    expect(result.missing).toEqual(['PRODUK BARU X']);
    warn.mockRestore();
  });

  it('katalog kosong seluruhnya memakai fallback harga jual terbaru', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = resolveCatalogPricing([{ productName: 'BP', quantity: 5 }], 'satuan', []);
    expect(result.priceSource).toBe('fallback');
    // Fallback tier agen untuk BP mengikuti harga katalog terbaru.
    expect(result.priced[0].pricePerBottle).toBe(225000);
    warn.mockRestore();
  });

  it.each([
    ['British Propolis', 1, 265000],
    ['British Propolis Green', 1, 285000],
    ['British Propolis Blue', 3, 260000],
    ['Steffi Pro', 1, 265000],
    ['Belgie Facial Wash', 10, 180000],
  ])('fallback harga terbaru untuk %s qty %i adalah %i', (productName, quantity, unitPrice) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = resolveCatalogPricing([{ productName, quantity }], 'satuan', []);
    expect(result.priced[0].pricePerBottle).toBe(unitPrice);
    expect(result.priceSource).toBe('fallback');
    warn.mockRestore();
  });
});
