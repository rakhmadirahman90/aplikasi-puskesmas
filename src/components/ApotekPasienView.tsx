/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Medicine, Prescription, PrescriptionItem, StockStore } from '../types';
import { FileText, Plus, Search, Trash2, CheckCircle, Database, AlertCircle, ShoppingBag, Eye, Calendar } from 'lucide-react';

interface ApotekPasienViewProps {
  medicines: Medicine[];
  prescriptions: Prescription[];
  stocks: StockStore;
  onAddPrescription: (prescription: Prescription) => void;
  systemDate: string;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function ApotekPasienView({
  medicines,
  prescriptions,
  stocks,
  onAddPrescription,
  systemDate,
  onNotify,
}: ApotekPasienViewProps) {
  // Notification helper
  const showNotice = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    if (onNotify) {
      onNotify(type, message);
    } else {
      alert(message);
    }
  };
  // Prescription Form State
  const [showForm, setShowForm] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [drName, setDrName] = useState('');
  const [age, setAge] = useState<number>(0);
  const [rxType, setRxType] = useState<'Rawat Jalan' | 'Rawat Inap'>('Rawat Jalan');
  const [lines, setLines] = useState<PrescriptionItem[]>([]);

  // Item row form state
  const [selectedMedId, setSelectedMedId] = useState('');
  const [mSearchTerm, setMSearchTerm] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [dosage, setDosage] = useState('');
  const [isCompound, setIsCompound] = useState(false);

  const filteredMedicines = useMemo(() => {
    return medicines.filter(m =>
      m.name.toLowerCase().includes(mSearchTerm.toLowerCase()) ||
      m.type.toLowerCase().includes(mSearchTerm.toLowerCase()) ||
      m.group.toLowerCase().includes(mSearchTerm.toLowerCase())
    );
  }, [medicines, mSearchTerm]);

  // Search/Lookup State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDr, setSearchDr] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // Active Ruang Farmasi Stocks
  const apotekStock = useMemo(() => {
    return stocks['ruang_farmasi'] || {};
  }, [stocks]);

  const handleAddLineRow = () => {
    if (!selectedMedId || qty <= 0 || !dosage) {
      showNotice('warning', 'Peringatan: Silakan pilih obat, tentukan jumlah, dan cara pakai resep dengan lengkap!');
      return;
    }

    // Check stock limit in Apotek
    const available = apotekStock[selectedMedId]?.total || 0;
    if (qty > available) {
      const confirmForce = window.confirm(
        `Perhatian: Stok obat ini di Ruang Farmasi hanya ada ${available} pcs (Kurang ${qty - available} pcs). Tetap layani atau sesuaikan?`
      );
      if (!confirmForce) return;
    }

    const newLine: PrescriptionItem = {
      medicineId: selectedMedId,
      qty: qty,
      dosage: dosage,
      isCompound: isCompound
    };

    setLines([...lines, newLine]);
    // Reset inputs
    setSelectedMedId('');
    setMSearchTerm('');
    setQty(0);
    setDosage('');
    setIsCompound(false);
  };

  const handleRemoveLineRow = (index: number) => {
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const handleSubmitPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !drName || age <= 0) {
      showNotice('error', 'Gagal memproses resep: Mohon lengkapi nama pasien, umur, dan nama dokter!');
      return;
    }
    if (lines.length === 0) {
      showNotice('error', 'Gagal memproses resep: Masukkan minimal 1 item obat dalam draf resep!');
      return;
    }

    const newPrescription: Prescription = {
      id: `RX-${Date.now().toString().slice(-5)}`,
      date: systemDate,
      patientName: patientName,
      drName: drName,
      age: age,
      type: rxType,
      items: lines,
      timestamp: new Date().toISOString()
    };

    onAddPrescription(newPrescription);
    setShowForm(false);
    
