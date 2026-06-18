import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_STOCKS,
  INITIAL_RECEIPTS,
  INITIAL_AMPRAS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_USAGES,
  INITIAL_USERS,
  INITIAL_MEDICINES,
  INITIAL_UNITS
} from './mockData';

// Supabase setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tzlovjdhfapafqclxnvb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bG92amRoZmFwYWZxY2x4bnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NTY0NjMsImV4cCI6MjA5NzMzMjQ2M30.R0CT4JPjHzKzEgwk2ZIEOw8JBLZqcZzgfdzvuM0r2BU';

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
  if (!supabase) return { empty: true, docs: [], forEach: () => {} };
  const { data, error } = await supabase
    .from('documents')
    .select('doc_id, data')
    .eq('collection_name', ref.name);
    
  if (error || !data) return { empty: true, docs: [], forEach: () => {} };
  
  const docs = data.map(row => ({
    id: row.doc_id,
    data: () => row.data,
    exists: () => true
  }));
  
  return {
    empty: docs.length === 0,
    docs,
    forEach: (cb: (doc: any) => void) => docs.forEach(cb)
  };
}

export async function setDoc(ref: DocRef, data: any) {
  if (!supabase) {
    console.warn("Supabase not configured. Data is not saved permanently.");
    return;
  }
  const { error } = await supabase
    .from('documents')
    .upsert({ collection_name: ref.collection, doc_id: ref.id, data }, { onConflict: 'collection_name,doc_id' });
  
  if (error) {
    console.error("setDoc error:", error);
    throw error;
  }
}

export async function deleteDoc(ref: DocRef) {
  if (!supabase) return;
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('collection_name', ref.collection)
    .eq('doc_id', ref.id);
    
  if (error) {
    console.error("deleteDoc error:", error);
    throw error;
  }
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
    const channelName = `doc_${ref.collection}_${ref.id}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelName);
    channel.on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'documents', 
        filter: `collection_name=eq.${ref.collection}` 
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
    const channelName = `coll_${ref.name}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelName);
    channel.on('postgres_changes', { 
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
  const { error } = await supabase.from('documents').delete().eq('collection_name', collectionName);
  if (error) {
    console.error("clearCollection error:", error);
    throw error;
  }
}

export async function resetDatabaseFirestore() {
  if (!supabase) return;

  await Promise.all([
    clearCollection('receipts'),
    clearCollection('ampras'),
    clearCollection('prescriptions'),
    clearCollection('usages'),
    clearCollection('stocks'),
    clearCollection('system'),
    clearCollection('users'),
    clearCollection('medicines'),
    clearCollection('units'),
  ]);


  const promises: Promise<any>[] = [
    setDoc(doc(db, 'system', 'config'), { systemDate: '2026-06-17' }),
    ...INITIAL_USERS.map(item => setDoc(doc(db, 'users', item.id), item)),
    ...INITIAL_MEDICINES.map(item => setDoc(doc(db, 'medicines', item.id), item)),
    ...INITIAL_UNITS.map(item => setDoc(doc(db, 'units', item.id), item)),
    ...Object.entries(INITIAL_STOCKS).map(([unitId, stockData]) => setDoc(doc(db, 'stocks', unitId), stockData)),
    ...INITIAL_RECEIPTS.map(item => setDoc(doc(db, 'receipts', item.id), item)),
    ...INITIAL_AMPRAS.map(item => setDoc(doc(db, 'ampras', item.id), item)),
    ...INITIAL_PRESCRIPTIONS.map(item => setDoc(doc(db, 'prescriptions', item.id), item)),
    ...INITIAL_USAGES.map(item => setDoc(doc(db, 'usages', item.id), item)),
  ];

  await Promise.all(promises);
}

export async function seedDatabaseIfEmpty() {
  if (!supabase) return;
  const systemConfigRef = doc(db, 'system', 'config');
  const systemConfigSnap = await getDoc(systemConfigRef);
  if (systemConfigSnap.exists()) return;

  await resetDatabaseFirestore();
}
