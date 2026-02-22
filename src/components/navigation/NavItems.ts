import { 
  LayoutDashboard, 
  Receipt,
  Package, 
  Settings,
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
  { id: 'orders', label: 'Riwayat', icon: Receipt },
  { id: 'stock', label: 'Produk', icon: Package },
  { id: 'settings', label: 'Akun', icon: Settings },
];

export const NAV_MORE_ITEMS: NavItem[] = [];

// Backwards-compat: full list, if other parts need it later.
export const NAV_ITEMS: NavItem[] = [...NAV_PRIMARY_ITEMS, ...NAV_MORE_ITEMS];
