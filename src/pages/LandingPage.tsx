import React, { useEffect, useState } from 'react';
import { 
  Rocket, MessageCircle, ShieldCheck, Sparkles, 
  Zap, Package, Wallet, Users, BarChart3, 
  Check, ChevronDown, Heart, Shield, 
  Smartphone, Code2, Clock, ArrowRight,
  Send, Globe, ArrowDownRight, Bot, MousePointer2,
  Layout
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import '@/styles/landing.css';

// ════ DUMMY SCREEN COMPONENT ════
const ScreenPlaceholder = ({ className, title, imageSrc }: { className?: string, title: string, imageSrc?: string }) => (
  <div className={cn(
    "relative aspect-[9/19] w-full bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[2.5rem] shadow-2xl overflow-hidden border-[6px] border-white/10 ring-1 ring-slate-900/5",
    className
  )}>
    {imageSrc ? (
      <img src={imageSrc} alt={title} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 bg-white/20 rounded-2xl mb-4 flex items-center justify-center backdrop-blur-md">
          <Layout className="text-white w-6 h-6" />
        </div>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-tight">
          {title} <br /> <span className="opacity-50">Placeholder</span>
        </p>
      </div>
    )}
  </div>
);

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index: number) => setActiveFaq(activeFaq === index ? null : index);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* ════ NAVIGATION ════ */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 py-3",
        scrolled ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100" : "bg-transparent"
      )}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="/icon-rekapan-mitra.png" 
              alt="Rekapan Mitra" 
              className="h-10 w-auto object-contain"
            />
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <a href="#fitur" className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">Fitur</a>
            <a href="#mockup" className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">Preview</a>
            <a href="#faq" className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">FAQ</a>
            <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">Masuk</Link>
            <Link to="/dashboard" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center">
              Coba Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ════ HERO SECTION ════ */}
      <section className="relative pt-24 pb-12 overflow-hidden bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/50 rounded-full border border-emerald-200/50">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Digitalisasi Mitra BP — v2.1.0</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                  <ShieldCheck className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Investasi Terjangkau</span>
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                Satu Aplikasi Untuk <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                  Semua Rekap Pesanan.
                </span>
              </h1>
              
              <p className="text-base text-slate-500 leading-relaxed max-w-lg font-medium">
                Solusi cerdas rekapitulasi harian Mitra BP. Forward pesan WA ke Bot Telegram, pantau profit, dan kelola stok secara otomatis.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-start">
                <Link to="/dashboard" className="w-full sm:w-auto h-12 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Rocket className="w-4 h-4" /> Mulai Gratis Sekarang
                </Link>
                <a href="https://wa.me/6287782697973" className="w-full sm:w-auto h-12 px-10 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-center">
                  <MessageCircle className="w-4 h-4" /> Tanya via WA
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 relative h-[500px]">
              <div className="absolute top-0 right-0 w-[240px] z-10 animate-float-sm">
                <ScreenPlaceholder title="Dashboard" />
              </div>
              <div className="absolute top-10 right-24 w-[240px] z-20 animate-float">
                <ScreenPlaceholder title="Telegram Bot" className="bg-gradient-to-br from-blue-500 to-emerald-600" />
              </div>
              <div className="absolute top-20 right-48 w-[240px] z-30 animate-float-sm" style={{ animationDelay: '1s' }}>
                <ScreenPlaceholder title="Order Form" className="bg-gradient-to-br from-slate-700 to-slate-900" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ MOCKUP SHOWCASE ════ */}
      <section id="mockup" className="py-20 bg-white border-y border-slate-100 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Intip Kemudahan Di Dalam Aplikasi
              </h2>
              <p className="text-slate-500 font-medium text-sm text-left">
                Kami mendesain setiap layar dengan satu tujuan: **Kecepatan**. Tanpa bingkai HP yang menghalangi, lihat betapa bersihnya antarmuka kami.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-4">
                {[
                  { icon: Bot, label: "AI Bot Parser", desc: "Otomatis deteksi chat WA." },
                  { icon: BarChart3, label: "Bento Dashboard", desc: "Data vital satu layar." },
                  { icon: Package, label: "Inventory Sync", desc: "Stok otomatis berkurang." },
                  { icon: Wallet, label: "Atomic Profit", desc: "Detail pengeluaran per order." }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-start text-left">
                    <item.icon className="w-5 h-5 text-emerald-600 mb-2" />
                    <h4 className="text-xs font-black text-slate-800">{item.label}</h4>
                    <p className="text-[9px] text-slate-400 font-bold">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative flex justify-center py-10">
               <div className="relative w-full flex justify-center items-center gap-4">
                  <div className="w-[180px] -rotate-6 transition-transform hover:rotate-0 hover:z-50 duration-500 hidden sm:block">
                    <ScreenPlaceholder title="Stats" />
                  </div>
                  <div className="w-[200px] z-10 shadow-2xl scale-110">
                    <ScreenPlaceholder title="Main App" className="bg-gradient-to-br from-emerald-600 to-teal-500" />
                  </div>
                  <div className="w-[180px] rotate-6 transition-transform hover:rotate-0 hover:z-50 duration-500 hidden sm:block">
                    <ScreenPlaceholder title="Orders" className="bg-gradient-to-br from-slate-800 to-black" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ COMPACT BENTO GRID ════ */}
      <section id="fitur" className="py-20 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2 bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden group">
               <div className="relative z-10">
                 <h3 className="text-2xl font-black mb-3 italic">"Tahu untung tiap hari"</h3>
                 <p className="text-emerald-100 text-sm font-medium leading-relaxed max-w-xs">
                   Dashboard cerdas yang menghitung otomatis modal & margin sesuai level mitra Anda secara real-time.
                 </p>
               </div>
               <BarChart3 className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10" />
            </div>
            
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between items-start text-left">
               <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 mb-2">
                  <Bot className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">Bot Terintegrasi</h4>
                  <p className="text-[10px] text-slate-400 font-bold leading-tight">Input via Telegram tanpa manual.</p>
               </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between items-start text-left">
               <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-2">
                  <ShieldCheck className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">PWA Support</h4>
                  <p className="text-[10px] text-slate-400 font-bold leading-tight">Buka langsung di browser HP.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ FAQ ════ */}
      <section id="faq" className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-left mb-10">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Paling Sering Ditanyakan</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'Bagaimana cara kerja Bot Telegram?', a: 'Forward pesan pesanan pelanggan ke @RekapanMitraBot. Bot akan mem-parsing data secara otomatis ke dashboard Anda.' },
              { q: 'Apakah aman untuk data bisnis saya?', a: 'Sangat aman. Kami menggunakan enkripsi Row Level Security (RLS) dari Supabase.' },
              { q: 'Bagaimana jika saya ganti level mitra?', a: 'Sistem akan otomatis menyesuaikan harga modal untuk semua order berikutnya.' }
            ].map((faq, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-emerald-50 transition-colors"
                >
                  <span className="text-sm font-black text-slate-700">{faq.q}</span>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", activeFaq === i && "rotate-180")} />
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-4 animate-in slide-in-from-top-1 duration-200 text-xs text-slate-500 font-bold leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FINAL CTA ════ */}
      <section className="py-20 relative overflow-hidden bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-tight">
            Digitalisasi Bisnis <br /> <span className="text-emerald-500">Mulai Dari Sini.</span>
          </h2>
          <p className="text-slate-500 text-sm font-bold max-w-xl mx-auto uppercase tracking-[0.2em]">
            Tanpa Instalasi · Investasi Berkelanjutan
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-6">
             <Link to="/dashboard" className="w-full sm:w-auto h-14 px-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-base shadow-lg active:scale-95 transition-all flex items-center justify-center">
               Mulai Perjalanan Gratis
             </Link>
             <a href="https://wa.me/6287782697973" className="w-full sm:w-auto h-14 px-12 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-base border border-white/10 transition-all flex items-center justify-center">
               Tanya via WhatsApp
             </a>
          </div>
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="py-12 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center">
            <img 
              src="/icon-rekapan-mitra.png" 
              alt="Rekapan Mitra" 
              className="h-10 w-auto object-contain"
            />
          </div>
          
          <div className="flex gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
            <a href="#" className="hover:text-emerald-600 transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Kebijakan Privasi</a>
          </div>

          <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">
            © 2026 mitrabp.biz.id
          </p>
        </div>
      </footer>

    </div>
  );
}
