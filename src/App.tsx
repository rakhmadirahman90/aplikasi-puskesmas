/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

  // Core SIFP State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [units, setUnits] = useState<UnitInfo[]>([]);
  
  // Reactive state loaded from Firestore in real-time
  const [stocks, setStocks] = useState<StockStore>({});
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [ampras, setAmpras] = useState<Ampra[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [usages, setUsages] = useState<DailyUsage[]>([]);

  // Expiration calibrators
  const [systemDate, setSystemDate] = useState<string>(new Date().toISOString().slice(0,10));
  
  // Dynamic UI Config
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    headerTitle: "SIM-Farmasi",
    headerSubtitle: "Parepare • Verifikasi Terintegrasi",
    footerText: "Sistem Informasi Farmasi Terintegrasi",
    sidebarVisible: true
  });

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Authenticated Role Accessors
  const activeRole = currentUser?.role || 'unit';
  const activeUnitId = currentUser?.unitId || 'pustu';
  const userName = currentUser?.name || 'Guest User';

  // Role-based navigation: users only see modules relevant to their role.
  const ROLE_TAB_ACCESS: Record<AppRole, string[]> = {
    admin: ['dashboard', 'receipts', 'ampra', 'apotek', 'satellites', 'reports', 'master', 'users'],
    apj: ['dashboard', 'receipts', 'ampra', 'apotek', 'satellites', 'reports'],
    gudang: ['dashboard', 'receipts', 'ampra', 'satellites', 'reports'],
    farmasi: ['dashboard', 'ampra', 'apotek', 'satellites', 'reports'],
    unit: ['dashboard', 'ampra', 'satellites', 'reports']
  };

  const canAccessTab = (tab: string) => ROLE_TAB_ACCESS[activeRole]?.includes(tab) ?? false;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const NAV_ITEMS: Array<{ id: string; label: string; short: string; icon: React.ElementType; section?: string }> = [
    { id: 'dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard, section: 'Workspace' },
    { id: 'receipts', label: 'Penerimaan Gudang', short: 'Terima', icon: Truck, section: 'Logistik' },
    { id: 'ampra', label: 'Ampra Unit', short: 'Ampra', icon: ArrowRightLeft, section: 'Logistik' },
    { id: 'apotek', label: 'Apotek Pasien', short: 'Apotek', icon: Pill, section: 'Pelayanan' },
    { id: 'satellites', label: 'Terminal Unit & Pustu', short: 'Unit', icon: Database, section: 'Operasional' },
    { id: 'reports', label: 'Laporan & Audit', short: 'Laporan', icon: FileText, section: 'Insight' },
    { id: 'master', label: 'Master Data', short: 'Master', icon: Database, section: 'Administrasi' },
    { id: 'users', label: 'Akses & Pengguna', short: 'User', icon: ShieldCheck, section: 'Administrasi' }
  ];

  const visibleNavItems = NAV_ITEMS.filter(item => canAccessTab(item.id));
  const activeNavItem = visibleNavItems.find(item => item.id === activeTab) || visibleNavItems[0];
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

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    addNotification('success', `Berhasil login sebagai ${user.name}`);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveTab('dashboard');
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
      });
      unsubscribes.push(unsubConfig);

      // 2. Real-time stocks store
      const unsubStocks = onSnapshot(collection(db, 'stocks'), (qSnap) => {
        const updatedStocks: StockStore = {};
        qSnap.forEach((docSnap) => {
          updatedStocks[docSnap.id] = docSnap.data() as any;
        });
        setStocks(updatedStocks);
      });
      unsubscribes.push(unsubStocks);

      // 3. Real-time receipts
      const unsubReceipts = onSnapshot(collection(db, 'receipts'), (qSnap) => {
        const updatedReceipts: Receipt[] = [];
        qSnap.forEach((docSnap) => {
          updatedReceipts.push(docSnap.data() as Receipt);
        });
        updatedReceipts.sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
        setReceipts(updatedReceipts);
      });
      unsubscribes.push(unsubReceipts);

      // 4. Real-time ampras
      const unsubAmpras = onSnapshot(collection(db, 'ampras'), (qSnap) => {
        const updatedAmpras: Ampra[] = [];
        qSnap.forEach((docSnap) => {
          updatedAmpras.push(docSnap.data() as Ampra);
        });
        updatedAmpras.sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
        setAmpras(updatedAmpras);
      });
      unsubscribes.push(unsubAmpras);

      // 5. Real-time prescriptions
      const unsubPrescriptions = onSnapshot(collection(db, 'prescriptions'), (qSnap) => {
        const updatedPrescriptions: Prescription[] = [];
        qSnap.forEach((docSnap) => {
          updatedPrescriptions.push(docSnap.data() as Prescription);
        });
        updatedPrescriptions.sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
        setPrescriptions(updatedPrescriptions);
      });
      unsubscribes.push(unsubPrescriptions);

      // 6. Real-time usages
      const unsubUsages = onSnapshot(collection(db, 'usages'), (qSnap) => {
        const updatedUsages: DailyUsage[] = [];
        qSnap.forEach((docSnap) => {
          updatedUsages.push(docSnap.data() as DailyUsage);
        });
        updatedUsages.sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
        setUsages(updatedUsages);
      });
      unsubscribes.push(unsubUsages);

      // 7. Real-time users
      const unsubUsers = onSnapshot(collection(db, 'users'), (qSnap) => {
        const updatedUsers: UserAccount[] = [];
        qSnap.forEach((docSnap) => {
          updatedUsers.push(docSnap.data() as UserAccount);
        });
        if (updatedUsers.length > 0) setUsers(updatedUsers);
      });
      unsubscribes.push(unsubUsers);

      // 8. Real-time medicines
      const unsubMedicines = onSnapshot(collection(db, 'medicines'), (qSnap) => {
        const updatedMedicines: Medicine[] = [];
        qSnap.forEach((docSnap) => {
          updatedMedicines.push(docSnap.data() as Medicine);
        });
        if (updatedMedicines.length > 0) setMedicines(updatedMedicines);
      });
      unsubscribes.push(unsubMedicines);

      // 9. Real-time units
      const unsubUnits = onSnapshot(collection(db, 'units'), (qSnap) => {
        const updatedUnits: UnitInfo[] = [];
        qSnap.forEach((docSnap) => {
          updatedUnits.push(docSnap.data() as UnitInfo);
        });
        if (updatedUnits.length > 0) setUnits(updatedUnits);
      });
      unsubscribes.push(unsubUnits);
    };

    setupDatabaseSubscription().catch(e => {
      console.error("Supabase database synchronization failure:", e);
      addNotification('error', 'Gagal menyinkronkan database Supabase.');
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

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

      // When modifying an already verified receipt, correct the stocks
      if (originalReceipt.verifiedByAPJ) {
        const currentStocks = JSON.parse(JSON.stringify(stocks));
        if (currentStocks['gudang']) {
          // 1. Deduct old quantities
          originalReceipt.items.forEach(item => {
            const currentItem = currentStocks['gudang'][item.medicineId];
            if (currentItem) {
              currentItem.total = Math.max(0, currentItem.total - item.quantity);
              if (currentItem.batches) {
                const batchIdx = currentItem.batches.findIndex((b: any) => b.batchNo === item.batchNo && b.expDate === item.expDate);
                if (batchIdx !== -1) {
                  currentItem.batches[batchIdx].quantity = Math.max(0, currentItem.batches[batchIdx].quantity - item.quantity);
                }
                currentItem.batches = currentItem.batches.filter((b: any) => b.quantity > 0);
              }
            }
          });

          // 2. Add new quantities
          updatedReceipt.items.forEach(item => {
            if (!currentStocks['gudang'][item.medicineId]) {
              currentStocks['gudang'][item.medicineId] = { total: 0, batches: [] };
            }
            const currentItem = currentStocks['gudang'][item.medicineId];
            currentItem.total += item.quantity;
            if (!currentItem.batches) {
              currentItem.batches = [];
            }
            currentItem.batches.push({
              batchNo: item.batchNo,
              expDate: item.expDate,
              quantity: item.quantity,
              source: item.source,
              price: item.price || 0
            });
          });

          await setDoc(doc(db, 'stocks', 'gudang'), currentStocks['gudang']);
        }
      }

      await setDoc(doc(db, 'receipts', receiptId), updatedReceipt);
      addNotification('success', `Dokumen penerimaan ${receiptId} berhasil disinkronkan dan diperbarui secara real-time!`);
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal memperbarui dokumen penerimaan.");
    }
  };

  // APJ confirms Receipt and actually stocks increase in Gudang
  const handleVerifyReceipt = async (receiptId: string, apjName: string) => {
    try {
      // 1. Mark receipt verified in Firestore
      const receiptToVerify = receipts.find(r => r.id === receiptId);
      if (!receiptToVerify) return;

      const updatedReceipt = { ...receiptToVerify, verifiedByAPJ: true, apjName };
      await setDoc(doc(db, 'receipts', receiptId), updatedReceipt);

      // 2. Adjust Stocks Gudang (add items and batch quantities) in Firestore
      const currentStocks = JSON.parse(JSON.stringify(stocks)); // Deep copy helper
      if (!currentStocks['gudang']) {
        currentStocks['gudang'] = {};
      }

      receiptToVerify.items.forEach(item => {
        const currentItem = currentStocks['gudang'][item.medicineId] || { total: 0, batches: [] };
        
        // Increase total
        currentItem.total += item.quantity;

        // Manage batches list
        if (!currentItem.batches) {
          currentItem.batches = [];
        }

        currentItem.batches.push({
          batchNo: item.batchNo,
          expDate: item.expDate,
          quantity: item.quantity,
          source: item.source,
          price: item.price || 0
        });

        currentStocks['gudang'][item.medicineId] = currentItem;
      });

      // Write 'gudang' stock document to Firestore
      await setDoc(doc(db, 'stocks', 'gudang'), currentStocks['gudang']);
      addNotification('success', `Apoteker memverifikasi penerimaan ${receiptId}. Stok Gudang bertambah secara real-time!`);
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal memverifikasi penerimaan.");
    }
  };

  // SYSTEM CONFIG EVENTS
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
      await setDoc(doc(db, 'ampras', ampraId), updatedAmpra);

      // CRITICAL CORE LOGIC: When status shifts to 'Selesai' (Authorized by APJ):
      // 1. Deduct Gudang stocks (using FEFO/First Expired First Out method)
      // 2. Automatically Add stocks to destination satellite unit (Ruang Farmasi, IGD, Pustu, etc.)
      if (updates.status === 'Selesai' && targetAmpra.status !== 'Selesai') {
        const currentStocks = JSON.parse(JSON.stringify(stocks));

        // Get accurate lines to transfer
        const linesToTransfer = updates.items || targetAmpra.items;

        linesToTransfer.forEach(line => {
          const medId = line.medicineId;
          const qtyToTransfer = line.approvedQty;

          if (qtyToTransfer <= 0) return;

          // A. DEDUCT GUDANG (FEFO logic)
          const gudStockObj = currentStocks['gudang']?.[medId];
          if (gudStockObj) {
            // Subtract total gudang
            gudStockObj.total = Math.max(0, gudStockObj.total - qtyToTransfer);

            // Subtract batch records selectively using FEFO
            if (gudStockObj.batches && gudStockObj.batches.length > 0) {
              // Sort batches: earliest expiring first
              gudStockObj.batches.sort((a: any, b: any) => new Date(a.expDate).getTime() - new Date(b.expDate).getTime());

              let remainingToDeduct = qtyToTransfer;
              for (let i = 0; i < gudStockObj.batches.length; i++) {
                const b = gudStockObj.batches[i];
                if (b.quantity >= remainingToDeduct) {
                  b.quantity -= remainingToDeduct;
                  remainingToDeduct = 0;
                  break;
                } else {
                  remainingToDeduct -= b.quantity;
                  b.quantity = 0;
                }
              }

              // Remove empty batches
              gudStockObj.batches = gudStockObj.batches.filter((b: any) => b.quantity > 0);
            }
          }

          // B. ADD TO SOURCE UNIT (Stock transfer flow)
          if (!currentStocks[targetAmpra.sourceUnitId]) {
            currentStocks[targetAmpra.sourceUnitId] = {};
          }

          const unitItem = currentStocks[targetAmpra.sourceUnitId][medId] || { total: 0 };
          unitItem.total += qtyToTransfer;
          currentStocks[targetAmpra.sourceUnitId][medId] = unitItem;
        });

        // Write both 'gudang' and source unit stock changes to Firestore
        await setDoc(doc(db, 'stocks', 'gudang'), currentStocks['gudang'] || {});
        await setDoc(doc(db, 'stocks', targetAmpra.sourceUnitId), currentStocks[targetAmpra.sourceUnitId] || {});
        addNotification('success', `Ampra ${ampraId} tuntas! Stok Gudang \& ${targetAmpra.sourceUnitId} disinkronkan real-time.`);
      } else {
        addNotification('success', `Permintaan (Ampra) ${ampraId} berhasil diperbarui.`);
      }
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal memperbarui status permintaan.");
    }
  };

  // PRESCRIPTION CHECKOUT IN APOTEK
  const handleAddPrescription = async (newRx: Prescription) => {
    try {
      // 1. Add record to Firestore
      await setDoc(doc(db, 'prescriptions', newRx.id), newRx);

      // 2. Reduce Apotheke Stocks instantly in Firestore
      const currentStocks = JSON.parse(JSON.stringify(stocks));
      newRx.items.forEach(item => {
        if (!currentStocks['ruang_farmasi']) currentStocks['ruang_farmasi'] = {};
        const rfObj = currentStocks['ruang_farmasi'][item.medicineId] || { total: 0 };
        
        rfObj.total = Math.max(0, rfObj.total - item.qty);
        currentStocks['ruang_farmasi'][item.medicineId] = rfObj;
      });

      await setDoc(doc(db, 'stocks', 'ruang_farmasi'), currentStocks['ruang_farmasi'] || {});
      addNotification('success', `Resep untuk ${newRx.patientName} direkam secara real-time!`);
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal memproses resep obat.");
    }
  };

  const handleUpdatePrescription = async (rxId: string, updatedRx: Prescription) => {
    try {
      const originalRx = prescriptions.find(p => p.id === rxId);
      if (!originalRx) return;

      const currentStocks = JSON.parse(JSON.stringify(stocks));
      if (!currentStocks['ruang_farmasi']) currentStocks['ruang_farmasi'] = {};

      // 1. Return old quantities
      originalRx.items.forEach(item => {
        const rfObj = currentStocks['ruang_farmasi'][item.medicineId] || { total: 0 };
        rfObj.total += item.qty;
        currentStocks['ruang_farmasi'][item.medicineId] = rfObj;
      });

      // 2. Deduct new quantities
      updatedRx.items.forEach(item => {
        const rfObj = currentStocks['ruang_farmasi'][item.medicineId] || { total: 0 };
        rfObj.total = Math.max(0, rfObj.total - item.qty);
        currentStocks['ruang_farmasi'][item.medicineId] = rfObj;
      });

      await setDoc(doc(db, 'stocks', 'ruang_farmasi'), currentStocks['ruang_farmasi'] || {});
      await setDoc(doc(db, 'prescriptions', rxId), updatedRx);
      addNotification('success', `Resep ${rxId} berhasil diperbarui secara real-time!`);
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal memperbarui resep.");
    }
  };

  // DAILY SATELLITE USAGE RECORD
  const handleAddUsage = async (newUsage: DailyUsage) => {
    try {
      // 1. Add use record in Firestore
      await setDoc(doc(db, 'usages', newUsage.id), newUsage);

      // 2. Reduce corresponding satellite unit stocks instantly in Firestore
      const currentStocks = JSON.parse(JSON.stringify(stocks));
      const targetUnit = newUsage.unitId;

      newUsage.items.forEach(item => {
        if (!currentStocks[targetUnit]) currentStocks[targetUnit] = {};
        const unitObj = currentStocks[targetUnit][item.medicineId] || { total: 0 };

        unitObj.total = Math.max(0, unitObj.total - item.qtyUsed);
        currentStocks[targetUnit][item.medicineId] = unitObj;
      });

      await setDoc(doc(db, 'stocks', targetUnit), currentStocks[targetUnit] || {});
      addNotification('success', `Laporan pemakaian unit disinkronkan secara real-time!`);
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal merekam pemakaian harian.");
    }
  };

  const handleUpdateUsage = async (usageId: string, updatedUsage: DailyUsage) => {
    try {
      const originalUsage = usages.find(u => u.id === usageId);
      if (!originalUsage) return;

      const currentStocks = JSON.parse(JSON.stringify(stocks));
      const targetUnit = originalUsage.unitId;
      if (!currentStocks[targetUnit]) currentStocks[targetUnit] = {};

      // 1. Return old quantities
      originalUsage.items.forEach(item => {
        const unitObj = currentStocks[targetUnit][item.medicineId] || { total: 0 };
        unitObj.total += item.qtyUsed;
        currentStocks[targetUnit][item.medicineId] = unitObj;
      });

      // 2. Deduct new quantities
      updatedUsage.items.forEach(item => {
        const unitObj = currentStocks[targetUnit][item.medicineId] || { total: 0 };
        unitObj.total = Math.max(0, unitObj.total - item.qtyUsed);
        currentStocks[targetUnit][item.medicineId] = unitObj;
      });

      await setDoc(doc(db, 'stocks', targetUnit), currentStocks[targetUnit] || {});
      await setDoc(doc(db, 'usages', usageId), updatedUsage);
      addNotification('success', `Laporan pemakaian ${usageId} berhasil diperbarui secara real-time!`);
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal memperbarui laporan pemakaian.");
    }
  };

  // DELETE OPERATIONS FOR FULL CRUD
  const handleDeleteReceipt = async (receiptId: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus dokumen penerimaan ${receiptId}? Tindakan ini akan mengoreksi stok gudang jika telah terverifikasi.`)) {
      return;
    }
    try {
      const receiptToDelete = receipts.find(r => r.id === receiptId);
      if (!receiptToDelete) return;

      if (receiptToDelete.verifiedByAPJ) {
        const currentStocks = JSON.parse(JSON.stringify(stocks));
        if (currentStocks['gudang']) {
          receiptToDelete.items.forEach(item => {
            const currentItem = currentStocks['gudang'][item.medicineId];
            if (currentItem) {
              currentItem.total = Math.max(0, currentItem.total - item.quantity);

              if (currentItem.batches) {
                const batchIdx = currentItem.batches.findIndex((b: any) => b.batchNo === item.batchNo && b.expDate === item.expDate);
                if (batchIdx !== -1) {
                  currentItem.batches[batchIdx].quantity = Math.max(0, currentItem.batches[batchIdx].quantity - item.quantity);
                }
                currentItem.batches = currentItem.batches.filter((b: any) => b.quantity > 0);
              }
            }
          });
          await setDoc(doc(db, 'stocks', 'gudang'), currentStocks['gudang'] || {});
        }
      }

      await deleteDoc(doc(db, 'receipts', receiptId));
      addNotification('success', `Dokumen penerimaan ${receiptId} berhasil dihapus.`);
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal menghapus dokumen penerimaan.");
    }
  };

  const handleDeleteAmpra = async (ampraId: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin membatalkan/menghapus permintaan Ampra ${ampraId}? Jika sudah disetujui, stok unit akan dikembalikan.`)) {
      return;
    }
    try {
      const targetAmpra = ampras.find(a => a.id === ampraId);
      if (!targetAmpra) return;

      if (targetAmpra.status === 'Selesai') {
        const currentStocks = JSON.parse(JSON.stringify(stocks));
        targetAmpra.items.forEach(item => {
          const medId = item.medicineId;
          const qty = item.approvedQty || 0;
          if (qty <= 0) return;

          if (currentStocks[targetAmpra.sourceUnitId] && currentStocks[targetAmpra.sourceUnitId][medId]) {
            currentStocks[targetAmpra.sourceUnitId][medId].total = Math.max(0, currentStocks[targetAmpra.sourceUnitId][medId].total - qty);
          }

          if (!currentStocks['gudang']) currentStocks['gudang'] = {};
          if (!currentStocks['gudang'][medId]) currentStocks['gudang'][medId] = { total: 0, batches: [] };
          currentStocks['gudang'][medId].total += qty;

          if (!currentStocks['gudang'][medId].batches) currentStocks['gudang'][medId].batches = [];
          const existingBatch = currentStocks['gudang'][medId].batches.find((b: any) => b.batchNo === 'RESTORED') || currentStocks['gudang'][medId].batches[0];
          if (existingBatch) {
            existingBatch.quantity += qty;
          } else {
            currentStocks['gudang'][medId].batches.push({
              batchNo: 'RESTORED',
              expDate: '2028-12-31',
              quantity: qty,
              source: 'Program'
            });
          }
        });

        await setDoc(doc(db, 'stocks', 'gudang'), currentStocks['gudang'] || {});
        await setDoc(doc(db, 'stocks', targetAmpra.sourceUnitId), currentStocks[targetAmpra.sourceUnitId] || {});
      }

      await deleteDoc(doc(db, 'ampras', ampraId));
      addNotification('success', `Dokumen Ampra ${ampraId} berhasil dihapus.`);
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal menghapus dokumen Ampra.");
    }
  };

  const handleDeletePrescription = async (rxId: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin membatalkan/menghapus resep ${rxId}? Stok ruangan farmasi akan dikembalikan.`)) {
      return;
    }
    try {
      const rxToDelete = prescriptions.find(p => p.id === rxId);
      if (!rxToDelete) return;

      const currentStocks = JSON.parse(JSON.stringify(stocks));
      rxToDelete.items.forEach(item => {
        if (!currentStocks['ruang_farmasi']) currentStocks['ruang_farmasi'] = {};
        const rfObj = currentStocks['ruang_farmasi'][item.medicineId] || { total: 0 };
        rfObj.total += item.qty;
        currentStocks['ruang_farmasi'][item.medicineId] = rfObj;
      });

      await setDoc(doc(db, 'stocks', 'ruang_farmasi'), currentStocks['ruang_farmasi'] || {});
      await deleteDoc(doc(db, 'prescriptions', rxId));
      addNotification('success', `Resep ${rxId} berhasil dibatalkan dan dihapus secara real-time.`);
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal membatalkan resep obat.");
    }
  };

  const handleDeleteUsage = async (usageId: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin membatalkan/menghapus laporan pemakaian harian ${usageId}? Stok unit akan dikembalikan.`)) {
      return;
    }
    try {
      const usageToDelete = usages.find(u => u.id === usageId);
      if (!usageToDelete) return;

      const currentStocks = JSON.parse(JSON.stringify(stocks));
      const targetUnit = usageToDelete.unitId;

      usageToDelete.items.forEach(item => {
        if (!currentStocks[targetUnit]) currentStocks[targetUnit] = {};
        const unitObj = currentStocks[targetUnit][item.medicineId] || { total: 0 };
        unitObj.total += item.qtyUsed;
        currentStocks[targetUnit][item.medicineId] = unitObj;
      });

      await setDoc(doc(db, 'stocks', targetUnit), currentStocks[targetUnit] || {});
      await deleteDoc(doc(db, 'usages', usageId));
      addNotification('success', `Laporan pemakaian ${usageId} berhasil dihapus.`);
    } catch (e) {
      console.error(e);
      addNotification('error', "Gagal menghapus laporan pemakaian.");
    }
  };

  if (!currentUser) {
    return (
      <>
        <LoginView usersStore={users} onLogin={handleLogin} currentTheme={theme} onChangeTheme={setTheme} themes={THEMES_LIST} />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col font-sans bg-slate-950 text-slate-900 overflow-hidden relative" id="main-app">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-48 -right-40 h-[34rem] w-[34rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-56 -left-40 h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025] futuristic-grid" />
      </div>
      <header className="relative z-40 shrink-0 border-b border-white/10 bg-slate-950/85 backdrop-blur-2xl">
        <div className="h-16 px-3 sm:px-5 lg:px-7 flex items-center gap-3">
          <button type="button" onClick={() => setSidebarCollapsed(v => !v)} className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 transition" aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}>
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => setMobileNavOpen(v => !v)} className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70" aria-label="Buka navigasi">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-500 p-px shadow-lg shadow-emerald-500/20">
              <div className="h-full w-full rounded-[11px] bg-slate-950 flex items-center justify-center"><HeartPulse className="w-5 h-5 text-emerald-300" /></div>
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2"><h1 className="font-display text-sm sm:text-base font-bold tracking-tight text-white truncate">{systemConfig.headerTitle}</h1><span className="hidden sm:inline-flex rounded-md border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-300">LIVE</span></div>
              <p className="hidden sm:block text-[10px] text-slate-500 truncate">{systemConfig.headerSubtitle}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 h-10"><Search className="w-3.5 h-3.5 text-slate-500" /><span className="text-[10px] text-slate-500">Ruang kerja aktif</span><kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-slate-500">SIFP</kbd></div>
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 h-10"><Calendar className="w-3.5 h-3.5 text-emerald-300" /><span className="text-[10px] font-mono font-semibold text-slate-300">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-2.5 h-10"><div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-emerald-300/20 flex items-center justify-center"><CircleUserRound className="w-4 h-4 text-emerald-300" /></div><div className="leading-tight max-w-32"><span className="block text-[10px] font-semibold text-white truncate">{userName}</span><span className="block text-[8px] uppercase tracking-wider text-emerald-300 truncate">{roleLabel}</span></div></div>
            <button onClick={handleLogout} type="button" title="Keluar" className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-red-400/15 bg-red-400/[0.05] text-red-300 hover:bg-red-400/10 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 transition" aria-label="Keluar dari aplikasi"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="h-9 border-t border-white/[0.06] px-4 sm:px-6 lg:px-7 flex items-center gap-2 text-[10px]"><span className="text-slate-600">SIFP</span><ChevronRight className="w-3 h-3 text-slate-700" /><span className="font-semibold text-emerald-300">{activeNavItem?.label || 'Dashboard'}</span><span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Data real-time</span></div>
      </header>
      <div className="relative z-10 flex-1 min-h-0 flex overflow-hidden">
        <aside className={`hidden md:flex shrink-0 flex-col border-r border-white/10 bg-slate-950/65 backdrop-blur-2xl transition-[width] duration-300 ${sidebarCollapsed ? 'w-[76px]' : 'w-[250px]'}`}>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            {!sidebarCollapsed && <div className="mb-5 px-2"><div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.22em] text-slate-600"><Command className="w-3 h-3 text-emerald-400" />Workspace</div><p className="mt-2 text-xs text-slate-400">Modul yang tersedia untuk peran Anda.</p></div>}
            <nav className="space-y-1" aria-label="Navigasi utama">
              {visibleNavItems.map((item, index) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                const sectionChanged = index > 0 && visibleNavItems[index - 1].section !== item.section;
                return <React.Fragment key={item.id}>
                  {!sidebarCollapsed && sectionChanged && <div className="px-3 pt-4 pb-1 text-[8px] font-mono uppercase tracking-[0.2em] text-slate-700">{item.section}</div>}
                  <button type="button" onClick={() => setActiveTab(item.id)} title={sidebarCollapsed ? item.label : undefined} className={`group relative w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} rounded-xl px-3 py-2.5 text-left text-[11px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${active ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-white border border-emerald-400/20 shadow-lg shadow-emerald-950/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.045] border border-transparent'}`}>
                    {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,.8)]" />}
                    <span className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[0.025] text-slate-600 group-hover:text-slate-300'}`}><Icon className="w-4 h-4" /></span>
                    {!sidebarCollapsed && <><span className="truncate">{item.label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,.8)]" />}</>}
                  </button>
                </React.Fragment>;
              })}
            </nav>
          </div>
          {!sidebarCollapsed && <div className="m-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-3"><div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-300" /><span className="text-[10px] font-semibold text-slate-300">System status</span><span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /></div><p className="mt-2 text-[9px] leading-relaxed text-slate-600">Sinkronisasi data dan autentikasi aktif.</p></div>}
        </aside>
        {mobileNavOpen && <div className="md:hidden absolute inset-0 z-50 bg-slate-950/75 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)}><aside className="h-full w-[86%] max-w-sm bg-slate-950 border-r border-white/10 p-4 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-5"><div><div className="text-[9px] font-mono uppercase tracking-[0.2em] text-emerald-300">Navigation core</div><div className="text-white font-display font-bold mt-1">Menu aplikasi</div></div><button type="button" onClick={() => setMobileNavOpen(false)} className="h-9 w-9 rounded-xl border border-white/10 text-slate-400 hover:text-white flex items-center justify-center" aria-label="Tutup navigasi"><X className="w-4 h-4" /></button></div><nav className="space-y-1" aria-label="Navigasi mobile">{visibleNavItems.map(item => { const Icon=item.icon; const active=activeTab===item.id; return <button key={item.id} type="button" onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }} className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold ${active ? 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20' : 'text-slate-400 hover:bg-white/[0.05]'}`}><span className="h-9 w-9 rounded-lg bg-white/[0.04] flex items-center justify-center"><Icon className="w-4 h-4" /></span>{item.label}</button>; })}</nav></aside></div>}
        <section className="flex-1 min-w-0 overflow-y-auto bg-slate-50/95" id="scrollable-content-area">
          <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-5 lg:px-7 py-4 sm:py-6">
            <div className="mb-4 flex items-center justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,.65)]" /><span className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-400">Active workspace</span></div><h2 className="mt-1 font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">{activeNavItem?.label || 'Dashboard'}</h2></div><div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><CircleUserRound className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[10px] font-semibold text-slate-600">{roleLabel}</span></div></div>
            <main className="min-w-0 w-full pb-20 space-y-6" id="main-content-pane">
          
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
              onNavigateChange={(view) => { if (canAccessTab(view)) setActiveTab(view); }}
            />
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
            <PenerimaanGudangView
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
              onNavigateChange={(view) => { if (canAccessTab(view)) setActiveTab(view); }}
            />
          )}

          {activeTab === 'ampra' && canAccessTab('ampra') && (
            <AmpraGudangView
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
              onNavigateChange={(view) => { if (canAccessTab(view)) setActiveTab(view); }}
            />
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
              onNavigateChange={(view) => { if (canAccessTab(view)) setActiveTab(view); }}
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
              onSetSimulationUnit={() => {}}
              onAddUsage={handleAddUsage}
              onDeleteUsage={handleDeleteUsage}
              onUpdateUsage={handleUpdateUsage}
              systemDate={systemDate}
              onNotify={addNotification}
              onNavigateChange={(view) => { if (canAccessTab(view)) setActiveTab(view); }}
            />
          )}

          {activeTab === 'reports' && canAccessTab('reports') && (
            <LaporanView
              medicines={medicines}
              units={units}
              stocks={stocks}
              receipts={receipts}
              ampras={ampras}
              prescriptions={prescriptions}
              usages={usages}
              userName={userName}
              onNotify={addNotification}
              onNavigateChange={(view) => { if (canAccessTab(view)) setActiveTab(view); }}
            />
          )}

            </main>
          </div>
        </section>
      </div>

      <nav className="md:hidden relative z-40 shrink-0 h-16 border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl px-1.5 pb-[env(safe-area-inset-bottom)]" aria-label="Navigasi cepat">
        <div className="h-full flex items-center justify-around">
          {visibleNavItems.slice(0, 5).map(item => { const Icon=item.icon; const active=activeTab===item.id; return <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} className={`relative min-w-0 flex-1 h-full flex flex-col items-center justify-center gap-1 text-[8px] font-semibold ${active ? 'text-emerald-300' : 'text-slate-600'}`}>{active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,.8)]" />}<Icon className="w-4 h-4" /><span className="truncate max-w-16">{item.short}</span></button>; })}
          <button type="button" onClick={() => setMobileNavOpen(true)} className="min-w-0 flex-1 h-full flex flex-col items-center justify-center gap-1 text-[8px] font-semibold text-slate-600"><Menu className="w-4 h-4" /><span>Menu</span></button>
        </div>
      </nav>

      {/* Premium Toast Notifications Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none" id="toast-container">
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
              bgClass = "bg-amber-50 border-amber-200 text-amber-850";
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
                  className="text-slate-400 hover:text-slate-650 transition-colors shrink-0 p-0.5 rounded-full hover:bg-black/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {/* SIFP humble compliance footer */}
      <footer className="bg-slate-900 border-t border-slate-950 text-slate-500 py-3 text-center text-xs shrink-0" id="sifp-footer">
        <p>&copy; 2026 Dinas Kesehatan Kota Parepare</p>
      </footer>
    </div>
  );
}
