import { getActiveTier, getTierByQty } from '@/lib/pricing';
import type { CatalogProduct } from '@/lib/catalogPricing';
import type { TierType } from '@/types';

import { priceItems, type DraftItem } from './orderMath';

const TIERS: TierType[] = ['satuan', 'reseller', 'agen', 'agen_plus', 'sap', 'se'];

export const TIER_LABEL: Record<TierType, string> = { satuan: 'Satuan', reseller: 'Reseller', agen: 'Agen', agen_plus: 'Agen Plus', sap: 'SAP', se: 'SE' };
export const TIER_MIN_BOTTLES: Record<TierType, number> = { satuan: 1, reseller: 3, agen: 5, agen_plus: 10, sap: 40, se: 200 };

export interface PriceOption {
  /** Customer price tier to store on the order */
  tier: TierType;
  label: string;
  total: number;
  /** The price the quantity alone already earns */
  byQuantity: boolean;
}

/**
 * One option per distinct price the order can get, cheapest-by-quantity first. Tiers below the
 * quantity tier give the same price (the resolver always takes the better one), so they are folded in.
 */
export function priceOptions(items: DraftItem[], catalog: CatalogProduct[], limit = 4): PriceOption[] {
  const active = items.filter(i => i.quantity > 0);
  const qty = active.reduce((s, i) => s + i.quantity, 0);
  if (qty === 0) return [];
  const qtyTier = getTierByQty(qty);
  const seen = new Set<TierType>();
  const options: PriceOption[] = [];
  for (const tier of TIERS) {
    const effective = getActiveTier(tier, qty);
    if (seen.has(effective)) continue;
    seen.add(effective);
    const total = priceItems(active, tier, catalog).items.reduce((s, i) => s + i.subtotal, 0);
    // A higher tier that changes nothing (no catalog price for it) is not a real choice.
    if (options.length > 0 && total >= options[options.length - 1].total) continue;
    options.push({ tier: effective, label: TIER_LABEL[effective], total, byQuantity: effective === qtyTier });
  }
  return options.slice(0, limit);
}

/** The option a stored customer tier falls into for this quantity. */
export function selectedOption(tier: TierType, items: DraftItem[]): TierType {
  const qty = items.reduce((s, i) => s + (i.quantity > 0 ? i.quantity : 0), 0);
  return getActiveTier(tier, qty);
}
