import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';
import { supabase } from '~/lib/supabase';

/** Tables not present in the generated web types (master_products, order_expenses) go through this untyped handle. */
export const untyped = supabase as unknown as SupabaseClient;

export type OrderRow = Tables<'orders'>;
export type OrderItemRow = Tables<'order_items'>;
export type CustomerRow = Tables<'customers'>;
export type StockEntryRow = Tables<'stock_entries'>;
export type ProfileRow = Tables<'profiles'>;

export interface OrderExpenseRow {
  id: string;
  order_id: string;
  user_id: string;
  name: string;
  amount: number;
  created_at: string;
}

/** PostgREST returns at most 1000 rows per request; read every page so totals are never silently cut off. */
export async function fetchAllPages<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}

export async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Sesi berakhir. Silakan masuk lagi.');
  return id;
}
