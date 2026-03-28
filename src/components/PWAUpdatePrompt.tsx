import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { useEffect } from "react";

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Cek update setiap 60 menit
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
  });

  useEffect(() => {
    if (!needRefresh) return;

    toast("Versi baru tersedia!", {
      description: "Klik Update untuk mendapatkan fitur terbaru.",
      duration: Infinity,
      action: {
        label: "Update Sekarang",
        onClick: () => updateServiceWorker(true),
      },
      onDismiss: () => {},
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
}
