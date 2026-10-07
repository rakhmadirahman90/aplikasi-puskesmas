import { Medicine, PrescriptionItem, StockStore } from '../types';

export type SmartMatch = {
  sourceText: string;
  medicineId?: string;
  medicineName?: string;
  qty: number;
  dosage: string;
  confidence: number;
  status: 'matched' | 'review' | 'unmatched' | 'stock-warning';
  available: number;
};

const norm=(s:string)=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
const tokens=(s:string)=>new Set(norm(s).split(' ').filter(x=>x.length>1));
const similarity=(a:string,b:string)=>{
  const A=tokens(a),B=tokens(b); if(!A.size||!B.size)return 0;
  let hit=0; A.forEach(x=>{if(B.has(x))hit++});
  const j=hit/(A.size+B.size-hit);
  const na=norm(a),nb=norm(b); const containment=na.includes(nb)||nb.includes(na)?0.35:0;
  return Math.min(1,j+containment);
};

const splitPrescription=(text:string)=>String(text||'').split(/\r?\n|;|\|/).map(x=>x.trim()).filter(Boolean);
const parseQty=(line:string)=>{
  const patterns=[/(?:jumlah|jml|qty|no)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,/(?:tab|tablet|kapsul|caps|pcs|amp|ampul|botol|btl|tube|sachet)\s*[x:]?\s*(\d+)/i,/\bx\s*(\d+)\b/i];
  for(const p of patterns){const m=line.match(p);if(m)return Math.max(1,Math.round(Number(m[1].replace(',','.'))||1));}
  const tail=line.match(/\b(\d+)\s*(?:tab|tablet|kapsul|caps|pcs|amp|ampul|botol|btl|tube|sachet)\b/i);return tail?Math.max(1,Number(tail[1])):1;
};
const parseDosage=(line:string)=>{
  const m=line.match(/(?:s|signa|aturan pakai|dosis)\s*[:=]?\s*(.+)$/i); if(m)return m[1].trim();
  const freq=line.match(/\b\d+\s*[xX]\s*\d+(?:[.,]\d+)?\b(?:\s*(?:tab|tablet|kapsul|sendok|ml))?/);return freq?.[0]||'Perlu verifikasi aturan pakai';
};

export function smartMatchPrescription(text:string, medicines:Medicine[], stocks:StockStore, unitId='ruang_farmasi'):SmartMatch[]{
  const meds=medicines.filter(m=>(m.itemKind||'obat')==='obat'); const unit=stocks[unitId]||{};
  return splitPrescription(text).map(line=>{
    const ranked=meds.map(m=>({m,score:similarity(line,m.name)})).sort((a,b)=>b.score-a.score); const best=ranked[0]; const second=ranked[1];
    const confident=!!best&&best.score>=0.72&&(best.score-(second?.score||0)>=0.08); const review=!!best&&best.score>=0.48; const chosen=confident||review?best?.m:undefined;
    const qty=parseQty(line); const available=chosen?(unit[chosen.id]?.total||0):0;
    let status:SmartMatch['status']=confident?'matched':review?'review':'unmatched'; if(chosen&&qty>available)status='stock-warning';
    return {sourceText:line,medicineId:chosen?.id,medicineName:chosen?.name,qty,dosage:parseDosage(line),confidence:best?.score||0,status,available};
  });
}

export function approvedMatchesToLines(matches:SmartMatch[]):PrescriptionItem[]{
  return matches.filter(m=>m.medicineId&&m.status!=='unmatched'&&m.qty>0&&m.qty<=m.available).map(m=>({medicineId:m.medicineId!,qty:m.qty,dosage:m.dosage,isCompound:false}));
}
