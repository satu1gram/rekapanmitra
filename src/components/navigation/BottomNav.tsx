import { NavLink, useNavigate } from 'react-router-dom';
import { NAV_PRIMARY_ITEMS } from './NavItems';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

// Map TabId → path URL
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
      <div className="mx-auto flex max-w-lg items-end justify-around h-[4.5rem] px-2 relative">
        {NAV_PRIMARY_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const path = TAB_PATHS[item.id] ?? '/';

          const link = (
            <NavLink
              key={item.id}
              to={path}
              end={path === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-16 gap-1 pb-[0.6rem] transition-colors',
                  isActive ? 'text-[#059669]' : 'text-slate-400 hover:text-slate-600'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-6 w-6', isActive && 'stroke-[2.5px]')} />
                  <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );

          if (index === 1) {
            return [
              link,
              <div key="add-button" className="relative flex flex-col items-center justify-center w-16 gap-1 pb-[0.6rem] transition-colors">
                <button
                  onClick={handleAddClick}
                  className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#059669] text-white shadow-lg shadow-emerald-600/20 transform transition-transform active:scale-95 z-40"
                >
                  <Plus className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <span className="text-[10px] font-bold text-[#059669] whitespace-nowrap tracking-tight">TAMBAH</span>
              </div>
            ];
          }

          return link;
        })}
      </div>
    </nav>
  );
}
