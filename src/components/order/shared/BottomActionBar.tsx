import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomActionBarProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextIcon?: React.ReactNode;
  disabled?: boolean;
  leftContent?: React.ReactNode;
}

export function BottomActionBar({ 
  onBack, 
  onNext, 
  nextLabel = 'Lanjut', 
  nextIcon = <ArrowRight className="w-4 h-4" />,
  disabled = false,
  leftContent
}: BottomActionBarProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 py-4 z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        {leftContent ? (
          <div className="flex-1">
            {leftContent}
          </div>
        ) : (
          onBack && (
            <button
              onClick={onBack}
              className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 active:bg-slate-50 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )
        )}
        
        {onNext && (
          <button
            onClick={onNext}
            disabled={disabled}
            className={cn(
              "flex-1 h-12 rounded-[18px] flex items-center justify-center gap-2 font-bold text-[15px] transition-all active:scale-[0.98]",
              disabled 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                : "bg-[#1E293B] text-white hover:bg-[#059669] shadow-lg shadow-slate-200"
            )}
          >
            <span>{nextLabel}</span>
            {nextIcon}
          </button>
        )}
      </div>
    </div>
  );
}
