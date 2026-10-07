import React, { useState, useEffect } from 'react';
import { Medicine, UnitInfo, SystemConfig } from '../types';
import { Pill, Building2, Plus, Edit, Trash2, Search, Save, Database, LayoutTemplate } from 'lucide-react';

interface MasterDataViewProps {
  medicines: Medicine[];
  units: UnitInfo[];
  systemConfig?: SystemConfig;
  onAddMedicine: (m: Medicine) => void;
  onUpdateMedicine: (id: string, m: Partial<Medicine>) => void;
  onDeleteMedicine: (id: string) => void;
  onAddUnit: (u: UnitInfo) => void;
  onUpdateUnit: (id: string, u: Partial<UnitInfo>) => void;
  onDeleteUnit: (id: string) => void;
  onUpdateSystemConfig?: (configUpdate: Partial<SystemConfig>) => void;
}

export default function MasterDataView({
  medicines, units, systemConfig,
  onAddMedicine, onUpdateMedicine, onDeleteMedicine,
  onAddUnit, onUpdateUnit, onDeleteUnit, onUpdateSystemConfig
}: MasterDataViewProps) {
  const [view, setView] = useState<'medicines'|'units'|'config'>('medicines');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom config states
  const [headerTitle, setHeaderTitle] = useState(systemConfig?.headerTitle || '');
  const [headerSubtitle, setHeaderSubtitle] = useState(systemConfig?.headerSubtitle || '');
  const [footerText, setFooterText] = useState(systemConfig?.footerText || '');
  const [sidebarVisible, setSidebarVisible] = useState(systemConfig?.sidebarVisible !== false);

  useEffect(() => {
    if (systemConfig) {
      setHeaderTitle(systemConfig.headerTitle || '');
      setHeaderSubtitle(systemConfig.headerSubtitle || '');
      setFooterText(systemConfig.footerText || '');
      setSidebarVisible(systemConfig.sidebarVisible !== false);
    }
  }, [systemConfig]);

  const saveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSystemConfig) {
      onUpdateSystemConfig({
        headerTitle,
        headerSubtitle,
        footerText,
        sidebarVisible
      });
    }
  };
  
  // Medicine Form State
  const [isMedFormOpen, setIsMedFormOpen] = useState(false);
  const [medId, setMedId] = useState('');
  const [medName, setMedName] = useState('');
  const [itemKind, setItemKind] = useState<'obat'|'bmhp'>('obat');
  const [itemFilter, setItemFilter] = useState<'semua'|'obat'|'bmhp'>('semua');
  const [medType, setMedType] = useState<'generik'|'paten'>('generik');
  const [medUnit, setMedUnit] = useState('');
  const [medGroup, setMedGroup] = useState<'biasa'|'narkotika'|'psikotropika'>('biasa');
  const [medCompoundType, setMedCompoundType] = useState<'non-racikan'|'racikan'>('non-racikan');
  
  // Unit Form State
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [unitId, setUnitId] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitType, setUnitType] = useState<'pustu'|'poli'|'igd'|'gudang'|'apotek'>('pustu');
  const [unitManager, setUnitManager] = useState('');
  const [unitDesc, setUnitDesc] = useState('');

  const [editingId, setEditingId] = useState<string|null>(null);

  const resetForms = () => {
    setIsMedFormOpen(false);
    setIsUnitFormOpen(false);
    setEditingId(null);
    setMedId(''); setMedName(''); setItemKind('obat'); setMedType('generik'); setMedUnit(''); setMedGroup('biasa'); setMedCompoundType('non-racikan');
    setUnitId(''); setUnitName(''); setUnitType('pustu'); setUnitManager(''); setUnitDesc('');
  };

  const handleEditMed = (m: Medicine) => {
    resetForms();
    setMedId(m.id); setMedName(m.name); setItemKind(m.itemKind || 'obat'); setMedType(m.type); setMedUnit(m.unit); setMedGroup(m.group); setMedCompoundType(m.compoundType);
    setEditingId(m.id);
    setIsMedFormOpen(true);
  };

  const handleEditUnit = (u: UnitInfo) => {
    resetForms();
    setUnitId(u.id); setUnitName(u.name); setUnitType(u.type as any); setUnitManager(u.manager); setUnitDesc(u.description || '');
    setEditingId(u.id);
    setIsUnitFormOpen(true);
  };

  const saveMed = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingId) {
      onUpdateMedicine(editingId, { name: medName, itemKind, type: medType, unit: medUnit, group: itemKind === 'bmhp' ? 'biasa' : medGroup, compoundType: itemKind === 'bmhp' ? 'non-racikan' : medCompoundType, isNarkotikaPsikotropika: itemKind === 'obat' && medGroup !== 'biasa' });
    } else {
      onAddMedicine({ id: medId, name: medName, itemKind, type: medType, unit: medUnit, group: itemKind === 'bmhp' ? 'biasa' : medGroup, compoundType: itemKind === 'bmhp' ? 'non-racikan' : medCompoundType, isNarkotikaPsikotropika: itemKind === 'obat' && medGroup !== 'biasa' });
    }
    resetForms();
  };

  const saveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingId) {
      onUpdateUnit(editingId, { name: unitName, type: unitType, manager: unitManager, description: unitDesc });
    } else {
      onAddUnit({ id: unitId, name: unitName, type: unitType, manager: unitManager, description: unitDesc });
    }
    resetForms();
  };

  const filteredMedicines = medicines.filter(m => (itemFilter === 'semua' || (m.itemKind || 'obat') === itemFilter) && (String(m?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || String(m?.id || '').toLowerCase().includes(searchTerm.toLowerCase())));
  const filteredUnits = units.filter(u => String(u?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-10">
      <div className="bg-white border p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2 mb-4">
          <Database className="w-6 h-6 text-teal-600" /> Master Data
        </h2>
        <div className="flex gap-4 border-b">
          <button onClick={() => {setView('medicines'); resetForms();}} className={`pb-2 px-4 font-bold text-sm ${view === 'medicines' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}>
            Obat & BMHP
          </button>
          <button onClick={() => {setView('units'); resetForms();}} className={`pb-2 px-4 font-bold text-sm ${view === 'units' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}>
            Data Unit
          </button>
          <button onClick={() => {setView('config'); resetForms();}} className={`pb-2 px-4 font-bold text-sm flex items-center gap-1.5 ${view === 'config' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <LayoutTemplate className="w-4 h-4" /> Konfigurasi UI
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {view !== 'config' && (
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input type="text" placeholder="Pencarian..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none" />
            </div>
            <button onClick={() => {
              resetForms();
              if(view === 'medicines') setIsMedFormOpen(true);
              else setIsUnitFormOpen(true);
            }} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> {view === 'medicines' ? 'Tambah Item' : 'Tambah Unit'}
            </button>
          </div>
        )}

        {/* Medicine Form */}
        {isMedFormOpen && view === 'medicines' && (
          <form onSubmit={saveMed} className="p-6 bg-slate-50 border-b grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Kode Item / ID</label><input required disabled={!!editingId} value={medId} onChange={e=>setMedId(e.target.value)} className="w-full p-2 border rounded" placeholder="med-01" /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Nama Item</label><input required value={medName} onChange={e=>setMedName(e.target.value)} className="w-full p-2 border rounded" placeholder="Nama..." /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Jenis Item</label><select required value={itemKind} onChange={e=>setItemKind(e.target.value as any)} className="w-full p-2 border rounded"><option value="obat">Obat</option><option value="bmhp">BMHP</option></select></div>\n            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Tipe Obat</label>
              <select required value={medType} onChange={e=>setMedType(e.target.value as any)} className="w-full p-2 border rounded">
                <option value="generik">Generik</option>
                <option value="paten">Paten</option>
              </select>
            </div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Satuan (Unit)</label><input required value={medUnit} onChange={e=>setMedUnit(e.target.value)} className="w-full p-2 border rounded" placeholder="PCS, BTL, KTK" /></div>
            <div className={itemKind === "bmhp" ? "hidden" : "space-y-1"}><label className="text-xs font-bold text-slate-600">Grup / Kelompok</label>
              <select required value={medGroup} onChange={e=>setMedGroup(e.target.value as any)} className="w-full p-2 border rounded">
                <option value="biasa">Biasa</option>
                <option value="narkotika">Narkotika</option>
                <option value="psikotropika">Psikotropika</option>
              </select>
            </div>
            <div className={itemKind === "bmhp" ? "hidden" : "space-y-1"}><label className="text-xs font-bold text-slate-600">Tipe Sediaan</label>
              <select required value={medCompoundType} onChange={e=>setMedCompoundType(e.target.value as any)} className="w-full p-2 border rounded">
                <option value="non-racikan">Non-Racikan</option>
                <option value="racikan">Racikan</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-4 border-t pt-4">
              <button type="button" onClick={resetForms} className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-slate-50">Batal</button>
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 flex items-center gap-2"><Save className="w-4 h-4"/> Simpan Data</button>
            </div>
          </form>
        )}

        {/* Unit Form */}
        {isUnitFormOpen && view === 'units' && (
          <form onSubmit={saveUnit} className="p-6 bg-slate-50 border-b grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">ID Unit</label><input required disabled={!!editingId} value={unitId} onChange={e=>setUnitId(e.target.value)} className="w-full p-2 border rounded" placeholder="id_unit" /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Nama Unit</label><input required value={unitName} onChange={e=>setUnitName(e.target.value)} className="w-full p-2 border rounded" placeholder="Nama..." /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Tipe Unit</label>
              <select value={unitType} onChange={e=>setUnitType(e.target.value as any)} className="w-full p-2 border rounded">
                <option value="pustu">Pustu / Satelit</option>
                <option value="poli">Poli Rawat Jalan</option>
                <option value="igd">IGD</option>
                <option value="apotek">Apotek Layanan</option>
                <option value="gudang">Gudang Farmasi</option>
              </select>
            </div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Nama Pegawai / APJ</label><input required value={unitManager} onChange={e=>setUnitManager(e.target.value)} className="w-full p-2 border rounded" placeholder="Nama..." /></div>
            <div className="space-y-1 col-span-1 md:col-span-2"><label className="text-xs font-bold text-slate-600">Deskripsi (Opsional)</label><input value={unitDesc} onChange={e=>setUnitDesc(e.target.value)} className="w-full p-2 border rounded" placeholder="..." /></div>
            <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={resetForms} className="px-4 py-2 border rounded-lg text-sm font-semibold">Batal</button>
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold">Simpan Data</button>
            </div>
          </form>
        )}

        {/* Config Form */}
        {view === 'config' && (
          <div className="p-6">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Manajemen Konfigurasi User Interface</h3>
              <p className="text-sm text-slate-500">Sesuaikan header, footer, dan tata letak secara real-time.</p>
            </div>
            <form onSubmit={saveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Judul Header (Header Title)</label>
                  <input required value={headerTitle} onChange={e=>setHeaderTitle(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all" placeholder="Misal: SIM-Farmasi" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Sub-Judul Header (Header Subtitle)</label>
                  <input required value={headerSubtitle} onChange={e=>setHeaderSubtitle(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all" placeholder="Misal: Parepare • Verifikasi Terintegrasi" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Teks Footer (Footer Text)</label>
                  <textarea required value={footerText} onChange={e=>setFooterText(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none h-[108px]" placeholder="Misal: © 2024 SIFP Parepare..." />
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 space-y-1.5 pt-2">
                <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={sidebarVisible} onChange={e=>setSidebarVisible(e.target.checked)} className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500" />
                  <div>
                    <span className="font-bold text-slate-700 block">Tampilkan Sidebar / Navbar Terintegrasi</span>
                    <span className="text-xs text-slate-500">Jika dimatikan, sidebar akan disembunyikan untuk memberikan ruang kerja yang lebih luas.</span>
                  </div>
                </label>
              </div>
              <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="submit" className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold shadow hover:bg-teal-700 transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4"/> Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        )}

        {view !== 'config' && (
          <div className="p-4">
            {view === "medicines" && <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex gap-2 overflow-x-auto">{(["semua","obat","bmhp"] as const).map(f => <button key={f} onClick={()=>setItemFilter(f)} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${itemFilter===f ? "bg-teal-600 text-white border-teal-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"}`}>{f === "semua" ? `Semua (${medicines.length})` : f === "obat" ? `Obat (${medicines.filter(m=>(m.itemKind||'obat')==='obat').length})` : `BMHP (${medicines.filter(m=>m.itemKind==='bmhp').length})`}</button>)}</div>
              <div className="text-xs text-slate-500 font-medium">{filteredMedicines.length} item ditampilkan</div>
            </div>}
            {view === 'medicines' ? <>
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3 w-14">No.</th><th className="px-4 py-3">Nama Item</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Satuan</th><th className="px-4 py-3">Tipe</th><th className="px-4 py-3">Kelompok</th><th className="px-4 py-3">Sediaan</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{filteredMedicines.map((m,i)=><tr key={m.id} className="hover:bg-teal-50/40 transition-colors"><td className="px-4 py-3 text-slate-400">{i+1}</td><td className="px-4 py-3"><div className="font-bold text-slate-800">{m.name}</div><div className="font-mono text-[10px] text-slate-400 mt-0.5">{m.id}</div></td><td className="px-4 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold ${m.itemKind==='bmhp'?'bg-sky-50 text-sky-700':'bg-emerald-50 text-emerald-700'}`}>{m.itemKind==='bmhp'?'BMHP':'OBAT'}</span></td><td className="px-4 py-3 font-semibold text-slate-600">{m.unit||'—'}</td><td className="px-4 py-3 text-slate-600">{m.type==='tidak-ditentukan'?'—':m.type}</td><td className="px-4 py-3 text-slate-600">{m.itemKind==='bmhp'||m.group==='tidak-ditentukan'?'—':m.group}</td><td className="px-4 py-3 text-slate-600">{m.itemKind==='bmhp'||m.compoundType==='tidak-ditentukan'?'—':m.compoundType}</td><td className="px-4 py-3 text-right whitespace-nowrap"><button title="Edit" onClick={()=>handleEditMed(m)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"><Edit className="w-4 h-4"/></button><button title="Hapus" onClick={()=>onDeleteMedicine(m.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button></td></tr>)}</tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">{filteredMedicines.map((m,i)=><div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><div className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{i+1}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="font-bold text-slate-800 leading-snug">{m.name}</div><span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-extrabold ${m.itemKind==='bmhp'?'bg-sky-50 text-sky-700':'bg-emerald-50 text-emerald-700'}`}>{m.itemKind==='bmhp'?'BMHP':'OBAT'}</span></div><div className="font-mono text-[10px] text-slate-400 mt-1 break-all">{m.id}</div><div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3 text-xs"><div><span className="block text-slate-400">Satuan</span><b className="text-slate-700">{m.unit||'—'}</b></div><div><span className="block text-slate-400">Tipe</span><b className="text-slate-700 capitalize">{m.type==='tidak-ditentukan'?'—':m.type}</b></div>{m.itemKind!=='bmhp'&&<><div><span className="block text-slate-400">Kelompok</span><b className="text-slate-700 capitalize">{m.group==='tidak-ditentukan'?'—':m.group}</b></div><div><span className="block text-slate-400">Sediaan</span><b className="text-slate-700 capitalize">{m.compoundType==='tidak-ditentukan'?'—':m.compoundType}</b></div></>}</div></div></div><div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100"><button onClick={()=>handleEditMed(m)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold"><Edit className="w-3.5 h-3.5"/> Edit</button><button onClick={()=>onDeleteMedicine(m.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-bold"><Trash2 className="w-3.5 h-3.5"/> Hapus</button></div></div>)}</div>
            </> : <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">ID</th><th className="p-3">Nama Unit</th><th className="p-3">Tipe</th><th className="p-3">Penanggung Jawab</th><th className="p-3 text-right">Aksi</th></tr></thead><tbody>{filteredUnits.map(u=><tr key={u.id} className="border-t"><td className="p-3 font-mono text-xs">{u.id}</td><td className="p-3 font-bold">{u.name}</td><td className="p-3">{u.type}</td><td className="p-3">{u.manager}</td><td className="p-3 text-right"><button onClick={()=>handleEditUnit(u)} className="p-2 text-blue-600"><Edit className="w-4 h-4"/></button><button onClick={()=>onDeleteUnit(u.id)} className="p-2 text-red-600"><Trash2 className="w-4 h-4"/></button></td></tr>)}</tbody></table></div>}
          
          {(view === 'medicines' && filteredMedicines.length === 0) && <div className="p-10 text-center text-slate-400 font-bold">Data Obat/BMHP tidak ditemukan</div>}
          {(view === 'units' && filteredUnits.length === 0) && <div className="p-10 text-center text-slate-400 font-bold">Data unit tidak ditemukan</div>}
        </div>
        )}
      </div>
    </div>
  );
}
