import { useState } from 'react';
import { MITRA_LEVELS, MitraLevel } from '@/types';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import {
  LogOut, Loader2, Check, Shield, Info, MapPin, ChevronRight, Store, TrendingUp, User, Phone, Edit3
} from 'lucide-react';
import { useIndonesianRegions } from '@/hooks/useIndonesianRegions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { StoreSettingsCard } from '@/components/settings/StoreSettingsCard';

// Urutan level dari terendah ke tertinggi (sesuai types/index.ts)
const LEVEL_ORDER: MitraLevel[] = ['reseller', 'agen', 'agen_plus', 'sap', 'se', 'custom'];

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
  const { profile, mitraLevel, customBuyPrice, updateMitraLevel, updateProfile } = useProfile();

  const [loggingOut, setLoggingOut] = useState(false);
  const [savingLevel, setSavingLevel] = useState(false);
  
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  
  const [customNameInput, setCustomNameInput] = useState('');
  const [customPriceInput, setCustomPriceInput] = useState('');

  // Profile Edit State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [editCity, setEditCity] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [formErrors, setFormErrors] = useState<{name?: string, phone?: string, province?: string, city?: string}>({});

  const { provinces, loadingProvinces, cities, loadingCities, fetchCities, setCities } = useIndonesianRegions();

  // Pastikan mitraLevel valid, fallback ke 'reseller'
  const safeMitraLevel: MitraLevel = (MITRA_LEVELS[mitraLevel as MitraLevel] ? mitraLevel as MitraLevel : 'reseller');
  const currentMitra = MITRA_LEVELS[safeMitraLevel];

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await signOut(); toast.success('Berhasil keluar'); }
    catch { toast.error('Gagal keluar'); }
    finally { setLoggingOut(false); }
  };

  const handleMitraLevelChange = async (level: MitraLevel, customData?: { customLevelName: string, customBuyPrice: number }) => {
    if (level === 'custom' && !customData) {
      setCustomNameInput(profile?.custom_level_name || '');
      setCustomPriceInput(customBuyPrice ? String(customBuyPrice) : '');
      setShowLevelModal(false);
      setShowCustomModal(true);
      return;
    }

    setSavingLevel(true);
    try { 
      await updateMitraLevel(level, customData); 
      setShowCustomModal(false);
      setShowLevelModal(false);
      toast.success(level === 'custom' ? 'Level kustom berhasil disimpan' : `Level diubah ke ${MITRA_LEVELS[level].label}`); 
    }
    catch { toast.error('Gagal mengubah level mitra'); }
    finally { setSavingLevel(false); }
  };

  const openProfileModal = () => {
    setEditName(profile?.name || '');
    setEditPhone(profile?.phone || '');
    
    // Attempt to split location if formatted as "City, Province"
    const locParts = (profile?.location || '').split(', ');
    if (locParts.length === 2) {
      setEditCity(locParts[0]);
      setEditProvince(locParts[1]);
      const p = provinces.find(x => x.name === locParts[1]);
      if (p) fetchCities(p.id);
    } else {
      setEditCity('');
      setEditProvince('');
    }
    setShowProfileModal(true);
    setFormErrors({});
  };

  const handleUpdateProfile = async () => {
    const errors: {name?: string, phone?: string, province?: string, city?: string} = {};
    if (!editName.trim()) errors.name = 'Nama wajib diisi';
    if (!editProvince.trim()) errors.province = 'Provinsi wajib dipilih';
    if (!editCity.trim()) errors.city = 'Kota/Kab wajib dipilih';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    setSavingProfile(true);
    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        location: `${editCity.trim()}, ${editProvince.trim()}`
      });
      toast.success('Profil berhasil diperbarui');
      setShowProfileModal(false);
    } catch {
      toast.error('Gagal memperbarui profil');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* ─── HEADER PROFIL KOMPAK ─── */}
      <header className="pt-10 pb-6 px-5 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center shadow-md shrink-0">
            <span className="text-2xl font-black text-white">
              {user?.email?.slice(0, 1).toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-slate-800 text-base truncate">{user?.email}</h2>
            <div className="flex flex-col gap-1.5 mt-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-extrabold tracking-widest uppercase text-slate-400">Level</span>
                <div className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black inline-flex items-center gap-1 border border-emerald-200">
                  <Shield className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[140px]">
                    {safeMitraLevel === 'custom' && profile?.custom_level_name ? profile.custom_level_name.toUpperCase() : currentMitra.label.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 opacity-60">
                <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                <p className="text-[10px] font-bold tracking-wide uppercase text-slate-500 truncate">{profile?.location || 'Lokasi Belum Diatur'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 space-y-4">

        {/* ─── STATUS KEMITRAAN & KEUNTUNGAN RINGKAS ─── */}
        <section className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Detail Kemitraan</h3>
              <p className="text-[11px] text-slate-500 font-medium">Margin saat ini menentukan estimasi profit</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Keuntungan / Item</p>
              <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                {safeMitraLevel === 'custom' ? 'Sesuai Input' : formatCurrency(LEVEL_MARGIN[safeMitraLevel] ?? 0)}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#059669]" />
            </div>
          </div>

          <button 
            onClick={() => setShowLevelModal(true)}
            className="w-full py-3 bg-[#059669]/10 text-[#059669] font-bold text-xs rounded-xl hover:bg-[#059669]/20 transition-colors"
          >
            Ubah Level Mitra
          </button>
        </section>

        {/* ─── LINK TOKO ─── */}
        <StoreSettingsCard />

        {/* ─── PENGATURAN LAINNYA ─── */}
        <section className="bg-white rounded-[2rem] p-2 shadow-sm border border-slate-100 flex flex-col gap-1">
          <button
            onClick={openProfileModal}
            className="w-full flex items-center justify-between px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Edit3 className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Ubah Profil</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Perbarui nama, kontak, dan area pengiriman</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
          
          <div className="h-[1px] bg-slate-100 mx-4" />

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-between px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <LogOut className="h-3.5 w-3.5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{loggingOut ? 'Memproses...' : 'Keluar Aplikasi'}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Akhiri sesi Anda di perangkat ini</p>
              </div>
            </div>
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="text-center py-6 opacity-60">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5">Version 2.6.0</p>
          <p className="text-[10px] font-bold text-slate-400">Dikembangkan oleh <span className="text-[#059669]">Satu Lab Indonesia</span></p>
        </footer>

      </main>

      {/* ─── MODAL PILIH LEVEL ─── */}
      {showLevelModal && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLevelModal(false)} />
          <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md p-6 relative z-10 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in duration-300 max-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-black text-slate-800">Ubah Level Mitra</h3>
              <button onClick={() => setShowLevelModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl leading-none">&times;</button>
            </div>
            
            <div className="bg-blue-50 text-blue-800 rounded-xl p-3 mb-5 flex items-start gap-2.5">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
              <p className="text-[11px] leading-snug font-medium">
                Mengubah level akan menyesuaikan hitungan <strong>Harga Modal</strong> Anda di sistem. Pastikan level sesuai dengan status kemitraan asli Anda agar laporan profit akurat.
              </p>
            </div>

            <div className="space-y-2.5">
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
                      'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
                      isActive
                        ? 'border-[#059669] bg-green-50 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    )}
                  >
                    <div>
                      <p className={cn("font-black text-sm", isActive ? "text-[#059669]" : "text-slate-700")}>
                        {isActive && lv === 'custom' && profile?.custom_level_name ? profile.custom_level_name : lvInfo.label}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                        {lv === 'custom' 
                          ? (isActive && customBuyPrice != null ? `Modal ${formatShortCurrency(customBuyPrice)}/btl` : 'Tentukan harga modal sendiri')
                          : `Modal ${formatShortCurrency(lvInfo.buyPricePerBottle)}/btl`
                        }
                      </p>
                    </div>
                    {isActive && <Check className="h-5 w-5 text-[#059669]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL LEVEL KUSTOM ─── */}
      {showCustomModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCustomModal(false)} />
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-black text-slate-800 mb-1">Set Level Kustom</h3>
            <p className="text-[11px] text-slate-500 font-medium mb-5">Atur nama dan harga modal untuk level Anda sendiri.</p>

            <div className="space-y-4">
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Nama Level</Label>
                <Input 
                  value={customNameInput} 
                  onChange={e => setCustomNameInput(e.target.value)} 
                  placeholder="Cth: Distributor VIP" 
                  className="rounded-xl h-11 border-slate-200 focus:border-[#059669] focus:ring-[#059669]"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Harga Modal per Botol (Rp)</Label>
                <Input 
                  type="number"
                  value={customPriceInput} 
                  onChange={e => setCustomPriceInput(e.target.value)} 
                  placeholder="Cth: 175000" 
                  className="rounded-xl h-11 border-slate-200 focus:border-[#059669] focus:ring-[#059669]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowCustomModal(false)}
                className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                disabled={savingLevel || !customNameInput.trim() || !customPriceInput}
                onClick={() => handleMitraLevelChange('custom', { customLevelName: customNameInput, customBuyPrice: Number(customPriceInput) })}
                className="flex-1 py-3 text-xs font-black text-white bg-[#059669] hover:bg-[#007b55] rounded-xl transition-colors disabled:opacity-50 flex justify-center"
              >
                {savingLevel ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Kustom'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL UBAH PROFIL ─── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProfileModal(false)} />
          <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md p-6 relative z-10 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-black text-slate-800">Ubah Profil</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl leading-none">&times;</button>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mb-5">Perbarui data diri dan area demografi Anda.</p>

            <div className="space-y-4">
              <div>
                <Label className={cn("text-[10px] font-bold uppercase tracking-widest mb-1.5 block", formErrors.name ? "text-red-500" : "text-slate-500")}>Nama Lengkap</Label>
                <div className="relative">
                  <User className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4", formErrors.name ? "text-red-400" : "text-slate-400")} />
                  <Input 
                    value={editName} 
                    onChange={e => { setEditName(e.target.value); setFormErrors(p => ({...p, name: undefined})) }} 
                    placeholder="Nama Lengkap" 
                    className={cn("pl-9 rounded-xl h-11 focus:ring-[#059669]", formErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-[#059669]")}
                  />
                </div>
                {formErrors.name && <p className="text-[10px] font-bold text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <Label className={cn("text-[10px] font-bold uppercase tracking-widest mb-1.5 block", formErrors.phone ? "text-red-500" : "text-slate-500")}>Nomor WhatsApp</Label>
                <div className="relative">
                  <Phone className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4", formErrors.phone ? "text-red-400" : "text-slate-400")} />
                  <Input 
                    type="tel"
                    value={editPhone} 
                    onChange={e => { setEditPhone(e.target.value); setFormErrors(p => ({...p, phone: undefined})) }} 
                    placeholder="08..." 
                    className={cn("pl-9 rounded-xl h-11 focus:ring-[#059669]", formErrors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-[#059669]")}
                  />
                </div>
                {formErrors.phone && <p className="text-[10px] font-bold text-red-500 mt-1">{formErrors.phone}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={cn("text-[10px] font-bold uppercase tracking-widest mb-1.5 block", formErrors.province ? "text-red-500" : "text-slate-500")}>Provinsi</Label>
                  <div className="relative">
                    <MapPin className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10", formErrors.province ? "text-red-400" : "text-slate-400")} />
                    <Select
                      value={editProvince}
                      onValueChange={(val) => {
                        setEditProvince(val);
                        setEditCity('');
                        setFormErrors(p => ({...p, province: undefined, city: undefined}));
                        if (!val) { setCities([]); return; }
                        const p = provinces.find(x => x.name === val);
                        if (p) fetchCities(p.id);
                      }}
                      disabled={loadingProvinces}
                    >
                      <SelectTrigger className={cn("w-full pl-9 pr-3 h-11 rounded-xl text-sm outline-none", formErrors.province ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:border-[#059669] focus:ring-1 focus:ring-[#059669]")}>
                        <SelectValue placeholder="Pilih Provinsi" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map(p => (
                          <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formErrors.province && <p className="text-[10px] font-bold text-red-500 mt-1">{formErrors.province}</p>}
                </div>
                <div>
                  <Label className={cn("text-[10px] font-bold uppercase tracking-widest mb-1.5 block", formErrors.city ? "text-red-500" : "text-slate-500")}>Kota/Kabupaten</Label>
                  <div className="relative">
                    <MapPin className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10", formErrors.city ? "text-red-400" : "text-slate-400")} />
                    <Select
                      value={editCity}
                      onValueChange={val => { setEditCity(val); setFormErrors(p => ({...p, city: undefined})); }}
                      disabled={!editProvince || loadingCities || cities.length === 0}
                    >
                      <SelectTrigger className={cn("w-full pl-9 pr-3 h-11 rounded-xl text-sm outline-none disabled:opacity-50", formErrors.city ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:border-[#059669] focus:ring-1 focus:ring-[#059669]")}>
                        <SelectValue placeholder="Pilih Kota/Kab" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formErrors.city && <p className="text-[10px] font-bold text-red-500 mt-1">{formErrors.city}</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-2">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="flex-1 py-3.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                disabled={savingProfile || !editName.trim() || !editProvince || !editCity}
                onClick={handleUpdateProfile}
                className="flex-1 py-3.5 text-xs font-black text-white bg-[#059669] hover:bg-[#007b55] rounded-xl transition-colors disabled:opacity-50 flex justify-center"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Profil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
