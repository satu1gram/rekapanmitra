import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '@/styles/katalog.css';
import '@/styles/ai-advisor.css';
import { KATALOG_PRODUCTS } from '@/data/katalogProducts';
import { TestimoniSection } from '@/components/TestimoniSection';

export default function KatalogProdukPage() {
    const [activeCategory, setActiveCategory] = useState('all');

    useEffect(() => {
        window.scrollTo(0, 0);

        // Fade in animation observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, { threshold: 0.1 });

        const fadeElements = document.querySelectorAll('.fade-in');
        fadeElements.forEach(el => observer.observe(el));

        return () => {
            fadeElements.forEach(el => observer.unobserve(el));
        };
    }, []);

    // Helper to generate dynamic link
    const getOrderLink = (waText: string) => {
        const finalMessage = waText || "Halo kak, saya mau konsultasi produk Quantum Millionaire";
        return `https://wa.me/6287782697973?text=${encodeURIComponent(finalMessage)}`;
    };

    return (
        <div className="katalog-page-wrapper">

            {/*  NAV  */}
            <nav>
                <div className="nav-logo-wrap">
                    <Link to="/katalog" className="nav-logo">
                        <img
                            src="/images/qm-logo.webp"
                            alt="Quantum Millionaire"
                            style={{ height: '50px', width: 'auto', display: 'block', minWidth: '100px', background: 'transparent' }}
                            onError={(e) => {
                                console.error('Logo failed to load');
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML += '<span style="font-weight: bold; color: var(--green-dark)">Quantum Millionaire</span>';
                            }}
                        />
                    </Link>
                </div>

                {/* Desktop Menu */}
                <ul className="nav-links desktop-only">
                    <li><Link to="/ai-advisor">Konsultasi AI</Link></li>
                    <li><a href="#produk">Produk</a></li>
                    <li><a href="#tentang">Tentang</a></li>
                </ul>
                <div className="nav-right desktop-only">
                    <a href="https://wa.me/6287782697973" target="_blank" rel="noopener noreferrer" className="nav-cta"><span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '6px', verticalAlign: 'bottom' }}>chat</span> Hubungi Kami</a>
                </div>

                {/* Mobile Right Controls */}
                <div className="mobile-controls mobile-only">
                    <a href="https://wa.me/6287782697973" target="_blank" rel="noopener noreferrer" className="btn-wa-sm"><span className="material-symbols-rounded">chat</span> WA</a>
                    <button className="hamburger-btn">
                        <span className="line"></span>
                        <span className="line"></span>
                        <span className="line"></span>
                    </button>
                </div>
            </nav>

            {/*  AI ADVISOR CTA  */}
            <div className="ai-cta-section">
                <div className="container">
                    <div className="ai-cta-card fade-in">
                        <div className="ai-cta-left">
                            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200
                                            rounded-full px-4 py-1.5 mb-4 w-fit">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full
                                                    rounded-full bg-[#3D7A4F] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3D7A4F]" />
                                </span>
                                <span className="text-xs font-bold text-[#3D7A4F] tracking-widest uppercase">
                                    AI Health Advisor
                                </span>
                                <span className="text-xs text-gray-400">·</span>
                                <span className="text-xs text-gray-500">Gratis</span>
                            </div>
                            <h2 className="ai-cta-title">
                                Butuh <em>Saran Kesehatan Personal?</em>
                            </h2>
                            <p className="ai-cta-desc">
                                Ceritakan Keluhanmu dan dapatkan rekomendasi produk yang tepat
                                dengan AI Advisor kami yang sudah membantu ribuan orang.
                            </p>
                        </div>
                        <div className="ai-cta-right">
                            <Link 
                                to="/ai-advisor" 
                                className="btn-ai-advisor"
                            >
                                <span className="material-symbols-rounded" style={{ fontSize: '24px', marginRight: '8px' }}>health_and_safety</span>
                                Mulai Konsultasi AI
                            </Link>
                            <div className="ai-cta-features">
                                <div className="feature-item">
                                    <span className="material-symbols-rounded">psychology</span>
                                    <span>Analisis Cerdas</span>
                                </div>
                                <div className="feature-item">
                                    <span className="material-symbols-rounded">medical_information</span>
                                    <span>Rekomendasi Akurat</span>
                                </div>
                                <div className="feature-item">
                                    <span className="material-symbols-rounded">support_agent</span>
                                    <span>Gratis & Privasi</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/*  TRUST BAR  */}
            <div className="trust-bar">
                <div className="trust-item"><span className="material-symbols-rounded icon" style={{ fontSize: '18px' }}>verified_user</span> BADAN POM Terdaftar</div>
                <div className="trust-sep"></div>
                <div className="trust-item"><span className="material-symbols-rounded icon" style={{ fontSize: '18px' }}>verified</span> Halal MUI</div>
                <div className="trust-sep"></div>
                <div className="trust-item"><span className="material-symbols-rounded icon" style={{ fontSize: '18px' }}>eco</span> 100% Bahan Alami</div>
                <div className="trust-sep"></div>
                <div className="trust-item"><span className="material-symbols-rounded icon" style={{ fontSize: '18px' }}>public</span> Standar Internasional</div>
                <div className="trust-sep"></div>
                <div className="trust-item"><span className="material-symbols-rounded icon" style={{ fontSize: '18px' }}>local_shipping</span> Kirim Seluruh Indonesia</div>
            </div>

            {/*  BRAND HERO  */}
            <div className="brand-hero">
                <div className="brand-hero-left fade-in">
                    <span className="section-tag">Quantum Millionaire Community</span>
                    <h2 className="brand-title">Healthy Living <em>Guide</em></h2>
                    <p className="brand-desc">Panduan hidup sehat sekaligus terawat. Semua produk Quantum Millionaire dipilih dari bahan
                        alami terbaik dunia, diproses halal, dan teruji BPOM.</p>
                    <div className="brand-stats">
                        <div><span className="bstat-num">12+</span>
                            <div className="bstat-label">Produk Unggulan</div>
                        </div>
                        <div><span className="bstat-num">100%</span>
                            <div className="bstat-label">Halal & BPOM</div>
                        </div>
                        <div><span className="bstat-num">2018</span>
                            <div className="bstat-label">Berdiri Sejak</div>
                        </div>
                    </div>
                </div>
                <div className="brand-hero-right fade-in">
                    <div className="brand-img-grid ingredient-grid">
                        <div className="brand-img-card ingredient-card">
                            <img src="/images/katalog/propolis-400.webp" alt="British Propolis" className="ingredient-img" />
                            <div className="ingredient-info">
                                <span className="title">British Propolis</span>
                                <span className="desc">100% Ekstrak Asli Inggris</span>
                            </div>
                        </div>
                        <div className="brand-img-card ingredient-card">
                            <img src="/images/katalog/moringa-400.webp" alt="Moringa Oleifera" className="ingredient-img" />
                            <div className="ingredient-info">
                                <span className="title">Moringa Oleifera</span>
                                <span className="desc">Superfood Anti Inflamasi</span>
                            </div>
                        </div>
                        <div className="brand-img-card ingredient-card">
                            <img src="/images/katalog/salmon-400.webp" alt="Salmon Omega-3" className="ingredient-img" />
                            <div className="ingredient-info">
                                <span className="title">Salmon Omega-3</span>
                                <span className="desc">Tinggi DHA dari Norwegia</span>
                            </div>
                        </div>
                        <div className="brand-img-card ingredient-card">
                            <img src="/images/katalog/collagen-400.webp" alt="Marine Collagen" className="ingredient-img" />
                            <div className="ingredient-info">
                                <span className="title">Marine Collagen</span>
                                <span className="desc">Anti Aging Alami</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/*  HOW IT WORKS  */}
            <section className="how-section" id="cara-kerja">
                <div className="container">
                    <div className="section-head fade-in">
                        <span className="tag">Cara Kerja</span>
                        <h2>4 Langkah Menuju Hidup Sehat</h2>
                        <p>Mulai perjalanan hidupmu yang lebih sehat dengan langkah sederhana bersama Quantum Millionaire.</p>
                    </div>
                    <div className="steps-grid">
                        <div className="step-item fade-in">
                            <div className="step-circle"><span className="material-symbols-rounded" style={{ color: 'var(--green-dark)' }}>search</span><span className="step-num">1</span></div>
                            <div>
                                <div className="step-name">Kenali</div>
                                <p className="step-desc">Ceritakan kondisi & Keluhan kesehatanmu kepada AI Advisor kami.</p>
                            </div>
                        </div>
                        <div className="step-item fade-in">
                            <div className="step-circle"><span className="material-symbols-rounded" style={{ color: 'var(--green-dark)' }}>eco</span><span className="step-num">2</span></div>
                            <div>
                                <div className="step-name">Pahami</div>
                                <p className="step-desc">Dapatkan panduan gaya hidup sehat yang tepat sesuai kondisimu.</p>
                            </div>
                        </div>
                        <div className="step-item fade-in">
                            <div className="step-circle"><span className="material-symbols-rounded" style={{ color: 'var(--green-dark)' }}>shield</span><span className="step-num">3</span></div>
                            <div>
                                <div className="step-name">Konsumsi</div>
                                <p className="step-desc">Gunakan produk alami Quantum Millionaire yang direkomendasikan secara rutin.</p>
                            </div>
                        </div>
                        <div className="step-item fade-in">
                            <div className="step-circle"><span className="material-symbols-rounded" style={{ color: 'var(--green-dark)' }}>favorite</span><span className="step-num">4</span></div>
                            <div>
                                <div className="step-name">Rasakan</div>
                                <p className="step-desc">Nikmati perubahan positif — tubuh lebih sehat, energi lebih optimal.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/*  PRODUCTS  */}
            <section className="products-section" id="produk">
                <div className="container">
                    <div className="section-head fade-in" style={{ textAlign: 'left', marginBottom: '32px' }}>
                        <span className="tag">Katalog 2025</span>
                        <h2>Produk Pilihan <em
                            style={{ fontFamily: '\'DM Serif Display\',serif', fontStyle: 'italic', color: 'var(--green)' }}>Terbaik</em>
                        </h2>
                    </div>

                    <div className="cat-tabs fade-in">
                        <button className={`cat-tab ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>Semua</button>
                        <button className={`cat-tab ${activeCategory === 'propolis' ? 'active' : ''}`} onClick={() => setActiveCategory('propolis')}>🍯 British Propolis</button>
                        <button className={`cat-tab ${activeCategory === 'skincare' ? 'active' : ''}`} onClick={() => setActiveCategory('skincare')}>✨ Skincare Belgie</button>
                        <button className={`cat-tab ${activeCategory === 'suplemen' ? 'active' : ''}`} onClick={() => setActiveCategory('suplemen')}>💊 Suplemen</button>
                        <button className={`cat-tab ${activeCategory === 'natural' ? 'active' : ''}`} onClick={() => setActiveCategory('natural')}>🌿 Natural</button>
                    </div>

                    <div className="product-grid" id="productGrid">
                        {KATALOG_PRODUCTS.map(product => (
                            <div key={product.id} className={`product-card fade-in ${activeCategory === 'all' || activeCategory === product.category ? 'visible' : 'hidden'}`}>
                                <div className="card-img" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--green-ultra)', overflow: 'hidden' }}>
                                    <div className={`card-img-bg ${product.bgStyle}`}></div>
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 2 }} />
                                    ) : (
                                        <span className="material-symbols-rounded" style={{ fontSize: '72px', color: 'var(--green-dark)', position: 'relative', zIndex: 2, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}>{product.emoji}</span>
                                    )}
                                </div>
                                <div className="card-body">
                                    <span className={`card-badge badge-${product.badgeColor}`}>{product.badgeText}</span>
                                    <div className="card-name">{product.name}</div>
                                    <div className="card-tagline">{product.tagline}</div>
                                    <p className="card-desc">{product.description}</p>
                                    <ul className="card-benefits">
                                        {product.benefits.map((benefit, idx) => (
                                            <li key={idx}>{benefit}</li>
                                        ))}
                                    </ul>
                                    <div className="card-specs">
                                        {product.specs.map((spec, idx) => (
                                            <span key={idx} className="spec-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-rounded" style={{ fontSize: '14px' }}>{spec.icon}</span> {spec.text}</span>
                                        ))}
                                    </div>
                                    <div className="card-footer" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
                                        <div className="price-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginBottom: '4px' }}>
                                            <div>
                                                {product.oldPrice && <span className="price-old" style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '11px', marginRight: '6px' }}>{product.oldPrice}</span>}
                                                <span className="price">{product.price}</span>
                                            </div>
                                            <span className="price-note">{product.priceNote}</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <Link to="/ai-advisor" className="btn-cta-katalog">
                                                <span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '6px', verticalAlign: 'bottom' }}>chat</span> Konsultasi AI Dulu
                                            </Link>
                                            <a href={getOrderLink(`Halo kak, saya mau konsultasi/tanya-tanya/pesan ${product.name}`)} target="_blank" rel="noopener noreferrer" className="btn-cta-wa" style={{ width: '100%', justifyContent: 'center' }}>
                                                <span className="material-symbols-rounded" style={{ marginRight: '8px' }}>chat_bubble</span> Konsultasi & Pesan via WA
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/*  TESTIMONI  */}
            <TestimoniSection />

            {/*  CTA  */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card fade-in">
                        <span className="section-label">Mulai Sekarang</span>
                        <h2 className="section-title">Siap Hidup Lebih Sehat<br />& Meraih Penghasilan?</h2>
                        <p className="section-desc">Hubungi kami sekarang untuk konsultasi produk atau bergabung sebagai mitra bisnis Quantum Millionaire.</p>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <a href={getOrderLink("Halo kak, saya mau konsultasi / bergabung sebagai mitra Quantum Millionaire")} target="_blank" rel="noopener noreferrer" className="btn-cta-wa">
                                <span className="material-symbols-rounded" style={{ marginRight: '8px' }}>chat_bubble</span> Hubungi via WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/*  FOOTER  */}
            <footer>
                <div className="logo-text">
                    <img
                        src="/images/qm-logo.webp"
                        alt="Quantum Millionaire"
                        style={{ height: '50px', width: 'auto', marginBottom: '12px' }}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML += '<div style="font-weight: bold; color: var(--green-dark); margin-bottom: 12px">Quantum Millionaire</div>';
                        }}
                    />
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    Komunitas Bisnis Quantum Millionaire<br />
                    © 2025 Quantum Millionaire — Katalog Produk
                </p>
            </footer>

            {/*  STICKY WA  */}
            <a href="https://wa.me/6287782697973" target="_blank" rel="noopener noreferrer" className="sticky-wa" title="Hubungi via WhatsApp">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
                        <path
                            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span className="material-symbols-rounded" style={{ color: 'white', fontWeight: 600, fontSize: '15px', whiteSpace: 'nowrap' }}>Chat Sekarang</span>
                </div>
            </a>
        </div>
    );
}
