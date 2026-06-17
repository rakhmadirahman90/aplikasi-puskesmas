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

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');

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
  
  // Reactive state loaded from localStorage as fallback
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

  // Load from LocalStorage
  useEffect(() => {
    try {
      const savedStocks = localStorage.getItem(LOCAL_STORAGE_KEY_STOCKS);
      if (savedStocks) setStocks(JSON.parse(savedStocks));

      const savedReceipts = localStorage.getItem(LOCAL_STORAGE_KEY_RECEIPTS);
      if (savedReceipts) setReceipts(JSON.parse(savedReceipts));

      const savedAmpras = localStorage.getItem(LOCAL_STORAGE_KEY_AMPRAS);
      if (savedAmpras) setAmpras(JSON.parse(savedAmpras));

      const savedPrescriptions = localStorage.getItem(LOCAL_STORAGE_KEY_PRESCRIPTIONS);
      if (savedPrescriptions) setPrescriptions(JSON.parse(savedPrescriptions));

      const savedUsages = localStorage.getItem(LOCAL_STORAGE_KEY_USAGES);
      if (savedUsages) setUsages(JSON.parse(savedUsages));

      const savedRole = localStorage.getItem(LOCAL_STORAGE_KEY_ROLE);
      if (savedRole) {
        const parsed = JSON.parse(savedRole);
        setActiveRole(parsed.role);
        setActiveUnitId(parsed.unitId);
        setUserName(parsed.userName);
      }

      const savedDate = localStorage.getItem(LOCAL_STORAGE_KEY_DATE);
      if (savedDate) setSystemDate(JSON.parse(savedDate));
    } catch (e) {
      console.warn("Could not reload saved system states", e);
    }
  }, []);

  // Save to LocalStorage helper
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
  const handleSetSystemDate = (date: string) => {
    setSystemDate(date);
    saveState(LOCAL_STORAGE_KEY_DATE, date);
  };

  // Reset SIFP database triggers
  const handleResetStorage = () => {
    if (window.confirm("Beneran ingin menyetel ulang database simulasi farmasi ke default?")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY_STOCKS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_RECEIPTS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_AMPRAS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_PRESCRIPTIONS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_USAGES);
      localStorage.removeItem(LOCAL_STORAGE_KEY_ROLE);
      localStorage.removeItem(LOCAL_STORAGE_KEY_DATE);

      // Re-trigger states
      setStocks(INITIAL_STOCKS);
      setReceipts(INITIAL_RECEIPTS);
      setAmpras(INITIAL_AMPRAS);
      setPrescriptions(INITIAL_PRESCRIPTIONS);
      setUsages(INITIAL_USAGES);
      setSystemDate('2026-06-17');
      setActiveRole('gudang');
      setActiveUnitId('pustu');
      setUserName('Andi Sukri, A.Md.Farm');
      addNotification('success', "Database farmasi puskesmas berhasil dikalibrasi ke sediaan awal!");
    }
  };

  // RECEIPT EVENTS
  const handleAddReceipt = (newReceipt: Receipt) => {
    const updated = [newReceipt, ...receipts];
    setReceipts(updated);
    saveState(LOCAL_STORAGE_KEY_RECEIPTS, updated);
  };

  // APJ confirms Receipt and actually stocks increase in Gudang
  const handleVerifyReceipt = (receiptId: string, apjName: string) => {
    // 1. Mark receipt verified
    const updatedReceipts = receipts.map(r => {
      if (r.id === receiptId) {
        return { ...r, verifiedByAPJ: true, apjName };
      }
      return r;
    });

    // 2. Adjust Stocks Gudang (add items and batch quantities)
    const receiptToVerify = receipts.find(r => r.id === receiptId);
    if (receiptToVerify) {
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
          source: item.source
        });

        currentStocks['gudang'][item.medicineId] = currentItem;
      });

      setStocks(currentStocks);
      saveState(LOCAL_STORAGE_KEY_STOCKS, currentStocks);
    }

    setReceipts(updatedReceipts);
    saveState(LOCAL_STORAGE_KEY_RECEIPTS, updatedReceipts);
  };

  // AMPRA EVENTS
  const handleCreateAmpra = (newAmpra: Ampra) => {
    const updated = [newAmpra, ...ampras];
    setAmpras(updated);
    saveState(LOCAL_STORAGE_KEY_AMPRAS, updated);
  };

  // Life Cycle Updater for Ampra (Gudang allocating or APJ final approval)
  const handleUpdateAmpraStatus = (ampraId: string, updates: Partial<Ampra>) => {
    const targetAmpra = ampras.find(a => a.id === ampraId);
    if (!targetAmpra) return;

    const updatedAmpras = ampras.map(a => {
      if (a.id === ampraId) {
        return { ...a, ...updates };
      }
      return a;
    });

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

      setStocks(currentStocks);
      saveState(LOCAL_STORAGE_KEY_STOCKS, currentStocks);
    }

    setAmpras(updatedAmpras);
    saveState(LOCAL_STORAGE_KEY_AMPRAS, updatedAmpras);
  };

  // PRESCRIPTION CHECKOUT IN APOTEK
  const handleAddPrescription = (newRx: Prescription) => {
    // 1. Add record
    const updated = [newRx, ...prescriptions];
    setPrescriptions(updated);
    saveState(LOCAL_STORAGE_KEY_PRESCRIPTIONS, updated);

    // 2. Reduce Apotheke Stocks instantly
    const currentStocks = JSON.parse(JSON.stringify(stocks));
    newRx.items.forEach(item => {
      if (!currentStocks['ruang_farmasi']) currentStocks['ruang_farmasi'] = {};
      const rfObj = currentStocks['ruang_farmasi'][item.medicineId] || { total: 0 };
      
      rfObj.total = Math.max(0, rfObj.total - item.qty);
      currentStocks['ruang_farmasi'][item.medicineId] = rfObj;
    });

    setStocks(currentStocks);
    saveState(LOCAL_STORAGE_KEY_STOCKS, currentStocks);
  };

  // DAILY SATELLITE USAGE RECORD
  const handleAddUsage = (newUsage: DailyUsage) => {
    // 1. Add use record
    const updated = [newUsage, ...usages];
    setUsages(updated);
    saveState(LOCAL_STORAGE_KEY_USAGES, updated);

    // 2. Reduce corresponding satellite unit stocks instantly
    const currentStocks = JSON.parse(JSON.stringify(stocks));
    const targetUnit = newUsage.unitId;

    newUsage.items.forEach(item => {
      if (!currentStocks[targetUnit]) currentStocks[targetUnit] = {};
      const unitObj = currentStocks[targetUnit][item.medicineId] || { total: 0 };

      unitObj.total = Math.max(0, unitObj.total - item.qtyUsed);
      currentStocks[targetUnit][item.medicineId] = unitObj;
    });

    setStocks(currentStocks);
    saveState(LOCAL_STORAGE_KEY_STOCKS, currentStocks);
  };

  return (
    <div className="h-screen flex flex-col font-sans bg-slate-50 text-slate-800 overflow-hidden" id="main-app">
      
      {/* SIFP UPPER ACTION CONTROLLER NAVBAR */}
      <header className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white shadow-md border-b border-emerald-950 z-30 shrink-0" id="header-sifp">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          
          {/* Logo Brand SIFP */}
          <div className="flex items-center gap-2.5">
            <div className="bg-white p-1.5 rounded-xl shadow-inner text-emerald-800">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-base tracking-wide flex items-center gap-1.5 leading-none">
                SIM-Farmasi
                <span className="text-[10px] bg-emerald-600 px-1.5 py-0.5 rounded font-mono font-bold tracking-normal uppercase">
                  Puskesmas
                </span>
              </h1>
              <p className="text-[10px] text-emerald-200 mt-0.5">Kota Parepare &bull; Verifikasi Terintegrasi</p>
            </div>
          </div>

          {/* Active Sim Roles quick picker */}
          <div className="flex flex-wrap items-center gap-2" id="sim-role-selectors">
            <span className="text-[10px] text-slate-350 font-bold uppercase tracking-wide mr-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Ganti Sim-Role:
            </span>
            
            <button
              onClick={() => handleSwitchRole('gudang')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                activeRole === 'gudang' 
                  ? 'bg-amber-500 text-slate-950 shadow-md font-display' 
                  : 'bg-emerald-800/40 text-emerald-150 hover:bg-emerald-800/80 hover:text-white'
              }`}
              id="role-gudang-btn"
            >
              Gudang
            </button>
            <button
              onClick={() => handleSwitchRole('farmasi')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                activeRole === 'farmasi' 
                  ? 'bg-emerald-500 text-white shadow-md font-display' 
                  : 'bg-emerald-800/40 text-emerald-150 hover:bg-emerald-800/80 hover:text-white'
              }`}
              id="role-farmasi-btn"
            >
              Ruang Farmasi
            </button>
            <button
              onClick={() => handleSetSystemDate(systemDate)} // dummy click to trigger reload
              className="hidden"
            />
            <button
              onClick={() => handleSwitchRole('unit', activeUnitId)}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                activeRole === 'unit' 
                  ? 'bg-indigo-600 text-white shadow-md font-display' 
                  : 'bg-emerald-800/40 text-emerald-150 hover:bg-emerald-800/80 hover:text-white'
              }`}
              id="role-unit-btn"
            >
              Pustu/Internal
            </button>
            <button
              onClick={() => handleSwitchRole('apj')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                activeRole === 'apj' 
                  ? 'bg-blue-600 text-white shadow-md font-display' 
                  : 'bg-emerald-800/40 text-emerald-150 hover:bg-emerald-800/80 hover:text-white'
              }`}
              id="role-apj-btn"
            >
              APJ (Apoteker)
            </button>

            {/* Calibration hard reset button */}
            <button
              onClick={handleResetStorage}
              title="Setel ulang data ke bawaan pabrik"
              className="ml-3 p-1.5 duration-150 rounded bg-slate-800 text-slate-300 hover:text-red-400 border border-slate-750"
              id="reset-simulation-system"
            >
              <RefreshCw className="w-3.5 h-3.5" />
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
              systemDate={systemDate}
              onNotify={addNotification}
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
              systemDate={systemDate}
              onNotify={addNotification}
            />
          )}

          {activeTab === 'apotek' && (
            <ApotekPasienView
              medicines={medicines}
              prescriptions={prescriptions}
              stocks={stocks}
              onAddPrescription={handleAddPrescription}
              systemDate={systemDate}
              onNotify={addNotification}
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
              systemDate={systemDate}
              onNotify={addNotification}
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
