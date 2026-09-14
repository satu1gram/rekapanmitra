/**
 * catalogPricing.ts — Price resolver berbasis katalog master_products.
 *
 * Sumber kebenaran harga jual adalah baris katalog (kategori × package_type).
 * Resolver menentukan tier dari total kuantitas, memetakan tier ke package_type,
 * lalu menghitung harga unit dari harga paket katalog.
 *
 * Fallback ke PRICE_TABLE legacy hanya untuk mode migrasi / katalog tidak lengkap,
 * selalu disertai logging agar pemakaian fallback terpantau.
 *
 * Dipakai oleh: TambahOrderFlow, OrderForm, ChatInterface (AI order).
 */

import { TierType } from '@/types';
import { getActiveTier, PRICE_TABLE } from './pricing';

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  package_type: string;
  quantity_per_package: number;
  price: number;
  is_active: boolean;
}

/** Pemetaan tier → package_type pada master_products */
export const TIER_PACKAGE_TYPE: Record<TierType, string> = {
  satuan: 'satuan',
  reseller: '3_botol',
  agen: '5_botol',
  agen_plus: '10_botol',
  sap: '40_botol',
  se: '200_botol',
};

const TIER_ORDER: TierType[] = ['satuan', 'reseller', 'agen', 'agen_plus', 'sap', 'se'];

export interface PricedCatalogItem<T> {
  item: T;
  productId: string | null;
  pricePerBottle: number;
  subtotal: number;
  sourceTier: TierType;
  priceSource: 'catalog' | 'fallback';
}

export interface CatalogPricingResult<T> {
  priced: PricedCatalogItem<T>[];
  /** Tier aktif yang dipakai untuk seluruh order */
  sourceTier: TierType;
  /** 'catalog' jika semua item dari katalog; 'fallback' jika semua dari legacy; 'partial' campuran */
  priceSource: 'catalog' | 'partial' | 'fallback';
  /** Nama produk yang tidak menemukan baris katalog aktif */
  missing: string[];
}

function normalizeName(value: string): string {
  return value
    .toUpperCase()
    .replace(/^PAKET\s+/, '')
    .replace(/\s+\d+\s*BOTOL.*$/, '')
    .replace(/[^A-Z0-9]/g, '');
}

function findCatalogRow(
  productName: string,
  packageType: string,
  catalog: CatalogProduct[],
): CatalogProduct | undefined {
  const norm = normalizeName(productName);
  const active = catalog.filter(p => p.is_active && p.package_type === packageType);
  return (
    active.find(p => normalizeName(p.category) === norm) ||
    active.find(p => normalizeName(p.name) === norm) ||
    active.find(p => normalizeName(p.name).includes(norm) && norm.length >= 3) ||
    active.find(p => norm.includes(normalizeName(p.category)))
  );
}

function fallbackUnitPrice(productName: string, tier: TierType): number {
  const isBeauty = productName.toUpperCase().includes('BELGIE') || productName.toUpperCase().includes('STEFFI');
  const tierData = PRICE_TABLE[tier] || PRICE_TABLE['satuan'];
  return isBeauty ? tierData.beauty : tierData.bp;
}

/**
 * Hitung harga seluruh item order berdasarkan katalog.
 * - Tier aktif = tier terbaik antara tier pelanggan dan tier dari total kuantitas.
 * - Harga unit = harga paket katalog / quantity_per_package.
 * - Jika baris katalog untuk tier tersebut tidak ada, turun ke tier terkecil yang
 *   tersedia di katalog, lalu ke PRICE_TABLE legacy (mode migrasi, dengan logging).
 */
export function resolveCatalogPricing<T extends { productName: string; quantity: number }>(
  items: T[],
  baseTier: TierType,
  catalog: CatalogProduct[],
): CatalogPricingResult<T> {
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const activeTier = getActiveTier(baseTier, totalQty);

  // Urutan tier dari aktif ke terkecil sebagai fallback katalog.
  const tierCandidates: TierType[] = [
    activeTier,
    ...TIER_ORDER.slice(0, TIER_ORDER.indexOf(activeTier)).reverse(),
  ];

  const priced: PricedCatalogItem<T>[] = items.map(item => {
    let productId: string | null = null;
    let unitPrice: number | null = null;
    let matchedTier: TierType = activeTier;

    for (const tier of tierCandidates) {
      const row = findCatalogRow(item.productName, TIER_PACKAGE_TYPE[tier], catalog);
      if (row && row.quantity_per_package > 0) {
        productId = row.id;
        unitPrice = Math.round(row.price / row.quantity_per_package);
        matchedTier = tier;
        break;
      }
    }

    if (unitPrice === null) {
      console.warn(
        `[catalogPricing] Fallback PRICE_TABLE untuk "${item.productName}" tier ${activeTier}: ` +
        'baris katalog aktif tidak ditemukan.',
      );
      unitPrice = fallbackUnitPrice(item.productName, activeTier);
      return {
        item,
        productId,
        pricePerBottle: unitPrice,
        subtotal: unitPrice * item.quantity,
        sourceTier: activeTier,
        priceSource: 'fallback',
      };
    }

    return {
      item,
      productId,
      pricePerBottle: unitPrice,
      subtotal: unitPrice * item.quantity,
      sourceTier: matchedTier,
      priceSource: 'catalog',
    };
  });

  const fallbackCount = priced.filter(p => p.priceSource === 'fallback').length;
  const priceSource: CatalogPricingResult<T>['priceSource'] =
    fallbackCount === 0 ? 'catalog' : fallbackCount === priced.length ? 'fallback' : 'partial';
  const missing = items
    .filter(i => priced.find(p => p.item === i)?.priceSource === 'fallback')
    .map(i => i.productName);

  return { priced, sourceTier: activeTier, priceSource, missing };
}
