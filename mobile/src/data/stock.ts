import type { TierType } from '@/types';
import { supabase } from '~/lib/supabase';
import { fetchAllPages, requireUserId, type StockEntryRow } from './db';

export async function getStock(userId: string) {
  const [entries, stockRes] = await Promise.all([
    fetchAllPages<StockEntryRow>((from, to) =>
      supabase
        .from('stock_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to),
    ),
    supabase.from('user_stock').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  if (stockRes.error) throw stockRes.error;
  return { entries, currentStock: stockRes.data?.current_stock ?? 0, hasBalanceRow: !!stockRes.data };
}

/** Read the latest balance from the server right before writing (the web app uses its cached value). */
async function readBalance(userId: string) {
  const { data, error } = await supabase.from('user_stock').select('current_stock').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? { exists: true, value: Number(data.current_stock ?? 0) } : { exists: false, value: 0 };
}

async function writeBalance(userId: string, exists: boolean, value: number) {
  const { error } = exists
    ? await supabase.from('user_stock').update({ current_stock: value }).eq('user_id', userId)
    : await supabase.from('user_stock').insert({ user_id: userId, current_stock: value });
  if (error) throw error;
}

export interface RestockInput {
  quantity: number;
  tier: TierType | null;
  buyPricePerBottle: number | null;
  notes?: string;
  createdAt: string;
}

export async function addRestock(input: RestockInput) {
  const userId = await requireUserId();
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) throw new Error('Jumlah botol harus lebih dari 0.');

  const { data: entry, error } = await supabase
    .from('stock_entries')
    .insert({
      user_id: userId,
      type: 'in',
      quantity: input.quantity,
      tier: input.tier,
      buy_price_per_bottle: input.buyPricePerBottle,
      total_buy_price: input.buyPricePerBottle != null ? input.quantity * input.buyPricePerBottle : null,
      transfer_proof_url: null,
      notes: input.notes?.trim() || null,
      created_at: input.createdAt,
    })
    .select('id')
    .single();
  if (error) throw error;

  try {
    const balance = await readBalance(userId);
    await writeBalance(userId, balance.exists, balance.value + input.quantity);
  } catch (balanceError) {
    await supabase.from('stock_entries').delete().eq('id', entry.id);
    throw balanceError;
  }
}

export async function deleteStockEntry(entry: Pick<StockEntryRow, 'id' | 'quantity' | 'type'>) {
  const userId = await requireUserId();
  const { error } = await supabase.from('stock_entries').delete().eq('id', entry.id).eq('user_id', userId);
  if (error) throw error;
  const balance = await readBalance(userId);
  const adjustment = entry.type === 'in' || entry.type === 'initial' ? -entry.quantity : entry.quantity;
  await writeBalance(userId, balance.exists, Math.max(0, balance.value + adjustment));
}
