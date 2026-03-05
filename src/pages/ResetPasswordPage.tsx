import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [ready, setReady] = useState(false);

    // Supabase menaruh token di hash — tunggu session terbentuk
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) setReady(true);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') setReady(true);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) { toast.error('Password tidak sama!'); return; }
        if (password.length < 6) { toast.error('Password minimal 6 karakter'); return; }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) { toast.error(error.message || 'Gagal mengubah password'); }
            else { setDone(true); toast.success('Password berhasil diubah!'); }
        } catch {
            toast.error('Terjadi kesalahan. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-accent border-2 border-border focus:border-primary focus:outline-none rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground transition-colors pr-11";

    // ─── SUKSES ───
    if (done) return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="text-center max-w-xs">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-primary/10">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-green-500/30">
                        <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                </div>
                <h1 className="text-xl font-black text-foreground mb-2">Password Berhasil Diubah!</h1>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                    Sekarang kamu bisa login dengan password baru.
                </p>
                <button onClick={() => navigate('/login', { replace: true })}
                    className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm">
                    Ke Halaman Login
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <main className="w-full max-w-sm">

                <div className="text-center mb-5">
                    <h1 className="text-2xl font-extrabold text-primary tracking-tight mb-0.5">Rekapan Mitra</h1>
                    <p className="text-muted-foreground text-sm font-medium">Reset Password</p>
                </div>

                <div className="bg-card rounded-2xl p-6 shadow-lg border border-border relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent rounded-full blur-3xl opacity-60 pointer-events-none" />
                    <div className="relative z-10">
                        <h2 className="text-lg font-bold text-foreground text-center mb-1">Buat Password Baru</h2>
                        <p className="text-xs text-muted-foreground text-center mb-5">Masukkan password baru untuk akunmu</p>

                        {!ready ? (
                            <div className="flex flex-col items-center py-6 gap-3">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <p className="text-xs text-muted-foreground">Memverifikasi link...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-3">
                                {/* Password baru */}
                                <div className="space-y-1">
                                    <label htmlFor="new-password" className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                        <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Password Baru
                                    </label>
                                    <div className="relative">
                                        <input id="new-password" type={showPass ? 'text' : 'password'} placeholder="Min. 6 karakter"
                                            value={password} onChange={e => setPassword(e.target.value)}
                                            required minLength={6} disabled={loading} className={inputClass} autoComplete="new-password" />
                                        <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                                            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Konfirmasi */}
                                <div className="space-y-1">
                                    <label htmlFor="confirm-password" className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                        <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Konfirmasi Password
                                    </label>
                                    <div className="relative">
                                        <input id="confirm-password" type={showConfirm ? 'text' : 'password'} placeholder="Ulangi password"
                                            value={confirm} onChange={e => setConfirm(e.target.value)}
                                            required minLength={6} disabled={loading} className={inputClass} autoComplete="new-password" />
                                        <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {confirm && password !== confirm && (
                                        <p className="text-xs text-red-500 font-medium">Password tidak sama</p>
                                    )}
                                </div>

                                <button type="submit" disabled={loading || password !== confirm || password.length < 6}
                                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98] text-primary-foreground text-sm font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all mt-2">
                                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : 'Simpan Password Baru'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="mt-5 flex justify-center items-center gap-1.5 text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Aman & Terenkripsi</span>
                </div>
            </main>
        </div>
    );
}
