import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Mail, Lock, User, Loader2, LogIn, UserPlus, ShieldCheck } from 'lucide-react';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? '/';
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) toast.error(error.message || 'Gagal masuk. Periksa email dan password.');
        else {
          toast.success('Berhasil masuk!');
          navigate(from, { replace: true });
        }
      } else {
        if (!name.trim()) { toast.error('Nama wajib diisi'); setLoading(false); return; }
        const { error } = await signUp(email, password, name);
        if (error) toast.error(error.message || 'Gagal mendaftar. Coba lagi.');
        else { toast.success('Berhasil mendaftar! Silakan masuk.'); setIsLogin(true); }
      }
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <main className="w-full max-w-md">

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-emerald-500 tracking-tight mb-2">
            BP Community Manager
          </h1>
          <p className="text-slate-500 text-lg font-medium">Mitra Bisnis Terpercaya</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-200 relative overflow-hidden">
          {/* Decorative blur */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-center text-2xl font-bold text-slate-800 mb-1">
              {isLogin ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
            </h2>
            <p className="text-center text-slate-500 mb-8 text-base">
              {isLogin ? 'Masuk ke akun Anda' : 'Daftar sebagai mitra baru'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Nama (hanya saat daftar) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label htmlFor="name" className="flex items-center gap-2 text-base font-bold text-slate-800">
                    <User className="h-5 w-5 text-slate-500" />
                    Nama Lengkap
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Nama Anda"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required={!isLogin}
                    disabled={loading}
                    className="w-full bg-blue-50 border-2 border-slate-200 focus:border-emerald-500 focus:outline-none rounded-2xl px-5 py-4 text-lg text-slate-900 placeholder-slate-400 transition-colors"
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center gap-2 text-base font-bold text-slate-800">
                  <Mail className="h-5 w-5 text-slate-500" />
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-blue-50 border-2 border-slate-200 focus:border-emerald-500 focus:outline-none rounded-2xl px-5 py-4 text-lg text-slate-900 placeholder-slate-400 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="flex items-center gap-2 text-base font-bold text-slate-800">
                  <Lock className="h-5 w-5 text-slate-500" />
                  Kata Sandi
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  className="w-full bg-blue-50 border-2 border-slate-200 focus:border-emerald-500 focus:outline-none rounded-2xl px-5 py-4 text-lg text-slate-900 placeholder-slate-400 tracking-widest transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 active:scale-[0.98] text-white text-lg font-bold py-5 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-3 transition-all mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {isLogin ? 'Masuk...' : 'Mendaftar...'}
                  </>
                ) : (
                  <>
                    <span>{isLogin ? 'Masuk ke Akun' : 'Daftar Sekarang'}</span>
                    {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  </>
                )}
              </button>

              {/* Toggle */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setName(''); }}
                  disabled={loading}
                  className="text-base font-bold text-emerald-500 hover:text-emerald-700 hover:underline py-2 px-4 rounded-lg transition-colors"
                >
                  {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <div className="flex justify-center items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">Aman & Terenkripsi</span>
          </div>
          <p className="text-slate-400 text-sm">Versi 2.0.1 • 2026</p>
        </div>

      </main>
    </div>
  );
}
