import { Link } from 'react-router-dom';
import { UserRound, Store, Users, Link2, LockKeyhole, ShieldCheck, Sparkles, CircleHelp, Smartphone, LogOut, ArrowRight, Settings2, Crown, Palette } from 'lucide-react';
import { LEVEL_LABELS } from '@/lib/mulaBusiness';
import { usePrototype } from './context';
import { Page, Card, Row } from './ui';

export function Settings() {
  const { data } = usePrototype();
  return <Page title="Akun & usaha" subtitle="Semua yang mendukung usaha Anda" back={false} action={<Link to="/profile" className="p-icon-button" aria-label="Ubah profil usaha"><Settings2 size={21} /></Link>}>
    <div className="p-profile-identity"><span className="p-owner-avatar">{data.profile.name.replace(/^bu\s+|^pak\s+/i, '').slice(0, 1)}</span><div><h2>{data.profile.name}</h2><p>{data.profile.email}</p><p>{data.profile.business}</p></div></div>
    <Link className="p-membership" to="/level"><span><Crown size={21} /></span><span><strong>Mitra {LEVEL_LABELS[data.profile.level]}</strong><small>Lihat progres pembelian & level bulanan</small></span><ArrowRight size={18} /></Link>
    <div><h2 className="p-menu-heading">Ruang usaha</h2><Card className="p-flat-card p-account-menu"><Row to="/profile" icon={UserRound} title="Profil usaha" subtitle="Nama, kontak, dan level aktif contoh" /><Row to="/shop" icon={Store} title="Toko & pembayaran" subtitle="Katalog pelanggan dan rekening contoh" /><Row to="/team" icon={Users} title="Anggota usaha" subtitle="Pemilik, admin, reviewer" /><Row to="/connections" icon={Link2} title="Sumber & koneksi" subtitle="WhatsApp Business, Telegram, dan input manual" /></Card></div>
    <div><h2 className="p-menu-heading">Preferensi & bantuan</h2><Card className="p-flat-card p-account-menu"><Row to="/security" icon={LockKeyhole} title="Keamanan akun" subtitle="Sesi dan preferensi perangkat" /><Row to="/privacy" icon={ShieldCheck} title="Privasi & izin data" subtitle="Pemrosesan, ekspor, dan hapus data contoh" /><Row to="/plan" icon={Sparkles} title="Paket penggunaan" subtitle={data.plan} /><Row to="/help" icon={CircleHelp} title="Bantuan" subtitle="Panduan dan pertanyaan umum" /><Row to="/designs" icon={Palette} title="Arah desain MULA" subtitle="Bold Fintech · referensi yang diterapkan" /><Row to="/screens" icon={Smartphone} title="Jelajahi seluruh layar" subtitle="Peta interaktif prototipe" /></Card></div>
    <Link className="p-button secondary" to="/logout"><LogOut size={17} />Keluar dari akun contoh</Link><p className="p-small" style={{ textAlign: 'center' }}>MULA × Rekapan Mitra BP<br />Prototipe · data sesi contoh</p>
  </Page>;
}
