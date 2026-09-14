import { describe, it, expect, vi } from 'vitest';
import { resolveCatalogPricing, type CatalogProduct } from '../catalogPricing';

const catalog: CatalogProduct[] = [
  // BP — harga mengikuti pola tier (satuan 250rb, 3=650rb bundle, dst)
  { id: 'bp-1', name: 'BP Satuan', category: 'BP', package_type: 'satuan', quantity_per_package: 1, price: 250000, is_active: true },
  { id: 'bp-3', name: 'Paket BP 3 Botol', category: 'BP', package_type: '3_botol', quantity_per_package: 3, price: 650000, is_active: true },
  { id: 'bp-5', name: 'Paket BP 5 Botol', category: 'BP', package_type: '5_botol', quantity_per_package: 5, price: 990000, is_active: true },
  { id: 'bp-10', name: 'Paket BP 10 Botol', category: 'BP', package_type: '10_botol', quantity_per_package: 10, price: 1800000, is_active: true },
  { id: 'bp-40', name: 'Paket BP 40 Botol', category: 'BP', package_type: '40_botol', quantity_per_package: 40, price: 6800000, is_active: true },
  { id: 'bp-200', name: 'Paket BP 200 Botol', category: 'BP', package_type: '200_botol', quantity_per_package: 200, price: 30000000, is_active: true },
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
    [1, 'satuan', 250000, 'bp-1'],
    [3, 'reseller', Math.round(650000 / 3), 'bp-3'],
    [5, 'agen', Math.round(990000 / 5), 'bp-5'],
    [10, 'agen_plus', Math.round(1800000 / 10), 'bp-10'],
    [40, 'sap', Math.round(6800000 / 40), 'bp-40'],
    [200, 'se', Math.round(30000000 / 200), 'bp-200'],
  ])('qty %i memakai tier %s dengan harga unit dari katalog', (qty, tier, unit, productId) => {
    const priced = priceBp(qty);
    expect(priced.sourceTier).toBe(tier);
    expect(priced.pricePerBottle).toBe(unit);
    expect(priced.productId).toBe(productId);
    expect(priced.priceSource).toBe('catalog');
    expect(priced.subtotal).toBe(unit * qty);
  });

  it('tier pelanggan lebih tinggi daripada tier kuantitas tetap dipakai', () => {
    const result = resolveCatalogPricing([{ productName: 'BP', quantity: 1 }], 'agen', catalog);
    expect(result.sourceTier).toBe('agen');
    expect(result.priced[0].pricePerBottle).toBe(Math.round(990000 / 5));
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
    expect(result.priced[0].pricePerBottle).toBe(Math.round(650000 / 3));
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

  it('katalog kosong seluruhnya memakai fallback legacy', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = resolveCatalogPricing([{ productName: 'BP', quantity: 5 }], 'satuan', []);
    expect(result.priceSource).toBe('fallback');
    // Fallback tier agen untuk BP = 198000 sesuai PRICE_TABLE legacy
    expect(result.priced[0].pricePerBottle).toBe(198000);
    warn.mockRestore();
  });
});
