/**
 * serverPricing.ts — Mirror TypeScript dari logika SQL K3
 * Sumber semantik: supabase/migrations/20260823000000_k3_server_side_pricing.sql
 * (get_buy_price + apply_server_pricing, paritas dengan telegram-bot).
 *
 * Dipakai oleh test paritas harga; rewire UI/bot menyusul setelah uji emas.
 * Harga diambil dari PRICE_TABLE di pricing.ts — jangan tambahkan angka baru di sini.
 */

import { PRICE_TABLE, RESELLER_BUNDLE_BP_PRICE, TierType, getTierByQty, isBeautyProduct } from '@/lib/pricing';

export interface CustomLevel {
  level_code: string;
  buy_price_per_bottle: number;
}

export interface ServerPricingItemInput {
  productId?: string;
  productName: string;
  quantity: number;
}

export interface ServerPricedItem {
  productId?: string;
  productName: string;
  quantity: number;
  pricePerBottle: number;
  subtotal: number;
}

export interface ServerPricingResult {
  tier: TierType | string;
  totalQty: number;
  totalPrice: number;
  buyPrice: number;
  items: ServerPricedItem[];
}

export interface ApplyServerPricingInput {
  items: ServerPricingItemInput[];
  baseTier?: string | null;
  /** profiles.mitra_level milik tenant pemilik toko */
  tenantLevel?: string | null;
  /** baris user_mitra_levels milik tenant */
  customLevels?: CustomLevel[];
}

/**
 * SUMBER KEBENARAN harga modal (paritas SQL get_buy_price):
 * level kustom tenant menang; fallback tabel standar BP vs beauty.
 */
export function getBuyPrice(
  productName: string,
  tenantLevel?: string | null,
  customLevels: CustomLevel[] = []
): number {
  const level = (tenantLevel ?? '') !== '' ? String(tenantLevel) : 'satuan';

  const custom = customLevels.find(l => l.level_code === level);
  if (custom) return custom.buy_price_per_bottle;

  const tierData = PRICE_TABLE[level.toLowerCase()] || PRICE_TABLE['satuan'];
  return isBeautyProduct(productName) ? tierData.beauty : tierData.bp;
}

/** Harga jual satuan per tier (paritas SQL get_sell_price_per_bottle / PRICE_TABLE). */
function getSellPricePerBottle(tier: string, productName: string): number {
  const key = (tier || '').trim() === '' ? 'satuan' : tier.trim().toLowerCase();
  const tierData = PRICE_TABLE[key] || PRICE_TABLE['satuan'];
  return isBeautyProduct(productName) ? tierData.beauty : tierData.bp;
}

/**
 * Kalkulasi harga server-side untuk satu order publik
 * (paritas SQL apply_server_pricing — angka uang TIDAK dibaca dari client).
 */
export function applyServerPricing(input: ApplyServerPricingInput): ServerPricingResult {
  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length === 0) throw new Error('Payload items tidak valid');

  let totalQty = 0;
  let bpQty = 0;
  for (const it of items) {
    if (!Number.isInteger(it.quantity) || it.quantity < 1) {
      throw new Error('Quantity harus bilangan bulat minimal 1');
    }
    totalQty += it.quantity;
    if (!isBeautyProduct(it.productName)) bpQty += it.quantity;
  }

  // Tier aktif: hanya 'satuan'/kosong yang naik via threshold (paritas bot)
  let activeTier: string =
    input.baseTier && input.baseTier.trim() !== '' ? input.baseTier.trim().toLowerCase() : 'satuan';
  if (activeTier === 'satuan') activeTier = getTierByQty(totalQty);

  // Bundle reseller BP: 3 botol = Rp650rb
  let bundleTotal = 0;
  if (activeTier === 'reseller' && bpQty > 0) {
    const bundles = Math.floor(bpQty / 3);
    const remainder = bpQty % 3;
    bundleTotal = bundles * RESELLER_BUNDLE_BP_PRICE + remainder * 217000;
  }

  const priced: ServerPricedItem[] = items.map(it => {
    const beauty = isBeautyProduct(it.productName);
    let subtotal: number;
    if (!beauty && activeTier === 'reseller' && bpQty > 0) {
      subtotal = Math.round((it.quantity / bpQty) * bundleTotal);
    } else {
      subtotal = getSellPricePerBottle(activeTier, it.productName) * it.quantity;
    }
    return {
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      subtotal,
      pricePerBottle: it.quantity > 0 ? Math.round(subtotal / it.quantity) : 0,
    };
  });

  // Koreksi residu pembulatan dialokasikan ke item BP TERAKHIR
  if (activeTier === 'reseller' && bpQty > 0) {
    let assigned = 0;
    let lastBpIndex = -1;
    priced.forEach((p, i) => {
      if (!isBeautyProduct(p.productName)) {
        assigned += p.subtotal;
        lastBpIndex = i;
      }
    });
    if (lastBpIndex >= 0 && assigned !== bundleTotal) {
      const last = priced[lastBpIndex];
      last.subtotal += bundleTotal - assigned;
      last.pricePerBottle = Math.round(last.subtotal / last.quantity);
    }
  }

  const totalPrice = priced.reduce((s, p) => s + p.subtotal, 0);
  const buyPrice = priced.reduce(
    (s, p) => s + getBuyPrice(p.productName, input.tenantLevel, input.customLevels || []) * p.quantity,
    0
  );

  return { tier: activeTier, totalQty, totalPrice, buyPrice, items: priced };
}
