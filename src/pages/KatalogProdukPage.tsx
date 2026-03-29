import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '@/styles/katalog.css';
import '@/styles/ai-advisor.css';
import { KATALOG_PRODUCTS } from '@/data/katalogProducts';
import { TestimoniSection } from '@/components/TestimoniSection';
import { generateAIAdvice, RAGResult } from '@/lib/geminiRAG';

// ─── Konstanta ───────────────────────────────────────────────────────────────

const COMPLAINT_OPTIONS = [
    "😴 Susah Tidur", "🦴 Nyeri Sendi", "😷 Imun Lemah", "👁️ Mata Lelah",
    "🩸 Gula Darah Tinggi", "🧒 Anak Susah Makan", "💆 Rambut Rontok", "✨ Kulit Kusam",
    "🤧 Sering Flu", "🧠 Kurang Fokus", "☀️ Flek Hitam", "⚡ Kurang Stamina"
];

const KELUHAN_FILTER_TABS = [
    { key: 'all', label: '🌿 Semua' },
    { key: 'tidur', label: '😴 Susah Tidur' },
    { key: 'sendi', label: '🦴 Nyeri Sendi' },
    { key: 'imun', label: '😷 Imun Lemah' },
    { key: 'mata', label: '👁️ Mata Lelah' },
    { key: 'gula', label: '🩸 Gula Darah' },
    { key: 'anak', label: '🧒 Anak' },
    { key: 'rambut', label: '💆 Rambut Rontok' },
    { key: 'kulit', label: '✨ Kulit & Flek' },
    { key: 'flu', label: '🤧 Sering Flu' },
    { key: 'fokus', label: '🧠 Kurang Fokus' },
    { key: 'stamina', label: '⚡ Stamina' },
    { key: 'wanita', label: '👩 Hormon Wanita' },
];

const KELUHAN_PRODUCTS: Record<string, string[]> = {
    all: [],
    tidur: ['brassic-pro'],
    sendi: ['brassic-pro', 'british-propolis'],
    imun: ['british-propolis', 'british-propolis-green'],
    mata: ['brassic-eye'],
    gula: ['steffi-pro'],
    anak: ['british-propolis-green'],
    rambut: ['belgie-hair-tonic'],
    kulit: ['belgie-serum', 'belgie-facial-wash', 'belgie-day-cream', 'belgie-night-cream'],
    flu: ['british-propolis', 'british-propolis-green'],
    fokus: ['bp-norway', 'brassic-pro'],
    stamina: ['british-propolis', 'bp-norway'],
    wanita: ['british-propolis-blue'],
};

