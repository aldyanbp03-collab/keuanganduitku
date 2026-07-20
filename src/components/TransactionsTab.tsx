/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Trash2, 
  FileSpreadsheet,
  Tag, 
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Filter,
  CreditCard,
  ChevronDown
} from 'lucide-react';
import { Transaction, Category } from '../types';

interface TransactionsTabProps {
  transactions: Transaction[];
  familyMembers: any[];
  categories: Category[];
  onDeleteTransaction: (id: string) => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

export default function TransactionsTab({
  transactions,
  categories,
  onDeleteTransaction,
  onSelectTransaction
}: TransactionsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // Collapsible filters to save space

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' ? true : tx.type === filterType;
    const matchesCategory = filterCategory === 'all' ? true : tx.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === 'amount-desc') {
      return b.amount - a.amount;
    } else {
      return a.amount - b.amount;
    }
  });

  // Calculations for filtered data
  const totalFilteredIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalFilteredExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netFilteredBalance = totalFilteredIncome - totalFilteredExpense;

  // Format IDR
  const formatIDR = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleExport = () => {
    setShowExportSuccess(true);
    setTimeout(() => {
      setShowExportSuccess(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 tracking-tight">
            Riwayat Pembukuan
          </h2>
          <p className="text-xs text-slate-500">
            Telusuri, lacak, dan ekspor seluruh catatan keluar-masuk dana Anda.
          </p>
        </div>
        
        {/* Export Button */}
        <div className="relative self-start md:self-auto">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> 
            <span>Ekspor CSV / Excel</span>
          </button>
          <AnimatePresence>
            {showExportSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute right-0 top-11 bg-slate-900 text-emerald-400 text-[10px] font-bold font-mono px-3 py-2 rounded-xl border border-emerald-500/20 whitespace-nowrap z-20 shadow-lg"
              >
                ✔ Laporan_DompetKita_Selesai.xlsx diunduh!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FILTER PANEL AND SEARCH */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-2xs space-y-3">
        
        {/* Row 1: Search and Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi berdasarkan nama atau catatan..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:border-indigo-500 focus:outline-hidden transition placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                showFilters 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-600 text-xs font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="date-desc">Terbaru</option>
              <option value="date-asc">Terlama</option>
              <option value="amount-desc">Nominal Tertinggi</option>
              <option value="amount-asc">Nominal Terendah</option>
            </select>
          </div>
        </div>

        {/* Collapsible Filters block */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-3 border-t border-slate-100"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-1">
                
                {/* Filter Type */}
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipe Arus Kas</span>
                  <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/50">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setFilterType('income')}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${filterType === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Masuk
                    </button>
                    <button
                      onClick={() => setFilterType('expense')}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${filterType === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Keluar
                    </button>
                  </div>
                </div>

                {/* Filter Category */}
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kategori</span>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-600 text-xs focus:outline-hidden transition"
                  >
                    <option value="all">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Reset Filters button */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                      setFilterCategory('all');
                      setSortBy('date-desc');
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-[10px] font-bold py-2 rounded-xl border border-slate-200 transition"
                  >
                    Atur Ulang Semua Filter
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* FILTER SUMMARY INSIGHT */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Pemasukan Terfilter</span>
          <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600 block mt-0.5">{formatIDR(totalFilteredIncome)}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Pengeluaran Terfilter</span>
          <span className="text-xs sm:text-sm font-bold font-mono text-rose-600 block mt-0.5">{formatIDR(totalFilteredExpense)}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Arus Kas Bersih</span>
          <span className={`text-xs sm:text-sm font-bold font-mono block mt-0.5 ${netFilteredBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            {netFilteredBalance >= 0 ? '+' : ''}{formatIDR(netFilteredBalance)}
          </span>
        </div>
      </div>

      {/* MINIMALIST TRANSACTIONS LIST */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-5 shadow-2xs">
        
        {/* Results Count Summary */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Menampilkan <strong className="text-slate-800">{sortedTransactions.length}</strong> dari total <strong className="text-slate-800">{transactions.length}</strong> transaksi
          </span>
        </div>

        {sortedTransactions.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center text-slate-400">
            <AlertCircle className="w-9 h-9 text-slate-300 stroke-1 mb-2.5" />
            <h4 className="font-display font-semibold text-slate-700 text-xs">Pencarian Tidak Ditemukan</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">Ganti kata kunci pencarian Anda atau kembalikan setelan filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/70 max-h-[580px] overflow-y-auto pr-1">
            {sortedTransactions.map((tx) => {
              const categoryObj = categories.find(c => c.name === tx.category);
              const isIncome = tx.type === 'income';
              
              return (
                <div 
                  key={tx.id} 
                  onClick={() => onSelectTransaction?.(tx)}
                  className="py-3 flex items-center justify-between group transition-all hover:bg-slate-50/85 px-3 rounded-xl cursor-pointer active:scale-[0.99]"
                  title="Klik untuk detail & ubah transaksi"
                >
                  
                  {/* Left Column: Icons and Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    
                    {/* Visual indicators */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isIncome 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/40' 
                        : 'bg-rose-50 text-rose-600 border border-rose-200/40'
                    }`}>
                      {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs sm:text-sm truncate leading-snug group-hover:text-emerald-700 transition-colors">{tx.title}</span>
                        {tx.note && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium max-w-[150px] truncate" title={tx.note}>
                            {tx.note}
                          </span>
                        )}
                      </div>
                      
                      {/* Meta information Row */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" /> {tx.date}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: categoryObj?.color ? undefined : '#64748b' }}>
                          <Tag className="w-2.5 h-2.5" /> {tx.category}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-slate-500">
                          {tx.paymentSource === 'Cash' || tx.paymentSource === 'Debit' ? tx.paymentSource : 'Kartu Kredit'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Amount & Delete Button */}
                  <div className="flex items-center gap-3.5 pl-2 shrink-0">
                    <div className="text-right">
                      <span className={`text-xs sm:text-sm font-bold font-mono tracking-tight ${
                        isIncome ? 'text-emerald-600' : 'text-slate-800'
                      }`}>
                        {isIncome ? '+' : '-'} {formatIDR(tx.amount)}
                      </span>
                      <span className="text-[9px] text-slate-400 block tracking-wider font-semibold uppercase mt-0.5">Selesai</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid triggering details modal when clicking delete
                        onDeleteTransaction(tx.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                      title="Hapus transaksi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
