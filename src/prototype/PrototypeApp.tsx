import { useEffect, useRef } from 'react';
import { Routes, Route, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BatteryFull, Wifi, Signal, Home as HomeIcon, ClipboardList, Package, UserRound, X, CheckCircle2 } from 'lucide-react';
import { PrototypeProvider } from './store';
import { usePrototype } from './context';
import { Brand, Empty, Page } from './ui';
import { PROTOTYPE_SCREENS } from './screens';
import { DesignLab } from './DesignLab';
import { Splash, Welcome, Login, Forgot, Setup, SetupDone } from './IntroPages';
import { Notifications, TargetPage, CashPage, Stock, StockDetail, LevelPage } from './BusinessPages';
import { Purchases, PurchaseForm, PurchaseDetail } from './PurchasePages';
import { AddOrder, Capture, Compose, OrderList, OrderDetail, OrderSuccess, Payment, Receipt, ReturnOrder } from './OrderPages';
import { Customers, CustomerPage, Advisor, Profile, ShopSettings, Connections, Security, Privacy, Team, Plan, Help, Logout, Screens } from './SupportPages';
import { Home } from './HomePage';
import { Reports } from './MoneyPage';
import { Catalog, CatalogDetail } from './CatalogPages';
import { Settings } from './AccountPage';
import { Storefront } from './StorefrontPage';
import './prototype.css';
import './reference-design.css';
import './usability-redesign.css';

