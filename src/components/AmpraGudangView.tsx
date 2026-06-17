/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Medicine, Ampra, UnitInfo, StockStore, AmpraItem } from '../types';
import { ClipboardList, Plus, FileText, CheckCircle, Clock, AlertTriangle, ShieldCheck, UserCheck, ArrowRight, Printer } from 'lucide-react';

interface AmpraGudangViewProps {
  medicines: Medicine[];
  units: UnitInfo[];
  ampras: Ampra[];
  stocks: StockStore;
  activeRole: 'apj' | 'gudang' | 'farmasi' | 'unit';
  activeUnitId: string;
  userName: string;
  onCreateAmpra: (ampra: Ampra) => void;
  onUpdateAmpraStatus: (ampraId: string, updates: Partial<Ampra>) => void;
  systemDate: string;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function AmpraGudangView({
  medicines,
  units,
  ampras,
  stocks,
  activeRole,
  activeUnitId,
  userName,
  onCreateAmpra,
  onUpdateAmpraStatus,
  systemDate,
  onNotify,
}: AmpraGudangViewProps) {
  // Notification helper
  const showNotice = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    if (onNotify) {
      onNotify(type, message);
    } else {
      alert(message);
    }
  };
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetUnitId, setTargetUnitId] = useState('');
  const [cycleType, setCycleType] = useState<'Harian' | 'Bulanan' | 'Insidentil'>('Harian');
  const [requestLines, setRequestLines] = useState<{ medicineId: string; requestedQty: number }[]>([]);

  // Temp form state for adding a request line
  const [selectedMedId, setSelectedMedId] = useState('');
  const [mSearchTerm, setMSearchTerm] = useState('');
  const [qty, setQty] = useState<number>(0);

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(mSearchTerm.toLowerCase()) ||
    m.type.toLowerCase().includes(mSearchTerm.toLowerCase()) ||
    m.group.toLowerCase().includes(mSearchTerm.toLowerCase())
  );

  // Gudang allocation state for a selected ampra card
  const [reviewingAmpraId, setReviewingAmpraId] = useState<string | null>(null);
  const [allocationMap, setAllocationMap] = useState<{ [medId: string]: number }>({});

  const handleAddLine = () => {
    if (!selectedMedId || qty <= 0) {
      showNotice('warning', 'Tindakan Ditolak: Silakan pilih obat dan tentukan jumlah permintaan yang valid!');
      return;
    }
    if (requestLines.some(l => l.medicineId === selectedMedId)) {
      showNotice('warning', 'Tindakan Ditolak: Obat ini sudah tercatat dalam daftar permintaan!');
      return;
    }
    setRequestLines([...requestLines, { medicineId: selectedMedId, requestedQty: qty }]);
    setSelectedMedId('');
    setMSearchTerm('');
    setQty(0);
  };

  const handleRemoveLine = (idx: number) => {
    setRequestLines(requestLines.filter((_, i) => i !== idx));
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const unitIdToUse = activeRole === 'unit' || activeRole === 'farmasi' ? activeUnitId : targetUnitId;
    
    if (!unitIdToUse) {
      showNotice('error', 'Gagal mengajukan: Silakan pilih unit asal permintaan!');
      return;
    }
    if (requestLines.length === 0) {
      showNotice('error', 'Gagal mengajukan: Mohon masukkan minimal 1 item obat dalam draf ampra!');
      return;
    }

    const targetUnit = units.find(u => u.id === unitIdToUse);

    const newAmpra: Ampra = {
      id: `AMP-${Date.now().toString().slice(-4)}`,
      date: systemDate,
      sourceUnitId: unitIdToUse,
      cycleType: cycleType,
      status: 'Diajukan',
      items: requestLines.map(l => ({
        medicineId: l.medicineId,
        requestedQty: l.requestedQty,
        approvedQty: l.requestedQty // Default matches requests before Gudang reviews
      })),
      verifiedGudang: false,
      verifiedAPJ: false,
      verifiedUnit: false,
      timestamp: new Date().toISOString(),
      unitOfficer: userName || targetUnit?.manager || 'Petugas Unit'
    };

    onCreateAmpra(newAmpra);
    setShowCreateModal(false);
    setRequestLines([]);
    showNotice('success', `Rencana ampra ${newAmpra.id} berhasil diajukan oleh Unit! Menunggu Petugas Gudang menyiapkan alokasi stok.`);
  };

  // Prepare allocation defaults
  const startReview = (ampra: Ampra) => {
    setReviewingAmpraId(ampra.id);
    const initialMap: { [medId: string]: number } = {};
    ampra.items.forEach(item => {
      // Intelligently suggest up to request quantity, bounded by actual Gudang stock
      const gudangStock = stocks['gudang']?.[item.medicineId]?.total || 0;
      initialMap[item.medicineId] = Math.min(item.requestedQty, gudangStock);
    });
    setAllocationMap(initialMap);
  };

  const submitAllocation = (ampra: Ampra) => {
    // Save allocation numbers
    const updatedItems = ampra.items.map(item => ({
      ...item,
      approvedQty: allocationMap[item.medicineId] ?? item.requestedQty
    }));

    onUpdateAmpraStatus(ampra.id, {
      items: updatedItems,
      status: 'Disiapkan',
      verifiedGudang: true,
      gudangOfficer: userName || 'Petugas Gudang'
    });

    setReviewingAmpraId(null);
    showNotice('success', 'Alokasi obat berhasil disiapkan & disimpan oleh Gudang. Buku Ampra telah ditandatangani Gudang. Menunggu serah terima penerimaan fisik di Unit.');
  };

  const confirmReceiptByUnit = (ampra: Ampra) => {
    onUpdateAmpraStatus(ampra.id, {
      status: 'Diterima',
      verifiedUnit: true,
      unitOfficer: userName || 'Petugas Unit'
    });
    showNotice('success', 'Fisik obat dinyatakan DITERIMA dengan baik di unit. Menunggu VERIFIKASI AKHIR oleh Apoteker Penanggung Jawab (APJ) puskesmas.');
  };

  const confirmAPJVerification = (ampra: Ampra) => {
    onUpdateAmpraStatus(ampra.id, {
      status: 'Selesai',
      verifiedAPJ: true,
      apjName: userName || 'Ami Rahmawati, S.Farm, Apt',
      noBAP: `BA-AMP/GUD/${systemDate}/${ampra.id.split('-')[1]}`
    });
    showNotice('success', 'Diverifikasi oleh Apoteker Penanggung Jawab! Stok keluar dari gudang secara otomatis diinput ke stok masuk unit tujuan.');
  };

  return (
    <div className="space-y-6" id="ampra-panel">
      {/* Header and Toggle Button */}
      <div className="flex flex-wrap justify-between items-center gap-4" id="ampra-header-bar">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 font-display">Sistem Pelayanan Ampra Unit & Jejaring</h2>
          <p className="text-xs text-slate-500">
            Siklus usulan kebutuhan obat, alokasi gudang, tanda tangan serah terima, dan verifikasi APJ terintegrasi
          </p>
        </div>

        {/* Buttons based on role */}
        {(activeRole === 'unit' || activeRole === 'farmasi' || activeRole === 'gudang') && (
          <button
            onClick={() => {
              setTargetUnitId(activeRole === 'unit' || activeRole === 'farmasi' ? activeUnitId : '');
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-sm"
            id="new-ampra-trigger"
          >
            <Plus className="w-4 h-4" /> Buat Permintaan Ampra (LPLPO/Buku)
          </button>
        )}
      </div>

      {/* active role indicator */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-100 text-xs text-slate-600 shadow-3xs">
        <span className="font-bold text-slate-700">Akses Mandat:</span>
        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold uppercase">{activeRole === 'farmasi' ? 'Petugas Ruang Farmasi' : activeRole === 'gudang' ? 'Petugas Gudang' : activeRole === 'apj' ? 'Apoteker Penanggung Jawab (APJ)' : 'Petugas Unit / Pustu'}</span>
        {activeRole === 'unit' && (
          <span>Unit Aktif: <b className="text-slate-800">{units.find(u => u.id === activeUnitId)?.name || activeUnitId}</b></span>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-5 space-y-6" id="ampra-creator-card">
          <div className="flex border-b border-slate-100 pb-3 justify-between items-center bg-slate-50 -mx-5 -mt-5 p-5">
            <h3 className="font-semibold text-slate-800 font-display">
              {activeRole === 'unit' ? 'LPLPO / Buku Permintaan Ampra Unit' : 'Buat Permintaan Ampra Sediaan Farmasi'}
            </h3>
            <button onClick={() => setShowCreateModal(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">
              Batal
            </button>
          </div>

          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Pengusul (Tujuan Stok)</label>
                {activeRole === 'unit' || activeRole === 'farmasi' ? (
                  <input
                    type="text"
                    disabled
                    value={units.find(u => u.id === activeUnitId)?.name || activeUnitId}
                    className="w-full border border-slate-200 bg-slate-100 text-slate-600 rounded px-2.5 py-1.5 text-xs font-semibold"
                  />
                ) : (
                  <select
                    value={targetUnitId}
                    onChange={(e) => setTargetUnitId(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500 rounded px-2.5 py-1.5 text-xs text-slate-700"
                    id="modal-unit-select"
                    required
                  >
                    <option value="">-- Pilih Unit / Pustu --</option>
                    {units.filter(u => u.id !== 'gudang').map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.description})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Siklus Permintaan</label>
                <select
                  value={cycleType}
                  onChange={(e) => setCycleType(e.target.value as 'Harian' | 'Bulanan' | 'Insidentil')}
                  className="w-full border border-slate-200 bg-slate-50 outline-none rounded px-2.5 py-1.5 text-xs text-slate-700"
                  id="cycle-type-select"
                >
                  <option value="Harian">Ampra Harian (Internal, IGD, VK, dll)</option>
                  <option value="Bulanan">LPLPO Bulanan (Pustu / Jejaring)</option>
                  <option value="Insidentil">Insidentil (Kondisional / Sesuai Stok)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Diajukan Oleh</label>
                <input
                  type="text"
                  disabled
                  value={userName || 'Petugas Unit'}
                  className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Request row inputs */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tambahkan Sediaan Dalam Usulan:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-8 text-left">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Cari & Pilih Nama Obat</label>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="🔍 Ketik nama obat..."
                      value={mSearchTerm}
                      onChange={(e) => setMSearchTerm(e.target.value)}
                      className="w-full border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2.5 py-1 text-xs text-slate-700 placeholder-slate-400"
                      id="ampra-med-search"
                    />
                    <select
                      value={selectedMedId}
                      onChange={(e) => setSelectedMedId(e.target.value)}
                      className="w-full border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2.5 py-1.5 text-xs text-slate-700"
                      id="ampra-med-selector"
                    >
                      <option value="">-- {filteredMedicines.length === 0 ? "Tidak ada sediaan cocok" : `Hubungkan Sediaan (${filteredMedicines.length} ditemukan)`} --</option>
                      {filteredMedicines.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Jumlah Ampra (Pcs)</label>
                  <input
                    type="number"
                    min="1"
                    value={qty || ''}
                    onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                    placeholder="Saran Kebutuhan"
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5 text-xs text-slate-700"
                    id="ampra-qty-input"
                  />
                </div>

                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center transition"
                    id="add-ampra-line-btn"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Usulan Table */}
              {requestLines.length > 0 && (
                <div className="border border-slate-250 rounded-xl bg-white overflow-x-auto" id="added-ampra-lines">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="p-3">Obat</th>
                        <th className="p-3">Satuan</th>
                        <th className="p-3">Permintaan</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {requestLines.map((line, idx) => {
                        const m = medicines.find(med => med.id === line.medicineId);
                        return (
                          <tr key={idx} className="hover:bg-slate-55">
                            <td className="p-3 font-semibold text-slate-800">{m ? m.name : 'Unknown'}</td>
                            <td className="p-3 text-slate-500 text-xs">{m?.unit}</td>
                            <td className="p-3 font-bold text-slate-700">{line.requestedQty}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
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
                  setShowCreateModal(false);
                  setRequestLines([]);
                }}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                id="submit-ampra-btn"
              >
                Kirim Usulan Kebutuhan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REVIEW / ALLOCATION BOX (POPS UP WHEN GUDANG OFFICER IS PREPARING A SPECIFIC REQUEST) */}
      {reviewingAmpraId && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-md p-5 space-y-6 animate-pulse-once" id="gudang-allocation-card">
          {(() => {
            const reviewingAmpra = ampras.find(a => a.id === reviewingAmpraId);
            if (!reviewingAmpra) return null;
            const sourceUnit = units.find(u => u.id === reviewingAmpra.sourceUnitId);
            return (
              <>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 font-display">Tinjau Alokasi Kebutuhan &mdash; {reviewingAmpra.id}</h3>
                    <p className="text-xs text-slate-500">Unit Pengusul: <b>{sourceUnit?.name}</b></p>
                  </div>
                  <button
                    onClick={() => setReviewingAmpraId(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1"
                  >
                    Batal Tinjau
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
                    Sesuai instruksi puskesmas, Petugas Gudang bertugas mencocokkan jumlah stok keluar manual/kartu dengan ketersediaan fisik gudang agar akurat.
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto" id="reviewing-ampra-table-box">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                          <th className="p-3">Obat</th>
                          <th className="p-3">Stok Gudang</th>
                          <th className="p-3">Diminta Unit</th>
                          <th className="p-3">Alokasi Disetujui (Gudang)</th>
                          <th className="p-3 text-center">Status Sisa Stok</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {reviewingAmpra.items.map((item, idx) => {
                          const med = medicines.find(m => m.id === item.medicineId);
                          const gudStock = stocks['gudang']?.[item.medicineId]?.total || 0;
                          const currentAlloc = allocationMap[item.medicineId] ?? 0;

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-3">
                                <p className="font-bold text-slate-800">{med ? med.name : 'Unknown'}</p>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono font-bold">
                                  {med?.id}
                                </span>
                              </td>
                              <td className="p-3 font-semibold text-slate-700">{gudStock} pcs</td>
                              <td className="p-3 font-bold text-slate-800 bg-blue-50/50">{item.requestedQty} pcs</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max={gudStock}
                                    value={currentAlloc}
                                    onChange={(e) => {
                                      const val = Math.min(gudStock, Math.max(0, parseInt(e.target.value) || 0));
                                      setAllocationMap({ ...allocationMap, [item.medicineId]: val });
                                    }}
                                    className="w-24 border border-slate-300 rounded px-2 py-1 font-bold text-slate-800 text-xs bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setAllocationMap({ ...allocationMap, [item.medicineId]: item.requestedQty })}
                                    className="text-[10px] text-indigo-600 hover:underline font-semibold"
                                  >
                                    Samakan
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                {gudStock < item.requestedQty ? (
                                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded flex items-center gap-1 w-fit mx-auto">
                                    <AlertTriangle className="w-3 h-3" /> Kurang {item.requestedQty - gudStock}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded w-fit mx-auto block">
                                    Aman (Sisa {gudStock - currentAlloc})
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setReviewingAmpraId(null)}
                      className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => submitAllocation(reviewingAmpra)}
                      className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                      id="save-allocation-btn"
                    >
                      Konfirmasi Sedia & Tanda Tangan Gudang
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* AMPRA ACTIVE TRANSACTIONS LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" id="ampra-history-card">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 font-display text-sm">Monitoring & Logistik Ampra Puskesmas</h3>
        </div>

        {ampras.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <ClipboardList className="w-12 h-12 text-slate-300" />
            <p className="font-medium">Belum ada usulan ampra terdaftar.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100" id="ampras-rows-list">
            {ampras.map((amp) => {
              const sourceUnit = units.find(u => u.id === amp.sourceUnitId);
              const totalItemsRequested = amp.items.reduce((sum, item) => sum + item.requestedQty, 0);
              const totalItemsApproved = amp.items.reduce((sum, item) => sum + item.approvedQty, 0);

              return (
                <div key={amp.id} className="p-5 hover:bg-slate-50/50 transition-colors" id={`amp-row-${amp.id}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* ID & Source unit card */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-700 px-2 py-0.5 bg-slate-100 rounded-md">
                          {amp.id}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          amp.cycleType === 'Bulanan' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-800'
                        }`}>
                          {amp.cycleType === 'Bulanan' ? 'Bulanan (LPLPO)' : 'Harian / Unit'}
                        </span>
                        
                        <p className="text-xs text-slate-400">Tanggal: <b className="text-slate-600">{amp.date}</b></p>
                      </div>

                      <h4 className="text-sm font-bold text-slate-800">
                        Mutasi ke: <span className="text-indigo-650">{sourceUnit?.name}</span>
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                        {sourceUnit?.description}
                      </p>
                    </div>

                    {/* Status Step badge */}
                    <div className="flex flex-col sm:items-end gap-1.5">
                      <span className="text-xs text-slate-400">Level Alur:</span>
                      
                      {amp.status === 'Diajukan' && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Diajukan Unit (Menunggu Gudang)
                        </span>
                      )}
                      {amp.status === 'Disiapkan' && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" /> Disiapkan Gudang (Menunggu Serah Terima Unit)
                        </span>
                      )}
                      {amp.status === 'Diterima' && (
                        <span className="bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Fisik Diterima Unit (Menunggu Verifikasi APJ)
                        </span>
                      )}
                      {amp.status === 'Selesai' && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-250 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Selesai (Diverifikasi APJ)
                        </span>
                      )}
                    </div>

                    {/* Dynamic Action Area based on role and stage */}
                    <div className="flex flex-col items-start sm:items-end justify-center w-full sm:w-auto sm:min-w-[200px] border-t sm:border-t-0 pt-3 sm:pt-0 border-dashed border-slate-200">
                      
                      {/* Scenario 1: Gudang officer allocated physical items */}
                      {amp.status === 'Diajukan' && activeRole === 'gudang' && (
                        <button
                          onClick={() => startReview(amp)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition"
                        >
                          <ClipboardList className="w-4 h-4" /> Siapkan Obat & Tanda Tangan
                        </button>
                      )}

                      {/* Scenario 2: Unit officer confirms medicine arrived */}
                      {amp.status === 'Disiapkan' && (activeRole === 'unit' || activeRole === 'farmasi') && (
                        <button
                          onClick={() => confirmReceiptByUnit(amp)}
                          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                        >
                          <CheckCircle className="w-4 h-4" /> Konfirmasi Obat Tiba (Unit)
                        </button>
                      )}

                      {/* Scenario 3: APJ Verifies and finalizes stock transfer */}
                      {amp.status === 'Diterima' && activeRole === 'apj' && (
                        <button
                          onClick={() => confirmAPJVerification(amp)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow"
                        >
                          <ShieldCheck className="w-4 h-4" /> Verifikasi Final APJ
                        </button>
                      )}

                      {/* Fallback alerts if role doesn't match action */}
                      {amp.status === 'Diajukan' && activeRole !== 'gudang' && (
                        <span className="text-[11px] text-amber-600 font-medium italic">
                          Menunggu petugas gudang (Gudang Role)
                        </span>
                      )}
                      {amp.status === 'Disiapkan' && activeRole !== 'unit' && activeRole !== 'farmasi' && (
                        <span className="text-[11px] text-indigo-600 font-medium italic">
                          Menunggu pengusul tanda tangan serah terima (Unit Role)
                        </span>
                      )}
                      {amp.status === 'Diterima' && activeRole !== 'apj' && (
                        <span className="text-[11px] text-blue-600 font-semibold italic">
                          Menunggu verifikasi akhir Apoteker Penanggung Jawab
                        </span>
                      )}
                      {amp.status === 'Selesai' && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] text-slate-500 font-medium">BAP No: <b className="font-mono text-slate-700">{amp.noBAP}</b></span>
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3" /> Transaksi Selesai & Sah
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AMPRA DETAILED LINE ITEMS PREVIEW */}
                  <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs">
                    <p className="font-bold text-slate-500 text-[10px] uppercase mb-2 tracking-wide flex items-center justify-between">
                      <span>Rincian Sediaan Farmasi (Permintaan vs Alokasi):</span>
                      {amp.status === 'Selesai' && (
                        <span className="text-emerald-700 font-bold text-[9px] lowercase bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 flex items-center gap-1">
                          <Printer className="w-3 h-3" /> Berita Acara Penyerahan Bermaterai + TTD Basah
                        </span>
                      )}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {amp.items.map((line, idx) => {
                        const med = medicines.find(m => m.id === line.medicineId);
                        return (
                          <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-150 flex flex-col justify-between shadow-2xs space-y-1 bg-gradient-to-b from-white to-slate-50">
                            <p className="font-bold text-slate-800 leading-tight">{med ? med.name : 'Unknown'}</p>
                            <span className="text-[9px] text-slate-400">{med?.unit}</span>
                            
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                              <span className="text-slate-500">Usulan: <b>{line.requestedQty}</b></span>
                              <span className="text-slate-500 flex items-center gap-1">
                                Disetujui: <b className={`font-bold ${line.approvedQty < line.requestedQty ? 'text-amber-600' : 'text-slate-800'}`}>{line.approvedQty}</b>
                              </span>
                            </div>
                            
                            {/* Visual flow indicator */}
                            {amp.status === 'Selesai' && (
                              <div className="mt-1 pt-1 border-t border-dashed border-emerald-100 flex justify-between items-center text-[10px] text-emerald-800 bg-emerald-50/50 px-1 py-0.2 rounded font-medium">
                                <span className="flex items-center gap-0.5">Gudang &rarr;</span>
                                <span className="font-bold text-emerald-700">+{line.approvedQty} Unit</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-slate-500 border-t border-slate-150 pt-2 items-center">
                      <span>Pengusul: <b className="text-slate-700">{amp.unitOfficer}</b></span>
                      {amp.gudangOfficer && <span>Petugas Pelayan: <b className="text-slate-700">{amp.gudangOfficer}</b></span>}
                      {amp.verifiedAPJ && <span>Verifikator APJ: <b className="text-emerald-700 font-bold">{amp.apjName}</b></span>}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
