import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings,
  Wallet,
  type LucideIcon
} from 'lucide-react';

export type TabId = 'dashboard' | 'orders' | 'stock' | 'customers' | 'expenses' | 'settings';

export interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { id: 'orders', label: 'Order', icon: ShoppingCart },
  { id: 'stock', label: 'Stok', icon: Package },
  { id: 'expenses', label: 'Biaya', icon: Wallet },
  { id: 'customers', label: 'Customer', icon: Users },
  { id: 'settings', label: 'Pengaturan', icon: Settings }
];
