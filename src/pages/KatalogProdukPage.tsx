import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '@/styles/katalog.css';
import { generateAIAdvice, RAGResult } from '@/lib/geminiRAG';

export default function KatalogProdukPage() {
    const [searchParams] = useSearchParams();
    const [activeCategory, setActiveCategory] = useState('all');
    const storeSlug = searchParams.get('toko') || searchParams.get('ref') || '';

    const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);
    const [complaintText, setComplaintText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<RAGResult | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);

        // Fade in animation observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
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
        return `https://wa.me/62?text=${encodeURIComponent(waText || summary)}`;
    };

    return (
        <div className="katalog-page-wrapper">


            {/*  NAV  */}
            <nav>
                <a href="#" className="nav-logo">BP<span>.</span>Group</a>
                <ul className="nav-links">
                    <li><a href="#konsultasi">Konsultasi</a></li>
                    <li><a href="#produk">Produk</a></li>
                    <li><a href="#tentang">Tentang</a></li>
                </ul>
                <a href="https://wa.me/62" className="nav-cta">Hubungi Kami</a>
            </nav>

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
                        <div className="result-content show" id="resultContent">
                            {/*  LIFESTYLE BLOCK  */}
                            <div className="lifestyle-block" id="lifestyleBlock">
                                <div className="result-section-title">🌿 Panduan Gaya Hidup Sehat</div>
                                <p className="lifestyle-analysis" id="lifestyleAnalysis">
                                    {aiResult.analysis}
                                </p>
                                <div className="lifestyle-tips" id="lifestyleTips">
                                    {aiResult.tips.map((tip, idx) => (
                                        <div key={idx} className="tip-item">
                                            <div className="tip-icon">✨</div>
                                            <div className="tip-text">{tip}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/*  PRODUCT RECO  */}
                            <div className="product-reco-block" id="recoBlock">
                                <div className="result-section-title" style={{ marginBottom: '14px' }}>🛡️ Produk yang Direkomendasikan</div>
                                <div className="reco-cards" id="recoCards">
                                    {aiResult.products.map(prod => (
                                        <div key={prod} className="reco-card">
                                            <div className="reco-img">{prod === 'British Propolis' ? '🍯' : '💊'}</div>
                                            <div className="reco-info">
                                                <div className="reco-name">{prod}</div>
                                                <div className="reco-reason">Membantu mempercepat pemulihan dan imunitas.</div>
                                            </div>
                                            <a href={getOrderLink(`Halo kak, saya mau pesan ${prod} berdasarkan analisa AI Advisor.`)} className="reco-wa">
                                                Pesan via WA
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/*  TESTIMONIALS RECO  */}
                            {aiResult.testimonials && aiResult.testimonials.length > 0 && (
                                <div className="product-reco-block" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                                    <div className="result-section-title" style={{ marginBottom: '14px' }}>💬 Kisah Nyata Serupa</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {aiResult.testimonials.map(testi => (
                                            <div key={testi.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                                <div style={{ fontStyle: 'italic', marginBottom: '8px' }}>"{testi.text}"</div>
                                                <div style={{ fontWeight: 600, color: 'var(--green-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--green-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>👤</div>
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
                <div className="trust-item"><span className="icon">🛡️</span> BADAN POM Terdaftar</div>
                <div className="trust-sep"></div>
                <div className="trust-item"><span className="icon">☪️</span> Halal MUI</div>
                <div className="trust-sep"></div>
                <div className="trust-item"><span className="icon">🌿</span> 100% Bahan Alami</div>
                <div className="trust-sep"></div>
                <div className="trust-item"><span className="icon">🌍</span> Standar Internasional</div>
                <div className="trust-sep"></div>
                <div className="trust-item"><span className="icon">📦</span> Kirim Seluruh Indonesia</div>
            </div>

            {/*  BRAND HERO  */}
            <div className="brand-hero">
                <div className="brand-hero-left fade-in">
                    <span className="section-tag">Quantum Millionaire Community</span>
                    <h2 className="brand-title">Healthy Living <em>Guide</em></h2>
                    <p className="brand-desc">Panduan hidup sehat sekaligus terawat. Semua produk BP Group dipilih dari bahan
                        alami terbaik dunia, diproses halal, dan teruji BPOM.</p>
                    <div className="brand-stats">
                        <div><span className="bstat-num">11+</span>
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
                    <div className="brand-img-grid">
                        <div className="brand-img-card">
                            <div className="bg-circle"></div>
                            <div className="icon-wrap">🍯</div>
                        </div>
                        <div className="brand-img-card">
                            <div className="bg-circle"></div>
                            <div className="icon-wrap">🌿</div>
                        </div>
                        <div className="brand-img-card">
                            <div className="bg-circle"></div>
                            <div className="icon-wrap">💊</div>
                        </div>
                        <div className="brand-img-card">
                            <div className="bg-circle"></div>
                            <div className="icon-wrap">✨</div>
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
                        <p>Mulai perjalanan hidupmu yang lebih sehat dengan langkah sederhana bersama BP Group.</p>
                    </div>
                    <div className="steps-grid">
                        <div className="step-item fade-in">
                            <div className="step-circle">🔍<span className="step-num">1</span></div>
                            <div className="step-name">Kenali</div>
                            <p className="step-desc">Ceritakan kondisi & keluhan kesehatanmu kepada AI Advisor kami.</p>
                        </div>
                        <div className="step-item fade-in">
                            <div className="step-circle">🌿<span className="step-num">2</span></div>
                            <div className="step-name">Pahami</div>
                            <p className="step-desc">Dapatkan panduan gaya hidup sehat yang tepat sesuai kondisimu.</p>
                        </div>
                        <div className="step-item fade-in">
                            <div className="step-circle">🛡️<span className="step-num">3</span></div>
                            <div className="step-name">Konsumsi</div>
                            <p className="step-desc">Gunakan produk alami BP Group yang direkomendasikan secara rutin.</p>
                        </div>
                        <div className="step-item fade-in">
                            <div className="step-circle">💚<span className="step-num">4</span></div>
                            <div className="step-name">Rasakan</div>
                            <p className="step-desc">Nikmati perubahan positif — tubuh lebih sehat, energi lebih optimal.</p>
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

                        {/*  1. BRITISH PROPOLIS  */}
                        <div className={`product-card fade-in ${activeCategory === 'all' || activeCategory === 'propolis' ? 'visible' : 'hidden'}`}>
                            <div className="card-img">
                                <div className="card-img-bg green"></div>
                                <img src="https://placehold.co/400x500/eaeaea/5a6b5c?text=Foto+Produk\n(Rekomendasi:+400x500px)" alt="Placeholder Produk" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />

                            </div>
                            <div className="card-body">
                                <span className="card-badge badge-green">British Propolis</span>
                                <div className="card-name">British Propolis</div>
                                <div className="card-tagline">Daily Health Menu • Dewasa</div>
                                <p className="card-desc">Suplemen imun terbaik dengan sifat antibakteri, antijamur, antivirus,
                                    antiradang — fungsi PIS: Pemulihan, Imunitas, Stamina.</p>
                                <ul className="card-benefits">
                                    <li>Pemulihan & Penyembuhan</li>
                                    <li>Meningkatkan imunitas tubuh</li>
                                    <li>Menjaga stamina harian</li>
                                </ul>
                                <div className="card-specs">
                                    <span className="spec-tag">💧 Drop 6 ML</span>
                                    <span className="spec-tag">🔬 Botol Kaca</span>
                                </div>
                                <div className="card-footer">
                                    <div className="price-wrap">
                                        <span className="price">Rp 250.000</span>
                                        <span className="price-note">Per Botol 6 ML</span>
                                    </div>
                                    {storeSlug ? (
                                        <Link to={`/toko/${storeSlug}`} className="btn-wa">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan di Toko
                                        </Link>
                                    ) : (
                                        <a href={getOrderLink("Order British Propolis")} className="btn-wa" target="_blank" rel="noreferrer">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan via WA
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/*  2. BRITISH PROPOLIS GREEN  */}
                        <div className={`product-card fade-in ${activeCategory === 'all' || activeCategory === 'propolis' ? 'visible' : 'hidden'}`}>
                            <div className="card-img">
                                <div className="card-img-bg teal"></div>
                                <img src="https://placehold.co/400x500/eaeaea/5a6b5c?text=Foto+Produk\n(Rekomendasi:+400x500px)" alt="Placeholder Produk" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />

                            </div>
                            <div className="card-body">
                                <span className="card-badge badge-kids">Untuk Anak</span>
                                <div className="card-name">British Propolis Green</div>
                                <div className="card-tagline">Khusus Anak Usia 1–12 Tahun</div>
                                <p className="card-desc">Propolis murni + Trigona, dirancang aman untuk anak. Meningkatkan nafsu
                                    makan & merangsang tumbuh kembang kecerdasan.</p>
                                <ul className="card-benefits">
                                    <li>Meningkatkan nafsu makan anak</li>
                                    <li>Merangsang tumbuh kembang & kecerdasan</li>
                                    <li>Menghambat virus & memperbaiki sel rusak</li>
                                </ul>
                                <div className="card-specs">
                                    <span className="spec-tag">💧 Drop 6 ML</span>
                                    <span className="spec-tag">👶 Usia 1–12 th</span>
                                </div>
                                <div className="card-footer">
                                    <div className="price-wrap">
                                        <span className="price">Rp 250.000</span>
                                        <span className="price-note">Per Botol 6 ML</span>
                                    </div>
                                    {storeSlug ? (
                                        <Link to={`/toko/${storeSlug}`} className="btn-wa">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan di Toko
                                        </Link>
                                    ) : (
                                        <a href={getOrderLink(decodeURIComponent("Order%20British%20Propolis%20Green"))} className="btn-wa" target="_blank" rel="noreferrer">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan via WA
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/*  3. BRASSIC PRO  */}
                        <div className={`product-card fade-in ${activeCategory === 'all' || activeCategory === 'suplemen' ? 'visible' : 'hidden'}`}>
                            <div className="card-img">
                                <div className="card-img-bg gold"></div>
                                <img src="https://placehold.co/400x500/eaeaea/5a6b5c?text=Foto+Produk\n(Rekomendasi:+400x500px)" alt="Placeholder Produk" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />

                            </div>
                            <div className="card-body">
                                <span className="card-badge badge-gold">Suplemen</span>
                                <div className="card-name">Brassic Pro</div>
                                <div className="card-tagline">Insomnia & Nyeri Sendi</div>
                                <p className="card-desc">Moringa Oleifera + Echinacea Purpurea — perpaduan Timur & Barat untuk
                                    insomnia, nyeri sendi, dan sistem kekebalan tubuh.</p>
                                <ul className="card-benefits">
                                    <li>Anti inflamasi & kurangi nyeri sendi</li>
                                    <li>Mengatasi insomnia & masalah tidur</li>
                                    <li>Antipiretik — menurunkan demam</li>
                                </ul>
                                <div className="card-specs">
                                    <span className="spec-tag">💊 40 Kapsul</span>
                                    <span className="spec-tag">🌿 Moringa + Echinacea</span>
                                </div>
                                <div className="card-footer">
                                    <div className="price-wrap">
                                        <span className="price">Rp 250.000</span>
                                        <span className="price-note">1 Botol 40 Kapsul</span>
                                    </div>
                                    {storeSlug ? (
                                        <Link to={`/toko/${storeSlug}`} className="btn-wa">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan di Toko
                                        </Link>
                                    ) : (
                                        <a href={getOrderLink(decodeURIComponent("Order%20Brassic%20Pro"))} className="btn-wa" target="_blank" rel="noreferrer">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan via WA
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/*  4. BRASSIC EYE  */}
                        <div className={`product-card fade-in ${activeCategory === 'all' || activeCategory === 'suplemen' ? 'visible' : 'hidden'}`}>
                            <div className="card-img">
                                <div className="card-img-bg blue"></div>
                                <img src="https://placehold.co/400x500/eaeaea/5a6b5c?text=Foto+Produk\n(Rekomendasi:+400x500px)" alt="Placeholder Produk" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />

                            </div>
                            <div className="card-body">
                                <span className="card-badge badge-blue">Suplemen Mata</span>
                                <div className="card-name">Brassic Eye</div>
                                <div className="card-tagline">Solusi Mata Sehat Era Gadget</div>
                                <p className="card-desc">Bilberry (Vaccinium Myrtillus) & Gynura Divaricata untuk melindungi
                                    mata dari paparan layar digital, hipertensi, dan diabetes.</p>
                                <ul className="card-benefits">
                                    <li>Menjaga kemampuan penglihatan</li>
                                    <li>Atasi gangguan mata akibat diabetes</li>
                                    <li>Membantu Glaukoma & radang mata</li>
                                </ul>
                                <div className="card-specs">
                                    <span className="spec-tag">💊 40 Kapsul</span>
                                    <span className="spec-tag">🫐 Bilberry Extract</span>
                                </div>
                                <div className="card-footer">
                                    <div className="price-wrap">
                                        <span className="price">Rp 250.000</span>
                                        <span className="price-note">1 Botol 40 Kapsul</span>
                                    </div>
                                    {storeSlug ? (
                                        <Link to={`/toko/${storeSlug}`} className="btn-wa">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan di Toko
                                        </Link>
                                    ) : (
                                        <a href={getOrderLink(decodeURIComponent("Order%20Brassic%20Eye"))} className="btn-wa" target="_blank" rel="noreferrer">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan via WA
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/*  5. BELGIE FACIAL WASH  */}
                        <div className={`product-card fade-in ${activeCategory === 'all' || activeCategory === 'skincare' ? 'visible' : 'hidden'}`}>
                            <div className="card-img">
                                <div className="card-img-bg red"></div>
                                <img src="https://placehold.co/400x500/eaeaea/5a6b5c?text=Foto+Produk\n(Rekomendasi:+400x500px)" alt="Placeholder Produk" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />

                            </div>
                            <div className="card-body">
                                <span className="card-badge badge-red">Skincare Halal</span>
                                <div className="card-name">Belgie Facial Wash</div>
                                <div className="card-tagline">Sabun Wajah • Pria & Wanita</div>
                                <p className="card-desc">Hyaluronic Acid + Propolis Extract + Hydrolyzed Collagen. Skincare
                                    halal standar Eropa, teruji BPOM.</p>
                                <ul className="card-benefits">
                                    <li>Kontrol minyak & jaga kelembapan</li>
                                    <li>Kulit lebih kenyal & bercahaya</li>
                                    <li>Kurangi kerutan & garis halus</li>
                                </ul>
                                <div className="card-specs">
                                    <span className="spec-tag">🧴 Gel 100 ML</span>
                                    <span className="spec-tag">⚗️ Hyaluronic Acid</span>
                                </div>
                                <div className="card-footer">
                                    <div className="price-wrap">
                                        <span className="price">Rp 195.000</span>
                                        <span className="price-note">Gel 100 ML</span>
                                    </div>
                                    {storeSlug ? (
                                        <Link to={`/toko/${storeSlug}`} className="btn-wa">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan di Toko
                                        </Link>
                                    ) : (
                                        <a href={getOrderLink(decodeURIComponent("Order%20Belgie%20Facial%20Wash"))} className="btn-wa" target="_blank" rel="noreferrer">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan via WA
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/*  6. BELGIE SERUM  */}
                        <div className={`product-card fade-in ${activeCategory === 'all' || activeCategory === 'skincare' ? 'visible' : 'hidden'}`}>
                            <div className="card-img">
                                <div className="card-img-bg purple"></div>
                                <img src="https://placehold.co/400x500/eaeaea/5a6b5c?text=Foto+Produk\n(Rekomendasi:+400x500px)" alt="Placeholder Produk" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />

                            </div>
                            <div className="card-body">
                                <span className="card-badge badge-red">Skincare Halal</span>
                                <div className="card-name">Belgie Anti Aging Serum</div>
                                <div className="card-tagline">Anti Penuaan Dini • 5 Bahan Aktif</div>
                                <p className="card-desc">Triple Amazing Formula: Propolis Extract + Collagen + Hyaluronic Acid.
                                    Cepat meresap, bebaskan kulit dari kusam, jerawat & flek hitam.</p>
                                <ul className="card-benefits">
                                    <li>Regenerasi sel & kurangi flek hitam</li>
                                    <li>Anti aging & kurangi kerutan</li>
                                    <li>Alpha Arbutin — cerahkan kulit</li>
                                </ul>
                                <div className="card-specs">
                                    <span className="spec-tag">💧 Cair 10 ML</span>
                                    <span className="spec-tag">✨ 5 Bahan Aktif</span>
                                </div>
                                <div className="card-footer">
                                    <div className="price-wrap">
                                        <span className="price">Rp 195.000</span>
                                        <span className="price-note">10 ML</span>
                                    </div>
                                    {storeSlug ? (
                                        <Link to={`/toko/${storeSlug}`} className="btn-wa">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan di Toko
                                        </Link>
                                    ) : (
                                        <a href={getOrderLink(decodeURIComponent("Order%20Belgie%20Serum"))} className="btn-wa" target="_blank" rel="noreferrer">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan via WA
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/*  7. BELGIE DAY CREAM  */}
                        <div className={`product-card fade-in ${activeCategory === 'all' || activeCategory === 'skincare' ? 'visible' : 'hidden'}`}>
                            <div className="card-img">
                                <div className="card-img-bg red"></div>
                                <img src="https://placehold.co/400x500/eaeaea/5a6b5c?text=Foto+Produk\n(Rekomendasi:+400x500px)" alt="Placeholder Produk" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />

                            </div>
                            <div className="card-body">
                                <span className="card-badge badge-red">Skincare Halal</span>
                                <div className="card-name">Belgie Day Cream</div>
                                <div className="card-tagline">Krim Siang • SPF 30+</div>
                                <p className="card-desc">Lindungi wajah dari sinar UV sepanjang hari. Kaya anti oksidan, menjaga
                                    kulit lembab, bercahaya dan tampak muda.</p>
                                <ul className="card-benefits">
                                    <li>Perlindungan SPF 30+ dari sinar UV</li>
                                    <li>Kulit lembab & bercahaya seharian</li>
                                    <li>Meremajakan kulit wajah</li>
                                </ul>
                                <div className="card-specs">
                                    <span className="spec-tag">🌅 Krim 10 gr</span>
                                    <span className="spec-tag">☀️ SPF 30+</span>
                                </div>
                                <div className="card-footer">
                                    <div className="price-wrap">
                                        <span className="price">Rp 195.000</span>
                                        <span className="price-note">10 Gram</span>
                                    </div>
                                    {storeSlug ? (
                                        <Link to={`/toko/${storeSlug}`} className="btn-wa">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan di Toko
                                        </Link>
                                    ) : (
                                        <a href={getOrderLink(decodeURIComponent("Order%20Belgie%20Day%20Cream"))} className="btn-wa" target="_blank" rel="noreferrer">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Pesan via WA
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/*  BELGIE NIGHT CREAM  */}
                        <div className={`product-card fade-in ${activeCategory === 'all' || activeCategory === 'skincare' ? 'visible' : 'hidden'}`}>
                            <div className="card-img">
                                <div className="card-img-bg red"></div>
                                <img src="https://placehold.co/400x500/eaeaea/5a6b5c?text=Foto+Produk\n(Rekomendasi:+400x500px)" alt="Placeholder Produk" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />

                            </div>
                            <div className="card-body">
                                <span className="card-category cat-skincare">Skincare Halal</span>
                                <div className="card-name">Belgie Night Cream</div>
                                <div className="card-tagline">Krim Malam • Bekerja Saat Tidur</div>
                                <p className="card-desc">Bekerja menakjubkan di malam hari. Salicylic Acid membantu meregenerasi
                                    sel kulit mati, menyamarkan garis halus dan melembabkan kulit wajah.</p>
                                <ul className="card-benefits">
                                    <li>Meregenerasi sel kulit wajah saat tidur</li>
                                    <li>Menyamarkan garis halus & kerutan</li>
                                    <li>Melembabkan kulit secara mendalam</li>
                                    <li>Palmitoyl Tripeptide-5 + Salicylic Acid</li>
                                </ul>
                                <div className="card-specs">
                                    <span className="spec-tag">🌙 Malam</span>
                                    <span className="spec-tag">📦 10 Gram</span>
                                    <span className="spec-tag">🔬 Collagen + HA</span>
                                </div>
                                <div className="card-footer">
                                    <div className="price-wrap">
                                        <span className="price">Rp 195.000</span>
                                        <span className="price-note">Krim 10 Gram</span>
                                    </div>
                                    <a href="https://wa.me/62?text=Halo%2C%20saya%20mau%20order%20Belgie%20Night%20Cream"
                                        className="btn-wa">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path
                                                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        Pesan
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/*  BELGIE HAIR TONIC  */}
                        <div className={`product-card fade-in ${activeCategory === 'all' || activeCategory === 'skincare' ? 'visible' : 'hidden'}`}>
                            <div className="card-img">
                                <div className="card-img-bg gold"></div>
                                <img src="https://placehold.co/400x500/eaeaea/5a6b5c?text=Foto+Produk\n(Rekomendasi:+400x500px)" alt="Placeholder Produk" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />

                            </div>
                            <div className="card-body">
                                <span className="card-category cat-skincare">Perawatan Rambut</span>
                                <div className="card-name">Belgie Hair Tonic</div>
                                <div className="card-tagline">Berbahan Anagain Swiss • Spray</div>
                                <p className="card-desc">Mengandung Anagain — bahan aktif dari ekstrak kacang hijau Swiss (Pisum
                                    Sativum) yang merangsang folikel rambut dan memperpanjang fase pertumbuhan.</p>
                                <ul className="card-benefits">
                                    <li>Menutrisi & menguatkan rambut</li>
                                    <li>Rambut tampak lebih tebal</li>
                                    <li>Mengurangi rontok & menumbuhkan rambut baru</li>
                                    <li>Sensasi dingin di kepala — terasa menyegarkan</li>
                                </ul>
                                <div className="card-specs">
                                    <span className="spec-tag">💆 Spray</span>
                                    <span className="spec-tag">📦 100 ML</span>
                                    <span className="spec-tag">🌿 Anagain Swiss</span>
                                </div>
                                <div className="card-footer">
                                    <div className="price-wrap">
                                        <span className="price">Rp 195.000</span>
                                        <span className="price-note">Spray 100 ML</span>
                                    </div>
                                    <a href="https://wa.me/62?text=Halo%2C%20saya%20mau%20order%20Belgie%20Hair%20Tonic"
                                        className="btn-wa">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path
                                                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        Pesan
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/*  BP NORWAY  */}
                        <div className={`product-card fade-in ${activeCategory === 'all' || activeCategory === 'suplemen' ? 'visible' : 'hidden'}`}>
                            <div className="card-img">
                                <div className="card-img-bg blue"></div>
                                <img src="https://placehold.co/400x500/eaeaea/5a6b5c?text=Foto+Produk\n(Rekomendasi:+400x500px)" alt="Placeholder Produk" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />

                            </div>
                            <div className="card-body">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <span className="card-category cat-supplement" style={{ marginBottom: '0' }}>Suplemen Otak</span>
                                    <span
                                        style={{ background: 'linear-gradient(90deg,#FFD700,#FFA500)', color: '#000', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '10px', letterSpacing: '1px' }}>NEW</span>
                                </div>
                                <div className="card-name">BP Norway</div>
                                <div className="card-tagline">Atlantic Salmon Oil • Anak Pintar & Sehat</div>
                                <p className="card-desc">Suplemen otak dari Atlantic Salmon Oil perairan Norwegia. Kaya DHA,
                                    EPA, DPA, Omega-3, Astaxanthin dan Asam Amino Esensial (AAE) untuk tumbuh kembang
                                    optimal.</p>
                                <ul className="card-benefits">
                                    <li>DHA — menstimulus otak berkembang normal</li>
                                    <li>EPA — mengurangi peradangan & depresi</li>
                                    <li>Astaxanthin — melindungi sel dari kerusakan</li>
                                    <li>AAE — nutrisi penting tumbuh kembang anak</li>
                                </ul>
                                <div className="card-specs">
                                    <span className="spec-tag">💊 Soft Kapsul</span>
                                    <span className="spec-tag">📦 40 Kapsul</span>
                                    <span className="spec-tag">🐟 Salmon Oil</span>
                                </div>
                                <div className="card-footer">
                                    <div className="price-wrap">
                                        <span className="price">Rp 250.000</span>
                                        <span className="price-note">40 Soft Capsules</span>
                                    </div>
                                    <a href="https://wa.me/62?text=Halo%2C%20saya%20mau%20order%20BP%20Norway"
                                        className="btn-wa">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path
                                                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        Pesan
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/*  STEFFI  */}
                        <div className={`product-card fade-in ${activeCategory === 'all' || activeCategory === 'natural' ? 'visible' : 'hidden'}`}>
                            <div className="card-img">
                                <div className="card-img-bg blue"></div>
                                <img src="https://placehold.co/400x500/eaeaea/5a6b5c?text=Foto+Produk\n(Rekomendasi:+400x500px)" alt="Placeholder Produk" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />

                            </div>
                            <div className="card-body">
                                <span className="card-category cat-natural">Natural Sweetener</span>
                                <div className="card-name">Steffi Pro</div>
                                <div className="card-tagline">Pengganti Gula Alami • Aman untuk Diabetes</div>
                                <p className="card-desc">Pemanis alami dari ekstrak daun Stevia Amerika. 0% gula, 0% glukosa, 0%
                                    pemanis buatan. Rasa manisnya 300× lebih manis dari gula biasa — cukup 1-2 tetes!</p>
                                <ul className="card-benefits">
                                    <li>0% Glukosa & pemanis buatan — nol kalori</li>
                                    <li>100% alami, mudah larut & tak berkerak</li>
                                    <li>Aman untuk penderita diabetes</li>
                                    <li>Wujudkan keluarga sehat dengan pengganti gula alami</li>
                                </ul>
                                <div className="card-specs">
                                    <span className="spec-tag">💧 Cair</span>
                                    <span className="spec-tag">📦 30 ML</span>
                                    <span className="spec-tag">🌿 Stevia Extract</span>
                                </div>
                                <div className="card-footer">
                                    <div className="price-wrap">
                                        <span className="price-old">Rp 250.000</span>
                                        <span className="price">Rp 195.000</span>
                                        <span className="price-note">🔥 Harga Promo</span>
                                    </div>
                                    <a href="https://wa.me/62?text=Halo%2C%20saya%20mau%20order%20Steffi%20Pro"
                                        className="btn-wa">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path
                                                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        Pesan
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/*  ABOUT / FEATURES  */}
            <section className="about-bg">
                <div className="container">
                    <div className="about-grid">
                        <div>
                            <span className="section-label">Mengapa BP Group?</span>
                            <h2 className="section-title fade-in" style={{ marginBottom: '12px' }}>Bisnis Praktis<br /><span
                                style={{ color: 'var(--gold-light)' }}>Bertabur Pahala</span></h2>
                            <p className="section-desc" style={{ marginBottom: '40px' }}>BP GROUP berkomitmen menjaga kualitas
                                seluruh produknya. Komitmen yang sudah terbukti ini mendapatkan dukungan dari berbagai
                                kalangan — Ulama, Tokoh, dan Artis.</p>
                            <div className="about-features">
                                <div className="feature-item fade-in">
                                    <div className="feature-icon">🌿</div>
                                    <div className="feature-content">
                                        <h4>100% Bahan Alami Terpilih</h4>
                                        <p>Setiap produk dipilih dari bahan alami terbaik dari Timur dan Barat, diproses
                                            secara aman sesuai syariat Islam.</p>
                                    </div>
                                </div>
                                <div className="feature-item fade-in">
                                    <div className="feature-icon">☪️</div>
                                    <div className="feature-content">
                                        <h4>Halal & Teruji BPOM</h4>
                                        <p>Seluruh produk memiliki sertifikasi Halal MUI dan terdaftar di BADAN POM
                                            Indonesia — aman dikonsumsi keluarga.</p>
                                    </div>
                                </div>
                                <div className="feature-item fade-in">
                                    <div className="feature-icon">💼</div>
                                    <div className="feature-content">
                                        <h4>Peluang Bisnis Menggiurkan</h4>
                                        <p>Bergabung sebagai mitra QM dan raih penghasilan tambahan dengan sistem yang
                                            praktis dan transparan.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="fade-in">
                            <div className="about-visual">
                                <h3>10 Karakteristik <span style={{ color: 'var(--gold-light)' }}>Mitra QM</span></h3>
                                <div className="characteristics">
                                    <div className="char-item"><span className="char-num">1</span> Menjalankan kehidupan penuh
                                        semangat beribadah</div>
                                    <div className="char-item"><span className="char-num">2</span> Kokoh dalam pendirian, keyakinan,
                                        harapan dan optimisme</div>
                                    <div className="char-item"><span className="char-num">3</span> Mengkayakan diri dengan ilmu,
                                        wawasan dan keahlian</div>
                                    <div className="char-item"><span className="char-num">4</span> Gigih, berdaya juang, pantang
                                        putus asa</div>
                                    <div className="char-item"><span className="char-num">5</span> Komitmen & disiplin dalam
                                        manajemen</div>
                                    <div className="char-item"><span className="char-num">6</span> Berkualitas dan rapih dalam
                                        setiap pekerjaan</div>
                                    <div className="char-item"><span className="char-num">7</span> Melaksanakan pola hidup sehat
                                        jasmani & rohani</div>
                                    <div className="char-item"><span className="char-num">8</span> Mampu menghasilkan nafkah yang
                                        baik</div>
                                    <div className="char-item"><span className="char-num">9</span> Semangat kerja sama & spirit
                                        berbagi</div>
                                    <div className="char-item"><span className="char-num">10</span> Bermanfaat bagi orang lain &
                                        masyarakat luas</div>
                                </div>
                            </div>

                            {/*  Founder  */}
                            <div className="founder-card fade-in">
                                <div className="founder-avatar overflow-hidden">
                                    <img src="https://placehold.co/200x200/d1fae5/059669?text=Foto+Profil\n(200x200px)" alt="Founder Avatar Placeholder" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="founder-name">Akhmad Musyaffa' Arwani</div>
                                    <div className="founder-title">Gus Akhmad • Founder Quantum Millionaire</div>
                                    <div className="founder-quote">"Ketika banyak energi positif yang berkumpul bersinergi,
                                        insya Allah akan mendatangkan keajaiban-keajaiban secara kuantum."</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        <span className="spec-tag">Pencetak Ribuan Pengusaha</span>
                                        <span className="spec-tag">Licensed Trainer Ippho Santosa</span>
                                        <span className="spec-tag">Internet & Social Media Marketing</span>
                                    </div>
                                </div>
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
                        <p style={{ marginTop: '10px' }}>Simak pengalaman nyata dari mereka yang telah merasakan khasiat produk BP Group.</p>
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
                        <p className="section-desc">Hubungi kami sekarang untuk konsultasi produk atau bergabung sebagai mitra bisnis BP Group Quantum Millionaire.</p>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <a href={getOrderLink("Halo kak, saya mau konsultasi / bergabung sebagai mitra BP Group")} className="btn-cta-wa">
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
                <div className="logo-text">BP Group</div>
                <p>Komunitas Bisnis Quantum Millionaire<br />
                    Diterbitkan untuk kalangan internal dan terbatas.<br />
                    © 2025 BP Group — Healthy Living Guide</p>
            </footer>

            {/*  STICKY WA  */}
            <a href="https://wa.me/62" className="sticky-wa" title="Hubungi via WhatsApp">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path
                        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            </a>



        </div>
    );
}
