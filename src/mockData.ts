/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medicine, UnitInfo, StockStore, Receipt, Ampra, Prescription, DailyUsage, Disposal } from './types';

export const INITIAL_UNITS: UnitInfo[] = [
  { id: 'gudang', name: 'Gudang Farmasi Utama', type: 'gudang', description: 'Gudang induk penerimaan sediaan farmasi dari Dinas Kesehatan Parepare & PBF', manager: 'Andi Sukri, A.Md.Farm' },
  { id: 'ruang_farmasi', name: 'Ruang Farmasi (Apotek)', type: 'apotek', description: 'Pelayanan resep pasien rawat jalan dan rawat inap puskesmas', manager: 'Hj. Syarifah, S.Farm., Apt' },
  { id: 'pustu', name: 'Puskesmas Pembantu (Pustu) Soreang', type: 'jejaring', description: 'Unit pelayanan kesehatan pembantu di luar puskesmas induk', manager: 'Salmawati, S.Kep' },
  { id: 'igd', name: 'Unit IGD (Gawat Darurat)', type: 'unit_internal', description: 'Pelayanan tindakan gawat darurat 24 jam', manager: 'dr. Akhmad' },
  { id: 'lab', name: 'Laboratorium', type: 'unit_internal', description: 'Unit penunjang pemeriksaan laboratorium klinis', manager: 'Fitriani, A.Md.AK' },
  { id: 'ruang_perawatan', name: 'Ruang Perawatan (Rawat Inap)', type: 'unit_internal', description: 'Pelayanan asuhan keperawatan rawat inap puskesmas', manager: 'Nrs. Suhartini, S.Kep' },
  { id: 'poli_gizi', name: 'Poli Gizi', type: 'unit_internal', description: 'Konseling dan pemberian PMT/vitamin gizi', manager: 'Asma, S.Gz' },
  { id: 'poli_tb', name: 'Poli TB (Paru)', type: 'unit_internal', description: 'Pelayanan khusus pasien tuberkulosis dengan obat DOTS', manager: 'Iswandi, S.Kep' },
  { id: 'kamar_bersalin', name: 'Kamar Bersalin (VK)', type: 'unit_internal', description: 'Pelayanan persalinan normal dan nifas', manager: 'Bidan Rahmah, Str.Keb' },
  { id: 'pos_ptm', name: 'Pos PTM (Penyakit Tidak Menular)', type: 'jejaring', description: 'Pelayanan skrinning dan terapi penyakit kronis di masyarakat', manager: 'Siti Sarah, S.Kep' }
];

