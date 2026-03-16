import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { id: 1, label: 'Pilih Produk' },
  { id: 2, label: 'Pelanggan' },
  { id: 3, label: 'Konfirmasi' },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="bg-white border-b border-slate-100 px-4 py-2.5">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, idx) => {
            const isDone = currentStep > s.id;
            const isActive = currentStep === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex items-center flex-1">
                  <div className={cn(
                    'h-1.5 flex-1 rounded-full transition-all duration-300', 
                    isDone || isActive ? 'bg-[#059669]' : 'bg-slate-100'
                  )} />
                </div>
                {idx < 2 && (
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full mx-1', 
                    isDone ? 'bg-[#059669]' : 'bg-slate-200'
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-1">
          {STEPS.map((s) => (
            <span key={s.id} className={cn(
              'text-[10px] font-black uppercase tracking-wide', 
              currentStep === s.id ? 'text-[#059669]' : currentStep > s.id ? 'text-slate-400' : 'text-slate-300'
            )}>
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
