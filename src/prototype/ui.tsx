import { useId, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Check, Sprout, type LucideIcon } from 'lucide-react';
export function Brand({ large = false }: { large?: boolean }) { return <div className={`p-brand ${large ? 'large' : ''}`}><span className="p-brand-symbol"><Sprout size={large ? 38 : 24} strokeWidth={2} /></span><span>MULA<span className="p-brand-caption">Rekapan Mitra BP</span></span></div>; }
export function Page({ title, subtitle, children, back = true, action, className = '' }: { title: string; subtitle?: string; children: ReactNode; back?: boolean; action?: ReactNode; className?: string }) {
  const navigate = useNavigate();
  return <div className={`p-page ${className}`}>{title ? <header className="p-header">{back && <button className="p-icon-button" aria-label="Kembali" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/home')}><ArrowLeft size={22} /></button>}<div className="p-header-copy"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</header> : <div style={{ height: 22 }} />}<div className="p-page-body">{children}</div></div>;
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`p-card ${className}`}>{children}</section>; }
export function Button({ children, onClick, secondary = false, danger = false, disabled = false, type = 'button' }: { children: ReactNode; onClick?: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean; type?: 'submit' | 'button' }) { return <button type={type} disabled={disabled} onClick={onClick} className={`p-button ${secondary ? 'secondary' : ''} ${danger ? 'danger' : ''}`}>{children}</button>; }
export function Input({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) { const id = useId(); return <div className="p-field"><label htmlFor={id}>{label}</label><input id={id} {...props} /></div>; }
export function Select({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) { const id = useId(); return <div className="p-field"><label htmlFor={id}>{label}</label><select id={id} {...props}>{children}</select></div>; }
export function TextArea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) { const id = useId(); return <div className="p-field"><label htmlFor={id}>{label}</label><textarea id={id} {...props} /></div>; }
export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' | 'success' | 'error' }) { return <div className={`p-note ${tone}`} role={tone === 'error' ? 'alert' : undefined}>{children}</div>; }
export function Pill({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'amber' | 'slate' | 'red' }) { return <span className={`p-pill ${tone}`}>{children}</span>; }
export function Row({ title, subtitle, icon: Icon, to, onClick, trailing }: { title: string; subtitle?: string; icon?: LucideIcon; to?: string; onClick?: () => void; trailing?: ReactNode }) {
  const content = <>{Icon && <span className="p-row-icon"><Icon size={21} /></span>}<span className="p-row-copy"><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</span>{trailing ?? <ChevronRight size={19} className="p-muted" />}</>;
  return to ? <Link className="p-row" to={to}>{content}</Link> : <button type="button" className="p-row" onClick={onClick}>{content}</button>;
}
export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) { return <div className="p-stat"><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</div>; }
export function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) { return <Card className="p-empty"><span className="p-empty-icon"><Sprout size={34} /></span><h2>{title}</h2><p>{text}</p>{action}</Card>; }
export function Step({ current, labels }: { current: number; labels: string[] }) { return <ol className="p-steps">{labels.map((label, index) => <li className={index <= current ? 'active' : ''} key={label}><span>{index < current ? <Check size={13} /> : index + 1}</span>{label}</li>)}</ol>; }
export function Toggle({ title, text, checked, onChange }: { title: string; text: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="p-toggle-row"><span><strong>{title}</strong><small>{text}</small></span><input type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.target.checked)} /><span className="p-toggle-track" aria-hidden="true" /></label>; }
export function DownloadButton({ label, filename, content, type = 'text/plain' }: { label: string; filename: string; content: string; type?: string }) {
  return <Button secondary onClick={() => { const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}>{label}</Button>;
}
