/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Medicine, Prescription, PrescriptionItem, StockStore } from '../types';
import { FileText, Plus, Search, Trash2, CheckCircle, Database, AlertCircle, ShoppingBag, Eye, Calendar, Edit, X } from 'lucide-react';

interface ApotekPasienViewProps {
  medicines: Medicine[];
  prescriptions: Prescription[];
  stocks: StockStore;
  onAddPrescription: (prescription: Prescription) => void;
  onDeletePrescription?: (rxId: string) => void;
  onUpdatePrescription?: (rxId: string, updatedRx: Prescription) => void;
  activeRole?: string;
  systemDate: string;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function ApotekPasienView({
  medicines,
  prescriptions,
  stocks,
  onAddPrescription,
  onDeletePrescription,
  onUpdatePrescription,
  activeRole,
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

  // PRESCRIPTION EDITING ACTION STATE
  const [editingRx, setEditingRx] = useState<Prescription | null>(null);
  const [editPatientName, setEditPatientName] = useState('');
  const [editDrName, setEditDrName] = useState('');
  const [editAge, setEditAge] = useState<number>(0);
  const [editRxType, setEditRxType] = useState<'Rawat Jalan' | 'Rawat Inap'>('Rawat Jalan');
  const [editRxDate, setEditRxDate] = useState('');
  const [editLines, setEditLines] = useState<PrescriptionItem[]>([]);

  // Selected item addition inside Edit Modal
  const [editSelectedMedId, setEditSelectedMedId] = useState('');
  const [editMSearchTerm, setEditMSearchTerm] = useState('');
  const [editQty, setEditQty] = useState<number>(0);
  const [editDosage, setEditDosage] = useState('');
  const [editIsCompound, setEditIsCompound] = useState(false);

  const initiateEditRx = (rx: Prescription) => {
    setEditingRx(rx);
    setEditPatientName(rx.patientName);
    setEditDrName(rx.drName);
    setEditAge(rx.age);
    setEditRxType(rx.type);
    setEditRxDate(rx.date || systemDate);
    setEditLines([...rx.items]);
  };

  const handleAddEditLine = () => {
    if (!editSelectedMedId || editQty <= 0 || !editDosage) {
      showNotice('warning', 'Peringatan: Silakan pilih obat, tentukan jumlah, dan cara pakai dengan lengkap!');
      return;
    }

    const newLine: PrescriptionItem = {
      medicineId: editSelectedMedId,
      qty: editQty,
      dosage: editDosage,
      isCompound: editIsCompound
    };

    setEditLines([...editLines, newLine]);
    setEditSelectedMedId('');
    setEditQty(0);
    setEditDosage('');
  };

  const handleRemoveEditLine = (idx: number) => {
    setEditLines(editLines.filter((_, i) => i !== idx));
  };

  const handleSaveEditRx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRx || !onUpdatePrescription) return;

    if (!editPatientName || !editDrName || editAge <= 0) {
      showNotice('error', 'Gagal menyimpan: Informasi pasien, usia, dan dokter tidak boleh kosong!');
      return;
    }

    if (editLines.length === 0) {
      showNotice('error', 'Gagal menyimpan: Mohon masukkan minimal 1 sediaan obat dalam resep!');
      return;
    }

    const updatedRx: Prescription = {
      ...editingRx,
      patientName: editPatientName,
      drName: editDrName,
      age: editAge,
      type: editRxType,
      date: editRxDate,
      items: editLines
    };

    onUpdatePrescription(editingRx.id, updatedRx);
    setEditingRx(null);
  };

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
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md">
                        {rx.id}
                      </span>
                      {onUpdatePrescription && (activeRole === 'farmasi' || activeRole === 'apj') && (
                        <button
                          onClick={() => initiateEditRx(rx)}
                          className="p-1 text-slate-400 hover:text-emerald-650 transition rounded hover:bg-emerald-50"
                          title="Edit / Koreksi Isi Resep Pasien"
                          id={`edit-rx-${rx.id}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {onDeletePrescription && (activeRole === 'farmasi' || activeRole === 'apj') && (
                        <button
                          onClick={() => onDeletePrescription(rx.id)}
                          className="p-1 text-slate-400 hover:text-red-650 transition rounded hover:bg-rose-50"
                          title="Hapus / Batalkan Resep"
                          id={`delete-rx-${rx.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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

      {/* PROFESSIONAL EDIT PRESCRIPTION MODAL */}
      {editingRx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="edit-prescription-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in duration-200" id="edit-prescription-modal-content">
            
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50' sticky top-0 z-10">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-indigo-600" /> Edit / Koreksi Resep Pasien
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID Resep: {editingRx.id}</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingRx(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSaveEditRx} className="p-4 md:p-6 space-y-5 flex-1">
              
              {/* Patient and Dr Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Pasien</label>
                  <input
                    type="text"
                    value={editPatientName}
                    onChange={(e) => setEditPatientName(e.target.value)}
                    placeholder="Nama Lengkap Pasien"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Usia (Tahun)</label>
                  <input
                    type="number"
                    value={editAge || ''}
                    onChange={(e) => setEditAge(Number(e.target.value))}
                    placeholder="Usia"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Jenis Layanan</label>
                  <select
                    value={editRxType}
                    onChange={(e) => setEditRxType(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 bg-white font-medium"
                  >
                    <option value="Rawat Jalan">Rawat Jalan</option>
                    <option value="Rawat Inap">Rawat Inap</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Dokter Penulis Resep</label>
                  <input
                    type="text"
                    value={editDrName}
                    onChange={(e) => setEditDrName(e.target.value)}
                    placeholder="Nama Dokter Penulis"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tanggal Resep</label>
                  <input
                    type="date"
                    value={editRxDate}
                    onChange={(e) => setEditRxDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Items List in editLines */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Item Obat / Sediaan ({editLines.length})</h4>
                  <span className="text-[10px] text-slate-400 italic">Tambahkan obat atau resep di panel input bawah</span>
                </div>

                {/* Lines List Table */}
                {editLines.length === 0 ? (
                  <div className="p-4 bg-white/70 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-450">
                    Sediaan resep kosong. Silakan tambahkan obat.
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-2xs max-h-40">
                    <table className="w-full text-left text-xs" id="table-edit-prescription-lines">
                      <thead className="bg-slate-100 text-[10px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 pl-3">Obat</th>
                          <th className="p-2.5">Sediaan Formula</th>
                          <th className="p-2.5 text-right">Jumlah</th>
                          <th className="p-2.5 text-right">Signa Aturan</th>
                          <th className="p-2.5 text-center w-12">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {editLines.map((it, idx) => {
                          const medMatch = medicines.find(m => m.id === it.medicineId);
                          return (
                            <tr key={idx} className="hover:bg-slate-50 text-slate-700">
                              <td className="p-2 pl-3 font-semibold text-slate-800">{medMatch ? medMatch.name : 'Unknown'}</td>
                              <td className="p-2 text-slate-500 font-mono text-[10px]">{it.isCompound ? 'Racikan' : 'Non-Racikan'}</td>
                              <td className="p-2 text-right font-bold text-indigo-700">{it.qty} {medMatch?.unit || 'pcs'}</td>
                              <td className="p-2 text-right italic font-mono text-slate-600 text-[11px]">{it.dosage}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditLine(idx)}
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-rose-50 rounded"
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

                {/* Sub-form input selector inside Modal */}
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200/60 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  
                  <div className="md:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih Obat</label>
                    <input
                      type="text"
                      value={editMSearchTerm}
                      onChange={(e) => setEditMSearchTerm(e.target.value)}
                      placeholder="Ketik cari nama obat..."
                      className="w-full text-xs p-1.5 bg-white rounded-md border border-slate-200 outline-none mb-1"
                    />
                    <select
                      value={editSelectedMedId}
                      onChange={(e) => setEditSelectedMedId(e.target.value)}
                      className="w-full text-xs p-1.5 bg-white rounded-md border border-slate-200"
                    >
                      <option value="">-- Pilih Sediaan Obat --</option>
                      {medicines
                        .filter(m => m.name.toLowerCase().includes(editMSearchTerm.toLowerCase()))
                        .map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} [Stok Apotek: {apotekStock[m.id]?.total || 0} {m.unit}]
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jumlah</label>
                    <input
                      type="number"
                      value={editQty === 0 ? '' : editQty}
                      onChange={(e) => setEditQty(Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full text-xs p-1.5 bg-white rounded-md border border-slate-200"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Signa Aturan (3x1 tab)</label>
                    <input
                      type="text"
                      value={editDosage}
                      onChange={(e) => setEditDosage(e.target.value)}
                      placeholder="Contoh: 3x1 tablet"
                      className="w-full text-xs p-1.5 bg-white rounded-md border border-slate-200"
                    />
                  </div>

                  <div className="md:col-span-2 text-center">
                    <button
                      type="button"
                      onClick={handleAddEditLine}
                      className="w-full text-xs p-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>

                  {/* Racikan checkbox */}
                  <div className="md:col-span-12 flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="edit-is-compound"
                      checked={editIsCompound}
                      onChange={(e) => setEditIsCompound(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-505"
                    />
                    <label htmlFor="edit-is-compound" className="text-[11px] font-semibold text-slate-600 cursor-pointer">
                      Sediaan Formula merupakan Racikan Apoteker
                    </label>
                  </div>

                </div>
              </div>

              {/* Save / Footer */}
              <div className="mt-8 border-t border-slate-100 pt-4 flex justify-end gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setEditingRx(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm transition-all"
                >
                  <CheckCircle className="w-4 h-4" /> Simpan Koreksi Resep & Atur Stok
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
