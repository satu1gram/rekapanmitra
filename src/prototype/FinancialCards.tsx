import { Link } from 'react-router-dom';
import { ArrowDownLeft, Clock3, Package, TrendingUp, ArrowUpRight } from 'lucide-react';
import { money } from './format';
import type { financialOverview } from './financialOverview';

export function FinancialCards({ summary }: { summary: ReturnType<typeof financialOverview> }) {
  return <div className="p-financial-grid">{[
    { key: 'received', label: 'Uang diterima', value: summary.received, hint: 'Pembayaran order periode ini', view: 'payments', Icon: ArrowDownLeft, tone: 'received' },
    { key: 'outstanding', label: 'Belum dibayar', value: summary.outstanding, hint: 'Sisa yang perlu Anda terima', view: 'payments', Icon: Clock3, tone: 'outstanding' },
    { key: 'cost', label: 'Modal produk terjual', value: summary.cost, hint: 'Acuan modal saat order dicatat', view: 'profit', Icon: Package, tone: 'cost' },
    { key: 'profit', label: 'Estimasi laba', value: summary.net, hint: 'Setelah biaya & pendapatan lain', view: 'profit', Icon: TrendingUp, tone: 'profit' },
  ].map(({ key, label, value, hint, view, Icon, tone }) => <Link key={key} className={`p-financial-card ${tone}`} data-money={key} to={`/reports?view=${view}`}><span className="p-financial-card-top"><Icon size={17} /><ArrowUpRight size={14} /></span><span className="p-financial-label">{label}</span><strong>{money(value)}</strong><small>{hint}</small></Link>)}</div>;
}
