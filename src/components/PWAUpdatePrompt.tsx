import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
  });

  useEffect(() => {
    if (!needRefresh) return;

    toast.custom((id) => (
      <div className={cn(
        "bg-emerald-600 text-white flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl shadow-2xl border border-emerald-500/50 w-full max-w-md mx-auto animate-in fade-in slide-in-from-top-4 duration-300"
      )}>
        <div className="flex-1 flex flex-col gap-0.5 text-center sm:text-left">
          <p className="font-extrabold text-sm tracking-tight leading-tight">Versi baru tersedia!</p>
          <p className="text-[11px] font-medium text-emerald-50/90 leading-tight">Optimasi performa & fitur terbaru siap digunakan.</p>
        </div>
        <button
          onClick={() => {
            updateServiceWorker(true);
            toast.dismiss(id);
          }}
          className="bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs font-black shadow-sm active:scale-95 transition-all w-full sm:w-auto shrink-0 uppercase tracking-wider"
        >
          Update Sekarang
        </button>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
}
