/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Medicine {
  id: string;
  name: string;
  type: 'generik' | 'paten';
  isNarkotikaPsikotropika: boolean;
  group: 'narkotika' | 'psikotropika' | 'biasa';
  unit: string; // tablet, botol, vial, ampul, sirup, dll
  compoundType: 'non-racikan' | 'racikan';
  description?: string;
}

export interface BatchStock {
  batchNo: string;
  expDate: string; // YYYY-MM-DD
  quantity: number;
  source: 'DAK' | 'DAU' | 'Program' | 'JKN' | 'PBF' | 'Lainnya';
}

export interface StockStore {
  // Key represents the unit id (e.g. 'gudang', 'ruang_farmasi', 'igd', etc.)
  // Value is a record where key is medicineId, and value is physical balance
  [unitId: string]: {
    [medicineId: string]: {
      total: number;
      batches?: BatchStock[]; // Gudang keeps batch breakdown for alerts and financial reports
    };
  };
}

export interface ReceiptItem {
  medicineId: string;
  quantity: number;
  batchNo: string;
  expDate: string; // YYYY-MM-DD
  source: 'DAK' | 'DAU' | 'Program' | 'JKN' | 'PBF';
  condition: 'Baik' | 'Rusak';
}

export interface Receipt {
  id: string;
  date: string; // YYYY-MM-DD
  sourceType: 'Instalasi Farmasi Kota' | 'PBF';
  documentType: 'BAP' | 'Faktur' | 'Surat Jalan';
  documentNo: string;
  items: ReceiptItem[];
  verifiedByGudang: boolean;
  verifiedByAPJ: boolean;
  gudangOfficer: string;
  apjName: string;
  timestamp: string;
}

export interface AmpraItem {
  medicineId: string;
  requestedQty: number;
  approvedQty: number;
}

export interface Ampra {
  id: string;
  date: string; // YYYY-MM-DD
  sourceUnitId: string; // 'ruang_farmasi', 'pustu', 'igd', etc.
  cycleType: 'Harian' | 'Bulanan' | 'Insidentil';
  status: 'Draft' | 'Diajukan' | 'Disiapkan' | 'Diterima' | 'Selesai';
  items: AmpraItem[];
  verifiedGudang: boolean;
  verifiedAPJ: boolean;
  verifiedUnit: boolean;
  gudangOfficer?: string;
  unitOfficer?: string;
  apjName?: string;
  noBAP?: string; // Berita Acara Penyerahan
  timestamp: string;
}

export interface PrescriptionItem {
  medicineId: string;
  qty: number;
  dosage: string; // e.g. "3x1 tab"
  isCompound: boolean; // racikan vs non-racikan
}

export interface Prescription {
  id: string;
  date: string; // YYYY-MM-DD
  patientName: string;
  drName: string;
  age: number;
  type: 'Rawat Jalan' | 'Rawat Inap';
  items: PrescriptionItem[];
  timestamp: string;
}

export interface DailyUsageItem {
  medicineId: string;
  qtyUsed: number;
}

export interface DailyUsage {
  id: string;
  date: string; // YYYY-MM-DD
  unitId: string; // e.g., 'pustu', 'igd', etc.
  items: DailyUsageItem[];
  officerName: string;
  timestamp: string;
}

export interface Disposal {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'Retur' | 'Kadaluarsa';
  documentNo: string;
  items: {
    medicineId: string;
    qty: number;
    batchNo: string;
    reason: string;
  }[];
  isApprovedAPJ: boolean;
  officerName: string;
  recipientName?: string; // For Retur to Dinas Kesehatan
  timestamp: string;
}

export interface UnitInfo {
  id: string;
  name: string;
  type: 'gudang' | 'apotek' | 'unit_internal' | 'jejaring';
  description: string;
  manager: string;
}

export interface AppState {
  medicines: Medicine[];
  stocks: StockStore;
  receipts: Receipt[];
  ampras: Ampra[];
  prescriptions: Prescription[];
  usages: DailyUsage[];
  disposals: Disposal[];
  systemDate: string; // Allows simulating active date for alerts
  roles: {
    activeRole: 'apj' | 'gudang' | 'farmasi' | 'unit';
    activeUnitId: string; // If 'unit' or 'farmasi', which unit is currently accessed
    userName: string;
  };
}
