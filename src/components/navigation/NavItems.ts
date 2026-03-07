import {
  LayoutGrid,
  ReceiptText,
  ClipboardCheck,
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
  { id: 'dashboard', label: 'BERANDA', icon: LayoutGrid },
  { id: 'orders', label: 'RIWAYAT', icon: ReceiptText },
  { id: 'stock', label: 'STOK', icon: ClipboardCheck },
  { id: 'settings', label: 'AKUN', icon: Settings },
];

export const NAV_MORE_ITEMS: NavItem[] = [];

// Backwards-compat: full list, if other parts need it later.
export const NAV_ITEMS: NavItem[] = [...NAV_PRIMARY_ITEMS, ...NAV_MORE_ITEMS];
