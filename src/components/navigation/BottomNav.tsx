import { TabId, NAV_PRIMARY_ITEMS } from './NavItems';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-lg items-end justify-around h-[5rem] pb-4 px-2">
        {NAV_PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center w-full gap-1 min-h-[48px]",
                isActive ? "text-emerald-700" : "text-slate-400 hover:text-slate-600 active:text-slate-800"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
