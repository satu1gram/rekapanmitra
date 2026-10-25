/**
 * pricing.ts — Single Source of Truth untuk kalkulasi harga
 * Dipakai oleh: TambahOrderFlow, OrderForm (Edit), ChatInterface, telegram-bot
 */

import { TierType } from '@/types';

export interface PricedItem {
  productName: string;
  quantity: number;
  pricePerBottle: number;
  subtotal: number;
}

// Tabel harga dasar per tier
export const PRICE_TABLE: Record<string, { bp: number; beauty: number }> = {
  satuan:    { bp: 265000, beauty: 195000 },
  reseller:  { bp: 240000, beauty: 195000 },
  agen:      { bp: 225000, beauty: 195000 },
  agen_plus: { bp: 210000, beauty: 180000 },
  sap:       { bp: 195000, beauty: 170000 },
  se:        { bp: 175000, beauty: 150000 },
};

const RETAIL_FALLBACKS: Record<string, Record<TierType, number>> = {
  regular: { satuan: 265000, reseller: 240000, agen: 225000, agen_plus: 210000, sap: 195000, se: 175000 },
  greenBlue: { satuan: 285000, reseller: 260000, agen: 245000, agen_plus: 225000, sap: 210000, se: 175000 },
  beauty: { satuan: 195000, reseller: 195000, agen: 195000, agen_plus: 180000, sap: 170000, se: 150000 },
};

export function getRetailFallbackPrice(productName: string, tier: TierType): number {
  const normalized = productName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const group = normalized.includes('BELGIE')
    ? 'beauty'
    : normalized.includes('GREEN') || normalized.includes('KID') || normalized.includes('BLUE')
      ? 'greenBlue'
      : 'regular';
  return RETAIL_FALLBACKS[group][tier] ?? RETAIL_FALLBACKS[group].satuan;
}

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
  return u.includes('BELGIE');
}

/** Recalculate legacy order data using the current retail fallback tiers. */
export function recalcPricing<T extends { productName: string; quantity: number }>(
  items: T[],
  baseTier: TierType
): (T & { pricePerBottle: number; subtotal: number })[] {
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const activeTier = getActiveTier(baseTier, totalQty);

  return items.map(item => {
    const pricePerBottle = getRetailFallbackPrice(item.productName, activeTier);
    const subtotal = pricePerBottle * item.quantity;

    return { ...item, pricePerBottle, subtotal };
  });
}
