import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { id: 1, label: 'Pelanggan' },
  { id: 2, label: 'Produk' },
  { id: 3, label: 'Konfirmasi' },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full px-10 py-5 bg-white border-b border-slate-100 shadow-sm relative z-20">
      <div className="relative max-w-xs mx-auto flex justify-between">
        {/* Background Connection Line */}
        <div className="absolute top-4 left-0 w-full h-[3px] bg-slate-100 -z-0 rounded-full overflow-hidden">
          {/* Active Progress Line */}
          <div 
            className="h-full bg-[#059669] transition-all duration-500 ease-in-out"
            style={{ 
              width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
              marginLeft: '0%'
            }}
          />
        </div>

        {STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isActive = currentStep === step.id;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                isDone 
                  ? "bg-[#059669] text-white" 
                  : isActive 
                    ? "bg-[#059669] text-white ring-[5px] ring-emerald-50 scale-110" 
                    : "bg-white border-[3px] border-slate-100 text-slate-300"
              )}>
                {isDone ? (
                  <Check className="w-4 h-4 text-white stroke-[3px]" />
                ) : (
                  <span className="font-black text-sm leading-none">
                    {step.id}
                  </span>
                )}
              </div>
              <span className={cn(
                "mt-3 text-[10px] font-black uppercase tracking-[1.2px] transition-colors duration-300",
                isActive || isDone ? "text-[#059669]" : "text-slate-300"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
