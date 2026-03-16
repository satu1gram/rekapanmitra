import { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, MapPin, Save, Loader2, ShoppingBag, Store, Package, Check, X, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TierType } from '@/types';
import { useIndonesianRegions } from '@/hooks/useIndonesianRegions';
import type { Tables } from '@/integrations/supabase/types';

type Customer = Tables<'customers'>;

interface EditCustomerPageProps {
  customer: Customer;
  onBack: () => void;
  onSaved: (updated: Customer) => void;
}

type Status = 'konsumen' | 'mitra';

const MITRA_TIERS: { tier: TierType; label: string; desc: string; icon: React.ReactNode }[] = [
  { tier: 'reseller', label: 'Reseller', desc: 'Min. 3 Pcs', icon: <ShoppingBag className="h-5 w-5" /> },
  { tier: 'agen', label: 'Agen', desc: 'Min. 5 Pcs', icon: <Store className="h-5 w-5" /> },
  { tier: 'agen_plus', label: 'Agen Plus', desc: 'Min. 10 Pcs', icon: <Store className="h-5 w-5" /> },
  { tier: 'sap', label: 'Spesial Agen Plus', desc: 'Min. 40 Pcs', icon: <Package className="h-5 w-5" /> },
  { tier: 'se', label: 'Special Entrepreneur', desc: 'Min. 200 Pcs', icon: <Package className="h-5 w-5" /> },
];

function isMitraTier(tier: string): boolean {
  return ['reseller', 'agen', 'agen_plus', 'sap', 'se'].includes(tier);
}

