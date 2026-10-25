import { Link } from 'react-router-dom';
import { UserRound, Store, Users, Link2, LockKeyhole, ShieldCheck, Sparkles, CircleHelp, LogOut, ArrowRight, Settings2, Crown, Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { LEVEL_LABELS } from '@/lib/mulaBusiness';
import { usePrototype } from './context';
import { Page, Card, Row } from './ui';

export function Settings() {
  const { data } = usePrototype();
  return <Page title="Akun" back={false} action={<Link to="/profile" className="p-icon-button" aria-label="Ubah profil usaha"><Settings2 size={21} /></Link>}>
    <div className="p-profile-identity"><span className="p-owner-avatar">{data.profile.name.replace(/^bu\s+|^pak\s+/i, '').slice(0, 1)}</span><div><h2>{data.profile.name}</h2><p>{data.profile.email}</p><p>{data.profile.business}</p></div></div>
    <Link className="p-membership" to="/level"><span><Crown size={21} /></span><span><strong>Mitra {LEVEL_LABELS[data.profile.level]}</strong><small>Level Mitra</small></span><ArrowRight size={18} /></Link>
    <div><h2 className="p-menu-heading">Pengaturan</h2><Card className="p-flat-card p-account-menu"><Row to="/reports" icon={Wallet} title="Rekap Bulanan" /><Row to="/customers" icon={Users} title="Pelanggan" /><Row to="/expenses" icon={ArrowDownLeft} title="Pengeluaran" /><Row to="/income" icon={ArrowUpRight} title="Pemasukan" /><Row to="/profile" icon={UserRound} title="Profil Saya" /><Row to="/shop" icon={Store} title="Pengaturan Toko" /><Row to="/team" icon={Users} title="Anggota" /><Row to="/connections" icon={Link2} title="Koneksi" /></Card></div>
    <div><h2 className="p-menu-heading">Preferensi & bantuan</h2><Card className="p-flat-card p-account-menu"><Row to="/security" icon={LockKeyhole} title="Keamanan" /><Row to="/privacy" icon={ShieldCheck} title="Privasi" /><Row to="/plan" icon={Sparkles} title="Paket penggunaan" subtitle={data.plan} /><Row to="/advisor" icon={Sparkles} title="Asisten AI" /><Row to="/help" icon={CircleHelp} title="Bantuan" /></Card></div>
    <Link className="p-button secondary" to="/logout"><LogOut size={17} />Keluar</Link><p className="p-small" style={{ textAlign: 'center' }}>Rekapan Mitra · Demo</p>
  </Page>;
}
