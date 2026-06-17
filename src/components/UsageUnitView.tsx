/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Medicine, UnitInfo, StockStore, DailyUsage, DailyUsageItem } from '../types';
import { ClipboardList, Plus, Database, Table, CheckCircle, ArrowUpRight, Zap, AlertCircle, Trash2, Edit, X } from 'lucide-react';

interface UsageUnitViewProps {
  medicines: Medicine[];
  units: UnitInfo[];
  stocks: StockStore;
  usages: DailyUsage[];
  activeRole: 'apj' | 'gudang' | 'farmasi' | 'unit';
  activeUnitId: string;
  onSetSimulationUnit: (unitId: string) => void;
  onAddUsage: (usage: DailyUsage) => void;
  onDeleteUsage?: (usageId: string) => void;
  onUpdateUsage?: (usageId: string, updatedUsage: DailyUsage) => void;
  systemDate: string;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function UsageUnitView({
  medicines,
  units,
  stocks,
  usages,
  activeRole,
  activeUnitId,
  onSetSimulationUnit,
  onAddUsage,
  onDeleteUsage,
  onUpdateUsage,
  systemDate,
  onNotify,
}: UsageUnitViewProps) {
  // Notification helper
  const showNotice = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    if (onNotify) {
      onNotify(type, message);
    } else {
      alert(message);
    }
  };
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [officerName, setOfficerName] = useState('');
  const [useLines, setUseLines] = useState<DailyUsageItem[]>([]);

  // Temp form state for single drug usage line
  const [selectedMedId, setSelectedMedId] = useState('');
  const [mSearchTerm, setMSearchTerm] = useState('');
  const [qty, setQty] = useState<number>(0);

  const filteredMedicines = useMemo(() => {
    return medicines.filter(m =>
      m.name.toLowerCase().includes(mSearchTerm.toLowerCase()) ||
      m.type.toLowerCase().includes(mSearchTerm.toLowerCase()) ||
      m.group.toLowerCase().includes(mSearchTerm.toLowerCase())
    );
  }, [medicines, mSearchTerm]);

  // Filter internal satellite units (exclude Gudang and Ruang Farmasi from typical terminal list, although Ruang Farmasi can log usages too if they want)
  const satelliteUnits = useMemo(() => {
    return units.filter(u => u.id !== 'gudang');
  }, [units]);

  // DAILY USAGE EDITING STATE
  const [editingUsage, setEditingUsage] = useState<DailyUsage | null>(null);
  const [editOfficerName, setEditOfficerName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editItems, setEditItems] = useState<DailyUsageItem[]>([]);

  // Selected item addition inside Edit Modal
  const [editSelectedMedId, setEditSelectedMedId] = useState('');
  const [editMSearchTerm, setEditMSearchTerm] = useState('');
  const [editQty, setEditQty] = useState<number>(0);

  const initiateEditUsage = (use: DailyUsage) => {
    setEditingUsage(use);
    setEditOfficerName(use.officerName);
    setEditDate(use.date);
    setEditItems([...use.items]);
  };

  const handleAddEditItem = () => {
    if (!editSelectedMedId || editQty <= 0) {
      showNotice('warning', 'Peringatan: Silakan pilih jenis obat dan tentukan volume pengeluaran/pemakaian!');
      return;
    }

    // Check available stock in current simulated unit
    const unitStockObj = stocks[editingUsage?.unitId || activeUnitId] || {};
    const availableTotalSlot = unitStockObj[editSelectedMedId]?.total || 0;
    if (editQty > availableTotalSlot) {
      showNotice('warning', `Stok unit tidak mencukupi. Sisa stok: ${availableTotalSlot} pcs.`);
    }

    const newItem: DailyUsageItem = {
      medicineId: editSelectedMedId,
      qtyUsed: editQty
    };

    setEditItems([...editItems, newItem]);
    setEditSelectedMedId('');
    setEditQty(0);
  };

  const handleRemoveEditItem = (idx: number) => {
    setEditItems(editItems.filter((_, i) => i !== idx));
  };