export const INITIAL_MEDICINES: Medicine[] = [
  { id: 'med-01', name: 'Paracetamol 500mg Tablet', type: 'generik', isNarkotikaPsikotropika: false, group: 'biasa', unit: 'Tablet', compoundType: 'non-racikan', description: 'Analgetik dan antipiretik lini pertama' },
  { id: 'med-02', name: 'Amoxicillin 500mg Tablet', type: 'generik', isNarkotikaPsikotropika: false, group: 'biasa', unit: 'Tablet', compoundType: 'non-racikan', description: 'Antibiotik lini pertama infeksi bakteri' },
  { id: 'med-03', name: 'Amlodipine 5mg Tablet', type: 'generik', isNarkotikaPsikotropika: false, group: 'biasa', unit: 'Tablet', compoundType: 'non-racikan', description: 'Antihipertensi golongan Calcium Channel Blocker' },
  { id: 'med-04', name: 'Metformin 500mg Tablet', type: 'generik', isNarkotikaPsikotropika: false, group: 'biasa', unit: 'Tablet', compoundType: 'non-racikan', description: 'Antidiabetes oral golongan biguanid' },
  { id: 'med-05', name: 'Amoxsan 125mg/5ml Sirup', type: 'paten', isNarkotikaPsikotropika: false, group: 'biasa', unit: 'Botol', compoundType: 'non-racikan', description: 'Antibiotik amoxicillin paten untuk anak' },
  { id: 'med-06', name: 'Diazepam 2mg Tablet', type: 'generik', isNarkotikaPsikotropika: true, group: 'psikotropika', unit: 'Tablet', compoundType: 'non-racikan', description: 'Antiansietas, antikonvulsan golongan benzodiazepin' },
  { id: 'med-07', name: 'Codein 10mg Tablet', type: 'generik', isNarkotikaPsikotropika: true, group: 'narkotika', unit: 'Tablet', compoundType: 'non-racikan', description: 'Antitusif dan analgetik narkotik golongan III' },
  { id: 'med-08', name: 'Alprazolam 0.5mg Tablet', type: 'generik', isNarkotikaPsikotropika: true, group: 'psikotropika', unit: 'Tablet', compoundType: 'non-racikan', description: 'Pengobatan jangka pendek gangguan cemas' },
  { id: 'med-09', name: 'Clobazam 10mg Tablet', type: 'generik', isNarkotikaPsikotropika: true, group: 'psikotropika', unit: 'Tablet', compoundType: 'non-racikan', description: 'Terapi tambahan pada epilepsi golongan benzodiazepin' },
  { id: 'med-10', name: 'Ventolin Inhaler 100mcg', type: 'paten', isNarkotikaPsikotropika: false, group: 'biasa', unit: 'Botol', compoundType: 'non-racikan', description: 'Bronkodilator asma akut (Salbutamol paten)' },
  { id: 'med-11', name: 'Ceftriaxone 1g Injeksi', type: 'generik', isNarkotikaPsikotropika: false, group: 'biasa', unit: 'Vial', compoundType: 'non-racikan', description: 'Antibiotik cephalosporin generasi ketiga injeksi' },
  { id: 'med-12', name: 'Fentanyl 0.05mg/ml Injeksi', type: 'paten', isNarkotikaPsikotropika: true, group: 'narkotika', unit: 'Ampul', compoundType: 'non-racikan', description: 'Analgetik opioid kuat intensif premedikasi anestesi' },
  { id: 'med-13', name: 'Obat Racikan Flu & Batuk', type: 'generik', isNarkotikaPsikotropika: false, group: 'biasa', unit: 'Puyer', compoundType: 'racikan', description: 'Formulasi racikan Paracetamol + CTM + GG' },
  { id: 'med-14', name: 'Sanmol 120mg/5ml Syrup', type: 'paten', isNarkotikaPsikotropika: false, group: 'biasa', unit: 'Botol', compoundType: 'non-racikan', description: 'Paracetamol paten rasa manis untuk anak' },
  { id: 'med-15', name: 'Diazepam 5mg/ml Injeksi', type: 'generik', isNarkotikaPsikotropika: true, group: 'psikotropika', unit: 'Ampul', compoundType: 'non-racikan', description: 'Sedatif anti-kejang darurat injeksi ampul' }
];

