/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  PlusCircle, 
  Bell, 
  HelpCircle, 
  Tag, 
  Sliders, 
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Mail,
  Smartphone,
  Trash2,
  X,
  ShieldAlert,
  Moon,
  Sun
} from 'lucide-react';
import { Category, AppSettings } from '../types';

interface SettingsTabProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onDeleteAccount: () => void;
}

export default function SettingsTab({
  categories,
  onAddCategory,
  onDeleteCategory,
  settings,
  onUpdateSettings,
  onDeleteAccount
}: SettingsTabProps) {
  const [showAddCat, setShowAddCat] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatColor, setNewCatColor] = useState('bg-slate-500');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) {
      setErrorMsg('Nama kategori wajib diisi.');
      return;
    }
    const isDuplicate = categories.some(
      (c) => c.name.toLowerCase() === newCatName.toLowerCase() && c.type === newCatType
    );
    if (isDuplicate) {
      setErrorMsg('Kategori dengan nama dan tipe yang sama sudah terdaftar.');
      return;
    }

    onAddCategory({
      name: newCatName,
      type: newCatType,
      iconName: newCatType === 'income' ? 'PlusCircle' : 'ShoppingBag',
      color: newCatColor
    });

    setNewCatName('');
    setErrorMsg('');
    setShowAddCat(false);
  };

  const handleTogglePush = () => {
    onUpdateSettings({
      ...settings,
      pushNotifications: !settings.pushNotifications
    });
  };

  const handleUpdateWarningLimit = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({
      ...settings,
      budgetWarningLimit: parseInt(e.target.value) || 80
    });
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. Category Customization Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50/50 text-emerald-600 border border-emerald-500/10 rounded-xl">
              <Tag className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm">Kelola Kategori Keuangan</h3>
              <p className="text-[11px] text-slate-500">Sesuaikan label pengkategorian transaksi Anda.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAddCat(true);
              setErrorMsg('');
            }}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Tambah Kategori
          </button>
        </div>

        {/* Existing Categories List - Highly Minimalist Pills Stack */}
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/50 rounded-full hover:bg-slate-100/60 hover:border-slate-300 transition-all text-xs font-medium text-slate-700"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${cat.color}`} />
              <span className="truncate max-w-[120px]" title={cat.name}>{cat.name}</span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/40 px-1 py-0.2 rounded">
                {cat.type === 'income' ? 'Masuk' : 'Keluar'}
              </span>
              
              {/* Delete Category button */}
              <button
                onClick={() => onDeleteCategory(cat.id)}
                className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition cursor-pointer shrink-0"
                title="Hapus Kategori"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Notification Panel Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-500/10 rounded-xl">
            <Bell className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 text-sm">Notifikasi & Limit Peringatan</h3>
            <p className="text-[11px] text-slate-500">Sesuaikan bagaimana aplikasi memperingatkan kesehatan dompet Anda.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Pemberitahuan Seluler (Push)</span>
              <span className="text-[11px] text-slate-400">Terima pengingat jatuh tempo kartu kredit & over-limit langsung di HP Anda.</span>
            </div>
            <button
              onClick={handleTogglePush}
              className={`w-11 h-6 rounded-full transition-all duration-300 relative border cursor-pointer ${settings.pushNotifications ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-200 border-slate-300'}`}
            >
              <span className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs absolute top-0.5 transition-all duration-300 ${settings.pushNotifications ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Plafon Warning Anggaran (%)</span>
              <span className="text-[11px] text-slate-400">Pemberitahuan jika belanja anggota mencapai persentase batas limit.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={settings.budgetWarningLimit}
                onChange={handleUpdateWarningLimit}
                className="w-32 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 font-mono bg-slate-100 px-2 py-1 rounded-md">{settings.budgetWarningLimit}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tema & Tampilan Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-2 bg-slate-100 text-slate-800 border border-slate-500/10 rounded-xl">
            {settings.darkMode ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 text-sm">Tema & Tampilan</h3>
            <p className="text-[11px] text-slate-500">Sesuaikan tampilan aplikasi agar nyaman di mata.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Mode Gelap (Dark Mode)</span>
              <span className="text-[11px] text-slate-400">Gunakan latar belakang gelap untuk hemat baterai dan kenyamanan mata.</span>
            </div>
            <button
              onClick={() => {
                onUpdateSettings({
                  ...settings,
                  darkMode: !settings.darkMode
                });
              }}
              className={`w-11 h-6 rounded-full transition-all duration-300 relative border cursor-pointer ${settings.darkMode ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-200 border-slate-300'}`}
            >
              <span className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs absolute top-0.5 transition-all duration-300 ${settings.darkMode ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Help Center & FAQ Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-2 bg-amber-50 text-amber-600 border border-amber-500/10 rounded-xl">
            <HelpCircle className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 text-sm">Pusat Bantuan & Panduan</h3>
            <p className="text-[11px] text-slate-500">Informasi penggunaan aplikasi DompetKita.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
              <BookOpen className="w-4 h-4" /> Bagaimana Cara Menggunakan OCR Scanner?
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Masuk ke tab <strong>Dashboard</strong> atau klik <strong>"Belanja"</strong>, seret file foto struk belanjaan Anda ke area AI Scanner. AI akan mengekstrak otomatis dalam waktu singkat!
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" /> Apakah Data Keuangan Saya Aman?
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Sangat aman! Seluruh catatan transaksi, limit kartu kredit, dan profil Anda tersimpan secara lokal dan dienkripsi di peramban peranti Anda.
            </p>
          </div>

        </div>

        <div className="pt-2 border-t border-slate-100 text-center flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-slate-400" /> DompetKita Mobile App v1.0.4 - Stabil
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-slate-400" /> Layanan Bantuan: support@dompetkita.id
          </span>
        </div>
      </div>

      {/* 4. Danger Zone: Delete Account */}
      <div className="bg-red-50/40 border border-red-200/60 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-red-100 pb-3">
          <div className="p-2 bg-red-100 text-red-600 rounded-xl">
            <ShieldAlert className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-red-800 text-sm">Zona Bahaya (Danger Zone)</h3>
            <p className="text-[11px] text-red-600">Langkah pembersihan data sensitif secara permanen.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-800 block">Hapus Akun & Semua Data</span>
            <span className="text-[11px] text-slate-500 block max-w-xl">
              Tindakan ini akan menghapus akun profil Anda, seluruh daftar transaksi belanja, anggaran bulanan, sasaran tabungan, dan mengosongkan local storage peramban. Data tidak dapat dipulihkan kembali.
            </span>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
          >
            Hapus Akun
          </button>
        </div>
      </div>


      {/* --- POPUP MODAL: ADD CATEGORY --- */}
      <AnimatePresence>
        {showAddCat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCat(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                    <Tag className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-extrabold text-slate-800 text-sm">Tambah Kategori Baru</h3>
                </div>
                <button
                  onClick={() => setShowAddCat(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="p-5 space-y-4">
                {errorMsg && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-[11px] rounded-lg">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nama Kategori</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Contoh: Zakat, Investasi, Main Game"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipe Transaksi</label>
                  <select
                    value={newCatType}
                    onChange={(e: any) => setNewCatType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:border-emerald-500 focus:outline-hidden transition"
                  >
                    <option value="expense">Pengeluaran (Expense)</option>
                    <option value="income">Pemasukan (Income)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pilih Warna Label</label>
                  <div className="flex gap-2 flex-wrap pt-1.5">
                    {[
                      'bg-emerald-500',
                      'bg-blue-500',
                      'bg-rose-500',
                      'bg-amber-500',
                      'bg-violet-500',
                      'bg-indigo-500',
                      'bg-orange-500',
                      'bg-pink-500',
                      'bg-teal-500'
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        className={`w-6 h-6 rounded-full border transition-all ${color} ${newCatColor === color ? 'ring-2 ring-slate-950 border-white scale-110' : 'border-transparent hover:scale-105'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddCat(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-xl transition"
                  >
                    Simpan Kategori
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* --- POPUP MODAL: DELETE ACCOUNT CONFIRMATION --- */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-5 border-b border-red-100 flex items-center justify-between bg-red-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-extrabold text-red-800 text-sm">Hapus Semua Data Anda?</h3>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Apakah Anda benar-benar yakin ingin menghapus akun ini? Semua informasi transaksi, limit kartu kredit, dan data alokasi sasaran tabungan akan <strong className="text-red-600">terhapus selamanya</strong> dari peramban ini.
                </p>
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-[11px] text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Tindakan ini tidak dapat dibatalkan dan data tidak dapat dipulihkan kembali.</span>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteAccount();
                      setShowDeleteConfirm(false);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Ya, Hapus Akun Saya
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
