/**
 * pricing.ts — Single Source of Truth untuk kalkulasi harga
 * Dipakai oleh: TambahOrderFlow, OrderForm (Edit), ChatInterface, telegram-bot
 *
 * TODO(REWIRE-K3): logika harga server-side kini bersumber dari SQL
 * (`get_buy_price` + `apply_server_pricing`, lihat supabase/migrations/
 * 20260823000000_k3_server_side_pricing.sql). File ini adalah duplikat lama
 * untuk alur UI dan ditandai untuk di-rewire mengikuti uji emas — jangan
 * tambahkan duplikasi harga baru di sini.
 */

import { TierType } from '@/types';

/** Harga bundle reseller BP: 3 botol = Rp650rb */
export const RESELLER_BUNDLE_BP_PRICE = 650000;

export interface PricedItem {
  productName: string;
  quantity: number;
  pricePerBottle: number;
  subtotal: number;
}

// Tabel harga dasar per tier
export const PRICE_TABLE: Record<string, { bp: number; beauty: number }> = {
  satuan:    { bp: 250000, beauty: 195000 },
  reseller:  { bp: 217000, beauty: 195000 },
  agen:      { bp: 198000, beauty: 195000 },
  agen_plus: { bp: 180000, beauty: 180000 },
  sap:       { bp: 170000, beauty: 170000 },
  se:        { bp: 150000, beauty: 150000 },
};

export const TIER_PRIORITY: Record<string, number> = {
  satuan: 0, reseller: 1, agen: 2, agen_plus: 3, sap: 4, se: 5,
};

/** Tentukan tier aktif berdasarkan kuantitas total */
export function getTierByQty(totalQty: number): TierType {
  if (totalQty >= 200) return 'se';
  if (totalQty >= 40)  return 'sap';
  if (totalQty >= 10)  return 'agen_plus';
  if (totalQty >= 5)   return 'agen';
  if (totalQty >= 3)   return 'reseller';
  return 'satuan';
}

/** Pilih tier terbaik antara tier pelanggan (base) dan tier dari kuantitas */
export function getActiveTier(baseTier: TierType, totalQty: number): TierType {
  const qtyTier = getTierByQty(totalQty);
  return TIER_PRIORITY[qtyTier] > (TIER_PRIORITY[baseTier] || 0) ? qtyTier : baseTier;
}

export function isBeautyProduct(name: string): boolean {
  const u = name.toUpperCase();
  return u.includes('BELGIE') || u.includes('STEFFI');
}

/**
 * Kalkulasi ulang semua item dengan harga yang benar.
 * - BP (bukan beauty): bila activeTier === 'reseller', pakai logika bundle 3=650rb
 * - Beauty (Belgie/Steffi): selalu pakai harga tier, tidak ada bundle khusus
 */
export function recalcPricing<T extends { productName: string; quantity: number }>(
  items: T[],
  baseTier: TierType
): (T & { pricePerBottle: number; subtotal: number })[] {
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const activeTier = getActiveTier(baseTier, totalQty);

  // Hitung total BP qty untuk bundle reseller
  const bpQty = items
    .filter(i => !isBeautyProduct(i.productName))
    .reduce((s, i) => s + i.quantity, 0);

  let bpBundleTotal = 0;
  if (activeTier === 'reseller') {
    const bundles = Math.floor(bpQty / 3);
    const remainder = bpQty % 3;
    bpBundleTotal = bundles * RESELLER_BUNDLE_BP_PRICE + remainder * 217000;
  }

  return items.map(item => {
    const isBeauty = isBeautyProduct(item.productName);
    const tierData = PRICE_TABLE[activeTier] || PRICE_TABLE['satuan'];
    let pricePerBottle: number;
    let subtotal: number;

    if (!isBeauty && activeTier === 'reseller' && bpQty > 0) {
      // Distribusi proporsional dari bundle total
      subtotal = Math.round((item.quantity / bpQty) * bpBundleTotal);
      pricePerBottle = item.quantity > 0 ? Math.round(subtotal / item.quantity) : tierData.bp;
    } else {
      pricePerBottle = isBeauty ? tierData.beauty : tierData.bp;
      subtotal = pricePerBottle * item.quantity;
    }

    return { ...item, pricePerBottle, subtotal };
  });
}