export const INITIAL_STOCKS: StockStore = {
  gudang: {
    'med-01': {
      total: 5500,
      batches: [
        { batchNo: 'B-PCT01', expDate: '2026-09-15', quantity: 1500, source: 'DAK' }, // < 6 months (Red)
        { batchNo: 'B-PCT02', expDate: '2027-02-10', quantity: 2000, source: 'JKN' }, // 7 - 12 months (Yellow)
        { batchNo: 'B-PCT03', expDate: '2028-06-20', quantity: 2000, source: 'DAU' }  // Clear
      ]
    },
    'med-02': {
      total: 3200,
      batches: [
        { batchNo: 'B-AMX01', expDate: '2026-08-30', quantity: 1200, source: 'Program' }, // < 6 months (Red)
        { batchNo: 'B-AMX02', expDate: '2027-10-15', quantity: 2000, source: 'DAK' }  // Clear
      ]
    },
    'med-03': {
      total: 4500,
      batches: [
        { batchNo: 'B-AML01', expDate: '2027-01-20', quantity: 2500, source: 'DAU' }, // 7 - 12 months (Yellow)
        { batchNo: 'B-AML02', expDate: '2028-08-01', quantity: 2000, source: 'JKN' }
      ]
    },
    'med-04': {
      total: 4000,
      batches: [
        { batchNo: 'B-MET01', expDate: '2026-10-30', quantity: 1000, source: 'DAK' }, // < 6 months (Red)
        { batchNo: 'B-MET02', expDate: '2028-04-12', quantity: 3000, source: 'JKN' }
      ]
    },
    'med-05': {
      total: 150,
      batches: [
        { batchNo: 'B-AXS01', expDate: '2026-12-05', quantity: 50, source: 'JKN' },  // < 6 months (Red)
        { batchNo: 'B-AXS02', expDate: '2027-05-18', quantity: 100, source: 'JKN' }  // 7 - 12 months (Yellow)
      ]
    },
    'med-06': {
      total: 800,
      batches: [
        { batchNo: 'B-DIA01', expDate: '2027-03-30', quantity: 300, source: 'Program' }, // 7 - 12 months (Yellow)
        { batchNo: 'B-DIA02', expDate: '2028-09-01', quantity: 500, source: 'Program' }
      ]
    },
    'med-07': {
      total: 1200,
      batches: [
        { batchNo: 'B-COD01', expDate: '2027-05-12', quantity: 400, source: 'DAK' }, // 7 - 12 months (Yellow)
        { batchNo: 'B-COD02', expDate: '2028-11-20', quantity: 800, source: 'DAK' }
      ]
    },
    'med-08': {
      total: 500,
      batches: [
        { batchNo: 'B-ALP01', expDate: '2026-07-25', quantity: 200, source: 'JKN' }, // < 6 months (Red)
        { batchNo: 'B-ALP02', expDate: '2027-11-05', quantity: 300, source: 'JKN' }
      ]
    },
    'med-09': {
      total: 600,
      batches: [
        { batchNo: 'B-CLO01', expDate: '2027-08-30', quantity: 600, source: 'DAK' }
      ]
    },
    'med-10': {
      total: 120,
      batches: [
        { batchNo: 'B-VNT01', expDate: '2026-11-10', quantity: 40, source: 'JKN' },  // < 6 months (Red)
        { batchNo: 'B-VNT02', expDate: '2027-09-22', quantity: 80, source: 'JKN' }
      ]
    },
    'med-11': {
      total: 300,
      batches: [
        { batchNo: 'B-CFT01', expDate: '2027-04-10', quantity: 100, source: 'DAU' }, // 7 - 12 months (Yellow)
        { batchNo: 'B-CFT02', expDate: '2028-05-15', quantity: 200, source: 'DAU' }
      ]
    },
    'med-12': {
      total: 150,
      batches: [
        { batchNo: 'B-FNT01', expDate: '2027-06-20', quantity: 50, source: 'Program' }, // 7 - 12 months (Yellow)
        { batchNo: 'B-FNT02', expDate: '2029-01-10', quantity: 100, source: 'Program' }
      ]
    },
    'med-14': {
      total: 180,
      batches: [
        { batchNo: 'B-SNM01', expDate: '2027-07-07', quantity: 180, source: 'JKN' }
      ]
    },
    'med-15': {
      total: 110,
      batches: [
        { batchNo: 'B-DIJ01', expDate: '2026-12-01', quantity: 50, source: 'Program' }, // < 6 months (Red)
        { batchNo: 'B-DIJ02', expDate: '2028-03-10', quantity: 60, source: 'Program' }
      ]
    }
  },
  ruang_farmasi: {
    'med-01': { total: 450 },
    'med-02': { total: 320 },
    'med-03': { total: 200 },
    'med-04': { total: 280 },
    'med-05': { total: 15 },
    'med-06': { total: 60 },
    'med-07': { total: 80 },
    'med-08': { total: 30 },
    'med-09': { total: 40 },
    'med-10': { total: 8 },
    'med-11': { total: 12 },
    'med-13': { total: 100 }, // Racikan
    'med-14': { total: 20 }
  },
  pustu: {
    'med-01': { total: 120 },
    'med-02': { total: 80 },
    'med-03': { total: 50 },
    'med-04': { total: 60 }
  },
  igd: {
    'med-01': { total: 50 },
    'med-02': { total: 30 },
    'med-11': { total: 24 },
    'med-15': { total: 10 }
  },
  lab: {
    'med-01': { total: 10 }
  },
  ruang_perawatan: {
    'med-01': { total: 150 },
    'med-02': { total: 100 },
    'med-11': { total: 40 }
  },
  poli_gizi: {
    'med-14': { total: 15 }
  },
  poli_tb: {
    'med-02': { total: 250 }
  },
  kamar_bersalin: {
    'med-01': { total: 40 },
    'med-15': { total: 8 }
  },
  pos_ptm: {
    'med-03': { total: 150 },
    'med-04': { total: 120 }
  }
};