  const handleSaveEditUsage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUsage || !onUpdateUsage) return;

    if (!editOfficerName || !editDate) {
      showNotice('error', 'Gagal menyimpan: Kolom tanggal dan nama petugas tidak boleh kosong!');
      return;
    }

    if (editItems.length === 0) {
      showNotice('error', 'Gagal menyimpan: Mohon masukkan minimal 1 sediaan obat yang dikeluarkan!');
      return;
    }

    const updatedUsage: DailyUsage = {
      ...editingUsage,
      officerName: editOfficerName,
      date: editDate,
      items: editItems
    };

    onUpdateUsage(editingUsage.id, updatedUsage);
    setEditingUsage(null);
  };

  const activeUnitDetails = useMemo(() => {
    return units.find(u => u.id === activeUnitId) || units[1];
  }, [units, activeUnitId]);

  // Current stock inventory for active satellite unit
  const activeUnitStock = useMemo(() => {
    return stocks[activeUnitId] || {};
  }, [stocks, activeUnitId]);

  const handleAddUseLine = () => {
    if (!selectedMedId || qty <= 0) {
      showNotice('warning', 'Peringatan: Silakan pilih obat dan tentukan jumlah pemakaian yang valid!');
      return;
    }
    const maxAvail = activeUnitStock[selectedMedId]?.total || 0;
    if (qty > maxAvail) {
      showNotice('error', `Gagal menambahkan: Stok tidak mencukupi! Persediaan ${activeUnitDetails.name} hanya memiliki ${maxAvail} pcs.`);
      return;
    }
    if (useLines.some(l => l.medicineId === selectedMedId)) {
      showNotice('warning', 'Peringatan: Obat ini sudah dicatatkan dalam form pemakaian harian saat ini!');
      return;
    }

    setUseLines([...useLines, { medicineId: selectedMedId, qtyUsed: qty }]);
    setSelectedMedId('');
    setMSearchTerm('');
    setQty(0);
  };

  const handleRemoveUseLine = (index: number) => {
    setUseLines(useLines.filter((_, idx) => idx !== index));
  };

  const handleSubmitUsage = (e: React.FormEvent) => {
    e.preventDefault();
    if (useLines.length === 0) {
      showNotice('error', 'Gagal memproses pemakaian: Masukkan minimal 1 obat/sediaan yang dikonsumsi!');
      return;
    }
    if (!officerName) {
      showNotice('error', 'Gagal memproses pemakaian: Masukkan nama petugas penanggung jawab pemakaian!');
      return;
    }

    const newUsage: DailyUsage = {
      id: `USG-${Date.now().toString().slice(-4)}`,
      date: systemDate,
      unitId: activeUnitId,
      items: useLines,
      officerName: officerName,
      timestamp: new Date().toISOString()
    };

    onAddUsage(newUsage);
    setShowUsageForm(false);
    setUseLines([]);
    setOfficerName('');
    showNotice('success', `Laporan pemakaian harian unit ${activeUnitDetails.name} berhasil disimpan. Sisa stok di unit ini langsung berkurang secara otomatis.`);
  };

  // Expenditures list for active unit
  const activeUnitUsagesLog = useMemo(() => {
    return usages.filter(u => u.unitId === activeUnitId);
  }, [usages, activeUnitId]);

  return (
    <div className="space-y-6" id="unit-usage-container">
      {/* Title & Portal selector simulating unit custom links */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="unit-portal-header">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 font-display">Terminal Pelayanan Unit & Pustu</h2>
            <p className="text-xs text-slate-500">
              Antarmuka mandiri untuk mengontrol sediaan langsung di unit-unit pelayanan puskesmas
            </p>
          </div>
          
          {!showUsageForm && (
            <button
              onClick={() => {
                setOfficerName(activeUnitDetails.manager);
                setShowUsageForm(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-sm"
              id="new-usage-btn"
            >
              <Plus className="w-4 h-4" /> Input Pemakaian Harian
            </button>
          )}
        </div>

        {/* Dynamic simulator dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150 justify-between" id="simulator-selection-bar">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">Simulasikan Terminal Unit / Pustu Aktif:</span>
          </div>

          <div className="w-full sm:w-auto max-w-full">
            <select
              value={activeUnitId}
              onChange={(e) => onSetSimulationUnit(e.target.value)}
              className="w-full sm:w-auto border border-slate-250 bg-white font-bold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500 text-xs rounded-lg px-3 py-1.5 truncate max-w-full"
              id="terminal-unit-switcher"
            >
              {satelliteUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} (PJ: {u.manager})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* FORM INPUT PEMAKAIAN HARIAN */}
      {showUsageForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="usage-input-card">
          <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 font-display flex items-center gap-2 text-sm">
              <Table className="w-4.5 h-4.5 text-emerald-500" /> Form Laporan Pengeluaran Pemakaian Harian &mdash; {activeUnitDetails.name}
            </h3>
            <button onClick={() => setShowUsageForm(false)} className="text-xs text-slate-400 font-bold hover:text-slate-600">
              Batal
            </button>
          </div>

          <form onSubmit={handleSubmitUsage} className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Petugas Penanggung Jawab</label>
                <input
                  type="text"
                  placeholder="Contoh: Suhartini, S.Kep"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full border border-slate-250 rounded px-3 py-1.5 text-xs bg-white text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Pemakaian (Simulasi)</label>
                <input
                  type="date"
                  disabled
                  value={systemDate}
                  className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded px-3 py-1.5 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Line items details for Usage */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pilih Sediaan Serta Jumlah yang Dikeluarkan Hari Ini:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2 text-left">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Cari & Pilih Sediaan Obat di Unit Anda</label>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="🔍 Ketik nama obat..."
                      value={mSearchTerm}
                      onChange={(e) => setMSearchTerm(e.target.value)}
                      className="w-full border border-slate-200 bg-white outline-none rounded px-2.5 py-1 text-xs text-slate-700 placeholder-slate-400 font-medium"
                      id="usage-med-search"
                    />
                    <select
                      value={selectedMedId}
                      onChange={(e) => setSelectedMedId(e.target.value)}
                      className="w-full border border-slate-200 bg-white outline-none rounded px-2.5 py-1.5 text-xs text-slate-700 font-medium"
                      id="usage-med-selector"
                    >
                      <option value="">-- {filteredMedicines.length === 0 ? "Tidak ada sediaan cocok" : `Pilih Obat (${filteredMedicines.length} ditemukan)`} --</option>
                      {filteredMedicines.map(m => {
                        const avail = activeUnitStock[m.id]?.total || 0;
                        return (
                          <option key={m.id} value={m.id} disabled={avail === 0}>
                            {m.name} [{avail > 0 ? `Tersedia: ${avail} ${m.unit}` : 'KOSONG'}]
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Jumlah Dipakai (Pcs)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 10"
                    value={qty || ''}
                    onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5 text-xs text-slate-700 font-bold"
                    id="usage-qty-input"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                {selectedMedId && (
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded">
                    Sisa Stok Riil Unit Anda: <b>{activeUnitStock[selectedMedId]?.total || 0} pcs</b>
                  </span>
                )}
                
                <button
                  type="button"
                  onClick={handleAddUseLine}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-lg flex items-center gap-1 transition-all ml-auto"
                >
                  + Tambah Rincian Penggunaan
                </button>
              </div>

              {/* Added table visual */}
              {useLines.length > 0 && (
                <div className="border border-slate-250 rounded-xl bg-white overflow-x-auto" id="added-usage-preview-table">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="p-3">Obat</th>
                        <th className="p-3">Satuan</th>
                        <th className="p-3">Jumlah Pengeluaran</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {useLines.map((line, idx) => {
                        const med = medicines.find(m => m.id === line.medicineId);
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-slate-850">{med ? med.name : 'Unknown'}</td>
                            <td className="p-3 text-slate-500">{med?.unit}</td>
                            <td className="p-3 font-bold text-slate-800">{line.qtyUsed} pcs</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveUseLine(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowUsageForm(false);
                  setUseLines([]);
                }}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-650 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
                id="submit-usage-log-btn"
              >
                <CheckCircle className="w-4 h-4 shrink-0" /> Simpan Pemakaian Harian & Kurangi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETAILED REAL-TIME UNIT STOCK BALANCES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="unit-detail-grid">
        {/* Left Side: Real-time stock list */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" id="unit-stock-list">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
            <h3 className="font-semibold text-slate-800 font-display text-sm">
              Sisa Stok Fisik Riil &mdash; <b className="text-indigo-700">{activeUnitDetails.name}</b>
            </h3>
            <span className="text-xs text-slate-500">Sesuai Alokasi Ampra</span>
          </div>

          <div className="p-5" id="unit-stock-grid-box">
            {Object.keys(activeUnitStock).length === 0 ? (
              <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-2">
                <Database className="w-10 h-10 text-slate-300" />
                <p className="text-xs font-semibold">Gudang belum mendistribusikan obat apa pun ke unit ini.</p>
                <p className="text-[10px] text-slate-400">Silakan buat permintaan Ampra untuk merekrut stok.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(activeUnitStock as Record<string, { total: number }>).map(([medId, stockData]) => {
                  const m = medicines.find(med => med.id === medId);
                  if (!m) return null;
                  return (
                    <div key={medId} className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between hover:bg-slate-100/40 transition">
                      <div className="space-y-0.5 max-w-[70%]">
                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded">
                          {m.type === 'generik' ? 'Generik' : 'Paten'} {m.isNarkotikaPsikotropika && '• Napza'}
                        </span>
                        <p className="text-xs font-bold text-slate-800 truncate" title={m.name}>{m.name}</p>
                        <p className="text-[10px] text-slate-400">Satuan sediaan: {m.unit}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-extrabold px-2.5 py-1 rounded-lg ${
                          stockData.total === 0 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-white text-slate-800 border border-slate-150'
                        }`}>
                          {stockData.total} <span className="text-[10px] font-normal text-slate-500">{m.unit}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Unit Activity usage logs */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" id="unit-usage-logs">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
            <h3 className="font-semibold text-slate-800 font-display text-sm flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-emerald-500" /> Log Harian Pengeluaran Terakhir
            </h3>
            <span className="text-xs text-slate-400 font-medium">Bulan Berjalan</span>
          </div>

          <div className="p-4 max-h-[450px] overflow-y-auto space-y-4" id="unit-usage-rolls">
            {activeUnitUsagesLog.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5 py-14">
                <AlertCircle className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-medium">Belum ada pemakaian teridentifikasi di terminal pelayanan unit ini.</p>
              </div>
            ) : (
              activeUnitUsagesLog.map((use) => (
                <div key={use.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 space-y-3">
                  <div className="flex justify-between items-center text-[11px] border-b border-slate-200/50 pb-2 font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.5 border border-slate-200 rounded">{use.id}</span>
                      {onUpdateUsage && (activeRole === 'apj' || (activeRole === 'unit' && use.unitId === activeUnitId)) && (
                        <button
                          onClick={() => initiateEditUsage(use)}
                          className="p-1 text-slate-400 hover:text-emerald-650 hover:bg-emerald-50 rounded transition"
                          title="Edit / Koreksi Laporan Pengeluaran"
                          id={`edit-use-${use.id}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteUsage && (activeRole === 'apj' || (activeRole === 'unit' && use.unitId === activeUnitId)) && (
                        <button
                          onClick={() => onDeleteUsage(use.id)}
                          className="p-1 text-slate-400 hover:text-red-650 hover:bg-rose-50 rounded transition"
                          title="Batalkan / Hapus Laporan Pengeluaran"
                          id={`delete-use-${use.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-slate-500 font-semibold">{use.date}</span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase">
                        <th>Sediaan</th>
                        <th className="text-right">Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {use.items.map((line, idx) => {
                        const m = medicines.find(med => med.id === line.medicineId);
                        return (
                          <tr key={idx}>
                            <td className="py-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              <span>{m ? m.name : 'Unknown'}</span>
                            </td>
                            <td className="py-1 text-right text-rose-600 font-bold">-{line.qtyUsed}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                    <span>Petugas: <b>{use.officerName}</b></span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5"><ArrowUpRight className="w-3.5 h-3.5" /> Terhitung</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* PROFESSIONAL EDIT UNIT DAILY USAGE DISPENSING MODAL */}
      {editingUsage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="edit-usage-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in duration-200" id="edit-usage-modal-content">
            
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-emerald-600" /> Edit / Koreksi Laporan Pengeluaran Harian
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID Log: {editingUsage.id} &bull; Unit: {units.find(u => u.id === editingUsage.unitId)?.name || editingUsage.unitId}</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingUsage(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSaveEditUsage} className="p-4 md:p-6 space-y-5 flex-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Petugas Penanggung Jawab</label>
                  <input
                    type="text"
                    value={editOfficerName}
                    onChange={(e) => setEditOfficerName(e.target.value)}
                    placeholder="Nama Petugas"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tanggal Pengeluaran / Pemakaian</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Items in editItems loop */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Daftar Obat Terpakai ({editItems.length})</h4>
                  <span className="text-[10px] text-slate-400 italic">Tambahkan obat baru di panel pengisian bawah</span>
                </div>

                {/* Items list inside Modal editor */}
                {editItems.length === 0 ? (
                  <div className="p-4 bg-white/70 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                    Daftar pemakaian obat kosong. Silakan tambahkan item obat yang dikeluarkan.
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-2xs max-h-36">
                    <table className="w-full text-left text-xs" id="table-edit-usage-items">
                      <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-2 pl-3">Obat</th>
                          <th className="p-2 text-right">Volume Keluar</th>
                          <th className="p-2 text-center w-12">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                        {editItems.map((it, idx) => {
                          const medMatch = medicines.find(m => m.id === it.medicineId);
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 pl-3 font-semibold text-slate-800">{medMatch ? medMatch.name : 'Unknown'}</td>
                              <td className="p-2 text-right text-red-650 font-bold">-{it.qtyUsed} {medMatch?.unit || 'pcs'}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditItem(idx)}
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-rose-50 rounded animate-in"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Inline item input builder */}
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200/60 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  
                  <div className="md:col-span-7">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Sediaan Obat</label>
                    <input
                      type="text"
                      value={editMSearchTerm}
                      onChange={(e) => setEditMSearchTerm(e.target.value)}
                      placeholder="Cari obat unit..."
                      className="w-full text-xs p-1.5 bg-white rounded-md border border-slate-205 outline-none mb-1"
                    />
                    <select
                      value={editSelectedMedId}
                      onChange={(e) => setEditSelectedMedId(e.target.value)}
                      className="w-full text-xs p-1.5 bg-white rounded-md border border-slate-200 font-medium"
                    >
                      <option value="">-- Pilih Obat --</option>
                      {medicines
                        .filter(m => m.name.toLowerCase().includes(editMSearchTerm.toLowerCase()))
                        .map(m => {
                          const uStock = stocks[editingUsage.unitId]?.[m.id]?.total || 0;
                          return (
                            <option key={m.id} value={m.id}>
                              {m.name} [Sediaan: {uStock} {m.unit}]
                            </option>
                          );
                        })
                      }
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jumlah Pemakaian</label>
                    <input
                      type="number"
                      value={editQty === 0 ? '' : editQty}
                      onChange={(e) => setEditQty(Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full text-xs p-1.5 bg-white rounded-md border border-slate-200"
                    />
                  </div>

                  <div className="md:col-span-2 text-center">
                    <button
                      type="button"
                      onClick={handleAddEditItem}
                      className="w-full text-xs p-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>

                </div>
              </div>

              {/* Save / Footer */}
              <div className="mt-8 border-t border-slate-100 pt-4 flex justify-end gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setEditingUsage(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm transition-all"
                >
                  <CheckCircle className="w-4 h-4" /> Simpan Koreksi Pengeluaran
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
