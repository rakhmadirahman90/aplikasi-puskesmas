import React, { useState } from 'react';
import { User, Lock, LogIn, ShieldCheck, PackageCheck, ClipboardCheck, Building2, Stethoscope, Eye, EyeOff } from 'lucide-react';
import { UserAccount, ThemeInfo } from '../types';
import { supabase } from '../firebase';

interface LoginViewProps {
  usersStore: UserAccount[];
  onLogin: (user: UserAccount) => void;
  currentTheme: string;
  onChangeTheme: (themeId: string) => void;
  themes: ThemeInfo[];
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    void (async () => {
      if (!supabase) {
        setError('Koneksi database belum tersedia.');
        setIsLoading(false);
        return;
      }
      const identifier = username.trim().toLowerCase();
      const email = identifier.includes('@') ? identifier : `${identifier}@puskesmas.parepare`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError || !authData.user) {
        setError('Username atau password tidak sesuai.');
        setIsLoading(false);
        return;
      }
      const { data, error: profileError } = await supabase
        .from('app_users')
        .select('id, username, name, role, unit_id')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();
      if (profileError || !data) {
        await supabase.auth.signOut();
        setError('Profil akses belum terhubung. Hubungi administrator.');
        setIsLoading(false);
        return;
      }
      onLogin({ id:data.id, username:data.username, pin:'', role:data.role, name:data.name, unitId:data.unit_id || undefined });
      setIsLoading(false);
    })();
  };

  return (
    <main className="sifp-login min-h-[100dvh]">
      <section className="sifp-login-brand">
        <div className="sifp-login-brand-inner">
          <div className="sifp-agency-mark"><Building2 /><div><b>DINAS KESEHATAN</b><span>KOTA PAREPARE</span></div></div>
          <div>
            <span className="sifp-kicker">Sistem Informasi Farmasi Puskesmas</span>
            <h1>Pengelolaan obat<br/><strong>terintegrasi & akuntabel.</strong></h1>
            <p>Alur kerja digital untuk gudang farmasi, ruang farmasi, Pustu dan unit pelayanan—mulai penerimaan, ampra, pemakaian, pelayanan resep hingga laporan.</p>
          </div>
          <div className="sifp-login-flow">
            <div><PackageCheck/><span><b>Persediaan aktual</b><small>Mutasi stok antar unit tercatat otomatis</small></span></div>
            <div><ClipboardCheck/><span><b>Verifikasi APJ</b><small>Penerimaan dan penyerahan terdokumentasi</small></span></div>
            <div><Stethoscope/><span><b>Pelayanan pasien</b><small>Resep menjadi dasar stok dan laporan</small></span></div>
          </div>
          <p className="sifp-login-footnote">UPTD Puskesmas • Kota Parepare, Sulawesi Selatan</p>
        </div>
      </section>

      <section className="sifp-login-panel">
        <div className="sifp-login-card">
          <div className="sifp-login-mobile-brand"><Building2/><div><b>SIFP PUSKESMAS</b><span>Dinas Kesehatan Kota Parepare</span></div></div>
          <div className="sifp-login-heading">
            <span className="sifp-login-icon"><ShieldCheck/></span>
            <div><h2>Masuk ke Aplikasi</h2><p>Gunakan akun sesuai tugas dan unit pelayanan Anda.</p></div>
          </div>

          <form onSubmit={handleLogin} className="sifp-login-form">
            {error && <div className="sifp-login-error"><ShieldCheck/><span>{error}</span></div>}
            <label><span>Username</span><div className="sifp-field"><User/><input autoComplete="username" required value={username} disabled={isLoading} onChange={e=>setUsername(e.target.value)} placeholder="Masukkan username"/></div></label>
            <label><span>Password</span><div className="sifp-field"><Lock/><input type={showPassword?'text':'password'} autoComplete="current-password" required value={password} disabled={isLoading} onChange={e=>setPassword(e.target.value)} placeholder="Masukkan password"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Sembunyikan password':'Tampilkan password'}>{showPassword?<EyeOff/>:<Eye/>}</button></div></label>
            <button type="submit" disabled={isLoading} className="sifp-login-submit">{isLoading?<span className="sifp-spinner"/>:<><LogIn/>Masuk ke Sistem</>}</button>
          </form>

          <div className="sifp-role-note"><b>Akses berbasis tugas</b><span>Administrator • APJ/Apoteker • Gudang Farmasi • Ruang Farmasi • Pustu/Unit</span></div>
          <p className="sifp-login-security">Data pelayanan dan persediaan tersimpan pada sistem terintegrasi. Jangan membagikan akun Anda kepada pengguna lain.</p>
        </div>
      </section>
    </main>
  );
}