export const INITIAL_RECEIPTS: Receipt[] = [
  {
    id: 'RCP-001',
    date: '2026-05-10',
    sourceType: 'Instalasi Farmasi Kota',
    documentType: 'BAP',
    documentNo: 'BAP/IFK/0526-22',
    items: [
      { medicineId: 'med-01', quantity: 2000, batchNo: 'B-PCT03', expDate: '2028-06-20', source: 'DAU', condition: 'Baik' },
      { medicineId: 'med-03', quantity: 2000, batchNo: 'B-AML02', expDate: '2028-08-01', source: 'JKN', condition: 'Baik' }
    ],
    verifiedByGudang: true,
    verifiedByAPJ: true,
    gudangOfficer: 'Andi Sukri, A.Md.Farm',
    apjName: 'Apoteker Penanggung Jawab Parepare',
    timestamp: '2026-05-10T10:00:00Z'
  },
  {
    id: 'RCP-002',
    date: '2026-06-01',
    sourceType: 'PBF',
    documentType: 'Faktur',
    documentNo: 'FKT-99221-MKB',
    items: [
      { medicineId: 'med-05', quantity: 100, batchNo: 'B-AXS02', expDate: '2027-05-18', source: 'JKN', condition: 'Baik' },
      { medicineId: 'med-10', quantity: 80, batchNo: 'B-VNT02', expDate: '2027-09-22', source: 'JKN', condition: 'Baik' }
    ],
    verifiedByGudang: true,
    verifiedByAPJ: true,
    gudangOfficer: 'Andi Sukri, A.Md.Farm',
    apjName: 'Apoteker Penanggung Jawab Parepare',
    timestamp: '2026-06-01T14:30:00Z'
  }
];