    // Clear
    setPatientName('');
    setDrName('');
    setAge(0);
    setLines([]);
    showNotice('success', `Resep pasien ${newPrescription.patientName} berhasil disimpan. Sisa stok di Ruang Farmasi langsung dipotong secara real-time.`);
  };

  // Filtered prescription lookup for Doctor query
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(rx => {
      const matchQuery = !searchQuery || 
        rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rx.items.some(i => {
          const m = medicines.find(med => med.id === i.medicineId);
          return m && m.name.toLowerCase().includes(searchQuery.toLowerCase());
        });

      const matchDr = !searchDr || rx.drName.toLowerCase().includes(searchDr.toLowerCase());
      const matchDate = !searchDate || rx.date === searchDate;

      return matchQuery && matchDr && matchDate;
    });
  }, [prescriptions, searchQuery, searchDr, searchDate, medicines]);

  return (
    <div className="space-y-6" id="apotek-container">
      {/* Overview stats and title */}
      <div className="flex flex-wrap justify-between items-center gap-4" id="apotek-header-bar">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 font-display">Pelayanan Resep Ruang Farmasi</h2>
          <p className="text-xs text-slate-500">
            Penyiapan obat resep pasien rawat jalan & rawat inap. Stok dipotong seketika secara real-time.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-sm"
            id="register-rx-btn"
          >
            <Plus className="w-4 h-4" /> Input Resep Baru (Pasien)
          </button>
        )}
      </div>

      {/* RETAIL PRESCRIPTION INPUT FORM */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="prescription-input-card">
          <div className="bg-slate-50 p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 font-display flex items-center gap-2 text-sm">
              <ShoppingBag className="w-4.5 h-4.5 text-emerald-500" /> Layanan Input Resep Real-Time
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              Tutup
            </button>
          </div>

          <form onSubmit={handleSubmitPrescription} className="p-5 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap Pasien</label>
                <input
                  type="text"
                  placeholder="Contoh: Ny. Kartini"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Umur Pasien (Tahun)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Umur"
                  value={age || ''}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dokter Pemeriksa / Penulis Resep</label>
                <select
                  value={drName}
                  onChange={(e) => setDrName(e.target.value)}
                  className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none bg-white font-medium text-slate-700"
                  required
                >
                  <option value="">-- Hubungkan Dokter --</option>
                  <option value="dr. Akhmad">dr. Akhmad (Dokter Umum Puskesmas)</option>
                  <option value="dr. Mega Utami">dr. Mega Utami (Dokter Gigi/Anak)</option>
                  <option value="drg. Soraya">drg. Soraya (Dokter Gigi)</option>
                  <option value="Bidan Rahmah, Str.Keb">Bidan Rahmah (Kamar Bersalin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Pelayanan Resep</label>
                <div className="flex bg-slate-100 p-0.5 rounded-lg" id="rx-type-tabs">
                  <button
                    type="button"
                    onClick={() => setRxType('Rawat Jalan')}
                    className={`flex-1 py-1 text-center font-medium rounded-md text-xs transition-colors ${rxType === 'Rawat Jalan' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Rawat Jalan
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxType('Rawat Inap')}
                    className={`flex-1 py-1 text-center font-medium rounded-md text-xs transition-colors ${rxType === 'Rawat Inap' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Rawat Inap
                  </button>
                </div>
              </div>
            </div>

            {/* Recipe item Row Inputs */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tambahkan Sediaan Obat Pada Resep:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4 text-left">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Cari & Pilih Nama Obat</label>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="🔍 Ketik nama obat..."
                      value={mSearchTerm}
                      onChange={(e) => setMSearchTerm(e.target.value)}
                      className="w-full border border-slate-200 bg-white outline-none rounded px-2.5 py-1 text-xs text-slate-700 placeholder-slate-400 font-semibold"
                      id="prescription-med-search"
                    />
                    <select
                      value={selectedMedId}
                      onChange={(e) => setSelectedMedId(e.target.value)}
                      className="w-full border border-slate-200 bg-white outline-none rounded px-2.5 py-1.5 text-xs text-slate-700 font-semibold"
                      id="line-item-med"
                    >
                      <option value="">-- {filteredMedicines.length === 0 ? "Tidak ada sediaan cocok" : `Cari Sediaan Obat (${filteredMedicines.length} ditemukan)`} --</option>
                      {filteredMedicines.map(m => {
                        const avail = apotekStock[m.id]?.total || 0;
                        return (
                          <option key={m.id} value={m.id}>
                            {m.name} [Stok: {avail} {m.unit}]
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Jumlah (Pcs/Btl)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qyt"
                    value={qty || ''}
                    onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5 text-xs text-slate-700 font-bold"
                    id="line-item-qty"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Aturan Pakai (Signa)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 3 x 1 tablet"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5 text-xs text-slate-700"
                    id="line-item-dosage"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Kondisi Obat</label>
                  <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 justify-around">
                    <button
                      type="button"
                      onClick={() => setIsCompound(false)}
                      className={`flex-1 py-1 text-[11px] font-semibold rounded-md ${!isCompound ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
                    >
                      Biasa / Paten
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCompound(true)}
                      className={`flex-1 py-1 text-[11px] font-semibold rounded-md ${isCompound ? 'bg-amber-600 text-white animate-pulse-once' : 'text-slate-600'}`}
                    >
                      Racikan
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                {selectedMedId && (
                  <div className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded text-xs font-semibold">
                    Stok Tersedia di Ruang Farmasi: <b className="text-emerald-900 font-display">{(apotekStock[selectedMedId]?.total || 0)} pcs</b>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddLineRow}
                  className="ml-auto px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-lg flex items-center gap-1 transition"
                  id="add-rx-line-btn"
                >
                  + Tambah Sediaan Obat
                </button>
              </div>

              {/* Current lines visual block */}
              {lines.length > 0 && (
                <div className="border border-slate-250 rounded-xl bg-white overflow-x-auto" id="added-rx-lines">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                        <th className="p-3">Obat</th>
                        <th className="p-3">Jumlah</th>
                        <th className="p-3">Cara Pakai (Signa)</th>
                        <th className="p-3">Formulasi</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {lines.map((line, idx) => {
                        const med = medicines.find(m => m.id === line.medicineId);
                        return (
                          <tr key={idx} className="hover:bg-slate-55">
                            <td className="p-3 font-semibold text-slate-850">{med ? med.name : 'Unknown'}</td>
                            <td className="p-3 font-bold text-slate-800">{line.qty} {med?.unit}</td>
                            <td className="p-3 text-slate-600 italic font-mono">{line.dosage}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                line.isCompound ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {line.isCompound ? 'Racikan' : 'Non-Racikan'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineRow(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4 mx-auto" />
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
                onClick={() => setShowForm(false)}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                id="submit-rx-btn"
              >
                <CheckCircle className="w-4 h-4 shrink-0" /> Simpan Resep & Potong Stok Realtime
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH / ADVANCED PATIENT PRESCRIPTION LOOKUP PANEL (Dokter Query) */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-3xs space-y-4" id="doctor-search-panel">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-50 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800 font-display text-sm">Mesin Pencari Resep & Diserahkan ke Pasien</h3>
          </div>
          <span className="text-xs text-slate-400">Verifikasi instan tanpa membongkar bundel resep fisik</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari Nama Pasien / Kode ID / Nama Obat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-slate-700 text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl outline-none border border-slate-150 focus:border-indigo-500 focus:bg-white pl-9 transition-all"
              id="search-patient-input"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div>
            <select
              value={searchDr}
              onChange={(e) => setSearchDr(e.target.value)}
              className="w-full text-slate-700 text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl outline-none border border-slate-150 focus:border-indigo-500 transition-all font-medium"
              id="search-dr-select"
            >
              <option value="">-- Semua Dokter Pemeriksa --</option>
              {Array.from(new Set(prescriptions.map(p => p.drName))).map(dr => (
                <option key={dr} value={dr}>{dr}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full text-slate-700 text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl outline-none border border-slate-150 focus:border-indigo-500 transition-all font-medium"
              id="search-date-input"
            />
          </div>
        </div>

        {/* Info card of match size */}
        {filteredPrescriptions.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-150 bg-slate-50/50 rounded-xl text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5 py-10">
            <AlertCircle className="w-8 h-8 text-slate-300" />
            <p>Arsip nihil. Tidak ada data pasien yang pas untuk parameter pencarian di atas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-2" id="prescriptions-search-results">
            {filteredPrescriptions.map(rx => (
              <div key={rx.id} className="p-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-2xl transition duration-150 space-y-3 relative group overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md">
                      {rx.id}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm mt-1.5">{rx.patientName} &bull; <span className="text-slate-500 font-medium text-xs">{rx.age} Thn</span></h4>
                    <p className="text-xs text-slate-450 font-medium">Dokter: <span className="text-slate-700 font-semibold">{rx.drName}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                      {rx.type}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 justify-end">
                      <Calendar className="w-3 h-3" />
                      <span>{rx.date}</span>
                    </div>
                  </div>
                </div>

                {/* Items loop */}
                <div className="border-t border-slate-200/90 pt-3 space-y-1.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Sediaan yang Diserahkan:</p>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-[9px] text-slate-400 font-semibold">
                        <th>Obat</th>
                        <th className="text-right">Jumlah</th>
                        <th className="text-right">Aturan Signa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {rx.items.map((line, idx) => {
                        const m = medicines.find(med => med.id === line.medicineId);
                        return (
                          <tr key={idx} className="text-slate-700">
                            <td className="py-1 flex items-center gap-1 truncate max-w-[140px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 block"></span>
                              <span className="truncate">{m ? m.name : 'Unknown'}</span>
                            </td>
                            <td className="py-1 text-right text-indigo-700 font-bold">{line.qty} {m?.unit}</td>
                            <td className="py-1 text-right italic font-mono text-[10px] text-slate-500">{line.dosage}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Micro info */}
                <div className="text-[9px] text-slate-400 flex justify-between pt-1 border-t border-slate-100">
                  <span>Input: {new Date(rx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-0.5"><Database className="w-2.5 h-2.5" /> Terarsip Aman</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APOETEK STOCK CONTROL & HEALTH CHECK CARD */}
      <div className="bg-white p-5 rounded-2xl shadow-3xs border border-slate-100 space-y-3" id="apotek-stock-overview">
        <h3 className="font-semibold text-slate-800 font-display text-sm flex items-center gap-2">
          <Database className="w-4.5 h-4.5 text-emerald-500" /> Sisa Stok Riil Apotek (Ruang Farmasi) saat ini:
        </h3>
        <p className="text-xs text-slate-500">Mencakup persediaan obat aktif di apotek untuk pelayanan hari ini.</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
          {medicines.map(m => {
            const qty = apotekStock[m.id]?.total || 0;
            return (
              <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 hover:bg-slate-100/50 transition-all font-sans">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{m.type}</span>
                <p className="font-bold text-slate-800 text-xs truncate" title={m.name}>{m.name}</p>
                <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-200">
                  <span className={`text-[11px] font-extrabold ${qty === 0 ? 'text-rose-600' : qty < 50 ? 'text-amber-600' : 'text-slate-800'}`}>
                    {qty} <span className="text-[9px] font-normal text-slate-500">{m.unit}</span>
                  </span>
                  {qty === 0 && <span className="text-[9px] font-bold text-red-500 animate-pulse">Habis!</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
