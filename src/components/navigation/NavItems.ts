import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings,
  Wallet,
  CircleDollarSign,
  type LucideIcon
} from 'lucide-react';

export type TabId = 'dashboard' | 'orders' | 'stock' | 'customers' | 'expenses' | 'income' | 'settings';

export interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

export const NAV_PRIMARY_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { id: 'orders', label: 'Order', icon: ShoppingCart },
  { id: 'stock', label: 'Stok', icon: Package },
];

export const NAV_MORE_ITEMS: NavItem[] = [
  { id: 'income', label: 'Pemasukan', icon: CircleDollarSign },
  { id: 'expenses', label: 'Biaya', icon: Wallet },
  { id: 'customers', label: 'Customer', icon: Users },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
];

// Backwards-compat: full list, if other parts need it later.
export const NAV_ITEMS: NavItem[] = [...NAV_PRIMARY_ITEMS, ...NAV_MORE_ITEMS];
