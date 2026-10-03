import React from 'react';
import { Receipt, Ampra, Medicine, UnitInfo } from '../types';
import { PackageCheck, ArrowRightLeft, FileText, CheckCircle2, Clock3 } from 'lucide-react';

export function MobileReceiptsView({receipts,medicines}:{receipts:Receipt[];medicines:Medicine[]}) {
  const rows=Array.isArray(receipts)?receipts:[];
  return <div className="md:hidden space-y-3" id="mobile-receipts-view">
    <div className="sifp-inverse-surface rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 p-4 text-white shadow-sm">
      <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><PackageCheck className="h-5 w-5"/></span><div><h3 className="font-bold text-white">Penerimaan Gudang</h3><p className="text-[11px] text-emerald-100">{rows.length} dokumen penerimaan tersinkronisasi</p></div></div>
    </div>
    {rows.length===0?<div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Belum ada data penerimaan.</div>:rows.map(r=>{
      const its=Array.isArray(r.items)?r.items:[]; const qty=its.reduce((s,i)=>s+(Number(i.quantity)||0),0);
      return <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] font-bold text-emerald-700">{r.id}</p><h4 className="mt-1 truncate text-sm font-bold text-slate-800">{r.documentNo||'Tanpa nomor dokumen'}</h4><p className="mt-1 text-[11px] text-slate-500">{r.sourceType||'-'} • {r.documentType||'-'}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${r.verifiedByAPJ?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>{r.verifiedByAPJ?'Terverifikasi':'Menunggu APJ'}</span></div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-slate-50 p-2"><b className="block text-sm text-slate-800">{its.length}</b><span className="text-[9px] text-slate-500">Jenis obat</span></div><div className="rounded-xl bg-slate-50 p-2"><b className="block text-sm text-slate-800">{qty}</b><span className="text-[9px] text-slate-500">Total unit</span></div><div className="rounded-xl bg-slate-50 p-2"><b className="block text-[11px] text-slate-800">{r.date||'-'}</b><span className="text-[9px] text-slate-500">Tanggal</span></div></div>
        {its.length>0&&<div className="mt-3 space-y-1.5">{its.slice(0,3).map((i,idx)=>{const m=medicines.find(x=>x.id===i.medicineId);return <div key={idx} className="flex justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-[10px]"><span className="truncate font-semibold text-slate-700">{m?.name||i.medicineId}</span><span className="shrink-0 text-slate-500">{i.quantity} {m?.unit||''}</span></div>})}</div>}
      </article>
    })}
  </div>
}

export function MobileAmpraView({ampras,medicines,units}:{ampras:Ampra[];medicines:Medicine[];units:UnitInfo[]}) {
  const rows=Array.isArray(ampras)?ampras:[];
  return <div className="md:hidden space-y-3" id="mobile-ampra-view">
    <div className="sifp-inverse-surface rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-800 p-4 text-white shadow-sm"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><ArrowRightLeft className="h-5 w-5"/></span><div><h3 className="font-bold text-white">Ampra & Distribusi</h3><p className="text-[11px] text-teal-100">{rows.length} transaksi ampra tersinkronisasi</p></div></div></div>
    {rows.length===0?<div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Belum ada data ampra.</div>:rows.map(a=>{const its=Array.isArray(a.items)?a.items:[];const unit=units.find(u=>u.id===a.sourceUnitId);const req=its.reduce((s,i)=>s+(Number(i.requestedQty)||0),0);const app=its.reduce((s,i)=>s+(Number(i.approvedQty)||0),0);return <article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] font-bold text-teal-700">{a.id}</p><h4 className="mt-1 truncate text-sm font-bold text-slate-800">{unit?.name||a.sourceUnitId||'Unit'}</h4><p className="mt-1 text-[11px] text-slate-500">{a.cycleType||'-'} • {a.date||'-'}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-700">{a.status||'Diajukan'}</span></div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-slate-50 p-2"><b className="block text-sm text-slate-800">{its.length}</b><span className="text-[9px] text-slate-500">Jenis</span></div><div className="rounded-xl bg-amber-50 p-2"><b className="block text-sm text-amber-700">{req}</b><span className="text-[9px] text-amber-600">Diminta</span></div><div className="rounded-xl bg-emerald-50 p-2"><b className="block text-sm text-emerald-700">{app}</b><span className="text-[9px] text-emerald-600">Disetujui</span></div></div>
      {its.length>0&&<div className="mt-3 space-y-1.5">{its.slice(0,3).map((i,idx)=>{const m=medicines.find(x=>x.id===i.medicineId);return <div key={idx} className="flex justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-[10px]"><span className="truncate font-semibold text-slate-700">{m?.name||i.medicineId}</span><span className="shrink-0 text-slate-500">{i.requestedQty} → {i.approvedQty}</span></div>})}</div>}
    </article>})}
  </div>
}