function PrototypeShell() {
  const { data, update, reset, message, notify } = usePrototype(); const location = useLocation(); const navigate = useNavigate(); const scroll = useRef<HTMLDivElement>(null);
  const intro = ['/', '/welcome', '/login', '/register', '/forgot', '/setup', '/setup-stock', '/setup-store', '/setup-done', '/logout', '/storefront'].includes(location.pathname);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); scroll.current?.scrollTo({ top: 0 }); }, [location.pathname, location.search]);
  useEffect(() => {
    const design = new URLSearchParams(location.search).get('design');
    if (design === 'bold') update(d => d.design === design ? d : { ...d, design });
  }, [location.search, update]);
  useEffect(() => { if (!message) return; const timer = setTimeout(() => notify(''), 5500); return () => clearTimeout(timer); }, [message, notify]);
  return <div className="p-stage" data-design={data.design}>
    <aside className="p-sidebar"><Brand /><Link className="p-text-button" to="/designs">Bold Fintech · panduan desain →</Link><p className="p-sidebar-note">Prototipe mobile lengkap.<br />Pilih layar atau ikuti perjalanan dari awal.</p><div className="p-preview-tools"><button onClick={() => { reset(false); navigate('/'); }}>Ulang dari splash</button><button onClick={() => { reset(false); navigate('/home'); }}>Data contoh</button><button onClick={() => { reset(true); navigate('/home'); }}>Data kosong</button><button aria-pressed={data.offline} onClick={() => update(d => ({ ...d, offline: !d.offline }))}>{data.offline ? 'Aktifkan online' : 'Coba offline'}</button><button aria-pressed={data.aiError} onClick={() => update(d => ({ ...d, aiError: !d.aiError }))}>Gagal baca: {data.aiError ? 'aktif' : 'nonaktif'}</button></div>{[...new Set(PROTOTYPE_SCREENS.map(s => s[0]))].map(group => <div key={group}><h2>{group}</h2>{PROTOTYPE_SCREENS.filter(s => s[0] === group).map(([, path, name]) => <NavLink key={path} to={path} end>{name}</NavLink>)}</div>)}<p className="p-sidebar-note">Data hanya di sesi browser, tidak terhubung ke produksi. Pengaturan perangkat, akun, dan AI diperagakan sebagai simulasi.</p></aside>
    <div className={`p-device ${!intro ? 'has-navigation' : ''}`}><div className="p-statusbar"><span>9:41</span><span className="p-demo-tag">PROTOTIPE · DATA CONTOH</span><span className="p-status-icons"><Signal size={12} /><Wifi size={13} /><BatteryFull size={18} /></span></div>{data.offline && <div className="p-offline">Offline · Simpan Draf</div>}{message && <div className="p-toast" role="status"><CheckCircle2 size={17} /><span>{message}</span><button aria-label="Tutup pemberitahuan" onClick={() => notify('')}><X size={17} /></button></div>}
      <div ref={scroll} className="p-scroll" data-testid="prototype-scroll"><Routes key={location.pathname + location.search}>
        <Route path="/" element={<Splash />} /><Route path="/welcome" element={<Welcome />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Login register />} /><Route path="/forgot" element={<Forgot />} />
        <Route path="/setup" element={<Setup step={0} />} /><Route path="/setup-stock" element={<Setup step={1} />} /><Route path="/setup-store" element={<Setup step={2} />} /><Route path="/setup-done" element={<SetupDone />} />
        <Route path="/home" element={<Home />} /><Route path="/notifications" element={<Notifications />} /><Route path="/target" element={<TargetPage />} />
        <Route path="/designs" element={<DesignLab />} />
        <Route path="/orders" element={<OrderList />} /><Route path="/orders/:id" element={<OrderDetail />} /><Route path="/orders/:id/payment" element={<Payment />} /><Route path="/orders/:id/receipt" element={<Receipt />} /><Route path="/orders/:id/return" element={<ReturnOrder />} /><Route path="/order-success/:id" element={<OrderSuccess />} />
        <Route path="/add" element={<AddOrder />} /><Route path="/capture/:kind" element={<Capture />} /><Route path="/compose" element={<Compose />} />
        <Route path="/reports" element={<Reports />} /><Route path="/expenses" element={<CashPage kind="expense" />} /><Route path="/income" element={<CashPage kind="income" />} />
        <Route path="/stock" element={<Stock />} /><Route path="/stock/:sku" element={<StockDetail />} /><Route path="/stock/:sku/adjust" element={<StockDetail adjust />} />
        <Route path="/purchases" element={<Purchases />} /><Route path="/purchase/new" element={<PurchaseForm />} /><Route path="/purchases/:id" element={<PurchaseDetail />} /><Route path="/level" element={<LevelPage />} />
        <Route path="/customers" element={<Customers />} /><Route path="/customer/:id" element={<CustomerPage />} /><Route path="/catalog" element={<Catalog />} /><Route path="/catalog/:sku" element={<CatalogDetail />} /><Route path="/advisor" element={<Advisor />} />
        <Route path="/settings" element={<Settings />} /><Route path="/profile" element={<Profile />} /><Route path="/shop" element={<ShopSettings />} /><Route path="/storefront" element={<Storefront />} />
        <Route path="/connections" element={<Connections />} /><Route path="/connections/whatsapp" element={<Connections kind="whatsapp" />} /><Route path="/connections/telegram" element={<Connections kind="telegram" />} />
        <Route path="/security" element={<Security />} /><Route path="/privacy" element={<Privacy />} /><Route path="/team" element={<Team />} /><Route path="/plan" element={<Plan />} /><Route path="/help" element={<Help />} /><Route path="/logout" element={<Logout />} /><Route path="/screens" element={<Screens />} />
        <Route path="*" element={<Page title="Layar tidak ditemukan"><Empty title="Mari kembali ke ruang usaha" text="Gunakan peta layar untuk menjelajahi alur yang tersedia." action={<Link className="p-button" to="/screens">Buka peta layar</Link>} /></Page>} />
      </Routes></div>
      {!intro && <nav className="p-nav" aria-label="Navigasi utama">{[[HomeIcon, '/home', 'Beranda'], [ClipboardList, '/orders', 'Riwayat'], [Package, '/stock', 'Stok'], [UserRound, '/settings', 'Akun']].map(([Icon, to, label]) => { const I = Icon as typeof HomeIcon; const active = location.pathname === to || (to === '/home' && ['/target', '/notifications', '/reports', '/expenses', '/income'].some(prefix => location.pathname.startsWith(prefix))) || (to === '/orders' && ['/orders/', '/compose', '/capture', '/add', '/order-success'].some(prefix => location.pathname.startsWith(prefix))) || (to === '/stock' && ['/catalog', '/purchase', '/level', '/stock/'].some(prefix => location.pathname.startsWith(prefix))) || (to === '/settings' && ['/settings', '/profile', '/shop', '/customers', '/customer/', '/connections', '/security', '/privacy', '/team', '/plan', '/help', '/advisor', '/designs', '/screens'].some(prefix => location.pathname.startsWith(prefix))); return <Link className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} key={to as string} to={to as string}><span><I size={21} /></span>{label as string}</Link>; })}</nav>}<div className="p-home-indicator" />
    </div>
  </div>;
}

export default function PrototypeApp() { return <PrototypeProvider><PrototypeShell /></PrototypeProvider>; }
