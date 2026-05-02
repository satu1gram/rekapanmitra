import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomActionBarProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextIcon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  leftContent?: React.ReactNode;
}

export function BottomActionBar({ 
  onBack, 
  onNext, 
  nextLabel = 'Lanjut', 
  nextIcon = <ArrowRight className="w-4 h-4" />,
  disabled = false,
  loading = false,
  leftContent
}: BottomActionBarProps) {
  return (
    <div className="fixed bottom-[4.5rem] left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 z-[45] shadow-[0_-12px_32px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-600 active:bg-slate-50 transition-all shadow-sm active:scale-90 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {leftContent && (
          <div className="flex-1">
            {leftContent}
          </div>
        )}
        
        {onNext && (
          <button
            onClick={onNext}
            disabled={disabled || loading}
            className={cn(
              "flex-1 h-12 rounded-[18px] flex items-center justify-center gap-2 font-black text-[15px] transition-all active:scale-[0.98] h-14",
              (disabled || loading)
                ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60" 
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-200"
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                Memproses...
              </span>
            ) : (
              <>
                <span>{nextLabel}</span>
                {nextIcon}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
