import React, { useState } from 'react';
import { UserAccount, AppRole, UnitInfo } from '../types';
import { ShieldCheck, UserPlus, Key, Trash2, Edit, Save, X, Search, CheckCircle2 } from 'lucide-react';

interface UserManagementViewProps {
  users: UserAccount[];
  units: UnitInfo[];
  onAddUser: (u: UserAccount) => void;
  onUpdateUser: (id: string, u: Partial<UserAccount>) => void;
  onDeleteUser: (id: string) => void;
}

export default function UserManagementView({ users, units, onAddUser, onUpdateUser, onDeleteUser }: UserManagementViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AppRole>('unit');
  const [unitId, setUnitId] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');

  const resetForm = () => {
    setUsername('');
    setPin('');
    setName('');
    setRole('unit');
    setUnitId('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (u: UserAccount) => {
    setUsername(u.username);
    setPin(u.pin);
    setName(u.name);
    setRole(u.role);
    setUnitId(u.unitId || '');
    setEditingId(u.id);
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateUser(editingId, { username, pin, name, role, unitId: role === 'unit' || role === 'farmasi' ? unitId : undefined });
    } else {
      const newId = `usr_${Math.random().toString(36).substr(2, 9)}`;
      onAddUser({
        id: newId,
        username,
        pin,
        name,
        role,
        unitId: role === 'unit' || role === 'farmasi' ? unitId : undefined
      });
    }
    resetForm();
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white border text-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              Manajemen Role & Akses Pengguna
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Atur hak akses pengguna, tambah staff, dan konfigurasi otentikasi login aplikasi. Anda sedang mengakses fitur ini sebagai <strong>Admin</strong>.
            </p>
          </div>
          {!isAdding && (
            <button
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> Tambah User Baru
            </button>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-4 text-slate-800 pb-2 border-b">{editingId ? 'Edit User' : 'Tambah User Hak Akses'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Nama Lengkap & Gelar</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/30 text-sm" placeholder="Contoh: Andi Sukri, A.Md.Farm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Username Login</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/30 text-sm" placeholder="username.unik" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">PIN (Password)</label>
              <input type="text" required value={pin} onChange={e => setPin(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/30 text-sm font-mono tracking-widest" placeholder="123456" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Role Sistem</label>
              <select required value={role} onChange={e => setRole(e.target.value as AppRole)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/30 text-sm bg-white">
                <option value="admin">Admin (Akses Penuh Seluruh Menu CRUD)</option>
                <option value="apj">APJ (Apoteker Penanggung Jawab)</option>
                <option value="gudang">Petugas Gudang Farmasi</option>
                <option value="farmasi">Petugas Ruang Farmasi (Apotek Layanan)</option>
                <option value="unit">Petugas Satelit/Unit Internal (Pustu, IGD, Poli)</option>
              </select>
            </div>
            
            {(role === 'unit' || role === 'farmasi') && (
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Lokasi / Unit Tugas</label>
                <select required value={unitId} onChange={e => setUnitId(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/30 text-sm bg-white">
                  <option value="">-- Pilih Unit --</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.type.toUpperCase()})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-2 mt-4 pt-4 border-t">
              <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Batal</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2">
                <Save className="w-4 h-4" /> Simpan User
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text" 
              placeholder="Cari user atau nama..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wider">
                <th className="p-4 font-bold border-b">Detail Pengguna</th>
                <th className="p-4 font-bold border-b">Role Sistem</th>
                <th className="p-4 font-bold border-b">Lokasi Unit</th>
                <th className="p-4 font-bold border-b">Kredensial</th>
                <th className="p-4 font-bold border-b text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredUsers.map(u => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">ID: {u.id}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full border ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      u.role === 'apj' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      u.role === 'gudang' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    {u.unitId ? units.find(unit => unit.id === u.unitId)?.name || u.unitId : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 px-2 py-1 rounded w-fit">
                      <Key className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-700 font-bold">{u.username}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (u.username === 'admin') {
                            alert("Tidak dapat menghapus user utama admin.");
                            return;
                          }
                          if(window.confirm('Yakin ingin menghapus user ini?')) onDeleteUser(u.id);
                        }} 
                        className={`p-1.5 rounded ${u.username === 'admin' ? 'text-slate-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`} 
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Tidak ada pengguna yang ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
