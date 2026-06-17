/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Medicine, Receipt, ReceiptItem } from '../types';
import { Plus, Check, Trash2, ShieldCheck, ClipboardCheck, ArrowDownLeft, AlertCircle, Sparkles } from 'lucide-react';

interface PenerimaanGudangViewProps {
  medicines: Medicine[];
  receipts: Receipt[];
  activeRole: 'apj' | 'gudang' | 'farmasi' | 'unit';
  userName: string;
  onAddReceipt: (receipt: Receipt) => void;
  onVerifyReceipt: (receiptId: string, apjName: string) => void;
  systemDate: string;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function PenerimaanGudangView({
  medicines,
  receipts,
  activeRole,
  userName,
  onAddReceipt,
  onVerifyReceipt,
  systemDate,
  onNotify,
}: PenerimaanGudangViewProps) {
  // Helpers for notifications
  const showNotice = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    if (onNotify) {
      onNotify(type, message);
    } else {
      alert(message);
    }
  };
  // Add Receipt Form State
  const [showForm, setShowForm] = useState(false);
  const [sourceType, setSourceType] = useState<'Instalasi Farmasi Kota' | 'PBF'>('Instalasi Farmasi Kota');
  const [documentType, setDocumentType] = useState<'BAP' | 'Faktur' | 'Surat Jalan'>('BAP');
  const [documentNo, setDocumentNo] = useState('');
  const [gudangOfficer, setGudangOfficer] = useState(userName || 'Petugas Gudang');
  const [items, setItems] = useState<ReceiptItem[]>([]);

  // Item row form state
  const [selectedMedId, setSelectedMedId] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [batchNo, setBatchNo] = useState('');
  const [expDate, setExpDate] = useState('');
  const [fundSource, setFundSource] = useState<'DAK' | 'DAU' | 'Program' | 'JKN' | 'PBF'>('DAK');

  const handleAddItemRow = () => {
    if (!selectedMedId || qty <= 0 || !batchNo || !expDate) {
      showNotice('error', 'Gagal menambahkan obat: Mohon lengkapi jenis obat, jumlah, nomor batch, dan tanggal kadaluarsa!');
      return;
    }

    const newItem: ReceiptItem = {
      medicineId: selectedMedId,
      quantity: qty,
      batchNo: batchNo,
      expDate: expDate,
      source: fundSource,
      condition: 'Baik',
    };

    setItems([...items, newItem]);
    // Reset item form
    setSelectedMedId('');
    setQty(0);
    setBatchNo('');
    setExpDate('');
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSubmitReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentNo) {
      showNotice('error', 'Gagal mengajukan penerimaan: Mohon isi nomor dokumen!');
      return;
    }
    if (items.length === 0) {
      showNotice('warning', 'Gagal mengajukan penerimaan: Mohon tambahkan minimal 1 item obat!');
      return;
    }

    const newReceipt: Receipt = {
      id: `RCP-${Date.now().toString().slice(-5)}`,
      date: systemDate,
      sourceType: sourceType,
      documentType: documentType,
      documentNo: documentNo,
      items: items,
      verifiedByGudang: true,
      verifiedByAPJ: false, // APJ must verify this manually in the system!
      gudangOfficer: gudangOfficer,
      apjName: '',
      timestamp: new Date().toISOString(),
    };

    onAddReceipt(newReceipt);
    
