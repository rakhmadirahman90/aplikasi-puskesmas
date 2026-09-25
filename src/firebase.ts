import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null;

export type CollRef = { type: 'collection'; name: string };
export type DocRef = { type: 'document'; collection: string; id: string };
export const db = {};

export function collection(_db: any, name: string): CollRef { return { type: 'collection', name }; }
export function doc(_db: any, collectionName: string, id: string): DocRef { return { type: 'document', collection: collectionName, id }; }

const client = () => {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  return supabase;
};

function snapshot(rows: any[]) {
  const docs = rows.map((r: any) => ({ id: r.id, data: () => r.data, exists: () => true }));
  return { empty: docs.length === 0, docs, forEach: (cb: (d: any) => void) => docs.forEach(cb) };
}

function stockStore(balances: any[], batches: any[]) {
  const out: any = {};
  for (const r of balances) {
    out[r.unit_id] ??= {};
    out[r.unit_id][r.medicine_id] = { total: Number(r.total), batches: [] };
  }
  for (const r of batches) {
    out[r.unit_id] ??= {};
    out[r.unit_id][r.medicine_id] ??= { total: 0, batches: [] };
    out[r.unit_id][r.medicine_id].batches ??= [];
    out[r.unit_id][r.medicine_id].batches.push({
      batchNo: r.batch_no, expDate: r.exp_date, quantity: Number(r.quantity),
      source: r.source, ...(r.price == null ? {} : { price: Number(r.price) })
    });
  }
  return out;
}

async function load(name: string) {
  const s = client();
  if (name === 'units') {
    const { data, error } = await s.from('units').select('*').order('name'); if (error) throw error;
    return (data || []).map((r: any) => ({ id:r.id, data:()=>({id:r.id,name:r.name,type:r.type,description:r.description,manager:r.manager}) }));
  }
  if (name === 'medicines') {
    const { data, error } = await s.from('medicines').select('*').order('name'); if (error) throw error;
    return (data || []).map((r: any) => ({ id:r.id, data:()=>({id:r.id,name:r.name,type:r.type,isNarkotikaPsikotropika:r.is_narkotika_psikotropika,group:r.medicine_group,unit:r.unit,compoundType:r.compound_type,description:r.description}) }));
  }
  if (name === 'users') {
    const { data, error } = await s.from('app_users').select('*').order('username'); if (error) throw error;
    return (data || []).map((r: any) => ({ id:r.id, data:()=>({
      id:r.id,
      username:r.username,
      pin:'',
      role:r.role,
      name:r.name,
      unitId:r.unit_id || undefined,
      authUserId:r.auth_user_id || undefined,
      migrationStatus:r.migration_status || undefined
    }) }));
  }
  if (name === 'stocks') {
    const [b,bt] = await Promise.all([s.from('stock_balances').select('*'),s.from('stock_batches').select('*').order('exp_date')]);
    if (b.error) throw b.error; if (bt.error) throw bt.error;
    const grouped=stockStore(b.data||[],bt.data||[]);
    return Object.entries(grouped).map(([id,data])=>({id,data:()=>data}));
  }
  const compound: Record<string,{head:string,item:string}> = {
    receipts:{head:'receipts',item:'receipt_items'}, ampras:{head:'ampras',item:'ampra_items'},
    prescriptions:{head:'prescriptions',item:'prescription_items'}, usages:{head:'daily_usages',item:'daily_usage_items'},
    disposals:{head:'disposals',item:'disposal_items'}
  };
  if (compound[name]) {
    const c=compound[name];
    const [h,i]=await Promise.all([s.from(c.head).select('*').order('event_timestamp',{ascending:false}),s.from(c.item).select('*')]);
    if(h.error) throw h.error; if(i.error) throw i.error;
    return (h.data||[]).map((r:any)=>({id:r.id,data:()=>convertCompound(name,r,i.data||[])}));
  }
  if (name==='system') {
    const {data,error}=await s.from('system_config').select('config').eq('id','config').maybeSingle(); if(error) throw error;
    return [{id:'config',data:()=>data?.config||{}}];
  }
  return [];
}

