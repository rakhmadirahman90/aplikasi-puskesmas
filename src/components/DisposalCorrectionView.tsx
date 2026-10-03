import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArchiveRestore, CheckCircle2, Plus, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { Ampra, DailyUsage, Disposal, Medicine, Prescription, Receipt, StockStore } from '../types';

type Notice = (type:'success'|'error'|'warning'|'info', message:string)=>void;
interface Props {
  medicines: Medicine[]; stocks: StockStore; disposals: Disposal[]; receipts: Receipt[]; ampras: Ampra[];
  prescriptions: Prescription[]; usages: DailyUsage[]; activeRole: string; userName: string; systemDate: string;
  onProcessDisposal:(d:Disposal)=>Promise<boolean>; onReverse:(kind:string,id:string,reason:string)=>Promise<boolean>; onNotify?:Notice;
}
type Line={medicineId:string;batchNo:string;qty:number;reason:string};

export default function DisposalCorrectionView(p:Props){
  const [tab,setTab]=useState<'disposal'|'correction'>('disposal');
  const [type,setType]=useState<'Retur'|'Kadaluarsa'>('Retur');
  const [documentNo,setDocumentNo]=useState('');
  const [recipientName,setRecipientName]=useState('');
  const [medicineId,setMedicineId]=useState('');
  const [batchNo,setBatchNo]=useState('');
  const [qty,setQty]=useState(0);
  const [reason,setReason]=useState('');
  const [lines,setLines]=useState<Line[]>([]);
  const [busy,setBusy]=useState(false);
  const [reverseTarget,setReverseTarget]=useState<{kind:string;id:string;label:string}|null>(null);
  const [reverseReason,setReverseReason]=useState('');
  const canFinalize=p.activeRole==='apj'||p.activeRole==='admin';
  const gudang=p.stocks.gudang||{};
  const batches=useMemo(()=>medicineId?(gudang[medicineId]?.batches||[]):[],[gudang,medicineId]);
  const medName=(id:string)=>p.medicines.find(m=>m.id===id)?.name||id;

  const addLine=()=>{
    if(!medicineId||!batchNo||qty<=0||reason.trim().length<3){p.onNotify?.('warning','Lengkapi obat, batch, jumlah dan alasan.');return;}
    const b=batches.find(x=>x.batchNo===batchNo);
    if(!b||qty>b.quantity){p.onNotify?.('error','Jumlah melebihi stok batch Gudang.');return;}
    setLines(v=>[...v,{medicineId,batchNo,qty,reason:reason.trim()}]); setMedicineId('');setBatchNo('');setQty(0);setReason('');
  };
  const submit=async()=>{
    if(!canFinalize){p.onNotify?.('warning','Finalisasi Retur/Kadaluarsa memerlukan APJ atau administrator.');return;}
    if(!documentNo.trim()||lines.length===0||(type==='Retur'&&!recipientName.trim())){p.onNotify?.('warning','Nomor dokumen, rincian obat, dan penerima untuk Retur wajib diisi.');return;}
    setBusy(true);
    const ok=await p.onProcessDisposal({id:`DSP-${Date.now()}`,date:p.systemDate,type,documentNo:documentNo.trim(),items:lines,isApprovedAPJ:true,officerName:p.userName,recipientName:type==='Retur'?recipientName.trim():undefined,timestamp:new Date().toISOString()});
    setBusy(false); if(ok){setDocumentNo('');setRecipientName('');setLines([]);}
  };
  const finalized=useMemo(()=>[
    ...p.receipts.filter(x=>x.verifiedByAPJ).map(x=>({kind:'receipt',id:x.id,label:`Penerimaan • ${x.documentNo}`,date:x.date})),
    ...p.ampras.filter(x=>x.status==='Selesai').map(x=>({kind:'ampra',id:x.id,label:`Ampra • ${x.sourceUnitId}`,date:x.date})),
    ...p.prescriptions.map(x=>({kind:'prescription',id:x.id,label:`Resep • ${x.patientName}`,date:x.date})),
    ...p.usages.map(x=>({kind:'usage',id:x.id,label:`Pemakaian • ${x.unitId}`,date:x.date})),
    ...p.disposals.map(x=>({kind:'disposal',id:x.id,label:`${x.type} • ${x.documentNo}`,date:x.date}))
  ].sort((a,b)=>b.date.localeCompare(a.date)),[p.receipts,p.ampras,p.prescriptions,p.usages,p.disposals]);

  const doReverse=async()=>{
    if(!reverseTarget||reverseReason.trim().length<5){p.onNotify?.('warning','Tuliskan alasan koreksi minimal 5 karakter.');return;}
    setBusy(true);const ok=await p.onReverse(reverseTarget.kind,reverseTarget.id,reverseReason.trim());setBusy(false);
    if(ok){setReverseTarget(null);setReverseReason('');}
  };

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-xl md:text-2xl font-bold text-slate-800 font-display">Retur, Kadaluarsa/Rusak & Koreksi</h2><p className="text-xs text-slate-500">Semua perubahan stok final diproses atomik dan mempertahankan dokumen asli sebagai jejak audit.</p></div>
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
        <button onClick={()=>setTab('disposal')} className={`px-3 py-2 rounded-lg text-xs font-bold ${tab==='disposal'?'bg-emerald-600 text-white':'text-slate-600'}`}>Retur / Rusak</button>
        <button onClick={()=>setTab('correction')} className={`px-3 py-2 rounded-lg text-xs font-bold ${tab==='correction'?'bg-emerald-600 text-white':'text-slate-600'}`}>Koreksi / Reversal</button>
      </div>
    </div>

    {tab==='disposal'?<div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-5">
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900"><ShieldCheck className="w-5 h-5 shrink-0"/><span>Finalisasi langsung mengurangi stok Gudang berdasarkan batch yang dipilih. Persetujuan APJ wajib dan seluruh operasi rollback otomatis bila satu langkah gagal.</span></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-slate-700">Jenis<select value={type} onChange={e=>setType(e.target.value as any)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5"><option>Retur</option><option>Kadaluarsa</option></select></label>
          <label className="text-xs font-semibold text-slate-700">Nomor Dokumen<input value={documentNo} onChange={e=>setDocumentNo(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5" placeholder="BA-RETUR / BA-RUSAK"/></label>
          {type==='Retur'&&<label className="sm:col-span-2 text-xs font-semibold text-slate-700">Penerima Dinas Kesehatan<input value={recipientName} onChange={e=>setRecipientName(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5" placeholder="Nama petugas penerima"/></label>}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="grid md:grid-cols-4 gap-2">
            <select value={medicineId} onChange={e=>{setMedicineId(e.target.value);setBatchNo('')}} className="border border-slate-200 rounded-lg px-2 py-2 text-xs"><option value="">Pilih obat</option>{p.medicines.filter(m=>(gudang[m.id]?.total||0)>0).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <select value={batchNo} onChange={e=>setBatchNo(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-2 text-xs"><option value="">Pilih batch</option>{batches.map((b,i)=><option key={i} value={b.batchNo}>{b.batchNo} • {b.quantity} • exp {b.expDate}</option>)}</select>
            <input type="number" min="1" value={qty||''} onChange={e=>setQty(Number(e.target.value))} placeholder="Jumlah" className="border border-slate-200 rounded-lg px-2 py-2 text-xs"/>
            <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Alasan/kondisi" className="border border-slate-200 rounded-lg px-2 py-2 text-xs"/>
          </div><button type="button" onClick={addLine} className="inline-flex items-center gap-2 bg-slate-800 text-white rounded-lg px-3 py-2 text-xs font-bold"><Plus className="w-4 h-4"/>Tambah Rincian</button>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-slate-500 border-b"><th className="p-2">Obat</th><th>Batch</th><th>Jumlah</th><th>Alasan</th><th></th></tr></thead><tbody>{lines.map((x,i)=><tr key={i} className="border-b border-slate-100"><td className="p-2 font-semibold">{medName(x.medicineId)}</td><td>{x.batchNo}</td><td>{x.qty}</td><td>{x.reason}</td><td><button onClick={()=>setLines(v=>v.filter((_,n)=>n!==i))} className="text-rose-600 p-2"><Trash2 className="w-4 h-4"/></button></td></tr>)}</tbody></table></div>
        <button disabled={busy||!canFinalize} onClick={submit} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl px-4 py-2.5 text-sm font-bold"><CheckCircle2 className="w-4 h-4"/>{busy?'Memproses…':'Finalisasi Atomik'}</button>
      </section>
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5"><h3 className="font-bold text-slate-800 mb-3">Riwayat Retur / Kadaluarsa</h3><div className="space-y-2 max-h-[560px] overflow-auto">{p.disposals.map(d=><div key={d.id} className="rounded-xl border border-slate-100 p-3"><div className="flex justify-between gap-2"><b className="text-sm">{d.type}</b><span className="text-[10px] text-slate-500">{d.date}</span></div><p className="text-xs text-slate-600">{d.documentNo} • {d.items.length} rincian</p></div>)}{p.disposals.length===0&&<p className="text-xs text-slate-400">Belum ada transaksi.</p>}</div></section>
    </div>:<section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800"><AlertTriangle className="w-5 h-5 shrink-0"/><span>Reversal tidak menghapus dokumen asal. Sistem membalik ledger batch persis. Jika batch yang harus ditarik sudah dipakai transaksi berikutnya, reversal ditolak agar stok tidak menjadi tidak konsisten.</span></div>
      <div className="space-y-2">{finalized.map(t=><div key={t.kind+t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-100 p-3"><div><b className="text-sm text-slate-800">{t.label}</b><p className="text-[11px] text-slate-500">{t.id} • {t.date}</p></div><button disabled={!canFinalize} onClick={()=>setReverseTarget(t)} className="inline-flex items-center justify-center gap-2 border border-rose-200 bg-rose-50 text-rose-700 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-40"><RotateCcw className="w-4 h-4"/>Koreksi / Reversal</button></div>)}</div>
    </section>}

    {reverseTarget&&<div className="fixed inset-0 z-[100] bg-slate-950/50 p-4 flex items-center justify-center"><div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-5 space-y-4"><div className="flex gap-3"><ArchiveRestore className="w-6 h-6 text-rose-600"/><div><h3 className="font-bold text-slate-900">Reversal {reverseTarget.label}</h3><p className="text-xs text-slate-500">Dokumen asli tetap tersimpan. Tindakan ini membuat catatan reversal baru.</p></div></div><textarea value={reverseReason} onChange={e=>setReverseReason(e.target.value)} rows={4} className="w-full border border-slate-200 rounded-xl p-3 text-sm" placeholder="Jelaskan alasan koreksi…"/><div className="flex justify-end gap-2"><button onClick={()=>setReverseTarget(null)} className="px-4 py-2 text-xs font-bold text-slate-600">Batal</button><button disabled={busy} onClick={doReverse} className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold">{busy?'Memproses…':'Konfirmasi Reversal'}</button></div></div></div>}
  </div>;
}
