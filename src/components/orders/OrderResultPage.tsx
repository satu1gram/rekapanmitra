import { CheckCircle, XCircle, ShoppingCart, Home, Copy, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface OrderResult {
  success: boolean;
  totalPrice?: number;
  estimatedProfit?: number;
  customerName?: string;
  customerPhone?: string;
  errorMessage?: string;
}

interface OrderResultPageProps {
  result: OrderResult;
  onAddNew: () => void;
  onGoHome: () => void;
}

export function OrderResultPage({ result, onAddNew, onGoHome }: OrderResultPageProps) {
  const handleCopyWA = () => {
    if (!result.customerName) return;
    const text = [
      `✅ *Konfirmasi Order*`,
      ``,
      `👤 *Customer:* ${result.customerName}`,
      result.customerPhone ? `📱 *WA:* ${result.customerPhone}` : '',
      ``,
      `💰 *Total:* ${formatCurrency(result.totalPrice || 0)}`,
      `📈 *Estimasi Profit:* ${formatCurrency(result.estimatedProfit || 0)}`,
      ``,
      `Terima kasih! 🙏`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Info order disalin ke clipboard!');
    }).catch(() => {
      toast.error('Gagal menyalin');
    });
  };

  if (result.success) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        {/* Main content */}
        <main className="flex-1 px-6 flex flex-col items-center justify-center text-center space-y-8 py-12">
          {/* Animated pulse circle */}
          <div className="relative">
            <div
              className="w-40 h-40 bg-emerald-50 rounded-full flex items-center justify-center"
              style={{ animation: 'subtle-pulse 2s infinite' }}
            >
              <CheckCircle
                className="h-24 w-24 text-emerald-600"
                strokeWidth={1.5}
                fill="currentColor"
                style={{ color: '#059669', fill: '#d1fae5', stroke: '#059669' }}
              />
            </div>
            <style>{`
              @keyframes subtle-pulse {
                0% { box-shadow: 0 0 0 0 rgba(5,150,105,0.35); }
                70% { box-shadow: 0 0 0 24px rgba(5,150,105,0); }
                100% { box-shadow: 0 0 0 0 rgba(5,150,105,0); }
              }
            `}</style>
          </div>

          <h1 className="text-4xl font-black text-slate-900 leading-tight">
            Order Berhasil<br />Disimpan!
          </h1>

          {/* Summary card */}
          <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-8 space-y-5 shadow-sm">
            <div className="space-y-1">
              <p className="text-base font-bold text-slate-400 uppercase tracking-wide">Total Order</p>
              <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(result.totalPrice || 0)}
              </p>
            </div>
            <div className="h-px w-full bg-slate-200" />
            <div className="space-y-1">
              <p className="text-base font-bold text-slate-400 uppercase tracking-wide">Estimasi Profit</p>
              <p className="text-4xl font-extrabold text-emerald-600 tracking-tight">
                {formatCurrency(result.estimatedProfit || 0)}
              </p>
            </div>
          </div>

          {/* Copy WA button */}
          <button
            onClick={handleCopyWA}
            className="w-full bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 rounded-2xl p-4 flex items-center justify-center gap-2 transition-colors"
          >
            <Copy className="h-6 w-6" />
            <span className="text-lg font-bold">Salin info order untuk WhatsApp</span>
          </button>
        </main>

        {/* Bottom action buttons */}
        <div className="p-6 pb-10 space-y-4 bg-white border-t border-slate-50">
          <button
            onClick={onAddNew}
            className="w-full h-20 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.98] text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center gap-3 transition-all"
          >
            <ShoppingCart className="h-7 w-7" />
            <span className="text-2xl font-bold tracking-tight">Tambah Order Baru</span>
          </button>
          <button
            onClick={onGoHome}
            className="w-full h-20 bg-white border-4 border-emerald-600 text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 active:scale-[0.98] rounded-full flex items-center justify-center gap-3 transition-all"
          >
            <Home className="h-7 w-7" />
            <span className="text-2xl font-bold tracking-tight">Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    );
  }

  // Error screen
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 px-6 flex flex-col items-center justify-center text-center space-y-8 py-12">
        {/* Error icon */}
        <div className="w-40 h-40 bg-red-50 rounded-full flex items-center justify-center"
          style={{ animation: 'error-pulse 2s infinite' }}>
          <XCircle
            className="h-24 w-24"
            strokeWidth={1.5}
            style={{ color: '#dc2626', fill: '#fee2e2', stroke: '#dc2626' }}
          />
          <style>{`
            @keyframes error-pulse {
              0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.3); }
              70% { box-shadow: 0 0 0 24px rgba(220,38,38,0); }
              100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
            }
          `}</style>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-900 leading-tight">
            Order Gagal<br />Disimpan
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            {result.errorMessage || 'Terjadi kesalahan. Silakan coba lagi.'}
          </p>
        </div>

        {/* Error detail card */}
        <div className="w-full bg-red-50 border-2 border-red-100 rounded-3xl p-6 space-y-2 text-left">
          <p className="text-red-700 font-bold text-sm uppercase tracking-wide">Penyebab Mungkin:</p>
          <ul className="space-y-2 text-slate-600 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold mt-0.5">•</span>
              <span>Koneksi internet bermasalah</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold mt-0.5">•</span>
              <span>Stok tidak mencukupi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold mt-0.5">•</span>
              <span>Data pelanggan tidak lengkap</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold mt-0.5">•</span>
              <span>Sesi login sudah berakhir</span>
            </li>
          </ul>
        </div>
      </main>

      <div className="p-6 pb-10 space-y-4 bg-white border-t border-slate-50">
        <button
          onClick={onAddNew}
          className="w-full h-20 bg-red-600 hover:bg-red-700 active:bg-red-800 active:scale-[0.98] text-white rounded-full shadow-lg shadow-red-200 flex items-center justify-center gap-3 transition-all"
        >
          <RefreshCw className="h-7 w-7" />
          <span className="text-2xl font-bold tracking-tight">Coba Lagi</span>
        </button>
        <button
          onClick={onGoHome}
          className="w-full h-20 bg-white border-4 border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 active:scale-[0.98] rounded-full flex items-center justify-center gap-3 transition-all"
        >
          <Home className="h-7 w-7" />
          <span className="text-2xl font-bold tracking-tight">Kembali ke Beranda</span>
        </button>
      </div>
    </div>
  );
}
