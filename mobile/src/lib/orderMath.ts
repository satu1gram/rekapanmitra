import { MITRA_LEVELS, type MitraLevel, type TierType } from '@/types';
import { resolveCatalogPricing, type CatalogProduct } from '@/lib/catalogPricing';

const LEVEL_TIER: Partial<Record<MitraLevel, TierType>> = { reseller: 'reseller', agen: 'agen', agen_plus: 'agen_plus', sap: 'sap', se: 'se' };

export interface DraftItem {
  productName: string;
  quantity: number;
  pricePerBottle: number;
  subtotal: number;
  productId?: string | null;
}

export interface DraftExpense {
  name: string;
  amount: number;
}

export interface MasterProductRow {
  id: string;
  name: string;
  category: string | null;
  package_type: string;
  quantity_per_package: number;
  price: number | string;
  is_active: boolean;
}

export function toCatalog(rows: MasterProductRow[]): CatalogProduct[] {
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    category: row.category ?? row.name,
    package_type: row.package_type,
    quantity_per_package: Number(row.quantity_per_package),
    price: Number(row.price),
    is_active: row.is_active,
  }));
}

/** Product choices shown when adding an order: one per catalog category (same as the web flow). */
export function productCategories(catalog: CatalogProduct[]): string[] {
  return Array.from(new Set(catalog.filter(p => p.is_active).map(p => p.category || p.name.split(/[ _]/)[0])));
}

/** Price every line with the shared catalog resolver (best of customer tier and quantity tier). */
export function priceItems(items: DraftItem[], tier: TierType, catalog: CatalogProduct[]) {
  const result = resolveCatalogPricing(items, tier, catalog);
  return {
    items: result.priced.map(({ item, pricePerBottle, subtotal, productId }) => ({
      ...item,
      pricePerBottle,
      subtotal,
      productId,
    })),
    activeTier: result.sourceTier,
    missing: result.missing,
  };
}

/** Cost price per bottle from the seller's level (same rule as the web app's useOrdersDb). */
export function buyPricePerBottle(level: MitraLevel, customBuyPrice: number | null | undefined): number {
  if (level === 'custom') return customBuyPrice ?? 0;
  return MITRA_LEVELS[level]?.buyPricePerBottle ?? 0;
}

export interface OrderTotals {
  totalQuantity: number;
  totalPrice: number;
  buyPrice: number;
  totalExpenses: number;
  /** Omzet − modal − biaya order (what the web app stores in orders.margin) */
  margin: number;
  avgPricePerBottle: number;
}

/** Cost of one bottle: a number for every product, or a lookup per product (see mitraCostLookup). */
export type CostRule = number | ((productName: string) => number);

/**
 * Cost per bottle for each product at the seller's level. A mitra buys at the package price of their
 * level, so the cost is that catalog package price ÷ bottles (BP group: 240/225/210/195/175 rb, the
 * same as MITRA_LEVELS; Blue & Green and Belgie follow their own package prices). Custom level and
 * products without a catalog row use the single cost from the profile.
 */
export function mitraCostLookup(level: MitraLevel, customBuyPrice: number | null | undefined, catalog: CatalogProduct[] | undefined): (productName: string) => number {
  const flat = buyPricePerBottle(level, customBuyPrice);
  const tier = LEVEL_TIER[level];
  if (!tier || !catalog?.length) return () => flat;
  return (productName: string) => {
    const priced = resolveCatalogPricing([{ productName, quantity: 1 }], tier, catalog).priced[0];
    return priced && priced.priceSource === 'catalog' && priced.sourceTier === tier ? priced.pricePerBottle : flat;
  };
}

export function computeOrderTotals(items: DraftItem[], expenses: DraftExpense[], cost: CostRule): OrderTotals {
  const active = items.filter(item => item.quantity > 0);
  const totalQuantity = active.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = active.reduce((sum, item) => sum + item.subtotal, 0);
  const costOf = typeof cost === 'number' ? () => cost : cost;
  const buyPrice = active.reduce((sum, item) => sum + costOf(item.productName) * item.quantity, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  return {
    totalQuantity,
    totalPrice,
    buyPrice,
    totalExpenses,
    margin: totalPrice - buyPrice - totalExpenses,
    avgPricePerBottle: totalQuantity > 0 ? Math.round(totalPrice / totalQuantity) : 0,
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  BP: 'British Propolis',
  KID: 'BP Green',
  BLUE: 'BP Blue',
  STEFFI: 'Steffi Pro',
  BRE: 'Brassic Eye',
  BRO: 'Brassic Pro',
  NORWAY: 'BP Norway',
  BELGIE: 'Belgie',
};

/** Friendly name for a catalog category code; the code itself is still what gets saved (same as the web app). */
export function productDisplayName(category: string): string {
  return CATEGORY_LABELS[category.toUpperCase()] ?? category;
}
