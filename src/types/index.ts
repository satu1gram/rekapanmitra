// Types for BP Community Manager

export type TierType = 'satuan' | 'reseller' | 'agen' | 'agen_plus' | 'sap' | 'se';

// Level mitra (level penjual sendiri) - menentukan harga modal
export type MitraLevel = 'reseller' | 'agen' | 'agen_plus' | 'sap' | 'se';

export interface MitraLevelInfo {
  level: MitraLevel;
  buyPricePerBottle: number; // Harga modal per botol
  label: string;
}

// Harga modal berdasarkan level mitra
export const MITRA_LEVELS: Record<MitraLevel, MitraLevelInfo> = {
  reseller: {
    level: 'reseller',
    buyPricePerBottle: 217000,
    label: 'Reseller'
  },
  agen: {
    level: 'agen',
    buyPricePerBottle: 198000,
    label: 'Agen'
  },
  agen_plus: {
    level: 'agen_plus',
    buyPricePerBottle: 180000,
    label: 'Agen Plus'
  },
  sap: {
    level: 'sap',
    buyPricePerBottle: 170000,
    label: 'Spesial Agen Plus (SAP)'
  },
  se: {
    level: 'se',
    buyPricePerBottle: 150000,
    label: 'Special Entrepreneur (SE)'
  }
};

export interface TierPricing {
  tier: TierType;
  bottles: number;
  pricePerBottle: number; // Harga jual standar per botol
  totalPrice: number;
  marginPerBottle: number;
  label: string;
}

// Tier customer (paket yang dibeli customer)
export const TIER_PRICING: Record<TierType, TierPricing> = {
  satuan: {
    tier: 'satuan',
    bottles: 1,
    pricePerBottle: 250000,
    totalPrice: 250000,
    marginPerBottle: 0,
    label: 'Satuan (Konsumsi)'
  },
  reseller: {
    tier: 'reseller',
    bottles: 3,
    pricePerBottle: 217000,
    totalPrice: 650000,
    marginPerBottle: 33000,
    label: 'Reseller'
  },
  agen: {
    tier: 'agen',
    bottles: 5,
    pricePerBottle: 198000,
    totalPrice: 990000,
    marginPerBottle: 52000,
    label: 'Agen'
  },
  agen_plus: {
    tier: 'agen_plus',
    bottles: 10,
    pricePerBottle: 180000,
    totalPrice: 1800000,
    marginPerBottle: 70000,
    label: 'Agen Plus'
  },
  sap: {
    tier: 'sap',
    bottles: 40,
    pricePerBottle: 170000,
    totalPrice: 6800000,
    marginPerBottle: 80000,
    label: 'Spesial Agen Plus (SAP)'
  },
  se: {
    tier: 'se',
    bottles: 200,
    pricePerBottle: 150000,
    totalPrice: 30000000,
    marginPerBottle: 100000,
    label: 'Special Entrepreneur (SE)'
  }
};

export type OrderStatus = 'pending' | 'terkirim' | 'selesai';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  tier: TierType;
  quantity: number;
  pricePerBottle: number;
  totalPrice: number;
  buyPrice: number;
  margin: number;
  transferProofUrl?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  tier: TierType;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockEntry {
  id: string;
  type: 'in' | 'out';
  quantity: number;
  tier?: TierType;
  buyPricePerBottle?: number;
  totalBuyPrice?: number;
  orderId?: string;
  transferProofUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  currentStock: number;
  averageMargin: number;
}
export const LOW_STOCK_THRESHOLD = 3;

export interface OrderExpense {
  id: string;
  orderId: string;
  name: string;
  amount: number;
  createdAt: string;
}
