import { NavLink } from 'react-router-dom';
import { NAV_PRIMARY_ITEMS } from './NavItems';
import { cn } from '@/lib/utils';

// Map TabId → path URL
const TAB_PATHS: Record<string, string> = {
  dashboard: '/',
  orders: '/riwayat',
  stock: '/produk',
  settings: '/akun',
};

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-lg items-end justify-around h-[5rem] pb-4 px-2">
        {NAV_PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon;
          const path = TAB_PATHS[item.id] ?? '/';

          return (
            <NavLink
              key={item.id}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-full gap-1 min-h-[48px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
