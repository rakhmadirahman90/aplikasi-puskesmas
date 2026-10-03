/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// deployment-sync: 2026-10-03T17:52:22.650Z
import React, { useState, useEffect } from 'react';
import { Medicine, StockStore, Receipt, Ampra, Prescription, DailyUsage, Disposal, UnitInfo, UserAccount, AppRole, ThemeInfo, THEMES_LIST, SystemConfig } from './types';
import { db, seedDatabaseIfEmpty, onSnapshot, collection, doc, setDoc, deleteDoc, supabase } from './firebase';

// Subcomponents
import DashboardView from './components/DashboardView';
import PenerimaanGudangView from './components/PenerimaanGudangView';
import AmpraGudangView from './components/AmpraGudangView';
import ApotekPasienView from './components/ApotekPasienView';
import UsageUnitView from './components/UsageUnitView';
import LaporanView from './components/LaporanView';
import LoginView from './components/LoginView';
import UserManagementView from './components/UserManagementView';
import MasterDataView from './components/MasterDataView';
import DisposalCorrectionView from './components/DisposalCorrectionView';
import OpeningReconciliationView from './components/OpeningReconciliationView';
import ModuleErrorBoundary from './components/ModuleErrorBoundary';
import { MobileReceiptsView, MobileAmpraView } from './components/MobileTransactionViews';

import { motion, AnimatePresence } from 'motion/react';

import {
  Activity,
  ArrowRightLeft,
  Calendar,
  ClipboardList,
  Database,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Pill,
  Settings,
  Palette,
  ShieldCheck,
  Truck,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Menu,
  ChevronRight,
  CircleUserRound,
  Command,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Search
} from 'lucide-react';

const LOCAL_STORAGE_KEY_STOCKS = 'sifp_stocks_store';
const LOCAL_STORAGE_KEY_RECEIPTS = 'sifp_receipts_store';
const LOCAL_STORAGE_KEY_AMPRAS = 'sifp_ampras_store';
const LOCAL_STORAGE_KEY_PRESCRIPTIONS = 'sifp_prescriptions_store';
const LOCAL_STORAGE_KEY_USAGES = 'sifp_usages_store';
const LOCAL_STORAGE_KEY_ROLE = 'sifp_active_role_store';
const LOCAL_STORAGE_KEY_DATE = 'sifp_system_date_store';
const LOCAL_STORAGE_KEY_THEME = 'sifp_selected_theme_store';

