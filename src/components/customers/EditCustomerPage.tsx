import { useState } from 'react';
import { ArrowLeft, User, Phone, MapPin, Save, Loader2, ShoppingBag, Store, Package, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TierType } from '@/types';
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
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address || '');
  const [status, setStatus] = useState<Status>(isMitraTier(customer.tier) ? 'mitra' : 'konsumen');
  const [tier, setTier] = useState<TierType>(customer.tier as TierType || 'satuan');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Nama dan nomor WhatsApp wajib diisi');
      return;
    }
    if (!user) return;

    const finalTier: TierType = status === 'konsumen' ? 'satuan' : tier;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim() || null,
          tier: finalTier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Data pelanggan berhasil diperbarui');
      onSaved(data);
    } catch (err: any) {
      toast.error('Gagal memperbarui: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
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
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Ubah Pelanggan</h1>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">Edit data & level mitra</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 px-4 mt-3 mb-6 space-y-3 pb-28">
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
            <label className="block text-sm font-bold text-foreground mb-2">No. WhatsApp</label>
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

      {/* Save button - fixed bottom like other pages */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-20">
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
