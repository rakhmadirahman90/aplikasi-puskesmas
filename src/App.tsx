/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Medicine, StockStore, Receipt, Ampra, Prescription, DailyUsage, Disposal, UnitInfo } from './types';
import {
  INITIAL_MEDICINES,
  INITIAL_UNITS,
  INITIAL_STOCKS,
  INITIAL_RECEIPTS,
  INITIAL_AMPRAS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_USAGES
} from './mockData';
import { db, seedDatabaseIfEmpty, resetDatabaseFirestore, onSnapshot, collection, doc, setDoc, deleteDoc } from './firebase';

// Subcomponents
import DashboardView from './components/DashboardView';
import PenerimaanGudangView from './components/PenerimaanGudangView';
import AmpraGudangView from './components/AmpraGudangView';
import ApotekPasienView from './components/ApotekPasienView';
import UsageUnitView from './components/UsageUnitView';
import LaporanView from './components/LaporanView';

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
  RefreshCw,
  Settings,
  Palette,
  ShieldCheck,
  Truck,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';

const LOCAL_STORAGE_KEY_STOCKS = 'sifp_stocks_store';
const LOCAL_STORAGE_KEY_RECEIPTS = 'sifp_receipts_store';
const LOCAL_STORAGE_KEY_AMPRAS = 'sifp_ampras_store';
const LOCAL_STORAGE_KEY_PRESCRIPTIONS = 'sifp_prescriptions_store';
const LOCAL_STORAGE_KEY_USAGES = 'sifp_usages_store';
const LOCAL_STORAGE_KEY_ROLE = 'sifp_active_role_store';
const LOCAL_STORAGE_KEY_DATE = 'sifp_system_date_store';
const LOCAL_STORAGE_KEY_THEME = 'sifp_selected_theme_store';

interface ThemeInfo {
  id: string;
  name: string;
  desc: string;
  colorValue: string;
}