    // Reset state
    setShowForm(false);
    setDocumentNo('');
    setItems([]);
    showNotice('success', 'Penerimaan berhasil diajukan oleh Petugas Gudang! Menunggu verifikasi Apoteker Penanggung Jawab (APJ) seutuhnya.');
  };

  return (
    <div className="space-y-6" id="receipts-container">
      {/* Header and Toggle Button */}
      <div className="flex flex-wrap justify-between items-center gap-4" id="receipts-header-bar">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 font-display">Penerimaan Sediaan Farmasi</h2>
          <p className="text-xs text-slate-500">Pencatatan obat masuk Gudang Farmasi dari IFK atau PBF Rekanan</p>
        </div>
        
        {activeRole === 'gudang' && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition duration-155 shadow-sm"
            id="register-receipt-btn"
          >
            <Plus className="w-4 h-4" /> Catat Penerimaan Baru
          </button>
        )}
      </div>

      {/* Role Alert warning */}
      {activeRole !== 'gudang' && !showForm && (
        <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Hanya **Petugas Gudang Farmasi** yang dapat menginput penerimaan barang baru. Role Anda saat ini: **{activeRole.toUpperCase()}**.</span>
        </div>
      )}

      {/* Draft form for registering raw receipt */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="receipt-add-card">
          <div className="bg-slate-50 p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 font-display flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Form Penerimaan Sediaan Farmasi (Gudang)
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              Batal
            </button>
          </div>

          <form onSubmit={handleSubmitReceipt} className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sumber Pengiriman</label>
                <select
                  value={sourceType}
                  onChange={(e) => {
                    const val = e.target.value as 'Instalasi Farmasi Kota' | 'PBF';
                    setSourceType(val);
                    // Autofill doc type default
                    setDocumentType(val === 'Instalasi Farmasi Kota' ? 'BAP' : 'Faktur');
                  }}
                  className="w-full border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2 py-1.5 text-xs text-slate-700"
                  id="source-type-select"
                >
                  <option value="Instalasi Farmasi Kota">Instalasi Farmasi Kota (IFK Parepare)</option>
                  <option value="PBF">PBF (Pedagang Besar Farmasi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Dokumen</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as 'BAP' | 'Faktur' | 'Surat Jalan')}
                  className="w-full border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2 py-1.5 text-xs text-slate-700"
                  id="document-type-select"
                >
                  {sourceType === 'Instalasi Farmasi Kota' ? (
                    <>
                      <option value="BAP">Berita Acara Penyerahan (BAP)</option>
                      <option value="Surat Jalan">Surat Jalan</option>
                    </>
                  ) : (
                    <>
                      <option value="Faktur">Faktur Dagang</option>
                      <option value="Surat Jalan">Surat Jalan / Delivery Order</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor Dokumen (Fisik)</label>
                <input
                  type="text"
                  placeholder="Contoh: BAP/IFK/0626-081"
                  value={documentNo}
                  onChange={(e) => setDocumentNo(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-700"
                  id="document-no-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Petugas Penerima Gudang</label>
                <input
                  type="text"
                  value={gudangOfficer}
                  onChange={(e) => setGudangOfficer(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-700"
                  id="gudang-officer-input"
                  required
                />
              </div>
            </div>

            {/* Line items creator */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Item Farmasi yang Masuk:</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                <div className="sm:col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Pilih Obat</label>
                  <select
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="w-full border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2.5 py-1.5 text-xs text-slate-700"
                    id="medicine-item-select"
                  >
                    <option value="">-- Hubungkan Sediaan --</option>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Jumlah (Pcs/Botol)</label>
                  <input
                    type="number"
                    min="1"
                    value={qty || ''}
                    onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded px-2.5 py-1 text-xs bg-white text-slate-700"
                    placeholder="Contoh: 1000"
                    id="medicine-qty-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">No. Batch</label>
                  <input
                    type="text"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value.toUpperCase())}
                    className="w-full border border-slate-200 rounded px-2.5 py-1 text-xs bg-white text-slate-700 font-mono"
                    placeholder="B-PCT99"
                    id="medicine-batch-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Masa Kadaluarsa</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full border border-slate-200 rounded px-2.5 py-1 text-xs bg-white text-slate-700"
                    id="medicine-exp-input"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center pt-2 gap-2">
                <div>
                  <label className="inline-block text-xs font-semibold text-slate-600 mr-2">Sumber Anggaran / Dana:</label>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5" id="funds-radio-group">
                    {(['DAK', 'DAU', 'Program', 'JKN'] as const).map((src) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setFundSource(src)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${fundSource === src ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        {src}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-lg flex items-center gap-1 transition"
                  id="add-item-row-btn"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambahkan Obat
                </button>
              </div>

              {/* Added table preview */}
              {items.length > 0 && (
                <div className="border border-slate-250 rounded-xl bg-white overflow-x-auto" id="added-items-preview">
                  <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                        <th className="p-3">Obat</th>
                        <th className="p-3">Jumlah</th>
                        <th className="p-3">No. Batch</th>
                        <th className="p-3">Tanggal Exp</th>
                        <th className="p-3">Anggaran</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {items.map((item, idx) => {
                        const med = medicines.find(m => m.id === item.medicineId);
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-slate-800">{med ? med.name : 'Unknown'}</td>
                            <td className="p-3 font-medium">{item.quantity} {med?.unit}</td>
                            <td className="p-3 font-mono text-slate-600">{item.batchNo}</td>
                            <td className="p-3 text-slate-600">{item.expDate}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                {item.source}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
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
                className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
                id="submit-receipt-btn"
              >
                <ClipboardCheck className="w-4 h-4 shrink-0" /> Tanda Tangani & Ajukan ke APJ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Receipts list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" id="receipts-list-card">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 font-display text-sm">Riwayat Dokumen Penerimaan Gudang</h3>
        </div>

        {receipts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <ArrowDownLeft className="w-12 h-12 text-slate-300" />
            <p className="font-medium">Belum ada riwayat penerimaan obat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" id="receipts-log-table-container">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-55 border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase">
                  <th className="p-4">Kode ID</th>
                  <th className="p-4">Tanggal Terima</th>
                  <th className="p-4">Jenis Dokumen</th>
                  <th className="p-4">No. Dokumen</th>
                  <th className="p-4">Sumber / PBF</th>
                  <th className="p-4">Total Item</th>
                  <th className="p-4">Status & Verifikasi</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {receipts.map((rcp) => {
                  const totalItems = rcp.items.reduce((sum, i) => sum + i.quantity, 0);

                  return (
                    <React.Fragment key={rcp.id}>
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-700 font-mono">{rcp.id}</td>
                        <td className="p-4 font-medium text-slate-600">{rcp.date}</td>
                        <td className="p-4 text-slate-600">{rcp.documentType}</td>
                        <td className="p-4 font-mono font-medium text-slate-800">{rcp.documentNo}</td>
                        <td className="p-4">
                          <span className="font-medium text-slate-800">{rcp.sourceType}</span>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">{totalItems} pcs</td>
                        <td className="p-4">
                          {rcp.verifiedByAPJ ? (
                            <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2.5 py-1 rounded-full w-fit border border-emerald-100">
                              <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi APJ
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-amber-700 font-bold text-[11px] bg-amber-50 px-2.5 py-1 rounded-full w-fit border border-amber-100 animate-pulse">
                              <AlertCircle className="w-3.5 h-3.5" /> Menunggu Verifikasi
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {rcp.verifiedByAPJ ? (
                            <span className="text-[10px] text-slate-400 font-medium block">
                              Terverifikasi oleh:<br />
                              <span className="font-bold text-slate-600">{rcp.apjName || 'APJ'}</span>
                            </span>
                          ) : activeRole === 'apj' ? (
                            <button
                              onClick={() => {
                                const apjName = userName || 'Ami Rahmawati, S.Farm, Apt';
                                onVerifyReceipt(rcp.id, apjName);
                                showNotice('success', `Dokumen ${rcp.documentNo} Berhasil Diverifikasi oleh Apoteker Penanggung Jawab! Stok gudang telah terupdate secara otomatis.`);
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 mx-auto"
                              id={`verify-btn-${rcp.id}`}
                            >
                              <Check className="w-3.5 h-3.5" /> Verifikasi APJ
                            </button>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-semibold italic block">
                              Butuh Login APJ
                            </span>
                          )}
                        </td>
                      </tr>
                      
                      {/* Nested details drawer view */}
                      <tr className="bg-slate-50/40">
                        <td colSpan={8} className="p-4 border-b border-slate-100">
                          <div className="px-4 py-2 border-l-2 border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Item Rincian Penerimaan:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {rcp.items.map((line, lIdx) => {
                                const medNode = medicines.find(m => m.id === line.medicineId);
                                return (
                                  <div key={lIdx} className="bg-white p-2.5 rounded-lg border border-slate-150 shadow-2xs space-y-1">
                                    <p className="font-bold text-slate-800 text-xs">{medNode ? medNode.name : 'Unknown'}</p>
                                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                                      <span>Qty: <span className="font-bold text-slate-700">{line.quantity} pcs</span></span>
                                      <span>Batch: <span className="font-mono text-slate-600">{line.batchNo}</span></span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                                      <span>Exp: <span className="text-rose-600">{line.expDate}</span></span>
                                      <span>Sumber: <span className="text-slate-600 bg-slate-100 px-1 rounded text-[9px] font-bold">{line.source}</span></span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-3 flex gap-4 text-[10px] text-slate-500 border-t border-slate-100 pt-2">
                              <span>Petugas Penerima: <b className="text-slate-700">{rcp.gudangOfficer}</b></span>
                              {rcp.verifiedByAPJ && <span>Diverifikasi Oleh: <b className="text-slate-700">{rcp.apjName}</b></span>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
