import { useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { TabId, NAV_MORE_ITEMS, NAV_PRIMARY_ITEMS } from './NavItems';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = useMemo(() => {
    return NAV_MORE_ITEMS.some((x) => x.id === activeTab);
  }, [activeTab]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card shadow-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {NAV_PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 transition-colors",
              isMoreActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MoreHorizontal className={cn("h-5 w-5", isMoreActive && "scale-110")} />
            <span className="text-xs font-medium">Lainnya</span>
          </button>
          <SheetContent side="bottom" className="pb-10">
            <SheetHeader>
              <SheetTitle>Menu Lainnya</SheetTitle>
            </SheetHeader>

            <div className="mt-4 grid gap-2">
              {NAV_MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setMoreOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors",
                      isActive
                        ? "border-primary/30"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium", isActive && "text-primary")}>
                        {item.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