const THEMES_LIST: ThemeInfo[] = [
  { id: 'emerald', name: 'Emerald', desc: 'Hijau Sehat Puskesmas', colorValue: '#10b981' },
  { id: 'blue', name: 'Sapphire', desc: 'Biru Apotek Modern', colorValue: '#3b82f6' },
  { id: 'teal', name: 'Herbal Teal', desc: 'Toska Mint Alami', colorValue: '#14b8a6' },
  { id: 'violet', name: 'Amethyst', desc: 'Ungu Premium Spesialis', colorValue: '#8b5cf6' },
  { id: 'slate', name: 'Carbon Steel', desc: 'Professional Modern Steel', colorValue: '#64748b' }
];

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
  const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

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
  const [medicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [units] = useState<UnitInfo[]>(INITIAL_UNITS);
  
  // Reactive state loaded from Firestore in real-time
  const [stocks, setStocks] = useState<StockStore>(INITIAL_STOCKS);
  const [receipts, setReceipts] = useState<Receipt[]>(INITIAL_RECEIPTS);
  const [ampras, setAmpras] = useState<Ampra[]>(INITIAL_AMPRAS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [usages, setUsages] = useState<DailyUsage[]>(INITIAL_USAGES);

  // Expiration calibrators
  const [systemDate, setSystemDate] = useState<string>('2026-06-17');

  // Authenticated Role Simulation
  const [activeRole, setActiveRole] = useState<'apj' | 'gudang' | 'farmasi' | 'unit'>('gudang');
  const [activeUnitId, setActiveUnitId] = useState<string>('pustu');
  const [userName, setUserName] = useState<string>('Andi Sukri, A.Md.Farm');

  // Load Sim Role from LocalStorage (for presentation preference)
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem(LOCAL_STORAGE_KEY_ROLE);
      if (savedRole) {
        const parsed = JSON.parse(savedRole);
        setActiveRole(parsed.role);
        setActiveUnitId(parsed.unitId);
        setUserName(parsed.userName);
      }
    } catch (e) {
      console.warn("Could not reload saved simulation states", e);
    }
  }, []);

  // Set up Firebase Firestore Real-Time Subscriptions
  useEffect(() => {
    let unsubscribes: Array<() => void> = [];

    const setupDatabaseSubscription = async () => {
      // Warm up / seed empty database first
      await seedDatabaseIfEmpty();

      // 1. Real-time system config
      const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.systemDate) setSystemDate(data.systemDate);
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
    };

    setupDatabaseSubscription().catch(e => {
      console.error("Firebase database synchronization failure:", e);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  // Save to LocalStorage helper for role preference
  const saveState = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Local storage save error", e);
    }
  };

  // Switch role helper
  const handleSwitchRole = (role: 'apj' | 'gudang' | 'farmasi' | 'unit', unitId = 'pustu') => {
    setActiveRole(role);
    setActiveUnitId(unitId);
    
    let defaultUser = 'Petugas';
    if (role === 'apj') {
      defaultUser = 'Ami Rahmawati, S.Farm, Apt';
    } else if (role === 'gudang') {
      defaultUser = 'Andi Sukri, A.Md.Farm';
    } else if (role === 'farmasi') {
      defaultUser = 'Hj. Syarifah, S.Farm., Apt';
    } else {
      const u = INITIAL_UNITS.find(item => item.id === unitId);
      defaultUser = u ? u.manager : 'Petugas Unit Kelompok';
    }
    
    setUserName(defaultUser);
    saveState(LOCAL_STORAGE_KEY_ROLE, { role, unitId, userName: defaultUser });
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

  // Reset SIFP database triggers
  const handleResetStorage = async () => {
    if (window.confirm("Beneran ingin menyetel ulang database simulasi farmasi ke default?")) {
      try {
        await resetDatabaseFirestore();
        addNotification('success', "Database simulasi berhasil disinkronkan kembali ke sediaan awal secara real time!");
      } catch (e) {
        console.error(e);
        addNotification('error', "Gagal melakukan kalibrasi database.");
      }
    }
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

  return (
    <div className="h-screen flex flex-col font-sans bg-slate-50 text-slate-800 overflow-hidden" id="main-app">
      
      {/* SIFP UPPER ACTION CONTROLLER NAVBAR */}
      <header className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white shadow-sm border-b border-emerald-950/40 z-30 shrink-0" id="header-sifp">
        <div className="max-w-7xl mx-auto px-3 py-1.5 md:px-4 md:py-2.5 flex flex-col gap-1.5" id="header-sifp-inner">
          
          {/* Main Top Bar: Logo & Micro-widgets */}
          <div className="flex items-center justify-between gap-2.5 w-full" id="header-top-row">
            
            {/* Supabase Banner */}
            {!isSupabaseConfigured && (
              <div className="absolute top-16 left-0 right-0 z-50 mx-auto max-w-2xl bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 shadow-lg rounded">
                <div className="flex gap-2">
                  <Database className="w-5 h-5 text-amber-600 mt-1" />
                  <div>
                    <h3 className="font-bold text-sm">Supabase Belum Dikonfigurasi</h3>
                    <p className="text-xs mt-1">Anda sekarang menggunakan Supabase (sebelumnya Firebase). Anda harus menambahkan variable lingkungan berikut di menu settings (Project Settings):</p>
                    <ul className="list-disc pl-5 text-xs font-mono mt-1 mb-2">
                      <li>VITE_SUPABASE_URL</li>
                      <li>VITE_SUPABASE_ANON_KEY</li>
                    </ul>
                    <p className="text-xs">Juga jalankan SQL yang ada di <code className="bg-amber-200 px-1 rounded">setup-supabase.sql</code> melalui SQL Editor di Supabase Dashboard Anda. Saat ini aplikasi tidak akan sinkron dengan server.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Logo Brand SIFP */}
            <div className="flex items-center gap-2">
              <div className="bg-white/95 p-1 rounded-lg text-emerald-800 shadow-sm shrink-0">
                <HeartPulse className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <h1 className="font-display font-extrabold text-xs md:text-sm tracking-wide flex items-center gap-1.5 leading-none">
                  SIM-Farmasi
                  <span className="text-[8px] bg-emerald-600/95 text-white px-1 py-0.2 rounded font-mono font-bold tracking-normal uppercase shrink-0">
                    Puskesmas
                  </span>
                </h1>
                <p className="text-[9px] text-emerald-250 leading-none mt-0.5 font-sans whitespace-nowrap">Parepare &bull; Verifikasi Terintegrasi</p>
              </div>
            </div>

            {/* Right widgets: Real-time clock & theme selectors (compact design) */}
            <div className="flex items-center gap-1.5 sm:gap-2" id="header-right-widgets">
              
              {/* Real-time Day/Time Header Widget inside glassmorphic badge */}
              <div className="bg-black/20 backdrop-blur-xs px-2 py-1 rounded-lg border border-white/5 flex items-center gap-1 text-white/95 shadow-2xs" id="header-clock-widget">
                <Calendar className="w-3 h-3 text-emerald-400 shrink-0 hidden xs:block" />
                <div className="text-left leading-tight">
                  <span className="block text-[7px] uppercase font-mono font-extrabold text-emerald-350 tracking-wider hidden sm:block">Waktu SIFP Real-Time</span>
                  <span className="text-[9.5px] font-mono font-bold whitespace-nowrap text-slate-100">
                    {(() => {
                      try {
                        const dateParts = systemDate.split('-');
                        if (dateParts.length === 3) {
                          const year = parseInt(dateParts[0]);
                          const month = parseInt(dateParts[1]) - 1;
                          const day = parseInt(dateParts[2]);
                          const combinedDate = new Date(year, month, day, currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds());
                          
                          const dayName = INDONESIAN_DAYS[combinedDate.getDay()] || 'Hari';
                          const monthName = INDONESIAN_MONTHS[combinedDate.getMonth()] || 'Bulan';
                          
                          const pad = (num: number) => String(num).padStart(2, '0');
                          const timeStr = `${pad(combinedDate.getHours())}:${pad(combinedDate.getMinutes())}:${pad(combinedDate.getSeconds())}`;
                          
                          return (
                            <span className="inline-flex">
                              <span className="sm:hidden">{dayName} &bull; {timeStr}</span>
                              <span className="hidden sm:inline">{dayName}, {day} {monthName} {year} &bull; {timeStr} WIB</span>
                            </span>
                          );
                        }
                      } catch (e) {
                        console.error(e);
                      }
                      return systemDate;
                    })()}
                  </span>
                </div>
              </div>

              {/* Compact Professional Theme Selector in Header */}
              <div className="bg-black/20 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-white/5 flex items-center gap-1.5 text-white/95 shadow-2xs h-[24px] md:h-[28px]" id="header-theme-selector">
                <Palette className="w-3 h-3 text-emerald-400 shrink-0" />
                <div className="text-left hidden lg:block leading-none">
                  <span className="block text-[7px] uppercase font-mono font-bold text-emerald-350 tracking-wider">Tema</span>
                  <span className="text-[9px] font-sans font-bold text-slate-100 leading-none">
                    {THEMES_LIST.find(t => t.id === theme)?.name}
                  </span>
                </div>
                <div className="flex gap-1 items-center">
                  {THEMES_LIST.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        addNotification('success', `Tema disesuaikan ke: ${t.name}`);
                      }}
                      title={`${t.name} • ${t.desc}`}
                      type="button"
                      className={`w-3 h-3 rounded-full border border-white/20 flex items-center justify-center transition-all cursor-pointer ${
                        theme === t.id 
                          ? 'scale-110 ring-1 ring-white shadow-xs' 
                          : 'hover:scale-105 hover:border-white/50'
                      }`}
                      style={{ backgroundColor: t.colorValue }}
                      id={`theme-header-btn-${t.id}`}
                    >
                      {theme === t.id && (
                        <span className="w-0.5 h-0.5 rounded-full bg-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Sub-bar: Ganti Sim Role Selector (Scrollable, ultra-thin, borderless spacing) */}
          <div className="flex items-center justify-between border-t border-white/10 pt-1.5 mt-0.5" id="header-bottom-row">
            
            <div className="flex items-center gap-1.5 overflow-hidden w-full flex-1" id="role-scroll-container">
              {/* Optional labels based on responsive widths */}
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-200 font-bold uppercase tracking-wider mr-1 shrink-0">
                <Users className="w-3 h-3" /> Ganti Sim-Role:
              </div>
              <div className="sm:hidden flex items-center text-emerald-200 shrink-0 mr-1.5" title="Ganti Sim-Role">
                <Users className="w-3.5 h-3.5" />
              </div>
              
              {/* Horizontal slider lane on ultra-compact mobile views */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 flex-1 select-none pr-3" id="role-scroll-lane">
                <button
                  onClick={() => handleSwitchRole('gudang')}
                  className={`px-2 py-0.5 text-[10px] sm:text-xs rounded font-bold transition-all whitespace-nowrap ${
                    activeRole === 'gudang' 
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-display' 
                      : 'bg-emerald-800/25 text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                  id="role-gudang-btn"
                >
                  Gudang
                </button>
                <button
                  onClick={() => handleSwitchRole('farmasi')}
                  className={`px-2 py-0.5 text-[10px] sm:text-xs rounded font-bold transition-all whitespace-nowrap ${
                    activeRole === 'farmasi' 
                      ? 'bg-emerald-500 text-white shadow-xs font-display' 
                      : 'bg-emerald-800/25 text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                  id="role-farmasi-btn"
                >
                  Ruang Farmasi
                </button>
                <button
                  onClick={() => handleSwitchRole('unit', activeUnitId)}
                  className={`px-2 py-0.5 text-[10px] sm:text-xs rounded font-bold transition-all whitespace-nowrap ${
                    activeRole === 'unit' 
                      ? 'bg-indigo-600 text-white shadow-xs font-display' 
                      : 'bg-emerald-800/25 text-emerald-105 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                  id="role-unit-btn"
                >
                  Pustu/Internal
                </button>
                <button
                  onClick={() => handleSwitchRole('apj')}
                  className={`px-2 py-0.5 text-[10px] sm:text-xs rounded font-bold transition-all whitespace-nowrap ${
                    activeRole === 'apj' 
                      ? 'bg-blue-600 text-white shadow-xs font-display' 
                      : 'bg-emerald-800/25 text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                  id="role-apj-btn"
                >
                  APJ (Apoteker)
                </button>
              </div>
            </div>

            {/* Sim Reset action */}
            <button
              onClick={handleResetStorage}
              title="Setel ulang data ke bawaan pabrik"
              className="p-1 duration-150 rounded bg-slate-800/30 text-slate-300 hover:text-red-400 border border-white/5 hover:bg-slate-800/80 shrink-0"
              id="reset-simulation-system"
            >
              <RefreshCw className="w-3 h-3" />
            </button>

          </div>

        </div>
      </header>

      {/* SCROLLABLE BODY AREA */}
      <div className="flex-1 overflow-y-auto min-h-0" id="scrollable-content-area">
        {/* BODY SUB-SYSTEM CONTAINER */}
        <div className="max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6" id="app-body-layout">
        
        {/* Navigation Sidebar */}
        <aside className="md:col-span-3 lg:col-span-2 space-y-3" id="navigation-sidebar">
          {/* Active Sim Identity Badge */}
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-xs border border-slate-200 flex flex-row md:flex-col justify-between items-center md:text-center gap-2" id="identity-banner">
            <div className="text-left md:text-center space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block">Login Aktif</span>
              <p className="font-bold text-slate-800 text-xs md:text-sm leading-tight">{userName}</p>
            </div>
            <span className="inline-block px-2.5 py-1 rounded font-mono text-[9px] bg-slate-100 text-slate-500 font-bold uppercase shrink-0">
              {activeRole === 'unit' ? `UNIT (${activeUnitId})` : activeRole.toUpperCase()}
            </span>
          </div>

          <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible space-x-1 md:space-x-0 md:space-y-1 bg-white p-1.5 md:p-2 rounded-xl shadow-xs border border-slate-200 scrollbar-none whitespace-nowrap" id="sidebar-nav">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`shrink-0 flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 text-xs font-semibold rounded-lg transition-all text-left ${
                activeTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-650 hover:bg-slate-50'
              }`}
              id="nav-dashboard"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" /> <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('receipts')}
              className={`shrink-0 flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 text-xs font-semibold rounded-lg transition-all text-left ${
                activeTab === 'receipts' ? 'bg-emerald-600 text-white' : 'text-slate-650 hover:bg-slate-50'
              }`}
              id="nav-receipts"
            >
              <Truck className="w-4 h-4 shrink-0" /> <span>Penerimaan Gudang</span>
            </button>
            <button
              onClick={() => setActiveTab('ampra')}
              className={`shrink-0 flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 text-xs font-semibold rounded-lg transition-all text-left ${
                activeTab === 'ampra' ? 'bg-emerald-600 text-white' : 'text-slate-650 hover:bg-slate-50'
              }`}
              id="nav-ampra"
            >
              <ArrowRightLeft className="w-4 h-4 shrink-0" /> <span>Ampra Unit</span>
            </button>
            <button
              onClick={() => setActiveTab('apotek')}
              className={`shrink-0 flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 text-xs font-semibold rounded-lg transition-all text-left ${
                activeTab === 'apotek' ? 'bg-emerald-600 text-white' : 'text-slate-650 hover:bg-slate-50'
              }`}
              id="nav-apotek"
            >
              <Pill className="w-4 h-4 shrink-0" /> <span>Apotek Resep</span>
            </button>
            <button
              onClick={() => setActiveTab('satellites')}
              className={`shrink-0 flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 text-xs font-semibold rounded-lg transition-all text-left ${
                activeTab === 'satellites' ? 'bg-emerald-600 text-white' : 'text-slate-650 hover:bg-slate-50'
              }`}
              id="nav-satellites"
            >
              <Database className="w-4 h-4 shrink-0" /> <span>Terminal Unit & Pustu</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`shrink-0 flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 text-xs font-semibold rounded-lg transition-all md:border-t md:border-slate-100 md:pt-2 text-left ${
                activeTab === 'reports' ? 'bg-emerald-600 text-white shadow' : 'text-slate-650 hover:bg-slate-50'
              }`}
              id="nav-reports"
            >
              <FileText className="w-4 h-4 shrink-0" /> <span>Laporan & Audit</span>
            </button>
          </nav>
        </aside>

        {/* View content pane */}
        <main className="md:col-span-9 lg:col-span-10 min-w-0 w-full mb-12 space-y-6" id="main-content-pane">
          
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
              onNavigateChange={(view) => setActiveTab(view)}
            />
          )}

          {activeTab === 'receipts' && (
            <PenerimaanGudangView
              medicines={medicines}
              receipts={receipts}
              activeRole={activeRole}
              userName={userName}
              onAddReceipt={handleAddReceipt}
              onVerifyReceipt={handleVerifyReceipt}
              onDeleteReceipt={handleDeleteReceipt}
              onUpdateReceipt={handleUpdateReceipt}
              systemDate={systemDate}
              onNotify={addNotification}
              onNavigateChange={(view) => setActiveTab(view)}
            />
          )}

          {activeTab === 'ampra' && (
            <AmpraGudangView
              medicines={medicines}
              units={units}
              ampras={ampras}
              stocks={stocks}
              activeRole={activeRole}
              activeUnitId={activeUnitId}
              userName={userName}
              onCreateAmpra={handleCreateAmpra}
              onUpdateAmpraStatus={handleUpdateAmpraStatus}
              onDeleteAmpra={handleDeleteAmpra}
              systemDate={systemDate}
              onNotify={addNotification}
              onNavigateChange={(view) => setActiveTab(view)}
            />
          )}

          {activeTab === 'apotek' && (
            <ApotekPasienView
              medicines={medicines}
              prescriptions={prescriptions}
              stocks={stocks}
              onAddPrescription={handleAddPrescription}
              onDeletePrescription={handleDeletePrescription}
              onUpdatePrescription={handleUpdatePrescription}
              activeRole={activeRole}
              systemDate={systemDate}
              onNotify={addNotification}
              onNavigateChange={(view) => setActiveTab(view)}
            />
          )}

          {activeTab === 'satellites' && (
            <UsageUnitView
              medicines={medicines}
              units={units}
              stocks={stocks}
              usages={usages}
              activeRole={activeRole}
              activeUnitId={activeUnitId}
              onSetSimulationUnit={(uid) => handleSwitchRole('unit', uid)}
              onAddUsage={handleAddUsage}
              onDeleteUsage={handleDeleteUsage}
              onUpdateUsage={handleUpdateUsage}
              systemDate={systemDate}
              onNotify={addNotification}
              onNavigateChange={(view) => setActiveTab(view)}
            />
          )}

          {activeTab === 'reports' && (
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
              onNavigateChange={(view) => setActiveTab(view)}
            />
          )}

        </main>
      </div>
      </div>

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
      <footer className="bg-slate-900 border-t border-slate-950 text-slate-500 py-4 text-center text-[11px] shrink-0" id="sifp-footer">
        <p>&copy; 2026 Dinas Kesehatan Kota Parepare &bull; SIFP Terintegrasi v2.4</p>
        <p className="mt-0.5 text-slate-650">Bebas Pajak &amp; Dukungan Penuh Berbantuan AI Studio</p>
      </footer>
    </div>
  );
}