export function EditCustomerPage({ customer, onBack, onSaved }: EditCustomerPageProps) {
  const { user } = useAuth();
  const [name, setName] = useState(customer.name || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [address, setAddress] = useState(customer.address || '');
  const [province, setProvince] = useState(customer.province || '');
  const [provinceName, setProvinceName] = useState('');
  const [city, setCity] = useState(customer.city || '');

  const [status, setStatus] = useState<Status>(customer.tier && isMitraTier(customer.tier) ? 'mitra' : 'konsumen');
  const [tier, setTier] = useState<TierType>(customer.tier as TierType || 'satuan');
  const [createdAt, setCreatedAt] = useState(
    customer.created_at 
      ? customer.created_at.split('T')[0] 
      : new Date().toISOString().split('T')[0]
  ); // YYYY-MM-DD for input type="date"
  const [saving, setSaving] = useState(false);

  const { provinces, loadingProvinces, cities, loadingCities, fetchCities, setCities } = useIndonesianRegions();

  // Initial load for cities if we already have a province
  // The API doesn't give us names for the IDs saved in DB easily without matching against the lists,
  // For simplicity, we can just save the string Name directly to DB instead of IDs.
  // Wait, let's check what we save. We save `province` and `city` which should be the names.
  // If we save names, we need to find the ID of the province to fetch its cities.
  useState(() => {
    // This will run once but we can't await inside useState. 
    // Handled in a separate useEffect below.
  });

  // Re-fetch cities when provinces are loaded if we have an existing province name
  useEffect(() => {
    if (provinces.length > 0 && province) {
      const p = provinces.find(x => x.name === province);
      if (p) fetchCities(p.id);
    }
  }, [provinces, province]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nama pelanggan wajib diisi');
      return;
    }
    if (!user) return;

    const isNew = !customer.id;
    const finalTier: TierType = status === 'konsumen' ? 'satuan' : tier;

    setSaving(true);
    try {
      const payload: any = {
        user_id: user.id,
        name: name?.trim() || '',
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        province: province || null,
        city: city || null,
        tier: finalTier,
        created_at: new Date(createdAt).toISOString(),
        updated_at: new Date().toISOString(),
      };

      let query = supabase.from('customers');
      
      if (isNew) {
        const { data, error } = await query
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        toast.success('Pelanggan berhasil ditambahkan');
        onSaved(data);
      } else {
        const { data, error } = await query
          .update(payload)
          .eq('id', customer.id)
          .select()
          .single();
        if (error) throw error;
        toast.success('Data pelanggan berhasil diperbarui');
        onSaved(data);
      }
    } catch (err: any) {
      toast.error('Gagal memperbarui: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Header - same pattern as StockPage */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-xl bg-muted border border-border text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">
              {!customer.id ? 'Tambah Pelanggan' : 'Ubah Pelanggan'}
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">
              {!customer.id ? 'Input data pelanggan baru' : 'Edit data & level mitra'}
            </p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="px-4 mt-3 space-y-3">
        {/* Form card - same rounded-2xl card pattern */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 space-y-5">
          <h3 className="text-lg font-bold text-foreground flex items-center">
            <span className="w-1.5 h-5 bg-primary rounded-full mr-2.5" />
            Data Pelanggan
          </h3>

          {/* Nama */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Nama Pelanggan</label>
            <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 border border-border">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="flex-1 text-sm font-bold text-foreground placeholder-muted-foreground/50 bg-transparent border-none focus:ring-0 p-0 outline-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">No. WhatsApp (Opsional)</label>
            <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 border border-border">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="08..."
                type="tel"
                className="flex-1 text-sm font-bold text-foreground placeholder-muted-foreground/50 bg-transparent border-none focus:ring-0 p-0 outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Alamat Lengkap</label>
            <div className="flex items-start gap-2 bg-muted/30 rounded-xl p-3 border border-border">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Nama jalan, nomor rumah, kota..."
                rows={2}
                className="flex-1 text-sm font-bold text-foreground placeholder-muted-foreground/50 bg-transparent border-none focus:ring-0 p-0 outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Provinsi */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Provinsi (Opsional)</label>
            <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 border border-border">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <select
                value={province}
                onChange={(e) => {
                  const val = e.target.value;
                  setProvince(val);
                  setCity(''); // reset city
                  if (!val) {
                    setCities([]);
                    return;
                  }
                  const p = provinces.find(x => x.name === val);
                  if (p) fetchCities(p.id);
                }}
                disabled={loadingProvinces}
                className="flex-1 text-sm font-bold text-foreground bg-transparent border-none focus:ring-0 p-0 outline-none disabled:opacity-50"
              >
                <option value="">Pilih Provinsi</option>
                {provinces.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kota/Kabupaten */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Kabupaten/Kota (Opsional)</label>
            <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 border border-border">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!province || loadingCities || cities.length === 0}
                className="flex-1 text-sm font-bold text-foreground bg-transparent border-none focus:ring-0 p-0 outline-none disabled:opacity-50"
              >
                <option value="">Pilih Kabupaten/Kota</option>
                {cities.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tanggal Bergabung */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Tanggal Bergabung</label>
            <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 border border-border">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="date"
                value={createdAt}
                onChange={e => setCreatedAt(e.target.value)}
                className="flex-1 text-sm font-bold text-foreground placeholder-muted-foreground/50 bg-transparent border-none focus:ring-0 p-0 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Status Pelanggan card */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 space-y-4">
          <h3 className="text-lg font-bold text-foreground flex items-center">
            <span className="w-1.5 h-5 bg-primary rounded-full mr-2.5" />
            Status Pelanggan
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStatus('konsumen')}
              className={cn(
                'flex flex-col items-center justify-center py-4 rounded-xl border-2 h-[72px] relative transition-all active:scale-[0.98]',
                status === 'konsumen'
                  ? 'bg-primary border-primary text-primary-foreground shadow-md'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/30'
              )}
            >
              {status === 'konsumen' && (
                <div className="absolute top-1.5 right-1.5 bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
              )}
              <User className="h-5 w-5 mb-1" />
              <span className="text-[11px] font-black uppercase tracking-wider">Konsumen</span>
            </button>
            <button
              onClick={() => { setStatus('mitra'); if (!isMitraTier(tier)) setTier('reseller'); }}
              className={cn(
                'flex flex-col items-center justify-center py-4 rounded-xl border-2 h-[72px] relative transition-all active:scale-[0.98]',
                status === 'mitra'
                  ? 'bg-primary border-primary text-primary-foreground shadow-md'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/30'
              )}
            >
              {status === 'mitra' && (
                <div className="absolute top-1.5 right-1.5 bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
              )}
              <Store className="h-5 w-5 mb-1" />
              <span className="text-[11px] font-black uppercase tracking-wider">Mitra</span>
            </button>
          </div>
        </div>

        {/* Level Mitra card */}
        {status === 'mitra' && (
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-bold text-foreground flex items-center">
              <span className="w-1.5 h-5 bg-primary rounded-full mr-2.5" />
              Level Mitra
            </h3>

            <div className="space-y-2.5">
              {MITRA_TIERS.map(t => {
                const isActive = tier === t.tier;
                return (
                  <button
                    key={t.tier}
                    onClick={() => setTier(t.tier)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-xl transition-all active:scale-[0.98] border-2',
                      isActive
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                        isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        {t.icon}
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-foreground text-sm leading-tight">{t.label}</h3>
                        {isActive
                          ? <p className="text-[10px] text-primary font-bold mt-0.5">Level Saat Ini</p>
                          : <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t.desc}</p>
                        }
                      </div>
                    </div>
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                      isActive ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                    )}>
                      {isActive && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Save button - positioned fixed so it stays over the bottom nav area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-20 pb-safe sm:pb-4 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-[52px] bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 font-bold text-base uppercase"
        >
          {saving ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Menyimpan...</>
          ) : (
            <><Save className="h-5 w-5" /> Simpan Perubahan</>
          )}
        </button>
      </div>
    </div>
  );
}
