import { supabase } from '~/lib/supabase';
import { fetchAllPages, requireUserId } from './db';

export type MoneyKind = 'expense' | 'income';

export interface MoneyEntry {
  id: string;
  name: string;
  amount: number;
  category: string;
  notes: string | null;
  /** YYYY-MM-DD (local calendar day) */
  date: string;
}

/** Same categories as the web app (useGeneralExpenses / useGeneralIncome). */
export const EXPENSE_CATEGORIES = [
  { value: 'transport', label: 'Transportasi' },
  { value: 'packaging', label: 'Kemasan' },
  { value: 'marketing', label: 'Promosi' },
  { value: 'operational', label: 'Operasional' },
  { value: 'salary', label: 'Gaji/Upah' },
  { value: 'other', label: 'Lainnya' },
] as const;

export const INCOME_CATEGORIES = [
  { value: 'bonus', label: 'Bonus' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Investasi' },
  { value: 'gift', label: 'Hadiah' },
  { value: 'refund', label: 'Refund' },
  { value: 'other', label: 'Lainnya' },
] as const;

export function categoryLabel(kind: MoneyKind, value: string): string {
  const list = kind === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return list.find(c => c.value === value)?.label ?? 'Lainnya';
}

export async function listGeneralExpenses(userId: string): Promise<MoneyEntry[]> {
  const rows = await fetchAllPages((from, to) =>
    supabase.from('general_expenses').select('*').eq('user_id', userId).order('expense_date', { ascending: false }).range(from, to),
  );
  return rows.map(r => ({ id: r.id, name: r.name, amount: Number(r.amount), category: r.category || 'other', notes: r.notes, date: r.expense_date.slice(0, 10) }));
}

export async function listGeneralIncome(userId: string): Promise<MoneyEntry[]> {
  const rows = await fetchAllPages((from, to) =>
    supabase.from('general_income').select('*').eq('user_id', userId).order('income_date', { ascending: false }).range(from, to),
  );
  return rows.map(r => ({ id: r.id, name: r.name, amount: Number(r.amount), category: r.category || 'other', notes: r.notes, date: r.income_date.slice(0, 10) }));
}

export interface MoneyInput {
  name: string;
  amount: number;
  category: string;
  notes?: string;
  date: string;
}

export async function saveMoneyEntry(kind: MoneyKind, input: MoneyInput, id?: string) {
  const userId = await requireUserId();
  if (!input.name.trim()) throw new Error('Isi keterangan.');
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Nominal harus lebih dari 0.');
  const common = { name: input.name.trim(), amount: input.amount, category: input.category || 'other', notes: input.notes?.trim() || null };
  if (kind === 'expense') {
    const row = { ...common, expense_date: input.date };
    const { error } = id
      ? await supabase.from('general_expenses').update(row).eq('id', id).eq('user_id', userId)
      : await supabase.from('general_expenses').insert({ ...row, user_id: userId });
    if (error) throw error;
  } else {
    const row = { ...common, income_date: input.date };
    const { error } = id
      ? await supabase.from('general_income').update(row).eq('id', id).eq('user_id', userId)
      : await supabase.from('general_income').insert({ ...row, user_id: userId });
    if (error) throw error;
  }
}

export async function deleteMoneyEntry(kind: MoneyKind, id: string) {
  const userId = await requireUserId();
  const table = kind === 'expense' ? 'general_expenses' : 'general_income';
  const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export interface MonthTarget {
  year: number;
  /** 0-indexed, as stored by the web app */
  month: number;
  targetProfit: number;
  targetQty: number;
  targetStock: number;
}

export async function listTargets(userId: string): Promise<MonthTarget[]> {
  const { data, error } = await supabase
    .from('monthly_targets')
    .select('year, month, target_profit, target_qty, target_stock')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map(r => ({
    year: r.year,
    month: r.month,
    targetProfit: Number(r.target_profit),
    targetQty: Number(r.target_qty),
    targetStock: Number(r.target_stock),
  }));
}

export async function saveTarget(target: MonthTarget) {
  const userId = await requireUserId();
  const { error } = await supabase.from('monthly_targets').upsert(
    {
      user_id: userId,
      year: target.year,
      month: target.month,
      target_profit: target.targetProfit,
      target_qty: target.targetQty,
      target_stock: target.targetStock,
    },
    { onConflict: 'user_id,year,month' },
  );
  if (error) throw error;
}
