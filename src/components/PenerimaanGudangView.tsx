/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Medicine, Receipt, ReceiptItem, getDrugDefaultPrice } from '../types';
import { Plus, Check, Trash2, ShieldCheck, ClipboardCheck, ArrowDownLeft, AlertCircle, Sparkles, Edit, X } from 'lucide-react';

interface PenerimaanGudangViewProps {
  medicines: Medicine[];
  receipts: Receipt[];
  activeRole: 'apj' | 'gudang' | 'farmasi' | 'unit';
  userName: string;
  onAddReceipt: (receipt: Receipt) => void;
  onVerifyReceipt: (receiptId: string, apjName: string) => void;
  onDeleteReceipt?: (receiptId: string) => void;
  onUpdateReceipt?: (receiptId: string, updatedReceipt: Receipt) => void;
  systemDate: string;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onNavigateChange?: (view: string) => void;
}

export default function PenerimaanGudangView({
  medicines,
  receipts,
  activeRole,
  userName,
  onAddReceipt,
  onVerifyReceipt,
  onDeleteReceipt,
  onUpdateReceipt,
  systemDate,
  onNotify,
  onNavigateChange,
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
  const [mSearchTerm, setMSearchTerm] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [batchNo, setBatchNo] = useState('');
  const [expDate, setExpDate] = useState('');
  const [fundSource, setFundSource] = useState<'DAK' | 'DAU' | 'Program' | 'JKN' | 'PBF'>('DAK');
  const [priceInput, setPriceInput] = useState<number>(0);

  // EDIT STATE FOR MODAL
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  
  // EDIT FORM STATE
  const [editSourceType, setEditSourceType] = useState<'Instalasi Farmasi Kota' | 'PBF'>('Instalasi Farmasi Kota');
  const [editDocumentType, setEditDocumentType] = useState<'BAP' | 'Faktur' | 'Surat Jalan'>('BAP');
  const [editDocumentNo, setEditDocumentNo] = useState('');
  const [editGudangOfficer, setEditGudangOfficer] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editItems, setEditItems] = useState<ReceiptItem[]>([]);

  // Selected item addition inside Edit Modal
  const [editSelectedMedId, setEditSelectedMedId] = useState('');
  const [editMSearchTerm, setEditMSearchTerm] = useState('');
  const [editQty, setEditQty] = useState<number>(0);
  const [editBatchNo, setEditBatchNo] = useState('');
  const [editExpDate, setEditExpDate] = useState('');
  const [editFundSource, setEditFundSource] = useState<'DAK' | 'DAU' | 'Program' | 'JKN' | 'PBF'>('DAK');
  const [editPrice, setEditPrice] = useState<number>(0);

  const initiateEdit = (rcp: Receipt) => {
    setEditingReceipt(rcp);
    setEditSourceType(rcp.sourceType);
    setEditDocumentType(rcp.documentType);
    setEditDocumentNo(rcp.documentNo);
    setEditGudangOfficer(rcp.gudangOfficer);
    setEditDate(rcp.date);
    setEditItems([...rcp.items]);
  };

  const handleAddEditItem = () => {
    if (!editSelectedMedId || editQty <= 0 || !editBatchNo || !editExpDate) {
      showNotice('warning', 'Peringatan: Mohon pilih obat, isi jumlah masuk, nomor batch, dan kedaluwarsa dengan lengkap!');
      return;
    }

    const priceToSet = editPrice > 0 ? editPrice : getDrugDefaultPrice(editSelectedMedId);

    const newItem: ReceiptItem = {
      medicineId: editSelectedMedId,
      quantity: editQty,
      batchNo: editBatchNo,
      expDate: editExpDate,
      source: editFundSource,
      condition: 'Baik',
      price: priceToSet
    };

    setEditItems([...editItems, newItem]);
    
    // Clear item fields
    setEditSelectedMedId('');
    setEditMSearchTerm('');
    setEditQty(0);
    setEditBatchNo('');
    setEditExpDate('');
    setEditPrice(0);
  };

  const handleRemoveEditItem = (idx: number) => {
    setEditItems(editItems.filter((_, i) => i !== idx));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt || !onUpdateReceipt) return;

    if (!editDocumentNo || !editGudangOfficer || !editDate) {
      showNotice('error', 'Gagal menyimpan: Informasi dokumen utama tidak boleh kosong!');
      return;
    }

    if (editItems.length === 0) {
      showNotice('error', 'Gagal menyimpan: Mohon masukkan minimal 1 item obat yang diterima!');
      return;
    }

    const updatedRcp: Receipt = {
      ...editingReceipt,
      sourceType: editSourceType,
      documentType: editDocumentType,
      documentNo: editDocumentNo,
      gudangOfficer: editGudangOfficer,
      date: editDate,
      items: editItems
    };

    onUpdateReceipt(editingReceipt.id, updatedRcp);
    setEditingReceipt(null);
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(mSearchTerm.toLowerCase()) || 
    m.type.toLowerCase().includes(mSearchTerm.toLowerCase()) || 
    m.group.toLowerCase().includes(mSearchTerm.toLowerCase())
  );

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
      price: priceInput || getDrugDefaultPrice(selectedMedId)
    };

    setItems([...items, newItem]);
    // Reset item form
    setSelectedMedId('');
    setMSearchTerm('');
    setQty(0);
    setBatchNo('');
    setExpDate('');
    setPriceInput(0);
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
      {/* Ecosystem Visual Integration Navigator */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 rounded p-1 text-white">
            <ClipboardCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-emerald-800">Alur Ekosistem SIFP:</span>
          <span className="text-emerald-600 font-medium whitespace-nowrap">Dashboard &rarr; <span className="font-bold underline decoration-emerald-300">Penerimaan Gudang</span> &rarr;</span>
          <button
            onClick={() => onNavigateChange?.('ampra')}
            className="text-emerald-700 hover:text-emerald-900 border border-emerald-200 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors flex items-center gap-1 font-semibold"
          >
            Distribusi / Ampra Unit
            <ArrowDownLeft className="w-3 h-3 rotate-[135deg]" />
          </button>
        </div>
        <div className="text-[10px] text-emerald-600/70 animate-pulse font-mono flex items-center gap-1">
          <Database className="w-3 h-3" /> Data Tersinkronisasi Global
        </div>
      </div>

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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
                <div className="sm:col-span-1 md:col-span-2 text-left">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Cari & Pilih Obat</label>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="🔍 Ketik nama obat..."
                      value={mSearchTerm}
                      onChange={(e) => setMSearchTerm(e.target.value)}
                      className="w-full border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2.5 py-1 text-xs text-slate-700 placeholder-slate-400"
                      id="medicine-search-input"
                    />
                    <select
                      value={selectedMedId}
                      onChange={(e) => {
                        const mId = e.target.value;
                        setSelectedMedId(mId);
                        if (mId) {
                          setPriceInput(getDrugDefaultPrice(mId));
                        } else {
                          setPriceInput(0);
                        }
                      }}
                      className="w-full border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2.5 py-1.5 text-xs text-slate-700 font-medium"
                      id="medicine-item-select"
                    >
                      <option value="">-- {filteredMedicines.length === 0 ? "Tidak ada sediaan cocok" : `Pilih Sediaan (${filteredMedicines.length} ditemukan)`} --</option>
                      {filteredMedicines.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                      ))}
                    </select>
                  </div>
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
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Harga Masuk / Unit (Rp)</label>
                  <input
                    type="number"
                    min="1"
                    value={priceInput || ''}
                    onChange={(e) => setPriceInput(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded px-2.5 py-1 text-xs bg-white text-emerald-700 font-bold"
                    placeholder="Rp 0"
                    id="medicine-price-input"
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
                  <label className="block text-[10px] font-bold text-[slate-500] mb-1 uppercase">Masa Kadaluarsa</label>
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
                        <th className="p-3">Harga Masuk</th>
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
                            <td className="p-3 text-emerald-700 font-bold">Rp {(item.price || 0).toLocaleString('id-ID')}</td>
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
                          <div className="flex flex-col items-center justify-center gap-1.5">
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
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 mx-auto shadow-xs"
                                id={`verify-btn-${rcp.id}`}
                              >
                                <Check className="w-3.5 h-3.5" /> Verifikasi APJ
                              </button>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-semibold italic block">
                                Menunggu Verifikasi APJ
                              </span>
                            )}

                            {/* EDIT BUTTON WITH ROLE RESTRICTION */}
                            {(activeRole === 'apj' || (activeRole === 'gudang' && !rcp.verifiedByAPJ)) && onUpdateReceipt && (
                              <button
                                onClick={() => initiateEdit(rcp)}
                                className="text-[10px] text-teal-650 hover:text-teal-700 font-bold flex items-center gap-1 px-2 py-1 hover:bg-teal-50 rounded-md transition duration-150"
                                title="Edit / Koreksi Dokumen Penerimaan ini"
                                id={`edit-rcp-${rcp.id}`}
                              >
                                <Edit className="w-3 h-3" /> Edit / Koreksi
                              </button>
                            )}

                            {/* DELETE BUTTON WITH ROLE RESTRICTION */}
                            {(activeRole === 'apj' || (activeRole === 'gudang' && !rcp.verifiedByAPJ)) && onDeleteReceipt && (
                              <button
                                onClick={() => onDeleteReceipt(rcp.id)}
                                className="text-[10px] text-red-650 hover:text-red-700 font-bold flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded-md transition duration-150"
                                title="Hapus Penerimaan ini"
                                id={`delete-rcp-${rcp.id}`}
                              >
                                <Trash2 className="w-3 h-3" /> Hapus
                              </button>
                            )}
                          </div>
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
                                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                                      <span>Harga Masuk: <span className="font-bold text-emerald-700">Rp {(line.price ?? getDrugDefaultPrice(line.medicineId)).toLocaleString('id-ID')}</span></span>
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

      {/* PROFESSIONAL EDIT RECEIPT MODAL */}
      {editingReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="edit-receipt-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in duration-200" id="edit-receipt-modal-content">
            
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-teal-600" /> Edit / Koreksi Dokumen Penerimaan Gudang
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID Dokumen: {editingReceipt.id}</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingReceipt(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="p-4 md:p-6 space-y-6 flex-1">
              
              {/* Alert Warning if Already Verified */}
              {editingReceipt.verifiedByAPJ && (
                <div className="p-3 bg-amber-55/60 rounded-lg border border-amber-200 flex gap-3 text-xs text-amber-800">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">Perhatian:</span> Dokumen penerimaan ini telah diverifikasi oleh APJ. 
                    Mengubah item di sini akan otomatis merevisian saldo fisik obat dan detail batch di Gudang secara real-time.
                  </div>
                </div>
              )}

              {/* Grid 1: Document Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Sumber Pengirim</label>
                  <select
                    value={editSourceType}
                    onChange={(e) => setEditSourceType(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Instalasi Farmasi Kota">Instalasi Farmasi Kota</option>
                    <option value="PBF">PBF (Pedagang Besar Farmasi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Jenis Dokumen</label>
                  <select
                    value={editDocumentType}
                    onChange={(e) => setEditDocumentType(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    <option value="BAP">BAP</option>
                    <option value="Faktur">Faktur</option>
                    <option value="Surat Jalan">Surat Jalan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">No. Dokumen</label>
                  <input
                    type="text"
                    value={editDocumentNo}
                    onChange={(e) => setEditDocumentNo(e.target.value)}
                    placeholder="Contoh: BAP/112/2026"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tanggal Dokumen / Masuk</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Petugas Penerima</label>
                  <input
                    type="text"
                    value={editGudangOfficer}
                    onChange={(e) => setEditGudangOfficer(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Sub-section: Items Table in editItems callback */}
              <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50 p-3 md:p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Item Diterima ({editItems.length})</h4>
                  <span className="text-[10px] text-slate-400 font-medium italic">Tambahkan obat baru atau hapus melalui baris pengisian di bawah</span>
                </div>

                {/* Edit Items List */}
                {editItems.length === 0 ? (
                  <div className="p-4 bg-white/60 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                    Belum ada obat dalam rincian ini. Silakan pilih dan masukkan obat.
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-2xs max-h-48 scrollbar-thin">
                    <table className="w-full text-left text-xs" id="table-edit-items-receipt">
                      <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-2 pl-3">Obat</th>
                          <th className="p-2">Batch</th>
                          <th className="p-2 text-rose-600">Kadaluarsa</th>
                          <th className="p-2">Sumber</th>
                          <th className="p-2 text-right">Jumlah</th>
                          <th className="p-2 text-right">Harga Satuan</th>
                          <th className="p-2 text-center w-12">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {editItems.map((it, idx) => {
                          const originalMed = medicines.find(m => m.id === it.medicineId);
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 pl-3 font-medium text-slate-800">{originalMed ? originalMed.name : 'Unknown'}</td>
                              <td className="p-2 font-mono text-slate-600">{it.batchNo}</td>
                              <td className="p-2 text-rose-650 font-medium">{it.expDate}</td>
                              <td className="p-2"><span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-slate-100 text-slate-650">{it.source}</span></td>
                              <td className="p-2 text-right font-bold text-slate-700">{it.quantity} pcs</td>
                              <td className="p-2 text-right font-bold text-emerald-700">Rp {(it.price ?? getDrugDefaultPrice(it.medicineId)).toLocaleString('id-ID')}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditItem(idx)}
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-55 rounded"
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

                {/* Form to insert item inside edit list */}
                <div className="bg-slate-100/90 p-3 rounded-lg border border-slate-200/60 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Obat</label>
                    <input
                      type="text"
                      value={editMSearchTerm}
                      onChange={(e) => setEditMSearchTerm(e.target.value)}
                      placeholder="Cari obat..."
                      className="w-full text-xs p-1.5 bg-white rounded-md border border-slate-200"
                    />
                    <select
                      value={editSelectedMedId}
                      onChange={(e) => {
                        setEditSelectedMedId(e.target.value);
                        const standardPrice = getDrugDefaultPrice(e.target.value);
                        setEditPrice(standardPrice);
                      }}
                      className="w-full text-xs p-1.5 mt-1 bg-white rounded-md border border-slate-200"
                    >
                      <option value="">-- Pilih Obat --</option>
                      {medicines
                        .filter(m => m.name.toLowerCase().includes(editMSearchTerm.toLowerCase()))
                        .map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Batch</label>
                    <input
                      type="text"
                      value={editBatchNo}
                      onChange={(e) => setEditBatchNo(e.target.value.toUpperCase())}
                      placeholder="No Batch"
                      className="w-full text-xs p-1.5 bg-white rounded-md border border-slate-200 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kadaluarsa</label>
                    <input
                      type="date"
                      value={editExpDate}
                      onChange={(e) => setEditExpDate(e.target.value)}
                      className="w-full text-xs p-1.5 bg-white rounded-md border border-slate-200"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Anggaran</label>
                    <select
                      value={editFundSource}
                      onChange={(e) => setEditFundSource(e.target.value as any)}
                      className="w-full text-xs p-1.5 bg-white rounded-md border border-slate-200"
                    >
                      <option value="DAK">DAK</option>
                      <option value="DAU">DAU</option>
                      <option value="Program">Program</option>
                      <option value="JKN">JKN</option>
                      <option value="PBF">PBF</option>
                    </select>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jumlah</label>
                    <input
                      type="number"
                      value={editQty === 0 ? '' : editQty}
                      onChange={(e) => setEditQty(Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full text-xs p-1.5 bg-white rounded-md border border-slate-200"
                    />
                  </div>

                  <div className="md:col-span-1 text-center">
                    <button
                      type="button"
                      onClick={handleAddEditItem}
                      className="w-full text-xs p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md flex items-center justify-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>

                  {/* Pricing field */}
                  <div className="md:col-span-12 mt-2 bg-emerald-55/60 p-2 rounded-md border border-emerald-100 flex flex-wrap items-center gap-4">
                    <label className="text-[10px] font-bold text-emerald-800 uppercase shrink-0">Atur Harga Masuk Khusus:</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">Rp</span>
                      <input
                        type="number"
                        value={editPrice === 0 ? '' : editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        placeholder="Harga masuk"
                        className="text-xs p-1 w-32 bg-white rounded-md border border-slate-200 font-bold text-emerald-700"
                      />
                      <span className="text-[10px] text-slate-400">(Biarkan kosong untuk menggunakan harga acuan obat)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Footer Buttons */}
              <div className="mt-8 border-t border-slate-100 pt-4 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setEditingReceipt(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm transition-all"
                >
                  <Check className="w-4 h-4" /> Simpan Perubahan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
