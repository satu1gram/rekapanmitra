import { MITRA_LEVELS, MitraLevel } from '@/types';
import { User, Phone, ChevronRight, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Design System
const DS = {
    primary: '#059669',       // Hijau Utama
    navy: '#1E293B',          // Navy Gelap — teks utama
    gray: '#64748B',          // Abu-abu Teks — sekunder
    yellow: '#FBBF24',        // Kuning Aksen — label Custom
    bgLight: '#F8FAFC',       // Abu-abu Terang — latar
};

interface MitraLevelStepProps {
    name: string;
    phone: string;
    mitraLevel: MitraLevel;
    customLevelName: string;
    customBuyPrice: number;
    onChange: (field: 'name' | 'phone' | 'mitraLevel' | 'customLevelName' | 'customBuyPrice', value: string | number) => void;
    onNext: () => void;
    onBack: () => void;
}

const LEVEL_ORDER: MitraLevel[] = ['reseller', 'agen', 'agen_plus', 'sap', 'se'];

const LEVEL_DESCRIPTIONS: Record<string, string> = {
    reseller: 'Pemula · Beli min. 3 botol',
    agen: 'Beli min. 5 botol',
    agen_plus: 'Beli min. 10 botol',
    sap: 'Beli min. 40 botol',
    se: 'Beli min. 200 botol',
};

// Format number dengan separator ribuan untuk display
function formatNumber(val: number): string {
    if (!val) return '';
    return val.toLocaleString('id-ID');
}

// Parse angka dari string berformat (hapus titik/koma ribuan)
function parseNumber(str: string): number {
    return parseInt(str.replace(/\D/g, ''), 10) || 0;
}

export function MitraLevelStep({ name, phone, mitraLevel, customLevelName, customBuyPrice, onChange, onNext, onBack }: MitraLevelStepProps) {
    const isCustom = mitraLevel === 'custom';
    const canContinue =
        name.trim().length > 0 &&
        mitraLevel &&
        (isCustom ? (customLevelName.trim().length > 0 && customBuyPrice > 0) : true);

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-xl font-extrabold" style={{ color: DS.navy }}>Profil & Level Mitra</h2>
                <p className="text-sm font-medium mt-1" style={{ color: DS.gray }}>
                    Level Anda menentukan <strong style={{ color: DS.navy }}>harga modal</strong> yang digunakan di seluruh sistem.
                </p>
            </div>

            {/* Nama */}
            <div className="space-y-1.5">
                <Label className="text-sm font-bold flex items-center gap-1.5" style={{ color: DS.navy }}>
                    <User className="h-3.5 w-3.5" style={{ color: DS.primary }} />
                    Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                    className="h-11 text-sm font-medium placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="Masukkan nama Anda"
                    value={name}
                    onChange={e => onChange('name', e.target.value)}
                />
            </div>

            {/* No WA */}
            <div className="space-y-1.5">
                <Label className="text-sm font-bold flex items-center gap-1.5" style={{ color: DS.navy }}>
                    <Phone className="h-3.5 w-3.5" style={{ color: DS.primary }} />
                    Nomor WhatsApp <span className="font-normal text-sm" style={{ color: DS.gray }}>(opsional)</span>
                </Label>
                <Input
                    className="h-11 text-sm font-medium placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="08xxx atau 62xxx"
                    type="tel"
                    value={phone}
                    onChange={e => onChange('phone', e.target.value)}
                />
            </div>

            {/* Level mitra cards */}
            <div className="space-y-2">
                <Label className="text-sm font-bold" style={{ color: DS.navy }}>
                    Level Mitra Saat Ini <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                    {/* Level standar */}
                    {LEVEL_ORDER.map(level => {
                        const info = MITRA_LEVELS[level];
                        const isSelected = mitraLevel === level;
                        return (
                            <button
                                key={level}
                                onClick={() => onChange('mitraLevel', level)}
                                className={cn(
                                    'w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all active:scale-[0.98] text-left',
                                    isSelected ? 'border-[#059669] bg-emerald-50' : 'border-slate-200 bg-white'
                                )}
                            >
                                <div>
                                    <p className="font-bold text-sm" style={{ color: isSelected ? DS.primary : DS.navy }}>
                                        {info.label}
                                    </p>
                                    <p className="text-xs font-medium mt-0.5" style={{ color: DS.gray }}>{LEVEL_DESCRIPTIONS[level]}</p>
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                    <p className="text-sm font-extrabold" style={{ color: isSelected ? DS.primary : DS.navy }}>
                                        Rp {info.buyPricePerBottle.toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-[10px] font-medium" style={{ color: DS.gray }}>harga modal/botol</p>
                                </div>
                            </button>
                        );
                    })}

                    {/* Level kustom */}
                    <button
                        onClick={() => onChange('mitraLevel', 'custom')}
                        className={cn(
                            'w-full p-3.5 rounded-2xl border-2 transition-all active:scale-[0.98] text-left',
                            isCustom ? 'border-[#059669] bg-emerald-50' : 'border-dashed border-slate-300 bg-white'
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PenLine className="h-4 w-4" style={{ color: isCustom ? DS.primary : DS.gray }} />
                                <p className="font-bold text-sm" style={{ color: isCustom ? DS.primary : DS.navy }}>
                                    {isCustom && customLevelName.trim() ? customLevelName : 'Level Kustom'}
                                </p>
                                {/* Badge kuning */}
                                <span
                                    className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
                                    style={{ background: '#FEF3C7', color: DS.yellow }}
                                >
                                    Custom
                                </span>
                            </div>
                            {isCustom && customBuyPrice > 0 ? (
                                <div className="text-right shrink-0 ml-3">
                                    <p className="text-sm font-extrabold" style={{ color: DS.primary }}>
                                        Rp {customBuyPrice.toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-[10px] font-medium" style={{ color: DS.gray }}>harga modal/botol</p>
                                </div>
                            ) : !isCustom ? (
                                <p className="text-xs font-medium shrink-0" style={{ color: DS.gray }}>Tentukan sendiri</p>
                            ) : null}
                        </div>

                        {/* Expanded inputs */}
                        {isCustom && (
                            <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
                                {/* Nama level */}
                                <Input
                                    className="h-9 text-sm font-medium bg-white placeholder:text-slate-300 placeholder:font-normal"
                                    placeholder="Nama level Anda (misal: Distributor)"
                                    value={customLevelName}
                                    onChange={e => onChange('customLevelName', e.target.value)}
                                    autoFocus
                                />
                                {/* Harga modal dengan separator ribuan */}
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: DS.gray }}>Rp</span>
                                    <Input
                                        className="pl-9 h-9 text-sm font-bold bg-white placeholder:text-slate-300 placeholder:font-normal"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Harga modal per botol (misal: 175.000)"
                                        value={customBuyPrice ? formatNumber(customBuyPrice) : ''}
                                        onChange={e => onChange('customBuyPrice', parseNumber(e.target.value))}
                                    />
                                </div>
                                {customLevelName.trim() && customBuyPrice > 0 && (
                                    <p className="text-[11px] font-semibold" style={{ color: DS.primary }}>
                                        ✓ Level "{customLevelName}" · Rp {customBuyPrice.toLocaleString('id-ID')}/botol
                                    </p>
                                )}
                            </div>
                        )}
                    </button>
                </div>
            </div>

            <p className="text-xs font-medium text-center -mt-2" style={{ color: DS.gray }}>
                Bisa diubah nanti di <strong style={{ color: DS.navy }}>Akun → Profil</strong>
            </p>

            {/* Navigasi */}
            <div className="flex gap-3 pt-1">
                <button
                    onClick={onBack}
                    className="flex-1 py-3.5 border-2 border-slate-200 rounded-2xl font-bold text-sm"
                    style={{ color: DS.navy }}
                >
                    Kembali
                </button>
                <button
                    onClick={onNext}
                    disabled={!canContinue}
                    className="flex-[2] py-3.5 text-white rounded-2xl font-extrabold text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                    style={{ background: DS.primary, boxShadow: '0 4px 15px rgba(5,150,105,0.25)' }}
                >
                    Lanjut <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
