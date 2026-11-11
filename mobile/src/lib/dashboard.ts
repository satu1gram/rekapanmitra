import { isInMonth, type MonthRef } from './dates';

export interface OrderLike {
  created_at: string;
  total_price: number | string;
  buy_price: number | string | null;
  margin: number | string;
  quantity: number;
}
export interface AmountLike {
  amount: number | string;
  date: string;
}
export interface StockEntryLike {
  type: string;
  quantity: number;
  created_at: string;
}
export interface TargetLike {
  targetProfit: number;
  targetQty: number;
  targetStock: number;
}

export interface MonthSummary {
  orderCount: number;
  quantity: number;
  revenue: number;
  /** Omzet − modal */
  grossProfit: number;
  /** Biaya yang dicatat di dalam order (ongkir, dll.) */
  orderExpenses: number;
  generalExpenses: number;
  otherIncome: number;
  /** Laba kotor − biaya order − pengeluaran umum + pemasukan lain */
  netProfit: number;
  restockQuantity: number;
}

/** Same formulas as the web dashboard (src/components/dashboard/Dashboard.tsx). */
export function summarizeMonth(
  month: MonthRef,
  orders: OrderLike[],
  expenses: AmountLike[],
  income: AmountLike[],
  stockEntries: StockEntryLike[],
): MonthSummary {
  const monthOrders = orders.filter(order => isInMonth(order.created_at, month));
  const revenue = monthOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const marginTotal = monthOrders.reduce((sum, o) => sum + Number(o.margin), 0);
  const grossProfit = monthOrders.reduce((sum, o) => sum + Number(o.total_price) - Number(o.buy_price || 0), 0);
  const orderExpenses = Math.max(0, grossProfit - marginTotal);
  const generalExpenses = expenses.filter(e => isInMonth(e.date, month)).reduce((sum, e) => sum + Number(e.amount), 0);
  const otherIncome = income.filter(i => isInMonth(i.date, month)).reduce((sum, i) => sum + Number(i.amount), 0);
  return {
    orderCount: monthOrders.length,
    quantity: monthOrders.reduce((sum, o) => sum + o.quantity, 0),
    revenue,
    grossProfit,
    orderExpenses,
    generalExpenses,
    otherIncome,
    netProfit: grossProfit - orderExpenses - generalExpenses + otherIncome,
    restockQuantity: stockEntries
      .filter(e => e.type === 'in' && isInMonth(e.created_at, month))
      .reduce((sum, e) => sum + e.quantity, 0),
  };
}

export function percent(value: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

export function targetProgress(summary: MonthSummary, target: TargetLike | null, includeCosts: boolean) {
  if (!target) return null;
  const profit = includeCosts ? summary.netProfit : summary.grossProfit;
  return {
    profit: { value: profit, target: target.targetProfit, pct: percent(profit, target.targetProfit) },
    qty: { value: summary.quantity, target: target.targetQty, pct: percent(summary.quantity, target.targetQty) },
    stock: { value: summary.restockQuantity, target: target.targetStock, pct: percent(summary.restockQuantity, target.targetStock) },
  };
}
