import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Check, Palette, Package, ClipboardList } from 'lucide-react';
import { DESIGN_OPTIONS } from './designOptions';
import { usePrototype } from './context';
import { businessSummary, today } from './model';
import { money } from './format';
import { Page, Card, Button, Note, Pill } from './ui';

export function DesignLab() {
  const { data, update, notify } = usePrototype(); const navigate = useNavigate();
  const summary = businessSummary(data, today().slice(0, 7));
  return <Page title="Pilih arah desain" subtitle="Bandingkan isi yang sama dalam tiga pendekatan">
    <Note>Belum ada desain final yang diterapkan. Pilihan di sini hanya mengubah tampilan prototipe pada sesi ini; angka dan aturan bisnis tetap sama.</Note>
    {DESIGN_OPTIONS.map(option => <Card key={option.id} className="p-design-option">
      <div className="p-between"><div><span className="p-small">OPSI {option.code}</span><h2>{option.name}</h2></div>{option.recommended ? <Pill>Rekomendasi</Pill> : <span className="p-row-icon"><Palette size={22} /></span>}</div>
      <p>{option.tagline}</p>
      <div className={`p-design-sample ${option.id}`}>
        <div className="p-sample-top"><strong>MULA</strong><span>Halo, Bu Rina</span></div>
        {option.id === 'warm' && <div className="p-sample-task"><Check size={16} />Periksa draf sebelum mulai jualan</div>}
        <div className="p-sample-finance"><span>Omzet terkonfirmasi</span><strong>{money(summary.revenue)}</strong><small>Estimasi hasil {money(summary.net)}</small><div>+ Catat pesanan</div></div>
        <div className="p-sample-grid"><span><Package size={16} />Stok & restok</span><span><ClipboardList size={16} />Pesanan</span></div>
      </div>
      <div className="p-palette" aria-label={`Palet ${option.name}`}>{option.palette.map(color => <span key={color} style={{ background: color }} />)}</div>
      <p className="p-small">{option.description}</p><p className="p-small"><strong>Cocok untuk:</strong> {option.bestFor}</p><p className="p-small"><strong>Pertimbangan:</strong> {option.tradeoff}</p>
      <Button onClick={() => { update(d => ({ ...d, design: option.id })); notify(`Sedang mencoba opsi ${option.code} · ${option.name}. Ini belum pilihan desain final.`); navigate(`/home?design=${option.id}`); }}>{data.design === option.id ? 'Coba lagi' : 'Coba di seluruh layar'} · {option.code}<ArrowUpRight size={18} /></Button>
      <div className="p-action-row"><Link className="p-button secondary" to={`/compose?example=multi&design=${option.id}`}>Order multiproduk</Link><Link className="p-button secondary" to={`/purchase/new?example=multi&design=${option.id}`}>Restok multiproduk</Link></div>
    </Card>)}
    <Button secondary onClick={() => { update(d => ({ ...d, design: 'current' })); notify('Tampilan awal dipulihkan.'); navigate('/home'); }}>Kembali ke tampilan awal</Button>
    <Card><h2>Dasar perbandingan</h2><p className="p-small">Perbedaan bukan hanya warna: hierarki angka, kepadatan informasi, bentuk kartu, serta urutan tindakan ikut berubah. Ketiga opsi memakai alur dan data yang sama agar mudah dibandingkan.</p><p className="p-small">Arah ini diturunkan dari dokumentasi resmi Material Design dan WCAG. Belum merupakan hasil usability test pada pengguna BP atau sertifikasi aksesibilitas.</p></Card>
  </Page>;
}
