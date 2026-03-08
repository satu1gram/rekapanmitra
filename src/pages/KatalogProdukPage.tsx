import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '@/styles/katalog.css';
import { generateAIAdvice, RAGResult } from '@/lib/geminiRAG';
import { KATALOG_PRODUCTS } from '@/data/katalogProducts';

export default function KatalogProdukPage() {
    const [searchParams] = useSearchParams();
    const [activeCategory, setActiveCategory] = useState('all');
    const storeSlug = searchParams.get('toko') || searchParams.get('ref') || '';

    const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);
    const [complaintText, setComplaintText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [waExpanded, setWaExpanded] = useState(false);

    // Auto-expand WA after 10s and collapse after 5s
    useEffect(() => {
        const expandTimer = setTimeout(() => {
            setWaExpanded(true);
            setTimeout(() => setWaExpanded(false), 6000);
        }, 10000);
        return () => clearTimeout(expandTimer);
    }, []);

    const [aiResult, setAiResult] = useState<RAGResult | null>(null);

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

    const toggleComplaint = (complaint: string) => {
        setSelectedComplaints(prev =>
            prev.includes(complaint)
                ? prev.filter(c => c !== complaint)
                : [...prev, complaint]
        );
    };

    const handleAnalyze = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (selectedComplaints.length === 0 && !complaintText.trim()) return;

        setIsAnalyzing(true);
        setAiResult(null);

        try {
            const result = await generateAIAdvice(selectedComplaints, complaintText);
            setAiResult(result);
        } catch (error) {
            console.error("Failed to analyze:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Helper to generate dynamic link
    const getOrderLink = (waText: string) => {
        if (storeSlug) {
            return `/toko/${storeSlug}`;
        }
        const summary = `Halo kak, saya mau konsultasi. Keluhan saya: ${selectedComplaints.join(', ')}. ${complaintText ? 'Detail: ' + complaintText : ''}`;
    };

    return (
        <div className="katalog-page-wrapper">


            {/*  NAV  */}
            <nav>
                <div className="nav-logo-wrap">
                    <a href="/katalog" className="nav-logo">
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
                    </a>
                </div>

                {/* Desktop Menu */}
                <ul className="nav-links desktop-only">
                    <li><a href="#konsultasi">Konsultasi</a></li>
                    <li><a href="#produk">Produk</a></li>
                    <li><a href="#tentang">Tentang</a></li>
                </ul>
                <div className="nav-right desktop-only">
                    <a href="https://wa.me/6287782697973" target="_blank" rel="noopener noreferrer" className="nav-cta"><span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '6px', verticalAlign: 'bottom' }}>chat</span> Hubungi Kami</a>
                </div>

                {/* Mobile Right Controls */}
                <div className="mobile-controls mobile-only">
                    <a href="https://wa.me/6287782697973" target="_blank" rel="noopener noreferrer" className="btn-wa-sm"><span className="material-symbols-rounded">chat</span> WA</a>
                    <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>
                        <span className="line"></span>
                        <span className="line"></span>
                        <span className="line"></span>
                    </button>
                </div>
            </nav>

            {/* Mobile Drawer Overlay */}
            <div className={`mobile-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

            {/* Mobile Drawer Menu */}
            <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <img src="/images/qm-logo.webp" alt="QM Logo" style={{ height: '32px', width: 'auto' }} />
                    <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', padding: '8px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '28px' }}>close</span>
                    </button>
                </div>
                <div className="drawer-links">
                    <a href="#konsultasi" onClick={() => setMobileMenuOpen(false)}>Konsultasi Kesehatan</a>
                    <a href="#produk" onClick={() => setMobileMenuOpen(false)}>Katalog Produk</a>
                    <a href="#cara-kerja" onClick={() => setMobileMenuOpen(false)}>Cara Kerja</a>
                    <a href="#tentang" onClick={() => setMobileMenuOpen(false)}>Tentang Kami</a>
                </div>
                <div style={{ marginTop: '32px' }}>
                    <a href="https://wa.me/6287782697973" target="_blank" rel="noopener noreferrer" className="btn-cta-wa" style={{ width: '100%', fontSize: '15px' }}>
                        <span className="material-symbols-rounded" style={{ marginRight: '8px' }}>chat</span> Chat WhatsApp Sekarang
                    </a>
                </div>
            </div>

            {/*  ══════════ AI CONSULTATION — TOP ══════════  */}
            <div className="ai-hero" id="konsultasi">

                {/*  LEFT: INPUT  */}
                <div className="ai-hero-left">
                    <span className="ai-tag"><span className="dot"></span> AI Health Advisor</span>
                    <h1 className="ai-hero-title">
                        Ceritakan<br /><em>Keluhan Kamu</em>
                    </h1>
                    <p className="ai-hero-sub">
                        Kami analisis kondisimu, berikan panduan gaya hidup sehat, lalu rekomendasikan produk alami yang
                        paling tepat.
                    </p>

                    <span className="chips-label">⚡ Pilih keluhan yang kamu rasakan:</span>
                    <div className="chips-wrap">
                        {[
                            "😴 Susah Tidur", "🦴 Nyeri Sendi", "😷 Imun Lemah", "👁️ Mata Lelah",
                            "🩸 Gula Darah Tinggi", "🧒 Anak Susah Makan", "💆 Rambut Rontok", "✨ Kulit Kusam",
                            "🤧 Sering Flu", "🧠 Kurang Fokus", "☀️ Flek Hitam", "⚡ Kurang Stamina"
                        ].map(c => (
                            <span
                                key={c}
                                className={`chip ${selectedComplaints.includes(c) ? 'active' : ''}`}
                                onClick={() => toggleComplaint(c)}
                            >
                                {c}
                            </span>
                        ))}
                    </div>

                    <textarea
                        id="complaintText"
                        className="ai-textarea"
                        placeholder="Atau ceritakan lebih detail... Contoh: Saya sering susah tidur, lutut nyeri, dan mudah lelah."
                        value={complaintText}
                        onChange={(e) => setComplaintText(e.target.value)}
                    ></textarea>

                    <button
                        onClick={handleAnalyze}
                        className="btn-analyze"
                        id="analyzeBtn"
                        disabled={isAnalyzing || (selectedComplaints.length === 0 && !complaintText.trim())}
                    >
                        {!isAnalyzing && <span id="btnIcon">🌿</span>}
                        <span id="btnText">{isAnalyzing ? 'Menganalisis...' : 'Analisis Kesehatanku'}</span>
                        {isAnalyzing && <div className="ai-spinner" id="spinner" style={{ display: 'block' }}></div>}
                    </button>
                </div>

                {/*  RIGHT: RESULT  */}
                <div className="ai-hero-right">
                    {/*  Empty state  */}
                    {!isAnalyzing && !aiResult && (
                        <div className="result-empty-state" id="emptyState">
                            <div className="empty-illustration">🌱</div>
                            <h3>Mulai dari Sini</h3>
                            <p>Pilih keluhan di sebelah kiri atau ketik kondisimu. AI kami akan memberikan panduan gaya hidup
                                sehat dan rekomendasi produk yang tepat.</p>
                        </div>
                    )}

                    {/*  Typing  */}
                    {isAnalyzing && (
                        <div className="typing-wrap show" id="typingWrap">
                            <div className="typing-dots"><span></span><span></span><span></span></div>
                            <span>Sedang menganalisis kondisi kesehatanmu...</span>
                        </div>
                    )}

                    {/*  Result  */}
                    {aiResult && (
                        <div className="result-content show" id="resultContent" style={{ scrollBehavior: 'smooth' }}>
                            {/* 1. BLOK EMPATI */}
                            <div style={{ background: 'var(--green-ultra)', borderRadius: '16px', padding: '20px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div className="material-symbols-rounded" style={{ fontSize: '28px', color: 'var(--green)' }}>favorite</div>
                                <div>
                                    <p style={{ fontSize: '15px', color: 'var(--text)', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
                                        {aiResult.empati}
                                    </p>
                                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0 }}>
                                        {aiResult.edukasi}
                                    </p>
                                </div>
                            </div>

                            {/* 2. DIVIDER: Panduan Gaya Hidup */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <div style={{ flex: 1, height: '1px', background: 'var(--green-100)' }}></div>
                                <div style={{ background: 'var(--green-pale)', color: 'var(--green)', fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px' }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'text-bottom' }}>lightbulb</span> Panduan Gaya Hidup Sehat
                                </div>
                                <div style={{ flex: 1, height: '1px', background: 'var(--green-100)' }}></div>
                            </div>

                            {/* 3. LIFESTYLE TIPS */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                                {aiResult.tips_gaya_hidup?.map((tip, idx) => (
                                    <div key={idx} style={{ background: '#F9FFF9', border: '1px solid var(--green-100)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                        <span className="material-symbols-rounded" style={{ fontSize: '28px', color: '#10b981' }}>{tip.icon === '✨' ? 'auto_awesome' : tip.icon || 'auto_awesome'}</span>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{tip.title}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 4. DIVIDER: Rekomendasi Produk */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <div style={{ flex: 1, height: '1px', background: '#FEF3C7' }}></div>
                                <div style={{ background: '#FEF3C7', color: '#B45309', fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px' }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'text-bottom' }}>shopping_bag</span> Rekomendasi Produk
                                </div>
                                <div style={{ flex: 1, height: '1px', background: '#FEF3C7' }}></div>
                            </div>

                            {/* 5. PRODUCT RECO */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                {aiResult.rekomendasi?.map((prod, idx) => {
                                    const catalogProduct = KATALOG_PRODUCTS.find(p => p.name.toLowerCase().includes(prod.name.toLowerCase()) || prod.name.toLowerCase().includes(p.name.toLowerCase()));
                                    return (
                                        <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                            <div style={{ width: '60px', height: '60px', background: 'var(--green-ultra)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                                {catalogProduct?.image ? (
                                                    <img src={catalogProduct.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span className="material-symbols-rounded" style={{ color: 'var(--green-dark)', fontSize: '28px' }}>{prod.emoji === '🌿' ? 'eco' : prod.emoji || 'eco'}</span>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{prod.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{prod.reason}</div>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)', marginTop: '4px' }}>{prod.price}</div>
                                            </div>
                                            <a href="#produk" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', border: '1.5px solid var(--green)', padding: '6px 14px', borderRadius: '8px', whiteSpace: 'nowrap', textDecoration: 'none', transition: 'all 0.2s' }}>
                                                Detail
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 6. CTA WHATSAPP & TESTIMONIALS */}
                            <a href={getOrderLink("Halo kak, saya mau tanya-tanya dulu tentang konsultasi kesehatan AI Quantum Millionaire tadi...")} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', background: '#25D366', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 600, textAlign: 'center', textDecoration: 'none', marginBottom: '4px' }}>
                                <span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '6px', verticalAlign: 'bottom' }}>chat</span> {aiResult.cta || "Konsultasi Lebih Lanjut via WhatsApp"}
                            </a>
                            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                                Gratis Konsultasi · Terpercaya · Balas Secepatnya
                            </div>

                            {aiResult.testimonials && aiResult.testimonials.length > 0 && (
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                                    <div className="result-section-title" style={{ marginBottom: '14px' }}><span className="material-symbols-rounded" style={{ marginRight: '8px' }}>forum</span> Kisah Nyata Serupa</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {aiResult.testimonials.map(testi => (
                                            <div key={testi.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                                <div style={{ fontStyle: 'italic', marginBottom: '8px' }}>"{testi.text}"</div>
                                                <div style={{ fontWeight: 600, color: 'var(--green-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--green-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-rounded" style={{ fontSize: '12px', color: 'var(--green)' }}>person</span></div>
                                                    {testi.sender}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
                                <p className="step-desc">Ceritakan kondisi & keluhan kesehatanmu kepada AI Advisor kami.</p>
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
                                            {storeSlug ? (
                                                <Link to={`/toko/${storeSlug}`} className="btn-cta-katalog">
                                                    <span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '6px', verticalAlign: 'bottom' }}>chat</span> Konsultasi & Pesan via WA
                                                </Link>
                                            ) : (
                                                <a href={getOrderLink(`Halo kak, saya mau pesan ${product.name}`)} target="_blank" rel="noopener noreferrer" className="btn-cta-wa" style={{ width: '100%', justifyContent: 'center' }}>
                                                    <span className="material-symbols-rounded" style={{ marginRight: '8px' }}>chat_bubble</span> Konsultasi & Pesan via WA
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            </section>


            {/*  MITRA SECTION (DARK)  */}
            <section className="mitra-dark-section">
                <div className="container">
                    <div className="mitra-header fade-in">
                        <span className="tag">Peluang Emas</span>
                        <h2>Lebih dari Sekadar Sehat.<br /><span style={{ color: '#34D399' }}>Raih Penghasilan Tanpa Batas</span> dari Genggaman.</h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
                            Bergabunglah bersama ribuan mitra Quantum Millionaire Quantum Millionaire yang telah membuktikan kesuksesan finansial mereka.
                        </p>
                    </div>

                    <div className="mitra-grid">
                        <div className="mitra-card fade-in">
                            <div className="mitra-icon"><span className="material-symbols-rounded" style={{ fontSize: '42px', color: '#34D399' }}>payments</span></div>
                            <div>
                                <h4>Penghasilan Nyata</h4>
                                <p>Margin puluhan ribu per botol dengan repeat order tinggi. Potensi omset jutaan rupiah per minggu sudah di depan mata.</p>
                            </div>
                        </div>
                        <div className="mitra-card fade-in" style={{ animationDelay: '0.1s' }}>
                            <div className="mitra-icon"><span className="material-symbols-rounded" style={{ fontSize: '42px', color: '#34D399' }}>verified</span></div>
                            <div>
                                <h4>Bisnis Halal Berkah</h4>
                                <p>Seluruh produk BPOM & Halal MUI. Sistem bisnis diawasi ketat oleh pakar syariah, menjamin keberkahan setiap rupiah.</p>
                            </div>
                        </div>
                        <div className="mitra-card fade-in" style={{ animationDelay: '0.2s' }}>
                            <div className="mitra-icon"><span className="material-symbols-rounded" style={{ fontSize: '42px', color: '#34D399' }}>smartphone</span></div>
                            <div>
                                <h4>Mulai dari HP Saja</h4>
                                <p>Materi jualan lengkap dari pusat. Bimbingan mentor full 100% disediakan. Anda tinggal copas dan langsung closing!</p>
                            </div>
                        </div>
                    </div>

                    {/*  Founder  */}
                    <div className="founder-card fade-in" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', maxWidth: '800px', margin: '0 auto', backdropFilter: 'blur(10px)' }}>
                        <div className="founder-avatar overflow-hidden">
                            <img src="https://placehold.co/200x200/10B981/064E3B?text=Gus+Akhmad" alt="Founder Profil" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="founder-name" style={{ color: 'white' }}>Akhmad Musyaffa' Arwani</div>
                            <div className="founder-title" style={{ color: '#34D399' }}>Gus Akhmad • Founder Quantum Millionaire</div>
                            <div className="founder-quote" style={{ color: 'rgba(255,255,255,0.8)', borderLeftColor: '#34D399' }}>
                                "Ketika banyak energi positif yang berkumpul bersinergi, insya Allah akan mendatangkan keajaiban-keajaiban secara kuantum."
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                <span className="spec-tag" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'transparent' }}>Pencetak Ribuan Pengusaha</span>
                                <span className="spec-tag" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'transparent' }}>Licensed Trainer Ippho Santosa</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/*  TESTIMONI  */}
            <section className="testimonials-section" id="testimoni">
                <div className="container">
                    <div className="section-head fade-in" style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <span className="tag">Testimoni</span>
                        <h2>Kisah Nyata Keluarga <em style={{ fontFamily: '\'DM Serif Display\',serif', fontStyle: 'italic', color: 'var(--green)' }}>Sehat</em></h2>
                        <p style={{ marginTop: '10px' }}>Simak pengalaman nyata dari mereka yang telah merasakan khasiat produk Quantum Millionaire.</p>
                    </div>

                    <div className="testimonials-grid">
                        <div className="testimonial-card fade-in">
                            <div className="testimonial-header">
                                <div className="testimonial-avatar">
                                    <img src="https://placehold.co/150x150/d1fae5/059669?text=Foto" alt="Placeholder" />
                                </div>
                                <div className="testimonial-author">
                                    <div className="testimonial-name">Bunda Aisyah</div>
                                    <div className="testimonial-sub">Ibu Rumah Tangga, 34 Th</div>
                                    <div className="testimonial-stars" style={{ color: '#FACC15', display: 'flex', gap: '2px' }}>
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="testimonial-text">
                                "Semenjak rutin ngasih British Propolis Kids ke anak-anak, alhamdulillah jarang banget demam atau flu biarpun musim hujan. Benar-benar kerasa bedanya."
                            </div>
                        </div>

                        <div className="testimonial-card fade-in">
                            <div className="testimonial-header">
                                <div className="testimonial-avatar">
                                    <img src="https://placehold.co/150x150/e0e7ff/4f46e5?text=Foto" alt="Placeholder" />
                                </div>
                                <div className="testimonial-author">
                                    <div className="testimonial-name">Pak Hermawan</div>
                                    <div className="testimonial-sub">Pekerja Kantoran, 45 Th</div>
                                    <div className="testimonial-stars" style={{ color: '#FACC15', display: 'flex', gap: '2px' }}>
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="testimonial-text">
                                "Brassic Pro bantu banget ngurangin nyeri sendi saya. Tidur juga jadi jauh lebih nyenyak dari sebelumnya. Bangun pagi badan enteng kerjanya mantap."
                            </div>
                        </div>

                        <div className="testimonial-card fade-in">
                            <div className="testimonial-header">
                                <div className="testimonial-avatar">
                                    <img src="https://placehold.co/150x150/fee2e2/ef4444?text=Foto" alt="Placeholder" />
                                </div>
                                <div className="testimonial-author">
                                    <div className="testimonial-name">Nisa Salina</div>
                                    <div className="testimonial-sub">Mahasiswi, 21 Th</div>
                                    <div className="testimonial-stars" style={{ color: '#FACC15', display: 'flex', gap: '2px' }}>
                                        {[...Array(4)].map((_, i) => (
                                            <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                            </svg>
                                        ))}
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.3 }}>
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="testimonial-text">
                                "Suka banget sama Belgie Anti Aging Serum! Cepat meresap dan nggak lengket. Bekas jerawat pelan-pelan memudar dan muka jadi lebih glowing."
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*  CTA  */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card fade-in">
                        <span className="section-label">Mulai Sekarang</span>
                        <h2 className="section-title">Siap Hidup Lebih Sehat<br />& Meraih Penghasilan?</h2>
                        <p className="section-desc">Hubungi kami sekarang untuk konsultasi produk atau bergabung sebagai mitra bisnis Quantum Millionaire.</p>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <a href={getOrderLink("Halo kak, saya mau konsultasi / bergabung sebagai mitra Quantum Millionaire")} target="_blank" rel="noopener noreferrer" className="btn-cta-wa">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Hubungi via WhatsApp
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
                    © 2025 Quantum Millionaire — Healthy Living Guide
                </p>
            </footer>

            {/*  STICKY WA  */}
            <a href="https://wa.me/6287782697973" target="_blank" rel="noopener noreferrer" className={`sticky-wa ${waExpanded ? 'expanded' : ''}`} title="Hubungi via WhatsApp">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
                        <path
                            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {waExpanded && <span className="wa-expanded-text" style={{ color: 'white', fontWeight: 600, fontSize: '15px', whiteSpace: 'nowrap' }}>Chat Sekarang</span>}
                </div>
            </a>



        </div>
    );
}
