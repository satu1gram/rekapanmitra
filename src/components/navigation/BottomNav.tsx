import { NavLink, useNavigate } from 'react-router-dom';
import { NAV_PRIMARY_ITEMS } from './NavItems';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

const TAB_PATHS: Record<string, string> = {
  dashboard: '/dashboard',
  orders: '/riwayat',
  stock: '/produk',
  settings: '/akun',
};

export function BottomNav() {
  const navigate = useNavigate();

  const handleAddClick = () => {
    navigate('/riwayat', { state: { openAdd: true } });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-stretch justify-around h-[4.5rem] px-2 relative">

        {NAV_PRIMARY_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const path = TAB_PATHS[item.id] ?? '/';

          // Regular nav tab
          const navTab = (
            <NavLink
              key={item.id}
              to={path}
              end={path === '/dashboard'}
              className="relative flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors"
            >
              {({ isActive }) => (
                <>
                  {/* Top active indicator */}
                  <span className={cn(
                    'absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full transition-all duration-300',
                    isActive ? 'bg-emerald-500' : 'bg-transparent'
                  )} />
                  {/* Icon */}
                  <span className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200',
                    isActive ? 'bg-emerald-50' : ''
                  )}>
                    <Icon className={cn(
                      'h-5 w-5 transition-all duration-200',
                      isActive ? 'text-emerald-600 stroke-[2.5px]' : 'text-slate-400 stroke-2'
                    )} />
                  </span>
                  {/* Label */}
                  <span className={cn(
                    'text-[9px] font-bold tracking-tight transition-colors duration-200',
                    isActive ? 'text-emerald-600' : 'text-slate-400'
                  )}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );

          if (index === 1) {
            return [
              navTab,
              // TAMBAH — same flex-1 structure, aligned with others
              <div key="add-button" className="relative flex flex-col items-center justify-center flex-1 gap-0.5">
                {/* Top indicator — always hidden (not a route) */}
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-transparent" />
                {/* Icon wrapper */}
                <button
                  onClick={handleAddClick}
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-500 transition-all active:scale-95 active:bg-emerald-50 active:text-emerald-600"
                >
                  <Plus className="w-5 h-5 stroke-2" />
                </button>
                {/* Label */}
                <span className="text-[9px] font-bold tracking-tight text-slate-400">TAMBAH</span>
              </div>,
            ];
          }

          return navTab;
        })}
      </div>
    </nav>
  );
}
