/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Medicine, StockStore, Ampra, Prescription, DailyUsage } from '../types';
import { AlertTriangle, Package, FileText, ClipboardList, TrendingUp, Calendar, Zap, Bell, CheckCircle } from 'lucide-react';

interface DashboardViewProps {
  medicines: Medicine[];
  stocks: StockStore;
  ampras: Ampra[];
  prescriptions: Prescription[];
  usages: DailyUsage[];
  systemDate: string;
  onSetSystemDate: (date: string) => void;
  onNavigateChange: (view: string) => void;
}

export default function DashboardView({
  medicines,
  stocks,
  ampras,
  prescriptions,
  usages,
  systemDate,
  onSetSystemDate,
  onNavigateChange,
}: DashboardViewProps) {
  const [selectedChartPeriod, setSelectedChartPeriod] = useState<'all' | 'today' | 'month'>('all');

  // Helper to calculate months difference
  const getMonthsDiff = (targetDate: string, baseDate: string) => {
    const t = new Date(targetDate);
    const b = new Date(baseDate);
    if (isNaN(t.getTime()) || isNaN(b.getTime())) return 999;
    return (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth());
  };

  // Expiration scanning in Gudang
  const expiryAlerts = useMemo(() => {
    const red: { medicine: Medicine; batchNo: string; expDate: string; qty: number; monthsLeft: number }[] = [];
    const yellow: { medicine: Medicine; batchNo: string; expDate: string; qty: number; monthsLeft: number }[] = [];

    const gudangStocks = stocks['gudang'] || {};
    Object.entries(gudangStocks).forEach(([medId, stockData]) => {
      const med = medicines.find(m => m.id === medId);
      if (!med || !stockData?.batches) return;

      stockData.batches.forEach(batch => {
        const diff = getMonthsDiff(batch.expDate, systemDate);
        if (diff <= 6) {
          red.push({ medicine: med, batchNo: batch.batchNo, expDate: batch.expDate, qty: batch.quantity, monthsLeft: diff });
        } else if (diff >= 7 && diff <= 12) {
          yellow.push({ medicine: med, batchNo: batch.batchNo, expDate: batch.expDate, qty: batch.quantity, monthsLeft: diff });
        }
      });
    });

    // Sort by near expiration
    red.sort((a, b) => a.monthsLeft - b.monthsLeft);
    yellow.sort((a, b) => a.monthsLeft - b.monthsLeft);

    return { red, yellow };
  }, [medicines, stocks, systemDate]);

  // Overall statistics
  const metrics = useMemo(() => {
    let totalItemsInGudang = 0;
    let totalItemsInApotek = 0;
    let totalItemsInUnits = 0;

    Object.entries(stocks).forEach(([unitId, unitStock]) => {
      Object.values(unitStock).forEach(stock => {
        if (unitId === 'gudang') {
          totalItemsInGudang += stock.total;
        } else if (unitId === 'ruang_farmasi') {
          totalItemsInApotek += stock.total;
        } else {
          totalItemsInUnits += stock.total;
        }
      });
    });

    const pendingAmpra = ampras.filter(a => a.status === 'Diajukan' || a.status === 'Disiapkan').length;
    const todayPrescriptions = prescriptions.filter(p => p.date === systemDate).length;

    return {
      totalItemsInGudang,
      totalItemsInApotek,
      totalItemsInUnits,
      pendingAmpra,
      todayPrescriptions
    };
  }, [stocks, ampras, prescriptions, systemDate]);

  // Top Medicines Usage calculation
  const topMedicines = useMemo(() => {
    const usageCounts: { [medId: string]: number } = {};

    // From official usages inputted
    usages.forEach(u => {
      // Filter based on period choice
      const isMatch = selectedChartPeriod === 'all' || 
                      (selectedChartPeriod === 'today' && u.date === systemDate) ||
                      (selectedChartPeriod === 'month' && u.date.substring(0, 7) === systemDate.substring(0, 7));

      if (isMatch) {
        u.items.forEach(item => {
          usageCounts[item.medicineId] = (usageCounts[item.medicineId] || 0) + item.qtyUsed;
        });
      }
    });

    // Also count patient prescriptions (for apotek)
    prescriptions.forEach(p => {
      const isMatch = selectedChartPeriod === 'all' || 
                      (selectedChartPeriod === 'today' && p.date === systemDate) ||
                      (selectedChartPeriod === 'month' && p.date.substring(0, 7) === systemDate.substring(0, 7));

      if (isMatch) {
        p.items.forEach(item => {
          usageCounts[item.medicineId] = (usageCounts[item.medicineId] || 0) + item.qty;
        });
      }
    });

    return Object.entries(usageCounts)
      .map(([medId, qty]) => {
        const med = medicines.find(m => m.id === medId);
        return {
          id: medId,
          name: med ? med.name : 'Unknown Medicine',
          qty,
          type: med ? med.type : 'generik',
          isNarkotikaPsikotropika: med ? med.isNarkotikaPsikotropika : false,
        };
      })
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5); // top 5
  }, [usages, prescriptions, medicines, selectedChartPeriod, systemDate]);

  // Max value for simple CSS bar chart
  const maxUsageQty = useMemo(() => {
    if (topMedicines.length === 0) return 1;
    return Math.max(...topMedicines.map(m => m.qty));
  }, [topMedicines]);

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Simulation/Date Customization Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4" id="sim-header">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-slate-800 text-sm">Tanggal Aktif Sistem (Simulasi)</h3>
            <p className="text-xs text-slate-500">Mempengaruhi evaluasi masa kadaluarsa & pencatatan harian</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={systemDate}
            onChange={(e) => onSetSystemDate(e.target.value)}
            className="border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 rounded px-3 py-1.5 text-sm font-medium bg-slate-50 text-slate-700"
            id="system-date-picker"
          />
          <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
            Hari Ini
          </span>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between" id="stat-gudang">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Stok Gudang Utama</span>
            <h2 className="text-2xl font-bold text-slate-800 font-display">
              {metrics.totalItemsInGudang.toLocaleString('id-ID')}
            </h2>
            <p className="text-xs text-slate-400">Pcs sediaan farmasi</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between" id="stat-apotek">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Stok Ruang Farmasi</span>
            <h2 className="text-2xl font-bold text-slate-800 font-display">
              {metrics.totalItemsInApotek.toLocaleString('id-ID')}
            </h2>
            <p className="text-xs text-slate-400">Sedia dilayani ke pasien</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between" id="stat-unit">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Stok di Unit & Pustu</span>
            <h2 className="text-2xl font-bold text-slate-800 font-display">
              {metrics.totalItemsInUnits.toLocaleString('id-ID')}
            </h2>
            <p className="text-xs text-slate-400">Cadangan di 9 sub-unit</p>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between" id="stat-pending">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Menunggu Verifikasi APJ</span>
            <h2 className="text-2xl font-bold text-amber-600 font-display">
              {metrics.pendingAmpra}
            </h2>
            <p className="text-xs text-slate-400">Pengajuan Ampra Aktif</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Bell className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-detail-grid">
        {/* Left Side: Alerts list & Date Control */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Expiration warning section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" id="exp-alerts-container">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-800 font-display">Peringatan Masa Kadaluarsa</h3>
              </div>
              <span className="text-xs text-slate-500">Gudang Utama</span>
            </div>

            <div className="p-5 space-y-5">
              
              {/* RED alerts (<= 6 Months) */}
              <div className="space-y-3" id="red-alerts-block">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 block animate-ping"></span>
                  <p className="text-sm font-bold text-red-600">Alaram Merah (Kadaluarsa &le; 6 Bulan)</p>
                </div>

                {expiryAlerts.red.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Tidak ada obat dalam kategori kritis (&le; 6 bulan)
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                    {expiryAlerts.red.map((item, idx) => (
                      <div key={idx} className="bg-red-50/70 border border-red-100 p-3 rounded-xl flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-slate-800">{item.medicine.name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>Batch: <span className="font-mono text-slate-700 font-medium">{item.batchNo}</span></span>
                            <span>Exp: <span className="text-red-600 font-medium">{item.expDate}</span></span>
                            <span>Sumber: <span className="bg-slate-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700">{item.medicine.unit}</span></span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-red-100 text-red-800 rounded">
                            {item.qty} pcs
                          </span>
                          <p className="text-[10px] text-red-700 font-bold mt-1">
                            {item.monthsLeft <= 0 ? 'Sudah Expired' : `${item.monthsLeft} bln lagi`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* YELLOW alerts (7 - 12 Months) */}
              <div className="space-y-3" id="yellow-alerts-block">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 block"></span>
                  <p className="text-sm font-bold text-amber-600">Alaram Kuning (Kadaluarsa 7 Bulan - 1 Tahun)</p>
                </div>

                {expiryAlerts.yellow.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Tidak ada obat dalam kategori peringatan (7bln - 1th)
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                    {expiryAlerts.yellow.map((item, idx) => (
                      <div key={idx} className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-slate-800">{item.medicine.name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>Batch: <span className="font-mono text-slate-700 font-medium">{item.batchNo}</span></span>
                            <span>Exp: <span className="text-amber-800 font-medium">{item.expDate}</span></span>
                            <span>Unit: <span className="bg-slate-200/80 px-1.5 py-0.5 rounded text-[10px] text-slate-700">{item.medicine.unit}</span></span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                            {item.qty} pcs
                          </span>
                          <p className="text-[10px] text-amber-700 font-medium mt-1">
                            {item.monthsLeft} bln lagi
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Quick Guides for Roles workflow */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4" id="guides-card">
            <h3 className="font-semibold text-slate-800 font-display flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" /> Alur Verifikasi Sesuai Jobdesk
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-700 mb-1">Gudang &rarr; Unit (Ampra)</p>
                <p className="leading-relaxed">Ketika Unit melakukan Ampra, petugas gudang menyiapkan, kartu stok terpotong, dan saat diverifikasi Apoteker (APJ), stok langsung masuk di Unit secara otomatis.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-700 mb-1">Pelayanan Resep Real-Time</p>
                <p className="leading-relaxed">Pembuatan resep mengurangi stok Ruang Farmasi langsung saat itu juga, mencatat data pasien sebagai backup resep untuk transparansi pencarian dokter.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Charts and Trends */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Top Medicines Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4" id="top-meds-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-slate-800 font-display">Obat Terbanyak Digunakan</h3>
              </div>
              
              {/* Period selector */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs" id="period-tabs">
                <button
                  onClick={() => setSelectedChartPeriod('all')}
                  className={`px-2 py-1 rounded-md font-medium transition-colors ${selectedChartPeriod === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setSelectedChartPeriod('today')}
                  className={`px-2 py-1 rounded-md font-medium transition-colors ${selectedChartPeriod === 'today' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => setSelectedChartPeriod('month')}
                  className={`px-2 py-1 rounded-md font-medium transition-colors ${selectedChartPeriod === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Bulan Ini
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400">Total volume pemakaian resep apotek ditambah log unit</p>

            {topMedicines.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-2">
                <Package className="w-10 h-10 text-slate-300" />
                <p>Belum ada data pemakaian dalam periode terpilih.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-2" id="chart-bars-list">
                {topMedicines.map((med, index) => {
                  const pct = Math.max(8, Math.round((med.qty / maxUsageQty) * 100));
                  return (
                    <div key={med.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-slate-700 truncate max-w-[70%]">
                          <span className="w-5 h-5 flex items-center justify-center bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                            #{index + 1}
                          </span>
                          <span className="truncate">{med.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-800">{med.qty}</span>
                          <span className="text-slate-400 text-[10px]">pcs</span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            med.isNarkotikaPsikotropika 
                              ? 'bg-amber-500' 
                              : med.type === 'paten' 
                                ? 'bg-blue-600' 
                                : 'bg-emerald-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{med.type === 'generik' ? 'Generik' : 'Paten'} {med.isNarkotikaPsikotropika && '• Napza'}</span>
                        <span>{pct}% Vol</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 justify-center text-[11px] text-slate-500 font-medium bg-slate-50 -mx-5 -mb-5 p-3 rounded-b-2xl">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-600 block"></span> Generik Biasa</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-600 block"></span> Paten Biasa</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 block"></span> Narkotika/Psikotropika</span>
            </div>
          </div>

          {/* Quick Stats overview of Active Patient Care */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4" id="recent-prescription-stats">
            <h3 className="font-semibold text-slate-800 font-display text-sm flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-blue-500" /> Pelayanan Resep Farmasi ({systemDate})
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xl font-bold text-slate-800 font-display">
                  {prescriptions.filter(p => p.date === systemDate).length}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Resep Hari Ini</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xl font-bold text-slate-800 font-display">
                  {prescriptions.filter(p => p.date === systemDate && p.type === 'Rawat Jalan').length}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Rawat Jalan</p>
              </div>
            </div>

            <button 
              onClick={() => onNavigateChange('apotek')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all block text-center"
            >
              Buka Layanan Apotek &rarr;
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