function convertCompound(name:string,r:any,items:any[]) {
  if(name==='receipts') return {id:r.id,date:r.date,sourceType:r.source_type,documentType:r.document_type,documentNo:r.document_no,items:items.filter(x=>x.receipt_id===r.id).map(x=>({medicineId:x.medicine_id,quantity:Number(x.quantity),batchNo:x.batch_no,expDate:x.exp_date,source:x.source,condition:x.condition,price:x.price==null?undefined:Number(x.price)})),verifiedByGudang:r.verified_by_gudang,verifiedByAPJ:r.verified_by_apj,gudangOfficer:r.gudang_officer,apjName:r.apj_name,timestamp:r.event_timestamp};
  if(name==='ampras') return {id:r.id,date:r.date,sourceUnitId:r.source_unit_id,cycleType:r.cycle_type,status:r.status,items:items.filter(x=>x.ampra_id===r.id).map(x=>({medicineId:x.medicine_id,requestedQty:Number(x.requested_qty),approvedQty:Number(x.approved_qty)})),verifiedGudang:r.verified_gudang,verifiedAPJ:r.verified_apj,verifiedUnit:r.verified_unit,gudangOfficer:r.gudang_officer,unitOfficer:r.unit_officer,apjName:r.apj_name,noBAP:r.no_bap,timestamp:r.event_timestamp};
  if(name==='prescriptions') return {id:r.id,date:r.date,patientName:r.patient_name,drName:r.doctor_name,age:r.age,type:r.prescription_type,items:items.filter(x=>x.prescription_id===r.id).map(x=>({medicineId:x.medicine_id,qty:Number(x.qty),dosage:x.dosage,isCompound:x.is_compound})),timestamp:r.event_timestamp};
  if(name==='usages') return {id:r.id,date:r.date,unitId:r.unit_id,items:items.filter(x=>x.usage_id===r.id).map(x=>({medicineId:x.medicine_id,qtyUsed:Number(x.qty_used)})),officerName:r.officer_name,timestamp:r.event_timestamp};
  return {id:r.id,date:r.date,type:r.type,documentNo:r.document_no,items:items.filter(x=>x.disposal_id===r.id).map(x=>({medicineId:x.medicine_id,qty:Number(x.qty),batchNo:x.batch_no,reason:x.reason})),isApprovedAPJ:r.is_approved_apj,officerName:r.officer_name,recipientName:r.recipient_name,timestamp:r.event_timestamp};
}

export async function getDoc(ref:DocRef) {
  const rows=await load(ref.collection); const row=rows.find((x:any)=>x.id===ref.id);
  return row?{exists:()=>true,data:()=>row.data(),id:ref.id}:{exists:()=>false,data:()=>null,id:ref.id};
}
export async function getDocs(ref:CollRef) { return snapshot(await load(ref.name)); }

async function saveCompound(name:string,id:string,data:any) {
  const s=client();
  const defs:any={
    receipts:{table:'receipts',items:'receipt_items',header:{id,date:'date',source_type:'sourceType',document_type:'documentType',document_no:'documentNo',verified_by_gudang:'verifiedByGudang',verified_by_apj:'verifiedByAPJ',gudang_officer:'gudangOfficer',apj_name:'apjName',event_timestamp:'timestamp'},fk:'receipt_id',map:(i:any)=>({medicine_id:i.medicineId,quantity:i.quantity,batch_no:i.batchNo,exp_date:i.expDate,source:i.source,condition:i.condition,price:i.price??null})},
    ampras:{table:'ampras',items:'ampra_items',header:{id,date:'date',source_unit_id:'sourceUnitId',cycle_type:'cycleType',status:'status',verified_gudang:'verifiedGudang',verified_apj:'verifiedAPJ',verified_unit:'verifiedUnit',gudang_officer:'gudangOfficer',unit_officer:'unitOfficer',apj_name:'apjName',no_bap:'noBAP',event_timestamp:'timestamp'},fk:'ampra_id',map:(i:any)=>({medicine_id:i.medicineId,requested_qty:i.requestedQty,approved_qty:i.approvedQty})},
    prescriptions:{table:'prescriptions',items:'prescription_items',header:{id,date:'date',patient_name:'patientName',doctor_name:'drName',age:'age',prescription_type:'type',event_timestamp:'timestamp'},fk:'prescription_id',map:(i:any)=>({medicine_id:i.medicineId,qty:i.qty,dosage:i.dosage,is_compound:i.isCompound})},
    usages:{table:'daily_usages',items:'daily_usage_items',header:{id,date:'date',unit_id:'unitId',officer_name:'officerName',event_timestamp:'timestamp'},fk:'usage_id',map:(i:any)=>({medicine_id:i.medicineId,qty_used:i.qtyUsed})},
    disposals:{table:'disposals',items:'disposal_items',header:{id,date:'date',type:'type',document_no:'documentNo',is_approved_apj:'isApprovedAPJ',officer_name:'officerName',recipient_name:'recipientName',event_timestamp:'timestamp'},fk:'disposal_id',map:(i:any)=>({medicine_id:i.medicineId,qty:i.qty,batch_no:i.batchNo,reason:i.reason})}
  };
  const d=defs[name]; const header:any={};
  for(const [k,v] of Object.entries(d.header)) header[k]=k==='id'?id:(data[v as string] ?? (['gudang_officer','apj_name','unit_officer','no_bap','recipient_name'].includes(k)?null:new Date().toISOString()));
  const {error}=await s.from(d.table).upsert(header); if(error) throw error;
  const {error:de}=await s.from(d.items).delete().eq(d.fk,id); if(de) throw de;
  if(data.items?.length){const {error:ie}=await s.from(d.items).insert(data.items.map((i:any)=>({[d.fk]:id,...d.map(i)})));if(ie)throw ie;}
}

