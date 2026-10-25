import type { Order, PrototypeData } from './model';

function sumKnown(values: (number | null | undefined)[]) {
  if (values.some(value => value == null || !Number.isSafeInteger(value))) return null;
  const total = values.reduce<number>((sum, value) => sum + value!, 0);
  return Number.isSafeInteger(total) ? total : null;
}

export function orderFinances(order: Order) {
  const sales = order.quote.revenue;
  const received = order.paid - order.refunded;
  return { sales, received, outstanding: order.status === 'cancelled' ? 0 : sales === null ? null : Math.max(0, sales - order.paid), cost: order.quote.cost, expenses: order.quote.sellerExpenses, profit: order.quote.profit };
}

/** Order-cohort reporting: payments are attributed to the order month, not a bank ledger. */
export function financialOverview(data: PrototypeData, month: string) {
  const orders = data.orders.filter(order => order.status === 'confirmed' && order.date.startsWith(month));
  const sales = sumKnown(orders.map(order => order.quote.revenue));
  const received = sumKnown(orders.map(order => order.paid - order.refunded));
  const outstanding = sumKnown(orders.map(order => orderFinances(order).outstanding));
  const cost = sumKnown(orders.map(order => order.quote.cost));
  const orderExpenses = sumKnown(orders.map(order => order.quote.sellerExpenses));
  const margin = sumKnown(orders.map(order => order.quote.profit));
  const generalExpenses = sumKnown(data.cash.filter(row => row.kind === 'expense' && row.date.startsWith(month)).map(row => row.amount))!;
  const otherIncome = sumKnown(data.cash.filter(row => row.kind === 'income' && row.date.startsWith(month)).map(row => row.amount))!;
  const net = sales === null || cost === null || orderExpenses === null || margin === null || generalExpenses === null || otherIncome === null ? null : margin - generalExpenses + otherIncome;
  const purchases = data.purchases.filter(purchase => purchase.status === 'ordered' && purchase.purchaseDate.startsWith(month));
  const purchaseValue = sumKnown(purchases.flatMap(purchase => purchase.lines.map(line => line.quantity * line.unitCost)));
  const allUnpaid = data.orders.filter(order => order.status === 'confirmed' && (orderFinances(order).outstanding ?? 0) > 0);
  const periodUnpaid = orders.filter(order => (orderFinances(order).outstanding ?? 0) > 0);
  return { orders, sales, received, outstanding, cost, orderExpenses, margin, generalExpenses, otherIncome, net, purchases, purchaseValue, allUnpaid, periodUnpaid };
}

export function monthName(month: string) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(`${month}-01T12:00:00+07:00`));
}
