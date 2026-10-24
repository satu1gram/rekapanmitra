import { LOW_STOCK_THRESHOLD } from '@/types';

export const BUSINESS_TIMEZONE = 'Asia/Jakarta';
const DAY_MS = 86_400_000;

export interface SalesRecord {
  created_at: string;
  quantity: number;
  total_price: number;
  margin: number;
  status: string;
}

export interface CashRecord {
  date: string;
  amount: number;
}

export interface OverviewData {
  orders: SalesRecord[];
  expenses: CashRecord[];
  income: CashRecord[];
  currentStock: number | null;
}

export function businessDate(value: Date | string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Tanggal transaksi tidak valid.');
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function shiftDate(date: string, days: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** Read-only projection. Revenue means recorded orders, not verified cash receipts. */
export function summarizeBusiness(data: OverviewData, days: 1 | 7 | 30, now = new Date()) {
  const today = businessDate(now);
  const start = shiftDate(today, -(days - 1));
  const inPeriod = (date: string) => date >= start && date <= today;
  const orders = data.orders.filter(order => inPeriod(businessDate(order.created_at)));
  const sumCash = (records: CashRecord[]) => records
    .filter(record => inPeriod(record.date)).reduce((sum, record) => sum + Number(record.amount), 0);
  const revenue = orders.reduce((sum, order) => sum + Number(order.total_price), 0);
  const orderProfit = orders.reduce((sum, order) => sum + Number(order.margin), 0);
  const expenses = sumCash(data.expenses);
  const income = sumCash(data.income);
  return {
    start, end: today, orderCount: orders.length, revenue, expenses, income,
    quantity: orders.reduce((sum, order) => sum + order.quantity, 0),
    estimatedNetProfit: orderProfit - expenses + income,
    pendingCount: orders.filter(order => order.status === 'pending').length,
    currentStock: data.currentStock,
  };
}

/** Estimate using 30 complete calendar days, excluding partial sales today. */
export function estimateRestock(data: OverviewData, leadDays: number, safetyDays: number, now = new Date()) {
  if (![leadDays, safetyDays].every(value => Number.isInteger(value) && value >= 0 && value <= 90)) {
    throw new Error('Jumlah hari harus berupa bilangan bulat antara 0 dan 90.');
  }
  const today = businessDate(now);
  const start = shiftDate(today, -30);
  // Only completed orders represent realized demand for this estimate.
  const completed = data.orders.filter(order => {
    const date = businessDate(order.created_at);
    return date >= start && date < today && order.status === 'selesai';
  });
  const sold = completed.reduce((sum, order) => sum + order.quantity, 0);
  const dailyDemand = sold / 30;
  const targetStock = Math.max(LOW_STOCK_THRESHOLD, Math.ceil(dailyDemand * (leadDays + safetyDays)));
  const stock = data.currentStock;
  return {
    start, end: shiftDate(today, -1), sold, dailyDemand, targetStock,
    suggestedQuantity: stock === null || sold === 0 ? null : Math.max(0, targetStock - stock),
    coverageDays: stock === null || dailyDemand === 0 ? null : Math.max(0, stock) / dailyDemand,
    lowStock: stock !== null && stock <= LOW_STOCK_THRESHOLD,
  };
}
