import { MITRA_LEVELS, type MitraLevel, type TierType } from '@/types';
import { resolveCatalogPricing, type CatalogProduct } from '@/lib/catalogPricing';

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

export function computeOrderTotals(items: DraftItem[], expenses: DraftExpense[], costPerBottle: number): OrderTotals {
  const active = items.filter(item => item.quantity > 0);
  const totalQuantity = active.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = active.reduce((sum, item) => sum + item.subtotal, 0);
  const buyPrice = costPerBottle * totalQuantity;
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