const THEME_VARIABLES_MAP: Record<string, Record<string, string>> = {
  emerald: {
    '--color-emerald-50': '#f0fdf4',
    '--color-emerald-100': '#dcfce7',
    '--color-emerald-200': '#bbf7d0',
    '--color-emerald-300': '#86efac',
    '--color-emerald-400': '#4ade80',
    '--color-emerald-500': '#10b981',
    '--color-emerald-600': '#059669',
    '--color-emerald-700': '#047857',
    '--color-emerald-800': '#065f46',
    '--color-emerald-900': '#064e3b',
    '--color-emerald-950': '#022c22',
  },
  blue: {
    '--color-emerald-50': '#eff6ff',
    '--color-emerald-100': '#dbeafe',
    '--color-emerald-200': '#bfdbfe',
    '--color-emerald-300': '#93c5fd',
    '--color-emerald-400': '#60a5fa',
    '--color-emerald-500': '#3b82f6',
    '--color-emerald-600': '#2563eb',
    '--color-emerald-700': '#1d4ed8',
    '--color-emerald-800': '#1e40af',
    '--color-emerald-900': '#1e3a8a',
    '--color-emerald-950': '#172554',
  },
  teal: {
    '--color-emerald-50': '#f0fdfa',
    '--color-emerald-100': '#ccfbf1',
    '--color-emerald-200': '#99f6e4',
    '--color-emerald-300': '#5eead4',
    '--color-emerald-400': '#2dd4bf',
    '--color-emerald-500': '#14b8a6',
    '--color-emerald-600': '#0d9488',
    '--color-emerald-700': '#0f766e',
    '--color-emerald-800': '#115e59',
    '--color-emerald-900': '#134e4a',
    '--color-emerald-950': '#042f2e',
  },
  violet: {
    '--color-emerald-50': '#f5f3ff',
    '--color-emerald-100': '#ede9fe',
    '--color-emerald-200': '#ddd6fe',
    '--color-emerald-300': '#c4b5fd',
    '--color-emerald-400': '#a78bfa',
    '--color-emerald-500': '#8b5cf6',
    '--color-emerald-600': '#7c3aed',
    '--color-emerald-700': '#6d28d9',
    '--color-emerald-800': '#5b21b6',
    '--color-emerald-900': '#4c1d95',
    '--color-emerald-950': '#2e1065',
  },
  slate: {
    '--color-emerald-50': '#f8fafc',
    '--color-emerald-100': '#f1f5f9',
    '--color-emerald-200': '#e2e8f0',
    '--color-emerald-300': '#cbd5e1',
    '--color-emerald-400': '#94a3b8',
    '--color-emerald-500': '#64748b',
    '--color-emerald-600': '#475569',
    '--color-emerald-700': '#334155',
    '--color-emerald-800': '#1e293b',
    '--color-emerald-900': '#0f172a',
    '--color-emerald-950': '#090d16',
  }
};

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function App() {
  const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY));

  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Theme selection
  const [theme, setTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_THEME);
      return saved || 'emerald';
    } catch (_) {
      return 'emerald';
    }
  });

  // Clock dynamic time
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Effect to apply theme variable configuration
  useEffect(() => {
    try {
      const activeThemeVars = THEME_VARIABLES_MAP[theme] || THEME_VARIABLES_MAP.emerald;
      Object.entries(activeThemeVars).forEach(([key, val]) => {
        document.documentElement.style.setProperty(key, val);
      });
      localStorage.setItem(LOCAL_STORAGE_KEY_THEME, theme);
    } catch (e) {
      console.error("Gagal menerapkan tema pada root element", e);
    }
  }, [theme]);

  // Effect to interval clock
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Custom Toast Notifications Center
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>>([]);

  const addNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  type ConfirmState = { title:string; message:string; confirmLabel:string; tone:'danger'|'warning'|'info'; resolve:(value:boolean)=>void };
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const requestConfirm = (title:string, message:string, confirmLabel='Lanjutkan', tone:'danger'|'warning'|'info'='warning') =>
    new Promise<boolean>((resolve) => setConfirmState({title,message,confirmLabel,tone,resolve}));
  const closeConfirm = (result:boolean) => {
    setConfirmState(prev => { prev?.resolve(result); return null; });
  };

  // Core SIFP State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [units, setUnits] = useState<UnitInfo[]>([]);
  
  // Reactive state loaded from Firestore in real-time
  const [stocks, setStocks] = useState<StockStore>({});
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [ampras, setAmpras] = useState<Ampra[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [usages, setUsages] = useState<DailyUsage[]>([]);
  const [disposals, setDisposals] = useState<Disposal[]>([]);
  const [reversedTransactionKeys, setReversedTransactionKeys] = useState<Set<string>>(new Set());

  // Expiration calibrators
  const [systemDate, setSystemDate] = useState<string>(new Date().toISOString().slice(0,10));
  
  // Dynamic UI Config
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    headerTitle: "Sistem Informasi Farmasi Puskesmas",
    headerSubtitle: "Dinas Kesehatan Kota Parepare • Persediaan & Pelayanan Terintegrasi",
    footerText: "Sistem Informasi Farmasi Puskesmas • Dinas Kesehatan Kota Parepare",
    sidebarVisible: true
  });

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Authenticated Role Accessors
  const activeRole = currentUser?.role || 'unit';
  const authenticatedUnitId = currentUser?.unitId || (activeRole === 'farmasi' ? 'ruang_farmasi' : '');
  const [adminViewUnitId, setAdminViewUnitId] = useState('pustu');
  const activeUnitId = activeRole === 'unit' || activeRole === 'farmasi' ? authenticatedUnitId : adminViewUnitId;
  const userName = currentUser?.name || 'Guest User';

  // Role-based navigation: users only see modules relevant to their role.
  const ROLE_TAB_ACCESS: Record<AppRole, string[]> = {
    admin: ['dashboard', 'receipts', 'disposals', 'ampra', 'apotek', 'satellites', 'reports', 'master', 'opening-reconciliation', 'users'],
    apj: ['dashboard', 'receipts', 'disposals', 'ampra', 'apotek', 'satellites', 'reports', 'opening-reconciliation'],
    gudang: ['dashboard', 'receipts', 'disposals', 'ampra', 'satellites', 'reports'],
    farmasi: ['dashboard', 'ampra', 'apotek', 'satellites', 'reports'],
    unit: ['dashboard', 'ampra', 'satellites', 'reports']
  };

  const canAccessTab = (tab: string) => ROLE_TAB_ACCESS[activeRole]?.includes(tab) ?? false;

  const navigateToTab = (tab: string) => {
    if (!canAccessTab(tab)) {
      addNotification('warning', 'Menu tersebut tidak tersedia untuk kewenangan akun Anda.');
      return;
    }
    setActiveTab(tab);
    setMobileNavOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById('scrollable-content-area')?.scrollTo({ top: 0, behavior: 'auto' });
      document.getElementById('main-content-pane')?.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
  };

  useEffect(() => {
    const pane = document.getElementById('scrollable-content-area');
    if (pane) pane.scrollTop = 0;
  }, [activeTab]);

  // Never leave the content pane blank when the authenticated role cannot access a stale tab.
  useEffect(() => {
    if (!ROLE_TAB_ACCESS[activeRole]?.includes(activeTab)) {
      setActiveTab(ROLE_TAB_ACCESS[activeRole]?.[0] || 'dashboard');
    }
  }, [activeRole, activeTab]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const NAV_ITEMS: Array<{ id: string; label: string; short: string; icon: React.ElementType; section?: string }> = [
    { id: 'dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard, section: 'Ringkasan' },
    { id: 'receipts', label: 'Penerimaan BAP / PBF', short: 'Terima', icon: Truck, section: 'Transaksi Gudang' },
    { id: 'disposals', label: 'Retur, Rusak & Koreksi', short: 'Koreksi', icon: AlertTriangle, section: 'Transaksi Gudang' },
    { id: 'ampra', label: 'Distribusi (Ampra Unit)', short: 'Ampra', icon: ArrowRightLeft, section: 'Transaksi Gudang' },
    { id: 'apotek', label: 'Resep (Ruang Farmasi)', short: 'Resep', icon: Pill, section: 'Pelayanan & Pemakaian' },
    { id: 'satellites', label: 'Pemakaian Harian Unit', short: 'Unit', icon: Database, section: 'Pelayanan & Pemakaian' },
    { id: 'reports', label: 'Laporan Terpadu', short: 'Laporan', icon: FileText, section: 'Pelaporan' },
    { id: 'master', label: 'Katalog Obat & Data Unit', short: 'Master', icon: Database, section: 'Master Data' },
    { id: 'opening-reconciliation', label: 'Rekonsiliasi Opening Stock', short: 'Opening', icon: ShieldCheck, section: 'Pengaturan' },
    { id: 'users', label: 'Pengguna & Hak Akses', short: 'User', icon: ShieldCheck, section: 'Pengaturan' }
  ];

  const visibleNavItems = NAV_ITEMS.filter(item => canAccessTab(item.id));
  const activeNavItem = visibleNavItems.find(item => item.id === activeTab) || visibleNavItems[0];
  // Mobile navigation uses the exact same authorized menu source/order as the desktop sidebar.
  const mobileMoreActive = activeTab !== 'dashboard';
  const roleLabel = activeRole === 'apj' ? 'APJ / Apoteker' : activeRole === 'unit' ? 'Unit • ' + activeUnitId : activeRole.charAt(0).toUpperCase() + activeRole.slice(1);

  // Keep navigation inside the authenticated user's role scope.
  useEffect(() => {
    if (currentUser && !canAccessTab(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  // Supabase Auth session is the only source of authenticated identity.
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    const loadSessionUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) return;
      const { data } = await supabase
        .from('app_users')
        .select('id, username, name, role, unit_id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (mounted && data) {
        setCurrentUser({ id:data.id, username:data.username, pin:'', role:data.role, name:data.name, unitId:data.unit_id || undefined });
      }
    };
    void loadSessionUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void loadSessionUser(); });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const refreshReversalRegistry = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.rpc('list_transaction_reversals');
    if (error) { console.error('Gagal memuat registry reversal:', error); return; }
    setReversedTransactionKeys(new Set((data || []).map((r: any) => `${r.transaction_kind}:${r.transaction_id}`)));
  };

  useEffect(() => {
    if (currentUser?.id) void refreshReversalRegistry();
    else setReversedTransactionKeys(new Set());
  }, [currentUser?.id]);

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    addNotification('success', `Berhasil login sebagai ${user.name}`);
  };

  const handleLogout = async () => {
    const ok = await requestConfirm('Keluar dari aplikasi?', 'Sesi akun Anda akan diakhiri. Pastikan transaksi yang sedang diisi sudah disimpan.', 'Ya, Logout', 'warning');
    if (!ok) { addNotification('info', 'Logout dibatalkan. Anda tetap masuk ke aplikasi.'); return; }
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      addNotification('success', 'Logout berhasil. Sesi aplikasi telah ditutup dengan aman.');
      setCurrentUser(null);
      setActiveTab('dashboard');
    } catch (e:any) {
      addNotification('error', e?.message || 'Logout gagal. Silakan coba kembali.');
    }
  };

  // Set up Firebase Firestore Real-Time Subscriptions
  useEffect(() => {
    let unsubscribes: Array<() => void> = [];

    const setupDatabaseSubscription = async () => {
      // Database is authoritative in Supabase; never reseed from mockData.ts.
      await seedDatabaseIfEmpty();

      // 1. Real-time system config
      const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.systemDate) setSystemDate(data.systemDate);
          
          setSystemConfig(prev => ({
            ...prev,
            headerTitle: data.headerTitle || prev.headerTitle,
            headerSubtitle: data.headerSubtitle || prev.headerSubtitle,
            footerText: data.footerText || prev.footerText,
            sidebarVisible: data.sidebarVisible !== undefined ? data.sidebarVisible : prev.sidebarVisible
          }));
        }
      }, (error) => addNotification('error', `Konfigurasi sistem gagal dimuat: ${error?.message || 'koneksi ditolak'}`));
      unsubscribes.push(unsubConfig);

      // 2. Real-time stocks store
      const unsubStocks = onSnapshot(collection(db, 'stocks'), (qSnap) => {
        const updatedStocks: StockStore = {};
        qSnap.forEach((docSnap) => {
          updatedStocks[docSnap.id] = docSnap.data() as any;
        });
        setStocks(updatedStocks);
      }, (error) => addNotification('error', `Stok & batch gagal dimuat: ${error?.message || 'koneksi ditolak'}`));
      unsubscribes.push(unsubStocks);

      // 3. Real-time receipts
      const unsubReceipts = onSnapshot(collection(db, 'receipts'), (qSnap) => {
        const updatedReceipts: Receipt[] = [];
        qSnap.forEach((docSnap) => {
          updatedReceipts.push(docSnap.data() as Receipt);
        });
        updatedReceipts.sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
        setReceipts(updatedReceipts);
      }, (error) => addNotification('error', `Penerimaan BAP/PBF gagal dimuat: ${error?.message || 'akses database ditolak'}`));
      unsubscribes.push(unsubReceipts);

      // 4. Real-time ampras
      const unsubAmpras = onSnapshot(collection(db, 'ampras'), (qSnap) => {
        const updatedAmpras: Ampra[] = [];
        qSnap.forEach((docSnap) => {
          updatedAmpras.push(docSnap.data() as Ampra);
        });
        updatedAmpras.sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
        setAmpras(updatedAmpras);
      }, (error) => addNotification('error', `Data Ampra gagal dimuat: ${error?.message || 'akses database ditolak'}`));
      unsubscribes.push(unsubAmpras);

      // 5. Real-time prescriptions
      const unsubPrescriptions = onSnapshot(collection(db, 'prescriptions'), (qSnap) => {
        const updatedPrescriptions: Prescription[] = [];
        qSnap.forEach((docSnap) => {
          updatedPrescriptions.push(docSnap.data() as Prescription);
        });
        updatedPrescriptions.sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
        setPrescriptions(updatedPrescriptions);
      }, (error) => addNotification('error', `Data resep gagal dimuat: ${error?.message || 'akses database ditolak'}`));
      unsubscribes.push(unsubPrescriptions);

      // 6. Real-time usages
      const unsubUsages = onSnapshot(collection(db, 'usages'), (qSnap) => {
        const updatedUsages: DailyUsage[] = [];
        qSnap.forEach((docSnap) => {
          updatedUsages.push(docSnap.data() as DailyUsage);
        });
        updatedUsages.sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
        setUsages(updatedUsages);
      }, (error) => addNotification('error', `Pemakaian harian gagal dimuat: ${error?.message || 'akses database ditolak'}`));
      unsubscribes.push(unsubUsages);

      // 7. Real-time retur/kadaluarsa
      const unsubDisposals = onSnapshot(collection(db, 'disposals'), (qSnap) => {
        const rows: Disposal[] = [];
        qSnap.forEach((docSnap) => rows.push(docSnap.data() as Disposal));
        rows.sort((a,b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
        setDisposals(rows);
      }, (error) => addNotification('error', `Retur/Rusak/Koreksi gagal dimuat: ${error?.message || 'akses database ditolak'}`));
      unsubscribes.push(unsubDisposals);

      // 7. Real-time users
      const unsubUsers = onSnapshot(collection(db, 'users'), (qSnap) => {
        const updatedUsers: UserAccount[] = [];
        qSnap.forEach((docSnap) => {
          updatedUsers.push(docSnap.data() as UserAccount);
        });
        setUsers(updatedUsers);
      }, (error) => {
        if (activeRole === 'admin') addNotification('error', `Data Pengguna gagal dimuat: ${error?.message || 'akses database ditolak'}`);
      });
      unsubscribes.push(unsubUsers);

      // 8. Real-time medicines
      const unsubMedicines = onSnapshot(collection(db, 'medicines'), (qSnap) => {
        const updatedMedicines: Medicine[] = [];
        qSnap.forEach((docSnap) => {
          updatedMedicines.push(docSnap.data() as Medicine);
        });
        setMedicines(updatedMedicines);
      }, (error) => addNotification('error', `Katalog obat gagal dimuat: ${error?.message || 'akses database ditolak'}`));
      unsubscribes.push(unsubMedicines);

      // 9. Real-time units
      const unsubUnits = onSnapshot(collection(db, 'units'), (qSnap) => {
        const updatedUnits: UnitInfo[] = [];
        qSnap.forEach((docSnap) => {
          updatedUnits.push(docSnap.data() as UnitInfo);
        });
        setUnits(updatedUnits);
      }, (error) => addNotification('error', `Data unit/jejaring gagal dimuat: ${error?.message || 'akses database ditolak'}`));
      unsubscribes.push(unsubUnits);
    };

    setupDatabaseSubscription().catch(e => {
      console.error("Supabase database synchronization failure:", e);
      addNotification('error', 'Gagal menyinkronkan database Supabase.');
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentUser?.id]);

  const handleAddUser = async (user: UserAccount) => {
    try {
      await setDoc(doc(db, 'users', user.id), user);
      addNotification('success', `User ${user.username} berhasil dibuat.`);
    } catch {
      addNotification('error', "Gagal menambah user.");
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<UserAccount>) => {
    try {
      const u = users.find(x => x.id === id);
      if (!u) return;
      await setDoc(doc(db, 'users', id), { ...u, ...updates });
      addNotification('success', "User berhasil diupdate.");
    } catch {
      addNotification('error', "Gagal update user.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      addNotification('success', "User berhasil dihapus.");
    } catch {
      addNotification('error', "Gagal hapus user.");
    }
  };

  // Date changes helper
  const handleSetSystemDate = async (date: string) => {
    try {
      await setDoc(doc(db, 'system', 'config'), { systemDate: date });
      addNotification('success', `Tanggal sistem disinkronkan ke ${date}`);
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal memperbarui tanggal sistem.");
    }
  };

  // MASTER DATA EVENTS
  const handleAddMedicine = async (m: Medicine) => {
    try { await setDoc(doc(db, 'medicines', m.id), m); addNotification('success', 'Obat baru berhasil ditambahkan.'); } 
    catch { addNotification('error', 'Gagal menambahkan obat.'); }
  };
  const handleUpdateMedicine = async (id: string, m: Partial<Medicine>) => {
    try { const old = medicines.find(x=>x.id===id); if(!old) return; await setDoc(doc(db, 'medicines', id), {...old, ...m}); addNotification('success', 'Obat berhasil diupdate.'); }
    catch { addNotification('error', 'Gagal update obat.'); }
  };
  const handleDeleteMedicine = async (id: string) => {
    try { await deleteDoc(doc(db, 'medicines', id)); addNotification('success', 'Obat berhasil dihapus.'); }
    catch { addNotification('error', 'Gagal hapus obat.'); }
  };

  const handleAddUnit = async (u: UnitInfo) => {
    try { await setDoc(doc(db, 'units', u.id), u); addNotification('success', 'Unit baru berhasil ditambahkan.'); } 
    catch { addNotification('error', 'Gagal menambahkan unit.'); }
  };
  const handleUpdateUnit = async (id: string, u: Partial<UnitInfo>) => {
    try { const old = units.find(x=>x.id===id); if(!old) return; await setDoc(doc(db, 'units', id), {...old, ...u}); addNotification('success', 'Unit berhasil diupdate.'); }
    catch { addNotification('error', 'Gagal update unit.'); }
  };
  const handleDeleteUnit = async (id: string) => {
    try { await deleteDoc(doc(db, 'units', id)); addNotification('success', 'Unit berhasil dihapus.'); }
    catch { addNotification('error', 'Gagal hapus unit.'); }
  };

  // RECEIPT EVENTS
  const handleAddReceipt = async (newReceipt: Receipt) => {
    try {
      await setDoc(doc(db, 'receipts', newReceipt.id), newReceipt);
      addNotification('success', `Penerimaan barang ${newReceipt.id} berhasil ditambahkan secara real-time!`);
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal menambahkan penerimaan.");
    }
  };

  const handleUpdateReceipt = async (receiptId: string, updatedReceipt: Receipt) => {
    try {
      const originalReceipt = receipts.find(r => r.id === receiptId);
      if (!originalReceipt) return;
      if (originalReceipt.verifiedByAPJ) {
        addNotification('warning', 'Penerimaan yang sudah diverifikasi APJ dikunci untuk menjaga jejak audit. Lakukan transaksi koreksi/reversal, bukan mengubah dokumen asal.');
        return;
      }
      await setDoc(doc(db, 'receipts', receiptId), updatedReceipt);
      addNotification('success', `Draft penerimaan ${receiptId} berhasil diperbarui.`);
    } catch (e: any) {
      console.error(e);
      addNotification('error', e?.message || "Gagal memperbarui dokumen penerimaan.");
    }
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    try {
      if (!supabase) throw new Error('Supabase belum tersedia.');
      const { error } = await supabase.rpc('delete_draft_transaction', { p_kind: 'receipt', p_id: receiptId });
      if (error) throw error;
      addNotification('success', `Draft penerimaan ${receiptId} berhasil dihapus.`);
    } catch (e: any) {
      console.error(e);
      addNotification('error', e?.message || 'Gagal menghapus draft penerimaan.');
    }
  };

  // APJ verification posts receipt and Gudang stock in one PostgreSQL transaction

  const handleVerifyReceipt = async (receiptId: string, apjName: string) => {
    try {
      if (!supabase) throw new Error('Supabase belum tersedia.');
      const { error } = await supabase.rpc('verify_receipt_atomic', { p_receipt_id: receiptId, p_apj_name: apjName });
      if (error) throw error;
      addNotification('success', `Penerimaan ${receiptId} diverifikasi APJ; dokumen, saldo Gudang, dan batch diposting atomik.`);
    } catch (e: any) {
      console.error(e);
      addNotification('error', e?.message || "Gagal memverifikasi penerimaan.");
    }
  };

  const handleUpdateSystemConfig = async (configUpdate: Partial<SystemConfig>) => {
    try {
      const mergedConfig = { ...systemConfig, ...configUpdate };
      await setDoc(doc(db, 'system', 'config'), mergedConfig);
      addNotification('success', 'Konfigurasi Sistem (UI) berhasil diperbarui secara real-time!');
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal memperbarui struktur Konfigurasi Sistem!");
    }
  };

  // AMPRA EVENTS
  const handleCreateAmpra = async (newAmpra: Ampra) => {
    try {
      await setDoc(doc(db, 'ampras', newAmpra.id), newAmpra);
      addNotification('success', `Permintaan (Ampra) ${newAmpra.id} dikirim ke Gudang secara real-time!`);
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal memproses permintaan ampra.");
    }
  };

  // Life Cycle Updater for Ampra (Gudang allocating or APJ final approval)
  const handleUpdateAmpraStatus = async (ampraId: string, updates: Partial<Ampra>) => {
    try {
      const targetAmpra = ampras.find(a => a.id === ampraId);
      if (!targetAmpra) return;

      const updatedAmpra = { ...targetAmpra, ...updates };
      if (updates.status === 'Selesai' && targetAmpra.status !== 'Selesai') {
        if (!supabase) throw new Error('Supabase belum tersedia.');
        const { error } = await supabase.rpc('complete_ampra', { p_ampra_id: ampraId, p_updates: updates });
        if (error) throw error;
        addNotification('success', `Ampra ${ampraId} selesai secara atomik. Stok Gudang dan unit tujuan telah disinkronkan dengan batch FEFO.`);
      } else {
        await setDoc(doc(db, 'ampras', ampraId), updatedAmpra);
        addNotification('success', `Permintaan (Ampra) ${ampraId} berhasil diperbarui.`);
      }
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal memperbarui status permintaan.");
    }
  };

  const handleDeleteAmpra = async (ampraId: string) => {
    try {
      if (!supabase) throw new Error('Supabase belum tersedia.');
      const { error } = await supabase.rpc('delete_draft_transaction', { p_kind: 'ampra', p_id: ampraId });
      if (error) throw error;
      addNotification('success', `Draft Ampra ${ampraId} berhasil dihapus.`);
    } catch (e: any) {
      console.error(e);
      addNotification('error', e?.message || 'Gagal menghapus draft Ampra.');
    }
  };

  const handleProcessDisposal = async (payload: Disposal): Promise<boolean> => {
    try {
      if (!supabase) throw new Error('Supabase belum tersedia.');
      const { error } = await supabase.rpc('process_disposal_atomic', { p_payload: payload });
      if (error) throw error;
      addNotification('success', `${payload.type} ${payload.documentNo} diproses atomik dan ledger batch tersimpan.`);
      return true;
    } catch (e: any) {
      console.error(e);
      addNotification('error', e?.message || 'Gagal memproses Retur/Kadaluarsa.');
      return false;
    }
  };

  const handleReverseTransaction = async (kind: string, id: string, reason: string): Promise<boolean> => {
    try {
      if (!supabase) throw new Error('Supabase belum tersedia.');
      const { error } = await supabase.rpc('reverse_transaction_atomic', { p_kind: kind, p_id: id, p_reason: reason });
      if (error) throw error;
      await refreshReversalRegistry();
      addNotification('success', `Reversal ${id} selesai atomik. Dokumen asli tetap tersimpan untuk audit.`);
      return true;
    } catch (e: any) {
      console.error(e);
      addNotification('error', e?.message || 'Reversal transaksi gagal.');
      return false;
    }
  };

  // PRESCRIPTION CHECKOUT IN APOTEK
  const handleAddPrescription = async (newRx: Prescription) => {
    try {
      if (!supabase) throw new Error('Supabase belum tersedia.');
      const { error } = await supabase.rpc('process_prescription', { p_payload: newRx });
      if (error) throw error;
      addNotification('success', `Resep untuk ${newRx.patientName} direkam dan stok Ruang Farmasi dikurangi secara atomik.`);
    } catch (e: any) {
      console.error(e);
      addNotification('error', e?.message || "Gagal memproses resep obat.");
    }
  };

  const handleUpdatePrescription = async (rxId: string, _updatedRx: Prescription) => {
    addNotification('warning', `Resep final ${rxId} tidak dapat ditimpa. Gunakan menu Retur, Rusak & Koreksi untuk reversal, lalu buat resep pengganti.`);
  };

  const handleDeletePrescription = async (rxId: string) => {
    const reason = window.prompt(`Alasan reversal resep ${rxId} (dokumen asli tidak akan dihapus):`);
    if (!reason) return;
    await handleReverseTransaction('prescription', rxId, reason);
  };

  const handleAddUsage = async (newUsage: DailyUsage) => {
    try {
      if (!supabase) throw new Error('Supabase belum tersedia.');
      const { error } = await supabase.rpc('process_daily_usage', { p_payload: newUsage });
      if (error) throw error;
      addNotification('success', 'Pemakaian harian dan pengurangan stok unit berhasil diproses secara atomik.');
    } catch (e: any) {
      console.error(e);
      addNotification('error', e?.message || "Gagal merekam pemakaian harian.");
    }
  };

  const handleUpdateUsage = async (usageId: string, _updatedUsage: DailyUsage) => {
    addNotification('warning', `Pemakaian final ${usageId} tidak dapat ditimpa. Gunakan menu Retur, Rusak & Koreksi untuk reversal, lalu buat catatan pengganti.`);
  };

  const handleDeleteUsage = async (usageId: string) => {
    const reason = window.prompt(`Alasan reversal pemakaian ${usageId} (dokumen asli tidak akan dihapus):`);
    if (!reason) return;
    await handleReverseTransaction('usage', usageId, reason);
  };

  if (!currentUser) {
    return (
      <>
        <LoginView usersStore={users} onLogin={handleLogin} currentTheme={theme} onChangeTheme={setTheme} themes={THEMES_LIST} />
      </>
    );
  }

  return (
    <div className="min-h-[100dvh] h-[100dvh] flex flex-col font-sans bg-[#f4f7f6] text-slate-900 overflow-hidden relative" id="main-app">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-48 -right-40 h-[34rem] w-[34rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-56 -left-40 h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025] futuristic-grid" />
      </div>
      <header className="relative z-40 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="h-16 px-3 sm:px-5 lg:px-7 flex items-center gap-3">
          <button type="button" onClick={() => setSidebarCollapsed(v => !v)} className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 transition" aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}>
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => setMobileNavOpen(v => !v)} className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70" aria-label="Buka navigasi">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-500 p-px shadow-lg shadow-emerald-500/20">
              <div className="h-full w-full rounded-[11px] bg-emerald-700 flex items-center justify-center"><HeartPulse className="w-5 h-5 text-white" /></div>
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2"><h1 className="font-display text-sm sm:text-base font-bold tracking-tight text-slate-900 truncate">{systemConfig.headerTitle}</h1><span className="hidden sm:inline-flex rounded-md border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-300">LIVE</span></div>
              <p className="hidden sm:block text-[10px] text-slate-500 truncate">{systemConfig.headerSubtitle}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 h-10"><Search className="w-3.5 h-3.5 text-slate-500" /><span className="text-[10px] text-slate-500">Ruang kerja aktif</span><kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-slate-500">SIFP</kbd></div>
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 h-10"><Calendar className="w-3.5 h-3.5 text-emerald-300" /><span className="text-[10px] font-mono font-semibold text-slate-300">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-2.5 h-10"><div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-emerald-300/20 flex items-center justify-center"><CircleUserRound className="w-4 h-4 text-emerald-300" /></div><div className="leading-tight max-w-32"><span className="block text-[10px] font-semibold text-white truncate">{userName}</span><span className="block text-[8px] uppercase tracking-wider text-emerald-300 truncate">{roleLabel}</span></div></div>
            <button onClick={handleLogout} type="button" title="Keluar" className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 transition" aria-label="Keluar dari aplikasi"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="h-9 border-t border-slate-100 px-4 sm:px-6 lg:px-7 flex items-center gap-2 text-[10px] bg-slate-50/80"><span className="text-slate-500 font-semibold">SIFP</span><ChevronRight className="w-3 h-3 text-slate-300" /><span className="font-semibold text-emerald-700">{activeNavItem?.label || 'Dashboard'}</span><span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Data real-time</span></div>
      </header>
      <div className="relative z-10 flex-1 min-h-0 flex overflow-hidden" id="app-workspace">
        <aside className={`hidden md:flex shrink-0 flex-col border-r border-teal-700/70 bg-[#116b63] text-white shadow-xl transition-[width] duration-300 ${sidebarCollapsed ? 'w-[76px]' : 'w-[270px]'}`}>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            {!sidebarCollapsed && <div className="mb-5 border-b border-teal-400/25 px-3 pb-4"><div className="flex items-center gap-2 text-base font-black tracking-[0.08em] text-white"><HeartPulse className="h-6 w-6 text-teal-200" />SIMF APP</div><p className="mt-1 pl-8 text-xs font-medium text-teal-200">Puskesmas Terpadu</p></div>}
            <nav className="space-y-1" aria-label="Navigasi utama">
              {visibleNavItems.map((item, index) => {
                const Icon = item.icon; const active = activeTab === item.id;
                const sectionChanged = index === 0 || visibleNavItems[index - 1].section !== item.section;
                return <React.Fragment key={item.id}>
                  {!sidebarCollapsed && sectionChanged && <div className="px-3 pb-1 pt-4 text-[10px] font-black uppercase tracking-[0.15em] text-teal-300">{item.section}</div>}
                  <button type="button" onClick={() => navigateToTab(item.id)} title={sidebarCollapsed ? item.label : undefined} className={`group relative w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200 ${active ? 'bg-[#0b554f] text-white shadow-md ring-1 ring-teal-400/20' : 'text-teal-50 hover:bg-teal-700/70 hover:text-white'}`}>
                    {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-teal-300" />}
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'text-teal-200' : 'text-teal-300 group-hover:text-teal-100'}`}><Icon className="h-5 w-5" /></span>
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                </React.Fragment>;
              })}
            </nav>
          </div>
          {!sidebarCollapsed && <div className="border-t border-teal-400/20 bg-[#0d5d56] p-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-200 font-black text-teal-800">{userName.slice(0,2).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-xs font-bold text-white">{userName}</p><p className="truncate text-[10px] text-teal-200">{roleLabel} • Puskesmas</p></div></div></div>}
        </aside>
        {mobileNavOpen && <div className="md:hidden fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-[3px] p-2.5" onClick={() => setMobileNavOpen(false)}>
          <aside className="flex h-[calc(100dvh-1.25rem)] w-[88%] max-w-[340px] flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[#0c625a] text-white shadow-[0_24px_70px_rgba(2,44,40,.38)]" onClick={e => e.stopPropagation()}>
            <div className="shrink-0 border-b border-white/10 bg-gradient-to-br from-[#0f766e] to-[#0b5b54] px-4 pb-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15"><HeartPulse className="h-6 w-6 text-emerald-200"/></div><div className="min-w-0"><p className="truncate text-[15px] font-black text-white">SIMF Puskesmas</p><p className="truncate text-[10px] font-semibold text-teal-100">Farmasi terpadu • {roleLabel}</p></div></div>
                <button type="button" onClick={() => setMobileNavOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15 active:scale-95" aria-label="Tutup navigasi"><X className="h-5 w-5"/></button>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#094f49]/65 p-3 ring-1 ring-white/10"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-800">{userName.slice(0,2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{userName}</p><p className="truncate text-[10px] text-teal-100">{roleLabel} • Puskesmas</p></div><span className="h-2.5 w-2.5 rounded-full bg-emerald-300 ring-4 ring-emerald-300/15"/></div>
            </div>
            <nav className="mobile-app-drawer flex-1 overflow-y-auto overscroll-contain px-3 py-2.5" aria-label="Navigasi mobile">{visibleNavItems.map((item,index) => { const Icon=item.icon; const active=activeTab===item.id; const sectionChanged=index===0||visibleNavItems[index-1].section!==item.section; return <React.Fragment key={item.id}>{sectionChanged&&<div className="px-2 pb-1.5 pt-3 text-[9px] font-black uppercase tracking-[0.18em] text-teal-200/90">{item.section}</div>}<button type="button" onClick={() => navigateToTab(item.id)} className={`relative mb-1 flex min-h-[46px] w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left text-[12px] font-semibold transition-all active:scale-[.985] ${active?'bg-white text-[#0b554f] shadow-[0_8px_22px_rgba(3,50,46,.18)]':'text-teal-50 hover:bg-white/10'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active?'bg-emerald-50 text-emerald-700':'bg-white/8 text-teal-200'}`}><Icon className="h-[19px] w-[19px]"/></span><span className="min-w-0 flex-1 truncate">{item.label}</span>{active&&<span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"/>}</button></React.Fragment>; })}</nav>
            <div className="shrink-0 border-t border-white/10 bg-[#0a574f] p-3"><button type="button" onClick={() => setMobileNavOpen(false)} className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white/10 text-xs font-bold text-white ring-1 ring-white/10 active:scale-[.985]"><X className="h-4 w-4"/>Tutup Menu</button></div>
          </aside></div>}
        <section className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain bg-[#f0fdf4]" id="scrollable-content-area">
          <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-5 lg:px-7 py-4 sm:py-6">
            <div className="mb-4 flex items-center justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,.65)]" /><span className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-400">Modul aktif</span></div><h2 className="mt-1 font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 break-words">{activeNavItem?.label || 'Dashboard'}</h2></div><div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><CircleUserRound className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[10px] font-semibold text-slate-600">{roleLabel}</span></div></div>
            <main className="min-w-0 w-full pb-20 space-y-6" id="main-content-pane">
          <ModuleErrorBoundary key={activeTab} moduleName={activeNavItem?.label || activeTab} onError={(message)=>addNotification('error',message)} onRetry={()=>window.location.reload()} onHome={()=>setActiveTab('dashboard')}>
          <div className="mb-3 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-[10px] text-slate-500 shadow-sm" id="module-render-status">
            <span className="font-bold text-emerald-700">Modul aktif:</span> {activeNavItem?.label || activeTab} <span className="mx-1">•</span> <span>{activeRole.toUpperCase()}</span>
          </div>
          
          {activeTab === 'dashboard' && (
            <DashboardView
              medicines={medicines}
              stocks={stocks}
              receipts={receipts}
              ampras={ampras}
              prescriptions={prescriptions}
              usages={usages}
              systemDate={systemDate}
              onSetSystemDate={handleSetSystemDate}
              onNavigateChange={(view) => navigateToTab(view)}
            />
          )}

          {activeTab === 'opening-reconciliation' && canAccessTab('opening-reconciliation') && (
            <OpeningReconciliationView onNotify={addNotification} />
          )}

          {activeTab === 'users' && activeRole === 'admin' && (
            <UserManagementView
              users={users}
              units={units}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'master' && activeRole === 'admin' && (
            <MasterDataView
              medicines={medicines}
              units={units}
              systemConfig={systemConfig}
              onAddMedicine={handleAddMedicine}
              onUpdateMedicine={handleUpdateMedicine}
              onDeleteMedicine={handleDeleteMedicine}
              onAddUnit={handleAddUnit}
              onUpdateUnit={handleUpdateUnit}
              onDeleteUnit={handleDeleteUnit}
              onUpdateSystemConfig={handleUpdateSystemConfig}
            />
          )}

          {activeTab === 'receipts' && canAccessTab('receipts') && (
            <>
            <MobileReceiptsView receipts={receipts} medicines={medicines} />
            <div className="hidden md:block"><PenerimaanGudangView
              medicines={medicines}
              receipts={receipts}
              activeRole={activeRole as any}
              userName={userName}
              onAddReceipt={handleAddReceipt}
              onVerifyReceipt={handleVerifyReceipt}
              onDeleteReceipt={handleDeleteReceipt}
              onUpdateReceipt={handleUpdateReceipt}
              systemDate={systemDate}
              onNotify={addNotification}
              onNavigateChange={(view) => navigateToTab(view)}
            /></div>
            </>
          )}

          {activeTab === 'disposals' && canAccessTab('disposals') && (
            <DisposalCorrectionView
              medicines={medicines}
              stocks={stocks}
              disposals={disposals}
              receipts={receipts}
              ampras={ampras}
              prescriptions={prescriptions}
              usages={usages}
              activeRole={activeRole}
              userName={userName}
              systemDate={systemDate}
              onProcessDisposal={handleProcessDisposal}
              onReverse={handleReverseTransaction}
              onNotify={addNotification}
            />
          )}

          {activeTab === 'ampra' && canAccessTab('ampra') && (
            <>
            <MobileAmpraView ampras={ampras} medicines={medicines} units={units} />
            <div className="hidden md:block"><AmpraGudangView
              medicines={medicines}
              units={units}
              ampras={ampras}
              stocks={stocks}
              activeRole={activeRole as any}
              activeUnitId={activeUnitId}
              userName={userName}
              onCreateAmpra={handleCreateAmpra}
              onUpdateAmpraStatus={handleUpdateAmpraStatus}
              onDeleteAmpra={handleDeleteAmpra}
              systemDate={systemDate}
              onNotify={addNotification}
              onNavigateChange={(view) => navigateToTab(view)}
            /></div>
            </>
          )}

          {activeTab === 'apotek' && canAccessTab('apotek') && (
            <ApotekPasienView
              medicines={medicines}
              prescriptions={prescriptions}
              stocks={stocks}
              onAddPrescription={handleAddPrescription}
              onDeletePrescription={handleDeletePrescription}
              onUpdatePrescription={handleUpdatePrescription}
              activeRole={activeRole as any}
              systemDate={systemDate}
              onNotify={addNotification}
              onNavigateChange={(view) => navigateToTab(view)}
            />
          )}

          {activeTab === 'satellites' && canAccessTab('satellites') && (
            <UsageUnitView
              medicines={medicines}
              units={units}
              stocks={stocks}
              usages={usages}
              activeRole={activeRole as any}
              activeUnitId={activeUnitId}
              onSetSimulationUnit={(unitId) => { if (activeRole === 'admin' || activeRole === 'apj' || activeRole === 'gudang') setAdminViewUnitId(unitId); }}
              onAddUsage={handleAddUsage}
              onDeleteUsage={handleDeleteUsage}
              onUpdateUsage={handleUpdateUsage}
              systemDate={systemDate}
              onNotify={addNotification}
              onNavigateChange={(view) => navigateToTab(view)}
            />
          )}

          {activeTab === 'reports' && canAccessTab('reports') && (
            <LaporanView
              medicines={medicines}
              units={units}
              stocks={stocks}
              receipts={receipts.filter(x => !reversedTransactionKeys.has(`receipt:${x.id}`))}
              ampras={ampras.filter(x => !reversedTransactionKeys.has(`ampra:${x.id}`))}
              prescriptions={prescriptions.filter(x => !reversedTransactionKeys.has(`prescription:${x.id}`))}
              usages={usages.filter(x => !reversedTransactionKeys.has(`usage:${x.id}`))}
              userName={userName}
              onNotify={addNotification}
              onNavigateChange={(view) => navigateToTab(view)}
            />
          )}

          </ModuleErrorBoundary>
            </main>
          </div>
        </section>
      </div>

      <nav className="md:hidden relative z-40 shrink-0 border-t border-slate-200/80 bg-white/95 px-3 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_28px_rgba(15,23,42,.08)] backdrop-blur-xl" aria-label="Navigasi mobile">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          <button type="button" onClick={() => navigateToTab('dashboard')} className={`h-12 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-bold transition-all active:scale-[.98] ${activeTab==='dashboard' ? 'bg-[#0f625b] text-white shadow-md' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'}`}><LayoutDashboard className="w-5 h-5"/><span>Dashboard</span></button>
          <button type="button" onClick={() => setMobileNavOpen(true)} className={`h-12 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-bold transition-all active:scale-[.98] ${mobileMoreActive ? 'bg-[#0f625b] text-white shadow-md' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'}`}><Menu className="w-5 h-5"/><span className="truncate">{mobileMoreActive ? (activeNavItem?.short || 'Menu') : 'Semua Menu'}</span></button>
        </div>
      </nav>

      <AnimatePresence>
        {confirmState && <motion.div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>closeConfirm(false)}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-sm overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_28px_80px_rgba(15,23,42,.28)]" initial={{opacity:0,scale:.94,y:18}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.96,y:12}} onClick={e=>e.stopPropagation()}>
            <div className="p-5"><div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${confirmState.tone==='danger'?'bg-rose-50 text-rose-600':confirmState.tone==='warning'?'bg-amber-50 text-amber-600':'bg-blue-50 text-blue-600'}`}><AlertTriangle className="h-6 w-6"/></div><h3 id="confirm-title" className="text-lg font-black text-slate-900">{confirmState.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{confirmState.message}</p></div>
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50 p-3"><button type="button" onClick={()=>closeConfirm(false)} className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 active:scale-[.98]">Batal</button><button type="button" onClick={()=>closeConfirm(true)} className={`h-11 rounded-xl text-sm font-bold text-white shadow-sm active:scale-[.98] ${confirmState.tone==='danger'?'bg-rose-600':'bg-[#0f766e]'}`}>{confirmState.confirmLabel}</button></div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>
      {/* Premium Toast Notifications Container */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[9999] flex flex-col gap-3 w-[calc(100vw-1.5rem)] sm:w-full max-w-sm pointer-events-none" id="toast-container">
        <AnimatePresence>
          {notifications.map(n => {
            const isSuccess = n.type === 'success';
            const isError = n.type === 'error';
            const isWarning = n.type === 'warning';
            
            let bgClass = "bg-blue-50 border-blue-200 text-blue-800";
            let iconCode = <Info className="w-5 h-5 text-blue-500 shrink-0" />;
            if (isSuccess) {
              bgClass = "bg-emerald-50 border-emerald-200 text-emerald-800";
              iconCode = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
            } else if (isError) {
              bgClass = "bg-rose-50 border-rose-200 text-rose-800";
              iconCode = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
            } else if (isWarning) {
              bgClass = "bg-amber-50 border-amber-200 text-amber-900";
              iconCode = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
            }

            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: -20, scale: 0.9, x: 15 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 }, x: 10 }}
                className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto transition-all ${bgClass}`}
                id={`toast-item-${n.id}`}
              >
                {iconCode}
                <div className="flex-1 text-xs font-semibold leading-relaxed">
                  {n.message}
                </div>
                <button
                  onClick={() => removeNotification(n.id)}
                  className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 p-0.5 rounded-full hover:bg-black/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {/* SIFP public health footer */}
      <footer className="hidden md:block bg-slate-900 border-t border-slate-950 text-slate-500 py-3 text-center text-xs shrink-0" id="sifp-footer">
        <p>&copy; 2026 Sistem Informasi Farmasi Puskesmas • Dinas Kesehatan Kota Parepare</p>
      </footer>
    </div>
  );
}
