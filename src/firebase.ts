import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, query, collection, getDocs, deleteDoc } from 'firebase/firestore';
import {
  INITIAL_STOCKS,
  INITIAL_RECEIPTS,
  INITIAL_AMPRAS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_USAGES
} from './mockData';
import { StockStore, Receipt, Ampra, Prescription, DailyUsage } from './types';

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCeSU11fbjNcojjlfgKudsjq4vIv8C3oSw",
  authDomain: "polynomial-node-c2gpt.firebaseapp.com",
  projectId: "polynomial-node-c2gpt",
  storageBucket: "polynomial-node-c2gpt.firebasestorage.app",
  messagingSenderId: "397253837002",
  appId: "1:397253837002:web:7ebe7dbe248c8c72f0b433"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the specific database ID
export const db = getFirestore(app, "ai-studio-1015436e-0d92-4378-ac2b-41ac1b43e96a");

/**
 * Helper to delete all documents in a collection
 */
async function clearCollection(collectionName: string) {
  const colRef = collection(db, collectionName);
  const qSnap = await getDocs(colRef);
  for (const docSnap of qSnap.docs) {
    await deleteDoc(doc(db, collectionName, docSnap.id));
  }
}

/**
 * Erase all mock tables and completely reset to INITIAL_ variables in Firestore
 */
export async function resetDatabaseFirestore() {
  try {
    console.log('Clearing old collections in Firestore...');
    // Clear receipts, ampras, prescriptions, usages, stocks, and system
    await clearCollection('receipts');
    await clearCollection('ampras');
    await clearCollection('prescriptions');
    await clearCollection('usages');
    await clearCollection('stocks');
    await clearCollection('system');

    console.log('Re-seeding collections in Firestore...');
    
    // 1. Re-seed config
    await setDoc(doc(db, 'system', 'config'), { systemDate: '2026-06-17' });

    // 2. Re-seed stocks
    for (const [unitId, stockData] of Object.entries(INITIAL_STOCKS)) {
      await setDoc(doc(db, 'stocks', unitId), stockData);
    }

    // 3. Re-seed receipts
    for (const item of INITIAL_RECEIPTS) {
      await setDoc(doc(db, 'receipts', item.id), item);
    }

    // 4. Re-seed ampras
    for (const item of INITIAL_AMPRAS) {
      await setDoc(doc(db, 'ampras', item.id), item);
    }

    // 5. Re-seed prescriptions
    for (const item of INITIAL_PRESCRIPTIONS) {
      await setDoc(doc(db, 'prescriptions', item.id), item);
    }

    // 6. Re-seed usages
    for (const item of INITIAL_USAGES) {
      await setDoc(doc(db, 'usages', item.id), item);
    }

    console.log('Firestore database completely reset to default!');
  } catch (err) {
    console.error('Failed to reset Firestore:', err);
    throw err;
  }
}

/**
 * Seeding helper to initialize the Firestore database with realistic mock datasets
 * if they don't already exist.
 */
export async function seedDatabaseIfEmpty() {
  try {
    // Check if configuration already exists in Firestore
    const systemConfigRef = doc(db, 'system', 'config');
    const systemConfigSnap = await getDoc(systemConfigRef);
    
    if (systemConfigSnap.exists()) {
      console.log('Firebase Firestore already seeded.');
      return;
    }

    console.log('Seeding Firebase Firestore with initial mock datasets...');

    // 1. Seed system date config
    await setDoc(systemConfigRef, { systemDate: '2026-06-17' });

    // 2. Seed stocks store (one doc per unit)
    for (const [unitId, stockData] of Object.entries(INITIAL_STOCKS)) {
      const stockDocRef = doc(db, 'stocks', unitId);
      await setDoc(stockDocRef, stockData);
    }

    // 3. Seed receipts
    for (const item of INITIAL_RECEIPTS) {
      await setDoc(doc(db, 'receipts', item.id), item);
    }

    // 4. Seed ampras
    for (const item of INITIAL_AMPRAS) {
      await setDoc(doc(db, 'ampras', item.id), item);
    }

    // 5. Seed prescriptions
    for (const item of INITIAL_PRESCRIPTIONS) {
      await setDoc(doc(db, 'prescriptions', item.id), item);
    }

    // 6. Seed usages
    for (const item of INITIAL_USAGES) {
      await setDoc(doc(db, 'usages', item.id), item);
    }

    console.log('Firestore seeding completed successfully.');
  } catch (error) {
    console.error('Failed to seed Firestore:', error);
  }
}
