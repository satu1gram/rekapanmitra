import { supabase } from '~/lib/supabase';
import { fetchAllPages } from './db';

export interface MoneyEntry {
  id: string;
  name: string;
  amount: number;
  category: string | null;
  date: string;
}

export async function listGeneralExpenses(userId: string): Promise<MoneyEntry[]> {
  const rows = await fetchAllPages((from, to) =>
    supabase.from('general_expenses').select('*').eq('user_id', userId).order('expense_date', { ascending: false }).range(from, to),
  );
  return rows.map(r => ({ id: r.id, name: r.name, amount: Number(r.amount), category: r.category, date: r.expense_date }));
}

export async function listGeneralIncome(userId: string): Promise<MoneyEntry[]> {
  const rows = await fetchAllPages((from, to) =>
    supabase.from('general_income').select('*').eq('user_id', userId).order('income_date', { ascending: false }).range(from, to),
  );
  return rows.map(r => ({ id: r.id, name: r.name, amount: Number(r.amount), category: r.category, date: r.income_date }));
}

export interface MonthTarget {
  year: number;
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
