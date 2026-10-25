// Types for Rekapan Mitra

export type TierType = 'satuan' | 'reseller' | 'agen' | 'agen_plus' | 'sap' | 'se';

// Level mitra (level penjual sendiri) - menentukan harga modal
export type MitraLevel = 'reseller' | 'agen' | 'agen_plus' | 'sap' | 'se' | 'custom';

export interface MitraLevelInfo {
  level: MitraLevel;
  buyPricePerBottle: number; // Harga modal per botol
  label: string;
}

// Harga modal berdasarkan level mitra
export const MITRA_LEVELS: Record<MitraLevel, MitraLevelInfo> = {
  reseller: {
    level: 'reseller',
    buyPricePerBottle: 240000,
    label: 'Reseller'
  },
  agen: {
    level: 'agen',
    buyPricePerBottle: 225000,
    label: 'Agen'
  },
  agen_plus: {
    level: 'agen_plus',
    buyPricePerBottle: 210000,
    label: 'Agen Plus'
  },
  sap: {
    level: 'sap',
    buyPricePerBottle: 195000,
    label: 'Spesial Agen Plus (SAP)'
  },
  se: {
    level: 'se',
    buyPricePerBottle: 175000,
    label: 'Special Entrepreneur (SE)'
  },
  custom: {
    level: 'custom',
    buyPricePerBottle: 0, // diisi user saat onboarding
    label: 'Level Kustom'
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
    pricePerBottle: 265000,
    totalPrice: 265000,
    marginPerBottle: 0,
    label: 'Satuan (Konsumsi)'
  },
  reseller: {
    tier: 'reseller',
    bottles: 3,
    pricePerBottle: 240000,
    totalPrice: 720000,
    marginPerBottle: 25000,
    label: 'Reseller'
  },
  agen: {
    tier: 'agen',
    bottles: 5,
    pricePerBottle: 225000,
    totalPrice: 1125000,
    marginPerBottle: 40000,
    label: 'Agen'
  },
  agen_plus: {
    tier: 'agen_plus',
    bottles: 10,
    pricePerBottle: 210000,
    totalPrice: 2100000,
    marginPerBottle: 55000,
    label: 'Agen Plus'
  },
  sap: {
    tier: 'sap',
    bottles: 40,
    pricePerBottle: 195000,
    totalPrice: 7800000,
    marginPerBottle: 70000,
    label: 'Spesial Agen Plus (SAP)'
  },
  se: {
    tier: 'se',
    bottles: 200,
    pricePerBottle: 175000,
    totalPrice: 35000000,
    marginPerBottle: 90000,
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
  address?: string;
  province?: string;
  city?: string;
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

export interface OrderItem {
  id?: string;
  productName: string;
  productId?: string;
  quantity: number;
  pricePerBottle: number;  // Currently acts as price_per_package from master_products
  subtotal: number;
}
