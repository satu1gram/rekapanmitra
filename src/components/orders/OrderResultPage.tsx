import { CheckCircle, XCircle, Home, RefreshCw } from 'lucide-react';
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
  orderItems?: { name: string; quantity: number; price: number; subtotal: number }[];
}

interface OrderResultPageProps {
  result: OrderResult;
  onAddNew: () => void;
  onGoHome: () => void;
}

const WA_ICON = (
  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.05 20.15Z" />
  </svg>
);

function buildWAText(result: OrderResult): string {
  const lines = [
    `*STRUK PESANAN - REKAPAN MITRA*`,
    `Pelanggan: ${result.customerName || '-'}`,
    `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    `--------------------------------`,
  ];
  if (result.orderItems && result.orderItems.length > 0) {
    result.orderItems.forEach(item => {
      lines.push(`${item.name}`);
      lines.push(`${item.quantity}x @ ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}`);
    });
  }
  lines.push(`--------------------------------`);
  lines.push(`*TOTAL BAYAR : ${formatCurrency(result.totalPrice || 0)}*`);
  lines.push(``);
  lines.push(`*INFO PEMBAYARAN*`);
  lines.push(`Silakan transfer a.n *Nur Aida Mardhatila*:`);
  lines.push(`Bank BSI`);
  lines.push(`*7109617096*`);
  lines.push(`Bank Muamalat`);
  lines.push(`*7110079767*`);
  lines.push(`Bisa juga via Flip:`);
  lines.push(`flip.id/me/nuraidm1`);
  lines.push(`Minta QRIS jika diperlukan.`);
  lines.push(``);
  lines.push(`Terima kasih telah berbelanja, Berkah Berlimpah 🙏`);
  return lines.join('\n');
}

export function OrderResultPage({ result, onAddNew, onGoHome }: OrderResultPageProps) {
  const handleSendWA = () => {
    const text = buildWAText(result);
    navigator.clipboard.writeText(text).then(
      () => toast.success('Pesan struk disalin! Buka WhatsApp dan paste ke chat pelanggan.', { duration: 4000 }),
      () => toast.error('Gagal menyalin. Coba lagi.')
    );
  };

  if (result.success) {
    return (
      <div className="flex flex-col min-h-screen bg-card text-foreground">
        <main className="flex-1 flex flex-col items-center px-5 pt-10 pb-4 text-center space-y-5">
          <div className="animate-in zoom-in duration-500">
            <div className="w-28 h-28 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="h-16 w-16 text-emerald-600" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">Order Berhasil Disimpan!</h1>
            <p className="text-slate-500 mt-1">Data order aman tercatat di sistem.</p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm text-left space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-dashed border-slate-200">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Pelanggan</p>
                <p className="text-base font-bold text-slate-900">{result.customerName || 'Pelanggan Baru'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total</p>
                <p className="text-xl font-black text-slate-900">{formatCurrency(result.totalPrice || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide flex items-center gap-1">Untung</p>
                <p className="text-xl font-black text-emerald-600">{formatCurrency(result.estimatedProfit || 0)}</p>
              </div>
            </div>
          </div>

          {/* WA Card */}
          <div className="w-full bg-green-50 border-2 border-green-100 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col items-center space-y-1">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-1">
                <svg className="w-7 h-7 fill-[#25D366]" viewBox="0 0 24 24">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.05 20.15Z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-800">Kirim Struk ke Pelanggan?</h2>
            </div>
            <button
              onClick={handleSendWA}
              style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
              className="w-full h-14 text-white rounded-xl shadow-lg shadow-green-200 flex items-center justify-center gap-2.5 active:scale-95 transition-all"
            >
              <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.05 20.15Z" />
              </svg>
              <span className="text-lg font-bold">Kirim via WhatsApp</span>
            </button>
          </div>
        </main>

        <div className="sticky bottom-[5.5rem] mt-auto p-5 pb-9 bg-card/95 backdrop-blur-sm space-y-3 border-t border-slate-200 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={onAddNew}
            className="w-full h-14 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white rounded-xl shadow-lg flex items-center justify-center gap-2.5 active:scale-95 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" />
            </svg>
            <span className="text-lg font-bold">Buat Order Baru</span>
          </button>
          <button
            onClick={onGoHome}
            className="w-full h-14 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100 rounded-xl flex items-center justify-center gap-2.5 active:scale-95 transition-all"
          >
            <Home className="h-5 w-5" />
            <span className="text-lg font-bold">Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    );
  }

  // Error screen
  return (
    <div className="flex flex-col min-h-screen bg-card">
      <main className="flex-1 px-6 flex flex-col items-center justify-center text-center space-y-8 py-12">
        <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center">
          <XCircle className="h-20 w-20 text-red-500" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900">Order Gagal Disimpan</h1>
          <p className="text-slate-500 font-medium">{result.errorMessage || 'Terjadi kesalahan. Silakan coba lagi.'}</p>
        </div>
      </main>
      <div className="sticky bottom-[5.5rem] mt-auto p-5 pb-9 space-y-3 bg-card/95 backdrop-blur-sm border-t border-slate-200 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={onAddNew} className="w-full h-14 bg-red-600 text-white rounded-xl shadow-lg shadow-red-200 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all font-bold text-lg">
          <RefreshCw className="h-5 w-5" /> Coba Lagi
        </button>
        <button onClick={onGoHome} className="w-full h-14 bg-white border-2 border-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all font-bold text-lg">
          <Home className="h-5 w-5" /> Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
