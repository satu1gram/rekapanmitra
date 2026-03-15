import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import '@/styles/katalog.css';
import { generateAIAdvice, RAGResult } from '@/lib/geminiRAG';
import { KATALOG_PRODUCTS } from '@/data/katalogProducts';
import { AIPreviewPanel } from '@/components/AIPreviewPanel';
import { useKeluhanFilter } from '@/hooks/useKeluhanFilter';

const COMPLAINT_OPTIONS = [
    "😴 Susah Tidur", "🦴 Nyeri Sendi", "😷 Imun Lemah", "👁️ Mata Lelah",
    "🩸 Gula Darah Tinggi", "🧒 Anak Susah Makan", "💆 Rambut Rontok", "✨ Kulit Kusam",
    "🤧 Sering Flu", "🧠 Kurang Fokus", "☀️ Flek Hitam", "⚡ Kurang Stamina"
];

export default function AIHealthAdvisorPage() {
    const { selectedKeluhan, setSelectedKeluhan } = useKeluhanFilter();
    const [complaintText, setComplaintText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [aiResult, setAiResult] = useState<RAGResult | null>(null);
    const resultContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to results on mobile
    useEffect(() => {
        if (aiResult && window.innerWidth <= 900) {
            setTimeout(() => {
                resultContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [aiResult]);

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
        const isSelected = selectedKeluhan.includes(complaint);
        const next = isSelected
            ? selectedKeluhan.filter(c => c !== complaint)
            : [...selectedKeluhan, complaint];

        setSelectedKeluhan(next);

        // Sinkronisasi ke textarea:
        // 1. Ambil bagian manual dari teks saat ini (yang bukan bagian dari pilihan badge)
        const parts = complaintText.split(',').map(p => p.trim()).filter(Boolean);
        const manualParts = parts.filter(p => !COMPLAINT_OPTIONS.includes(p));

        // 2. Gabungkan pilihan terbaru + bagian manual
        const finalParts = [...next, ...manualParts];
        setComplaintText(finalParts.join(', '));
    };

    const handleTextChange = (val: string) => {
        setComplaintText(val);
        // Sinkronisasi balik ke badge: nyalakan badge jika teks mengandung string pilihannya
        const activeFromText = COMPLAINT_OPTIONS.filter(opt => val.includes(opt));
        setSelectedKeluhan(activeFromText);
    };

    const handleAnalyze = async (e: React.MouseEvent) => {
        e.preventDefault();
        const hasChips = selectedKeluhan && selectedKeluhan.length > 0;
        const hasText = complaintText && complaintText.trim().length > 0;

        if (!hasChips && !hasText) return;

        setIsAnalyzing(true);
        setAiResult(null);

        try {
            const result = await generateAIAdvice(selectedKeluhan, complaintText);
            setAiResult(result);
        } catch (err) {
            console.error('[handleAnalyze] Unexpected error:', err);
            setAiResult({
                empati: "Maaf, ada kendala teknis saat memproses permintaanmu 😔",
                edukasi: "Tim kami tetap siap membantu secara langsung via WhatsApp.",
                tips_gaya_hidup: [
                    {
                        icon: "💬",
                        title: "Hubungi kami langsung",
                        description: "Tim kesehatan BP Group siap konsultasi personal — gratis dan respon cepat.",
                    },
                ],
                rekomendasi: [],
                cta: "Ceritakan kondisimu via WhatsApp dan kami bantu pilihkan yang terbaik 🌿"
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Helper to generate dynamic link
    const getOrderLink = (waText: string) => {
        const summary = `Halo kak, saya mau konsultasi. Keluhan saya: ${selectedKeluhan.join(', ')}. ${complaintText ? 'Detail: ' + complaintText : ''}`;
        const finalMessage = waText || summary;
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
                    <li><Link to="/katalog#produk">Produk</Link></li>
                    <li><Link to="/katalog#tentang">Tentang</Link></li>
                </ul>
                <div className="nav-right desktop-only">
                    <a href="https://wa.me/6287782697973" target="_blank" rel="noopener noreferrer" className="nav-cta"><span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '6px', verticalAlign: 'bottom' }}>chat</span> Hubungi Kami</a>
                </div>

                {/* Mobile Right Controls */}
                <div className="mobile-controls mobile-only">
                    <a href="https://wa.me/6287782697973" target="_blank" rel="noopener noreferrer" className="btn-wa-sm"><span className="material-symbols-rounded">chat</span> WA</a>
                    <Link to="/katalog" className="hamburger-btn">
                        <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>arrow_back</span>
                    </Link>
                </div>
            </nav>

            {/*  ════════ AI CONSULTATION — FULL PAGE ════════  */}
            <div className="ai-hero-full-page">

                {/*  LEFT: INPUT  */}
                <div className="ai-hero-left-full">
                    {/* Badge "AI Health Advisor" — lebih menarik */}
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

                    <h1 className="ai-hero-title">
                        Ceritakan<br /><em>Keluhan Kamu</em>
                    </h1>
                    <p className="text-gray-600 text-sm leading-relaxed mt-3 mb-6 max-w-sm">
                        Ceritakan kondisimu. AI kami baca keluhanmu dengan empati,
                        beri panduan hidup sehat dulu — baru rekomendasikan produk yang benar-benar cocok.
                    </p>

                    <span className="chips-label">⚡ Pilih keluhan yang kamu rasakan:</span>
                    <div className="chips-wrap">
                        {COMPLAINT_OPTIONS.map(c => (
                            <button
                                key={c}
                                className={[
                                    'px-4 py-2 rounded-full text-sm font-medium',
                                    'border transition-all duration-200 select-none',
                                    selectedKeluhan.includes(c)
                                        ? 'bg-[#3D7A4F] text-white border-[#3D7A4F] shadow-md shadow-green-200/50 scale-105'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#3D7A4F] hover:text-[#3D7A4F] hover:shadow-sm'
                                ].join(' ')}
                                onClick={() => toggleComplaint(c)}
                                aria-pressed={selectedKeluhan.includes(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <textarea
                        id="complaintText"
                        className="ai-textarea"
                        placeholder="Atau ceritakan lebih detail... Contoh: Saya sering susah tidur, lutut nyeri, dan mudah lelah."
                        value={complaintText}
                        onChange={(e) => handleTextChange(e.target.value)}
                    ></textarea>

                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || (selectedKeluhan.length === 0 && !complaintText.trim())}
                        className={[
                            'w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2 group/btn',
                            selectedKeluhan.length === 0 && !complaintText.trim()
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : isAnalyzing
                                    ? 'bg-[#3D7A4F] text-white cursor-wait'
                                    : 'bg-gradient-to-r from-[#3D7A4F] to-[#52B788] text-white shadow-lg shadow-green-200/50 hover:shadow-xl hover:shadow-green-200/60 hover:-translate-y-0.5 active:translate-y-0'
                        ].join(' ')}
                    >
                        {/* Shimmer effect */}
                        {!isAnalyzing && selectedKeluhan.length > 0 && (
                            <div className="absolute inset-0 -skew-x-12 translate-x-[-200%] bg-white/20 w-1/3 group-hover/btn:translate-x-[400%] transition-transform duration-700" />
                        )}

                        {isAnalyzing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Menganalisis...</span>
                            </>
                        ) : selectedKeluhan.length === 0 && !complaintText.trim() ? (
                            <>
                                <span>⬆️</span>
                                <span>Pilih keluhan dulu di atas</span>
                            </>
                        ) : (
                            <>
                                <span className="text-xl">🔍</span>
                                <span>Analisis Kondisiku — Gratis!</span>
                            </>
                        )}
                    </button>

                    {!isAnalyzing && (
                        <p className="text-center text-xs text-gray-400 mt-2">
                            {selectedKeluhan.length > 0
                                ? `${selectedKeluhan.length} keluhan dipilih · Klik untuk dapatkan panduan personal`
                                : 'Pilih minimal 1 keluhan atau ceritakan kondisimu'}
                        </p>
                    )}
                </div>

                {/*  RIGHT: RESULT  */}
                <div className="ai-hero-right-full" ref={resultContainerRef}>
                    <AIPreviewPanel
                        selectedChips={selectedKeluhan}
                        manualText={complaintText.split(',').map(p => p.trim()).filter(p => p && !COMPLAINT_OPTIONS.includes(p)).join(', ')}
                        isLoading={isAnalyzing}
                        hasResult={!!aiResult}
                        onKeluhanChange={setSelectedKeluhan}
                    />

                    {/*  Result  */}
                    {aiResult && (
                        <div
                            className="result-content show animate-[fadeInUp_0.5s_ease-out_forwards]"
                            id="resultContent"
                            style={{ scrollBehavior: 'smooth' }}
                            key={JSON.stringify(aiResult)}
                        >
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
                                    const catalogProduct = KATALOG_PRODUCTS.find(p => {
                                        const pName = p.name.toLowerCase();
                                        const aiName = prod.name.toLowerCase();
                                        if (pName.includes(aiName) || aiName.includes(pName)) return true;
                                        // Case specific handling for Belgie Serum
                                        if (aiName.includes('belgie') && aiName.includes('serum') && pName.includes('belgie') && pName.includes('serum')) return true;
                                        return false;
                                    });
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
                                                {/* Price removed as per user request */}
                                            </div>
                                            <Link to="/katalog#produk" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', border: '1.5px solid var(--green)', padding: '6px 14px', borderRadius: '8px', whiteSpace: 'nowrap', textDecoration: 'none', transition: 'all 0.2s' }}>
                                                Lihat Detail
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 6. CTA WHATSAPP */}
                            <a href={getOrderLink("Halo kak, saya mau tanya-tanya dulu tentang konsultasi kesehatan AI Quantum Millionaire tadi...")} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', background: '#25D366', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 600, textAlign: 'center', textDecoration: 'none', marginBottom: '4px' }}>
                                <span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '6px', verticalAlign: 'bottom' }}>chat</span> {aiResult.cta || "Konsultasi Lebih Lanjut via WhatsApp"}
                            </a>
                            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '32px' }}>
                                Gratis Konsultasi • Terpercaya • Balas Secepatnya
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/*  BACK TO KATALOG BUTTON */}
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Link 
                    to="/katalog" 
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '12px 24px', 
                        background: 'var(--green)', 
                        color: 'white', 
                        borderRadius: '12px', 
                        textDecoration: 'none', 
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>arrow_back</span>
                    Kembali ke Katalog Lengkap
                </Link>
            </div>

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
                    © 2025 Quantum Millionaire — AI Health Advisor
                </p>
            </footer>
        </div>
    );
}
