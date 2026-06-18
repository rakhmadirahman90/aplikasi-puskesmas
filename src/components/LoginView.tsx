import React, { useState } from 'react';
import { User, Lock, Activity, ShieldCheck, ArrowRight, Shield, Hexagon, Palette } from 'lucide-react';
import { UserAccount, ThemeInfo } from '../types';

interface LoginViewProps {
  usersStore: UserAccount[];
  onLogin: (user: UserAccount) => void;
  currentTheme: string;
  onChangeTheme: (themeId: string) => void;
  themes: ThemeInfo[];
}

export default function LoginView({ usersStore, onLogin, currentTheme, onChangeTheme, themes }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate slight network delay for better UX feel
    setTimeout(() => {
      const user = usersStore.find((u) => u.username === username && u.pin === pin);
      if (user) {
        onLogin(user);
      } else {
        setError('Kredensial tidak terverifikasi. Akses ditolak.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none transition-colors duration-1000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none transition-colors duration-1000"></div>
      <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-emerald-700/15 blur-[100px] pointer-events-none transition-colors duration-1000"></div>
      
      {/* Subtle Grid overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none"></div>

      {/* Theme Selector Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <div className="relative">
          <button 
            type="button"
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700/50 bg-slate-900/50 backdrop-blur-md text-slate-300 hover:text-white hover:bg-slate-800 transition-all shadow-lg mt-2"
          >
            <Palette className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wider uppercase">TEMA</span>
          </button>
          
          {showThemeSelector && (
            <div className="absolute top-full right-0 mt-3 p-3 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl w-48 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pl-1 border-b border-slate-800 pb-2 mb-1">Pilih Estetika</div>
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onChangeTheme(t.id);
                    setShowThemeSelector(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${currentTheme === t.id ? 'bg-slate-800/80 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <span className="w-3 h-3 rounded-full shadow-inner border border-white/10" style={{ backgroundColor: t.colorValue }}></span>
                  <span className="text-sm font-medium">{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
        
        {/* Left Branding Side */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 pr-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md w-fit">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-200 text-xs font-semibold tracking-wider font-mono">SYSTEM ONLINE & SECURE</span>
          </div>
          
          <h1 className="text-5xl xl:text-6xl font-display font-bold text-white leading-[1.15] tracking-tight">
            Sistem Informasi <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">Farmasi Terintegrasi</span>
          </h1>
          
          <p className="text-slate-400 text-lg leading-relaxed max-w-md font-light">
            Platform manajemen persediaan farmasi generasi berikutnya. Sinkronisasi data real-time dengan keamanan level enkripsi untuk instansi kesehatan.
          </p>
          
          <div className="flex items-center gap-6 pt-4">
            <div className="flex -space-x-4">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg"><Activity className="w-5 h-5 text-emerald-400"/></div>
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg"><Shield className="w-5 h-5 text-emerald-300"/></div>
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg"><Hexagon className="w-5 h-5 text-emerald-500"/></div>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-200 font-semibold text-sm">Audit Trail Aktif</span>
              <span className="text-slate-500 text-xs">Aktivitas terpantau 24/7</span>
            </div>
          </div>
        </div>

        {/* Right Form Side - Glass Panel */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Inner subtle glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
            
            {/* Mobile Header */}
            <div className="flex flex-col items-center lg:hidden mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4 border border-white/10">
                <Hexagon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight">SIFP Parepare</h2>
              <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-semibold">Online</span>
              </div>
            </div>

            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-display font-bold text-white tracking-tight">Otentikasi Portal</h2>
              <p className="text-slate-400 text-sm mt-1">Masukkan kredensial keamanan Anda.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 animate-in fade-in zoom-in-95 backdrop-blur-md">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <span className="font-medium tracking-wide">{error}</span>
                </div>
              )}

              <div className="space-y-5">
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-widest block ml-1">ID Pengguna</label>
                  <div className="relative group">
                    <input
                      type="text"
                      required
                      value={username}
                      disabled={isLoading}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-slate-900 transition-all outline-none text-white disabled:opacity-50 placeholder:text-slate-600"
                      placeholder="Masukkan ID Anda"
                    />
                    <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-widest block ml-1">Kode Keamanan (PIN)</label>
                  <div className="relative group">
                    <input
                      type="password"
                      required
                      value={pin}
                      disabled={isLoading}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-slate-900 transition-all outline-none text-white tracking-[0.3em] font-mono disabled:opacity-50 placeholder:text-slate-600 placeholder:tracking-normal"
                      placeholder="••••••"
                    />
                    <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_var(--color-emerald-500,rgba(16,185,129,0.3))] hover:shadow-[0_0_30px_var(--color-emerald-500,rgba(16,185,129,0.5))] flex items-center justify-center gap-2 group border border-emerald-400/20"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="tracking-wide">Inisiasi Sesi Akses</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
            
          </div>
        </div>
      </div>
    </div>
  );
}

