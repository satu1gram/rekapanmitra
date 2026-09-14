import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { APP_VERSION } from "@/lib/appVersion";

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
          <p className="text-[11px] font-medium text-emerald-50/90 leading-tight">Versi aktif: {APP_VERSION}. Tekan update untuk memuat versi terbaru.</p>
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

  // Floating button hanya tampil saat update tersedia, dan diletakkan di atas
  // navbar bawah agar tidak menutupi navigasi.
  if (!needRefresh) return null;

  return (
    <button
      type="button"
      onClick={() => {
        updateServiceWorker(true);
      }}
      title="Muat versi terbaru aplikasi"
      className="fixed bottom-20 right-4 z-[140] flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-[10px] font-black text-white shadow-lg transition-all hover:bg-emerald-700 active:scale-95"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Update {APP_VERSION}
    </button>
  );
}
