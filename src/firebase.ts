import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_STOCKS,
  INITIAL_RECEIPTS,
  INITIAL_AMPRAS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_USAGES
} from './mockData';

// Supabase setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Mock Firebase-like references
export type CollRef = { type: 'collection'; name: string };
export type DocRef = { type: 'document'; collection: string; id: string };

export const db = {};

export function collection(db: any, name: string): CollRef {
  return { type: 'collection', name };
}

export function doc(db: any, collectionName: string, id: string): DocRef {
  return { type: 'document', collection: collectionName, id };
}

// Convert Firestore-like methods to Supabase REST and Realtime
export async function getDoc(ref: DocRef) {
  if (!supabase) return { exists: () => false, data: () => null, id: ref.id };
  const { data, error } = await supabase
    .from('documents')
    .select('data')
    .eq('collection_name', ref.collection)
    .eq('doc_id', ref.id)
    .single();
  
  if (error || !data) return { exists: () => false, data: () => null, id: ref.id };
  return { exists: () => true, data: () => data.data, id: ref.id };
}

export async function getDocs(ref: CollRef) {
  if (!supabase) return { empty: true, docs: [] };
  const { data, error } = await supabase
    .from('documents')
    .select('doc_id, data')
    .eq('collection_name', ref.name);
    
  if (error || !data) return { empty: true, docs: [] };
  return {
    empty: data.length === 0,
    docs: data.map(row => ({
      id: row.doc_id,
      data: () => row.data,
      exists: () => true
    }))
  };
}

export async function setDoc(ref: DocRef, data: any) {
  if (!supabase) {
    console.warn("Supabase not configured. Data is not saved permanently.");
    return;
  }
  await supabase
    .from('documents')
    .upsert({ collection_name: ref.collection, doc_id: ref.id, data }, { onConflict: 'collection_name,doc_id' });
}

export async function deleteDoc(ref: DocRef) {
  if (!supabase) return;
  await supabase
    .from('documents')
    .delete()
    .eq('collection_name', ref.collection)
    .eq('doc_id', ref.id);
}

// Real-time via Supabase Postgres Changes
export function onSnapshot(ref: CollRef | DocRef, callback: (snap: any) => void) {
  if (!supabase) {
    console.warn("Supabase not configured. Real-time changes disabled.");
    return () => {};
  }
  
  if (ref.type === 'document') {
    // Initial fetch
    getDoc(ref).then(callback);
    // Listen for doc channel
    const channel = supabase.channel(`doc_${ref.collection}_${ref.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'documents', 
        filter: `collection_name=eq.${ref.collection}` // Note: Multiple filters aren't directly supported in Postgres Changes standard tier well, but we'll fetch locally.
      }, async (payload) => {
        // Just trigger standard getDoc to ensure right format
        const docSnap = await getDoc(ref);
        callback(docSnap);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  } else {
    // Initial fetch
    getDocs(ref).then(callback);
    const channel = supabase.channel(`coll_${ref.name}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'documents', 
        filter: `collection_name=eq.${ref.name}`
      }, async (payload) => {
        const qSnap = await getDocs(ref);
        callback(qSnap);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }
}

async function clearCollection(collectionName: string) {
  if (!supabase) return;
  await supabase.from('documents').delete().eq('collection_name', collectionName);
}

export async function resetDatabaseFirestore() {
  if (!supabase) return;
  await clearCollection('receipts');
  await clearCollection('ampras');
  await clearCollection('prescriptions');
  await clearCollection('usages');
  await clearCollection('stocks');
  await clearCollection('system');

  await setDoc(doc(db, 'system', 'config'), { systemDate: '2026-06-17' });
  for (const [unitId, stockData] of Object.entries(INITIAL_STOCKS)) {
    await setDoc(doc(db, 'stocks', unitId), stockData);
  }
  for (const item of INITIAL_RECEIPTS) {
    await setDoc(doc(db, 'receipts', item.id), item);
  }
  for (const item of INITIAL_AMPRAS) {
    await setDoc(doc(db, 'ampras', item.id), item);
  }
  for (const item of INITIAL_PRESCRIPTIONS) {
    await setDoc(doc(db, 'prescriptions', item.id), item);
  }
  for (const item of INITIAL_USAGES) {
    await setDoc(doc(db, 'usages', item.id), item);
  }
}

export async function seedDatabaseIfEmpty() {
  if (!supabase) return;
  const systemConfigRef = doc(db, 'system', 'config');
  const systemConfigSnap = await getDoc(systemConfigRef);
  if (systemConfigSnap.exists()) return;

  await resetDatabaseFirestore();
}
