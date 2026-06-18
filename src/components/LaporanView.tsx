/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Medicine, StockStore, Receipt, Ampra, Prescription, DailyUsage, UnitInfo } from '../types';
import { ClipboardList, TrendingUp, BarChart2, Shield, DollarSign, Pill, Layers, Layers3, Activity, Download, Filter, HelpCircle, Server, FileText, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface LaporanViewProps {
  medicines: Medicine[];
  units: UnitInfo[];
  stocks: StockStore;
  receipts: Receipt[];
  ampras: Ampra[];
  prescriptions: Prescription[];
  usages: DailyUsage[];
  userName?: string;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onNavigateChange?: (view: string) => void;
}

export default function LaporanView({
  medicines,
  units,
  stocks,
  receipts,
  ampras,
  prescriptions,
  usages,
  userName = 'Petugas Farmasi',
  onNotify,
  onNavigateChange,
}: LaporanViewProps) {
  // Notification helper
  const showNotice = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    if (onNotify) {
      onNotify(type, message);
    } else {
      alert(message);
    }
  };

  const translateType = (t: string) => {
    switch (t) {
      case 'stok_opname': return 'Opname Sisa Stok';
      case 'stok_mutasi': return 'Ringkasan Stok & Mutasi';
      case 'keuangan_dinas': return 'Keuangan Dinas';
      case 'keuangan_jkn': return 'Dana JKN Kapitasi';
      case 'napza': return 'Mutasi Narkotika & Psikotropika';
      case 'kefarmasian': return 'Beban Kefarmasian';
      case 'generik_paten': return 'Rasio Generik vs Paten';
      default: return t;
    }
  };
  const [activeReportTab, setActiveReportTab] = useState<'stok_opname' | 'stok_mutasi' | 'keuangan_dinas' | 'keuangan_jkn' | 'napza' | 'kefarmasian' | 'generik_paten'>('stok_opname');

  // Filters
  const [financeSourceFilter, setFinanceSourceFilter] = useState<'ALL' | 'DAK' | 'DAU' | 'Program'>('ALL');
  const [napzaGroupFilter, setNapzaGroupFilter] = useState<'ALL' | 'narkotika' | 'psikotropika'>('ALL');
  const [expandedDrugId, setExpandedDrugId] = useState<string | null>(null);

  // Unified Estimated pricing for valuation reports
  const GET_DRUG_PRICE = (medId: string) => {
    const prices: { [k: string]: number } = {
      'med-01': 350,   // Paracetamol
      'med-02': 650,   // Amoxicillin
      'med-03': 1200,  // Amlodipine
      'med-04': 450,   // Metformin
      'med-05': 18500, // Amoxsan Syr
      'med-06': 1500,  // Diazepam
      'med-07': 3500,  // Codein
      'med-08': 2500,  // Alprazolam
      'med-09': 4000,  // Clobazam
      'med-10': 95000, // Ventolin
      'med-11': 45000, // Ceftriaxone
      'med-12': 125000,// Fentanyl
      'med-13': 1500,  // Racikan Flu
      'med-14': 22000, // Sanmol Syr
      'med-15': 38000, // Diazepam Inj
    };
    return prices[medId] || 1000;
  };

  // 1. LAPORAN STOK OPNAME PERSIDIAAN BULANAN
  const stokOpnameData = useMemo(() => {
    return medicines.map(med => {
      const locationsQty: { [unitId: string]: number } = {};
      let globalSum = 0;

      units.forEach(unit => {
        const qty = stocks[unit.id]?.[med.id]?.total || 0;
        locationsQty[unit.id] = qty;
        globalSum += qty;
      });

      // Precise asset value estimation based on varying entry prices/batches
      let valueEstimation = 0;
      const gudStockObj = stocks['gudang']?.[med.id];
      let gudTotalInBatches = 0;
      if (gudStockObj && gudStockObj.batches) {
        gudStockObj.batches.forEach(b => {
          gudTotalInBatches += b.quantity;
          const price = b.price || GET_DRUG_PRICE(med.id);
          valueEstimation += b.quantity * price;
        });
      }

      const remainingGudang = Math.max(0, (gudStockObj?.total || 0) - gudTotalInBatches);
      const otherUnitsTotal = units.filter(u => u.id !== 'gudang').reduce((sum, u) => sum + (stocks[u.id]?.[med.id]?.total || 0), 0);
      valueEstimation += (remainingGudang + otherUnitsTotal) * GET_DRUG_PRICE(med.id);

      return {
        id: med.id,
        name: med.name,
        unit: med.unit,
        type: med.type,
        group: med.group,
        locations: locationsQty,
        globalSum,
        valueEstimation
      };
    });
  }, [medicines, units, stocks]);

  // Overall financial value sum
  const totalStockValuation = useMemo(() => {
    return stokOpnameData.reduce((sum, item) => sum + item.valueEstimation, 0);
  }, [stokOpnameData]);

  // 7. RINGKASAN MUTASI & STOK BARANG
  const mutasiStokData = useMemo(() => {
    return medicines.map(med => {
      // 1. Stok Akhir (Physical sum across all units)
      let stokAkhir = 0;
      units.forEach(unit => {
        stokAkhir += stocks[unit.id]?.[med.id]?.total || 0;
      });

      // 2. Penerimaan (Stok Masuk) - from verified receipts
      let totalPenerimaan = 0;
      receipts.forEach(r => {
        if (r.verifiedByAPJ) {
          r.items.forEach(item => {
            if (item.medicineId === med.id) {
              totalPenerimaan += item.quantity;
            }
          });
        }
      });

      // 3. Pengeluaran (Mutasi/Distribusi/Bahan Keluar) - prescriptions & usages
      let totalPengeluaran = 0;
      prescriptions.forEach(p => {
        p.items.forEach(item => {
          if (item.medicineId === med.id) {
            totalPengeluaran += item.qty;
          }
        });
      });
      usages.forEach(u => {
        u.items.forEach(item => {
          if (item.medicineId === med.id) {
            totalPengeluaran += item.qtyUsed;
          }
        });
      });

      // 4. Stok Awal = Stok Akhir + Pengeluaran - Penerimaan
      const stokAwal = Math.max(0, stokAkhir + totalPengeluaran - totalPenerimaan);

      const correspondingOpname = stokOpnameData.find(item => item.id === med.id);
      const valueEstimation = correspondingOpname ? correspondingOpname.valueEstimation : stokAkhir * GET_DRUG_PRICE(med.id);

      return {
        id: med.id,
        name: med.name,
        unit: med.unit,
        type: med.type,
        group: med.group,
        stokAwal,
        penerimaan: totalPenerimaan,
        pengeluaran: totalPengeluaran,
        stokAkhir,
        valueEstimation
      };
    });
  }, [stokOpnameData, medicines, units, stocks, receipts, prescriptions, usages]);


  // 2. LAPORAN KEUANGAN DINAS KESEHATAN
  const keuanganDinasData = useMemo(() => {
    // Collect batch-level stock in Gudang filtered by source (DAK / DAU / Program)
    // For other units, we approximate the source proportional to Gudang's current batch ratios, or display Gudang real vs other satellite stores
    return medicines.map(med => {
      let gudangApprovedBatchesTotal = 0;
      let valuation = 0;
      
      const gudStockObj = stocks['gudang']?.[med.id];
      if (gudStockObj && gudStockObj.batches) {
        gudStockObj.batches.forEach(b => {
          const isMatch = financeSourceFilter === 'ALL' || b.source === financeSourceFilter;
          const isDinasSource = b.source === 'DAK' || b.source === 'DAU' || b.source === 'Program';
          
          if (isMatch && (financeSourceFilter !== 'ALL' || isDinasSource)) {
            gudangApprovedBatchesTotal += b.quantity;
          }
        });
      }

      // Pro-rate other units' stock if no batch trace
      // Non-gudang sisa stok is added to Dinas if not specifically JKN
      let satelliteTotal = 0;
      units.filter(u => u.id !== 'gudang').forEach(u => {
        satelliteTotal += stocks[u.id]?.[med.id]?.total || 0;
      });

      // Sum all Dinas stocks
      const combinedDinasQty = gudangApprovedBatchesTotal + (financeSourceFilter === 'ALL' ? satelliteTotal : 0);
      valuation = combinedDinasQty * GET_DRUG_PRICE(med.id);

      return {
        medicine: med,
        gudangQty: gudangApprovedBatchesTotal,
        satelliteQty: financeSourceFilter === 'ALL' ? satelliteTotal : 0,
        combinedTotal: combinedDinasQty,
        price: GET_DRUG_PRICE(med.id),
        valuation
      };
    }).filter(item => item.combinedTotal > 0);
  }, [medicines, stocks, financeSourceFilter, units]);


  // 3. LAPORAN KEUANGAN JKN (PEMBELIAN SENDIRI)
  const keuanganJKNData = useMemo(() => {
    return medicines.map(med => {
      let jknGudangQty = 0;
      
      const gudStockObj = stocks['gudang']?.[med.id];
      if (gudStockObj && gudStockObj.batches) {
        gudStockObj.batches.forEach(b => {
          if (b.source === 'JKN') {
            jknGudangQty += b.quantity;
          }
        });
      }

      // Approx Ruang Farmasi patent medicines as JKN-funded
      const apotekQty = stocks['ruang_farmasi']?.[med.id]?.total || 0;
      const combinedJKNQyt = jknGudangQty + (med.type === 'paten' ? apotekQty : 0);
      const valuation = combinedJKNQyt * GET_DRUG_PRICE(med.id);

      return {
        medicine: med,
        gudangQty: jknGudangQty,
        apotekQty: med.type === 'paten' ? apotekQty : 0,
        combinedTotal: combinedJKNQyt,
        price: GET_DRUG_PRICE(med.id),
        valuation
      };
    }).filter(item => item.combinedTotal > 0);
  }, [medicines, stocks]);


  // 4. LAPORAN NARKOTIKA & PSIKOTROPIKA (NAPZA)
  const napzaData = useMemo(() => {
    return medicines.filter(med => {
      if (napzaGroupFilter === 'ALL') return med.isNarkotikaPsikotropika;
      return med.group === napzaGroupFilter;
    }).map(med => {
      // Calculate starting balance model (stock + previous transactions if any)
      const stokGudang = stocks['gudang']?.[med.id]?.total || 0;
      const stokApotek = stocks['ruang_farmasi']?.[med.id]?.total || 0;
      
      let totalUnitStok = 0;
      units.filter(u => u.id !== 'gudang' && u.id !== 'ruang_farmasi').forEach(u => {
        totalUnitStok += stocks[u.id]?.[med.id]?.total || 0;
      });

      // Aggregate logged expenditure (Patient prescription or log usages)
      let totalUsage = 0;
      prescriptions.forEach(p => {
        p.items.forEach(i => {
          if (i.medicineId === med.id) totalUsage += i.qty;
        });
      });
      usages.forEach(u => {
        u.items.forEach(i => {
          if (i.medicineId === med.id) totalUsage += i.qtyUsed;
        });
      });

      return {
        id: med.id,
        name: med.name,
        group: med.group,
        unit: med.unit,
        stokGudang,
        stokApotek,
        totalUnitStok,
        totalUsage,
        globalStock: stokGudang + stokApotek + totalUnitStok
      };
    });
  }, [medicines, stocks, napzaGroupFilter, prescriptions, usages, units]);


  // 5. LAPORAN PEKERJAAN KEFARMASIAN
  const kefarmasianMetrics = useMemo(() => {
    const totalSheets = prescriptions.length;
    const rawatJalanCount = prescriptions.filter(p => p.type === 'Rawat Jalan').length;
    const rawatInapCount = prescriptions.filter(p => p.type === 'Rawat Inap').length;

    // Count drug types and items
    let totalItemsDispensed = 0;
    let totalLinesInRx = 0;

    prescriptions.forEach(p => {
      totalLinesInRx += p.items.length;
      p.items.forEach(item => {
        totalItemsDispensed += item.qty;
      });
    });

    const averageItemsPerRx = totalSheets > 0 ? (totalLinesInRx / totalSheets).toFixed(1) : 0;

    // Categorized list of prescription logs
    return {
      totalSheets,
      rawatJalanCount,
      rawatInapCount,
      totalItemsDispensed,
      averageItemsPerRx,
      prescriptionHistory: prescriptions
    };
  }, [prescriptions]);


  // 6. LAPORAN OBAT GENERIK DAN PATEN
  const generikPatenMetrics = useMemo(() => {
    let generikVolume = 0;
    let patenVolume = 0;
    let totalLineItems = 0;
    let compoundCount = 0; // racikan
    let nonCompoundCount = 0; // non-racikan

    prescriptions.forEach(p => {
      p.items.forEach(item => {
        totalLineItems++;
        const med = medicines.find(m => m.id === item.medicineId);
        
        if (item.isCompound) {
          compoundCount++;
        } else {
          nonCompoundCount++;
        }

        if (med) {
          if (med.type === 'generik') {
            generikVolume += item.qty;
          } else if (med.type === 'paten') {
            patenVolume += item.qty;
          }
        }
      });
    });

    const totalVolume = generikVolume + patenVolume;
    const generikPercentage = totalVolume > 0 ? ((generikVolume / totalVolume) * 100).toFixed(1) : 0;
    const patenPercentage = totalVolume > 0 ? ((patenVolume / totalVolume) * 100).toFixed(1) : 0;

    return {
      generikVolume,
      patenVolume,
      totalVolume,
      generikPercentage,
      patenPercentage,
      compoundCount,
      nonCompoundCount,
      totalLineItems
    };
  }, [prescriptions, medicines]);

  // HELPER FOR EXCEL CSV EXPORT
  const downloadCSVForExcel = (filename: string, headers: string[], rows: string[][]) => {
    // UTF-8 BOM for Excel compatibility
    const BOM = "\uFEFF";
    const formattedRows = rows.map(r => 
      r.map(cell => {
        const cellStr = cell === null || cell === undefined ? "" : String(cell);
        const escaped = cellStr.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(";") // Semicolon is standard in Indonesian regional settings for Excel CSVS
    );
    const csvContent = BOM + [headers.join(";"), ...formattedRows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = (type: string) => {
    const currentDateStr = new Date().toISOString().split('T')[0];
    if (type === 'stok_opname') {
      const filename = `Laporan_Stok_Opname_SIFP_${currentDateStr}.csv`;
      const headers = [
        'Sediaan Farmasi', 'Kategori', 'Satuan', 'Gudang', 'Apotek', 
        'Pustu', 'IGD', 'LAB', 'Rawat Inap', 'Gizi', 'Poli TB', 
        'VK Bersalin', 'Pos PTM', 'Total Global Sisa Stok', 'Estimasi Nilai Aset (Rp)'
      ];
      const rows = stokOpnameData.map(item => [
        item.name,
        item.group === 'narkotika' ? 'Narkotika' : item.group === 'psikotropika' ? 'Psikotropika' : item.type === 'generik' ? 'Generik' : 'Paten',
        item.unit,
        String(item.locations['gudang'] || 0),
        String(item.locations['ruang_farmasi'] || 0),
        String(item.locations['pustu'] || 0),
        String(item.locations['igd'] || 0),
        String(item.locations['lab'] || 0),
        String(item.locations['ruang_perawatan'] || 0),
        String(item.locations['poli_gizi'] || 0),
        String(item.locations['poli_tb'] || 0),
        String(item.locations['kamar_bersalin'] || 0),
        String(item.locations['pos_ptm'] || 0),
        String(item.globalSum),
        String(item.valueEstimation)
      ]);
      downloadCSVForExcel(filename, headers, rows);
    } else if (type === 'stok_mutasi') {
      const filename = `Laporan_Mutasi_Stok_SIFP_${currentDateStr}.csv`;
      const headers = [
        'Sediaan Farmasi', 'Satuan', 'Stok Awal', 'Penerimaan (+)', 'Pengeluaran (-)', 'Stok Akhir', 'Estimasi Nilai (Rp)'
      ];
      const rows = mutasiStokData.map(item => [
        item.name,
        item.unit,
        String(item.stokAwal),
        String(item.penerimaan),
        String(item.pengeluaran),
        String(item.stokAkhir),
        String(item.valueEstimation)
      ]);
      downloadCSVForExcel(filename, headers, rows);
    } else if (type === 'keuangan_dinas') {
      const filename = `Laporan_Keuangan_Dinas_SIFP_${currentDateStr}.csv`;
      const headers = [
        'Obat', 'Golongan Sediaan', 'Fisik Gudang DAK/DAU', 'Porsi Pelayanan', 'Gabungan Total', 'Harga Satuan (Rp)', 'Estimasi Anggaran (Rp)'
      ];
      const rows = keuanganDinasData.map(item => [
        item.medicine.name,
        item.medicine.type === 'generik' ? 'Generik' : 'Paten',
        String(item.gudangQty),
        String(item.satelliteQty),
        String(item.combinedTotal),
        String(item.price),
        String(item.valuation)
      ]);
      downloadCSVForExcel(filename, headers, rows);
    } else if (type === 'keuangan_jkn') {
      const filename = `Laporan_Keuangan_JKN_SIFP_${currentDateStr}.csv`;
      const headers = [
        'Obat', 'Merek / Formulir', 'Fisik JKN Gudang', 'Porsi Apotek', 'Sisa Stok JKN', 'Harga Pengadaan (Rp)', 'Nilai Kapitasi (Rp)'
      ];
      const rows = keuanganJKNData.map(item => [
        item.medicine.name,
        item.medicine.type === 'paten' ? 'Paten Non-Ekat' : 'Generik Formularium',
        String(item.gudangQty),
        String(item.apotekQty),
        String(item.combinedTotal),
        String(item.price),
        String(item.valuation)
      ]);
      downloadCSVForExcel(filename, headers, rows);
    } else if (type === 'napza') {
      const filename = `Laporan_Napza_SIFP_${currentDateStr}.csv`;
      const headers = [
        'Nama Sediaan', 'Golongan', 'Fisik Gudang Utama', 'Fisik Apotek', 'Stok Unit Lain', 'Total Pengeluaran (Resep+Unit)', 'Sisa Stok Gabungan'
      ];
      const rows = napzaData.map(item => [
        item.name,
        item.group.toUpperCase(),
        String(item.stokGudang),
        String(item.stokApotek),
        String(item.totalUnitStok),
        String(item.totalUsage),
        String(item.globalStock)
      ]);
      downloadCSVForExcel(filename, headers, rows);
    } else if (type === 'kefarmasian') {
      const filename = `Laporan_Beban_Kefarmasian_SIFP_${currentDateStr}.csv`;
      const headers = [
        'Kode Resep', 'Tanggal Pelayanan', 'Nama Pasien', 'Umur', 'Jenis Rawat', 'Dokter Penulis resep', 'Variasi Item', 'Volume Diserahkan (pcs)'
      ];
      const rows = kefarmasianMetrics.prescriptionHistory.map(rx => [
        rx.id,
        rx.date,
        rx.patientName,
        String(rx.age),
        rx.type,
        rx.drName,
        String(rx.items.length),
        String(rx.items.reduce((s, i) => s + i.qty, 0))
      ]);
      downloadCSVForExcel(filename, headers, rows);
    } else if (type === 'generik_paten') {
      const filename = `Laporan_Generik_Paten_SIFP_${currentDateStr}.csv`;
      const headers = ['Metrik Penggunaan Obat', 'Nilai / Volume', 'Persentase Share (%)'];
      const rows = [
        ['Volume Obat Generik Berresep', String(generikPatenMetrics.generikVolume), `${generikPatenMetrics.generikPercentage}%`],
        ['Volume Obat Paten Berresep', String(generikPatenMetrics.patenVolume), `${generikPatenMetrics.patenPercentage}%`],
        ['Jumlah Sediaan Racikan (Compounded)', String(generikPatenMetrics.compoundCount), 'N/A'],
        ['Jumlah Sediaan Non-Racikan', String(generikPatenMetrics.nonCompoundCount), 'N/A'],
        ['Total Volume Pengeluaran', String(generikPatenMetrics.totalVolume), '100.0%']
      ];
      downloadCSVForExcel(filename, headers, rows);
    }
    showNotice('success', `Laporan ${translateType(type)} SIFP berhasil diekspor ke Excel (.csv)!`);
  };

  const handleExportPDF = (type: string) => {
    const doc = new jsPDF({
      orientation: type === 'stok_opname' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Outer margin
    const marginX = 15;
    let currentY = 15;
    
    // Letterhead header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PEMERINTAH KOTA PAREPARE", doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
    currentY += 6;
    
    doc.setFontSize(16);
    doc.text("DINAS KESEHATAN KOTA PAREPARE", doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
    currentY += 6;
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text("UPTD PUSKESMAS PERINTIS PAREPARE", doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
    currentY += 4;
    
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text("Jl. Jend. Sudirman No. 12, Parepare, Sulawesi Selatan - Kode Pos 91122", doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
    currentY += 5;
    
    // Horizontal line (kop surat)
    doc.setDrawColor(30, 41, 59); // deep slate
    doc.setLineWidth(1.0);
    doc.line(marginX, currentY, doc.internal.pageSize.getWidth() - marginX, currentY);
    doc.setLineWidth(0.3);
    doc.line(marginX, currentY + 1.2, doc.internal.pageSize.getWidth() - marginX, currentY + 1.2);
    currentY += 7;
    
    // Reset text color
    doc.setTextColor(30, 41, 59);
    
    // Report Title & Date
    let titleStr = "";
    let metaStr = "";
    const dateTimeStr = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
    
    if (type === 'stok_opname') {
      titleStr = "LAPORAN FISIK STOK OPNAME SEDIAAN FARMASI";
      metaStr = `Total Estimasi Aset Sediaan: Rp ${totalStockValuation.toLocaleString('id-ID')}`;
    } else if (type === 'stok_mutasi') {
      titleStr = "LAPORAN RINGKASAN MUTASI & STOK SEDIAAN FARMASI";
      const totalMutStockVal = mutasiStokData.reduce((s, i) => s + i.valueEstimation, 0);
      metaStr = `Total Nilai Sisa Persediaan Akhir: Rp ${totalMutStockVal.toLocaleString('id-ID')} | Total Item Sediaan: ${mutasiStokData.length} Jenis`;
    } else if (type === 'keuangan_dinas') {
      titleStr = `LAPORAN EVALUASI ANGGARAN SEDIAAN FARMASI (ANGGARAN DINAS - ${financeSourceFilter})`;
      const sumVal = keuanganDinasData.reduce((s, i) => s + i.valuation, 0);
      metaStr = `Total Sediaan Terpenuhi: Rp ${sumVal.toLocaleString('id-ID')}`;
    } else if (type === 'keuangan_jkn') {
      titleStr = "LAPORAN PENGADAAN & NILAI KAPITASI SEDIAAN JKN MANDIRI";
      const sumVal = keuanganJKNData.reduce((s, i) => s + i.valuation, 0);
      metaStr = `Total Realisasi Pembelian Kapitasi JKN: Rp ${sumVal.toLocaleString('id-ID')}`;
    } else if (type === 'napza') {
      titleStr = `LAPORAN BULANAN MUTASI NARKOTIKA & PSIKOTROPIKA (Grup: ${napzaGroupFilter})`;
      metaStr = `Jumlah Jenis Sediaan Napza Terkait: ${napzaData.length} item`;
    } else if (type === 'kefarmasian') {
      titleStr = "MUTASI & BEBAN UNIT PELAYANAN KEFARMASIAN (LOG RESEP)";
      metaStr = `Kinerja: ${kefarmasianMetrics.totalSheets} Resep (${kefarmasianMetrics.rawatJalanCount} RJ, ${kefarmasianMetrics.rawatInapCount} RI) - Rata-rata ${kefarmasianMetrics.averageItemsPerRx} macam obat`;
    } else if (type === 'generik_paten') {
      titleStr = "LAPORAN PROPORSI PENGGUNAAN OBAT GENERIK & PATEN";
      metaStr = `Proporsi Generik: ${generikPatenMetrics.generikPercentage}% | Proporsi Paten: ${generikPatenMetrics.patenPercentage}%`;
    }
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text(titleStr, marginX, currentY);
    currentY += 5;
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Dicetak pada: ${dateTimeStr} WITA | Operator: ${userName}`, marginX, currentY);
    currentY += 4;
    doc.text(metaStr, marginX, currentY);
    currentY += 8;
    
    // Table columns & drawing helper
    doc.setTextColor(30, 41, 59);
    
    if (type === 'stok_opname') {
      // Landscape A4 width is 297mm. MarginX is 15mm. Printable width is 267mm.
      const cols = [
        { name: "Sediaan Farmasi", w: 57 },
        { name: "Ktg", w: 14 },
        { name: "Satuan", w: 15 },
        { name: "Gudang", w: 15 },
        { name: "Apotek", w: 15 },
        { name: "Pustu", w: 13 },
        { name: "IGD", w: 13 },
        { name: "LAB", w: 13 },
        { name: "R.Inap", w: 14 },
        { name: "Gizi", w: 13 },
        { name: "TB", w: 13 },
        { name: "VK", w: 13 },
        { name: "Pos", w: 13 },
        { name: "STOK", w: 16 },
        { name: "Valuasi (Rp)", w: 25 },
      ];
      
      // Draw table header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, currentY, 267, 8, "F");
      
      let curX = marginX;
      cols.forEach(col => {
        doc.rect(curX, currentY, col.w, 8);
        doc.text(col.name, curX + 1.5, currentY + 5.5);
        curX += col.w;
      });
      currentY += 8;
      
      // Rows
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      stokOpnameData.forEach(item => {
        if (currentY > doc.internal.pageSize.getHeight() - 35) {
          doc.addPage();
          currentY = 20;
          doc.setFont("Helvetica", "bold");
          doc.setFillColor(241, 245, 249);
          doc.rect(marginX, currentY, 267, 8, "F");
          curX = marginX;
          cols.forEach(col => {
            doc.rect(curX, currentY, col.w, 8);
            doc.text(col.name, curX + 1.5, currentY + 5.5);
            curX += col.w;
          });
          currentY += 8;
          doc.setFont("Helvetica", "normal");
        }
        
        let x = marginX;
        doc.rect(x, currentY, cols[0].w, 7);
        doc.text(item.name.substring(0, 31), x + 1.5, currentY + 4.5);
        x += cols[0].w;
        
        doc.rect(x, currentY, cols[1].w, 7);
        const ktg = item.group === 'narkotika' ? 'Nark' : item.group === 'psikotropika' ? 'Psik' : item.type === 'generik' ? 'Gen' : 'Pat';
        doc.text(ktg, x + 1.5, currentY + 4.5);
        x += cols[1].w;
        
        doc.rect(x, currentY, cols[2].w, 7);
        doc.text(item.unit, x + 1.5, currentY + 4.5);
        x += cols[2].w;
        
        const locKeys = ['gudang', 'ruang_farmasi', 'pustu', 'igd', 'lab', 'ruang_perawatan', 'poli_gizi', 'poli_tb', 'kamar_bersalin', 'pos_ptm'];
        locKeys.forEach((key, idx) => {
          doc.rect(x, currentY, cols[3 + idx].w, 7);
          doc.text(String(item.locations[key] || 0), x + 1.5, currentY + 4.5);
          x += cols[3 + idx].w;
        });
        
        doc.rect(x, currentY, cols[13].w, 7);
        doc.setFont("Helvetica", "bold");
        doc.text(String(item.globalSum), x + 1.5, currentY + 4.5);
        x += cols[13].w;
        
        doc.setFont("Helvetica", "normal");
        doc.rect(x, currentY, cols[14].w, 7);
        doc.text(item.valueEstimation.toLocaleString('id-ID'), x + 1.5, currentY + 4.5);
        
        currentY += 7;
      });
      
    } else if (type === 'stok_mutasi') {
      const cols = [
        { name: "Sediaan Farmasi", w: 52 },
        { name: "Satuan", w: 16 },
        { name: "Stok Awal", w: 18 },
        { name: "Penerimaan (+)", w: 22 },
        { name: "Pengeluaran (-)", w: 22 },
        { name: "Stok Akhir", w: 20 },
        { name: "Valuasi (Rp)", w: 30 }
      ];
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, currentY, 180, 8, "F");
      
      let curX = marginX;
      cols.forEach(col => {
        doc.rect(curX, currentY, col.w, 8);
        doc.text(col.name, curX + 1.5, currentY + 5.5);
        curX += col.w;
      });
      currentY += 8;
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      
      mutasiStokData.forEach(item => {
        if (currentY > doc.internal.pageSize.getHeight() - 35) {
          doc.addPage();
          currentY = 20;
          doc.setFont("Helvetica", "bold");
          doc.setFillColor(241, 245, 249);
          doc.rect(marginX, currentY, 180, 8, "F");
          curX = marginX;
          cols.forEach(col => {
            doc.rect(curX, currentY, col.w, 8);
            doc.text(col.name, curX + 1.5, currentY + 5.5);
            curX += col.w;
          });
          currentY += 8;
          doc.setFont("Helvetica", "normal");
        }
        
        let x = marginX;
        doc.rect(x, currentY, cols[0].w, 7);
        doc.text(item.name.substring(0, 27), x + 1.5, currentY + 4.5);
        x += cols[0].w;
        
        doc.rect(x, currentY, cols[1].w, 7);
        doc.text(item.unit, x + 1.5, currentY + 4.5);
        x += cols[1].w;
        
        doc.rect(x, currentY, cols[2].w, 7);
        doc.text(String(item.stokAwal), x + 1.5, currentY + 4.5);
        x += cols[2].w;
        
        doc.rect(x, currentY, cols[3].w, 7);
        doc.text(`+${item.penerimaan}`, x + 1.5, currentY + 4.5);
        x += cols[3].w;
        
        doc.rect(x, currentY, cols[4].w, 7);
        doc.text(`-${item.pengeluaran}`, x + 1.5, currentY + 4.5);
        x += cols[4].w;
        
        doc.rect(x, currentY, cols[5].w, 7);
        doc.setFont("Helvetica", "bold");
        doc.text(String(item.stokAkhir), x + 1.5, currentY + 4.5);
        doc.setFont("Helvetica", "normal");
        x += cols[5].w;
        
        doc.rect(x, currentY, cols[6].w, 7);
        doc.setFont("Helvetica", "bold");
        doc.text(item.valueEstimation.toLocaleString('id-ID'), x + 1.5, currentY + 4.5);
        doc.setFont("Helvetica", "normal");
        
        currentY += 7;
      });
      
      // Totals
      doc.setFont("Helvetica", "bold");
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, 180 - cols[6].w, 8, "F");
      doc.rect(marginX, currentY, 180 - cols[6].w, 8);
      doc.text("Total Estimasi Aset Persediaan Mutasi Akhir:", marginX + 2, currentY + 5.5);
      
      doc.rect(marginX + 180 - cols[6].w, currentY, cols[6].w, 8, "F");
      doc.rect(marginX + 180 - cols[6].w, currentY, cols[6].w, 8);
      const grandTotalVal = mutasiStokData.reduce((s, i) => s + i.valueEstimation, 0);
      doc.text(grandTotalVal.toLocaleString('id-ID'), marginX + 180 - cols[6].w + 1.5, currentY + 5.5);
      currentY += 8;
      
    } else if (type === 'keuangan_dinas') {
      const cols = [
        { name: "Nama Sediaan Farmasi", w: 55 },
        { name: "Golongan", w: 22 },
        { name: "Stok Gudang", w: 22 },
        { name: "Stok Pelayanan", w: 25 },
        { name: "Sisa Stok", w: 18 },
        { name: "Harga Satuan", w: 18 },
        { name: "Anggaran (Rp)", w: 20 }
      ];
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, currentY, 180, 8, "F");
      
      let curX = marginX;
      cols.forEach(col => {
        doc.rect(curX, currentY, col.w, 8);
        doc.text(col.name, curX + 1.5, currentY + 5.5);
        curX += col.w;
      });
      currentY += 8;
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      keuanganDinasData.forEach(item => {
        if (currentY > doc.internal.pageSize.getHeight() - 35) {
          doc.addPage();
          currentY = 20;
          doc.setFont("Helvetica", "bold");
          doc.setFillColor(241, 245, 249);
          doc.rect(marginX, currentY, 180, 8, "F");
          curX = marginX;
          cols.forEach(col => {
            doc.rect(curX, currentY, col.w, 8);
            doc.text(col.name, curX + 1.5, currentY + 5.5);
            curX += col.w;
          });
          currentY += 8;
          doc.setFont("Helvetica", "normal");
        }
        
        let x = marginX;
        doc.rect(x, currentY, cols[0].w, 7);
        doc.text(item.medicine.name.substring(0, 30), x + 1.5, currentY + 4.5);
        x += cols[0].w;
        
        doc.rect(x, currentY, cols[1].w, 7);
        doc.text(item.medicine.type === 'generik' ? 'Generik' : 'Paten', x + 1.5, currentY + 4.5);
        x += cols[1].w;
        
        doc.rect(x, currentY, cols[2].w, 7);
        doc.text(`${item.gudangQty} pcs`, x + 1.5, currentY + 4.5);
        x += cols[2].w;
        
        doc.rect(x, currentY, cols[3].w, 7);
        doc.text(`${item.satelliteQty} pcs`, x + 1.5, currentY + 4.5);
        x += cols[3].w;
        
        doc.rect(x, currentY, cols[4].w, 7);
        doc.setFont("Helvetica", "bold");
        doc.text(`${item.combinedTotal}`, x + 1.5, currentY + 4.5);
        doc.setFont("Helvetica", "normal");
        x += cols[4].w;
        
        doc.rect(x, currentY, cols[5].w, 7);
        doc.text(item.price.toLocaleString('id-ID'), x + 1.5, currentY + 4.5);
        x += cols[5].w;
        
        doc.rect(x, currentY, cols[6].w, 7);
        doc.setFont("Helvetica", "bold");
        doc.text(item.valuation.toLocaleString('id-ID'), x + 1.5, currentY + 4.5);
        doc.setFont("Helvetica", "normal");
        
        currentY += 7;
      });
      
      doc.setFont("Helvetica", "bold");
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, 180 - cols[6].w, 8, "F");
      doc.rect(marginX, currentY, 180 - cols[6].w, 8);
      doc.text("Total Sisa Valuasi Anggaran Dinas Terpenuhi:", marginX + 2, currentY + 5.5);
      
      doc.rect(marginX + 180 - cols[6].w, currentY, cols[6].w, 8, "F");
      doc.rect(marginX + 180 - cols[6].w, currentY, cols[6].w, 8);
      const sumVal = keuanganDinasData.reduce((s, i) => s + i.valuation, 0);
      doc.text(sumVal.toLocaleString('id-ID'), marginX + 180 - cols[6].w + 1.5, currentY + 5.5);
      currentY += 8;
      
    } else if (type === 'keuangan_jkn') {
      const cols = [
        { name: "Obat JKN Mandiri", w: 55 },
        { name: "Penggolongan", w: 32 },
        { name: "Fisik Gudang", w: 22 },
        { name: "Fisik Apotek", w: 22 },
        { name: "Sisa Stok", w: 24 },
        { name: "Nilai Kapitasi (Rp)", w: 25 }
      ];
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, currentY, 180, 8, "F");
      
      let curX = marginX;
      cols.forEach(col => {
        doc.rect(curX, currentY, col.w, 8);
        doc.text(col.name, curX + 1.5, currentY + 5.5);
        curX += col.w;
      });
      currentY += 8;
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      keuanganJKNData.forEach(item => {
        if (currentY > doc.internal.pageSize.getHeight() - 35) {
          doc.addPage();
          currentY = 20;
          doc.setFont("Helvetica", "bold");
          doc.setFillColor(241, 245, 249);
          doc.rect(marginX, currentY, 180, 8, "F");
          curX = marginX;
          cols.forEach(col => {
            doc.rect(curX, currentY, col.w, 8);
            doc.text(col.name, curX + 1.5, currentY + 5.5);
            curX += col.w;
          });
          currentY += 8;
          doc.setFont("Helvetica", "normal");
        }
        
        let x = marginX;
        doc.rect(x, currentY, cols[0].w, 7);
        doc.text(item.medicine.name.substring(0, 30), x + 1.5, currentY + 4.5);
        x += cols[0].w;
        
        doc.rect(x, currentY, cols[1].w, 7);
        doc.text(item.medicine.type === 'paten' ? 'Paten Non-Ekat' : 'Generik Formularium', x + 1.5, currentY + 4.5);
        x += cols[1].w;
        
        doc.rect(x, currentY, cols[2].w, 7);
        doc.text(`${item.gudangQty} pcs`, x + 1.5, currentY + 4.5);
        x += cols[2].w;
        
        doc.rect(x, currentY, cols[3].w, 7);
        doc.text(`${item.apotekQty} pcs`, x + 1.5, currentY + 4.5);
        x += cols[3].w;
        
        doc.rect(x, currentY, cols[4].w, 7);
        doc.setFont("Helvetica", "bold");
        doc.text(`${item.combinedTotal} pcs`, x + 1.5, currentY + 4.5);
        doc.setFont("Helvetica", "normal");
        x += cols[4].w;
        
        doc.rect(x, currentY, cols[5].w, 7);
        doc.setFont("Helvetica", "bold");
        doc.text(item.valuation.toLocaleString('id-ID'), x + 1.5, currentY + 4.5);
        doc.setFont("Helvetica", "normal");
        
        currentY += 7;
      });
      
      doc.setFont("Helvetica", "bold");
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, 180 - cols[5].w, 8, "F");
      doc.rect(marginX, currentY, 180 - cols[5].w, 8);
      doc.text("Total Realisasi Kapitasi JKN Mandiri:", marginX + 2, currentY + 5.5);
      
      doc.rect(marginX + 180 - cols[5].w, currentY, cols[5].w, 8, "F");
      doc.rect(marginX + 180 - cols[5].w, currentY, cols[5].w, 8);
      const sumVal = keuanganJKNData.reduce((s, i) => s + i.valuation, 0);
      doc.text(sumVal.toLocaleString('id-ID'), marginX + 180 - cols[5].w + 1.5, currentY + 5.5);
      currentY += 8;
      
    } else if (type === 'napza') {
      const cols = [
        { name: "Nama Sediaan Napza", w: 50 },
        { name: "Golongan", w: 25 },
        { name: "Stok Gudang", w: 22 },
        { name: "Stok Apotek", w: 21 },
        { name: "Unit Lain", w: 18 },
        { name: "Pengeluaran", w: 24 },
        { name: "Sisa Gabungan", w: 20 }
      ];
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, currentY, 180, 8, "F");
      
      let curX = marginX;
      cols.forEach(col => {
        doc.rect(curX, currentY, col.w, 8);
        doc.text(col.name, curX + 1.5, currentY + 5.5);
        curX += col.w;
      });
      currentY += 8;
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      napzaData.forEach(item => {
        if (currentY > doc.internal.pageSize.getHeight() - 35) {
          doc.addPage();
          currentY = 20;
          doc.setFont("Helvetica", "bold");
          doc.setFillColor(241, 245, 249);
          doc.rect(marginX, currentY, 180, 8, "F");
          curX = marginX;
          cols.forEach(col => {
            doc.rect(curX, currentY, col.w, 8);
            doc.text(col.name, curX + 1.5, currentY + 5.5);
            curX += col.w;
          });
          currentY += 8;
          doc.setFont("Helvetica", "normal");
        }
        
        let x = marginX;
        doc.rect(x, currentY, cols[0].w, 7);
        doc.setFont("Helvetica", "bold");
        doc.text(item.name.substring(0, 27), x + 1.5, currentY + 4.5);
        doc.setFont("Helvetica", "normal");
        x += cols[0].w;
        
        doc.rect(x, currentY, cols[1].w, 7);
        doc.text(item.group.toUpperCase(), x + 1.5, currentY + 4.5);
        x += cols[1].w;
        
        doc.rect(x, currentY, cols[2].w, 7);
        doc.text(String(item.stokGudang), x + 1.5, currentY + 4.5);
        x += cols[2].w;
        
        doc.rect(x, currentY, cols[3].w, 7);
        doc.text(String(item.stokApotek), x + 1.5, currentY + 4.5);
        x += cols[3].w;
        
        doc.rect(x, currentY, cols[4].w, 7);
        doc.text(String(item.totalUnitStok), x + 1.5, currentY + 4.5);
        x += cols[4].w;
        
        doc.rect(x, currentY, cols[5].w, 7);
        doc.text(`${item.totalUsage} ${item.unit}`, x + 1.5, currentY + 4.5);
        x += cols[5].w;
        
        doc.rect(x, currentY, cols[6].w, 7);
        doc.setFont("Helvetica", "bold");
        doc.text(`${item.globalStock}`, x + 1.5, currentY + 4.5);
        doc.setFont("Helvetica", "normal");
        
        currentY += 7;
      });
      
    } else if (type === 'kefarmasian') {
      const cols = [
        { name: "Kode", w: 20 },
        { name: "Tanggal", w: 22 },
        { name: "Nama Pasien (Umur)", w: 45 },
        { name: "Tipe Rawat", w: 23 },
        { name: "Dokter Penulis", w: 32 },
        { name: "Item", w: 18 },
        { name: "Vol (pcs)", w: 20 }
      ];
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, currentY, 180, 8, "F");
      
      let curX = marginX;
      cols.forEach(col => {
        doc.rect(curX, currentY, col.w, 8);
        doc.text(col.name, curX + 1.5, currentY + 5.5);
        curX += col.w;
      });
      currentY += 8;
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      kefarmasianMetrics.prescriptionHistory.forEach(rx => {
        const qtySum = rx.items.reduce((s, i) => s + i.qty, 0);
        if (currentY > doc.internal.pageSize.getHeight() - 35) {
          doc.addPage();
          currentY = 20;
          doc.setFont("Helvetica", "bold");
          doc.setFillColor(241, 245, 249);
          doc.rect(marginX, currentY, 180, 8, "F");
          curX = marginX;
          cols.forEach(col => {
            doc.rect(curX, currentY, col.w, 8);
            doc.text(col.name, curX + 1.5, currentY + 5.5);
            curX += col.w;
          });
          currentY += 8;
          doc.setFont("Helvetica", "normal");
        }
        
        let x = marginX;
        doc.rect(x, currentY, cols[0].w, 7);
        doc.text(rx.id, x + 1.5, currentY + 4.5);
        x += cols[0].w;
        
        doc.rect(x, currentY, cols[1].w, 7);
        doc.text(rx.date, x + 1.5, currentY + 4.5);
        x += cols[1].w;
        
        doc.rect(x, currentY, cols[2].w, 7);
        doc.text(`${rx.patientName.substring(0, 18)} (${rx.age} Thn)`, x + 1.5, currentY + 4.5);
        x += cols[2].w;
        
        doc.rect(x, currentY, cols[3].w, 7);
        doc.text(rx.type, x + 1.5, currentY + 4.5);
        x += cols[3].w;
        
        doc.rect(x, currentY, cols[4].w, 7);
        doc.text(rx.drName.substring(0, 16), x + 1.5, currentY + 4.5);
        x += cols[4].w;
        
        doc.rect(x, currentY, cols[5].w, 7);
        doc.text(`${rx.items.length} macam`, x + 1.5, currentY + 4.5);
        x += cols[5].w;
        
        doc.rect(x, currentY, cols[6].w, 7);
        doc.setFont("Helvetica", "bold");
        doc.text(`${qtySum} pcs`, x + 1.5, currentY + 4.5);
        doc.setFont("Helvetica", "normal");
        
        currentY += 7;
      });
      
    } else if (type === 'generik_paten') {
      const cols = [
        { name: "Metrik Klasifikasi Penggunaan", w: 100 },
        { name: "Nilai Sediaan / Volume", w: 40 },
        { name: "Persentase Share", w: 40 }
      ];
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, currentY, 180, 8, "F");
      
      let curX = marginX;
      cols.forEach(col => {
        doc.rect(curX, currentY, col.w, 8);
        doc.text(col.name, curX + 1.5, currentY + 5.5);
        curX += col.w;
      });
      currentY += 8;
      
      const rowsItems = [
        ["Volume Obat Generik Berresep", `${generikPatenMetrics.generikVolume} pcs`, `${generikPatenMetrics.generikPercentage}%`],
        ["Volume Obat Paten Berresep", `${generikPatenMetrics.patenVolume} pcs`, `${generikPatenMetrics.patenPercentage}%`],
        ["Jumlah Resep Racikan (Compounded)", `${generikPatenMetrics.compoundCount} Baris`, "N/A"],
        ["Jumlah Resep Non-Racikan Tunggal", `${generikPatenMetrics.nonCompoundCount} Baris`, "N/A"],
        ["Total Output Volume Penyerahan", `${generikPatenMetrics.totalVolume} pcs`, "100.0%"]
      ];
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      rowsItems.forEach(r => {
        let x = marginX;
        doc.rect(x, currentY, cols[0].w, 8);
        doc.text(r[0], x + 2, currentY + 5);
        x += cols[0].w;
        
        doc.rect(x, currentY, cols[1].w, 8);
        doc.setFont("Helvetica", "bold");
        doc.text(r[1], x + 2, currentY + 5);
        doc.setFont("Helvetica", "normal");
        x += cols[1].w;
        
        doc.rect(x, currentY, cols[2].w, 8);
        doc.text(r[2], x + 2, currentY + 5);
        
        currentY += 8;
      });
    }
    
    // Signatures of APJ
    currentY += 12;
    if (currentY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      currentY = 20;
    }
    
    const signX = doc.internal.pageSize.getWidth() - 85;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("Mengetahui,", signX, currentY);
    currentY += 4.5;
    doc.text("Apoteker Pengelola Jaminan (APJ),", signX, currentY);
    currentY += 15;
    
    doc.setFont("Helvetica", "bold");
    doc.text(`( ${userName === 'Apoteker Pengelola Jaminan' ? 'Rakhmadi Rahman, S.Farm., Apt.' : userName} )`, signX, currentY);
    currentY += 4.5;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("NIP. 19900617 202606 1 001", signX, currentY);
    
    // Humble Security Code
    doc.setFont("Courier", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("SIFP-VALIDATED-SECURE-ID-AISTUDIO-BUILD-AUTHENTIC-2026", marginX, doc.internal.pageSize.getHeight() - 10);
    
    // Trigger save
    doc.save(`SIFP_Official_Laporan_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
    showNotice('success', `Dokumen Resmi Laporan ${translateType(type)} selesai dikompilasi dengan Kop Resmi dan berhasil diunduh sebagai PDF!`);
  };

  return (
    <div className="space-y-6" id="reports-board-container">
      {/* Ecosystem Visual Integration Navigator */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 rounded p-1 text-white">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-emerald-800">Alur Ekosistem SIFP:</span>
          <button
            onClick={() => onNavigateChange?.('dashboard')}
            className="text-emerald-700 hover:text-emerald-900 border border-emerald-200 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors flex items-center gap-1 font-semibold"
          >
            &larr; Pantau Dashboard Analitik
          </button>
          <span className="text-emerald-600 font-medium whitespace-nowrap">&rarr; <span className="font-bold underline decoration-emerald-300">Sistem Laporan & Audit Terpadu</span></span>
        </div>
      </div>

      {/* Title block */}
      <div id="reports-header-bar">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 font-display">Simulasi Dashboard Laporan Terintegrasi</h2>
        <p className="text-xs text-slate-500">
          Semua data inputan (Penerimaan, Ampra, Resep Pasien, Log Harian) dikompilasi real-time untuk audit puskesmas
        </p>
      </div>

      {/* HORIZONTAL REPORTS TAB SWITCHER */}
      <div className="flex overflow-x-auto whitespace-nowrap border-b border-slate-200 gap-1 scrollbar-none pb-0.5" id="reports-modules-tabs">
        <button
          onClick={() => setActiveReportTab('stok_opname')}
          className={`shrink-0 px-4 py-2.5 font-display text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'stok_opname' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" /> Stok Opname Unit
        </button>
        <button
          onClick={() => setActiveReportTab('stok_mutasi')}
          className={`shrink-0 px-4 py-2.5 font-display text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'stok_mutasi' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" /> Ringkasan Stok & Mutasi
        </button>
        <button
          onClick={() => setActiveReportTab('keuangan_dinas')}
          className={`shrink-0 px-4 py-2.5 font-display text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'keuangan_dinas' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <DollarSign className="w-4 h-4 shrink-0" /> Keuangan Dinas (DAK/DAU)
        </button>
        <button
          onClick={() => setActiveReportTab('keuangan_jkn')}
          className={`shrink-0 px-4 py-2.5 font-display text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'keuangan_jkn' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <DollarSign className="w-4 h-4 shrink-0" /> Keuangan JKN (Mandiri)
        </button>
        <button
          onClick={() => setActiveReportTab('napza')}
          className={`shrink-0 px-4 py-2.5 font-display text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'napza' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Shield className="w-4 h-4 shrink-0" /> Laporan Napza
        </button>
        <button
          onClick={() => setActiveReportTab('kefarmasian')}
          className={`shrink-0 px-4 py-2.5 font-display text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'kefarmasian' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" /> Kerja Kefarmasian
        </button>
        <button
          onClick={() => setActiveReportTab('generik_paten')}
          className={`shrink-0 px-4 py-2.5 font-display text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'generik_paten' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Pill className="w-4 h-4 shrink-0" /> Generik & Paten
        </button>
      </div>

      {/* CORE TAB WORKSPACES */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" id="tab-window-container">
        
        {/* TAB 1: LAPORAN STOK OPNAME PERSIDIAAN BULANAN (COMPLETE CONTAINER CHART) */}
        {activeReportTab === 'stok_opname' && (
          <div className="p-5 space-y-4" id="view-stok-opname-tab">
            <div className="flex flex-wrap justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Formulir Laporan Stok Opname Persediaan Kesehatan</h3>
                <p className="text-xs text-slate-500">Memperlihatkan sisa stok fisik seluruh unit & gudang farmasi secara real-time</p>
              </div>
              
              <div className="text-right">
                <span className="text-xs text-slate-400">Total Estimasi Aset Sediaan:</span>
                <p className="text-lg font-bold text-emerald-700 font-display">Rp {totalStockValuation.toLocaleString('id-ID')}</p>
              </div>
            </div>

            {/* Export Toolbar */}
            <div className="flex flex-wrap justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-150 gap-2 text-xs" id="export-bar-stok-opname">
              <span className="text-slate-500 font-medium">Menu Ekspor Laporan Stok Opname SIFP:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportExcel('stok_opname')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg border border-emerald-200 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Excel (.csv)
                </button>
                <button
                  onClick={() => handleExportPDF('stok_opname')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg border border-rose-200 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Cetak PDF (Kop Resmi)
                </button>
              </div>
            </div>

            {/* Matrix table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl" id="opname-table-box">
              <table className="w-full text-left border-collapse text-xs min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="p-3 sticky left-0 bg-slate-50 z-10 w-44">Sediaan Farmasi</th>
                    <th className="p-2 text-center bg-blue-50/40 text-blue-800 font-mono">Gudang</th>
                    <th className="p-2 text-center bg-emerald-50/40 text-emerald-850 font-mono">Apotek</th>
                    <th className="p-2 text-center text-slate-600 font-mono">Pustu</th>
                    <th className="p-2 text-center text-slate-600 font-mono">IGD</th>
                    <th className="p-2 text-center text-slate-600 font-mono">LAB</th>
                    <th className="p-2 text-center text-slate-600 font-mono">Rawat Inap</th>
                    <th className="p-2 text-center text-slate-600 font-mono">Gizi</th>
                    <th className="p-2 text-center text-slate-600 font-mono">Poli TB</th>
                    <th className="p-2 text-center text-slate-600 font-mono">VK Bersalin</th>
                    <th className="p-2 text-center text-slate-600 font-mono">Pos PTM</th>
                    <th className="p-3 text-right bg-slate-100 text-slate-800 font-bold uppercase">Total Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {stokOpnameData.map((item) => {
                    const bStock = stocks['gudang']?.[item.id];
                    const hasDifferentPrices = bStock && bStock.batches && bStock.batches.some((b, _, arr) => b.price && arr.some(x => x.price && x.price !== b.price));
                    const isExpanded = expandedDrugId === item.id;

                    return (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-slate-50">
                          <td 
                            onClick={() => {
                              if (bStock && bStock.batches && bStock.batches.length > 0) {
                                setExpandedDrugId(isExpanded ? null : item.id);
                              }
                            }}
                            className={`p-3 font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 max-w-[180px] truncate cursor-pointer ${bStock && bStock.batches && bStock.batches.length > 0 ? 'hover:bg-slate-100' : ''}`}
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="truncate" title={item.name}>{item.name}</p>
                              {hasDifferentPrices && (
                                <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-extrabold tracking-tight" title="Terdapat sediaan dengan harga masuk berbeda">
                                  Rp Berbeda
                                </span>
                              )}
                              {bStock && bStock.batches && bStock.batches.length > 0 && (
                                <span className="text-[9px] text-blue-600 font-bold hover:underline">
                                  {isExpanded ? '▲ Sembunyikan' : '▼ Rincian'}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400">{item.unit} &bull; {item.group}</span>
                          </td>
                          <td className="p-2 text-center font-bold text-blue-700 bg-blue-50/20">{item.locations['gudang'] || 0}</td>
                          <td className="p-2 text-center font-bold text-emerald-700 bg-emerald-50/20">{item.locations['ruang_farmasi'] || 0}</td>
                          <td className="p-2 text-center text-slate-700 font-medium">{item.locations['pustu'] || 0}</td>
                          <td className="p-2 text-center text-slate-800 font-medium">{item.locations['igd'] || 0}</td>
                          <td className="p-2 text-center text-slate-700 font-medium">{item.locations['lab'] || 0}</td>
                          <td className="p-2 text-center text-slate-700 font-medium">{item.locations['ruang_perawatan'] || 0}</td>
                          <td className="p-2 text-center text-slate-700 font-medium">{item.locations['poli_gizi'] || 0}</td>
                          <td className="p-2 text-center text-slate-705 font-medium">{item.locations['poli_tb'] || 0}</td>
                          <td className="p-2 text-center text-slate-700 font-medium">{item.locations['kamar_bersalin'] || 0}</td>
                          <td className="p-2 text-center text-slate-700 font-medium">{item.locations['pos_ptm'] || 0}</td>
                          <td className="p-3 text-right font-extrabold text-slate-900 bg-slate-100">
                            {item.globalSum} <span className="text-[9px] font-normal text-slate-550">{item.unit}</span>
                          </td>
                        </tr>
                        {isExpanded && bStock && bStock.batches && bStock.batches.length > 0 && (
                          <tr className="bg-slate-50/70 border-b border-dashed border-slate-200">
                            <td colSpan={12} className="p-3">
                              <div className="bg-white p-3.5 rounded-xl border border-dashed border-emerald-250 shadow-2xs max-w-4xl mx-auto space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                  <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Rincian Sisa Persediaan Gudang &amp; Harga Masuk Berbeda ({item.name}):
                                  </p>
                                  <span className="text-[10px] text-slate-500 font-medium">Berdasarkan data penerimaan terverifikasi</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {bStock.batches.map((batch, bIdx) => {
                                    const bPrice = batch.price || GET_DRUG_PRICE(item.id);
                                    return (
                                      <div key={bIdx} className="bg-slate-50 hover:bg-emerald-50/20 p-2.5 rounded-lg border border-slate-150 transition-colors flex justify-between items-center text-xs">
                                        <div className="space-y-1 text-left">
                                          <div>
                                            <span className="font-mono text-slate-700 font-bold bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">{batch.batchNo}</span>
                                            <span className="ml-1.5 px-1 py-0.5 bg-blue-100 text-blue-850 rounded text-[9px] font-black">{batch.source}</span>
                                          </div>
                                          <p className="text-[10px] text-slate-500">Exp: <span className="text-rose-600 font-medium">{batch.expDate}</span></p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold text-slate-800">{batch.quantity.toLocaleString('id-ID')} <span className="text-[10px] text-slate-450 font-normal">{item.unit}</span></p>
                                          <p className="text-[11px] text-emerald-700 font-extrabold mt-0.5">@ Rp {bPrice.toLocaleString('id-ID')}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                                  <AlertCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span>Sistem mengimplementasikan FEFO (First-Expired, First-Out) terotomasi. Harga masuk yang tertera sesuai dengan faktur/dokumen penerimaan masing-masing batch.</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="text-right text-[11px] text-slate-400 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-150">
              * Data diatas diupdate real-time berdasarkan sediaan fisik akhir setelah dikurangi disposisi obat resep pasien & log unit.
            </div>
          </div>
        )}

        {/* TAB: LAPORAN RINGKASAN STOK & MUTASI BARANG */}
        {activeReportTab === 'stok_mutasi' && (
          <div className="p-5 space-y-4" id="view-stok-mutasi-tab">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-100 gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Laporan Mutasi & Sisa Stok Sediaan Farmasi</h3>
                <p className="text-xs text-slate-500">
                  Meliputi Stok Awal, Penerimaan (Stok Masuk), Pengeluaran (Beban Pemakaian), Sisa Stok Akhir beserta penilaian valuasi aset
                </p>
              </div>
              
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400">Total Nilai Sisa Persediaan Akhir:</span>
                <p className="text-lg font-bold text-emerald-750 font-display">
                  Rp {mutasiStokData.reduce((s, i) => s + i.valueEstimation, 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Export Toolbar */}
            <div className="flex flex-wrap justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-150 gap-2 text-xs" id="export-bar-stok-mutasi">
              <span className="text-slate-500 font-medium">Menu Ekspor Laporan Mutasi & Stok:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportExcel('stok_mutasi')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg border border-emerald-200 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Excel (.csv)
                </button>
                <button
                  onClick={() => handleExportPDF('stok_mutasi')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg border border-rose-200 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Cetak PDF (Kop Resmi)
                </button>
              </div>
            </div>

            {/* Mutation Summary Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl" id="stok-mutasi-table-box">
              <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="p-3">Sediaan Farmasi</th>
                    <th className="p-3">Satuan</th>
                    <th className="p-2 text-center bg-amber-50/30 text-amber-850 font-mono">Stok Awal</th>
                    <th className="p-2 text-center bg-blue-50/30 text-blue-800 font-mono">Penerimaan (+)</th>
                    <th className="p-2 text-center bg-rose-50/20 text-rose-800 font-mono">Pengeluaran (-)</th>
                    <th className="p-2 text-center bg-emerald-50/30 text-emerald-850 font-mono">Stok Akhir</th>
                    <th className="p-3 text-right">Valuasi (Rp)</th>
                    <th className="p-3 text-center">Status Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {mutasiStokData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800 max-w-[200px] truncate">
                        <p className="truncate" title={item.name}>{item.name}</p>
                        <span className="text-[9px] text-slate-400 capitalize">{item.type} &bull; {item.group}</span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{item.unit}</td>
                      <td className="p-2 text-center font-bold text-slate-705 bg-amber-50/10">{item.stokAwal}</td>
                      <td className="p-2 text-center font-bold text-blue-600 bg-blue-50/10">+{item.penerimaan}</td>
                      <td className="p-2 text-center font-bold text-rose-600 bg-rose-50/5">-{item.pengeluaran}</td>
                      <td className="p-2 text-center font-extrabold text-emerald-700 bg-emerald-50/10">{item.stokAkhir}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        Rp {item.valueEstimation.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 select-none">
                          TERVERIFIKASI
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right text-[11px] text-slate-400 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-150">
              * Perhitungan Mutasi: Stok Awal + Penerimaan (-) Pengeluaran = Sisa Stok Akhir (Sesuai SOP Persediaan Dinas Kesehatan).
            </div>
          </div>
        )}

        {/* TAB 2: LAPORAN KEUANGAN SUMBER DINAS KESEHATAN (DAK/DAU/PROGRAM) */}
        {activeReportTab === 'keuangan_dinas' && (
          <div className="p-5 space-y-4" id="view-finance-dinas-tab">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Laporan Keuangan Sediaan Farmasi (Sumber APBD/Dinas)</h3>
                <p className="text-xs text-slate-500">Mencakup rekapitulasi obat DAK, DAU, dan Program Kesehatan Nasional</p>
              </div>

              {/* Filter source */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Filter Anggaran:</span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs" id="dinas-filter-tabs">
                  {(['ALL', 'DAK', 'DAU', 'Program'] as const).map(src => (
                    <button
                      key={src}
                      onClick={() => setFinanceSourceFilter(src)}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${financeSourceFilter === src ? 'bg-white text-emerald-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {src === 'ALL' ? 'Semua Dinas' : src}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Toolbar */}
            <div className="flex flex-wrap justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-150 gap-2 text-xs" id="export-bar-keuangan-dinas">
              <span className="text-slate-500 font-medium">Menu Ekspor Evaluasi Anggaran Dinas (DAK/DAU):</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportExcel('keuangan_dinas')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg border border-emerald-200 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Excel (.csv)
                </button>
                <button
                  onClick={() => handleExportPDF('keuangan_dinas')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg border border-rose-200 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Cetak PDF (Kop Resmi)
                </button>
              </div>
            </div>

            {keuanganDinasData.length === 0 ? (
              <div className="p-12 text-center text-slate-400">Tidak ada sediaan dalam porsi anggaran ini.</div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl" id="dinas-table-box">
                <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="p-3">Obat</th>
                      <th className="p-3">Kategori Sediaan</th>
                      <th className="p-3 text-center">Fisik di Gudang DAK/DAU</th>
                      <th className="p-3 text-center">Porsi di Kamar Pelayanan</th>
                      <th className="p-3 text-right">Gabungan Sisa Stok</th>
                      <th className="p-3 text-right">Harga Satuan (E-Katalog)</th>
                      <th className="p-3 text-right bg-slate-50 text-slate-900 font-bold">Estimasi Anggaran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {keuanganDinasData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{item.medicine.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                            {item.medicine.type === 'generik' ? 'Generik' : 'Paten'} {item.medicine.isNarkotikaPsikotropika && '&bull; Napza'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">{item.gudangQty}</td>
                        <td className="p-3 text-center text-slate-600 font-medium">{item.satelliteQty}</td>
                        <td className="p-3 text-right font-bold text-slate-800">{item.combinedTotal} pcs</td>
                        <td className="p-3 text-right text-slate-500">Rp {item.price.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-right font-extrabold text-emerald-700 bg-slate-50/50">
                          Rp {item.valuation.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={6} className="p-3 text-right">Total Anggaran Dinas Terpenuhi:</td>
                      <td className="p-3 text-right text-emerald-800 text-sm">
                        Rp {keuanganDinasData.reduce((s, i) => s + i.valuation, 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LAPORAN KEUANGAN MANDIRI (JKN PEMBELIAN SENDIRI) */}
        {activeReportTab === 'keuangan_jkn' && (
          <div className="p-5 space-y-4" id="view-finance-jkn-tab">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Laporan Keuangan Sediaan Sourced JKN (Pembelian Puskesmas)</h3>
              <p className="text-xs text-slate-500">Menyajikan sisa stok khusus pengadaan JKN mandiri puskesmas untuk pertanggungjawaban dana kapitasi</p>
            </div>

            {/* Export Toolbar */}
            <div className="flex flex-wrap justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-150 gap-2 text-xs" id="export-bar-keuangan-jkn">
              <span className="text-slate-500 font-medium">Menu Ekspor Laporan Pertanggungjawaban Realisasi JKN:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportExcel('keuangan_jkn')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg border border-emerald-200 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Excel (.csv)
                </button>
                <button
                  onClick={() => handleExportPDF('keuangan_jkn')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg border border-rose-200 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Cetak PDF (Kop Resmi)
                </button>
              </div>
            </div>

            {keuanganJKNData.length === 0 ? (
              <div className="p-12 text-center text-slate-400">Tidak ada sediaan dalam porsi dana JKN.</div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl" id="jkn-table-box">
                <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="p-3">Obat</th>
                      <th className="p-3">Merek / Formulir</th>
                      <th className="p-3 text-center">Fisik JKN di Gudang</th>
                      <th className="p-3 text-center">Porsi di Apotek</th>
                      <th className="p-3 text-right">Sisa Stok JKN</th>
                      <th className="p-3 text-right">Harga Pengadaan JKN</th>
                      <th className="p-3 text-right bg-slate-50 text-slate-900 font-bold">Nilai Kapitasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {keuanganJKNData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{item.medicine.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                            {item.medicine.type === 'paten' ? 'Paten Non-Ekat' : 'Generik Formularium'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">{item.gudangQty}</td>
                        <td className="p-3 text-center text-slate-600 font-medium">{item.apotekQty}</td>
                        <td className="p-3 text-right font-bold text-slate-800">{item.combinedTotal} pcs</td>
                        <td className="p-3 text-right text-slate-500">Rp {item.price.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-right font-extrabold text-blue-700 bg-slate-50/50">
                          Rp {item.valuation.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={6} className="p-3 text-right">Total Realisasi Pembelian Kapitasi JKN:</td>
                      <td className="p-3 text-right text-blue-800 text-sm">
                        Rp {keuanganJKNData.reduce((s, i) => s + i.valuation, 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LAPORAN NARKOTIKA & PSIKOTROPIKA (NAPZA) */}
        {activeReportTab === 'napza' && (
          <div className="p-5 space-y-4" id="view-napza-tab">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Laporan Bulanan Mutasi Narkotika & Psikotropika (Napza)</h3>
                <p className="text-xs text-slate-500">Menyediakan salinan mutasi obat golongan narkotik & psikotropika untuk laporan dinas</p>
              </div>

              {/* Filter napza */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold"><Filter className="w-3.5 h-3.5 inline mr-1" /> Klasifikasi Napza:</span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs" id="napza-filter">
                  <button
                    onClick={() => setNapzaGroupFilter('ALL')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${napzaGroupFilter === 'ALL' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500'}`}
                  >
                    Semua Napza
                  </button>
                  <button
                    onClick={() => setNapzaGroupFilter('narkotika')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${napzaGroupFilter === 'narkotika' ? 'bg-white text-amber-850 shadow-3xs' : 'text-slate-500'}`}
                  >
                    Narkotika
                  </button>
                  <button
                    onClick={() => setNapzaGroupFilter('psikotropika')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${napzaGroupFilter === 'psikotropika' ? 'bg-white text-amber-850 shadow-3xs' : 'text-slate-500'}`}
                  >
                    Psikotropika
                  </button>
                </div>
              </div>
            </div>

            {/* Export Toolbar */}
            <div className="flex flex-wrap justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-150 gap-2 text-xs" id="export-bar-napza">
              <span className="text-slate-500 font-medium">Menu Ekspor Mutasi Narkotika & Psikotropika (Napza):</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportExcel('napza')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg border border-emerald-200 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Excel (.csv)
                </button>
                <button
                  onClick={() => handleExportPDF('napza')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg border border-rose-200 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Cetak PDF (Kop Resmi)
                </button>
              </div>
            </div>

            {napzaData.length === 0 ? (
              <div className="p-12 text-center text-slate-400">Tidak ada sediaan dalam klasifikasi Napza terpilih.</div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl" id="napza-table-box">
                <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="p-3">Nama Sediaan</th>
                      <th className="p-3">Golongan</th>
                      <th className="p-3 text-center">Fisik Gudang Utama</th>
                      <th className="p-3 text-center">Fisik Apotek</th>
                      <th className="p-3 text-center">Stok Unit Lain</th>
                      <th className="p-3 text-center bg-rose-50 text-rose-800">Total Pengeluaran (Resep+Unit)</th>
                      <th className="p-3 text-right font-bold">Sisa Stok Gabungan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {napzaData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800 flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.group === 'narkotika' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                          {item.name}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            item.group === 'narkotika' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.group}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">{item.stokGudang}</td>
                        <td className="p-3 text-center font-bold text-slate-705">{item.stokApotek}</td>
                        <td className="p-3 text-center text-slate-500">{item.totalUnitStok}</td>
                        <td className="p-3 text-center bg-rose-50/40 text-rose-700 font-extrabold">{item.totalUsage} {item.unit}</td>
                        <td className="p-3 text-right font-extrabold text-slate-900">{item.globalStock} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: LAPORAN WORKLOAD PEKERJAAN KEFARMASIAN */}
        {activeReportTab === 'kefarmasian' && (
          <div className="p-5 space-y-6" id="view-farmasi-tasks-tab">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-center">
                <span className="text-xs text-slate-500 block font-semibold">Total Resep Dilayani</span>
                <span className="text-3xl font-bold text-slate-800 font-display mt-1 block">
                  {kefarmasianMetrics.totalSheets}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Lembar resep terekam</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-center">
                <span className="text-xs text-slate-500 block font-semibold">Resep Rawat Jalan</span>
                <span className="text-3xl font-bold text-indigo-700 font-display mt-1 block">
                  {kefarmasianMetrics.rawatJalanCount}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Poli Umum, KIA, Gigi, Gizi</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-center">
                <span className="text-xs text-slate-500 block font-semibold">Resep Rawat Inap</span>
                <span className="text-3xl font-bold text-teal-700 font-display mt-1 block">
                  {kefarmasianMetrics.rawatInapCount}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Gawat Darurat & VK Bersalin</p>
              </div>
              <div className="bg-slate-55 p-4 rounded-xl border border-slate-150 text-center">
                <span className="text-xs text-slate-500 block font-semibold">Rata-rata Macam Sediaan</span>
                <span className="text-3xl font-bold text-amber-600 font-display mt-1 block">
                  {kefarmasianMetrics.averageItemsPerRx}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Obat per lembar resep</p>
              </div>
            </div>

            {/* Export Toolbar */}
            <div className="flex flex-wrap justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-150 gap-2 text-xs" id="export-bar-kefarmasian">
              <span className="text-slate-500 font-medium">Menu Ekspor Mutasi Pelayanan & Beban Kefarmasian:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportExcel('kefarmasian')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg border border-emerald-200 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Excel (.csv)
                </button>
                <button
                  onClick={() => handleExportPDF('kefarmasian')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-105 font-bold rounded-lg border border-rose-200 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Cetak PDF (Kop Resmi)
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">Log Alokasi Beban Pelayanan Kefarmasian</h4>
              <div className="border border-slate-200 rounded-xl overflow-x-auto text-xs" id="farmasi-tasks-table-box">
                <table className="w-full text-left min-w-[750px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="p-3">Kode Resep</th>
                      <th className="p-3">Tanggal Pelayanan</th>
                      <th className="p-3">Nama Pasien</th>
                      <th className="p-3">Jenis Rawat</th>
                      <th className="p-3">Dokter Penulis</th>
                      <th className="p-3 text-right">Variasi Item</th>
                      <th className="p-3 text-right">Volume Diserahkan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-medium">
                    {kefarmasianMetrics.prescriptionHistory.map((rx, idx) => {
                      const qtySum = rx.items.reduce((s, i) => s + i.qty, 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-700">{rx.id}</td>
                          <td className="p-3 text-slate-500">{rx.date}</td>
                          <td className="p-3 text-slate-800">{rx.patientName} ({rx.age} Thn)</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rx.type === 'Rawat Jalan' ? 'bg-indigo-50 text-indigo-700' : 'bg-teal-50 text-teal-700'
                            }`}>
                              {rx.type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{rx.drName}</td>
                          <td className="p-3 text-right text-slate-880">{rx.items.length} macam</td>
                          <td className="p-3 text-right font-bold text-indigo-700">{qtySum} pcs</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: LAPORAN PENGGUNAAN OBAT GENERIK DAN PATEN */}
        {activeReportTab === 'generik_paten' && (
          <div className="p-5 space-y-6" id="view-generik-patent-tab">
            {/* Export Toolbar */}
            <div className="flex flex-wrap justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-150 gap-2 text-xs" id="export-bar-generik-paten">
              <span className="text-slate-500 font-medium">Menu Ekspor Laporan Proporsi Generik & Paten SIFP:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportExcel('generik_paten')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg border border-emerald-200 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Excel (.csv)
                </button>
                <button
                  onClick={() => handleExportPDF('generik_paten')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-105 font-bold rounded-lg border border-rose-200 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Cetak PDF (Kop Resmi)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side stats list */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Rincian Volume Pengeluaran Resep</h4>
                
                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">Volume Obat Generik</span>
                      <span className="text-2xl font-bold text-emerald-700 font-display mt-0.5 block">{generikPatenMetrics.generikVolume} pcs</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                        {generikPatenMetrics.generikPercentage}% Share
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">Volume Obat Paten</span>
                      <span className="text-2xl font-bold text-blue-700 font-display mt-0.5 block">{generikPatenMetrics.patenVolume} pcs</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {generikPatenMetrics.patenPercentage}% Share
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 text-xs text-slate-600 leading-relaxed">
                  Puskesmas memprioritaskan penyerahan **Obat Generik** sebesar minimal 80% untuk mematuhi target sasaran Kemenkes RI.
                </div>
              </div>

              {/* Right Side compound vs non compound */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Klasifikasi Formulasi Racikan vs Non-Racikan</h4>
                
                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold">Jumlah Sediaan Racikan (Compounded)</span>
                      <p className="text-2xl font-bold text-amber-600 font-display mt-0.5">{generikPatenMetrics.compoundCount} Baris</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-800 rounded">Puyer/Racik</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold">Jumlah Sediaan Non-Racikan</span>
                      <p className="text-2xl font-bold text-slate-800 font-display mt-0.5">{generikPatenMetrics.nonCompoundCount} Baris</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded">Tablet/Syr Tunggal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
