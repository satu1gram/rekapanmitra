export interface OrderStockEntryLike {
  id?: string | null;
  order_id?: string | null;
  type?: string | null;
  quantity?: number | null;
}

export function calculateOrderStockReversal(stockEntries: OrderStockEntryLike[] = []) {
  const relatedEntries = stockEntries.filter((entry) => {
    if (!entry.order_id) return false;
    return (entry.type ?? '').toLowerCase() === 'out';
  });

  const totalQuantity = relatedEntries.reduce((sum, entry) => {
    const quantity = Number(entry.quantity ?? 0);
    return sum + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);

  return {
    totalQuantity,
    entryIds: relatedEntries
      .map((entry) => entry.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
  };
}
