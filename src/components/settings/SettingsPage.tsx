import { useState } from 'react';
import { MITRA_LEVELS, MitraLevel } from '@/types';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import {
  LogOut, Loader2, Check,
  TrendingUp, ChevronRight, Rocket, MapPin,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { StoreSettingsCard } from '@/components/settings/StoreSettingsCard';

// Urutan level dari terendah ke tertinggi (sesuai types/index.ts)
const LEVEL_ORDER: MitraLevel[] = ['reseller', 'agen', 'agen_plus', 'sap', 'se'];

const NEXT_LEVEL_LABEL: Record<string, string> = {
  reseller: 'Agen',
  agen: 'Agen Plus',
  agen_plus: 'Spesial Agen Plus',
  sap: 'Special Entrepreneur',
  se: '—',
};

// Margin per item per level (selisih harga jual - modal)
const LEVEL_MARGIN: Record<string, number> = {
  reseller: 33_000,
  agen: 52_000,
  agen_plus: 70_000,
  sap: 80_000,
  se: 100_000,
};

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, mitraLevel, updateMitraLevel } = useProfile();

  const [loggingOut, setLoggingOut] = useState(false);
  const [savingLevel, setSavingLevel] = useState(false);

  // Pastikan mitraLevel valid, fallback ke 'reseller'
  const safeMitraLevel: MitraLevel = (MITRA_LEVELS[mitraLevel as MitraLevel] ? mitraLevel as MitraLevel : 'reseller');
  const currentMitra = MITRA_LEVELS[safeMitraLevel];
  const currentLevelIdx = LEVEL_ORDER.indexOf(safeMitraLevel);
  const progressPct = Math.round(((currentLevelIdx + 1) / LEVEL_ORDER.length) * 100);
  const levelInitials = safeMitraLevel === 'agen_plus' ? 'AP' : safeMitraLevel === 'sap' ? 'SAP' : safeMitraLevel.toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await signOut(); toast.success('Berhasil keluar'); }
    catch { toast.error('Gagal keluar'); }
    finally { setLoggingOut(false); }
  };

  const handleMitraLevelChange = async (level: MitraLevel) => {
    setSavingLevel(true);
    try { await updateMitraLevel(level); toast.success(`Level diubah ke ${MITRA_LEVELS[level].label}`); }
    catch { toast.error('Gagal mengubah level mitra'); }
    finally { setSavingLevel(false); }
  };

  return (
    <div className="min-h-screen bg-background pb-8">

      {/* ─── HEADER ─── */}
      <header className="relative pt-12 pb-8 px-5 bg-card rounded-b-[2.5rem] shadow-sm mb-5">
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-1.5 text-slate-400">
            Dashboard Pencapaian
          </span>
          <h1 className="text-2xl font-extrabold mb-6 leading-tight text-slate-900">Halo, Wirausahawan!</h1>

          {/* Level card */}
          <div className="w-full bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#059669] rounded-t-[2rem]" />

            <div className="w-20 h-20 bg-[#059669]/10 rounded-full flex items-center justify-center mt-2 mb-4 ring-4 ring-white shadow-lg">
              <span className="text-[#009624] font-black text-3xl tracking-tighter">{levelInitials}</span>
            </div>

            <div className="bg-[#059669] text-white px-4 py-1.5 rounded-full text-xs font-black shadow-md shadow-green-500/30 flex items-center gap-1.5 mb-1">
              <Check className="h-3.5 w-3.5" />
              {currentMitra.label.toUpperCase()}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status Kemitraan</span>


          </div>
        </div>
      </header>

      <main className="px-4 space-y-4">



        {/* ─── LINK TOKO ─── */}
        <StoreSettingsCard />

        {/* ─── POTENSI PROFIT (DARK) ─── */}
        <section className="bg-[#1A1F2C] rounded-[2rem] p-5 overflow-hidden relative shadow-2xl shadow-slate-900/10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#059669] opacity-5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#252B3B] flex items-center justify-center border border-white/10">
              <TrendingUp className="h-5 w-5 text-[#059669]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Potensi Profit</h2>
              <p className="text-xs text-slate-400 font-medium">Bandingkan margin & keuntungan</p>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {/* Status Sekarang */}
            <div className="relative bg-[#252B3B] rounded-2xl p-4 border border-white/5 overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-1 bg-[#059669]" />
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="bg-[#059669] text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest mb-2 inline-block">
                    Status Sekarang
                  </span>
                  <p className="text-xs text-slate-400 mb-0.5">Keuntungan per Item</p>
                  <h3 className="text-2xl font-black text-white">
                    {formatCurrency(LEVEL_MARGIN[safeMitraLevel] ?? 0)}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#059669]/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-[#059669]" />
                </div>
              </div>
              <div className="mt-2 pt-2.5 border-t border-white/10">
                <span className="text-xs font-bold text-[#059669]">Margin {currentMitra.label}</span>
              </div>
            </div>



            {/* Level selector */}
            <div className="space-y-2">
              {LEVEL_ORDER.map(lv => {
                const lvInfo = MITRA_LEVELS[lv];
                if (!lvInfo) return null;
                const isActive = safeMitraLevel === lv;
                return (
                  <button
                    key={lv}
                    onClick={() => handleMitraLevelChange(lv)}
                    disabled={savingLevel}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all',
                      isActive
                        ? 'border-[#059669]/50 bg-[#059669]/10 text-white'
                        : 'border-white/5 bg-[#252B3B] text-slate-400 hover:border-white/10'
                    )}
                  >
                    <div className="text-left">
                      <p className="font-black text-sm">{lvInfo.label}</p>
                      <p className="text-[10px] opacity-60">Modal {formatShortCurrency(lvInfo.buyPricePerBottle)}/btl</p>
                    </div>
                    {isActive
                      ? <span className="text-[9px] font-black bg-[#059669] text-white px-2 py-0.5 rounded-full">AKTIF</span>
                      : savingLevel
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                        : <ChevronRight className="h-4 w-4 text-slate-600" />}
                  </button>
                );
              })}
            </div>


          </div>
        </section>

        {/* ─── PROFIL & LOGOUT (DARK) ─── */}
        <section className="bg-[#1A1F2C] rounded-[2rem] p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center border-2 border-[#059669] shadow-sm overflow-hidden shrink-0">
              <span className="text-2xl font-black text-slate-300">
                {user?.email?.slice(0, 1).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm">{user?.email}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-[#059669]" />
                <p className="text-xs text-slate-400 font-medium">{profile?.location || 'Malang, Indonesia'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full group flex items-center justify-between bg-[#252B3B] hover:bg-slate-800 p-4 rounded-2xl transition-colors border border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                <LogOut className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-red-400 text-sm">
                {loggingOut ? 'Keluar...' : 'Keluar Aplikasi'}
              </span>
            </div>
            {loggingOut
              ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              : <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform" />}
          </button>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="text-center py-6">
          <p className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase">Rekapan Mitra</p>
          <div className="flex justify-center items-center gap-2 mt-2 opacity-60">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Version 1.0.3</span>
            <span className="w-1 h-1 bg-slate-400 rounded-full" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Made in Malang 🇮🇩</span>
          </div>
        </footer>

      </main>
    </div>
  );
}
