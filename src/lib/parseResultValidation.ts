import { z } from 'zod';
import type { ParseResult } from '@/lib/orderParser';

const item = z.object({
  nama: z.string().trim().min(1).max(120),
  qty: z.number().int().positive().max(100_000),
  satuan: z.string().max(30).optional(),
});
const items = z.array(item).min(1).max(100);
const catatan = z.string().max(2000).default('');
const date = z.string().refine(value => value === '' || (
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
));

// Prices and costs are deliberately absent: the model cannot set them.
export const parseResultSchema = z.discriminatedUnion('intent', [
  z.object({
    intent: z.literal('order'), pelanggan: z.string().trim().max(150).default(''),
    hp: z.string().trim().max(40).default(''), tanggal: date.optional(), items, catatan,
  }),
  z.object({ intent: z.literal('restok'), items, catatan }),
  z.object({ intent: z.literal('out_of_scope'), message: z.string().min(1).max(2000) }),
]);

export function validateParseResult(data: unknown): Omit<Extract<ParseResult, { intent: 'order' }>, 'raw'> | Omit<Extract<ParseResult, { intent: 'restok' }>, 'raw'> | Omit<Extract<ParseResult, { intent: 'out_of_scope' }>, 'raw'> {
  const result = parseResultSchema.safeParse(data);
  if (!result.success) throw new Error('Hasil AI belum valid. Periksa nama produk, jumlah botol, dan tanggal, lalu coba lagi.');
  // The app uses strictNullChecks:false; Zod's inferred object properties become
  // optional in that mode. The runtime schema above enforces the required fields.
  return result.data as ReturnType<typeof validateParseResult>;
}
