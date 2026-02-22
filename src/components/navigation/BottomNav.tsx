import { TabId, NAV_PRIMARY_ITEMS } from './NavItems';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-slate-200 rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex max-w-lg items-end justify-around h-[5.5rem] pb-5 px-2">
        {NAV_PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center w-full gap-1.5 p-2 min-h-[48px]",
                isActive ? "text-emerald-700" : "text-slate-400 hover:text-slate-600 active:text-slate-800"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
              <span className="text-xs font-bold tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
