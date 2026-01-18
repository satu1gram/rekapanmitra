import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings,
  type LucideIcon
} from 'lucide-react';

export type TabId = 'dashboard' | 'orders' | 'stock' | 'customers' | 'settings';

export interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { id: 'orders', label: 'Order', icon: ShoppingCart },
  { id: 'stock', label: 'Stok', icon: Package },
  { id: 'customers', label: 'Customer', icon: Users },
  { id: 'settings', label: 'Pengaturan', icon: Settings }
];
