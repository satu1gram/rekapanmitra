import type { MulaExpense } from '@/lib/mulaBusiness';

/** Conservative Indonesian rupiah parsing. Unknown / ambiguous amounts stay unknown. */
export function parseRupiahText(value: string): number | null {
  const text = value.toLowerCase().trim().replace(/^rp\.?\s*/, '').replace(/\s+/g, '');
  if (text === 'gratis') return 0;
  const match = text.match(/^(\d+(?:[.,]\d+)*)(ribu|rb|k|juta|jt)?$/);
  if (!match) return null;
  let raw = match[1]; const suffix = match[2];
  const multiplier = /^(juta|jt)$/.test(suffix ?? '') ? 1000000 : suffix ? 1000 : 1;
  if (/^\d{1,3}(?:\.\d{3})+(?:,0{1,2})?$/.test(raw)) raw = raw.replace(/\./g, '').replace(/,0{1,2}$/, '');
  else if (suffix && /^\d+,\d{1,3}$/.test(raw)) raw = raw.replace(',', '.');
  else if (!suffix && /^\d+,0{1,2}$/.test(raw)) raw = raw.replace(/,0{1,2}$/, '');
  else if (!/^\d+$/.test(raw)) return null;
  const amount = Number(raw) * multiplier;
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

export function extractMoneyExpenses(text: string) {
  const expenses: MulaExpense[] = []; const issues: string[] = []; const unresolved: string[] = []; const seen = new Set<string>();
  for (const label of text.matchAll(/\b(ongkir|infaq|kemasan|packing|admin)\b/gi)) {
    const name = label[1].toLowerCase() === 'packing' ? 'kemasan' : label[1].toLowerCase();
    const rest = text.slice(label.index! + label[0].length);
    const token = rest.match(/^\s*[:=]?\s*((?:rp\.?\s*)?\d+(?:[.,]\d+)*(?:\s*(?:ribu|rb|juta|jt|k))?|gratis)(?![a-z\d])/i);
    const amount = token ? parseRupiahText(token[1]) : null;
    if (!token || amount === null || /^\s*[-–]\s*\d/.test(rest.slice(token[0].length))) { issues.push(`Nominal ${name} belum jelas. Isi manual; biaya ini belum dihitung.`); unresolved.push(name); continue; }
    if (seen.has(name)) issues.push(`${name} disebut lebih dari sekali. Hapus baris yang berulang atau koreksi nominalnya.`);
    if (/pembeli|customer|buyer/i.test(rest.slice(0, 65))) issues.push(`Periksa siapa yang menanggung ${name}; cara pembayaran ke pihak lain belum dapat dipastikan.`);
    seen.add(name); expenses.push({ name: name[0].toUpperCase() + name.slice(1), amount, payer: 'seller' });
  }
  return { expenses, issues: [...new Set(issues)], unresolved: [...new Set(unresolved)] };
}
