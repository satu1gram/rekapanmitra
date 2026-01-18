import { useLocalStorage, generateId } from './useLocalStorage';
import { StockEntry, TierType, LOW_STOCK_THRESHOLD } from '@/types';

export function useStock() {
  const [stockEntries, setStockEntries] = useLocalStorage<StockEntry[]>('bp-stock', []);
  const [currentStock, setCurrentStock] = useLocalStorage<number>('bp-current-stock', 0);

  const addStock = (data: {
    quantity: number;
    tier: TierType;
    buyPricePerBottle: number;
    transferProofUrl?: string;
    notes?: string;
  }) => {
    const entry: StockEntry = {
      id: generateId(),
      type: 'in',
      quantity: data.quantity,
      tier: data.tier,
      buyPricePerBottle: data.buyPricePerBottle,
      totalBuyPrice: data.quantity * data.buyPricePerBottle,
      transferProofUrl: data.transferProofUrl,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    setStockEntries(prev => [entry, ...prev]);
    setCurrentStock(prev => prev + data.quantity);
    return entry;
  };

  const reduceStock = (quantity: number, orderId?: string) => {
    if (currentStock < quantity) {
      throw new Error('Stok tidak mencukupi');
    }

    const entry: StockEntry = {
      id: generateId(),
      type: 'out',
      quantity,
      orderId,
      createdAt: new Date().toISOString()
    };

    setStockEntries(prev => [entry, ...prev]);
    setCurrentStock(prev => prev - quantity);
    return entry;
  };

  const isLowStock = currentStock <= LOW_STOCK_THRESHOLD;

  const getStockHistory = () => stockEntries;

  const getTotalBuyValue = () => {
    return stockEntries
      .filter(entry => entry.type === 'in' && entry.totalBuyPrice)
      .reduce((sum, entry) => sum + (entry.totalBuyPrice || 0), 0);
  };

  return {
    currentStock,
    stockEntries,
    addStock,
    reduceStock,
    isLowStock,
    getStockHistory,
    getTotalBuyValue
  };
}
