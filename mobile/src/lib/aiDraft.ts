/**
 * Turn the parse-order Edge Function result into an order/restock draft. The AI only proposes
 * names and quantities; prices, cost and totals are always computed in the app, and nothing is
 * saved until the user reviews and confirms (same rule as the web app).
 */
export interface AiItem {
  nama: string;
  qty: number;
  satuan?: string;
}

const CATEGORY_PATTERNS: [string, RegExp][] = [
  ['KID', /\b(green|kids?|hijau)\b/i],
  ['BLUE', /\b(blue|biru)\b/i],
  ['BELGIE', /\bbelgie\b|facial\s*wash|serum|day\s*cream|night\s*cream|hair\s*tonic/i],
  ['STEFFI', /\bsteffi\b/i],
  ['BRE', /brassic\s*eye|\bbre\b|\beye\b/i],
  ['BRO', /brassic\s*pro|\bbro\b/i],
  ['NORWAY', /\bnorway\b/i],
  ['BP', /\bbp\b|british\s*propolis|propolis/i],
];

/** Map a product name written in chat to a catalog category, or null when it is not recognised. */
export function matchCategory(name: string, categories: string[]): string | null {
  const available = new Set(categories.map(c => c.toUpperCase()));
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(name) && available.has(category)) return category;
  }
  const exact = categories.find(c => c.toUpperCase() === name.trim().toUpperCase());
  return exact ?? null;
}

export interface DraftFromAi {
  quantities: Record<string, number>;
  unknown: string[];
  /** Lines whose unit looked like a package rather than bottles; the user must check them. */
  packageLines: string[];
}

export function draftFromAiItems(items: AiItem[], categories: string[]): DraftFromAi {
  const quantities: Record<string, number> = {};
  const unknown: string[] = [];
  const packageLines: string[] = [];
  for (const item of items) {
    const qty = Number(item.qty);
    if (!item.nama || !Number.isInteger(qty) || qty <= 0) {
      if (item.nama) unknown.push(item.nama);
      continue;
    }
    const category = matchCategory(item.nama, categories);
    if (!category) {
      unknown.push(item.nama);
      continue;
    }
    quantities[category] = (quantities[category] ?? 0) + qty;
    if (item.satuan && /pa?ke?t|pak|box|dus/i.test(item.satuan)) packageLines.push(item.nama);
  }
  return { quantities, unknown, packageLines };
}

/** Accept YYYY-MM-DD dates from the AI only when valid and not in the future. */
export function aiDate(value: string | undefined, now = new Date()): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getMonth() !== Number(m[2]) - 1 || d > now) return null;
  return d;
}