export async function setDoc(ref:DocRef,data:any) {
  const s=client();
  if(ref.collection==='units'){const {error}=await s.from('units').upsert({id:ref.id,name:data.name,type:data.type,description:data.description,manager:data.manager});if(error)throw error;return;}
  if(ref.collection==='medicines'){const {error}=await s.from('medicines').upsert({id:ref.id,name:data.name,type:data.type,is_narkotika_psikotropika:data.isNarkotikaPsikotropika,medicine_group:data.group,unit:data.unit,compound_type:data.compoundType,description:data.description??null});if(error)throw error;return;}
  if(ref.collection==='users'){const {error}=await s.from('app_users').upsert({id:ref.id,username:data.username,name:data.name,role:data.role,unit_id:data.unitId??null});if(error)throw error;return;}
  if(ref.collection==='stocks'){
    const {error:bd}=await s.from('stock_batches').delete().eq('unit_id',ref.id);if(bd)throw bd;
    const {error:bl}=await s.from('stock_balances').delete().eq('unit_id',ref.id);if(bl)throw bl;
    const balances:any[]=[],batches:any[]=[];
    for(const [medicineId,v0] of Object.entries(data||{})){const v:any=v0;balances.push({unit_id:ref.id,medicine_id:medicineId,total:v.total||0});for(const b of v.batches||[])batches.push({unit_id:ref.id,medicine_id:medicineId,batch_no:b.batchNo,exp_date:b.expDate,quantity:b.quantity,source:b.source,price:b.price??null});}
    if(balances.length){const {error}=await s.from('stock_balances').insert(balances);if(error)throw error;} if(batches.length){const {error}=await s.from('stock_batches').insert(batches);if(error)throw error;} return;
  }
  if(ref.collection==='system'){const {data:old,error:re}=await s.from('system_config').select('config').eq('id','config').maybeSingle();if(re)throw re;const {error}=await s.from('system_config').upsert({id:'config',config:{...(old?.config||{}),...(data||{})}});if(error)throw error;return;}
  if(['receipts','ampras','prescriptions','usages','disposals'].includes(ref.collection)) return saveCompound(ref.collection,ref.id,data);
}

export async function deleteDoc(ref:DocRef) {
  const s=client();
  if(ref.collection==='stocks'){const a=await s.from('stock_batches').delete().eq('unit_id',ref.id);if(a.error)throw a.error;const b=await s.from('stock_balances').delete().eq('unit_id',ref.id);if(b.error)throw b.error;return;}
  const table:any={units:'units',medicines:'medicines',users:'app_users',receipts:'receipts',ampras:'ampras',prescriptions:'prescriptions',usages:'daily_usages',disposals:'disposals'}[ref.collection];
  if(table){const {error}=await s.from(table).delete().eq('id',ref.id);if(error)throw error;}
}

function tables(name:string){return ({system:['system_config'],stocks:['stock_balances','stock_batches'],users:['app_users'],units:['units'],medicines:['medicines'],receipts:['receipts','receipt_items'],ampras:['ampras','ampra_items'],prescriptions:['prescriptions','prescription_items'],usages:['daily_usages','daily_usage_items'],disposals:['disposals','disposal_items']} as Record<string,string[]>)[name]||[];}

export function onSnapshot(ref:CollRef|DocRef,callback:(snap:any)=>void){
  if(!supabase)return()=>{};
  const refresh=()=>void (ref.type==='document'?getDoc(ref):getDocs(ref)).then(callback).catch(console.error);
  refresh();
  const channel=supabase.channel('sifp:'+ref.type+':'+(ref.type==='document'?ref.collection+':'+ref.id:ref.name));
  for(const table of tables(ref.type==='document'?ref.collection:ref.name))channel.on('postgres_changes',{event:'*',schema:'public',table},refresh);
  channel.subscribe();
  return ()=>{void supabase?.removeChannel(channel);};
}

export async function resetDatabaseFirestore(){throw new Error('Reset database simulasi dinonaktifkan setelah migrasi ke Supabase. Gunakan menu CRUD untuk mengubah data.');}
export async function seedDatabaseIfEmpty(){return;}
