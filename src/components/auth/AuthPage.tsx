import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Mail, Lock, User, Loader2, LogIn, UserPlus, ShieldCheck,
  Eye, EyeOff, KeyRound, ArrowLeft, MailCheck, RefreshCw
} from 'lucide-react';

// Design System
const DS = {
  primary: '#059669',     // Hijau Utama
  navy: '#1E293B',        // Navy Gelap — teks utama
  gray: '#64748B',        // Abu-abu Teks — sekunder
  red: '#DC2626',         // Merah Peringatan
  bgLight: '#F8FAFC',     // Abu-abu Terang — latar
};

type Mode = 'login' | 'register' | 'forgot' | 'success';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? '/dashboard';

  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) toast.error('Email atau password salah.');
        else { toast.success('Berhasil masuk!'); navigate(from, { replace: true }); }
      } else if (mode === 'register') {
        if (!name.trim()) { toast.error('Nama wajib diisi'); setLoading(false); return; }
        const { error } = await signUp(email, password, name);
        if (error) {
          const msg = error.message?.toLowerCase() ?? '';
          if (
            msg.includes('already registered') ||
            msg.includes('already been registered') ||
            msg.includes('email address is already') ||
            msg.includes('user already registered') ||
            msg.includes('duplicate') ||
            (error as any).status === 422
          ) {
            toast.error('Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.', {
              description: 'Gunakan tombol "Lupa password?" jika lupa kata sandi.',
            });
          } else {
            toast.error(error.message || 'Gagal mendaftar. Coba lagi.');
          }
        } else {
          setMode('success');
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) toast.error(error.message || 'Gagal mengirim email reset.');
        else toast.success('Link reset password sudah dikirim ke email kamu!');
      }
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setLoading(false);
    if (error) toast.error('Gagal kirim ulang. Coba beberapa saat lagi.');
    else toast.success('Email konfirmasi dikirim ulang!');
  };

  const inputBase = "w-full border-2 border-slate-200 focus:outline-none rounded-xl px-4 py-3 text-sm font-medium placeholder:text-slate-300 placeholder:font-normal transition-colors bg-white";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: DS.bgLight }}>
      <main className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-6 mt-2">
          <img
            src="/icon-rekapan-mitra.png"
            alt="Logo Rekapan Mitra"
            className="h-12 w-auto object-contain drop-shadow-sm"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">

          {/* ===== SUCCESS SCREEN ===== */}
          {mode === 'success' && (
            <div className="flex flex-col items-center text-center gap-5 py-2">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl"
                style={{ background: 'linear-gradient(135deg, #059669, #34D399)', boxShadow: '0 8px 24px rgba(5,150,105,0.25)' }}
              >
                <MailCheck className="h-10 w-10 text-white" strokeWidth={1.5} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-extrabold" style={{ color: DS.navy }}>Cek Email Anda! 📬</h2>
                <p className="text-sm font-medium leading-relaxed" style={{ color: DS.gray }}>
                  Kami sudah mengirim link konfirmasi ke:
                </p>
                <p
                  className="text-sm font-extrabold px-3 py-1.5 rounded-lg inline-block break-all"
                  style={{ color: DS.primary, background: '#ECFDF5' }}
                >
                  {email}
                </p>
              </div>

              <div className="w-full rounded-2xl p-4 text-left space-y-2.5" style={{ background: DS.bgLight, border: '1px solid #E2E8F0' }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: DS.gray }}>Langkah selanjutnya:</p>
                {[
                  'Buka aplikasi email Anda (Gmail, dll.)',
                  'Cari email dari Rekapan Mitra',
                  'Klik tombol "Konfirmasi Email" di dalam email',
                  'Login dengan email & password yang sudah didaftarkan',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className="w-5 h-5 rounded-full text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: DS.primary }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm font-medium" style={{ color: DS.navy }}>{text}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs font-medium -mt-1" style={{ color: DS.gray }}>
                Tidak masuk? Cek folder <strong style={{ color: DS.navy }}>Spam / Junk</strong> email Anda.
              </p>

              <button
                onClick={() => { setMode('login'); setPassword(''); }}
                className="w-full py-3.5 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
                style={{ background: DS.primary }}
              >
                <LogIn className="h-4 w-4" /> Masuk ke Akun
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleResend}
                className="text-xs font-semibold flex items-center gap-1.5 mx-auto transition-colors disabled:opacity-50"
                style={{ color: DS.gray }}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Kirim ulang email konfirmasi
              </button>
            </div>
          )}

          {/* ===== FORM (login / register / forgot) ===== */}
          {mode !== 'success' && (
            <>
              <div className="mb-5 text-center">
                {mode === 'forgot' && (
                  <button
                    onClick={() => setMode('login')}
                    className="flex items-center gap-1 text-xs font-bold mb-3 mx-auto"
                    style={{ color: DS.gray }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Login
                  </button>
                )}

                <h2 className="text-lg font-bold" style={{ color: DS.navy }}>
                  {mode === 'login' ? 'Selamat Datang Kembali' : mode === 'register' ? 'Buat Akun Baru' : 'Lupa Password?'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: DS.gray }}>
                  {mode === 'login' ? 'Masuk ke akun Anda' : mode === 'register' ? 'Daftar sebagai mitra baru' : 'Kami kirimkan link reset ke emailmu'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Nama */}
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label htmlFor="name" className="flex items-center gap-1.5 text-xs font-bold" style={{ color: DS.navy }}>
                      <User className="h-3.5 w-3.5" style={{ color: DS.gray }} /> Nama Lengkap
                    </label>
                    <input
                      id="name" type="text" placeholder="Nama Anda" value={name}
                      onChange={e => setName(e.target.value)} required disabled={loading}
                      className={inputBase}
                      style={{ '--tw-ring-color': DS.primary } as any}
                      onFocus={e => e.target.style.borderColor = DS.primary}
                      onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                      autoComplete="name"
                    />
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="email" className="flex items-center gap-1.5 text-xs font-bold" style={{ color: DS.navy }}>
                    <Mail className="h-3.5 w-3.5" style={{ color: DS.gray }} /> Email
                  </label>
                  <input
                    id="email" type="email" placeholder="nama@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} required disabled={loading}
                    className={inputBase}
                    onFocus={e => e.target.style.borderColor = DS.primary}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                {mode !== 'forgot' && (
                  <div className="space-y-1">
                    <label htmlFor="password" className="flex items-center gap-1.5 text-xs font-bold" style={{ color: DS.navy }}>
                      <Lock className="h-3.5 w-3.5" style={{ color: DS.gray }} /> Kata Sandi
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required minLength={6} disabled={loading}
                        className={`${inputBase} pr-11 tracking-widest`}
                        onFocus={e => e.target.style.borderColor = DS.primary}
                        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button" tabIndex={-1}
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                        style={{ color: DS.gray }}
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {mode === 'login' && (
                      <div className="flex justify-end">
                        <button
                          type="button" onClick={() => setMode('forgot')}
                          className="text-xs font-semibold hover:underline mt-0.5"
                          style={{ color: DS.primary }}
                        >
                          Lupa password?
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit" disabled={loading}
                  className="w-full text-white text-sm font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all mt-1 active:scale-[0.98] disabled:opacity-70"
                  style={{ background: DS.primary, boxShadow: '0 4px 15px rgba(5,150,105,0.25)' }}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {mode === 'login' ? 'Masuk...' : mode === 'register' ? 'Mendaftar...' : 'Mengirim...'}</>
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Masuk ke Akun' : mode === 'register' ? 'Daftar Sekarang' : 'Kirim Link Reset'}</span>
                      {mode === 'login' && <LogIn className="h-4 w-4" />}
                      {mode === 'register' && <UserPlus className="h-4 w-4" />}
                      {mode === 'forgot' && <KeyRound className="h-4 w-4" />}
                    </>
                  )}
                </button>

                {/* Toggle */}
                {mode !== 'forgot' && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setName(''); }}
                      disabled={loading}
                      className="text-xs font-bold py-1 px-3 rounded-lg transition-colors hover:underline"
                      style={{ color: DS.primary }}
                    >
                      {mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
                    </button>
                  </div>
                )}
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 text-center space-y-1">
          <div className="flex justify-center items-center gap-1.5" style={{ color: DS.gray }}>
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Aman & Terenkripsi</span>
          </div>
          <p className="text-xs" style={{ color: DS.gray }}>Versi 2.0.1 • 2026</p>
        </div>
      </main>
    </div>
  );
}
