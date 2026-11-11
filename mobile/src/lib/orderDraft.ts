import type { DraftItem } from './orderMath';
import { matchCategory } from './aiDraft';

export interface SavedLine {
  productName: string;
  productId: string | null;
  quantity: number;
  pricePerBottle: number;
  subtotal: number;
}

/**
 * Split the saved lines of an order into catalog quantities (editable with the normal steppers)
 * and fixed lines that match no catalog category (kept with their saved price).
 */
export function linesToDraft(lines: SavedLine[], categories: string[], categoryOfProductId: (id: string) => string | undefined) {
  const quantities: Record<string, number> = {};
  const fixedLines: { productName: string; pricePerBottle: number; quantity: number; productId: string | null }[] = [];
  for (const line of lines) {
    const category = (line.productId && categoryOfProductId(line.productId)) || matchCategory(line.productName, categories);
    if (category && categories.includes(category)) quantities[category] = (quantities[category] ?? 0) + line.quantity;
    else fixedLines.push({ productName: line.productName, pricePerBottle: line.pricePerBottle, quantity: line.quantity, productId: line.productId });
  }
  const savedItems: DraftItem[] = lines.map(l => ({ productName: l.productName, productId: l.productId, quantity: l.quantity, pricePerBottle: l.pricePerBottle, subtotal: l.subtotal }));
  return { quantities, fixedLines, savedItems };
}
