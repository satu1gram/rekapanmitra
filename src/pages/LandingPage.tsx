import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '@/styles/landing.css';
import { Rocket, MessageCircle, FileEdit, Settings, Sparkles, MessageSquareQuote, CircleHelp, Bell, Package, Wallet, Users, Calculator, BarChart3, Store, Check, Star, ChevronDown, Heart, Mail, Lock, TrendingUp, ShoppingCart, Target, ChevronRight, BadgeCheck } from 'lucide-react';


export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        // Reveal animation observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        const revealElements = document.querySelectorAll('.reveal');
        revealElements.forEach(el => observer.observe(el));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            revealElements.forEach(el => observer.unobserve(el));
        };
    }, []);

    const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const toggleFaq = (index: number) => setActiveFaq(activeFaq === index ? null : index);

    return (
        <div className="landing-page-wrapper relative">


            {/*  ════ STICKY MOBILE CTA ════  */}
            <div className="sticky-cta" id="stickyCta">
                <a href="#daftar" className="btn btn-primary"><Rocket className="icon" size={18} /> Daftar Gratis</a>
                <a href="https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20Rekapan%20Mitra"
                    target="_blank" className="btn btn-wa"><MessageCircle className="icon" size={18} /> Chat WA</a>
            </div>

            {/*  ════ NAV ════  */}
            <nav className={`nav ${scrolled ? "scrolled" : ""}`} id="nav">
                <div className="nav-inner">
                    <a href="#" className="nav-logo">
                        {/* 
          LOGO PLACEHOLDER
          Ganti div.logo-placeholder dengan:
          <img src="/icon-rekapan-mitra.png" alt="Logo" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
         */}
                        <img src="/pwa-192x192.png" alt="Logo" style={{ width: '34px', height: '34px', objectFit: 'contain', borderRadius: '8px' }} />
                        Rekapan <span>Mitra</span>
                    </a>
                    <div className="nav-links">
                        <a href="#masalah">Masalah</a>
                        <a href="#cara-kerja">Cara Kerja</a>
                        <a href="#fitur">Fitur</a>
                        <a href="#faq">FAQ</a>
                        <a href="https://wa.me/6281234567890" target="_blank" className="btn btn-wa"
                            style={{ padding: '.6rem 1.2rem', fontSize: '.8125rem' }}><MessageCircle className="icon" size={18} /> Chat WA</a>
                        <a href="#daftar" className="btn btn-primary" style={{ padding: '.6rem 1.25rem', fontSize: '.8125rem' }}>Daftar
                            Sekarang</a>
                    </div>
                    <button className={`nav-hamburger ${mobileMenuOpen ? "open" : ""}`} id="hamburger" onClick={toggleMenu} aria-label="Menu">
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </nav>

            {/*  ════ MOBILE MENU ════  */}
            <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`} id="mobileMenu" onClick={toggleMenu}>
                <a href="#masalah" className="mobile-link"><FileEdit className="icon" size={18} /> Masalah</a>
                <a href="#cara-kerja" className="mobile-link"><Settings className="icon" size={18} /> Cara Kerja</a>
                <a href="#fitur" className="mobile-link"><Sparkles className="icon" size={18} /> Fitur</a>
                <a href="#testimoni" className="mobile-link"><MessageSquareQuote className="icon" size={18} /> Testimoni</a>
                <a href="#faq" className="mobile-link"><CircleHelp className="icon" size={18} /> FAQ</a>

                {/* Hanya satu tombol Chat via WA sesuai permintaan */}
                <a href="https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20Rekapan%20Mitra"
                    target="_blank" className="mobile-wa" style={{ marginTop: 'auto' }}><MessageCircle className="icon" size={18} /> Chat via WhatsApp</a>
            </div>

            {/*  ════ HERO ════  */}
            <section className="hero" id="hero">
                {/*  Honeycomb texture  */}
                <div className="hc-bg" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                        <defs>
                            <pattern id="hc" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
                                <polygon points="14,2 42,2 56,24 42,46 14,46 0,24" fill="none" stroke="#059669"
                                    strokeWidth="1.2" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#hc)" />
                    </svg>
                </div>

                <div className="hero-inner">
                    <div>
                        <div className="hero-badge"><span className="dot"></span> 100% Gratis &middot; Aktif Sekarang</div>
                        <h1>Kelola Bisnis Anda dalam <em>Satu Genggaman</em></h1>
                        <p>Pantau keuntungan real-time, catat pesanan, kelola stok, dan bangun jaringan pelanggan — semua dari
                            HP Anda. Tanpa ribet, tanpa lembar Excel.</p>
                        <div className="hero-cta">
                            <a href="#daftar" className="btn btn-primary btn-large"><Rocket className="icon" size={18} /> Mulai
                                Sekarang — Gratis</a>
                            <a href="#cara-kerja" className="btn btn-outline btn-large">Lihat Cara Kerja</a>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="hero-mockup">
                            <div className="hero-screen">
                                <img
                                    src="/dashboard-mockup-real.png"
                                    alt="Rekapan Mitra Dashboard"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="float-badge float-1">
                            <div className="float-icon" style={{ background: '#d1fae5', color: '#059669' }}><Package
                                className="icon" size={18} /></div>
                            Stok: 19 item
                        </div>
                        <div className="float-badge float-2">
                            <div className="float-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Wallet className="icon" size={18} />
                            </div>
                            +Rp 100rb/btl
                        </div>
                        <div className="float-badge float-3">
                            <div className="float-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}><Users className="icon" size={18} />
                            </div>
                            10 pelanggan
                        </div>
                    </div>
                </div>
            </section>

            {/*  ════ TRUST STATS BAR ════  */}
            <div className="stats-bar">
                <div className="stats-bar-inner">
                    <div className="stat-item reveal">
                        <div className="stat-num">500+</div>
                        <div className="stat-desc">Mitra Aktif</div>
                    </div>
                    <div className="stat-item reveal">
                        <div className="stat-num">2+ Jam</div>
                        <div className="stat-desc">Hemat per Hari</div>
                    </div>
                    <div className="stat-item reveal">
                        <div className="stat-num">100%</div>
                        <div className="stat-desc">Gratis Selamanya</div>
                    </div>
                    <div className="stat-item reveal">
                        <div className="stat-num">PWA</div>
                        <div className="stat-desc">Bisa Dipasang di HP</div>
                    </div>
                </div>
            </div>

            {/*  ════ PAIN POINTS ════  */}
            <section className="section pain" id="masalah">
                <div className="section-inner text-center">
                    <span className="section-label reveal">Masalah Umum</span>
                    <h2 className="section-title reveal">Masih Catat Penjualan di Buku atau WA?</h2>
                    <p className="section-desc mx-auto reveal">Banyak mitra yang menghadapi masalah ini setiap hari. Rekapan Mitra
                        hadir sebagai solusinya.</p>
                    <div className="pain-grid">
                        <div className="pain-card reveal">
                            <div className="pain-icon" style={{ background: '#fef2f2' }}><FileEdit className="icon icon-xl" size={28} /></div>
                            <h3>Catatan Berantakan</h3>
                            <p>Pesanan tersebar di WhatsApp, buku catatan, dan notes HP yang tercecer. Sulit melacak siapa pesan
                                apa dan kapan.</p>
                        </div>
                        <div className="pain-card reveal">
                            <div className="pain-icon" style={{ background: '#fefce8' }}><Calculator className="icon icon-xl" size={28} /></div>
                            <h3>Bingung Hitung Margin</h3>
                            <p>Harga modal berbeda tiap level mitra, margin per botol berubah-ubah. Salah hitung = rugi tanpa
                                disadari.</p>
                        </div>
                        <div className="pain-card reveal">
                            <div className="pain-icon" style={{ background: '#eff6ff' }}><BarChart3 className="icon icon-xl" size={28} /></div>
                            <h3>Tidak Tahu Untung Rugi</h3>
                            <p>Di akhir bulan baru sadar uangnya habis ke mana. Tidak ada laporan keuntungan yang jelas dan
                                real-time.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/*  ════ HOW IT WORKS ════  */}
            <section className="section" id="cara-kerja">
                <div className="section-inner text-center">
                    <span className="section-label reveal">Cara Kerja</span>
                    <h2 className="section-title reveal">3 Langkah Mulai Untung Lebih Terukur</h2>
                    <p className="section-desc mx-auto reveal">Tidak perlu keahlian teknis. Dalam hitungan menit, bisnis Anda sudah
                        terdigitalisasi.</p>
                    <div className="steps-grid">
                        <div className="step-card reveal">
                            <div className="step-num">1</div>
                            <h3>Daftar &amp; Setup Toko</h3>
                            <p>Buat akun gratis, pilih level mitra Anda, dan setup toko online publik dalam hitungan menit.</p>
                            <span className="step-arrow">→</span>
                        </div>
                        <div className="step-card reveal">
                            <div className="step-num">2</div>
                            <h3>Catat Pesanan &amp; Stok</h3>
                            <p>Tambah order baru, restok barang, dan sistem otomatis hitung margin keuntungan per transaksi.</p>
                            <span className="step-arrow">→</span>
                        </div>
                        <div className="step-card reveal">
                            <div className="step-num">3</div>
                            <h3>Pantau Keuntungan</h3>
                            <p>Dashboard real-time menampilkan omset, profit, target bulanan, dan pertumbuhan pelanggan Anda.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/*  ════ FEATURES ════  */}
            <section className="section features" id="fitur">
                <div className="section-inner text-center">
                    <span className="section-label reveal">Fitur Unggulan</span>
                    <h2 className="section-title reveal">Semua yang Anda Butuhkan, dalam Satu Aplikasi</h2>
                    <div className="feat-grid">
                        <div className="feat-card reveal">
                            <div className="feat-icon" style={{ background: '#d1fae5', color: '#059669' }}><TrendingUp
                                className="icon icon-xl" size={28} /></div>
                            <h3>Dashboard Keuntungan</h3>
                            <p>Lihat total keuntungan, omset, dan jumlah terjual dalam satu layar. Bandingkan performa antar
                                bulan.</p>
                        </div>
                        <div className="feat-card reveal">
                            <div className="feat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><ShoppingCart
                                className="icon icon-xl" size={28} /></div>
                            <h3>Manajemen Order</h3>
                            <p>Catat pesanan dengan harga tier otomatis. Margin terhitung langsung berdasarkan level mitra Anda.
                            </p>
                        </div>
                        <div className="feat-card reveal">
                            <div className="feat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Package
                                className="icon icon-xl" size={28} /></div>
                            <h3>Tracking Stok Real-time</h3>
                            <p>Pantau stok masuk-keluar, notifikasi stok rendah, dan histori lengkap setiap pergerakan barang.
                            </p>
                        </div>
                        <div className="feat-card reveal">
                            <div className="feat-icon" style={{ background: '#fce7f3', color: '#db2777' }}><Users
                                className="icon icon-xl" size={28} /></div>
                            <h3>Manajemen Pelanggan</h3>
                            <p>Database pelanggan lengkap dengan histori transaksi. Kenali pelanggan setia Anda dengan mudah.
                            </p>
                        </div>
                        <div className="feat-card reveal">
                            <div className="feat-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}><Target
                                className="icon icon-xl" size={28} /></div>
                            <h3>Target Bulanan</h3>
                            <p>Atur target profit, kuantitas, dan stok tiap bulan. Lacak progress menuju pencahaian Anda.</p>
                        </div>
                        <div className="feat-card reveal">
                            <div className="feat-icon" style={{ background: '#ccfbf1', color: '#0d9488' }}><Store
                                className="icon icon-xl" size={28} /></div>
                            <h3>Toko Online Publik</h3>
                            <p>Punya link toko sendiri yang bisa dibagikan. Pelanggan order langsung tanpa perlu chat WA.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/*  ════ BENEFITS ════  */}
            <section className="section" id="manfaat">
                <div className="section-inner text-center">
                    <span className="section-label reveal">Kenapa Rekapan Mitra?</span>
                    <h2 className="section-title reveal">Bisnis Lebih Terukur, Keuntungan Lebih Jelas</h2>
                    <div className="benefits-grid" style={{ textAlign: 'left' }}>
                        <div className="benefit reveal">
                            <div className="benefit-check"><Check className="icon" size={18} /></div>
                            <div>
                                <h3>Tahu Untung Setiap Saat</h3>
                                <p>Margin per botol dihitung otomatis sesuai level mitra. Tidak perlu kalkulator lagi.</p>
                            </div>
                        </div>
                        <div className="benefit reveal">
                            <div className="benefit-check"><Check className="icon" size={18} /></div>
                            <div>
                                <h3>Hemat Waktu 2+ Jam/Hari</h3>
                                <p>Tidak perlu rekap manual di buku atau Excel. Semua tercatat otomatis per transaksi.</p>
                            </div>
                        </div>
                        <div className="benefit reveal">
                            <div className="benefit-check"><Check className="icon" size={18} /></div>
                            <div>
                                <h3>Stok Tidak Pernah Telat</h3>
                                <p>Peringatan stok rendah memastikan Anda restok sebelum kehabisan. Peluang jualan tidak
                                    terlewat.</p>
                            </div>
                        </div>
                        <div className="benefit reveal">
                            <div className="benefit-check"><Check className="icon" size={18} /></div>
                            <div>
                                <h3>Pelanggan Lebih Terkelola</h3>
                                <p>Database pelanggan lengkap dengan riwayat transaksi. Tahu siapa pelanggan setia Anda.</p>
                            </div>
                        </div>
                        <div className="benefit reveal">
                            <div className="benefit-check"><Check className="icon" size={18} /></div>
                            <div>
                                <h3>Toko Online Tanpa Ribet</h3>
                                <p>Link toko bisa langsung dibagikan ke sosial media. Pelanggan pesan sendiri — efisien!</p>
                            </div>
                        </div>
                        <div className="benefit reveal">
                            <div className="benefit-check"><Check className="icon" size={18} /></div>
                            <div>
                                <h3>Gratis Sepenuhnya</h3>
                                <p>Tidak ada biaya langganan. Semua fitur tersedia gratis untuk seluruh level mitra BP.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/*  ════ TESTIMONIALS ════  */}
            <section className="section testi" id="testimoni">
                <div className="section-inner text-center">
                    <span className="section-label reveal">Testimoni</span>
                    <h2 className="section-title reveal">Dipercaya oleh Mitra di Seluruh Indonesia</h2>
                    <p className="section-desc mx-auto reveal">Bergabunglah dengan ratusan mitra BP yang sudah merasakan manfaatnya.
                    </p>
                    <div className="testi-grid">
                        <div className="testi-card reveal">
                            <div className="testi-stars"><Star className="icon" size={18} /><Star className="icon" size={18} /><Star
                                className="icon" size={18} /><Star className="icon" size={18} /><Star className="icon" size={18} /></div>
                            <blockquote>"Sekarang saya bisa tahu untung per botol langsung tanpa hitung manual. Sangat membantu
                                banget, ga perlu buka Excel lagi!"</blockquote>
                            <div className="testi-author">
                                <div className="testi-avatar">A</div>
                                <div>
                                    <div className="testi-name">Agen Plus — Malang</div>
                                    <div className="testi-role">Mitra sejak 2024</div>
                                </div>
                            </div>
                            <span className="testi-badge">
                                <BadgeCheck className="icon icon-sm" style={{ color: 'var(--green)' }} /> Terverifikasi
                            </span>
                        </div>
                        <div className="testi-card reveal">
                            <div className="testi-stars"><Star className="icon" size={18} /><Star className="icon" size={18} /><Star
                                className="icon" size={18} /><Star className="icon" size={18} /><Star className="icon" size={18} /></div>
                            <blockquote>"Toko online-nya keren! Pelanggan bisa order sendiri, saya tinggal proses. Hemat waktu
                                banget dan omset naik."</blockquote>
                            <div className="testi-author">
                                <div className="testi-avatar">S</div>
                                <div>
                                    <div className="testi-name">SAP — Surabaya</div>
                                    <div className="testi-role">Mitra sejak 2023</div>
                                </div>
                            </div>
                            <span className="testi-badge">
                                <BadgeCheck className="icon icon-sm" style={{ color: 'var(--green)' }} /> Terverifikasi
                            </span>
                        </div>
                        <div className="testi-card reveal">
                            <div className="testi-stars"><Star className="icon" size={18} /><Star className="icon" size={18} /><Star
                                className="icon" size={18} /><Star className="icon" size={18} /><Star className="icon" size={18} /></div>
                            <blockquote>"Dulu sering kehabisan stok tanpa sadar. Sekarang ada notifikasi stok rendah, jualan
                                jadi lancar terus."</blockquote>
                            <div className="testi-author">
                                <div className="testi-avatar">R</div>
                                <div>
                                    <div className="testi-name">Reseller — Jakarta</div>
                                    <div className="testi-role">Mitra sejak 2024</div>
                                </div>
                            </div>
                            <span className="testi-badge">
                                <BadgeCheck className="icon icon-sm" style={{ color: 'var(--green)' }} /> Terverifikasi
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/*  ════ FAQ ════  */}
            <section className="section" id="faq">
                <div className="section-inner text-center">
                    <span className="section-label reveal">FAQ</span>
                    <h2 className="section-title reveal">Pertanyaan yang Sering Diajukan</h2>
                    <div className="faq-list" style={{ textAlign: 'left' }}>
                        <div className={`faq-item ${activeFaq === 0 ? "open" : ""}`}>
                            <button className="faq-q" onClick={() => toggleFaq(0)}>Apakah aplikasi ini benar-benar gratis? <i className="faq-chevron"><ChevronDown
                                className="icon" size={18} /></i></button>
                            <div className="faq-a">
                                <p>Ya, Rekapan Mitra sepenuhnya gratis untuk semua level mitra — dari Reseller hingga Special
                                    Entrepreneur (SE). Tidak ada biaya langganan, tidak ada fitur berbayar.</p>
                            </div>
                        </div>
                        <div className={`faq-item ${activeFaq === 1 ? "open" : ""}`}>
                            <button className="faq-q" onClick={() => toggleFaq(1)}>Bagaimana harga modal dihitung otomatis? <i className="faq-chevron"><ChevronDown
                                className="icon" size={18} /></i></button>
                            <div className="faq-a">
                                <p>Harga modal otomatis menyesuaikan berdasarkan level mitra Anda. Contoh: Reseller Rp
                                    217rb/btl, Agen Rp 198rb, Agen Plus Rp 180rb, SAP Rp 170rb, SE Rp 150rb. Anda juga bisa
                                    membuat level harga kustom sendiri.</p>
                            </div>
                        </div>
                        <div className={`faq-item ${activeFaq === 2 ? "open" : ""}`}>
                            <button className="faq-q" onClick={() => toggleFaq(2)}>Apakah bisa diakses dari HP tanpa install? <i className="faq-chevron"><ChevronDown
                                className="icon" size={18} /></i></button>
                            <div className="faq-a">
                                <p>Tentu! Rekapan Mitra adalah Progressive Web App (PWA) yang dioptimalkan untuk mobile. Anda
                                    bisa mengaksesnya langsung dari browser dan menambahkannya ke home screen seperti aplikasi
                                    biasa tanpa perlu download dari App Store.</p>
                            </div>
                        </div>
                        <div className={`faq-item ${activeFaq === 3 ? "open" : ""}`}>
                            <button className="faq-q" onClick={() => toggleFaq(3)}>Apa itu Toko Online Publik? <i className="faq-chevron"><ChevronDown
                                className="icon" size={18} /></i></button>
                            <div className="faq-a">
                                <p>Setiap mitra mendapat link toko unik yang bisa dibagikan ke pelanggan. Pelanggan bisa melihat
                                    produk dan langsung membuat pesanan tanpa harus chat di WhatsApp — hemat waktu Anda dan
                                    mempermudah pelanggan.</p>
                            </div>
                        </div>
                        <div className={`faq-item ${activeFaq === 4 ? "open" : ""}`}>
                            <button className="faq-q" onClick={() => toggleFaq(4)}>Apakah data bisnis saya aman? <i className="faq-chevron"><ChevronDown
                                className="icon" size={18} /></i></button>
                            <div className="faq-a">
                                <p>Ya, data tersimpan di cloud (Supabase) dengan enkripsi penuh dan Row Level Security. Hanya
                                    Anda yang bisa mengakses data bisnis Anda sendiri. Tidak ada yang bisa melihat data mitra
                                    lain.</p>
                            </div>
                        </div>
                        <div className={`faq-item ${activeFaq === 5 ? "open" : ""}`}>
                            <button className="faq-q" onClick={() => toggleFaq(5)}>Bagaimana cara mulai menggunakannya? <i className="faq-chevron"><ChevronDown
                                className="icon" size={18} /></i></button>
                            <div className="faq-a">
                                <p>Sangat mudah! Klik tombol "Daftar Sekarang", buat akun dengan email, pilih level mitra Anda,
                                    dan langsung mulai catat pesanan pertama Anda. Seluruh proses tidak lebih dari 5 menit.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/*  ════ CTA SECTION ════  */}
            <section className="cta-section" id="daftar">
                {/*  Honeycomb texture  */}
                <div className="hc-bg" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                        <defs>
                            <pattern id="hc2" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
                                <polygon points="14,2 42,2 56,24 42,46 14,46 0,24" fill="none" stroke="#ffffff"
                                    strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#hc2)" />
                    </svg>
                </div>
                <div className="section-inner">
                    <h2 className="reveal">Siap Kelola Bisnis Anda<br />Lebih Profesional?</h2>
                    <p className="reveal">Bergabung dengan 500+ mitra yang sudah menggunakan Rekapan Mitra untuk memaksimalkan
                        keuntungan mereka. Gratis, cepat, langsung dari HP.</p>
                    <div className="cta-btns reveal">
                        <a href="/login" className="btn btn-primary btn-large"><Rocket className="icon" size={18} /> Daftar
                            Sekarang — Gratis!</a>
                        <a href="https://wa.me/6281234567890?text=Halo%2C%20saya%20mau%20daftar%20Rekapan%20Mitra"
                            target="_blank" className="btn btn-wa btn-large"><MessageCircle className="icon" size={18} /> Tanya via WhatsApp</a>
                    </div>
                </div>
            </section>

            {/*  ════ FOOTER ════  */}
            <div className="footer-main">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <div className="nav-logo" style={{ marginBottom: '.75rem', color: 'white' }}>
                            <img src="/pwa-192x192.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '6px' }} />
                            Rekapan <span style={{ color: 'white' }}>Mitra</span>
                        </div>
                        <p>Aplikasi manajemen bisnis mitra reseller herbal. Pantau keuntungan, stok, pesanan, dan pelanggan
                            dalam satu genggaman.</p>
                        <p style={{ marginTop: '.75rem', fontSize: '.8rem' }}>Made with <Heart className="icon icon-sm"
                            style={{ color: '#ef4444', fontVariationSettings: '\'FILL\' 1' }} size={14} /> in Malang, Indonesia</p>
                    </div>
                    <div className="footer-col">
                        <h4>Menu</h4>
                        <a href="#masalah">Masalah</a>
                        <a href="#cara-kerja">Cara Kerja</a>
                        <a href="#fitur">Fitur</a>
                        <a href="#manfaat">Manfaat</a>
                        <a href="#testimoni">Testimoni</a>
                        <a href="#faq">FAQ</a>
                    </div>
                    <div className="footer-col">
                        <h4>Kontak &amp; Bantuan</h4>
                        <a href="https://wa.me/6281234567890" target="_blank"><MessageCircle className="icon" size={18} /> Chat WhatsApp</a>
                        <a href="mailto:hello@rekapanmitra.id"><Mail className="icon" size={18} /> Email Kami</a>
                        <a href="#daftar"><Rocket className="icon" size={18} /> Daftar Gratis</a>
                        <a href="/login"><Lock className="icon" size={18} /> Login</a>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                © 2026 Rekapan Mitra · Hak Cipta Dilindungi · <a href="/privasi" style={{ color: '#059669' }}>Kebijakan Privasi</a>
            </div>




        </div>
    );
}
