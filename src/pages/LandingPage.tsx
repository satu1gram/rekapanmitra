import React, { useEffect, useState } from 'react';
import '@/styles/landing.css';
import {
    Rocket, MessageCircle, FileEdit, Settings, Sparkles,
    MessageSquareQuote, CircleHelp, Package, Wallet, Users,
    Calculator, BarChart3, Store, Check, ChevronDown, Heart,
    Mail, Lock, TrendingUp, ShoppingCart, Target, Shield,
    Smartphone, Gift, Code2, Lightbulb, Clock, ArrowRight,
    Bell, FileSpreadsheet, GitMerge, Zap, User, ArrowDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.querySelectorAll('.reveal').forEach(el => observer.unobserve(el));
        };
    }, []);

    const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const toggleFaq = (index: number) => setActiveFaq(activeFaq === index ? null : index);

    return (
        <div className="landing-page-wrapper relative">

            {/* ════ STICKY MOBILE CTA ════ */}
            <div className="sticky-cta" id="stickyCta">
                <Link to="/dashboard" className="btn btn-primary">
                    <Rocket className="icon" size={18} /> Coba Gratis
                </Link>
                <a href="https://wa.me/6287782697973?text=Halo%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20Rekapan%20Mitra"
                    target="_blank" rel="noopener noreferrer" className="btn btn-wa">
                    <MessageCircle className="icon" size={18} /> Chat WA
                </a>
            </div>

            {/* ════ NAV ════ */}
            <nav className={`nav ${scrolled ? 'scrolled' : ''}`} id="nav">
                <div className="nav-inner">
                    <a href="#" className="nav-logo">
                        <img src="/pwa-192x192.png" alt="Logo Rekapan Mitra"
                            style={{ width: '34px', height: '34px', objectFit: 'contain', borderRadius: '8px' }} />
                        Rekapan <span>Mitra</span>
                    </a>
                    <div className="nav-links">
                        <a href="#masalah">Masalah</a>
                        <a href="#cara-kerja">Cara Kerja</a>
                        <a href="#fitur">Fitur</a>
                        <a href="#founder">Tim</a>
                        <a href="#faq">FAQ</a>
                        <a href="https://wa.me/6287782697973" target="_blank" rel="noopener noreferrer"
                            className="btn btn-wa" style={{ padding: '.6rem 1.2rem', fontSize: '.8125rem' }}>
                            <MessageCircle className="icon" size={18} /> Chat WA
                        </a>
                        <Link to="/dashboard" className="btn btn-primary"
                            style={{ padding: '.6rem 1.25rem', fontSize: '.8125rem' }}>
                            Coba Gratis
                        </Link>
                    </div>
                    <button className={`nav-hamburger ${mobileMenuOpen ? 'open' : ''}`}
                        onClick={toggleMenu} aria-label="Menu">
                        <span /><span /><span />
                    </button>
                </div>
            </nav>

            {/* ════ MOBILE MENU ════ */}
            <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
                <a href="#masalah" className="mobile-link"><FileEdit className="icon" size={18} /> Masalah</a>
                <a href="#cara-kerja" className="mobile-link"><Settings className="icon" size={18} /> Cara Kerja</a>
                <a href="#fitur" className="mobile-link"><Sparkles className="icon" size={18} /> Fitur</a>
                <a href="#founder" className="mobile-link"><User className="icon" size={18} /> Tim</a>
                <a href="#faq" className="mobile-link"><CircleHelp className="icon" size={18} /> FAQ</a>
                <a href="https://wa.me/6287782697973?text=Halo%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20Rekapan%20Mitra"
                    target="_blank" rel="noopener noreferrer" className="mobile-wa" style={{ marginTop: 'auto' }}>
                    <MessageCircle className="icon" size={18} /> Chat via WhatsApp
                </a>
            </div>

            {/* ════ HERO ════ */}
            <section className="hero" id="hero">
                <div className="hc-bg" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                        <defs>
                            <pattern id="hc" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
                                <polygon points="14,2 42,2 56,24 42,46 14,46 0,24"
                                    fill="none" stroke="#059669" strokeWidth="1.2" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#hc)" />
                    </svg>
                </div>

                <div className="hero-inner">
                    <div>
                        <div className="hero-badge">
                            <span className="dot" />
                            Baru Dirilis &mdash; Akses Gratis untuk Early Adopter
                        </div>
                        <h1>Kelola Bisnis Anda dalam <em>Satu Genggaman</em></h1>
                        <p>Pantau keuntungan real-time, catat pesanan, kelola stok, dan bangun jaringan pelanggan
                            — semua dari HP Anda. Tanpa ribet, tanpa lembar Excel.</p>
                        <div className="hero-cta">
                            <Link to="/dashboard" className="btn btn-primary btn-large">
                                <Rocket className="icon" size={18} /> Coba Sekarang &mdash; Gratis
                            </Link>
                            <a href="#cara-kerja" className="btn btn-outline btn-large">
                                Lihat Cara Kerja
                            </a>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="hero-mockup group relative">
                            <div className="hero-screen overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <style>{`.hero-screen::-webkit-scrollbar { display: none; }`}</style>
                                <img src="/dashboard-mockup-real.png" alt="Tampilan Dashboard Rekapan Mitra"
                                    className="w-full h-auto min-h-full object-top hover:animate-none" />
                            </div>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] text-white font-medium flex items-center gap-1.5 opacity-80 group-hover:opacity-0 transition-opacity pointer-events-none">
                                <ArrowDown size={12} className="animate-bounce" /> Sentuh & Geser
                            </div>
                        </div>
                        <div className="float-badge float-1">
                            <div className="float-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                                <Package className="icon" size={18} />
                            </div>
                            Stok: 19 item
                        </div>
                        <div className="float-badge float-2">
                            <div className="float-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                                <Wallet className="icon" size={18} />
                            </div>
                            +Rp 100rb/btl
                        </div>
                        <div className="float-badge float-3">
                            <div className="float-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                                <Users className="icon" size={18} />
                            </div>
                            10 pelanggan
                        </div>
                    </div>
                </div>
            </section>

            {/* ════ HONEST FEATURE PILLS — menggantikan stats fiktif ════ */}
            <div className="stats-bar">
                <div className="stats-bar-inner">
                    <div className="stat-item reveal">
                        <div className="stat-icon-wrap" style={{ color: '#059669' }}>
                            <Gift className="icon icon-lg" size={28} />
                        </div>
                        <div className="stat-num">100%</div>
                        <div className="stat-desc">Gratis Selamanya</div>
                    </div>
                    <div className="stat-item reveal">
                        <div className="stat-icon-wrap" style={{ color: '#0284c7' }}>
                            <Smartphone className="icon icon-lg" size={28} />
                        </div>
                        <div className="stat-num">PWA</div>
                        <div className="stat-desc">Langsung dari Browser HP</div>
                    </div>
                    <div className="stat-item reveal">
                        <div className="stat-icon-wrap" style={{ color: '#7c3aed' }}>
                            <Shield className="icon icon-lg" size={28} />
                        </div>
                        <div className="stat-num">Aman</div>
                        <div className="stat-desc">Data Terenkripsi Penuh</div>
                    </div>
                    <div className="stat-item reveal">
                        <div className="stat-icon-wrap" style={{ color: '#d97706' }}>
                            <Code2 className="icon icon-lg" size={28} />
                        </div>
                        <div className="stat-num">Oleh Mitra</div>
                        <div className="stat-desc">Dibuat untuk Kebutuhan Nyata</div>
                    </div>
                </div>
            </div>

            {/* ════ PAIN POINTS ════ */}
            <section className="section pain" id="masalah">
                <div className="section-inner text-center">
                    <span className="section-label reveal">Masalah Umum</span>
                    <h2 className="section-title reveal">Masih Catat Penjualan di Buku atau WA?</h2>
                    <p className="section-desc mx-auto reveal">
                        Banyak mitra yang menghadapi masalah ini setiap hari. Rekapan Mitra hadir sebagai solusinya.
                    </p>
                    <div className="pain-grid">
                        <div className="pain-card reveal">
                            <div className="pain-icon" style={{ background: '#fef2f2' }}>
                                <FileEdit className="icon icon-xl" size={28} />
                            </div>
                            <h3>Catatan Berantakan</h3>
                            <p>Pesanan tersebar di WhatsApp, buku catatan, dan notes HP yang tercecer. Sulit melacak
                                siapa pesan apa dan kapan.</p>
                        </div>
                        <div className="pain-card reveal">
                            <div className="pain-icon" style={{ background: '#fefce8' }}>
                                <Calculator className="icon icon-xl" size={28} />
                            </div>
                            <h3>Bingung Hitung Margin</h3>
                            <p>Harga modal berbeda tiap level mitra, margin per botol berubah-ubah. Salah hitung sama
                                dengan rugi tanpa disadari.</p>
                        </div>
                        <div className="pain-card reveal">
                            <div className="pain-icon" style={{ background: '#eff6ff' }}>
                                <BarChart3 className="icon icon-xl" size={28} />
                            </div>
                            <h3>Tidak Tahu Untung Rugi</h3>
                            <p>Di akhir bulan baru sadar uangnya habis ke mana. Tidak ada laporan keuntungan yang
                                jelas dan real-time.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════ HOW IT WORKS ════ */}
            <section className="section" id="cara-kerja">
                <div className="section-inner text-center">
                    <span className="section-label reveal">Cara Kerja</span>
                    <h2 className="section-title reveal">3 Langkah Mulai Untung Lebih Terukur</h2>
                    <p className="section-desc mx-auto reveal">
                        Tidak perlu keahlian teknis. Dalam hitungan menit, bisnis Anda sudah terdigitalisasi.
                    </p>
                    <div className="steps-grid">
                        <div className="step-card reveal">
                            <div className="step-num">1</div>
                            <h3>Daftar &amp; Setup Toko</h3>
                            <p>Buat akun gratis, pilih level mitra Anda, dan setup toko online publik dalam
                                hitungan menit.</p>
                            <span className="step-arrow"><ArrowRight size={20} /></span>
                        </div>
                        <div className="step-card reveal">
                            <div className="step-num">2</div>
                            <h3>Catat Pesanan &amp; Stok</h3>
                            <p>Tambah order baru, restok barang, dan sistem otomatis hitung margin keuntungan per
                                transaksi.</p>
                            <span className="step-arrow"><ArrowRight size={20} /></span>
                        </div>
                        <div className="step-card reveal">
                            <div className="step-num">3</div>
                            <h3>Pantau Keuntungan</h3>
                            <p>Dashboard real-time menampilkan omset, profit, target bulanan, dan pertumbuhan
                                pelanggan Anda.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════ FEATURES ════ */}
            <section className="section features" id="fitur">
                <div className="section-inner text-center">
                    <span className="section-label reveal">Fitur Unggulan</span>
                    <h2 className="section-title reveal">Semua yang Anda Butuhkan, dalam Satu Aplikasi</h2>
                    <div className="feat-grid">
                        <div className="feat-card reveal">
                            <div className="feat-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                                <TrendingUp className="icon icon-xl" size={28} />
                            </div>
                            <h3>Dashboard Keuntungan</h3>
                            <p>Lihat total keuntungan, omset, dan jumlah terjual dalam satu layar. Bandingkan
                                performa antar bulan.</p>
                        </div>
                        <div className="feat-card reveal">
                            <div className="feat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                                <ShoppingCart className="icon icon-xl" size={28} />
                            </div>
                            <h3>Manajemen Order</h3>
                            <p>Catat pesanan dengan harga tier otomatis. Margin terhitung langsung berdasarkan
                                level mitra Anda.</p>
                        </div>
                        <div className="feat-card reveal">
                            <div className="feat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                                <Package className="icon icon-xl" size={28} />
                            </div>
                            <h3>Tracking Stok Real-time</h3>
                            <p>Pantau stok masuk-keluar, notifikasi stok rendah, dan histori lengkap setiap
                                pergerakan barang.</p>
                        </div>
                        <div className="feat-card reveal">
                            <div className="feat-icon" style={{ background: '#fce7f3', color: '#db2777' }}>
                                <Users className="icon icon-xl" size={28} />
                            </div>
                            <h3>Manajemen Pelanggan</h3>
                            <p>Database pelanggan lengkap dengan histori transaksi. Kenali pelanggan setia Anda
                                dengan mudah.</p>
                        </div>
                        <div className="feat-card reveal">
                            <div className="feat-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                                <Target className="icon icon-xl" size={28} />
                            </div>
                            <h3>Target Bulanan</h3>
                            <p>Atur target profit, kuantitas, dan stok tiap bulan. Lacak progress menuju
                                pencapaian Anda.</p>
                        </div>
                        <div className="feat-card reveal">
                            <div className="feat-icon" style={{ background: '#ccfbf1', color: '#0d9488' }}>
                                <Store className="icon icon-xl" size={28} />
                            </div>
                            <h3>Toko Online Publik</h3>
                            <p>Punya link toko sendiri yang bisa dibagikan. Pelanggan order langsung tanpa perlu
                                chat WA.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════ BENEFITS ════ */}
            <section className="section" id="manfaat">
                <div className="section-inner text-center">
                    <span className="section-label reveal">Kenapa Rekapan Mitra?</span>
                    <h2 className="section-title reveal">Bisnis Lebih Terukur, Keuntungan Lebih Jelas</h2>
                    <div className="benefits-grid" style={{ textAlign: 'left' }}>
                        <div className="benefit reveal">
                            <div className="benefit-check"><Check className="icon" size={18} /></div>
                            <div>
                                <h3>Tahu Untung Setiap Saat</h3>
                                <p>Margin per botol dihitung otomatis sesuai level mitra. Tidak perlu kalkulator
                                    lagi.</p>
                            </div>
                        </div>
                        <div className="benefit reveal">
                            <div className="benefit-check"><Check className="icon" size={18} /></div>
                            <div>
                                <h3>Hemat Waktu Rekap Manual</h3>
                                <p>Tidak perlu rekap di buku atau Excel. Semua tercatat otomatis per transaksi
                                    langsung dari HP.</p>
                            </div>
                        </div>
                        <div className="benefit reveal">
                            <div className="benefit-check"><Check className="icon" size={18} /></div>
                            <div>
                                <h3>Stok Tidak Pernah Telat</h3>
                                <p>Peringatan stok rendah memastikan Anda restok sebelum kehabisan. Peluang
                                    jualan tidak terlewat.</p>
                            </div>
                        </div>
                        <div className="benefit reveal">
                            <div className="benefit-check"><Check className="icon" size={18} /></div>
                            <div>
                                <h3>Pelanggan Lebih Terkelola</h3>
                                <p>Database pelanggan lengkap dengan riwayat transaksi. Tahu siapa pelanggan
                                    setia Anda.</p>
                            </div>
                        </div>
                        <div className="benefit reveal">
                            <div className="benefit-check"><Check className="icon" size={18} /></div>
                            <div>
                                <h3>Toko Online Tanpa Ribet</h3>
                                <p>Link toko bisa langsung dibagikan ke sosial media. Pelanggan pesan sendiri
                                    — efisien.</p>
                            </div>
                        </div>
                        <div className="benefit reveal">
                            <div className="benefit-check"><Check className="icon" size={18} /></div>
                            <div>
                                <h3>Gratis Sepenuhnya</h3>
                                <p>Tidak ada biaya langganan. Semua fitur tersedia gratis untuk seluruh level
                                    mitra BP.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════ FOUNDER STORY — menggantikan testimoni palsu ════ */}
            <section className="section founder-section" id="founder">
                <div className="section-inner">
                    <div className="text-center">
                        <span className="section-label reveal">Tim Pembuat</span>
                        <h2 className="section-title reveal">Dibuat oleh Mitra, untuk Mitra</h2>
                        <p className="section-desc mx-auto reveal">
                            Aplikasi ini lahir dari masalah nyata yang kami rasakan sendiri sebagai pelaku bisnis
                            herbal.
                        </p>
                    </div>

                    <div className="founder-card reveal">
                        <div className="founder-avatar-wrap">
                            {/* Avatar ilustrasi SVG — tidak menggunakan foto agar tidak menyesatkan */}
                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none"
                                xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <circle cx="40" cy="40" r="40" fill="#d1fae5" />
                                <circle cx="40" cy="32" r="13" fill="#059669" />
                                <ellipse cx="40" cy="62" rx="20" ry="13" fill="#059669" />
                            </svg>
                        </div>
                        <div className="founder-content">
                            <div className="founder-tag">
                                <Code2 size={14} /> Pengembang Aplikasi
                            </div>
                            <h3>Tim Rekapan Mitra</h3>
                            <blockquote className="founder-quote">
                                "Kami adalah pelaku usaha mandiri yang menghadapi masalah yang sama persis seperti
                                Anda — pesanan di WA, margin dihitung manual, stok tidak terpantau. Aplikasi ini
                                kami bangun untuk menyelesaikan masalah kami sendiri, dan kami membukanya gratis
                                untuk membantu semua mitra dan reseller."
                            </blockquote>
                            <p className="founder-note">
                                Rekapan Mitra baru saja dirilis. Kami sangat menghargai setiap feedback dan
                                masukan dari pengguna pertama kami untuk terus memperbaiki aplikasi ini bersama-sama.
                            </p>
                            <div className="founder-cta-row">
                                <a href="https://wa.me/6287782697973?text=Halo%2C%20saya%20ingin%20memberi%20feedback%20untuk%20Rekapan%20Mitra"
                                    target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-sm">
                                    <MessageCircle size={16} /> Beri Feedback via WA
                                </a>
                                <Link to="/dashboard" className="btn btn-outline btn-sm">
                                    Coba Aplikasinya
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Value pillars — pengganti stat bar palsu dengan klaim yang bisa diverifikasi */}
                    <div className="founder-pillars reveal">
                        <div className="founder-pillar">
                            <div className="pillar-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                                <Shield size={22} />
                            </div>
                            <div>
                                <strong>Data Hanya Milik Anda</strong>
                                <span>Row Level Security — tidak ada yang bisa melihat data mitra lain</span>
                            </div>
                        </div>
                        <div className="founder-pillar">
                            <div className="pillar-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                                <Gift size={22} />
                            </div>
                            <div>
                                <strong>Gratis Tanpa Batas Waktu</strong>
                                <span>Tidak ada trial, tidak ada freemium — semua fitur terbuka penuh</span>
                            </div>
                        </div>
                        <div className="founder-pillar">
                            <div className="pillar-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                                <Zap size={22} />
                            </div>
                            <div>
                                <strong>Selalu Dikembangkan</strong>
                                <span>Update rutin berdasarkan feedback langsung dari pengguna aktif</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════ ROADMAP ════ */}
            <section className="section roadmap-section" id="roadmap">
                <div className="section-inner text-center">
                    <span className="section-label reveal">Yang Akan Datang</span>
                    <h2 className="section-title reveal">Kami Terus Berkembang untuk Anda</h2>
                    <p className="section-desc mx-auto reveal">
                        Berikut fitur-fitur yang sedang dalam pengembangan. Feedback Anda menentukan prioritas
                        kami.
                    </p>

                    <div className="roadmap-grid">
                        <div className="roadmap-card reveal">
                            <div className="roadmap-status status-progress">
                                <Clock size={13} /> Dalam Pengembangan
                            </div>
                            <div className="roadmap-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                                <FileSpreadsheet size={24} />
                            </div>
                            <h3>Export Laporan</h3>
                            <p>Unduh rekap bulanan ke format PDF atau Excel langsung dari dashboard Anda.</p>
                        </div>
                        <div className="roadmap-card reveal">
                            <div className="roadmap-status status-planned">
                                <Lightbulb size={13} /> Direncanakan
                            </div>
                            <div className="roadmap-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                                <Bell size={24} />
                            </div>
                            <h3>Notifikasi WhatsApp</h3>
                            <p>Terima notifikasi pesanan baru dan peringatan stok rendah langsung di WA Anda.</p>
                        </div>
                        <div className="roadmap-card reveal">
                            <div className="roadmap-status status-planned">
                                <Lightbulb size={13} /> Direncanakan
                            </div>
                            <div className="roadmap-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                                <GitMerge size={24} />
                            </div>
                            <h3>Multi-Toko</h3>
                            <p>Kelola beberapa toko atau produk berbeda dalam satu akun yang terintegrasi.</p>
                        </div>
                        <div className="roadmap-card reveal">
                            <div className="roadmap-status status-planned">
                                <Lightbulb size={13} /> Direncanakan
                            </div>
                            <div className="roadmap-icon" style={{ background: '#fce7f3', color: '#db2777' }}>
                                <BarChart3 size={24} />
                            </div>
                            <h3>Analisis Pelanggan</h3>
                            <p>Segmentasi pelanggan berdasarkan frekuensi beli, nilai transaksi, dan produk favorit.</p>
                        </div>
                    </div>

                    <div className="roadmap-cta reveal">
                        <p>Ada ide fitur yang Anda butuhkan?</p>
                        <a href="https://wa.me/6287782697973?text=Halo%2C%20saya%20punya%20usulan%20fitur%20untuk%20Rekapan%20Mitra"
                            target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                            <MessageCircle size={16} /> Usulkan Fitur via WA
                        </a>
                    </div>
                </div>
            </section>

            {/* ════ FAQ ════ */}
            <section className="section" id="faq">
                <div className="section-inner text-center">
                    <span className="section-label reveal">FAQ</span>
                    <h2 className="section-title reveal">Pertanyaan yang Sering Diajukan</h2>
                    <div className="faq-list" style={{ textAlign: 'left' }}>
                        {[
                            {
                                q: 'Apakah aplikasi ini benar-benar gratis?',
                                a: 'Ya, Rekapan Mitra sepenuhnya gratis untuk semua level mitra — dari Reseller hingga Special Entrepreneur (SE). Tidak ada biaya langganan, tidak ada fitur berbayar, tidak ada batasan waktu.'
                            },
                            {
                                q: 'Bagaimana harga modal dihitung otomatis?',
                                a: 'Harga modal otomatis menyesuaikan berdasarkan level mitra Anda. Contoh: Reseller Rp 216rb/btl, Agen Rp 198rb, Agen Plus Rp 180rb, SAP Rp 170rb, SE Rp 150rb. Anda juga bisa membuat level harga kustom sendiri.'
                            },
                            {
                                q: 'Apakah bisa diakses dari HP tanpa install?',
                                a: 'Tentu. Rekapan Mitra adalah Progressive Web App (PWA) yang dioptimalkan untuk mobile. Anda bisa mengaksesnya langsung dari browser dan menambahkannya ke home screen seperti aplikasi biasa — tanpa perlu download dari App Store.'
                            },
                            {
                                q: 'Apa itu Toko Online Publik?',
                                a: 'Setiap mitra mendapat link toko unik yang bisa dibagikan ke pelanggan. Pelanggan bisa melihat produk dan langsung membuat pesanan tanpa harus chat di WhatsApp — hemat waktu Anda dan mempermudah pelanggan.'
                            },
                            {
                                q: 'Apakah data bisnis saya aman?',
                                a: 'Ya, data tersimpan di cloud dengan enkripsi penuh dan Row Level Security (Supabase). Hanya Anda yang bisa mengakses data bisnis Anda sendiri. Tidak ada yang bisa melihat data mitra lain.'
                            },
                            {
                                q: 'Bagaimana cara mulai menggunakannya?',
                                a: 'Sangat mudah. Klik tombol "Coba Gratis", buat akun dengan email, pilih level mitra Anda, dan langsung mulai catat pesanan pertama Anda. Seluruh proses tidak lebih dari 5 menit.'
                            },
                        ].map((item, i) => (
                            <div key={i} className={`faq-item ${activeFaq === i ? 'open' : ''}`}>
                                <button className="faq-q" onClick={() => toggleFaq(i)}>
                                    {item.q}
                                    <i className="faq-chevron">
                                        <ChevronDown className="icon" size={18} />
                                    </i>
                                </button>
                                <div className="faq-a"><p>{item.a}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════ CTA SECTION ════ */}
            <section className="cta-section" id="daftar">
                <div className="hc-bg" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                        <defs>
                            <pattern id="hc2" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
                                <polygon points="14,2 42,2 56,24 42,46 14,46 0,24"
                                    fill="none" stroke="#ffffff" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#hc2)" />
                    </svg>
                </div>
                <div className="section-inner">
                    <h2 className="reveal">Siap Kelola Bisnis Anda<br />Lebih Profesional?</h2>
                    <p className="reveal">
                        Jadilah pengguna pertama Rekapan Mitra. Coba gratis, tanpa kartu kredit, tanpa komitmen
                        — dan bantu kami berkembang dengan feedback Anda.
                    </p>
                    <div className="cta-btns reveal">
                        <Link to="/dashboard" className="btn btn-primary btn-large">
                            <Rocket className="icon" size={18} /> Coba Gratis Sekarang
                        </Link>
                        <a href="https://wa.me/6287782697973?text=Halo%2C%20saya%20mau%20coba%20Rekapan%20Mitra"
                            target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-large">
                            <MessageCircle className="icon" size={18} /> Tanya via WhatsApp
                        </a>
                    </div>
                </div>
            </section>

            {/* ════ FOOTER ════ */}
            <div className="footer-main">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <div className="nav-logo" style={{ marginBottom: '.75rem', color: 'white' }}>
                            <img src="/pwa-192x192.png" alt="Logo"
                                style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '6px' }} />
                            Rekapan <span style={{ color: 'white' }}>Mitra</span>
                        </div>
                        <p>Aplikasi pencatatan bisnis untuk mitra dan reseller. Pantau keuntungan, stok, pesanan,
                            dan pelanggan dalam satu genggaman.</p>
                        <p style={{ marginTop: '.75rem', fontSize: '.8rem' }}>
                            Made with <Heart className="icon icon-sm" style={{ color: '#ef4444' }} size={14} /> in Indonesia
                        </p>
                    </div>
                    <div className="footer-col">
                        <h4>Menu</h4>
                        <a href="#masalah">Masalah</a>
                        <a href="#cara-kerja">Cara Kerja</a>
                        <a href="#fitur">Fitur</a>
                        <a href="#manfaat">Manfaat</a>
                        <a href="#founder">Tim</a>
                        <a href="#roadmap">Roadmap</a>
                        <a href="#faq">FAQ</a>
                    </div>
                    <div className="footer-col">
                        <h4>Kontak &amp; Bantuan</h4>
                        <a href="https://wa.me/6287782697973" target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="icon" size={18} /> Chat WhatsApp
                        </a>
                        <a href="mailto:hello@rekapanmitra.id">
                            <Mail className="icon" size={18} /> Email Kami
                        </a>
                        <Link to="/dashboard">
                            <Rocket className="icon" size={18} /> Coba Gratis
                        </Link>
                        <a href="/login">
                            <Lock className="icon" size={18} /> Login
                        </a>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                &copy; 2026 Rekapan Mitra &middot; Hak Cipta Dilindungi &middot;{' '}
                <a href="/privasi" style={{ color: '#059669' }}>Kebijakan Privasi</a>
            </div>

        </div>
    );
}
