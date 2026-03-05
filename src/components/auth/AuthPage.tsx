import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Lock, User, Loader2, LogIn, UserPlus, ShieldCheck, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';

type Mode = 'login' | 'register' | 'forgot';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? '/';

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
        if (error) toast.error(error.message || 'Gagal mendaftar.');
        else { toast.success('Berhasil mendaftar! Silakan masuk.'); setMode('login'); }
      } else {
        // Forgot password — Supabase sends reset link via built-in email (gratis!)
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

  const inputClass = "w-full bg-accent border-2 border-border focus:border-primary focus:outline-none rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <main className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-5">
          <h1 className="text-2xl font-extrabold text-primary tracking-tight mb-0.5">Rekapan Mitra</h1>
          <p className="text-muted-foreground text-sm font-medium">Mitra Bisnis Terpercaya</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent rounded-full blur-3xl opacity-60 pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-5 text-center">
              {mode === 'forgot' && (
                <button onClick={() => setMode('login')} className="flex items-center gap-1 text-xs font-bold text-muted-foreground mb-3 mx-auto">
                  <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Login
                </button>
              )}
              <h2 className="text-lg font-bold text-foreground">
                {mode === 'login' ? 'Selamat Datang Kembali' : mode === 'register' ? 'Buat Akun Baru' : 'Lupa Password?'}
              </h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                {mode === 'login' ? 'Masuk ke akun Anda' : mode === 'register' ? 'Daftar sebagai mitra baru' : 'Kami kirimkan link reset ke emailmu'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Nama — hanya saat daftar */}
              {mode === 'register' && (
                <div className="space-y-1">
                  <label htmlFor="name" className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> Nama Lengkap
                  </label>
                  <input id="name" type="text" placeholder="Nama Anda" value={name}
                    onChange={e => setName(e.target.value)} required disabled={loading}
                    className={inputClass} autoComplete="name" />
                </div>
              )}

              {/* Email */}
              <div className="space-y-1">
                <label htmlFor="email" className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                </label>
                <input id="email" type="email" placeholder="nama@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} required disabled={loading}
                  className={inputClass} autoComplete="email" />
              </div>

              {/* Password — tidak tampil saat forgot */}
              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <label htmlFor="password" className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Kata Sandi
                  </label>
                  <div className="relative">
                    <input id="password" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      required minLength={6} disabled={loading}
                      className={`${inputClass} pr-11 tracking-widest`} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                    <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Lupa password link — hanya di login */}
                  {mode === 'login' && (
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setMode('forgot')}
                        className="text-xs font-semibold text-primary hover:underline mt-0.5">
                        Lupa password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-70 active:scale-[0.98] text-primary-foreground text-sm font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all mt-1">
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

              {/* Toggle login ↔ daftar */}
              {mode !== 'forgot' && (
                <div className="text-center pt-1">
                  <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setName(''); }} disabled={loading}
                    className="text-xs font-bold text-primary hover:text-primary/80 hover:underline py-1 px-3 rounded-lg transition-colors">
                    {mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center space-y-1">
          <div className="flex justify-center items-center gap-1.5 text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Aman & Terenkripsi</span>
          </div>
          <p className="text-muted-foreground text-xs">Versi 2.0.1 • 2026</p>
        </div>

      </main>
    </div>
  );
}