export const INITIAL_AMPRAS: Ampra[] = [
  {
    id: 'AMP-001',
    date: '2026-06-15',
    sourceUnitId: 'ruang_farmasi',
    cycleType: 'Harian',
    status: 'Selesai',
    items: [
      { medicineId: 'med-01', requestedQty: 300, approvedQty: 300 },
      { medicineId: 'med-02', requestedQty: 200, approvedQty: 200 },
      { medicineId: 'med-07', requestedQty: 50, approvedQty: 50 }
    ],
    verifiedGudang: true,
    verifiedAPJ: true,
    verifiedUnit: true,
    gudangOfficer: 'Andi Sukri, A.Md.Farm',
    unitOfficer: 'Hj. Syarifah, S.Farm., Apt',
    apjName: 'Ami Rahmawati, S.Farm, Apt',
    noBAP: 'BA-AMP/GUD/2026-06-15/01',
    timestamp: '2026-06-15T09:30:00Z'
  },
  {
    id: 'AMP-002',
    date: '2026-06-16',
    sourceUnitId: 'pustu',
    cycleType: 'Bulanan',
    status: 'Selesai',
    items: [
      { medicineId: 'med-01', requestedQty: 100, approvedQty: 100 },
      { medicineId: 'med-03', requestedQty: 50, approvedQty: 50 }
    ],
    verifiedGudang: true,
    verifiedAPJ: true,
    verifiedUnit: true,
    gudangOfficer: 'Andi Sukri, A.Md.Farm',
    unitOfficer: 'Salmawati, S.Kep',
    apjName: 'Ami Rahmawati, S.Farm, Apt',
    noBAP: 'BA-AMP/GUD/2026-06-16/02',
    timestamp: '2026-06-16T11:00:00Z'
  }
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'RX-10001',
    date: '2026-06-17',
    patientName: 'Ny. Rosdiana',
    drName: 'dr. Akhmad',
    age: 45,
    type: 'Rawat Jalan',
    items: [
      { medicineId: 'med-01', qty: 15, dosage: '3 x 1 tablet', isCompound: false },
      { medicineId: 'med-03', qty: 10, dosage: '1 x 1 tablet', isCompound: false }
    ],
    timestamp: '2026-06-17T08:15:00Z'
  },
  {
    id: 'RX-10002',
    date: '2026-06-17',
    patientName: 'Anak Budiarto',
    drName: 'dr. Mega Utami',
    age: 5,
    type: 'Rawat Jalan',
    items: [
      { medicineId: 'med-13', qty: 10, dosage: '3 x 1 puyer', isCompound: true }, // Racikan
      { medicineId: 'med-14', qty: 1, dosage: '3 x 1 sendok teh (5ml)', isCompound: false } // Paten Sanmol
    ],
    timestamp: '2026-06-17T09:00:00Z'
  },
  {
    id: 'RX-10003',
    date: '2026-06-17',
    patientName: 'Tn. Haris Munandar',
    drName: 'dr. Akhmad',
    age: 52,
    type: 'Rawat Inap',
    items: [
      { medicineId: 'med-02', qty: 20, dosage: '3 x 1 tablet', isCompound: false },
      { medicineId: 'med-07', qty: 10, dosage: '2 x 1 tablet', isCompound: false } // Narkotika Codein
    ],
    timestamp: '2026-06-17T10:10:00Z'
  }
];

export const INITIAL_USAGES: DailyUsage[] = [
  {
    id: 'USG-001',
    date: '2026-06-17',
    unitId: 'ruang_farmasi',
    items: [
      { medicineId: 'med-01', qtyUsed: 15 },
      { medicineId: 'med-02', qtyUsed: 20 },
      { medicineId: 'med-03', qtyUsed: 10 },
      { medicineId: 'med-07', qtyUsed: 10 },
      { medicineId: 'med-14', qtyUsed: 1 }
    ],
    officerName: 'Hj. Syarifah, S.Farm., Apt',
    timestamp: '2026-06-17T11:45:00Z'
  },
  {
    id: 'USG-002',
    date: '2026-06-17',
    unitId: 'pustu',
    items: [
      { medicineId: 'med-01', qtyUsed: 12 },
      { medicineId: 'med-02', qtyUsed: 8 }
    ],
    officerName: 'Salmawati, S.Kep',
    timestamp: '2026-06-17T12:00:00Z'
  }
];

export const INITIAL_DISPOSALS: Disposal[] = [
  {
    id: 'DSP-001',
    date: '2026-06-10',
    type: 'Retur',
    documentNo: 'BA-RETUR/IFK/2026/01',
    items: [
      { medicineId: 'med-01', qty: 100, batchNo: 'B-PCT01', reason: 'Kelebihan alokasi dinkes' }
    ],
    isApprovedAPJ: true,
    officerName: 'Andi Sukri, A.Md.Farm',
    recipientName: 'Bpk. Ridwan (Logistik IFK Parepare)',
    timestamp: '2026-06-10T14:00:00Z'
  }
];