const PRODUCT_NAME_TO_ID: Record<string, string> = {
    'british propolis green': 'british-propolis-green',
    'british propolis blue': 'british-propolis-blue',
    'british propolis': 'british-propolis',
    'brassic pro': 'brassic-pro',
    'brassic eye': 'brassic-eye',
    'bp norway': 'bp-norway',
    'belgie facial wash': 'belgie-facial-wash',
    'belgie anti aging serum': 'belgie-serum',
    'belgie serum': 'belgie-serum',
    'belgie day cream': 'belgie-day-cream',
    'belgie night cream': 'belgie-night-cream',
    'belgie hair tonic': 'belgie-hair-tonic',
    'steffi pro': 'steffi-pro',
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function getRecommendedIds(rekomendasi: RAGResult['rekomendasi']): string[] {
    const ids = new Set<string>();
    rekomendasi.forEach(r => {
        const nameLower = r.name.toLowerCase();
        Object.entries(PRODUCT_NAME_TO_ID).forEach(([key, id]) => {
            if (nameLower.includes(key) || key.includes(nameLower)) ids.add(id);
        });
    });
    return Array.from(ids);
}

// ─── WA Icon SVG ─────────────────────────────────────────────────────────────

const WaIcon = ({ size = 20, color = 'white' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

// ─── Komponen Utama ───────────────────────────────────────────────────────────

export default function KatalogProdukPage() {

    // ── State ──
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeKeluhan, setActiveKeluhan] = useState('all');
    const [selectedKeluhan, setSelectedKeluhan] = useState<string[]>([]);
    const [complaintText, setComplaintText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<RAGResult | null>(null);

    // ── Refs untuk navigasi ──
    const sectionAdvisorRef = useRef<HTMLElement>(null);
    const sectionProdukRef = useRef<HTMLElement>(null);
    const sectionBisnisRef = useRef<HTMLElement>(null);
    const aiResultRef = useRef<HTMLDivElement>(null);

    // ── Scroll + Fade-in observer ──
    useEffect(() => {
        window.scrollTo(0, 0);
        const observer = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); }),
            { threshold: 0.08 }
        );
        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    // ── WA link helper ──
    const getWaLink = (text: string) =>
        `https://wa.me/6287782697973?text=${encodeURIComponent(text || 'Halo kak, saya mau konsultasi produk Quantum Millionaire')}`;

    // ── Scroll helper ──
    const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // ── AI Advisor handlers ──
    const toggleComplaint = (opt: string) => {
        const next = selectedKeluhan.includes(opt)
            ? selectedKeluhan.filter(c => c !== opt)
            : [...selectedKeluhan, opt];
        setSelectedKeluhan(next);
        const manual = complaintText.split(',').map(p => p.trim()).filter(p => !COMPLAINT_OPTIONS.includes(p));
        setComplaintText([...next, ...manual].join(', '));
    };

    const handleTextChange = (val: string) => {
        setComplaintText(val);
        setSelectedKeluhan(COMPLAINT_OPTIONS.filter(opt => val.includes(opt)));
    };

    const handleAnalyze = async () => {
        if (!selectedKeluhan.length && !complaintText.trim()) return;
        setIsAnalyzing(true);
        setAiResult(null);
        try {
            const result = await generateAIAdvice(selectedKeluhan, complaintText);
            setAiResult(result);
            setTimeout(() => aiResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
        } catch {
            setAiResult({ empati: 'Maaf, ada kendala teknis. Tim kami siap membantu via WhatsApp.', edukasi: '', tips_gaya_hidup: [], rekomendasi: [], cta: '' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ── Produk rekomendasi dari AI ──
    const recommendedIds = aiResult ? getRecommendedIds(aiResult.rekomendasi) : [];
    const recommendedProducts = KATALOG_PRODUCTS.filter(p => recommendedIds.includes(p.id));

    // ── Filter produk di katalog ──
    const filteredProducts = useMemo(() => {
        return KATALOG_PRODUCTS.filter(p => {
            const catOk = activeCategory === 'all' || p.category === activeCategory;
            const kelOk = activeKeluhan === 'all' || KELUHAN_PRODUCTS[activeKeluhan]?.includes(p.id);
            return catOk && kelOk;
        });
    }, [activeCategory, activeKeluhan]);

    const isFiltering = activeKeluhan !== 'all' || activeCategory !== 'all';

    const handleKeluhanFilter = useCallback((key: string) => {
        setActiveKeluhan(key);
        setActiveCategory('all');
    }, []);

    const handleCategoryFilter = useCallback((cat: string) => {
        setActiveCategory(cat);
        setActiveKeluhan('all');
    }, []);

    const resetFilter = useCallback(() => {
        setActiveKeluhan('all');
        setActiveCategory('all');
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="katalog-page-wrapper">

            {/* ════════════════ NAV ════════════════ */}
            <nav>
                <div className="nav-logo-wrap">
                    <Link to="/katalog" className="nav-logo">
                        <img src="/images/qm-logo.webp" alt="Quantum Millionaire"
                            style={{ height: '50px', width: 'auto', display: 'block', minWidth: '100px' }}
                            onError={e => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML += '<span style="font-weight:bold;color:var(--green-dark)">Quantum Millionaire</span>';
                            }} />
                    </Link>
                </div>
                <ul className="nav-links desktop-only">
                    <li><a href="#advisor">AI Advisor</a></li>
                    <li><a href="#produk">Produk</a></li>
                    <li><a href="#bisnis">Bisnis</a></li>
                </ul>
                <div className="nav-right desktop-only">
                    <a href={getWaLink('Halo kak, saya mau konsultasi produk Quantum Millionaire')} target="_blank" rel="noopener noreferrer" className="nav-cta">
                        <span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '6px', verticalAlign: 'bottom' }}>chat</span>
                        Hubungi Kami
                    </a>
                </div>
                <div className="mobile-controls mobile-only">
                    <a href={getWaLink('Halo kak, saya mau konsultasi')} target="_blank" rel="noopener noreferrer" className="btn-wa-sm">
                        <span className="material-symbols-rounded">chat</span> WA
                    </a>
                    <button className="hamburger-btn" type="button">
                        <span className="line" /><span className="line" /><span className="line" />
                    </button>
                </div>
            </nav>

            {/* ════════════════════════════════════════════════════════
                DUNIA 1 — AI ADVISOR FLOW
            ════════════════════════════════════════════════════════ */}
            <section className="world-section world-advisor" id="advisor" ref={sectionAdvisorRef}>

                {/* Label dunia */}
                <div className="world-label">
                    <span className="material-symbols-rounded">health_and_safety</span>
                    Konsultasi Kesehatan
                </div>

                {/* ── AI Advisor Card ── */}
                <div className="advisor-embed-container">
                    <div className="advisor-embed-card fade-in">

                        <div className="advisor-embed-header">
                            <div className="advisor-live-badge">
                                <span className="advisor-dot" />
                                <span>AI Health Advisor</span>
                                <span className="advisor-free-tag">Gratis</span>
                            </div>
                            <h1 className="advisor-embed-title">
                                Bingung Pilih Produk?<br />
                                <em>Ceritakan Keluhanmu</em>
                            </h1>
                            <p className="advisor-embed-sub">
                                Pilih keluhan di bawah — AI kami rekomendasikan produk paling tepat dalam hitungan detik.
                            </p>
                        </div>

                        <div className="chips-wrap advisor-chips">
                            {COMPLAINT_OPTIONS.map(opt => (
                                <button key={opt} type="button"
                                    className={`chip ${selectedKeluhan.includes(opt) ? 'active' : ''}`}
                                    onClick={() => toggleComplaint(opt)}
                                >{opt}</button>
                            ))}
                        </div>

                        <textarea className="ai-textarea"
                            placeholder="Atau ceritakan keluhan Anda secara lengkap di sini (opsional)..."
                            value={complaintText}
                            onChange={e => handleTextChange(e.target.value)}
                            rows={3}
                        />

                        <button type="button" className="btn-analyze"
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || (!selectedKeluhan.length && !complaintText.trim())}
                        >
                            {isAnalyzing
                                ? <><span className="ai-spinner" style={{ display: 'block' }} />Sedang Menganalisis...</>
                                : <><span className="material-symbols-rounded" style={{ fontSize: '20px' }}>health_and_safety</span>Analisis & Rekomendasikan Produk</>
                            }
                        </button>

                        <div className="advisor-trust-row">
                            {['✅ Gratis', '⚡ <10 detik', '🔒 Privasi aman', '🤖 Powered by AI'].map(t => (
                                <span key={t} className="advisor-trust-pill">{t}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── AI Result (muncul setelah analisis) ── */}
                {aiResult && (
                    <div className="ai-result-world" ref={aiResultRef}>
                        <div className="ai-result-container">

                            {/* Empati */}
                            <div className="advisor-empati-block fade-in">
                                <span className="advisor-empati-icon">💚</span>
                                <p className="advisor-empati-text">{aiResult.empati}</p>
                            </div>

                            {/* Tips Gaya Hidup */}
                            {aiResult.tips_gaya_hidup.length > 0 && (
                                <div className="advisor-tips-block fade-in">
                                    <div className="advisor-tips-label">
                                        <span className="material-symbols-rounded">tips_and_updates</span>
                                        Tips Gaya Hidup untuk Kamu
                                    </div>
                                    <div className="lifestyle-tips">
                                        {aiResult.tips_gaya_hidup.slice(0, 3).map((tip, i) => (
                                            <div key={i} className="tip-item">
                                                <div className="tip-icon">{tip.icon}</div>
                                                <div className="tip-text"><strong>{tip.title}</strong>: {tip.description}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Produk Rekomendasi Inline ── */}
                            {recommendedProducts.length > 0 && (
                                <div className="inline-reco-section fade-in">
                                    <div className="inline-reco-header">
                                        <span className="material-symbols-rounded">medication</span>
                                        <div>
                                            <div className="inline-reco-title">Produk yang Cocok untuk Kamu</div>
                                            <div className="inline-reco-sub">Dipilih AI berdasarkan keluhanmu</div>
                                        </div>
                                    </div>
                                    <div className="inline-reco-list">
                                        {recommendedProducts.map(product => {
                                            const recoData = aiResult.rekomendasi.find(r =>
                                                r.name.toLowerCase().includes(product.name.toLowerCase().split(' ')[0].toLowerCase())
                                            );
                                            const waMsg = `Halo kak, saya mau konsultasi/pesan ${product.name} untuk keluhan: ${selectedKeluhan.map(k => k.replace(/^[^\s]+\s/, '')).join(', ')}`;
                                            return (
                                                <div key={product.id} className="inline-reco-card">
                                                    <div className={`inline-reco-img card-img-bg-wrap ${product.bgStyle}`}>
                                                        {product.image
                                                            ? <img src={product.image} alt={product.name} />
                                                            : <span className="material-symbols-rounded">{product.emoji}</span>
                                                        }
                                                    </div>
                                                    <div className="inline-reco-body">
                                                        <div className="inline-reco-name">{product.name}</div>
                                                        {recoData?.reason && (
                                                            <div className="inline-reco-reason">{recoData.reason}</div>
                                                        )}
                                                        <div className="inline-reco-price">{product.price}</div>
                                                    </div>
                                                    <a href={getWaLink(waMsg)} target="_blank" rel="noopener noreferrer"
                                                        className="inline-reco-wa-btn">
                                                        <WaIcon size={16} />
                                                        <span>Pesan</span>
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* CTA lihat semua produk */}
                                    <button type="button" className="inline-reco-see-all"
                                        onClick={() => scrollTo(sectionProdukRef)}>
                                        <span className="material-symbols-rounded">expand_more</span>
                                        Lihat Semua Produk Kami
                                    </button>
                                </div>
                            )}

                            {/* ── Testimoni Terkait ── */}
                            <div className="inline-testimoni-section fade-in">
                                <div className="inline-section-header">
                                    <span className="material-symbols-rounded">format_quote</span>
                                    <div>
                                        <div className="inline-section-title">Cerita Nyata dari Pengguna</div>
                                        <div className="inline-section-sub">
                                            {selectedKeluhan.length > 0
                                                ? `Testimoni untuk keluhan: ${selectedKeluhan.map(k => k.replace(/^[^\s]+\s/, '')).join(', ')}`
                                                : 'Testimoni pilihan dari pelanggan kami'
                                            }
                                        </div>
                                    </div>
                                </div>
                                <TestimoniSection activeKeluhan={selectedKeluhan} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Separator bawah Dunia 1 */}
                <div className="world-divider">
                    <span>Jelajahi Lebih Lanjut</span>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════
                DUNIA 2 — KATALOG PRODUK
            ════════════════════════════════════════════════════════ */}
            <section className="world-section world-produk" id="produk" ref={sectionProdukRef}>

                <div className="world-label">
                    <span className="material-symbols-rounded">inventory_2</span>
                    Katalog Produk
                </div>

                <div className="container">

                    {/* ─── Merged Catalog Hero ─── */}
                    <div className="brand-hero catalog-merged-hero fade-in">
                        <div className="brand-hero-left">
                            <span className="section-tag">Healthy Living Guide</span>
                            <h2 className="brand-title">
                                Semua Produk <em>British Propolis</em>
                                <span className="brand-subtitle">(Komunitas Bisnis Quantum Millionaire)</span>
                            </h2>
                            <p className="brand-desc">
                                Hasil terbaik dari lebah habitat 4 musim di East Yorkshire, Inggris dengan kadar Flavonoid superior. Suplemen premium yang telah teruji BPOM/FDA, diproses Halal (MUI/HMC), dan terbukti efektif untuk kesehatan keluarga secara internasional.
                            </p>
                            <div className="brand-stats">
                                {[
                                    { num: '12+', label: 'Produk Unggulan' },
                                    { num: '4', label: 'Kategori Utama' },
                                    { num: '10rb+', label: 'Keluarga Terlayani' },
                                    { num: '2018', label: 'Berdiri Sejak' },
                                ].map(s => (
                                    <div key={s.label}>
                                        <span className="bstat-num">{s.num}</span>
                                        <div className="bstat-label">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="brand-hero-right">
                            <div className="brand-img-grid ingredient-grid">
                                {[
                                    { src: '/images/katalog/propolis-400.webp', title: 'British Propolis', desc: '100% Ekstrak Asli Inggris' },
                                    { src: '/images/katalog/moringa-400.webp', title: 'Moringa Oleifera', desc: 'Superfood Anti Inflamasi' },
                                    { src: '/images/katalog/salmon-400.webp', title: 'Salmon Omega-3', desc: 'Tinggi DHA dari Norwegia' },
                                    { src: '/images/katalog/collagen-400.webp', title: 'Marine Collagen', desc: 'Anti Aging Alami' },
                                ].map(item => (
                                    <div key={item.title} className="brand-img-card ingredient-card">
                                        <img src={item.src} alt={item.title} className="ingredient-img" />
                                        <div className="ingredient-info">
                                            <span className="title">{item.title}</span>
                                            <span className="desc">{item.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Trust Bar (Inline under Hero) */}
                    <div className="trust-bar trust-bar-inline fade-in">
                        {[
                            { icon: 'verified_user', text: 'BPOM RI' },
                            { icon: 'verified', text: 'Halal MUI' },
                            { icon: 'security', text: 'FDA USA Registered' },
                            { icon: 'workspace_premium', text: 'HMC UK Halal certified' },
                        ].map((item, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <div className="trust-sep" />}
                                <div className="trust-item">
                                    <span className="material-symbols-rounded icon" style={{ fontSize: '18px' }}>{item.icon}</span>
                                    {item.text}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* ── Compact Filter Bar ── */}
                    <div className="compact-filter-bar fade-in">

                        {/* Row 1 — Keluhan */}
                        <div className="compact-filter-row">
                            <span className="compact-filter-label">
                                <span className="material-symbols-rounded">favorite</span>
                                Keluhan
                            </span>
                            <div className="compact-filter-chips keluhan-tabs">
                                {KELUHAN_FILTER_TABS.map(tab => (
                                    <button key={tab.key} type="button"
                                        className={`cfc-chip ${activeKeluhan === tab.key ? 'active' : ''}`}
                                        onClick={() => handleKeluhanFilter(tab.key)}
                                    >{tab.label}</button>
                                ))}
                            </div>
                        </div>

                        <div className="compact-filter-divider" />

                        {/* Row 2 — Kategori */}
                        <div className="compact-filter-row">
                            <span className="compact-filter-label">
                                <span className="material-symbols-rounded">category</span>
                                Kategori
                            </span>
                            <div className="compact-filter-chips">
                                {[
                                    { key: 'all', label: '🌿 Semua' },
                                    { key: 'propolis', label: '🍯 Propolis' },
                                    { key: 'skincare', label: '✨ Skincare' },
                                    { key: 'suplemen', label: '💊 Suplemen' },
                                    { key: 'natural', label: '🌾 Natural' },
                                ].map(cat => (
                                    <button key={cat.key} type="button"
                                        className={`cfc-chip ${activeCategory === cat.key ? 'active' : ''}`}
                                        onClick={() => handleCategoryFilter(cat.key)}
                                    >{cat.label}</button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Filter result info bar */}
                    {isFiltering && (
                        <div className="filter-result-bar">
                            {filteredProducts.length > 0 ? (
                                <>
                                    <span className="material-symbols-rounded">check_circle</span>
                                    <strong>{filteredProducts.length}</strong> produk ditemukan
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-rounded">search_off</span>
                                    Tidak ada produk yang cocok
                                </>
                            )}
                            <button type="button" className="filter-reset-link" onClick={resetFilter}>
                                Lihat Semua ✕
                            </button>
                        </div>
                    )}

                    {/* Product Grid */}
                    {filteredProducts.length > 0 ? (
                        <div className="product-grid" id="productGrid">
                            {filteredProducts.map((product, idx) => {
                                const waMsg = `Halo kak, saya mau konsultasi/tanya-tanya/pesan ${product.name}`;
                                return (
                                    <div key={product.id}
                                        className="product-card product-card-animated"
                                        style={{ animationDelay: `${idx * 60}ms` }}>
                                        <div className="card-inner">
                                            <div className="card-img" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--green-ultra)', overflow: 'hidden' }}>
                                                <div className={`card-img-bg ${product.bgStyle}`} />
                                                {product.image
                                                    ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 2 }} />
                                                    : <span className="material-symbols-rounded" style={{ fontSize: '72px', color: 'var(--green-dark)', position: 'relative', zIndex: 2 }}>{product.emoji}</span>
                                                }
                                            </div>
                                            <div className="card-body">
                                                <span className={`card-badge badge-${product.badgeColor}`}>{product.badgeText}</span>
                                                <div className="card-name">{product.name}</div>
                                                <div className="card-tagline">{product.tagline}</div>
                                                <p className="card-desc">{product.description}</p>
                                                <ul className="card-benefits">
                                                    {product.benefits.map((b, i) => <li key={i}>{b}</li>)}
                                                </ul>
                                                <div className="card-specs">
                                                    {product.specs.map((s, i) => (
                                                        <span key={i} className="spec-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>{s.icon}</span>{s.text}
                                                        </span>
                                                    ))}
                                                </div>
                                                {product.nomorRegistrasi && (
                                                    <div className="card-registrasi">
                                                        <span className="material-symbols-rounded" style={{ fontSize: '13px' }}>verified_user</span>
                                                        <span>No. Reg: <strong>{product.nomorRegistrasi}</strong></span>
                                                    </div>
                                                )}
                                                <div className="card-footer" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
                                                    <div className="price-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginBottom: '4px' }}>
                                                        <div>
                                                            {product.oldPrice && <span className="price-old" style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '11px', marginRight: '6px' }}>{product.oldPrice}</span>}
                                                            <span className="price">{product.price}</span>
                                                        </div>
                                                        <span className="price-note">{product.priceNote}</span>
                                                    </div>
                                                    {product.hargaTier && product.hargaTier.length > 0 && (
                                                        <div className="price-tier-table">
                                                            <div className="price-tier-header">
                                                                <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>sell</span>
                                                                Harga Mitra
                                                            </div>
                                                            {product.hargaTier.map((tier, i) => (
                                                                <div key={i} className="price-tier-row">
                                                                    <span className="tier-label">{tier.label} <span className="tier-qty">({tier.minQty})</span></span>
                                                                    <span className="tier-price">{tier.harga}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <a href={getWaLink(waMsg)} target="_blank" rel="noopener noreferrer"
                                                        className="btn-cta-wa" style={{ width: '100%', justifyContent: 'center' }}>
                                                        <span className="material-symbols-rounded" style={{ marginRight: '8px' }}>chat_bubble</span>
                                                        Konsultasi & Pesan via WA
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : isFiltering ? (
                        <div className="filter-empty-state">
                            <span style={{ fontSize: '48px' }}>🔍</span>
                            <p>Tidak ada produk untuk keluhan ini.</p>
                            <button type="button" className="cfc-chip active" onClick={resetFilter}>
                                Tampilkan Semua Produk
                            </button>
                        </div>
                    ) : null}

                </div>

                <div className="world-divider">
                    <span>Peluang Bisnis</span>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════
                DUNIA 3 — TENTANG BISNIS (Placeholder)
            ════════════════════════════════════════════════════════ */}
            <section className="world-section world-bisnis" id="bisnis" ref={sectionBisnisRef}>

                <div className="world-label world-label-gold">
                    <span className="material-symbols-rounded">handshake</span>
                    Peluang Bisnis
                </div>

                <div className="container">

                    {/* Hero Bisnis */}
                    <div className="bisnis-hero fade-in">
                        <div className="bisnis-hero-badge">
                            <span className="material-symbols-rounded">trending_up</span>
                            Quantum Millionaire Partner Program
                        </div>
                        <h2 className="bisnis-hero-title">
                            Bukan Sekadar Konsumen —<br />
                            <em>Jadilah Mitra & Raih Penghasilan</em>
                        </h2>
                        <p className="bisnis-hero-sub">
                            Bergabunglah bersama ribuan mitra aktif Quantum Millionaire.
                            Bangun bisnis kesehatan yang menguntungkan sambil membantu orang-orang di sekitarmu hidup lebih sehat.
                        </p>
                        <a href={getWaLink('Halo kak, saya tertarik bergabung sebagai Mitra Bisnis Quantum Millionaire. Bisa minta info lengkapnya?')}
                            target="_blank" rel="noopener noreferrer"
                            className="bisnis-hero-cta">
                            <WaIcon size={20} />
                            Saya Mau Jadi Mitra — Info Lengkap via WA
                        </a>
                    </div>

                    {/* Keuntungan Menjadi Mitra */}
                    <div className="bisnis-keuntungan-section fade-in">
                        <div className="world-section-header" style={{ marginBottom: '32px' }}>
                            <span className="tag">Mengapa Bergabung?</span>
                            <h3>Hak & Keuntungan Mitra <em>Quantum Millionaire</em></h3>
                        </div>
                        <div className="bisnis-cards-grid">
                            {[
                                { icon: '💰', title: 'Harga Kemitraan', desc: 'Dapatkan harga khusus mitra mulai dari Rp 150.000/botol — jauh lebih hemat dari harga eceran.' },
                                { icon: '🎓', title: 'Pembinaan Langsung', desc: 'Dibimbing langsung oleh Mas Ippho, para Leader, dan Mentor berpengalaman sampai menghasilkan.' },
                                { icon: '📱', title: 'Bahan Promosi Harian', desc: 'Setiap hari mendapatkan materi promosi siap pakai untuk langsung dibagikan ke calon pelanggan.' },
                                { icon: '📚', title: 'Akses Pendidikan', desc: 'Akses penuh ke materi Knowledge & Skill untuk meningkatkan kemampuan bisnis dan produk.' },
                                { icon: '🌐', title: 'Komunitas & Grup WA', desc: 'Bergabung ke komunitas aktif dan grup-grup WhatsApp untuk saling support dan sharing.' },
                                { icon: '📈', title: 'Potensi Untung Besar', desc: 'Untung hingga Rp 100.000/botol dengan potensi maksimal Rp 20.000.000 dari paket SE 200 Botol.' },
                            ].map((item, i) => (
                                <div key={i} className="bisnis-card">
                                    <div className="bisnis-card-icon">{item.icon}</div>
                                    <div className="bisnis-card-title">{item.title}</div>
                                    <div className="bisnis-card-desc">{item.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Paket Bisnis Mitra */}
                    <div className="bisnis-paket-section fade-in">
                        <div className="world-section-header" style={{ marginBottom: '32px' }}>
                            <span className="tag">Pilih Paket Kemitraan</span>
                            <h3>Mulai Bisnis dengan <em>Membeli Produk BP</em></h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>
                                Pembelian paket bisa di-MIX produknya (BP/Brassic/Norway/Steffi). Produk Belgie = Rp 195.000/botol.
                            </p>
                        </div>
                        <div className="bisnis-paket-grid">
                            {[
                                {
                                    nama: 'Paket SE',
                                    jumlah: '200 Botol',
                                    hargaPaket: 'Rp 30.000.000',
                                    modal: 'Rp 150.000',
                                    jual: 'Rp 250.000',
                                    untung: 'Rp 100.000',
                                    potensi: 'Rp 20.000.000',
                                    highlight: true,
                                },
                                {
                                    nama: 'Paket SAP',
                                    jumlah: '40 Botol',
                                    hargaPaket: 'Rp 7.200.000',
                                    modal: 'Rp 180.000',
                                    jual: 'Rp 250.000',
                                    untung: 'Rp 70.000',
                                    potensi: 'Rp 2.800.000',
                                    highlight: false,
                                },
                                {
                                    nama: 'Paket AP',
                                    jumlah: '10 Botol',
                                    hargaPaket: 'Rp 1.800.000',
                                    modal: 'Rp 180.000',
                                    jual: 'Rp 250.000',
                                    untung: 'Rp 70.000',
                                    potensi: 'Rp 700.000',
                                    highlight: false,
                                },
                            ].map((paket, i) => (
                                <div key={i} className={`bisnis-paket-card ${paket.highlight ? 'paket-highlight' : ''}`}>
                                    {paket.highlight && <div className="paket-best-badge">Paling Untung</div>}
                                    <div className="paket-header">
                                        <div className="paket-nama">{paket.nama}</div>
                                        <div className="paket-jumlah">{paket.jumlah}</div>
                                    </div>
                                    <div className="paket-harga-utama">{paket.hargaPaket}</div>
                                    <div className="paket-detail-table">
                                        <div className="paket-row">
                                            <span>Modal per botol</span>
                                            <strong>{paket.modal}</strong>
                                        </div>
                                        <div className="paket-row">
                                            <span>Harga jual satuan</span>
                                            <strong>{paket.jual}</strong>
                                        </div>
                                        <div className="paket-row paket-row-untung">
                                            <span>Untung per botol</span>
                                            <strong>{paket.untung}</strong>
                                        </div>
                                        <div className="paket-row paket-row-potensi">
                                            <span>Potensi untung max</span>
                                            <strong>{paket.potensi}</strong>
                                        </div>
                                    </div>
                                    <a href={getWaLink(`Halo kak, saya tertarik dengan ${paket.nama} (${paket.jumlah}) seharga ${paket.hargaPaket}. Bisa info lebih lanjut?`)}
                                        target="_blank" rel="noopener noreferrer"
                                        className="paket-cta-btn">
                                        <WaIcon size={16} />
                                        Ambil {paket.nama}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cara Bergabung */}
                    <div className="bisnis-steps-section fade-in">
                        <div className="world-section-header" style={{ marginBottom: '32px' }}>
                            <span className="tag">Cara Bergabung</span>
                            <h3>3 Langkah Mudah Mulai Bisnis</h3>
                        </div>
                        <div className="bisnis-steps-grid">
                            {[
                                { step: '01', icon: 'chat_bubble', title: 'Hubungi Kami', desc: 'Chat WhatsApp & ceritakan minatmu. Tim kami bantu pilihkan paket yang cocok (SE/SAP/AP).' },
                                { step: '02', icon: 'shopping_cart', title: 'Pilih & Beli Paket', desc: 'Pilih paket kemitraan (bisa MIX produk). Langsung dapat harga mitra dan akses komunitas.' },
                                { step: '03', icon: 'rocket_launch', title: 'Dibimbing Sampai Cuan', desc: 'Dapat pembinaan, bahan promosi harian, masuk grup WA, dan akses pendidikan bisnis sampai menghasilkan.' },
                            ].map((item, i) => (
                                <div key={i} className="bisnis-step-card">
                                    <div className="bisnis-step-num">{item.step}</div>
                                    <div className="bisnis-step-icon">
                                        <span className="material-symbols-rounded">{item.icon}</span>
                                    </div>
                                    <div className="bisnis-step-title">{item.title}</div>
                                    <div className="bisnis-step-desc">{item.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Bisnis */}
                    <div className="bisnis-cta-block fade-in">
                        <h3 className="bisnis-cta-title">Siap Memulai Perjalanan Bisnismu?</h3>
                        <p className="bisnis-cta-sub">Konsultasi gratis — tim kami akan bantu kamu memulai tanpa rasa bingung.</p>
                        <div className="cta-btn-group">
                            <a href={getWaLink('Halo kak, saya tertarik bergabung sebagai Mitra Bisnis Quantum Millionaire. Bisa minta info lengkapnya?')}
                                target="_blank" rel="noopener noreferrer" className="bisnis-cta-btn-primary">
                                <WaIcon size={20} />
                                Gabung Jadi Mitra via WA
                            </a>
                            <a href={getWaLink('Halo kak, saya mau konsultasi produk dulu sebelum bergabung sebagai mitra Quantum Millionaire')}
                                target="_blank" rel="noopener noreferrer" className="bisnis-cta-btn-secondary">
                                <span className="material-symbols-rounded">help_outline</span>
                                Tanya-Tanya Dulu
                            </a>
                        </div>
                    </div>

                </div>
            </section>

            {/* ════════════════ FOOTER ════════════════ */}
            <footer>
                <div className="logo-text">
                    <img src="/images/qm-logo.webp" alt="Quantum Millionaire"
                        style={{ height: '50px', width: 'auto', marginBottom: '12px' }}
                        onError={e => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML += '<div style="font-weight:bold;color:var(--green-dark);margin-bottom:12px">Quantum Millionaire</div>';
                        }} />
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    Komunitas Bisnis Quantum Millionaire<br />
                    © 2025–2026 Quantum Millionaire
                </p>
            </footer>

            {/* ════════════════ STICKY WA (Desktop) ════════════════ */}
            <a href={getWaLink('Halo kak, saya mau konsultasi produk Quantum Millionaire')}
                target="_blank" rel="noopener noreferrer"
                className="sticky-wa desktop-only" title="Hubungi via WhatsApp">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <WaIcon size={28} />
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '15px', whiteSpace: 'nowrap' }}>Chat Sekarang</span>
                </div>
            </a>

            {/* ════════════════ MOBILE STICKY BAR (4 tombol) ════════════════ */}
            <div className="mobile-sticky-bar mobile-only">
                <button type="button" className="mobile-bar-btn" onClick={() => scrollTo(sectionAdvisorRef)}>
                    <span className="material-symbols-rounded">health_and_safety</span>
                    <span>AI Advisor</span>
                </button>
                <div className="mobile-bar-divider" />
                <button type="button" className="mobile-bar-btn" onClick={() => scrollTo(sectionProdukRef)}>
                    <span className="material-symbols-rounded">inventory_2</span>
                    <span>Produk</span>
                </button>
                <div className="mobile-bar-divider" />
                <button type="button" className="mobile-bar-btn" onClick={() => scrollTo(sectionBisnisRef)}>
                    <span className="material-symbols-rounded">handshake</span>
                    <span>Bisnis</span>
                </button>
                <div className="mobile-bar-divider" />
                <a href={getWaLink('Halo kak, saya mau konsultasi produk Quantum Millionaire')}
                    target="_blank" rel="noopener noreferrer"
                    className="mobile-bar-btn mobile-bar-wa">
                    <WaIcon size={20} />
                    <span>WA</span>
                </a>
            </div>

        </div>
    );
}
