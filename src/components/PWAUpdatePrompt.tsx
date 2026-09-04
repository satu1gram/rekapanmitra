import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
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
  const [checking, setChecking] = useState(false);

  const checkForUpdate = async () => {
    setChecking(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        toast.info(`Versi ${APP_VERSION} sedang digunakan.`);
        return;
      }

      await registration.update();
      if (!registration.waiting) {
        toast.success(`Aplikasi sudah versi terbaru (${APP_VERSION}).`);
      }
    } catch {
      toast.error("Tidak dapat memeriksa pembaruan. Coba lagi nanti.");
    } finally {
      setChecking(false);
    }
  };

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

  return (
    <button
      type="button"
      onClick={checkForUpdate}
      disabled={checking}
      title="Periksa pembaruan aplikasi"
      className="fixed bottom-4 right-4 z-[140] flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 shadow-lg transition-all hover:border-emerald-200 hover:text-emerald-700 active:scale-95 disabled:cursor-wait disabled:opacity-60"
    >
      <RefreshCw className={cn("h-3.5 w-3.5", checking && "animate-spin")} />
      {checking ? "Memeriksa..." : `Update ${APP_VERSION}`}
    </button>
  );
}
