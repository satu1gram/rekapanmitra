import { businessDate, shiftDate, type OverviewData } from '@/lib/businessOverview';

// Synthetic records only. This demo never writes to Supabase or calls an AI service.
export function createAssistantDemo(now = new Date()): OverviewData {
  const today = businessDate(now);
  return {
    currentStock: 3,
    orders: Array.from({ length: 30 }, (_, index) => ({
      created_at: `${shiftDate(today, -index)}T10:00:00+07:00`,
      quantity: 3, total_price: 650000, margin: 110000,
      status: index === 0 ? 'pending' : 'selesai',
    })),
    expenses: [{ date: today, amount: 25000 }],
    income: [{ date: today, amount: 10000 }],
  };
}
